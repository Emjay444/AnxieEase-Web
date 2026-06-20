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
  async completeSetup(
    email,
    password,
    existingSession = null,
    flowType = "account_creation"
  ) {
    try {
      console.log("🔧 Starting psychologist setup completion for:", email);
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

        if (!currentSession) {
          console.warn(
            "⚠️ No current session found; attempting token-based restore"
          );
          try {
            const storedAccess = localStorage.getItem("setupAccessToken");
            const storedRefresh = localStorage.getItem("setupRefreshToken");
            console.log("🔍 DEBUG: Stored tokens:", {
              hasAccess: !!storedAccess,
              hasRefresh: !!storedRefresh,
              accessLength: storedAccess?.length,
              refreshLength: storedRefresh?.length,
            });

            if (storedAccess && storedRefresh) {
              console.log(
                "🔄 Attempting session restore with stored tokens..."
              );
              const restore = await supabase.auth.setSession({
                access_token: storedAccess,
                refresh_token: storedRefresh,
              });
              console.log("🔍 DEBUG: Restore result:", {
                hasSession: !!restore?.data?.session,
                error: restore?.error?.message,
                userId: restore?.data?.session?.user?.id,
              });

              if (restore?.data?.session) {
                session = restore.data.session;
                console.log(
                  "✅ Session restored from stored tokens for:",
                  session.user.email
                );
              } else if (restore?.error) {
                console.error("❌ Session restore error:", restore.error);
                // Try to continue with the passed session if restore failed
                if (existingSession?.access_token) {
                  console.log("🔄 Fallback: Using passed session object");
                  session = existingSession;
                }
              }
            } else {
              console.log("❌ No stored tokens available for restore");
              // Try to use the passed session as fallback
              if (existingSession?.access_token) {
                console.log("🔄 Fallback: Using passed session object");
                session = existingSession;
              }
            }
          } catch (e) {
            console.error("❌ Token restore exception:", e?.message);
            // Try to use the passed session as final fallback
            if (existingSession?.access_token) {
              console.log("🔄 Final fallback: Using passed session object");
              session = existingSession;
            }
          }

          if (!session) {
            console.error("❌ Still no session after all restore attempts");
            throw new Error("Failed to set password: Auth session missing!");
          }
        } else {
          session = currentSession;
          console.log("✅ Found current session for:", session.user.email);
        }
      }

      // Update the user's password - ensure we have a fresh session first
      console.log("🔑 Setting password for user:", session.user.id);

      // Double-check session is active before password update
      if (session.access_token && session.refresh_token) {
        console.log("🔄 Ensuring session is active before password update...");
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("❌ Password update failed:", updateError);
        throw new Error(`Failed to set password: ${updateError.message}`);
      }
      console.log("✅ Password set successfully");

      // Activate the psychologist account (only for new account creation)
      if (flowType === "account_creation") {
        console.log("🏥 Activating psychologist account for:", email);
        // Ensure a psychologist row exists, updating if found, inserting if missing
        const { data: psychRow, error: fetchPsychErr } = await supabase
          .from("psychologists")
          .select("id, email, is_active, user_id")
          .ilike("email", email)
          .maybeSingle();

        if (fetchPsychErr) {
          console.warn(
            "⚠️ Failed to fetch psychologist row:",
            fetchPsychErr.message
          );
        }

        let activateError = null;
        if (psychRow) {
          const { error } = await supabase
            .from("psychologists")
            .update({
              is_active: true,
              user_id: session.user.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", psychRow.id);
          activateError = error || null;
        } else {
          // Insert a minimal row if it does not exist (RLS must allow current user)
          const { error } = await supabase.from("psychologists").insert([
            {
              email,
              user_id: session.user.id,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
          activateError = error || null;
        }

        if (activateError) {
          console.warn(
            "⚠️ Failed to activate psychologist account:",
            activateError
          );
          // Don't throw here as the password was already set successfully
        } else {
          console.log("✅ Psychologist account activated successfully");

          // Log the account activation activity
          try {
            const { adminService } = await import("./adminService");
            await adminService.logActivity(
              session.user.id,
              "Psychologist Account Activated",
              `Psychologist account activated for ${email}. Setup completed successfully.`
            );
          } catch (logError) {
            console.warn(
              "Failed to log psychologist activation activity:",
              logError.message
            );
          }
        }

        // Note: the users table is for patients only
        // Psychologists are stored in the psychologists table only

        // Best-effort: persist role in auth metadata too
        try {
          const { error: metaErr } = await supabase.auth.updateUser({
            data: { role: "psychologist" },
          });
          if (metaErr) {
            console.log("auth metadata update skipped:", metaErr.message);
          }
        } catch (e) {
          console.log("auth metadata update non-fatal error:", e?.message);
        }
      } else {
        console.log("🔄 Password reset flow - skipping account activation");
      }

      // Clear the setup session
      await supabase.auth.signOut();

      return {
        success: true,
        message:
          flowType === "password_reset"
            ? "Password reset completed successfully!"
            : "Account setup completed successfully!",
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
      localStorage.removeItem("setupEmail");
      localStorage.removeItem("setupPsychologistId");
      // Also clear any stored magic-link tokens and flags
      localStorage.removeItem("setupAccessToken");
      localStorage.removeItem("setupRefreshToken");
      localStorage.removeItem("setupExpiresAt");
      localStorage.removeItem("psychologistSetupSession");
      localStorage.removeItem("isInPsychologistSetupFlow");
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  },
};
