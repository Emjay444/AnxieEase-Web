/**
 * Direct password update service that bypasses Supabase client session management
 * Uses direct API calls with stored tokens to avoid session invalidation issues
 */

const SUPABASE_URL = "https://gqsustjxzjzfntcsnvpk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxc3VzdGp4emp6Zm50Y3NudnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDg4NTgsImV4cCI6MjA1Njc4NDg1OH0.RCS_0fSVYnYVY2qr0Ow1__vBC4WRaVg_2SDatKREVHA";

export const directPasswordService = {
  /**
   * Exchange a refresh token for a new access token using Supabase Auth API
   */
  async refreshAccessToken(refreshToken) {
    const resp = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    if (!resp.ok) {
      let errMsg = resp.statusText;
      try {
        const json = await resp.json();
        errMsg = json?.msg || json?.error || json?.message || errMsg;
      } catch (_) {}
      throw new Error(`Failed to refresh access token: ${errMsg}`);
    }

    const json = await resp.json();
    return {
      access_token: json?.access_token,
      refresh_token: json?.refresh_token || refreshToken,
      user: json?.user,
    };
  },
  /**
   * Update password using direct API call with stored tokens
   * This bypasses the Supabase client session management
   */
  async updatePasswordDirectly(password, accessToken, refreshToken) {
    try {
      console.log("🔑 Updating password using direct API call...");

      const doRequest = async (token) =>
        fetch(`${SUPABASE_URL}/auth/v1/user`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ password }),
        });

      let response = await doRequest(accessToken);

      // If session was cleared (common after magic link flows), try to refresh
      if (
        (response.status === 401 || response.status === 403) &&
        refreshToken
      ) {
        console.warn(
          `⚠️ Password update got ${response.status}. Attempting refresh token flow...`
        );
        const refreshed = await this.refreshAccessToken(refreshToken);
        response = await doRequest(refreshed.access_token);
      }

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (_) {}
        console.error("❌ Direct password update failed:", errorData);
        throw new Error(
          `Password update failed: ${errorData.message || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("✅ Password updated successfully via direct API");

      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Direct password update error:", error);
      throw error;
    }
  },

  /**
   * Activate psychologist account using direct API call
   */
  async activatePsychologistDirectly(email, userId, accessToken, refreshToken) {
    try {
      console.log("🏥 Activating psychologist account via direct API...");

      // Helper for authorized fetch with optional retry after refresh
      const authedFetch = async (url, init) => {
        const doFetch = (token) =>
          fetch(url, {
            ...init,
            headers: {
              ...(init?.headers || {}),
              Authorization: `Bearer ${token}`,
              apikey: SUPABASE_ANON_KEY,
            },
          });

        let res = await doFetch(accessToken);
        if ((res.status === 401 || res.status === 403) && refreshToken) {
          console.warn(
            `⚠️ Auth ${res.status} on ${
              init?.method || "GET"
            } ${url}. Refreshing token...`
          );
          const refreshed = await this.refreshAccessToken(refreshToken);
          res = await doFetch(refreshed.access_token);
        }
        return res;
      };

      // First, check if psychologist exists
      const checkResponse = await authedFetch(
        `${SUPABASE_URL}/rest/v1/psychologists?email=eq.${email}&select=id,is_active`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!checkResponse.ok) {
        throw new Error(
          `Failed to check psychologist: ${checkResponse.statusText}`
        );
      }

      const psychologists = await checkResponse.json();

      if (psychologists.length > 0) {
        // Update existing psychologist
        const updateResponse = await authedFetch(
          `${SUPABASE_URL}/rest/v1/psychologists?id=eq.${psychologists[0].id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              is_active: true,
              user_id: userId,
              updated_at: new Date().toISOString(),
            }),
          }
        );

        if (!updateResponse.ok) {
          throw new Error(
            `Failed to update psychologist: ${updateResponse.statusText}`
          );
        }
      } else {
        // Insert new psychologist
        const insertResponse = await authedFetch(
          `${SUPABASE_URL}/rest/v1/psychologists`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email,
              user_id: userId,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }),
          }
        );

        if (!insertResponse.ok) {
          throw new Error(
            `Failed to insert psychologist: ${insertResponse.statusText}`
          );
        }
      }

      console.log("✅ Psychologist account activated successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Direct psychologist activation error:", error);
      throw error;
    }
  },

  /**
   * Complete psychologist setup using direct API calls
   */
  async completeSetupDirectly(
    email,
    password,
    accessToken,
    refreshToken,
    userId
  ) {
    try {
      console.log("🔧 Completing psychologist setup via direct API...");

      // Step 1: Update password
      await this.updatePasswordDirectly(password, accessToken, refreshToken);

      // Step 2: Activate psychologist account
      await this.activatePsychologistDirectly(
        email,
        userId,
        accessToken,
        refreshToken
      );

      // Step 3: Update user profile
      try {
        const profileResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/user_profiles?email=eq.${email}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              role: "psychologist",
              is_email_verified: true,
            }),
          }
        );

        if (profileResponse.ok) {
          console.log("✅ User profile updated");
        } else {
          console.warn("⚠️ User profile update failed, but continuing...");
        }
      } catch (profileError) {
        console.warn("⚠️ User profile update error:", profileError.message);
      }

      console.log(
        "✅ Psychologist setup completed successfully via direct API"
      );
      return { success: true };
    } catch (error) {
      console.error("❌ Direct setup completion error:", error);
      throw error;
    }
  },
};
