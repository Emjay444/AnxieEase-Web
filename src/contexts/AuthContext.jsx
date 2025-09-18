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
        if (binding?.userId === userId && binding?.role && binding?.timestamp) {
          // Check if cache is expired (30 minutes)
          const isExpired = Date.now() - binding.timestamp > 30 * 60 * 1000;
          if (!isExpired) {
            return binding.role;
          } else {
            // Clear expired cache
            clearCachedRole();
          }
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
      clearCachedRole(); // Clear corrupted cache
      return null;
    }
  };

  const saveCachedRole = (userId, role) => {
    try {
      // Only save if we have valid userId and role
      if (userId && role) {
        localStorage.setItem("userRoleBinding", JSON.stringify({ 
          userId, 
          role, 
          timestamp: Date.now() 
        }));
      }
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
    let isMounted = true;
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        // Safety: don't let loading hang forever
        let safetyCleared = false;
        const safetyTimer = setTimeout(() => {
          if (!safetyCleared && isMounted) {
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
          
          // CRITICAL FIX: Always validate session is still valid before proceeding
          try {
            // Verify the session is actually valid by making an authenticated request
            const { data: currentUser, error: userError } = await supabase.auth.getUser();
            
            if (userError || !currentUser?.user || currentUser.user.id !== session.user.id) {
              console.warn("Session validation failed, clearing auth state");
              setUser(null);
              setUserRole(null);
              clearCachedRole();
              if (isMounted) {
                setLoading(false);
              }
              return;
            }
            
            // Session is valid, proceed with setting user
            setUser(session.user);

            // Fetch role directly - don't rely on cache for authorization decisions
            console.log("Fetching role for validated session:", session.user.id);
            const role = await authService.getUserRole(session.user.id);
            console.log("Initial role retrieved:", role);
            
            if (role) {
              setUserRole(role);
              saveCachedRole(session.user.id, role);
            } else {
              setUserRole(null);
              clearCachedRole();
            }
            
          } catch (validationError) {
            console.error("Error validating session:", validationError);
            // Clear everything on validation error
            setUser(null);
            setUserRole(null);
            clearCachedRole();
          }
        } else {
          console.log("No existing session found");
          clearCachedRole();
        }

        if (isMounted) {
          setLoading(false);
        }
        safetyCleared = true;
        clearTimeout(safetyTimer);
      } catch (err) {
        console.error("Auth initialization error:", err.message);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN") {
        if (session?.user) {
          // New sign in: set user and clear any cached role first
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
      } else if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        // For token refresh or initial session, validate the session
        if (session?.user) {
          setUser(session.user);
          setLoading(false);

          // Always validate role for security - don't trust cache completely
          console.log(
            "Token refreshed/initial session - validating role for:",
            session.user.id
          );
          (async () => {
            try {
              const role = await authService.getUserRole(session.user.id);
              console.log("User role validated after refresh:", role);
              if (role) {
                setUserRole(role);
                saveCachedRole(session.user.id, role);
              } else {
                setUserRole(null);
                clearCachedRole();
              }
            } catch (error) {
              console.error("Error validating user role after refresh:", error);
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
      isMounted = false;
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

      // Clear all cached role data to prevent stale authentication
      clearCachedRole();
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
