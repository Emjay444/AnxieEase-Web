import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

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
        // For mock auth, we don't persist the session
        setLoading(false);
      } catch (err) {
        console.error("Auth initialization error:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeAuth();
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
