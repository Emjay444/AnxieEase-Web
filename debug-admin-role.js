// Quick debug script to check and fix admin user role
// Run this in the browser console when logged in as admin

(async function debugAdminRole() {
  console.log("=== ADMIN ROLE DEBUG ===");

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await window.supabase.auth.getUser();

  if (userError) {
    console.error("Error getting user:", userError);
    return;
  }

  if (!user) {
    console.log("No user logged in");
    return;
  }

  console.log("Current user:", user.email);
  console.log("User metadata:", user.user_metadata);
  console.log("Current role in metadata:", user.user_metadata?.role);

  // Check what authService.getUserRole returns
  try {
    const role = await window.authService.getUserRole(user.id);
    console.log("AuthService getUserRole returns:", role);
  } catch (error) {
    console.error("Error getting role:", error);
  }

  console.log("=== END DEBUG ===");
})();

// Function to fix admin role (run this if role is not "admin")
async function fixAdminRole() {
  console.log("Fixing admin role...");

  const { data, error } = await window.supabase.auth.updateUser({
    data: { role: "admin" },
  });

  if (error) {
    console.error("Error updating user metadata:", error);
  } else {
    console.log("Admin role updated successfully:", data);
    console.log("Please refresh the page");
  }
}

console.log(
  "Debug functions loaded. Run debugAdminRole() to check current role, or fixAdminRole() to fix it."
);
