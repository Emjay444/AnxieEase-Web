import { createClient } from "@supabase/supabase-js";

// Create a mock Supabase client for development without actual credentials
const createMockClient = () => {
  console.warn(
    "Using mock Supabase client. Set up your .env file for actual functionality."
  );

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

// Try to create a real Supabase client if credentials are available
let supabase;

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    // Create real Supabase client
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized with provided credentials");
  } else {
    // Use mock client if credentials are missing
    supabase = createMockClient();
  }
} catch (error) {
  console.error("Error initializing Supabase client:", error);
  // Fallback to mock client
  supabase = createMockClient();
}

export { supabase };
