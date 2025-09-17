import { supabase } from "./supabaseClient";

export const psychologistSetupService = {
  // Verify magic link and get session
  async verifyMagicLink() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(`Session verification failed: ${sessionError.message}`);
      }

      return {
        session,
        email: session?.user?.email,
        userId: session?.user?.id,
        metadata: session?.user?.user_metadata || {},
      };
    } catch (error) {
      console.error("Magic link verification error:", error);
      throw error;
    }
  },

  // Complete psychologist setup
  async completeSetup(email, password, existingSession = null) {
    try {
      let session = existingSession;
      
      // If no session provided, try to get current session
      if (!session) {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !currentSession) {
          throw new Error("No valid session found. Please use the setup link from your email.");
        }
        
        session = currentSession;
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(`Failed to set password: ${updateError.message}`);
      }

      // Activate the psychologist account
      const { error: activateError } = await supabase
        .from("psychologists")
        .update({ 
          is_active: true,
          user_id: session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq("email", email);

      if (activateError) {
        console.warn("Failed to activate psychologist account:", activateError);
        // Don't throw here as the password was already set successfully
      } else {
        // Log the account activation activity
        try {
          const { adminService } = await import("./adminService");
          await adminService.logActivity(
            session.user.id,
            "Psychologist Account Activated",
            `Psychologist account activated for ${email}. Setup completed successfully.`
          );
        } catch (logError) {
          console.warn("Failed to log psychologist activation activity:", logError.message);
        }
      }

      // Clear the setup session
  await supabase.auth.signOut();

      return {
        success: true,
        message: "Account setup completed successfully!",
      };
    } catch (error) {
      console.error("Setup completion error:", error);
      throw error;
    }
  },

  // Get psychologist data by email (for setup verification)
  async getPsychologistByEmail(email) {
    try {
      const { data, error } = await supabase
        .from("psychologists")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        throw new Error(`Failed to get psychologist data: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Get psychologist error:", error);
      throw error;
    }
  },

  // Clean up setup session
  async cleanupSetupSession() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('setupEmail');
      localStorage.removeItem('setupPsychologistId');
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
};