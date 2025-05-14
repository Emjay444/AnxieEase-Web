import { supabase } from "./supabaseClient";

// Mock data for development
const mockPatients = [
  {
    id: "mock-patient-1",
    name: "John Smith",
    email: "john.smith@example.com",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    assigned_psychologist_id: "mock-psych-1",
    psychologists: { name: "Dr. Jane Doe" },
  },
  {
    id: "mock-patient-2",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    is_active: true,
    assigned_psychologist_id: null,
    psychologists: null,
  },
];

const mockNotes = [
  {
    id: "mock-note-1",
    patient_id: "mock-patient-1",
    note_content:
      "Initial consultation completed. Patient shows signs of anxiety.",
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: "mock-note-2",
    patient_id: "mock-patient-1",
    note_content: "Follow-up session scheduled for next week.",
    created_at: new Date(Date.now() - 21600000).toISOString(),
  },
];

const mockSessionLogs = [
  {
    id: "mock-session-1",
    patient_id: "mock-patient-1",
    session_date: new Date(Date.now() - 86400000).toISOString(),
    session_duration: 60,
    session_notes: "Initial assessment session.",
  },
];

export const patientService = {
  // Get patients assigned to a psychologist
  async getPatientsByPsychologist(psychologistId) {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("assigned_psychologist_id", psychologistId);

      if (error) {
        console.log("Using mock patients data due to error:", error.message);
        return mockPatients.filter(
          (p) => p.assigned_psychologist_id === psychologistId
        );
      }
      return data || [];
    } catch (error) {
      console.error("Get patients error:", error.message);
      return mockPatients.filter(
        (p) => p.assigned_psychologist_id === psychologistId
      );
    }
  },

  // Get all patients (admin only)
  async getAllPatients() {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*, psychologists(name)");

      if (error) {
        console.log("Using mock patients data due to error:", error.message);
        return mockPatients;
      }
      return data || [];
    } catch (error) {
      console.error("Get all patients error:", error.message);
      return mockPatients;
    }
  },

  // Get a single patient by ID
  async getPatientById(patientId) {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) {
        console.log("Using mock patient data due to error:", error.message);
        return mockPatients.find((p) => p.id === patientId) || mockPatients[0];
      }
      return data;
    } catch (error) {
      console.error("Get patient error:", error.message);
      return mockPatients.find((p) => p.id === patientId) || mockPatients[0];
    }
  },

  // Get patient notes
  async getPatientNotes(patientId) {
    try {
      const { data, error } = await supabase
        .from("patient_notes")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Using mock notes data due to error:", error.message);
        return mockNotes.filter((n) => n.patient_id === patientId);
      }
      return data || [];
    } catch (error) {
      console.error("Get patient notes error:", error.message);
      return mockNotes.filter((n) => n.patient_id === patientId);
    }
  },

  // Add a note to a patient
  async addPatientNote(patientId, noteContent) {
    try {
      const { data, error } = await supabase
        .from("patient_notes")
        .insert([
          {
            patient_id: patientId,
            note_content: noteContent,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.log("Using mock note creation due to error:", error.message);
        const newNote = {
          id: `mock-note-${mockNotes.length + 1}`,
          patient_id: patientId,
          note_content: noteContent,
          created_at: new Date().toISOString(),
        };
        mockNotes.unshift(newNote);
        return newNote;
      }
      return data[0];
    } catch (error) {
      console.error("Add patient note error:", error.message);
      const newNote = {
        id: `mock-note-${mockNotes.length + 1}`,
        patient_id: patientId,
        note_content: noteContent,
        created_at: new Date().toISOString(),
      };
      mockNotes.unshift(newNote);
      return newNote;
    }
  },

  // Update a patient note
  async updatePatientNote(noteId, noteContent) {
    try {
      const { data, error } = await supabase
        .from("patient_notes")
        .update({ note_content: noteContent })
        .eq("id", noteId)
        .select();

      if (error) {
        console.log("Using mock note update due to error:", error.message);
        const noteIndex = mockNotes.findIndex((n) => n.id === noteId);
        if (noteIndex !== -1) {
          mockNotes[noteIndex].note_content = noteContent;
          return mockNotes[noteIndex];
        }
        return null;
      }
      return data[0];
    } catch (error) {
      console.error("Update patient note error:", error.message);
      const noteIndex = mockNotes.findIndex((n) => n.id === noteId);
      if (noteIndex !== -1) {
        mockNotes[noteIndex].note_content = noteContent;
        return mockNotes[noteIndex];
      }
      return null;
    }
  },

  // Delete a patient note
  async deletePatientNote(noteId) {
    try {
      const { error } = await supabase
        .from("patient_notes")
        .delete()
        .eq("id", noteId);

      if (error) {
        console.log("Using mock note deletion due to error:", error.message);
        const noteIndex = mockNotes.findIndex((n) => n.id === noteId);
        if (noteIndex !== -1) {
          mockNotes.splice(noteIndex, 1);
        }
        return true;
      }
      return true;
    } catch (error) {
      console.error("Delete patient note error:", error.message);
      const noteIndex = mockNotes.findIndex((n) => n.id === noteId);
      if (noteIndex !== -1) {
        mockNotes.splice(noteIndex, 1);
      }
      return true;
    }
  },

  // Get patient session logs
  async getPatientSessionLogs(patientId) {
    try {
      const { data, error } = await supabase
        .from("session_logs")
        .select("*")
        .eq("patient_id", patientId)
        .order("session_date", { ascending: false });

      if (error) {
        console.log("Using mock session logs due to error:", error.message);
        return mockSessionLogs.filter((s) => s.patient_id === patientId);
      }
      return data || [];
    } catch (error) {
      console.error("Get session logs error:", error.message);
      return mockSessionLogs.filter((s) => s.patient_id === patientId);
    }
  },

  // Assign patient to psychologist
  async assignPatientToPsychologist(patientId, psychologistId) {
    try {
      const { data, error } = await supabase
        .from("patients")
        .update({ assigned_psychologist_id: psychologistId })
        .eq("id", patientId)
        .select();

      if (error) {
        console.log(
          "Using mock patient assignment due to error:",
          error.message
        );
        const patientIndex = mockPatients.findIndex((p) => p.id === patientId);
        if (patientIndex !== -1) {
          mockPatients[patientIndex].assigned_psychologist_id = psychologistId;
          return mockPatients[patientIndex];
        }
        return null;
      }
      return data[0];
    } catch (error) {
      console.error("Assign patient error:", error.message);
      const patientIndex = mockPatients.findIndex((p) => p.id === patientId);
      if (patientIndex !== -1) {
        mockPatients[patientIndex].assigned_psychologist_id = psychologistId;
        return mockPatients[patientIndex];
      }
      return null;
    }
  },

  // Unassign patient from psychologist
  async unassignPatientFromPsychologist(patientId) {
    try {
      const { data, error } = await supabase
        .from("patients")
        .update({ assigned_psychologist_id: null })
        .eq("id", patientId)
        .select();

      if (error) {
        console.log(
          "Using mock patient unassignment due to error:",
          error.message
        );
        const patientIndex = mockPatients.findIndex((p) => p.id === patientId);
        if (patientIndex !== -1) {
          mockPatients[patientIndex].assigned_psychologist_id = null;
          return mockPatients[patientIndex];
        }
        return null;
      }
      return data[0];
    } catch (error) {
      console.error("Unassign patient error:", error.message);
      const patientIndex = mockPatients.findIndex((p) => p.id === patientId);
      if (patientIndex !== -1) {
        mockPatients[patientIndex].assigned_psychologist_id = null;
        return mockPatients[patientIndex];
      }
      return null;
    }
  },
};
