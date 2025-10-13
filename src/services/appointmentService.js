import { supabase } from "./supabaseClient";

export const appointmentService = {
  // Get appointments for a psychologist or a user
  async getAppointmentsByPsychologist(userId) {
    try {
      console.log("Fetching appointments for psychologist ID:", userId);

      // Get appointments from your existing appointments table
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("psychologist_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error.message);
        return [];
      }

      console.log("Found appointments:", appointments);

      // Auto-update past scheduled appointments to completed, and past pending to expired
      const afterComplete = await this.updatePastAppointmentsToCompleted(
        appointments
      );
      const updatedAppointments =
        await this.updatePastPendingAppointmentsToExpired(afterComplete);

      // Get patient names from user_profiles
      const patientIds = updatedAppointments
        .map((appt) => appt.user_id)
        .filter(Boolean);
      let patientNames = {};

      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name")
          .in("id", patientIds);

        profiles?.forEach((profile) => {
          const fullName = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ");
          patientNames[profile.id] = fullName || "Patient";
        });
      }

      // Format the data (normalized for UI expectations)
      return updatedAppointments.map((appt) => {
        const rawStatus = (appt.status || "pending").toLowerCase();
        const status = rawStatus === "canceled" ? "cancelled" : rawStatus;
        const patientName = patientNames[appt.user_id] || "Patient";

        return {
          id: appt.id,
          patientId: appt.user_id,
          psychologistId: appt.psychologist_id,
          // Keep the raw datetime for compatibility with components using appointment_date
          appointment_date: appt.appointment_date,
          requestDate: appt.created_at,
          requestedDate: appt.appointment_date,
          requestedTime: appt.appointment_date
            ? new Date(appt.appointment_date).toLocaleTimeString()
            : "Not specified",
          reason: appt.reason || "No reason provided",
          status,
          urgency: "medium",
          notes: appt.completion_notes || "",
          responseMessage: appt.response_message || "",
          completed: appt.completed || false,
          // Commonly referenced fields by UI
          patient_name: patientName,
          appointment_type: "Consultation",
          patientName: patientName,
          psychologistName: "Me",
        };
      });
    } catch (error) {
      console.error("Get appointments error:", error.message);
      return [];
    }
  },

  // Helper method to update past scheduled appointments to completed
  async updatePastAppointmentsToCompleted(appointments) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      console.log("Today's date (start of day):", today.toISOString());

      // Debug: Log all appointments with their status and date
      appointments.forEach((appt) => {
        console.log(
          `Appointment ${appt.id}: status="${appt.status}", date="${appt.appointment_date}"`
        );
      });
      // Treat legacy equivalents of scheduled as scheduled too
      const scheduledLike = new Set([
        "scheduled",
        "approved",
        "accept",
        "accepted",
        "confirm",
        "confirmed",
      ]);

      const pastScheduledAppointments = appointments.filter((appt) => {
        if (!appt.appointment_date) {
          console.log(`Skipping appointment ${appt.id}: no appointment_date`);
          return false;
        }

        const status = (appt.status || "").toLowerCase().trim();
        if (!scheduledLike.has(status)) {
          console.log(
            `Skipping appointment ${appt.id}: status is "${status}" not scheduled-like`
          );
          return false;
        }

        const appointmentDate = new Date(appt.appointment_date);
        appointmentDate.setHours(0, 0, 0, 0);
        console.log(
          `Appointment ${
            appt.id
          }: date=${appointmentDate.toISOString()}, isPast=${
            appointmentDate < today
          }`
        );

        return appointmentDate < today;
      });

      console.log(
        `Found ${pastScheduledAppointments.length} past scheduled appointments to complete:`,
        pastScheduledAppointments.map((a) => ({
          id: a.id,
          date: a.appointment_date,
          status: a.status,
        }))
      );

      if (pastScheduledAppointments.length > 0) {
        console.log(
          `Auto-completing ${pastScheduledAppointments.length} past appointments`
        );

        const updatePromises = pastScheduledAppointments.map((appt) =>
          supabase
            .from("appointments")
            .update({
              status: "completed",
              completion_notes: "Auto-completed past appointment",
              updated_at: new Date().toISOString(),
            })
            .eq("id", appt.id)
        );

        const results = await Promise.all(updatePromises);
        console.log("Update results:", results);

        // Return updated appointments with new status
        return appointments.map((appt) => {
          const isPastScheduled = pastScheduledAppointments.find(
            (p) => p.id === appt.id
          );
          if (isPastScheduled) {
            console.log(`Marking appointment ${appt.id} as completed`);
            return { ...appt, status: "completed" };
          }
          return appt;
        });
      }

      return appointments;
    } catch (error) {
      console.error("Error updating past appointments:", error);
      return appointments; // Return original if update fails
    }
  },

  // Helper method to update past pending/requested appointments to expired
  async updatePastPendingAppointmentsToExpired(appointments) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pendingLike = new Set(["pending", "requested", "request"]);

      const pastPending = appointments.filter((appt) => {
        if (!appt.appointment_date) return false;
        const status = (appt.status || "").toLowerCase().trim();
        if (!pendingLike.has(status)) return false;
        const d = new Date(appt.appointment_date);
        d.setHours(0, 0, 0, 0);
        return d < today;
      });

      if (pastPending.length > 0) {
        console.log(
          `Auto-expiring ${pastPending.length} past pending appointments`
        );
        const updatePromises = pastPending.map((appt) =>
          supabase
            .from("appointments")
            .update({
              status: "expired",
              response_message: "Auto-expired pending request past date",
              updated_at: new Date().toISOString(),
            })
            .eq("id", appt.id)
        );
        await Promise.all(updatePromises);

        // Reflect updates locally as well
        return appointments.map((appt) =>
          pastPending.find((p) => p.id === appt.id)
            ? { ...appt, status: "expired" }
            : appt
        );
      }

      return appointments;
    } catch (error) {
      console.error("Error expiring past pending appointments:", error);
      return appointments;
    }
  },

  // Get pending appointment requests for a psychologist
  async getPendingRequestsByPsychologist(psychologistId) {
    try {
      // Fetch all appointments for this psychologist; we'll filter in JS to be case-agnostic
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("psychologist_id", psychologistId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending requests:", error.message);
        return [];
      }

      // Only show as "requests" when status is pending/requested
      const requestRows = (data || []).filter((appt) => {
        const status = (appt.status || "").toString().toLowerCase();
        return (
          status === "pending" || status === "requested" || status === "request"
        );
      });

      // Get patient names
      const patientIds = requestRows
        .map((appt) => appt.user_id)
        .filter(Boolean);
      let patientNames = {};

      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name")
          .in("id", patientIds);

        profiles?.forEach((profile) => {
          const fullName = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ");
          patientNames[profile.id] = fullName || "Patient";
        });
      }

      return requestRows.map((appt) => {
        // Show the explicit requested appointment date/time if provided
        const d = appt.appointment_date
          ? new Date(appt.appointment_date)
          : null;
        const requestedDate = d
          ? d.toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Manila",
            })
          : "";
        const requestedTime = d
          ? d.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Manila",
            })
          : "";

        const normStatus = (appt.status || "pending").toString().toLowerCase();
        const status = normStatus === "canceled" ? "cancelled" : normStatus;
        return {
          id: appt.id,
          patientId: appt.user_id,
          patientName: patientNames[appt.user_id] || "Patient",
          requestedDate,
          requestedTime,
          message: appt.reason || "Appointment request",
          status,
        };
      });
    } catch (err) {
      console.error("getPendingRequestsByPsychologist error:", err.message);
      return [];
    }
  },

  // Check for appointment time conflicts
  async checkTimeConflicts(
    psychologistId,
    appointmentDate,
    excludeAppointmentId = null
  ) {
    try {
      const appointmentTime = new Date(appointmentDate);

      // Check for appointments within 1 hour window (30 min before and after)
      const startWindow = new Date(appointmentTime.getTime() - 30 * 60 * 1000);
      const endWindow = new Date(appointmentTime.getTime() + 30 * 60 * 1000);

      let query = supabase
        .from("appointments")
        .select("id, appointment_date, status")
        .eq("psychologist_id", psychologistId)
        .in("status", ["scheduled", "approved", "accepted"]) // Only check accepted appointments
        .gte("appointment_date", startWindow.toISOString())
        .lte("appointment_date", endWindow.toISOString());

      // Exclude the current appointment if we're updating it
      if (excludeAppointmentId) {
        query = query.neq("id", excludeAppointmentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error checking time conflicts:", error.message);
        return { hasConflict: false, conflicts: [] };
      }

      return {
        hasConflict: data.length > 0,
        conflicts: data,
      };
    } catch (error) {
      console.error("Check time conflicts error:", error.message);
      return { hasConflict: false, conflicts: [] };
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

      // If we're scheduling/accepting an appointment, check for conflicts first
      if (
        status === "scheduled" ||
        status === "approved" ||
        status === "accepted"
      ) {
        // First get the appointment details to check for conflicts
        const { data: appointmentData, error: fetchError } = await supabase
          .from("appointments")
          .select("psychologist_id, appointment_date")
          .eq("id", appointmentId)
          .single();

        if (fetchError) {
          console.error(
            "Error fetching appointment for conflict check:",
            fetchError.message
          );
          return false;
        }

        if (
          appointmentData?.appointment_date &&
          appointmentData?.psychologist_id
        ) {
          const conflictCheck = await this.checkTimeConflicts(
            appointmentData.psychologist_id,
            appointmentData.appointment_date,
            appointmentId
          );

          if (conflictCheck.hasConflict) {
            console.warn("Time conflict detected:", conflictCheck.conflicts);
            // Return error object instead of false to provide more context
            return {
              success: false,
              error:
                "Time conflict detected. There is already an accepted appointment within 1 hour of this time slot.",
              conflicts: conflictCheck.conflicts,
            };
          }
        }
      }

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
      const payload = {
        status: "requested",
        ...appointmentData,
      };

      // Normalize appointment_date to handle Asia/Manila timezone consistently
      if (
        payload.appointment_date &&
        typeof payload.appointment_date === "string"
      ) {
        const s = payload.appointment_date;
        const hasTZ = /[zZ]|[\+\-]\d{2}:?\d{2}$/.test(s);
        // If no timezone is present, assume Asia/Manila local time (Philippines timezone)
        if (!hasTZ) {
          // Accept formats like "YYYY-MM-DD HH:mm" or "YYYY-MM-DDTHH:mm" 
          const normalized = s.trim().replace(" ", "T");
          // Append Asia/Manila offset (+08:00) and convert to UTC ISO for database storage
          const withTimezone = `${normalized}${normalized.includes(":") ? "" : "T00:00"}+08:00`;
          const iso = new Date(withTimezone).toISOString();
          payload.appointment_date = iso;
          console.log(`Timezone conversion: ${s} → ${withTimezone} → ${iso}`);
        }
      }
      const { data, error } = await supabase
        .from("appointments")
        .insert([payload])
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
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", patientId)
        .order("appointment_date", { ascending: false });

      if (error) {
        console.error("Error fetching patient appointments:", error.message);
        return [];
      }

      return (data || []).map((appt) => {
        const rawStatus = (appt.status || "pending").toLowerCase();
        const status = rawStatus === "canceled" ? "cancelled" : rawStatus;
        return {
          id: appt.id,
          appointment_date: appt.appointment_date,
          reason: appt.reason || "No reason provided",
          status,
          completion_notes: appt.completion_notes || "",
          response_message: appt.response_message || "",
          created_at: appt.created_at,
        };
      });
    } catch (error) {
      console.error("Get patient appointments error:", error.message);
      return [];
    }
  },

  // Note: updateAppointmentStatus with notes is already defined above. Remove duplicate minimal version.
};
