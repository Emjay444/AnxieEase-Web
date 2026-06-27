import { supabase } from "./supabaseClient";
import { getAppUrl } from "../utils/helpers";

// Track login attempts - load from localStorage if available
const getLoginAttempts = () => {
  try {
    const stored = localStorage.getItem("loginAttempts");
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error loading login attempts:", error);
    return {};
  }
};

const saveLoginAttempts = (attempts) => {
  try {
    localStorage.setItem("loginAttempts", JSON.stringify(attempts));
  } catch (error) {
    console.error("Error saving login attempts:", error);
  }
};

let loginAttempts = getLoginAttempts();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATIONS = [
  30 * 1000, // 1st lockout: 30 seconds
  60 * 1000, // 2nd lockout: 1 minute
  5 * 60 * 1000, // 3rd lockout: 5 minutes
  15 * 60 * 1000, // 4th lockout: 15 minutes
  30 * 60 * 1000, // 5th+ lockout: 30 minutes
];
const WARNING_THRESHOLD = 2; // Show warnings starting from 2nd attempt (when 3 attempts remaining)

export const authService = {
  // Sign in with email and password
  async signIn(email, password) {
    // Check if user is locked out
    const lockoutInfo = this.getLockoutInfo(email);
    if (lockoutInfo && lockoutInfo.isLocked) {
      const error = new Error(
        `Account is temporarily locked. Please wait ${lockoutInfo.durationText} before trying again.`
      );
      error.lockoutInfo = lockoutInfo;
      throw error;
    }

    try {
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if already locked out before recording attempt
        const existingLockout = this.getLockoutInfo(email);
        if (existingLockout) {
          const enhancedError = new Error(
            `Account locked. Too many failed attempts.`
          );
          enhancedError.lockoutInfo = existingLockout;
          enhancedError.originalError = error;
          throw enhancedError;
        }

        this.recordFailedAttempt(email);
        const remainingAttempts = this.getRemainingAttempts(email);
        const currentAttempts = this.getAttemptCount(email);

        if (remainingAttempts === 0) {
          // Account just got locked
          const newLockoutInfo = this.getLockoutInfo(email);
          const lockoutMessage = `Account locked. Too many failed attempts.`;

          const enhancedError = new Error(lockoutMessage);
          enhancedError.lockoutInfo = newLockoutInfo;
          enhancedError.originalError = error;
          throw enhancedError;
        } else {
          // Progressive error messages
          let message;
          if (currentAttempts === 1) {
            message = "Try again, wrong credentials";
          } else {
            message = `Wrong credentials. ${remainingAttempts} attempts remaining`;
          }

          const enhancedError = new Error(message);
          enhancedError.remainingAttempts = remainingAttempts;
          enhancedError.originalError = error;
          throw enhancedError;
        }
      }

      // Reset login attempts on successful login (but keep lockout level)
      this.resetLoginAttempts(email);

      // Check if this user is a deactivated psychologist
      const { data: psychologist, error: psychError } = await supabase
        .from("psychologists")
        .select("id, is_active")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (psychologist && psychologist.is_active === false) {
        // Sign out the user immediately
        await supabase.auth.signOut();
        throw new Error(
          "Your account has been deactivated. Please contact the administrator."
        );
      }

      // Get user role: admin (via metadata or admin_profiles) takes priority,
      // then an active row in the psychologists table, then other metadata.
      // This priority order must match authService.getUserRole exactly -
      // otherwise a dual-access account (admin + active psychologist row)
      // could resolve to a different role here than the auth-state-change
      // listener resolves, depending on which one happens to finish last.
      const metaRole = data.user?.user_metadata?.role;
      const isAdmin =
        metaRole === "admin" || (await this.isGrantedAdmin(data.user.id));
      const role = isAdmin
        ? "admin"
        : psychologist?.is_active
        ? "psychologist"
        : metaRole || null;

      // Check if this user is a patient - patients cannot sign in
      if (role === "patient") {
        // Sign out the user immediately
        await supabase.auth.signOut();
        throw new Error("Invalid login credentials");
      }

      // Additional check in users table if no role found
      if (!role) {
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from("users")
            .select("role")
            .eq("email", email)
            .single();

          if (!profileError && userProfile && userProfile.role === "patient") {
            // Sign out the user immediately
            await supabase.auth.signOut();
            throw new Error("Invalid login credentials");
          }
        } catch (profileCheckError) {
          // If it's our custom error message, re-throw it
          if (profileCheckError.message.includes("Invalid login credentials")) {
            throw profileCheckError;
          }
          // Otherwise, continue with normal flow
          console.log(
            "Could not check user profile for patient role:",
            profileCheckError.message
          );
        }
      }

      // If this account has a psychologists row (psychologist-only or
      // dual-access admin+psychologist), keep their user_id fresh
      if (psychologist) {
        try {
          const { error: updateError } = await supabase
            .from("psychologists")
            .update({ user_id: data.user.id })
            .eq("email", email);

          if (updateError) {
            console.error(
              "Failed to update psychologist user_id:",
              updateError
            );
          }
        } catch (updateError) {
          console.error("Error updating psychologist user_id:", updateError);
        }
      }

      return {
        user: data.user,
        role: role,
      };
    } catch (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  },

  // Send password reset OTP via Supabase
  async requestPasswordReset(email) {
    try {
      // Use resetPasswordForEmail which sends an OTP for password recovery
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/new-password`,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Password reset OTP error:", error.message);
      throw error;
    }
  },

  // Verify OTP for password reset
  async verifyPasswordResetOtp(email, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("OTP verification error:", error.message);
      throw error;
    }
  },

  // Update password after OTP verification
  async updatePasswordAfterVerification(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Password update error:", error.message);
      throw error;
    }
  },

  // Verify OTP and reset password (legacy method - keeping for backward compatibility)
  async verifyOtpAndResetPassword(email, token, newPassword) {
    try {
      // First verify the OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });

      if (verifyError) throw verifyError;

      // Now update the password
      const { data: updateData, error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) throw updateError;

      return updateData;
    } catch (error) {
      console.error(
        "OTP verification and password reset error:",
        error.message
      );
      throw error;
    }
  },

  // Update password when in recovery session
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Update password error:", error.message);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Logout error:", error.message);
      throw error;
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { data, error };
    } catch (error) {
      console.error("Get session error:", error.message);
      return { data: null, error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch (error) {
      console.error("Get current user error:", error.message);
      return null;
    }
  },

  // Check independently whether this user has an active row in the
  // psychologists table. Kept separate from getUserRole so callers can
  // detect psychologist access even for an account whose primary role
  // resolves to "admin" (dual-access accounts).
  async isActivePsychologist(userId) {
    if (!userId) return false;
    const { data, error } = await supabase
      .from("psychologists")
      .select("is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return false;
    return !!data.is_active;
  },

  // Check independently whether this user has been granted admin access via
  // a row in admin_profiles. This is necessary in addition to trusting
  // user_metadata.role === "admin": granting access to an *existing* user
  // (e.g. a psychologist being promoted) can only write to admin_profiles -
  // Supabase only applies signInWithOtp's metadata payload when creating a
  // brand-new auth user, so an existing account's metadata can't be updated
  // this way.
  async isGrantedAdmin(userId) {
    if (!userId) return false;
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  },

  // Get user role (psychologist or admin)
  async getUserRole(userId) {
    try {
      if (!userId) return null;

      console.log("Getting role for user ID:", userId);

      // First, check user metadata for explicit role
      const { data: userData } = await supabase.auth.getUser();
      const metaRole = userData?.user?.user_metadata?.role;

      console.log("User metadata role:", metaRole);

      // Admin role is granted either via auth metadata (set at account
      // creation for brand-new admin invites) or via a row in admin_profiles
      // (used when promoting an existing account, e.g. a psychologist).
      if (metaRole === "admin" || (await this.isGrantedAdmin(userId))) {
        return "admin";
      }
      // ignore other metadata roles here; fall through to DB check

      // If no metadata role, check if user exists in psychologists table
      console.log("Checking psychologists table for user:", userId);
      const isPsychologist = await this.isActivePsychologist(userId);

      if (isPsychologist) {
        console.log("User found in psychologists table, is_active: true");
        return "psychologist";
      }

      // Default fallback: unknown (not found, or found but inactive)
      console.log("No role found in metadata or active psychologists table");
      return null;
    } catch (error) {
      console.error("Get user role error:", error.message);
      return null;
    }
  },

  // Create new psychologist (admin only)
  async createPsychologist(email, password, name, role = "psychologist") {
    try {
      // Check if email already exists
      const { data: existingUsers } = await supabase
        .from("psychologists")
        .select("email")
        .eq("email", email);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("Email already exists");
      }

      // Create user in auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role,
          },
        });

      if (authError) throw authError;

      // Add user to psychologists table
      const { error: profileError } = await supabase
        .from("psychologists")
        .insert([
          {
            id: authData.user.id,
            user_id: authData.user.id,
            name,
            email,
            is_active: true,
          },
        ]);

      if (profileError) throw profileError;

      return authData.user;
    } catch (error) {
      console.error("Create psychologist error:", error.message);
      throw error;
    }
  },

  // Create new admin invitation (admin only)
  async createAdmin(email, fullName) {
    try {
      // Send the invitation email
      const emailResult = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getAppUrl()}/admin-setup?email=${encodeURIComponent(email)}`,
          data: {
            role: "admin",
            flow: "admin_invite",
            full_name: fullName,
            invitation_pending: true,
          },
        },
      });

      // Check if email sending was successful
      if (emailResult.error) {
        console.warn("Failed to send setup email:", emailResult.error);
        throw new Error(
          "Failed to send invitation email: " + emailResult.error.message
        );
      }

      console.log("✅ Admin invitation sent successfully");

      return {
        email,
        full_name: fullName,
        message: "Admin invitation sent successfully",
      };
    } catch (error) {
      console.error("Create admin error:", error.message);
      throw error;
    }
  },

  // Disable psychologist account (admin only)
  async disablePsychologist(userId) {
    try {
      const { error } = await supabase
        .from("psychologists")
        .update({ is_active: false })
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Disable psychologist error:", error.message);
      throw error;
    }
  },

  // Track failed login attempts
  recordFailedAttempt(email) {
    if (!loginAttempts[email]) {
      loginAttempts[email] = {
        count: 0,
        lockoutTime: null,
        lockoutLevel: 0, // Track how many times they've been locked out
      };
    }

    loginAttempts[email].count += 1;

    if (loginAttempts[email].count >= MAX_LOGIN_ATTEMPTS) {
      // Determine lockout duration based on lockout level
      const lockoutIndex = Math.min(
        loginAttempts[email].lockoutLevel,
        LOCKOUT_DURATIONS.length - 1
      );
      const lockoutDuration = LOCKOUT_DURATIONS[lockoutIndex];

      loginAttempts[email].lockoutTime = Date.now() + lockoutDuration;
      loginAttempts[email].lockoutLevel += 1; // Increase lockout level for next time
      loginAttempts[email].count = 0; // Reset attempt count for next lockout cycle
    }

    // Save to localStorage
    saveLoginAttempts(loginAttempts);
  },

  // Get remaining login attempts
  getRemainingAttempts(email) {
    if (!loginAttempts[email]) {
      return MAX_LOGIN_ATTEMPTS;
    }

    // If currently locked out, return 0
    const lockoutInfo = this.getLockoutInfo(email);
    if (lockoutInfo && lockoutInfo.isLocked) {
      return 0;
    }

    return Math.max(0, MAX_LOGIN_ATTEMPTS - loginAttempts[email].count);
  },

  // Get current attempt count
  getAttemptCount(email) {
    if (!loginAttempts[email]) {
      return 0;
    }
    return loginAttempts[email].count;
  },

  // Get lockout info with remaining time
  getLockoutInfo(email) {
    if (!loginAttempts[email] || !loginAttempts[email].lockoutTime) {
      return null;
    }

    const now = Date.now();
    const lockoutEnd = loginAttempts[email].lockoutTime;

    if (now >= lockoutEnd) {
      // Lockout period has passed, but keep lockout level for progressive penalties
      loginAttempts[email].lockoutTime = null;

      // Save updated state to localStorage
      saveLoginAttempts(loginAttempts);
      return null;
    }

    const remainingMs = lockoutEnd - now;
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    // Format duration text based on remaining time
    let durationText;
    if (remainingMs < 60 * 1000) {
      durationText = `${remainingSeconds} second${
        remainingSeconds !== 1 ? "s" : ""
      }`;
    } else {
      const mins = Math.floor(remainingMs / (60 * 1000));
      const secs = Math.ceil((remainingMs % (60 * 1000)) / 1000);
      if (secs === 60) {
        durationText = `${mins + 1} minute${mins + 1 !== 1 ? "s" : ""}`;
      } else if (secs === 0) {
        durationText = `${mins} minute${mins !== 1 ? "s" : ""}`;
      } else {
        durationText = `${mins} minute${
          mins !== 1 ? "s" : ""
        } and ${secs} second${secs !== 1 ? "s" : ""}`;
      }
    }

    return {
      isLocked: true,
      remainingMs,
      remainingSeconds,
      remainingMinutes,
      lockoutEnd,
      lockoutLevel: loginAttempts[email].lockoutLevel,
      durationText,
    };
  },

  // Reset login attempts (preserve lockout level for progressive penalties)
  resetLoginAttempts(email) {
    if (loginAttempts[email]) {
      loginAttempts[email].count = 0;
      loginAttempts[email].lockoutTime = null;
      // Keep lockout level for progressive penalties unless manually cleared

      // Save to localStorage
      saveLoginAttempts(loginAttempts);
    }
  },

  // Clear account lockout completely (for admin use or after extended period)
  clearAccountLockout(email) {
    if (loginAttempts[email]) {
      loginAttempts[email].count = 0;
      loginAttempts[email].lockoutTime = null;
      loginAttempts[email].lockoutLevel = 0; // Reset lockout level completely

      // Save to localStorage
      saveLoginAttempts(loginAttempts);
    }
    return true;
  },

  // Get next lockout duration preview
  getNextLockoutDuration(email) {
    if (!loginAttempts[email]) {
      return LOCKOUT_DURATIONS[0];
    }
    const nextIndex = Math.min(
      loginAttempts[email].lockoutLevel,
      LOCKOUT_DURATIONS.length - 1
    );
    return LOCKOUT_DURATIONS[nextIndex];
  },

  // Check if user should see warning (when 3 attempts remaining)
  shouldShowWarning(email) {
    if (!loginAttempts[email]) {
      return false;
    }
    return loginAttempts[email].count >= WARNING_THRESHOLD;
  },

  // Format duration for display
  formatDuration(milliseconds) {
    if (milliseconds < 60 * 1000) {
      const seconds = Math.ceil(milliseconds / 1000);
      return `${seconds} second${seconds !== 1 ? "s" : ""}`;
    } else {
      const minutes = Math.ceil(milliseconds / (60 * 1000));
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
  },

  // Check if user is locked out
  isLockedOut(email) {
    if (!loginAttempts[email] || !loginAttempts[email].lockoutTime) {
      return false;
    }

    if (Date.now() < loginAttempts[email].lockoutTime) {
      return true;
    }

    // Reset if lockout period has passed
    this.resetLoginAttempts(email);
    return false;
  },
};
