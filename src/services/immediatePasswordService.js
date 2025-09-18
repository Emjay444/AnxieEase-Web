import { supabase } from "./supabaseClient";
import { directPasswordService } from "./directPasswordService";

export const immediatePasswordService = {
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
