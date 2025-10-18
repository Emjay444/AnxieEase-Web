import { supabase } from "./supabaseClient";

export const journalService = {
  // Get journals for a specific patient (for psychologist view)
  async getPatientJournals(patientId) {
    try {
      console.log("Fetching journals for patient ID:", patientId);

      const { data, error } = await supabase
        .from("journals")
        .select("*")
        .eq("user_id", patientId)
        .eq("shared_with_psychologist", true)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching patient journals:", error);
        return [];
      }

      console.log("✅ Found", data?.length || 0, "shared journal entries");
      return data || [];
    } catch (error) {
      console.error("Get patient journals error:", error.message);
      return [];
    }
  },

  // Get user's own journals (for patient view)
  async getMyJournals(userId) {
    try {
      const { data, error } = await supabase
        .from("journals")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching my journals:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Get my journals error:", error.message);
      return [];
    }
  },

  // Create a new journal entry
  async createJournal(userId, journalData) {
    try {
      const { data, error } = await supabase
        .from("journals")
        .insert([
          {
            user_id: userId,
            date: journalData.date || new Date().toISOString().split("T")[0],
            title: journalData.title || null,
            content: journalData.content,
            shared_with_psychologist: journalData.shared_with_psychologist || false,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create journal: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Create journal error:", error);
      throw error;
    }
  },

  // Update an existing journal entry
  async updateJournal(journalId, updates) {
    try {
      const { data, error } = await supabase
        .from("journals")
        .update(updates)
        .eq("id", journalId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update journal: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Update journal error:", error);
      throw error;
    }
  },

  // Delete a journal entry
  async deleteJournal(journalId) {
    try {
      const { error } = await supabase
        .from("journals")
        .delete()
        .eq("id", journalId);

      if (error) {
        throw new Error(`Failed to delete journal: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Delete journal error:", error);
      throw error;
    }
  },

  // Toggle sharing status
  async toggleSharing(journalId, shared) {
    try {
      const { data, error } = await supabase
        .from("journals")
        .update({ shared_with_psychologist: shared })
        .eq("id", journalId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to toggle sharing: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Toggle sharing error:", error);
      throw error;
    }
  },
};
