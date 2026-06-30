import { supabase } from "./supabaseClient";
import { adminService } from "./adminService";
import { getFullName, getAppUrl } from "../utils/helpers";

// In-memory storage for development - will be removed once database works
const mockStorage = {
  psychologists: [],
  nextId: 1,
};

export const psychologistService = {
  // Get all psychologists (admin only)
  async getAllPsychologists() {
    try {
      let allPsychologists = [];

      // First, get psychologists from psychologists table (primary source)
      const { data: psychologists, error: psychologistsError } = await supabase
        .from("psychologists")
        .select("*")
        .order("created_at", { ascending: false });

      if (!psychologistsError && psychologists && psychologists.length > 0) {
        // Format psychologists data to ensure consistent structure
        const formattedPsychologists = psychologists.map((psych) => ({
          id: psych.id,
          user_id: psych.user_id,
          name: psych.name || psych.email?.split("@")[0] || "Psychologist",
          email: psych.email,
          contact: psych.contact,
          specialization: "General Psychologist", // No specialization column in DB; use fallback
          bio: psych.bio || null,
          license_number: psych.license_number || null,
          sex: psych.sex || null,
          is_active: psych.is_active,
          created_at: psych.created_at,
          updated_at: psych.updated_at,
          avatar_url: psych.avatar_url || null, // Include avatar_url from psychologists table
        }));
        allPsychologists.push(...formattedPsychologists);
      }

      // Also get psychologists from the users table (for any legacy entries)
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "psychologist")
        .order("created_at", { ascending: false });

      if (!userProfilesError && userProfiles && userProfiles.length > 0) {
        // Add legacy psychologists that are not already in the list (avoid duplicates by email)
        const existingEmails = new Set(allPsychologists.map((p) => p.email));
        const uniqueUserProfiles = userProfiles.filter(
          (p) => !existingEmails.has(p.email)
        );

        // Format users-table data to match expected psychologist structure
        const formattedUserProfiles = uniqueUserProfiles.map((user) => ({
          id: user.id,
          user_id: user.id,
          name:
            `${user.first_name || ""} ${user.middle_name || ""} ${
              user.last_name || ""
            }`.trim() ||
            user.email?.split("@")[0] ||
            "Psychologist",
          first_name: user.first_name,
          middle_name: user.middle_name,
          last_name: user.last_name,
          email: user.email,
          contact: user.contact_number,
          specialization: "General Psychologist", // No specialization column in DB; use fallback
          is_active: user.is_email_verified || true,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }));
        allPsychologists.push(...formattedUserProfiles);
      }

      // Sort by creation date (newest first)
      allPsychologists.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      return allPsychologists;
    } catch (error) {
      console.error("Get psychologists error:", error.message);
      throw error;
    }
  },

  // Get psychologist by ID
  async getPsychologistById(id) {
    try {
      const { data, error } = await supabase
        .from("psychologists")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log("Database error:", error.message);
        return mockStorage.psychologists.find((p) => p.id === id);
      }

      return data;
    } catch (error) {
      console.error("Get psychologist error:", error.message);
      return mockStorage.psychologists.find((p) => p.id === id);
    }
  },

  // Get patients assigned to a psychologist
  async getPsychologistPatients(psychologistId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "patient")
        .eq("assigned_psychologist_id", psychologistId);

      if (error) throw error;

      // Format the data for display
      return data.map((user) => {
        const fullName = [user.first_name, user.middle_name, user.last_name]
          .filter(Boolean)
          .join(" ");

        // Calculate age if birth_date is available
        let age = null;
        if (user.birth_date) {
          const birthDate = new Date(user.birth_date);
          const ageDifMs = Date.now() - birthDate.getTime();
          const ageDate = new Date(ageDifMs);
          age = Math.abs(ageDate.getUTCFullYear() - 1970);
        }

        return {
          id: user.id,
          name: fullName || `Patient ${user.id.slice(0, 8)}`,
          first_name: user.first_name,
          middle_name: user.middle_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url || null,
          email: user.email || "No email",
          contact_number: user.contact_number || null,
          emergency_contact: user.emergency_contact || null,
          gender: user.gender || null,
          birth_date: user.birth_date || null,
          age: age,
          assigned_psychologist_id: psychologistId,
          is_active: user.is_email_verified || true,
          created_at: user.created_at,
          date_added: new Date(user.created_at).toLocaleDateString("en-GB"),
          time_added: new Date(user.created_at).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        };
      });
    } catch (error) {
      console.error("Get psychologist patients error:", error.message);
      return [];
    }
  },

  // Create a new psychologist
  async createPsychologist(psychologistData) {
    try {
      // Normalize email: Supabase Auth always lowercases emails, so the
      // psychologists row must match or the setup-completion lookup
      // (which matches by the auth session's email) will never find it
      // and will insert a duplicate, blank, inactive row instead.
      const normalizedEmail = psychologistData.email?.trim().toLowerCase();

      // Check for an existing psychologist with this email before sending
      // the invite - otherwise the invite email goes out even when the
      // insert below is about to fail on a duplicate.
      const { data: existing } = await supabase
        .from("psychologists")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existing) {
        throw new Error("A psychologist with this email already exists");
      }

      // Generate a UUID for the psychologist
      const psychologistId = crypto.randomUUID();

      // Combine name inputs; supports either `name` or split first/middle/last fields
      const fullNameForLogs =
        psychologistData.name ||
        getFullName({
          first_name: psychologistData.first_name,
          middle_name: psychologistData.middle_name,
          last_name: psychologistData.last_name,
          email: normalizedEmail,
        });

      // Create the psychologist record and send email in parallel for better performance
      const [psychResult, emailResult] = await Promise.allSettled([
        // Create the psychologist record
        supabase
          .from("psychologists")
          .insert([
            {
              id: psychologistId,
              name: fullNameForLogs,
              email: normalizedEmail,
              contact: psychologistData.contact,
              license_number: psychologistData.licenseNumber,
              sex: psychologistData.sex,
              is_active:
                psychologistData.is_active !== undefined
                  ? psychologistData.is_active
                  : false, // Default to false for email verification
            },
          ])
          .select(),

        // Send magic link with setup URL
        supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            // Include query parameters in the redirect URL for better persistence
            emailRedirectTo: `${getAppUrl()}/psychologist-setup?email=${encodeURIComponent(
              normalizedEmail
            )}&psychologist_id=${encodeURIComponent(
              psychologistId
            )}&source=admin_invite&setup=true&flow=account_creation`,
            shouldCreateUser: true, // Create a new auth user for the magic link to work
            data: {
              role: "psychologist",
              flow: "account_creation",
              psychologistId: psychologistId,
              name: fullNameForLogs,
              email: normalizedEmail,
              setupMode: true, // Flag to indicate this is a setup session
            },
          },
        }),
      ]);

      // Check if psychologist creation failed
      if (psychResult.status === "rejected" || psychResult.value.error) {
        const error =
          psychResult.status === "rejected"
            ? psychResult.reason
            : psychResult.value.error;
        console.error("Database error:", error.message);
        throw error;
      }

      // Check if email sending failed
      if (emailResult.status === "rejected" || emailResult.value.error) {
        // If email fails, still keep the psychologist record but warn
        const error =
          emailResult.status === "rejected"
            ? emailResult.reason
            : emailResult.value.error;
        console.error(
          "❌ Magic link email failed, but psychologist created:",
          error.message
        );

        return {
          ...psychResult.value.data[0],
          message:
            "Psychologist created but email could not be sent. Please try sending the invitation manually.",
          emailSent: false,
        };
      }

      // Log successful email sending
      console.log(
        "✅ Magic link email sent successfully to:",
        psychologistData.email
      );

      // Log the activity for admin tracking
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        const currentUserId = currentUser?.user?.id;

        if (currentUserId) {
          await adminService.logActivity(
            currentUserId,
            "Create Psychologist Account",
            `Created psychologist account for ${fullNameForLogs} (${
              psychologistData.email
            }). Status: ${
              psychologistData.is_active ? "Active" : "Pending Setup"
            }`
          );
        }
      } catch (logError) {
        console.warn(
          "Failed to log psychologist creation activity:",
          logError.message
        );
      }

      return {
        ...psychResult.value.data[0],
        message:
          "Invitation sent! The psychologist will receive an email with a magic link to set up their account.",
        emailSent: true,
      };
    } catch (error) {
      console.error("Create psychologist error:", error.message);
      throw error;
    }
  },

  // Update psychologist information
  async updatePsychologist(id, updates) {
    try {
      // Prepare updates for psychologists table with correct column names
      const psychologistUpdates = {};

      // Add fields only if they're provided
      if (updates.contact !== undefined) {
        psychologistUpdates.contact = updates.contact;
      }
      if (updates.is_active !== undefined) {
        psychologistUpdates.is_active = updates.is_active;
      }
      if (updates.license_number !== undefined) {
        psychologistUpdates.license_number = updates.license_number;
      }
      if (updates.sex !== undefined) {
        psychologistUpdates.sex = updates.sex;
      }
      if (updates.avatar_url !== undefined) {
        psychologistUpdates.avatar_url = updates.avatar_url;
      }
      if (updates.bio !== undefined) {
        psychologistUpdates.bio = updates.bio;
      }

      // Name: prefer explicit `name`; fall back to combining split fields for legacy callers
      if (updates.name !== undefined && updates.name.trim()) {
        psychologistUpdates.name = updates.name.trim();
      } else if (updates.first_name || updates.last_name) {
        psychologistUpdates.name = [
          updates.first_name,
          updates.middle_name,
          updates.last_name,
        ]
          .filter(Boolean)
          .join(" ");
      }

      console.log("Updating psychologist with data:", psychologistUpdates);

      // Check if we have any fields to update
      if (Object.keys(psychologistUpdates).length === 0) {
        throw new Error("No valid fields provided for update");
      }

      // First update the psychologists table with timeout
      const updatePromise = supabase
        .from("psychologists")
        .update(psychologistUpdates)
        .eq("id", id)
        .select();

      // Add 10 second timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Update operation timed out")), 10000)
      );

      const { data: psychData, error: psychError } = await Promise.race([
        updatePromise,
        timeoutPromise,
      ]);

      if (psychError) {
        console.error("Psychologists table update error:", psychError.message);
        throw psychError; // Throw the error instead of just logging it
      }

      // Also try to update user_profiles table if it exists (non-blocking)
      this.updateUserProfilesAsync(id, updates);

      // Return the updated psychologists table data
      if (psychData && psychData.length > 0) {
        console.log("Successfully updated psychologist:", psychData[0]);
        return psychData[0];
      }

      throw new Error("No data returned from update operation");
    } catch (error) {
      console.error("Update psychologist error:", error.message);

      // Don't use fallback mock storage for real errors
      if (
        error.message.includes("timeout") ||
        error.message.includes("No data returned")
      ) {
        throw error;
      }

      // Only fallback for database connection issues
      const index = mockStorage.psychologists.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockStorage.psychologists[index] = {
          ...mockStorage.psychologists[index],
          ...updates,
        };
        return mockStorage.psychologists[index];
      }

      throw error;
    }
  },

  // Deactivate a psychologist (set is_active to false)
  async deactivatePsychologist(id) {
    try {
      // First, check if psychologist has any assigned patients
      const { data: assignedPatients, error: patientsError } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .eq("role", "patient")
        .eq("assigned_psychologist_id", id);

      if (patientsError) {
        console.error(
          "Error checking assigned patients:",
          patientsError.message
        );
        throw patientsError;
      }

      // If psychologist has assigned patients, prevent deactivation
      if (assignedPatients && assignedPatients.length > 0) {
        const patientNames = assignedPatients
          .map((p) => {
            const fullName = [p.first_name, p.last_name]
              .filter(Boolean)
              .join(" ");
            return fullName || `Patient ${p.id.slice(0, 8)}`;
          })
          .join(", ");
        throw new Error(
          `Cannot deactivate psychologist. They have ${assignedPatients.length} assigned patient(s): ${patientNames}. Please reassign these patients to another psychologist first.`
        );
      }

      // Get the psychologist details first for the activity log
      const { data: psychologist, error: fetchError } = await supabase
        .from("psychologists")
        .select("name, email")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error(
          "Error fetching psychologist for deactivation:",
          fetchError.message
        );
        throw fetchError;
      }

      // Update the psychologist to inactive
      const { data, error } = await supabase
        .from("psychologists")
        .update({ is_active: false })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error deactivating psychologist:", error.message);
        throw error;
      }

      // Log the deactivation activity
      try {
        const { adminService } = await import("./adminService");
        await adminService.logActivity(
          "00000000-0000-0000-0000-000000000000", // Admin user ID placeholder
          "Psychologist Deactivated",
          `Deactivated psychologist ${getFullName(psychologist)} (${
            psychologist.email
          })`
        );
      } catch (logError) {
        console.error(
          "Error logging psychologist deactivation:",
          logError.message
        );
        // Continue even if logging fails
      }

      return data[0];
    } catch (error) {
      console.error("Deactivate psychologist error:", error.message);
      const index = mockStorage.psychologists.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockStorage.psychologists[index] = {
          ...mockStorage.psychologists[index],
          is_active: false,
        };
        return mockStorage.psychologists[index];
      }
      throw error;
    }
  },

  // Delete a psychologist (admin only)
  async deletePsychologist(id) {
    try {
      // First, check if psychologist has any assigned patients
      const { data: assignedPatients, error: patientsError } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .eq("role", "patient")
        .eq("assigned_psychologist_id", id);

      if (patientsError) {
        console.error(
          "Error checking assigned patients:",
          patientsError.message
        );
        throw patientsError;
      }

      // If psychologist has assigned patients, prevent deletion
      if (assignedPatients && assignedPatients.length > 0) {
        const patientNames = assignedPatients
          .map((p) => {
            const fullName = [p.first_name, p.last_name]
              .filter(Boolean)
              .join(" ");
            return fullName || `Patient ${p.id.slice(0, 8)}`;
          })
          .join(", ");
        throw new Error(
          `Cannot delete psychologist. They have ${assignedPatients.length} assigned patient(s): ${patientNames}. Please reassign these patients to another psychologist first.`
        );
      }

      // Proceed with deletion if no patients assigned
      const { error } = await supabase
        .from("psychologists")
        .delete()
        .eq("id", id);

      if (error) {
        console.log("Database error:", error.message);
        const index = mockStorage.psychologists.findIndex((p) => p.id === id);
        if (index !== -1) {
          mockStorage.psychologists.splice(index, 1);
        }
        return true;
      }

      return true;
    } catch (error) {
      console.error("Delete psychologist error:", error.message);
      // Don't use fallback mock deletion if it's a validation error
      if (error.message.includes("Cannot delete psychologist")) {
        throw error; // Re-throw validation errors to show to user
      }

      const index = mockStorage.psychologists.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockStorage.psychologists.splice(index, 1);
      }
      return true;
    }
  },

  // Assign a patient to a psychologist
  async assignPatient(patientId, psychologistId) {
    try {
      // Prevent default browser confirmation if any
      if (window.confirm !== undefined) {
        const originalConfirm = window.confirm;
        window.confirm = function () {
          return true;
        };

        // Reset after a short delay
        setTimeout(() => {
          window.confirm = originalConfirm;
        }, 100);
      }

      // Update the patient record in the user_profiles table
      const { data, error } = await supabase
        .from("users")
        .update({ assigned_psychologist_id: psychologistId })
        .eq("id", patientId)
        .select("first_name, last_name");

      if (error) throw error;

      // For logging purposes, just use IDs if we can't fetch names
      let patientName = patientId;
      let psychName = psychologistId;

      try {
        // Try to get patient name from patient record we already have
        if (data && data[0]) {
          const fullName = [data[0].first_name, data[0].last_name]
            .filter(Boolean)
            .join(" ");
          patientName = fullName || `Patient ${patientId.slice(0, 8)}`;
        }

        // Try to get psychologist name from the psychologists table
        const { data: psychData, error: psychError } = await supabase
          .from("psychologists")
          .select("name")
          .eq("id", psychologistId)
          .single();

        if (!psychError && psychData) {
          psychName = getFullName(psychData) || psychologistId;
        }
      } catch (nameError) {
        console.log("Error getting names for activity log:", nameError);
        // Continue with IDs if we couldn't get names
      }

      // Log the assignment activity with a valid UUID for user_id
      try {
        await adminService.logActivity(
          patientId, // Use the patient ID as the user_id (valid UUID)
          "Patient Assignment",
          `Patient ${patientName} was assigned to psychologist ${psychName}`
        );
      } catch (logError) {
        console.log("Error logging activity:", logError);
        // Don't throw error here, allow the assignment to succeed
      }

      return data[0];
    } catch (error) {
      console.error("Assign patient error:", error.message);
      throw error;
    }
  },

  // Unassign a patient from a psychologist
  async unassignPatient(patientId) {
    try {
      // Prevent default browser confirmation if any
      if (window.confirm !== undefined) {
        const originalConfirm = window.confirm;
        window.confirm = function () {
          return true;
        };

        // Reset after a short delay
        setTimeout(() => {
          window.confirm = originalConfirm;
        }, 100);
      }

      // Variables to store names for logging
      let patientName = patientId;
      let psychName = "unknown";
      let psychologistId = null;

      try {
        // Try to get patient data from the user_profiles table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("first_name, last_name, assigned_psychologist_id")
          .eq("id", patientId)
          .single();

        if (!userError && userData) {
          const fullName = [userData.first_name, userData.last_name]
            .filter(Boolean)
            .join(" ");
          patientName = fullName || `Patient ${patientId.slice(0, 8)}`;
          psychologistId = userData.assigned_psychologist_id;

          // Only fetch psychologist name if we have an ID
          if (psychologistId) {
            const { data: psychData, error: psychError } = await supabase
              .from("psychologists")
              .select("name")
              .eq("id", psychologistId)
              .single();

            if (!psychError && psychData) {
              psychName = getFullName(psychData) || psychologistId;
            }
          }
        }
      } catch (nameError) {
        console.log("Error getting names for activity log:", nameError);
        // Continue with IDs if we couldn't get names
      }

      // Clear the psychologist reference in the user_profiles table
      const { data, error } = await supabase
        .from("users")
        .update({ assigned_psychologist_id: null })
        .eq("id", patientId)
        .select();

      if (error) throw error;

      // Only log if there was actually a psychologist to unassign
      if (psychologistId) {
        try {
          await adminService.logActivity(
            patientId, // Use the patient ID as the user_id (valid UUID)
            "Patient Unassignment",
            `Patient ${patientName} was unassigned from psychologist ${psychName}`
          );
        } catch (logError) {
          console.log("Error logging activity:", logError);
          // Don't throw error here, allow the unassignment to succeed
        }
      }

      return data[0];
    } catch (error) {
      console.error("Unassign patient error:", error.message);
      throw error;
    }
  },

  // Update psychologist's user_id after magic link authentication
  async updatePsychologistUserId(email, userId) {
    try {
      const { error } = await supabase
        .from("psychologists")
        // Link the auth user but keep inactive until setup is complete
        // Case-insensitive match: Supabase Auth lowercases emails, but
        // rows created before that normalization may still have mixed case
        .update({ user_id: userId })
        .ilike("email", email);

      if (error) {
        console.error("Update user_id error:", error.message);
        throw error;
      }

      // Best-effort: mark the profile as verified/role psychologist if present
      try {
        await supabase
          .from("users")
          .update({ is_email_verified: true, role: "psychologist" })
          .eq("email", email);
      } catch (e) {
        // Non-fatal if profile row doesn’t exist yet; ignore
        console.log("Optional profile update skipped:", e?.message);
      }

      return { success: true };
    } catch (error) {
      console.error("Update psychologist user_id error:", error.message);
      throw error;
    }
  },

  // Send password reset magic link to psychologist (redirects to setup UI)
  async sendResetEmail(psychologistId) {
    try {
      // Get psychologist details
      const { data: psychologist, error: fetchError } = await supabase
        .from("psychologists")
        .select("name, email")
        .eq("id", psychologistId)
        .single();

      if (fetchError) {
        console.error("Error fetching psychologist:", fetchError.message);
        throw fetchError;
      }

      if (!psychologist) {
        throw new Error("Psychologist not found");
      }

      // Send magic link for password reset
      const appUrl = getAppUrl();

      // First try with shouldCreateUser: false (for existing auth users)
      let { error: resetError } = await supabase.auth.signInWithOtp({
        email: psychologist.email,
        options: {
          emailRedirectTo: `${appUrl}/psychologist-setup?email=${encodeURIComponent(
            psychologist.email
          )}&source=reset_password&flow=password_reset`,
          shouldCreateUser: false, // Don't create new users initially
          data: {
            role: "psychologist",
            flow: "password_reset",
            name: psychologist.name,
          },
        },
      });

      // If that fails (user doesn't exist in auth), try creating the user
      if (resetError && resetError.message.includes("User not found")) {
        console.log(
          "🔄 Auth user not found, creating user for password reset..."
        );
        const { error: createError } = await supabase.auth.signInWithOtp({
          email: psychologist.email,
          options: {
            emailRedirectTo: `${appUrl}/psychologist-setup?email=${encodeURIComponent(
              psychologist.email
            )}&source=reset_password&flow=password_reset`,
            shouldCreateUser: true, // Create user for password reset
            data: {
              role: "psychologist",
              flow: "password_reset",
              name: psychologist.name,
            },
          },
        });
        resetError = createError;
      }

      if (resetError) {
        console.error("Reset email error:", resetError.message);
        throw resetError;
      }

      // Log the reset email activity
      try {
        const { adminService } = await import("./adminService");
        await adminService.logActivity(
          null, // No specific user ID for admin actions
          "Password Reset Email Sent",
          `Reset password email sent to psychologist ${getFullName(
            psychologist
          )} (${psychologist.email})`
        );
      } catch (logError) {
        console.error("Error logging reset email activity:", logError.message);
        // Continue even if logging fails
      }

      return {
        success: true,
        message: `Password reset email sent to ${psychologist.email}`,
        psychologist: psychologist,
      };
    } catch (error) {
      console.error("Send reset email error:", error.message);
      throw error;
    }
  },

  // Async method to update user profiles without blocking the UI
  async updateUserProfilesAsync(id, updates) {
    try {
      const { error: userProfileError } = await supabase
        .from("users")
        .update({
          contact_number: updates.contact,
          // Parse name into components if provided
          ...(updates.name && {
            first_name: updates.name.split(" ")[0] || "",
            last_name: updates.name.split(" ").slice(1).join(" ") || "",
          }),
        })
        .eq("id", id);

      if (userProfileError) {
        console.log("User profiles update info:", userProfileError.message);
      }
    } catch (userError) {
      console.log(
        "User profiles table might not exist or user not found:",
        userError.message
      );
    }
  },
};
