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
      const { data, error } = await supabase
        .from("psychologists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
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
      return data.map((user) => ({
        id: user.id,
        name: user.full_name || user.email.split("@")[0],
        email: user.email,
        assigned_psychologist_id: psychologistId,
        is_active: user.is_email_verified,
        created_at: user.created_at,
        date_added: new Date(user.created_at).toLocaleDateString("en-GB"),
        time_added: new Date(user.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      }));
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

      // Create the psychologist record first
      const { data: psychData, error: psychError } = await supabase
        .from("psychologists")
        .insert([
          {
            id: psychologistId,
            name: psychologistData.name,
            email: psychologistData.email,
            contact: psychologistData.contact,
            license_number: psychologistData.licenseNumber,
            sex: psychologistData.sex,
            is_active: true,
          },
        ])
        .select();

      if (psychError) {
        console.error("Database error:", psychError.message);
        throw psychError;
      }

      // Send magic link with setup URL
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: psychologistData.email,
        options: {
          emailRedirectTo: `${
            window.location.origin
          }/psychologist-setup/${encodeURIComponent(
            psychologistData.email
          )}/${psychologistId}`,
          data: {
            role: "psychologist",
            psychologistId: psychologistId,
            name: psychologistData.name,
          },
        },
      });

      if (signInError) {
        // If sign-in fails, clean up the psychologist record
        await supabase.from("psychologists").delete().eq("id", psychologistId);
        console.error("Magic link error:", signInError.message);
        throw signInError;
      }

      return {
        ...psychData[0],
        message:
          "Invitation sent! The psychologist will receive an email with a magic link to set up their account.",
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

      // Update the patient record in the users table
      const { data, error } = await supabase
        .from("users")
        .update({ assigned_psychologist_id: psychologistId })
        .eq("id", patientId)
        .select();

      if (error) throw error;

      // For logging purposes, just use IDs if we can't fetch names
      let patientName = patientId;
      let psychName = psychologistId;

      try {
        // Try to get patient name from patient record we already have
        if (data && data[0]) {
          patientName = data[0].full_name || data[0].email || patientId;
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
        // Try to get patient data from the users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("full_name, email, assigned_psychologist_id")
          .eq("id", patientId)
          .single();

        if (!userError && userData) {
          patientName = userData.full_name || userData.email || patientId;
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

      // Clear the psychologist reference in the users table
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
};
