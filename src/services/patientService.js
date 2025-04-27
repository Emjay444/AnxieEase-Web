import { supabase } from './supabaseClient';

export const patientService = {
  // Get patients assigned to a psychologist
  async getPatientsByPsychologist(psychologistId) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('assigned_psychologist_id', psychologistId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get patients error:', error.message);
      throw error;
    }
  },

  // Get all patients (admin only)
  async getAllPatients() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*, psychologists(name)');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all patients error:', error.message);
      throw error;
    }
  },

  // Get a single patient by ID
  async getPatientById(patientId) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get patient error:', error.message);
      throw error;
    }
  },

  // Get patient notes
  async getPatientNotes(patientId) {
    try {
      const { data, error } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get patient notes error:', error.message);
      throw error;
    }
  },

  // Add a note to a patient
  async addPatientNote(patientId, noteContent) {
    try {
      const { data, error } = await supabase
        .from('patient_notes')
        .insert([
          {
            patient_id: patientId,
            note_content: noteContent,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Add patient note error:', error.message);
      throw error;
    }
  },

  // Update a patient note
  async updatePatientNote(noteId, noteContent) {
    try {
      const { data, error } = await supabase
        .from('patient_notes')
        .update({ note_content: noteContent })
        .eq('id', noteId)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Update patient note error:', error.message);
      throw error;
    }
  },

  // Delete a patient note
  async deletePatientNote(noteId) {
    try {
      const { error } = await supabase
        .from('patient_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete patient note error:', error.message);
      throw error;
    }
  },

  // Get patient session logs
  async getPatientSessionLogs(patientId) {
    try {
      const { data, error } = await supabase
        .from('session_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get session logs error:', error.message);
      throw error;
    }
  },

  // Assign patient to psychologist
  async assignPatientToPsychologist(patientId, psychologistId) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update({ assigned_psychologist_id: psychologistId })
        .eq('id', patientId)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Assign patient error:', error.message);
      throw error;
    }
  },

  // Unassign patient from psychologist
  async unassignPatientFromPsychologist(patientId) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update({ assigned_psychologist_id: null })
        .eq('id', patientId)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Unassign patient error:', error.message);
      throw error;
    }
  },
};
