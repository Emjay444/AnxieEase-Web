import { supabase } from "./supabaseClient";

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
        .from("patients")
        .select("*")
        .eq("assigned_psychologist_id", psychologistId);

      if (error) {
        console.log("Database error:", error.message);
        return [];
      }

      return data || [];
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
    return this.updatePsychologist(id, { is_active: false });
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
      const { data, error } = await supabase
        .from("patients")
        .update({ assigned_psychologist_id: psychologistId })
        .eq("id", patientId)
        .select();

      if (error) {
        console.log("Database error:", error.message);
        return { id: patientId, assigned_psychologist_id: psychologistId };
      }

      return data[0];
    } catch (error) {
      console.error("Assign patient error:", error.message);
      return { id: patientId, assigned_psychologist_id: psychologistId };
    }
  },

  // Unassign a patient from their psychologist
  async unassignPatient(patientId) {
    return this.assignPatient(patientId, null);
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
