import { supabase } from './supabaseClient';

export const psychologistService = {
  // Get all psychologists (admin only)
  async getAllPsychologists() {
    try {
      const { data, error } = await supabase
        .from('psychologists')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all psychologists error:', error.message);
      throw error;
    }
  },

  // Get psychologist by ID
  async getPsychologistById(id) {
    try {
      const { data, error } = await supabase
        .from('psychologists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get psychologist error:', error.message);
      throw error;
    }
  },

  // Get patients assigned to a psychologist
  async getPsychologistPatients(psychologistId) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('assigned_psychologist_id', psychologistId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get psychologist patients error:', error.message);
      throw error;
    }
  },

  // Update psychologist information
  async updatePsychologist(id, updates) {
    try {
      const { data, error } = await supabase
        .from('psychologists')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Update psychologist error:', error.message);
      throw error;
    }
  },
};
