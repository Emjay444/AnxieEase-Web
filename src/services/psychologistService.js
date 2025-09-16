import { supabase } from "./supabaseClient";
import { adminService } from "./adminService";

// In-memory storage for development - will be removed once database works
const mockStorage = {
  psychologists: [],
  nextId: 1,
};

export const psychologistService = {
  // Get all psychologists (admin only)
  async getAllPsychologists() {
    try {
      // Try to get psychologists from user_profiles table (which has avatar_url)
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("role", "psychologist")
        .order("created_at", { ascending: false });

      if (!userProfilesError && userProfiles && userProfiles.length > 0) {
        // Format user_profiles data to match expected psychologist structure
        return userProfiles.map(user => ({
          id: user.id,
          user_id: user.id,
          name: `${user.first_name || ""} ${user.middle_name || ""} ${user.last_name || ""}`.trim() || user.email?.split("@")[0] || "Psychologist",
          email: user.email,
          contact: user.contact_number,
          specialization: user.specialization,
          is_active: user.is_email_verified || true,
          created_at: user.created_at,
          updated_at: user.updated_at,
          avatar_url: user.avatar_url || null, // Include avatar_url from user_profiles
        }));
      }

      // Fallback to psychologists table
      const { data, error } = await supabase
        .from("psychologists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
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
        .from("user_profiles")
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
          avatar_url: user.avatar_url || null, // Include avatar_url in the returned data
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
      // Generate a UUID for the psychologist
      const psychologistId = crypto.randomUUID();

      // Create the psychologist record and send email in parallel for better performance
      const [psychResult, emailResult] = await Promise.allSettled([
        // Create the psychologist record
        supabase
          .from("psychologists")
          .insert([
            {
              id: psychologistId,
              name: psychologistData.name,
              email: psychologistData.email,
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
          email: psychologistData.email,
          options: {
            // Always redirect to a clean setup route; Supabase will attach tokens in the URL hash
            emailRedirectTo: `${
              import.meta.env.VITE_APP_URL || window.location.origin
            }/psychologist-setup`,
            data: {
              role: "psychologist",
              psychologistId: psychologistId,
              name: psychologistData.name,
            },
          },
        })
      ]);

      // Check if psychologist creation failed
      if (psychResult.status === 'rejected' || psychResult.value.error) {
        const error = psychResult.status === 'rejected' ? psychResult.reason : psychResult.value.error;
        console.error("Database error:", error.message);
        throw error;
      }

      // Check if email sending failed
      if (emailResult.status === 'rejected' || emailResult.value.error) {
        // If email fails, still keep the psychologist record but warn
        const error = emailResult.status === 'rejected' ? emailResult.reason : emailResult.value.error;
        console.warn("Magic link email failed, but psychologist created:", error.message);
        
        return {
          ...psychResult.value.data[0],
          message: "Psychologist created but email could not be sent. Please try sending the invitation manually.",
          emailSent: false
        };
      }

      return {
        ...psychResult.value.data[0],
        message:
          "Invitation sent! The psychologist will receive an email with a magic link to set up their account.",
        emailSent: true
      };
    } catch (error) {
      console.error("Create psychologist error:", error.message);
      throw error;
    }
  },

  // Update psychologist information
  async updatePsychologist(id, updates) {
    try {
      const { data, error } = await supabase
        .from("psychologists")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) {
        console.log("Database error:", error.message);
        const index = mockStorage.psychologists.findIndex((p) => p.id === id);
        if (index !== -1) {
          mockStorage.psychologists[index] = {
            ...mockStorage.psychologists[index],
            ...updates,
          };
          return mockStorage.psychologists[index];
        }
        return null;
      }

      return data[0];
    } catch (error) {
      console.error("Update psychologist error:", error.message);
      const index = mockStorage.psychologists.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockStorage.psychologists[index] = {
          ...mockStorage.psychologists[index],
          ...updates,
        };
        return mockStorage.psychologists[index];
      }
      return null;
    }
  },

  // Deactivate a psychologist (set is_active to false)
  async deactivatePsychologist(id) {
    try {
      // First, check if psychologist has any assigned patients
      const { data: assignedPatients, error: patientsError } = await supabase
        .from("user_profiles")
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
          `Deactivated psychologist ${psychologist.name} (${psychologist.email})`
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
        .from("user_profiles")
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
          psychName = psychData.name || psychologistId;
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
          .from("user_profiles")
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
              psychName = psychData.name || psychologistId;
            }
          }
        }
      } catch (nameError) {
        console.log("Error getting names for activity log:", nameError);
        // Continue with IDs if we couldn't get names
      }

      // Clear the psychologist reference in the user_profiles table
      const { data, error } = await supabase
        .from("user_profiles")
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
        .update({ user_id: userId })
        .eq("email", email);

      if (error) {
        console.error("Update user_id error:", error.message);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error("Update psychologist user_id error:", error.message);
      throw error;
    }
  },

  // Send password reset email to psychologist
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

      // Send password reset email using Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        psychologist.email,
        {
          redirectTo: `${
            import.meta.env.VITE_APP_URL || window.location.origin
          }/reset-password`,
        }
      );

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
          `Reset password email sent to psychologist ${psychologist.name} (${psychologist.email})`
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
};
