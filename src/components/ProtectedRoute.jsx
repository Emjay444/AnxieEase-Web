import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ requireAdmin = false }) {
  const { user, loading, userRole } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [checkingUnknown, setCheckingUnknown] = useState(false);
  const [adminWaitExpired, setAdminWaitExpired] = useState(false);

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log("� ProtectedRoute state:", {
      loading,
      signingOut,
      checkingUnknown,
      user: user ? { id: user.id, email: user.email } : null,
      userRole,
      requireAdmin,
      adminWaitExpired,
    });
  }, [
    loading,
    signingOut,
    checkingUnknown,
    user,
    userRole,
    requireAdmin,
    adminWaitExpired,
  ]);

  // Grace period to avoid misrouting real admins while role is resolving
  useEffect(() => {
    if (requireAdmin && user && !userRole && !loading) {
      setAdminWaitExpired(false);
      const t = setTimeout(() => setAdminWaitExpired(true), 2000);
      return () => clearTimeout(t);
    }
  }, [requireAdmin, user, userRole, loading]);

  // If a session exists but we couldn't resolve a role, check if this user
  // is an INACTIVE psychologist. If yes, sign out (restore prior behavior
  // for magic-link on same device). If no (e.g., admin/active psych), do nothing
  // and let role resolution complete without logging out across tabs.
  //
  // EXCEPTION: Don't sign out if user is in psychologist setup flow
  useEffect(() => {
    // Use a timeout to avoid checking too frequently and give auth time to resolve
    const timer = setTimeout(async () => {
      // Only act when loading is finished and we have a user with unknown role
      // Give extra time for role resolution before checking
      if (!loading && user && (userRole === null || userRole === undefined)) {
        // Don't interfere with psychologist setup process
        const currentPath = window.location.pathname;
        const currentUrl = window.location.href;
        const isInSetupFlow =
          currentPath.includes("/psychologist-setup") ||
          currentUrl.includes("source=admin_invite") ||
          currentUrl.includes("setup=true") ||
          localStorage.getItem("isInPsychologistSetupFlow") === "true";

        if (isInSetupFlow) {
          console.log(
            "User is in psychologist setup flow, skipping auto-signout check"
          );
          return;
        }

        try {
          setCheckingUnknown(true);
          const { data: psychologist, error } = await supabase
            .from("psychologists")
            .select("is_active")
            .eq("user_id", user.id)
            .maybeSingle();

          // If this user is an inactive psychologist, sign out (block access)
          if (psychologist && psychologist.is_active === false) {
            console.log("Inactive psychologist detected, signing out");
            setSigningOut(true);
            await supabase.auth.signOut();
          }
          // Else: do nothing; allow role to resolve (admin or active psych)
        } catch (error) {
          console.error("Error checking psychologist status:", error);
        } finally {
          setCheckingUnknown(false);
          setSigningOut(false);
        }
      }
    }, 1000); // Give 1 second for role resolution before checking

    return () => clearTimeout(timer);
  }, [loading, user, userRole]);

  // Show loading state while checking authentication or signing out
  if (loading || signingOut || checkingUnknown) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="mt-3 text-gray-600">
          {signingOut
            ? "Signing out..."
            : checkingUnknown
            ? "Checking access..."
            : "Loading..."}
        </p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: If we have a user but no role determined yet, wait for role resolution
  // This prevents bypass scenarios where user is set but role is still loading
  if (user && userRole === null && !loading && !checkingUnknown) {
    console.log("🔒 ProtectedRoute: User exists but role not determined, waiting...");
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="mt-3 text-gray-600">Verifying access...</p>
      </div>
    );
  }

  // Admin route handling with grace period
  if (requireAdmin && user) {
    if (userRole === "admin") {
      return <Outlet />;
    }
    if (!userRole && !adminWaitExpired) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="mt-3 text-gray-600">Preparing admin...</p>
        </div>
      );
    }
    // After grace period, if not admin, redirect based on user role
    if (userRole === "psychologist") {
      return <Navigate to="/dashboard" replace />;
    }
    // If no role determined or invalid role for admin routes, go to login
    return <Navigate to="/login" replace />;
  }

  // For non-admin routes, allow access for both regular users and admins
  // Only redirect admins to admin panel if they're accessing the root dashboard
  if (
    userRole === "admin" &&
    !requireAdmin &&
    window.location.pathname === "/dashboard"
  ) {
    console.log(
      "👨‍💼 ProtectedRoute: Admin user accessing dashboard, redirecting to admin"
    );
    return <Navigate to="/admin" replace />;
  }

  // For psychologists, ensure they can access dashboard routes
  if (userRole === "psychologist" && !requireAdmin) {
    console.log(
      "👩‍⚕️ ProtectedRoute: Psychologist access granted to dashboard routes"
    );
    return <Outlet />;
  }

  // For admins accessing non-admin routes (like patient profiles), allow access
  if (userRole === "admin" && !requireAdmin) {
    console.log("👨‍💼 ProtectedRoute: Admin access granted to non-admin routes");
    return <Outlet />;
  }

  // Final safeguard: If we reach here but still have no valid role, deny access
  if (!userRole || (userRole !== "admin" && userRole !== "psychologist")) {
    console.log("🚫 ProtectedRoute: No valid role found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // If authenticated and authorized, render the child routes
  console.log("✅ ProtectedRoute: Access granted, rendering protected content");
  return <Outlet />;
}
