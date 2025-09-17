import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache helpers: bind role to specific userId to avoid leaking roles across sessions
  const loadCachedRole = (userId) => {
    try {
      // Prefer new binding format
      const bindingRaw = localStorage.getItem("userRoleBinding");
      if (bindingRaw) {
        const binding = JSON.parse(bindingRaw);
        if (binding?.userId === userId && binding?.role) {
          return binding.role;
        }
      }
      // Legacy key cleanup (unbound role)
      const legacy = localStorage.getItem("userRole");
      if (legacy) {
        localStorage.removeItem("userRole");
      }
      return null;
    } catch (e) {
      console.warn("Failed to load role cache:", e?.message);
      return null;
    }
  };

  const saveCachedRole = (userId, role) => {
    try {
      localStorage.setItem("userRoleBinding", JSON.stringify({ userId, role }));
    } catch (e) {
      console.warn("Failed to save role cache:", e?.message);
    }
  };

  const clearCachedRole = () => {
    localStorage.removeItem("userRoleBinding");
    localStorage.removeItem("userRole"); // legacy
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        // Safety: don't let loading hang forever
        let safetyCleared = false;
        const safetyTimer = setTimeout(() => {
          if (!safetyCleared) {
            console.warn("Auth loading safety timer fired; unblocking UI.");
            setLoading(false);
          }
        }, 5000);
        // Check for existing Supabase session
        const {
          data: { session },
          error,
        } = await authService.getSession();

        if (error) {
          console.error("Session error:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Found existing session for:", session.user.email);
          // Set user immediately so UI can proceed
          setUser(session.user);

          // Apply cached role ONLY if it's bound to this userId
          const cachedRole = loadCachedRole(session.user.id);
          if (cachedRole) {
            console.log("Using cached role for user:", cachedRole);
            setUserRole(cachedRole);
          } else {
            // Ensure we don't carry over any stale role
            setUserRole(null);
          }

          // Fetch role in background; don't block UI
          (async () => {
            try {
              const role = await authService.getUserRole(session.user.id);
              console.log("Initial role retrieved:", role);
              if (role) {
                setUserRole(role);
                saveCachedRole(session.user.id, role);
              } else {
                setUserRole(null);
                clearCachedRole();
              }
            } catch (roleError) {
              console.error("Error getting initial role:", roleError);
              setUserRole(null);
              clearCachedRole();
            }
          })();
        } else {
          console.log("No existing session found");
          clearCachedRole();
        }

        setLoading(false);
        safetyCleared = true;
        clearTimeout(safetyTimer);
      } catch (err) {
        console.error("Auth initialization error:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          // New session: set user and clear any cached role first
          setUser(session.user);
          setUserRole(null);
          clearCachedRole();
          setLoading(false);
          console.log("Getting user role for:", session.user.id);
          (async () => {
            try {
              const role = await authService.getUserRole(session.user.id);
              console.log("User role retrieved:", role);
              if (role) {
                setUserRole(role);
                saveCachedRole(session.user.id, role);
              } else {
                setUserRole(null);
                clearCachedRole();
              }
            } catch (error) {
              console.error("Error getting user role:", error);
              setUserRole(null);
              clearCachedRole();
            }
          })();
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRole(null);
        clearCachedRole();
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { user: authUser, role } = await authService.signIn(
        email,
        password
      );
      setUser(authUser);
      setUserRole(role);

      return { user: authUser, role };
    } catch (err) {
      console.error("Sign in error:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setUserRole(null);

      // Clear user role from localStorage but preserve remember me settings
      localStorage.removeItem("userRole");
    } catch (err) {
      console.error("Sign out error:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return userRole === "admin";
  };

  // Check if user is psychologist
  const isPsychologist = () => {
    return userRole === "psychologist";
  };

  const value = {
    user,
    userRole,
    loading,
    error,
    signIn,
    signOut,
    isAdmin,
    isPsychologist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
