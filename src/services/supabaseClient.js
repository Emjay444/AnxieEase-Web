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

/**
 * Create a safer Supabase client that prevents 406 errors by intercepting .single() and .maybeSingle() calls
 * @param {string} url - Supabase URL
 * @param {string} key - Supabase API key
 * @param {object} options - Client options
 * @returns {object} Enhanced Supabase client
 */
function createSafeClient(url, key, options = {}) {
  // Create the regular Supabase client
  const originalClient = createClient(url, key, options);

  // Create a proxy to intercept from() calls
  return new Proxy(originalClient, {
    get(target, prop) {
      // Intercept the 'from' method to wrap its result
      if (prop === "from") {
        const originalFrom = target[prop];

        // Return a wrapped version of from()
        return function (table) {
          const queryBuilder = originalFrom.call(target, table);

          // Create a proxy for the query builder to intercept select()
          return new Proxy(queryBuilder, {
            get(qTarget, qProp) {
              if (qProp === "select") {
                const originalSelect = qTarget[qProp];

                // Return a wrapped version of select()
                return function (...args) {
                  const selectBuilder = originalSelect.apply(qTarget, args);

                  // Create a proxy for the select builder
                  return new Proxy(selectBuilder, {
                    get(sTarget, sProp) {
                      // Intercept the single() and maybeSingle() methods
                      if (sProp === "single" || sProp === "maybeSingle") {
                        const originalMethod = sTarget[sProp];

                        // Return a safer version of single/maybeSingle
                        return async function () {
                          try {
                            // Get the current URL being called
                            const urlObj = new URL(target.rest.url);
                            const path = urlObj.pathname.split("/");
                            const currentTable = path[path.length - 1];

                            // Get a clean URL for logging by ensuring we don't duplicate the path
                            const baseUrl = target.rest.url.replace(/\/+$/, ""); // Remove trailing slashes
                            const requestPath = sTarget.url.pathname.replace(
                              /^\/+/,
                              ""
                            ); // Remove leading slashes
                            const cleanUrl = `${baseUrl}/${requestPath}${sTarget.url.search}`;

                            // Only log in development mode and if DEBUG_SUPABASE is enabled
                            if (
                              import.meta?.env?.DEV &&
                              import.meta?.env?.VITE_DEBUG_SUPABASE === "true"
                            ) {
                              console.log(
                                `🔧 SafeSupabase: Making ${sProp}() safer:\nOriginal: ${cleanUrl}\nNow using limit(1)&return=array instead of ${sProp}()`
                              );
                            }

                            // Use limit(1) and handle the array response safely
                            const response = await sTarget.limit(1);

                            // Handle the response as if single() was called
                            if (response.error) {
                              return { data: null, error: response.error };
                            }

                            if (response.data.length === 0) {
                              // No data found
                              if (sProp === "single") {
                                // single() would throw an error for no results
                                return {
                                  data: null,
                                  error: {
                                    message: "No rows found",
                                    details: "",
                                    hint: "",
                                    code: "PGRST116",
                                  },
                                };
                              } else {
                                // maybeSingle() returns null for no results
                                return { data: null, error: null };
                              }
                            } else if (response.data.length === 1) {
                              // Exactly one result - return the object directly
                              return { data: response.data[0], error: null };
                            } else {
                              // Multiple results - single() would throw an error
                              if (sProp === "single") {
                                return {
                                  data: null,
                                  error: {
                                    message: "Multiple rows returned",
                                    details: "",
                                    hint: "",
                                    code: "PGRST102",
                                  },
                                };
                              } else {
                                // maybeSingle() returns the first result
                                return { data: response.data[0], error: null };
                              }
                            }
                          } catch (err) {
                            console.error(
                              "Error in safe single() implementation:",
                              err
                            );
                            // Fall back to original method if our implementation fails
                            return originalMethod.call(sTarget);
                          }
                        };
                      }

                      // Pass through all other properties
                      return Reflect.get(sTarget, sProp);
                    },
                  });
                };
              }

              // Pass through all other properties
              return Reflect.get(qTarget, qProp);
            },
          });
        };
      }

      // Pass through all other properties
      return Reflect.get(target, prop);
    },
  });
}

// Create a Supabase client if credentials are available
let supabase;

try {
  if (supabaseUrl && supabaseAnonKey) {
    // Create safer Supabase client that prevents 406 errors
    supabase = createSafeClient(supabaseUrl, supabaseAnonKey);

    // Only log in development mode and if debugging is enabled
    if (
      import.meta?.env?.DEV &&
      import.meta?.env?.VITE_DEBUG_SUPABASE === "true"
    ) {
      console.log("Supabase client initialized with provided credentials");
    }
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
