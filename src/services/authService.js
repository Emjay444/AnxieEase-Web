import { supabase } from "./supabaseClient";

// Track login attempts
const loginAttempts = {};
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export const authService = {
  // Sign in with email and password
  async signIn(email, password) {
    // Check if user is locked out
    if (this.isLockedOut(email)) {
      throw new Error("Account is temporarily locked. Please try again later.");
    }

    try {
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.recordFailedAttempt(email);
        throw error;
      }

      // Reset login attempts on successful login
      this.resetLoginAttempts(email);

      // Get user role from metadata or from the database
      const role =
        data.user?.user_metadata?.role ||
        (await this.getUserRole(data.user.id));

      // If this is a psychologist, update their user_id
      if (role === "psychologist") {
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

  // Get user role (psychologist or admin)
  async getUserRole(userId) {
    try {
      if (!userId) return null;

      console.log("Getting role for user ID:", userId);

      // First, check user metadata for explicit role
      const { data: userData } = await supabase.auth.getUser();
      const metaRole = userData?.user?.user_metadata?.role;

      console.log("User metadata role:", metaRole);

      // Prefer explicit role from metadata first, and short-circuit admin
      if (metaRole === "admin") return "admin";
      if (metaRole === "psychologist") return "psychologist";
      if (metaRole) return metaRole;

      // If no metadata role, check if user exists in psychologists table
      console.log("Checking psychologists table for user:", userId);
      const { data: psychologist, error } = await supabase
        .from("psychologists")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.log("Psychologist lookup error:", error.message);
        // If it's a "not found" error, we cannot conclude admin; return null
        return null;
      }

      // If found in psychologists table, they're a psychologist
      if (psychologist) {
        console.log("User found in psychologists table");
        return "psychologist";
      }

  // Default fallback: unknown
  console.log("No role found in metadata or psychologists table");
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
      };
    }

    loginAttempts[email].count += 1;

    if (loginAttempts[email].count >= MAX_LOGIN_ATTEMPTS) {
      loginAttempts[email].lockoutTime = Date.now() + LOCKOUT_DURATION;
    }
  },

  // Reset login attempts
  resetLoginAttempts(email) {
    if (loginAttempts[email]) {
      loginAttempts[email].count = 0;
      loginAttempts[email].lockoutTime = null;
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
