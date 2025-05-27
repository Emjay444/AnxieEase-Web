import { supabase } from "./supabaseClient";

export const appointmentService = {
  // Get appointments for a psychologist or a user
  async getAppointmentsByPsychologist(userId) {
    try {
      console.log("Fetching appointments for user ID:", userId);

      // First try to get all appointments to check what's available
      const { data: allAppointments, error: allError } = await supabase
        .from("appointments")
        .select("*")
        .limit(20);

      if (allError) {
        console.error("Error fetching all appointments:", allError.message);
      } else {
        console.log("Sample of all appointments:", allAppointments);

        // Log the structure of the first appointment to understand available fields
        if (allAppointments && allAppointments.length > 0) {
          console.log(
            "First appointment structure:",
            Object.keys(allAppointments[0])
          );
          console.log("First appointment data:", allAppointments[0]);
        }
      }

      // Now try to get all appointments
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("*");

      if (error) {
        console.error("Error fetching appointments:", error.message);
        return [];
      }

      // Filter appointments - show any appointment where the current user is involved
      // (either as a patient or as a psychologist)
      let filteredAppointments = appointments.filter(
        (appt) => appt.user_id === userId || appt.psychologist_id === userId
      );

      console.log("Filtered appointments:", filteredAppointments);

      // Format the data
      return filteredAppointments.map((appt) => {
        // Determine if the current user is the patient or the psychologist
        const isCurrentUserPatient = appt.user_id === userId;

        return {
          id: appt.id,
          patientId: appt.user_id,
          psychologistId: appt.psychologist_id,
          requestDate: appt.created_at,
          requestedDate: appt.appointment_date,
          requestedTime:
            new Date(appt.appointment_date).toLocaleTimeString() ||
            "Not specified",
          reason: appt.reason || "No reason provided",
          status: appt.status || "pending",
          urgency: appt.urgency || "medium",
          notes: appt.notes,
          responseMessage: appt.response_message,
          completed: appt.completed || false,
          // If the current user is the patient, show "Me" as patient name
          patientName: isCurrentUserPatient ? "Me" : "Patient",
          // If the current user is the psychologist, show "Me" as psychologist name
          psychologistName: !isCurrentUserPatient ? "Me" : "Dr. Smith",
        };
      });
    } catch (error) {
      console.error("Get appointments error:", error.message);
      return [];
    }
  },

  // Update appointment status
  async updateAppointmentStatus(appointmentId, status, notes) {
    try {
      console.log("Updating appointment status:", {
        appointmentId,
        status,
        notes,
      });

      const { data, error } = await supabase
        .from("appointments")
        .update({
          status: status,
          response_message: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .select();

      if (error) {
        console.error("Error updating appointment:", error.message);
        return false;
      }

      console.log("Appointment updated successfully:", data);
      return true;
    } catch (error) {
      console.error("Update appointment error:", error.message);
      return false;
    }
  },

  // Mark appointment as completed
  async markAppointmentCompleted(appointmentId, completionNotes) {
    try {
      console.log("Marking appointment as completed:", {
        appointmentId,
        completionNotes,
      });

      // Update both the status field and the completed field
      const { data, error } = await supabase
        .from("appointments")
        .update({
          status: "completed", // Store completion state in the status field
          completed: true, // Also set the completed boolean field to true
          response_message: completionNotes, // Use existing response_message field
          completion_notes: completionNotes, // Also store in completion_notes if it exists
          completion_date: new Date().toISOString(), // Set completion date
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .select();

      if (error) {
        console.error("Error marking appointment as completed:", error.message);
        return false;
      }

      console.log("Appointment marked as completed:", data);
      return true;
    } catch (error) {
      console.error("Mark appointment completed error:", error.message);
      return false;
    }
  },

  // Create a new appointment (for patients)
  async createAppointment(appointmentData) {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert([appointmentData])
        .select();

      if (error) {
        console.error("Error creating appointment:", error.message);
        return false;
      }

      return data[0];
    } catch (error) {
      console.error("Create appointment error:", error.message);
      return false;
    }
  },

  // Get appointments for a patient
  async getAppointmentsByPatient(patientId) {
    // We can reuse the same function since we've made it work for both roles
    return this.getAppointmentsByPsychologist(patientId);
  },
};
