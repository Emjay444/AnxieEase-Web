import { supabase } from "./supabaseClient";

export const adminSetupService = {
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

  // Complete admin setup
  async completeSetup(email, password, existingSession = null) {
    try {
      console.log("🔧 Starting admin setup completion for:", email);
      let session = existingSession;

      // If no session provided, try to get current session
      if (!session) {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          throw new Error(
            `Session verification failed: ${sessionError.message}`
          );
        }

        session = currentSession;
      }

      if (!session || !session.user) {
        throw new Error(
          "No valid session found. Please try the setup link again."
        );
      }

      console.log("✅ Session verified for user:", session.user.email);

      // Verify this is a valid admin invitation
      if (
        !session.user.user_metadata?.invitation_pending ||
        session.user.user_metadata?.role !== "admin"
      ) {
        throw new Error(
          "Invalid admin invitation. Please contact the main administrator."
        );
      }

      console.log("✅ Valid admin invitation confirmed");

      // Update the user's password and metadata
      console.log("🔐 Setting password for admin user");
      const fullName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name;
      const { data: updateData, error: updateError } =
        await supabase.auth.updateUser({
          password: password,
          data: {
            role: "admin",
            full_name: fullName,
            setup_completed: true,
          },
        });

      if (updateError) {
        console.error("❌ Failed to update user:", updateError);
        throw new Error(`Failed to set password: ${updateError.message}`);
      }

      console.log("✅ Password set successfully");

      // Create the admin profile record directly
      console.log("🔗 Creating admin profile record");
      
      const { error: insertError } = await supabase
        .from("admin_profiles")
        .insert({
          id: session.user.id,
          email: email,
          full_name: fullName,
        });

      if (insertError) {
        console.error("❌ Failed to create admin profile:", insertError);
        throw new Error(`Failed to create admin profile: ${insertError.message}`);
      }

      console.log("✅ Admin profile created successfully");

      console.log("🎉 Admin setup completed successfully!");

      return {
        success: true,
        user: updateData.user,
        message: "Admin account setup completed successfully!",
      };
    } catch (error) {
      console.error("❌ Admin setup error:", error);
      throw error;
    }
  },

  // Check if admin profile exists
  async checkAdminProfile(email) {
    try {
      const { data: adminProfile, error } = await supabase
        .from("admin_profiles")
        .select("id, email, full_name")
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return { exists: false, profile: null };
        }
        throw error;
      }

      return { exists: true, profile: adminProfile };
    } catch (error) {
      console.error("Error checking admin profile:", error);
      throw error;
    }
  },
};
