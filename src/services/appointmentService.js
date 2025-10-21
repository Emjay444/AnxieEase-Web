import { supabase } from "./supabaseClient";

export const appointmentService = {
  // Clean up mismatched appointments (when patients are reassigned)
  async cleanupMismatchedAppointments() {
    try {
      const { data, error } = await supabase.rpc('cleanup_mismatched_appointments');
      
      if (error) {
        console.error("Error cleaning up appointments:", error.message);
        return { success: false, error: error.message };
      }
      
      console.log("Appointment cleanup result:", data);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error("Cleanup mismatched appointments error:", error.message);
      return { success: false, error: error.message };
    }
  },

  // Check for appointment assignment issues
  async checkAppointmentAssignments() {
    try {
      const { data, error } = await supabase.rpc('check_appointment_assignments');
      
      if (error) {
        console.error("Error checking appointments:", error.message);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error("Check appointment assignments error:", error.message);
      return [];
    }
  },

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

      // First, fix any appointments that were wrongly expired (future appointments marked as expired)
      const fixedAppointments = await this.fixWronglyExpiredAppointments(appointments);

      // Auto-update past scheduled appointments to completed, and past pending to expired
      const afterComplete = await this.updatePastAppointmentsToCompleted(
        fixedAppointments
      );
      const updatedAppointments =
        await this.updatePastPendingAppointmentsToExpired(afterComplete);

      // Get patient names from user_profiles AND verify current assignment
      const patientIds = updatedAppointments
        .map((appt) => appt.user_id)
        .filter(Boolean);
      let patientNames = {};
      let assignedToThisPsych = new Set();

      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name, assigned_psychologist_id")
          .in("id", patientIds);

        profiles?.forEach((profile) => {
          const fullName = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ");
          patientNames[profile.id] = fullName || "Patient";
          if (profile.assigned_psychologist_id === userId) {
            assignedToThisPsych.add(profile.id);
          }
        });
      }

      // Exclude PENDING/REQUESTED appointments if the patient is no longer assigned to this psychologist
      const filteredAppointments = updatedAppointments.filter((appt) => {
        const s = (appt.status || "").toString().toLowerCase();
        const isPending = s === "pending" || s === "requested" || s === "request";
        if (!isPending) return true; // keep non-pending regardless of assignment (historical)
        // pending/requested should only show if currently assigned
        return assignedToThisPsych.has(appt.user_id);
      });

      // Format the data (normalized for UI expectations)
  return filteredAppointments.map((appt) => {
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

  // Fix appointments that were wrongly marked as expired (future appointments)
  async fixWronglyExpiredAppointments(appointments) {
    try {
      const now = new Date();
      
      // Find appointments marked as expired but with future dates
      const wronglyExpired = appointments.filter((appt) => {
        if (appt.status !== 'expired') return false;
        if (!appt.appointment_date) return false;
        const appointmentDate = new Date(appt.appointment_date);
        const isFuture = appointmentDate > now;
        
        if (isFuture) {
          console.log(`Found wrongly expired appointment ${appt.id}:`, {
            appointmentDate: appointmentDate.toISOString(),
            now: now.toISOString(),
            willRevert: true
          });
        }
        
        return isFuture;
      });

      if (wronglyExpired.length > 0) {
        console.log(
          `Reverting ${wronglyExpired.length} wrongly expired appointments back to requested status`
        );
        
        const updatePromises = wronglyExpired.map((appt) =>
          supabase
            .from("appointments")
            .update({
              status: "requested",
              response_message: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", appt.id)
        );
        
        await Promise.all(updatePromises);

        // Return updated appointments with corrected status
        return appointments.map((appt) =>
          wronglyExpired.find((p) => p.id === appt.id)
            ? { ...appt, status: "requested", response_message: null }
            : appt
        );
      }

      return appointments;
    } catch (error) {
      console.error("Error fixing wrongly expired appointments:", error);
      return appointments;
    }
  },

  async updatePastAppointmentsToCompleted(appointments) {
    try {
      const now = new Date(); // Current time, not just date
      console.log("Current time:", now.toISOString());

      // Debug: Log all appointments with their status and date
      appointments.forEach((appt) => {
        console.log(
          `Appointment ${appt.id}: status="${appt.status}", date="${appt.appointment_date}"`
        );
      });
      // Treat legacy equivalents of approved as approved too
      // "scheduled" is legacy, "approved" is the current standard
      const approvedLike = new Set([
        "approved",
        "scheduled", // legacy
        "accept",
        "accepted",
        "confirm",
        "confirmed",
      ]);

      const pastApprovedAppointments = appointments.filter((appt) => {
        if (!appt.appointment_date) {
          console.log(`Skipping appointment ${appt.id}: no appointment_date`);
          return false;
        }

        const status = (appt.status || "").toLowerCase().trim();
        if (!approvedLike.has(status)) {
          console.log(
            `Skipping appointment ${appt.id}: status is "${status}" not approved-like`
          );
          return false;
        }

        const appointmentDate = new Date(appt.appointment_date);
        console.log(
          `Appointment ${
            appt.id
          }: date=${appointmentDate.toISOString()}, isPast=${
            appointmentDate < now
          }`
        );

        return appointmentDate < now;
      });

      console.log(
        `Found ${pastApprovedAppointments.length} past approved appointments to complete:`,
        pastApprovedAppointments.map((a) => ({
          id: a.id,
          date: a.appointment_date,
          status: a.status,
        }))
      );

      if (pastApprovedAppointments.length > 0) {
        console.log(
          `Auto-completing ${pastApprovedAppointments.length} past appointments`
        );

        const updatePromises = pastApprovedAppointments.map((appt) =>
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
          const isPastApproved = pastApprovedAppointments.find(
            (p) => p.id === appt.id
          );
          if (isPastApproved) {
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
      const now = new Date(); // Current time, not just date
      const pendingLike = new Set(["pending", "requested", "request"]);

      const pastPending = appointments.filter((appt) => {
        if (!appt.appointment_date) return false;
        const status = (appt.status || "").toLowerCase().trim();
        if (!pendingLike.has(status)) return false;
        const appointmentDate = new Date(appt.appointment_date);
        
        // Log for debugging
        console.log(`Checking appointment ${appt.id}:`, {
          appointmentDate: appointmentDate.toISOString(),
          now: now.toISOString(),
          isPast: appointmentDate < now,
          status: appt.status
        });
        
        return appointmentDate < now;
      });

      if (pastPending.length > 0) {
        console.log(
          `Auto-expiring ${pastPending.length} past pending appointments`,
          pastPending.map(a => ({ id: a.id, date: a.appointment_date }))
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

      // Get patient names AND verify they are still assigned to this psychologist
      const patientIds = requestRows
        .map((appt) => appt.user_id)
        .filter(Boolean);
      let patientNames = {};
      let currentlyAssignedPatientIds = new Set();

      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name, assigned_psychologist_id")
          .in("id", patientIds);

        console.log("Checking patient assignments for psychologist:", psychologistId);
        console.log("Patient profiles found:", profiles);

        profiles?.forEach((profile) => {
          const fullName = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ");
          patientNames[profile.id] = fullName || "Patient";
          
          console.log(`Patient ${profile.id} (${fullName}) assigned to:`, profile.assigned_psychologist_id);
          console.log(`Does it match current psychologist ${psychologistId}?`, profile.assigned_psychologist_id === psychologistId);
          
          // Track which patients are currently assigned to this psychologist
          if (profile.assigned_psychologist_id === psychologistId) {
            currentlyAssignedPatientIds.add(profile.id);
          }
        });
        
        console.log("Currently assigned patient IDs:", Array.from(currentlyAssignedPatientIds));
        console.log("Total request rows before filtering:", requestRows.length);
      }

      // Filter out requests from patients who are no longer assigned to this psychologist
      const validRequests = requestRows.filter((appt) => 
        currentlyAssignedPatientIds.has(appt.user_id)
      );
      
      console.log("Valid requests after filtering:", validRequests.length);
      console.log("Filtered out:", requestRows.length - validRequests.length, "requests from unassigned patients");

      return validRequests.map((appt) => {
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
        .in("status", ["approved"]) // Only check approved appointments
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
        status === "approved" ||
        status === "scheduled" || // legacy
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
