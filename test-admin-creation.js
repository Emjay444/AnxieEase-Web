// Test script to create an admin user in Supabase
import { createClient } from "@supabase/supabase-js";

// Use the specific project URL and anon key
const supabaseUrl = "https://gqsustjxzjzfntcsnvpk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxc3VzdGp4emp6Zm50Y3NudnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDg4NTgsImV4cCI6MjA1Njc4NDg1OH0.RCS_0fSVYnYVY2qr0Ow1__vBC4WRaVg_2SDatKREVHA";

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    console.log("Testing Supabase connection...");

    // Test connection
    const { data: testData, error: testError } = await supabase.auth.getUser();
    if (testError) {
      console.error("Connection error:", testError.message);
      return;
    }

    console.log("Connection successful!");

    // Now follow the admin creation process:
    console.log("Please follow these steps to create an admin user:");
    console.log("1. Go to your Supabase dashboard at https://app.supabase.com");
    console.log("2. Select your project 'gqsustjxzjzfntcsnvpk'");
    console.log("3. Navigate to 'Authentication' → 'Users'");
    console.log("4. Click 'Add User'");
    console.log("5. Enter the email and password for your admin user");
    console.log("6. Click 'Save'");
    console.log(
      "7. Once the user is created, go to the SQL Editor in your Supabase dashboard"
    );
    console.log(
      "8. Run the following SQL query (replace with your admin email):"
    );
    console.log(`
      UPDATE auth.users
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"admin"'
      )
      WHERE email = 'your_admin_email@example.com';
    `);
    console.log(
      "9. After running this query, you can log in to your application with these admin credentials"
    );
  } catch (error) {
    console.error("Error:", error.message);
  }
}

createAdminUser();
