import { supabase } from "./supabaseClient";
import { getFullName } from "../utils/helpers";

export const psychologistAuthService = {
  // This function would be called when a psychologist completes their account setup
  // after receiving an invitation from an admin
  async completeSignup(email, password, inviteCode) {
    try {
      // 1. Check if this psychologist exists in the database
      const { data: psychologist, error: fetchError } = await supabase
        .from("psychologists")
        .select("*")
        .eq("email", email)
        .single();

      if (fetchError) {
        console.error("Error fetching psychologist:", fetchError.message);
        throw new Error("Invalid email or invitation has expired");
      }

      if (!psychologist) {
        throw new Error("No invitation found for this email address");
      }

      // 2. Create the user account through normal signup
      const { data: signUpData, error: signupError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: getFullName(psychologist),
              role: "psychologist",
            },
          },
        });

      if (signupError) {
        console.error("Signup error:", signupError.message);
        throw signupError;
      }

      // Wait a short moment to ensure the auth user is fully created
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. Get the current session to ensure we have the correct user_id
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError.message);
        throw sessionError;
      }

      const userId = session?.user?.id || signUpData?.user?.id;

      if (!userId) {
        throw new Error("Failed to get user ID after signup");
      }

      // 4. Update the psychologist record with the user_id
      const { error: updateError } = await supabase
        .from("psychologists")
        .update({ user_id: userId })
        .eq("email", email);

      if (updateError) {
        console.error("Update error:", updateError.message);
        // If update fails, try one more time after a short delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { error: retryError } = await supabase
          .from("psychologists")
          .update({ user_id: userId })
          .eq("email", email);

        if (retryError) {
          throw retryError;
        }
      }

      return {
        success: true,
        message: "Account setup completed successfully",
      };
    } catch (error) {
      console.error("Complete signup error:", error.message);
      throw error;
    }
  },
};
