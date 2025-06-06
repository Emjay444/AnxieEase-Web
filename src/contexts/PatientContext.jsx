import { createContext, useContext, useState } from "react";
import { patientService } from "../services/patientService";
import { useAuth } from "./AuthContext";
import { supabase } from "../services/supabaseClient";

const PatientContext = createContext();

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
};

export const PatientProvider = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [patients, setPatients] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [patientNotes, setPatientNotes] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load patients for the current user
  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (isAdmin()) {
        // Admin can see all patients
        data = await patientService.getAllPatients();
      } else {
        // For psychologists, we need to get their actual psychologist ID from the psychologists table
        // because patients are assigned to psychologist IDs, not auth user IDs
        try {
          // First try to find by user_id
          const { data: psychData, error: psychError } = await supabase
            .from("psychologists")
            .select("id")
            .eq("user_id", user.id);

          if (psychError || !psychData || psychData.length === 0) {
            // If not found by user_id, try with email
            const { data: psychByEmail, error: emailError } = await supabase
              .from("psychologists")
              .select("id")
              .eq("email", user.email);

            if (emailError || !psychByEmail || psychByEmail.length === 0) {
              // If still not found, return empty array instead of throwing error
              console.warn(
                "No psychologist profile found. Showing empty patient list."
              );
              setPatients([]);
              return [];
            }

            // Use the first psychologist record found by email
            data = await patientService.getPatientsByPsychologist(
              psychByEmail[0].id
            );
          } else {
            // Use the first psychologist record found by user_id
            data = await patientService.getPatientsByPsychologist(
              psychData[0].id
            );
          }
        } catch (psychErr) {
          console.error(
            "Error finding psychologist profile:",
            psychErr.message
          );
          // Return empty array instead of throwing error
          setPatients([]);
          return [];
        }
      }

      setPatients(data);
      return data;
    } catch (err) {
      console.error("Load patients error:", err.message);
      setError(err.message);
      // Return empty array instead of throwing error
      setPatients([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load a single patient by ID
  const loadPatient = async (patientId) => {
    try {
      setLoading(true);
      setError(null);

      const data = await patientService.getPatientById(patientId);
      setCurrentPatient(data);

      // Load patient notes and session logs
      await loadPatientNotes(patientId);
      await loadSessionLogs(patientId);
      await loadMoodLogs(patientId);

      return data;
    } catch (err) {
      console.error("Load patient error:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load patient notes
  const loadPatientNotes = async (patientId) => {
    try {
      const data = await patientService.getPatientNotes(patientId);
      setPatientNotes(data);
      return data;
    } catch (err) {
      console.error("Load patient notes error:", err.message);
      throw err;
    }
  };

  // Load session logs
  const loadSessionLogs = async (patientId) => {
    try {
      const data = await patientService.getPatientSessionLogs(patientId);
      setSessionLogs(data);
      return data;
    } catch (err) {
      console.error("Load session logs error:", err.message);
      throw err;
    }
  };

  // Load mood logs
  const loadMoodLogs = async (patientId) => {
    try {
      console.log(
        "PatientContext: Loading mood logs for patient ID:",
        patientId
      );
      const data = await patientService.getPatientMoodLogs(patientId);
      console.log("PatientContext: Received mood logs data:", data);
      setMoodLogs(data);
      return data;
    } catch (err) {
      console.error("Load mood logs error:", err.message);
      throw err;
    }
  };

  // Add a note to a patient
  const addNote = async (patientId, noteContent) => {
    try {
      setLoading(true);
      setError(null);

      const newNote = await patientService.addPatientNote(
        patientId,
        noteContent
      );
      setPatientNotes([newNote, ...patientNotes]);

      return newNote;
    } catch (err) {
      console.error("Add note error:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a patient note
  const updateNote = async (noteId, noteContent) => {
    try {
      setLoading(true);
      setError(null);

      const updatedNote = await patientService.updatePatientNote(
        noteId,
        noteContent
      );

      // Update notes in state
      setPatientNotes(
        patientNotes.map((note) => (note.id === noteId ? updatedNote : note))
      );

      return updatedNote;
    } catch (err) {
      console.error("Update note error:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a patient note
  const deleteNote = async (noteId) => {
    try {
      setLoading(true);
      setError(null);

      await patientService.deletePatientNote(noteId);

      // Remove note from state
      setPatientNotes(patientNotes.filter((note) => note.id !== noteId));

      return true;
    } catch (err) {
      console.error("Delete note error:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search patients by name or ID
  const searchPatients = (searchTerm) => {
    if (!searchTerm) return patients;

    const term = searchTerm.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(term) ||
        patient.id.toString().includes(term)
    );
  };

  // Filter patients by mood, stress, or symptoms
  const filterPatients = (filters) => {
    if (!filters || Object.keys(filters).length === 0) return patients;

    return patients.filter((patient) => {
      let match = true;

      if (filters.mood && patient.mood) {
        match = match && patient.mood >= filters.mood;
      }

      if (filters.stress && patient.stress) {
        match = match && patient.stress >= filters.stress;
      }

      if (filters.symptoms && patient.symptoms) {
        match = match && patient.symptoms >= filters.symptoms;
      }

      return match;
    });
  };

  const value = {
    patients,
    currentPatient,
    patientNotes,
    sessionLogs,
    moodLogs,
    loading,
    error,
    loadPatients,
    loadPatient,
    loadPatientNotes,
    loadSessionLogs,
    loadMoodLogs,
    addNote,
    updateNote,
    deleteNote,
    searchPatients,
    filterPatients,
  };

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
};
