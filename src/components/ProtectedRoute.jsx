import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabaseClient";

// Component to protect routes that require authentication
const ProtectedRoute = ({ requireAdmin = false }) => {
  const { user, userRole, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [checkingUnknown, setCheckingUnknown] = useState(false);

  // If a session exists but we couldn't resolve a role, check if this user
  // is an INACTIVE psychologist. If yes, sign out (restore prior behavior
  // for magic-link on same device). If no (e.g., admin/active psych), do nothing
  // and let role resolution complete without logging out across tabs.
  useEffect(() => {
    const doSignOutIfUnknownRole = async () => {
      // Only act when loading is finished and we have a user with unknown role
      if (!loading && user && (userRole === null || userRole === undefined)) {
        try {
          setCheckingUnknown(true);
          const { data: psychologist, error } = await supabase
            .from("psychologists")
            .select("is_active")
            .eq("user_id", user.id)
            .maybeSingle();

          // If this user is an inactive psychologist, sign out (block access)
          if (psychologist && psychologist.is_active === false) {
            setSigningOut(true);
            await supabase.auth.signOut();
          }
          // Else: do nothing; allow role to resolve (admin or active psych)
        } finally {
          setCheckingUnknown(false);
          setSigningOut(false);
        }
      }
    };
    doSignOutIfUnknownRole();
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

  // If admin route but role unknown, show a brief loading state to avoid misrouting
  if (requireAdmin && user && !userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="mt-3 text-gray-600">Preparing admin...</p>
      </div>
    );
  }

  // If admin route but user is not admin, redirect to dashboard
  if (requireAdmin && userRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and authorized, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
