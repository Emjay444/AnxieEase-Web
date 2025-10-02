import { supabase } from "./supabaseClient";
import { directPasswordService } from "./directPasswordService";

export const immediatePasswordService = {
  /**
   * Send OTP for password change verification
   * This initiates the OTP-based password change flow
   */
  async sendPasswordChangeOTP(userEmail) {
    try {
      console.log("🔐 Sending password change OTP to:", userEmail);

      // Send OTP using Supabase's password reset functionality
      // This will send an OTP to the user's email
      const { data, error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/admin/change-password-otp`,
      });

      if (error) {
        console.error("❌ Failed to send OTP:", error);
        throw new Error(`Failed to send OTP: ${error.message}`);
      }

      console.log("✅ Password change OTP sent successfully");
      
      // Store temporary flag for OTP flow
      localStorage.setItem("otpPasswordChangeInitiated", "true");
      localStorage.setItem("otpPasswordChangeEmail", userEmail);
      
      return { success: true, message: "OTP sent to your email address" };
    } catch (error) {
      console.error("❌ Password change OTP error:", error);
      throw error;
    }
  },

  /**
   * Verify OTP and update password with OTP validation
   * This completes the OTP-based password change flow
   */
  async updatePasswordWithOTP(email, otp, newPassword, currentPassword) {
    try {
      console.log("🔐 Verifying OTP and updating password for:", email);

      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Verify the OTP
      const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "recovery",
      });

      if (otpError) {
        console.error("❌ OTP verification failed:", otpError);
        throw new Error("Invalid OTP. Please check your email and try again.");
      }

      console.log("✅ OTP verified successfully");

      // Update the password using the verified session
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) {
        console.error("❌ Password update failed:", passwordError);
        throw new Error(`Failed to update password: ${passwordError.message}`);
      }

      console.log("✅ Password updated successfully with OTP verification");

      // Clear OTP flow flags
      this.clearOTPPasswordChangeFlags();
      
      // Store success flag
      localStorage.setItem("passwordUpdated", "true");
      localStorage.setItem("passwordUpdatedFor", email);

      return { success: true, message: "Password updated successfully" };
    } catch (error) {
      console.error("❌ OTP password update failed:", error);
      throw error;
    }
  },

  /**
   * Update password immediately using the current active session
   * This must be called while the session is still active
   */
  async updatePasswordImmediately(password, userEmail) {
    try {
      console.log("🔑 Updating password immediately for:", userEmail);

      // Get the current active session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session) {
        throw new Error("No active session found");
      }

      // Try direct API approach first
      try {
        await directPasswordService.updatePasswordDirectly(
          password,
          session.access_token,
          session.refresh_token
        );
        console.log("✅ Password updated immediately via direct API");
      } catch (directError) {
        console.warn(
          "⚠️ Direct API failed, trying Supabase client:",
          directError.message
        );

        // Fallback to Supabase client
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          console.error("❌ Password update failed:", error);
          throw new Error(`Failed to update password: ${error.message}`);
        }

        console.log("✅ Password updated immediately via Supabase client");
      }

      // Store a flag to indicate password was updated
      localStorage.setItem("passwordUpdated", "true");
      localStorage.setItem("passwordUpdatedFor", userEmail);

      return { success: true };
    } catch (error) {
      console.error("❌ Immediate password update failed:", error);
      throw error;
    }
  },

  /**
   * Check if OTP password change flow was initiated
   */
  isOTPPasswordChangeInitiated(userEmail) {
    const initiated = localStorage.getItem("otpPasswordChangeInitiated");
    const initiatedFor = localStorage.getItem("otpPasswordChangeEmail");
    return initiated === "true" && initiatedFor === userEmail;
  },

  /**
   * Clear OTP password change flags
   */
  clearOTPPasswordChangeFlags() {
    localStorage.removeItem("otpPasswordChangeInitiated");
    localStorage.removeItem("otpPasswordChangeEmail");
  },

  /**
   * Check if password was already updated for this email
   */
  isPasswordUpdated(userEmail) {
    const updated = localStorage.getItem("passwordUpdated");
    const updatedFor = localStorage.getItem("passwordUpdatedFor");
    return updated === "true" && updatedFor === userEmail;
  },

  /**
   * Clear the password updated flag
   */
  clearPasswordUpdatedFlag() {
    localStorage.removeItem("passwordUpdated");
    localStorage.removeItem("passwordUpdatedFor");
  },
};
