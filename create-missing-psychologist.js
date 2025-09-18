// Manual psychologist creation script
import { supabase } from "./src/services/supabaseClient.js";
import { randomUUID } from "crypto";

async function createMissingPsychologist() {
  const email = "molinafam235@gmail.com";
  const psychologistId = randomUUID(); // Generate a new UUID

  console.log("🔧 Creating missing psychologist record for:", email);
  console.log("🆔 Generated ID:", psychologistId);

  // Extract name from the user metadata that was in the magic link
  const name = "Jamie Lou Sabeniano Mapalad"; // From the JWT token in the logs
  const [first_name, ...rest] = name.split(" ");
  const last_name = rest.pop() || "";
  const middle_name = rest.join(" ") || null;

  console.log("📝 Name parts:", { first_name, middle_name, last_name });

  try {
    // Create the psychologist record
    const { data, error } = await supabase
      .from("psychologists")
      .insert([
        {
          id: psychologistId,
          email: email,
          first_name: first_name,
          middle_name: middle_name,
          last_name: last_name,
          user_id: null, // Will be updated when they complete setup
          is_active: false, // Inactive until setup is complete
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("❌ Error creating psychologist:", error);
      return;
    }

    console.log("✅ Successfully created psychologist:", data[0]);

    // Verify the record was created
    const { data: verification, error: verifyError } = await supabase
      .from("psychologists")
      .select("*")
      .eq("email", email);

    if (verifyError) {
      console.error("❌ Error verifying psychologist:", verifyError);
    } else {
      console.log("🔍 Verification - psychologist records:", verification);
    }
  } catch (error) {
    console.error("❌ Exception creating psychologist:", error);
  }
}

createMissingPsychologist().catch(console.error);
