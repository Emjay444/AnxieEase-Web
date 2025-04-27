import { supabase } from "./supabaseClient";

// Track login attempts
const loginAttempts = {};
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Mock data for development
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@anxiease.com",
    password: "admin123",
    role: "admin",
    name: "Admin User",
  },
  {
    id: "2",
    email: "psychologist@anxiease.com",
    password: "psych123",
    role: "psychologist",
    name: "Test Psychologist",
  },
];

export const authService = {
  // Sign in with email and password
  async signIn(email, password) {
    // Check if user is locked out
    if (this.isLockedOut(email)) {
      throw new Error("Account is temporarily locked. Please try again later.");
    }

    try {
      // Try to use mock data for development without Supabase
      const mockUser = MOCK_USERS.find(
        (user) => user.email === email && user.password === password
      );

      // If we have a matching mock user, return it
      if (mockUser) {
        console.log("Using mock authentication");
        // Reset login attempts on successful login
        this.resetLoginAttempts(email);
        return {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            user_metadata: {
              name: mockUser.name,
            },
          },
          role: mockUser.role,
        };
      }

      // For mock users, check if email exists but password is wrong
      if (MOCK_USERS.some((user) => user.email === email)) {
        this.recordFailedAttempt(email);
        throw new Error("Invalid login credentials");
      }

      throw new Error("User not found");
    } catch (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      // No need to call Supabase since we're using mock auth
      return { error: null };
    } catch (error) {
      console.error("Logout error:", error.message);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      // For mock auth, we don't persist the session
      return null;
    } catch (error) {
      console.error("Get current user error:", error.message);
      return null;
    }
  },

  // Get user role (psychologist or admin)
  async getUserRole(userId) {
    try {
      // Check mock users first
      const mockUser = MOCK_USERS.find((user) => user.id === userId);
      if (mockUser) {
        console.log("Using mock user role");
        return mockUser.role;
      }

      return null;
    } catch (error) {
      console.error("Get user role error:", error.message);
      return null;
    }
  },

  // Create new psychologist (admin only)
  async createPsychologist(email, password, name, role = "psychologist") {
    try {
      // Check if email already exists
      const { data: existingUsers } = await supabase
        .from("psychologists")
        .select("email")
        .eq("email", email);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("Email already exists");
      }

      // Create user in auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (authError) throw authError;

      // Add user to psychologists table
      const { error: profileError } = await supabase
        .from("psychologists")
        .insert([
          {
            id: authData.user.id,
            name,
            email,
            role,
          },
        ]);

      if (profileError) throw profileError;

      return authData.user;
    } catch (error) {
      console.error("Create psychologist error:", error.message);
      throw error;
    }
  },

  // Disable psychologist account (admin only)
  async disablePsychologist(userId) {
    try {
      // In a real implementation, you would use Supabase admin functions
      // For now, we'll just update the psychologists table
      const { error } = await supabase
        .from("psychologists")
        .update({ is_active: false })
        .eq("id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Disable psychologist error:", error.message);
      throw error;
    }
  },

  // Track failed login attempts
  recordFailedAttempt(email) {
    if (!loginAttempts[email]) {
      loginAttempts[email] = {
        count: 0,
        lockoutTime: null,
      };
    }

    loginAttempts[email].count += 1;

    if (loginAttempts[email].count >= MAX_LOGIN_ATTEMPTS) {
      loginAttempts[email].lockoutTime = Date.now() + LOCKOUT_DURATION;
    }
  },

  // Reset login attempts
  resetLoginAttempts(email) {
    if (loginAttempts[email]) {
      loginAttempts[email].count = 0;
      loginAttempts[email].lockoutTime = null;
    }
  },

  // Check if user is locked out
  isLockedOut(email) {
    if (!loginAttempts[email] || !loginAttempts[email].lockoutTime) {
      return false;
    }

    if (Date.now() < loginAttempts[email].lockoutTime) {
      return true;
    }

    // Reset if lockout period has passed
    this.resetLoginAttempts(email);
    return false;
  },
};
