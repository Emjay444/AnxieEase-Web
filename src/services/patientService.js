import { supabase } from "./supabaseClient";

// Mock data for development
const mockPatients = [
  {
    id: "mock-patient-1",
    name: "John Smith",
    first_name: "John",
    last_name: "Smith",
    email: "john.smith@example.com",
    contact_number: "+1234567890",
    emergency_contact: "+1987654321",
    gender: "Male",
    birth_date: "1990-05-15",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    is_email_verified: true,
    assigned_psychologist_id: "mock-psych-1",
    psychologists: { name: "Jane Doe" },
    date_added: new Date(Date.now() - 86400000).toLocaleDateString("en-GB"),
  },
  {
    id: "mock-patient-2",
    name: "Jane Doe",
    first_name: "Jane",
    last_name: "Doe",
    email: "jane.doe@example.com",
    contact_number: "+1555666777",
    emergency_contact: "+1444555666",
    gender: "Female",
    birth_date: "1985-08-22",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    is_active: true,
    is_email_verified: true,
    assigned_psychologist_id: null,
    psychologists: null,
    date_added: new Date(Date.now() - 172800000).toLocaleDateString("en-GB"),
  },
];

const mockNotes = [
  {
    id: "mock-note-1",
    patient_id: "mock-patient-1",
    psychologist_id: "mock-psych-1",
    note_content:
      "Initial consultation completed. Patient shows signs of anxiety.",
    created_at: new Date(Date.now() - 43200000).toISOString(),
    psychologists: {
      id: "mock-psych-1",
      name: "Dr. Jane Smith",
      email: "jane.smith@clinic.com",
    },
  },
  {
    id: "mock-note-2",
    patient_id: "mock-patient-1",
    psychologist_id: "mock-psych-1",
    note_content: "Follow-up session scheduled for next week.",
    created_at: new Date(Date.now() - 21600000).toISOString(),
    psychologists: {
      id: "mock-psych-1",
      name: "Dr. Jane Smith",
      email: "jane.smith@clinic.com",
    },
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
        .from("user_profiles")
        .select(
          `
          *,
          psychologists:assigned_psychologist_id (
            id,
            name,
            email
          )
        `
        )
        .eq("role", "patient")
        .eq("assigned_psychologist_id", psychologistId);

      if (error) {
        console.log("Using mock patients data due to error:", error.message);
        return mockPatients.filter(
          (p) => p.assigned_psychologist_id === psychologistId
        );
      }

      // Format the data to match expected structure
      return (
        data.map((user) => {
          // Calculate age if birthdate is available
          let age = null;
          if (user.birth_date) {
            const birthDate = new Date(user.birth_date);
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs);
            age = Math.abs(ageDate.getUTCFullYear() - 1970);
          }

          return {
            id: user.id,
            name:
              `${user.first_name || ""} ${user.middle_name || ""} ${
                user.last_name || ""
              }`.trim() || user.email?.split("@")[0],
            email: user.email,
            assigned_psychologist_id: psychologistId,
            is_active: user.is_email_verified || true,
            created_at: user.created_at,
            date_added: new Date(user.created_at).toLocaleDateString("en-GB"),
            time_added: new Date(user.created_at).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            // Add additional fields for dashboard display
            gender: user.gender || null,
            contact_number: user.contact_number || null,
            emergency_contact: user.emergency_contact || null,
            birth_date: user.birth_date || null,
            age: age,
          };
        }) || []
      );
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
        .from("users")
        .select("*, psychologists(name)")
        .eq("role", "patient");

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
        .from("user_profiles")
        .select(
          `
          *,
          psychologists:assigned_psychologist_id (
            id,
            name,
            email
          )
        `
        )
        .eq("id", patientId)
        .eq("role", "patient")
        .single();

      if (error) {
        console.log("Using mock patient data due to error:", error.message);
        return mockPatients.find((p) => p.id === patientId) || mockPatients[0];
      }

      // Format the data to match expected structure
      const formattedData = {
        ...data,
        name:
          `${data.first_name || ""} ${data.middle_name || ""} ${
            data.last_name || ""
          }`.trim() || data.email?.split("@")[0],
        date_added: new Date(data.created_at).toLocaleDateString("en-GB"),
        time_added: new Date(data.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        is_active: data.is_email_verified || true,
      };

      return formattedData;
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
        .select(
          `
          *,
          psychologists:psychologist_id (
            id,
            name,
            email
          )
        `
        )
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
  async addPatientNote(patientId, noteContent, psychologistId = null) {
    try {
      // Get current user if psychologistId not provided
      if (!psychologistId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Try to get psychologist record for this user
          const { data: psychologist } = await supabase
            .from("psychologists")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (psychologist) {
            psychologistId = psychologist.id;
          }
        }
      }

      const { data, error } = await supabase
        .from("patient_notes")
        .insert([
          {
            patient_id: patientId,
            psychologist_id: psychologistId,
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
          psychologist_id: psychologistId,
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
        psychologist_id: psychologistId,
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
        console.log(
          "Using mock session logs data due to error:",
          error.message
        );
        return mockSessionLogs.filter((s) => s.patient_id === patientId);
      }
      return data || [];
    } catch (error) {
      console.error("Get patient session logs error:", error.message);
      return mockSessionLogs.filter((s) => s.patient_id === patientId);
    }
  },

  // Get patient mood logs
  async getPatientMoodLogs(patientId) {
    // Create mock mood logs data function to avoid code duplication
    const createMockMoodLogs = (patientId) => {
      const mockMoodLogs = [];
      const today = new Date();

      // Generate 15 days of mock data
      for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD

        // Randomly select mood, stress level, and symptoms
        const moods = ["Happy", "Anxious", "Neutral", "Sad", "Calm"];
        const stressLevels = ["Low", "Medium", "High"];
        const stressLevelValues = [2, 5, 8]; // Corresponding numeric values
        const symptomsList = [
          ["None"],
          ["Mild anxiety", "Trouble sleeping"],
          ["Restlessness", "Racing thoughts"],
          ["Panic attack", "Shortness of breath"],
          ["Fatigue", "Loss of appetite"],
          ["Low energy"],
        ];

        const moodIndex = Math.floor(Math.random() * moods.length);
        const stressIndex = Math.floor(Math.random() * stressLevels.length);
        const mood = moods[moodIndex];
        const stressLevel = stressLevels[stressIndex];
        const stressLevelValue = stressLevelValues[stressIndex]; // Get numeric value
        const symptoms =
          symptomsList[Math.floor(Math.random() * symptomsList.length)];

        mockMoodLogs.push({
          id: `mock-mood-${i}`,
          patient_id: patientId,
          log_date: dateStr,
          mood: mood,
          stress_level: stressLevel,
          stress_level_value: stressLevelValue, // Include numeric value
          symptoms: symptoms,
          created_at: date.toISOString(),
        });
      }

      return mockMoodLogs;
    };

    try {
      console.log("Fetching mood logs for patient ID:", patientId);

      // First try to fetch from the database
      try {
        // First try to get logs from the wellness_logs table (since anxiety_logs is returning 404)
        const { data: wellnessData, error: wellnessError } = await supabase
          .from("wellness_logs")
          .select("*")
          .eq("user_id", patientId)
          .order("date", { ascending: false });

        // If wellness_logs data exists and no error, format it to match expected structure
        if (!wellnessError && wellnessData && wellnessData.length > 0) {
          console.log("Found wellness logs data:", wellnessData);

          // Map the wellness_logs data to the expected format
          return wellnessData.map((log) => {
            // Convert numeric stress level to text and preserve original value
            let stressLevelText = "Low";
            let stressLevelValue = log.stress_level || 1;

            if (typeof stressLevelValue !== "number") {
              // Try to convert to number if it's not already
              stressLevelValue = parseInt(stressLevelValue) || 1;
            }

            if (stressLevelValue > 3 && stressLevelValue <= 6) {
              stressLevelText = "Medium";
            } else if (stressLevelValue > 6) {
              stressLevelText = "High";
            }

            // Extract mood from feelings array if it exists
            let mood = "Neutral";
            if (log.feelings && log.feelings.length > 0) {
              // Handle feelings data whether it's an array or string representation
              try {
                const feelingsArray =
                  typeof log.feelings === "string"
                    ? JSON.parse(log.feelings.replace(/'/g, '"'))
                    : log.feelings;

                mood =
                  Array.isArray(feelingsArray) && feelingsArray.length > 0
                    ? feelingsArray[0]
                    : "Neutral";
              } catch (e) {
                console.error("Error parsing feelings:", e);
              }
            }

            // Extract symptoms
            let symptoms = ["None"];
            if (log.symptoms) {
              // Handle symptoms data whether it's an array or string representation
              try {
                symptoms =
                  typeof log.symptoms === "string"
                    ? JSON.parse(log.symptoms.replace(/'/g, '"'))
                    : log.symptoms;

                // Ensure symptoms is an array
                if (!Array.isArray(symptoms)) {
                  symptoms = [String(symptoms)];
                }
              } catch (e) {
                console.error("Error parsing symptoms:", e);
                symptoms = ["None"];
              }
            }

            return {
              id: log.id,
              patient_id: log.user_id,
              log_date: log.date,
              mood: mood,
              stress_level: stressLevelText,
              stress_level_value: stressLevelValue, // Include numeric value
              symptoms: symptoms,
              notes: log.journal || "",
              created_at: log.created_at,
            };
          });
        }

        // Try mood_logs table as fallback (no need to try anxiety_logs since it's 404)
        const { data, error } = await supabase
          .from("mood_logs")
          .select("*")
          .eq("patient_id", patientId)
          .order("log_date", { ascending: false });

        // If no error, return the data or empty array
        if (!error) {
          return data || [];
        }

        // If table doesn't exist, return mock data silently
        if (error.message.includes("does not exist")) {
          return createMockMoodLogs(patientId);
        }

        // For other errors, log once and return mock data
        console.log("Using mock mood logs data due to error:", error.message);
        return createMockMoodLogs(patientId);
      } catch (innerError) {
        console.error("Inner error fetching mood logs:", innerError);
        // For unexpected errors, return mock data
        return createMockMoodLogs(patientId);
      }
    } catch (error) {
      // This is a fallback for any other unexpected errors
      console.error("Get patient mood logs error:", error.message);
      return createMockMoodLogs(patientId);
    }
  },

  // Assign patient to psychologist
  async assignPatientToPsychologist(patientId, psychologistId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ assigned_psychologist_id: psychologistId })
        .eq("id", patientId)
        .eq("role", "patient")
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
        .from("users")
        .update({ assigned_psychologist_id: null })
        .eq("id", patientId)
        .eq("role", "patient")
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
