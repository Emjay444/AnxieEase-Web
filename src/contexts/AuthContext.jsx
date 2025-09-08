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
        const { data: { session }, error } = await authService.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Found existing session for:", session.user.email);
          // Set user immediately so UI can proceed
          setUser(session.user);
          // Apply cached role immediately if present to preserve correct routing
          const cachedRole = localStorage.getItem('userRole');
          if (cachedRole) {
            console.log('Using cached role:', cachedRole);
            setUserRole(cachedRole);
          }
          // Fetch role in background; don't block UI
          (async () => {
            try {
              const role = await authService.getUserRole(session.user.id);
              console.log("Initial role retrieved:", role);
              if (role) {
                setUserRole(role);
                localStorage.setItem('userRole', role);
              } else {
                setUserRole(null);
              }
            } catch (roleError) {
              console.error("Error getting initial role:", roleError);
              setUserRole(null);
            }
          })();
        } else {
          console.log("No existing session found");
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
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            // Set user immediately; don't block on role
            setUser(session.user);
            setLoading(false);
            console.log("Getting user role for:", session.user.id);
            (async () => {
              try {
                const role = await authService.getUserRole(session.user.id);
                console.log("User role retrieved:", role);
                if (role) {
                  setUserRole(role);
                  localStorage.setItem('userRole', role);
                } else {
                  setUserRole(null);
                }
              } catch (error) {
                console.error("Error getting user role:", error);
                setUserRole(null);
              }
            })();
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('userRole');
          setLoading(false);
        }
      }
    );

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
