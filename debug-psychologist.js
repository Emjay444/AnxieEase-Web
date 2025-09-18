// Debug script to check psychologist record
import { supabase } from "./src/services/supabaseClient.js";

async function debugPsychologist() {
  const email = "molinafam235@gmail.com";
  const userId = "5f425e07-522d-4feb-8839-35a0d1a7687a";

  console.log("🔍 Checking psychologist record for:", email);

  // Check psychologists table
  const { data: psychologists, error: psychError } = await supabase
    .from("psychologists")
    .select("*")
    .eq("email", email);

  if (psychError) {
    console.error("❌ Error querying psychologists:", psychError);
  } else {
    console.log("📋 Psychologist records:", psychologists);
  }

  // Check all psychologists to see if there's a similar email
  const { data: allPsychs, error: allError } = await supabase
    .from("psychologists")
    .select("id, email, first_name, last_name, user_id, is_active")
    .order("created_at", { ascending: false })
    .limit(10);

  if (allError) {
    console.error("❌ Error querying all psychologists:", allError);
  } else {
    console.log("📋 Recent psychologist records:", allPsychs);
  }

  // Check by user_id
  const { data: psychByUserId, error: userIdError } = await supabase
    .from("psychologists")
    .select("*")
    .eq("user_id", userId);

  if (userIdError) {
    console.error("❌ Error querying by user_id:", userIdError);
  } else {
    console.log("🆔 Psychologist by user_id:", psychByUserId);
  }

  // Check auth user
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("❌ Error getting auth user:", userError);
    } else {
      console.log("👤 Auth user:", userData.user);
    }
  } catch (e) {
    console.log("👤 No active session");
  }
}

debugPsychologist().catch(console.error);
