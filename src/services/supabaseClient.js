import { createClient } from "@supabase/supabase-js";

// Use the specific project URL and environment variables
const supabaseUrl = "https://gqsustjxzjzfntcsnvpk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxc3VzdGp4emp6Zm50Y3NudnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDg4NTgsImV4cCI6MjA1Njc4NDg1OH0.RCS_0fSVYnYVY2qr0Ow1__vBC4WRaVg_2SDatKREVHA";

// Create a mock Supabase client for development without actual credentials
const createMockClient = () => {
  return {
    auth: {
      signInWithPassword: async () => ({
        data: null,
        error: { message: "Mock auth: Not implemented" },
      }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null }),
          data: [],
          error: null,
        }),
        order: () => ({ data: [], error: null }),
        data: [],
        error: null,
      }),
      insert: () => ({
        select: async () => ({ data: [], error: null }),
      }),
      update: () => ({
        eq: () => ({
          select: async () => ({ data: [], error: null }),
        }),
      }),
      delete: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  };
};

// Create a Supabase client if credentials are available
let supabase;

try {
  if (supabaseUrl && supabaseAnonKey) {
    // Create real Supabase client
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized with provided credentials");
  } else {
    // Fallback to mock client if credentials are missing
    console.warn(
      "Using mock Supabase client. Set up your .env file for actual functionality."
    );
    supabase = createMockClient();
  }
} catch (error) {
  console.error("Error initializing Supabase client:", error);
  // Fallback to mock client
  supabase = createMockClient();
}

export { supabase };
