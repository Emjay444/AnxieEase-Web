import { supabase } from "./supabaseClient";

// Mock data for development
const mockActivityLogs = [
  {
    id: "mock-1",
    user_id: "admin",
    action: "Admin Login",
    details: "Admin user logged in to the system",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "mock-2",
    user_id: "admin",
    action: "View Psychologists",
    details: "Admin viewed the list of psychologists",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

const mockUnassignedPatients = [
  {
    id: "mock-patient-1",
    name: "John Smith",
    email: "john.smith@example.com",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    date_added: new Date(Date.now() - 86400000).toLocaleDateString("en-GB"),
    time_added: new Date(Date.now() - 86400000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    is_active: true,
    assigned_psychologist_id: null,
  },
  {
    id: "mock-patient-2",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    date_added: new Date(Date.now() - 172800000).toLocaleDateString("en-GB"),
    time_added: new Date(Date.now() - 172800000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    is_active: true,
    assigned_psychologist_id: null,
  },
];

export const adminService = {
  // Get activity logs with optional date filtering
  async getActivityLogs(dateFilter = null) {
    try {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("timestamp", { ascending: false });

      if (dateFilter) {
        // Format date as ISO string and filter for that day
        const selectedDate = new Date(dateFilter);
        const startOfDay = new Date(
          selectedDate.setHours(0, 0, 0, 0)
        ).toISOString();
        const endOfDay = new Date(
          selectedDate.setHours(23, 59, 59, 999)
        ).toISOString();

        query = query.gte("timestamp", startOfDay).lte("timestamp", endOfDay);
      }

      const { data, error } = await query;

      if (error) {
        console.log("Using mock activity logs due to error:", error.message);
        if (dateFilter) {
          const filterDate = new Date(dateFilter);
          return mockActivityLogs.filter((log) => {
            const logDate = new Date(log.timestamp);
            return (
              logDate.getDate() === filterDate.getDate() &&
              logDate.getMonth() === filterDate.getMonth() &&
              logDate.getFullYear() === filterDate.getFullYear()
            );
          });
        }
        return mockActivityLogs;
      }

      return data || [];
    } catch (error) {
      console.error("Get activity logs error:", error.message);
      return mockActivityLogs;
    }
  },

  // Log an activity action
  async logActivity(userId, action, details) {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .insert([
          {
            user_id: userId,
            action,
            details,
            timestamp: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.log("Using mock activity logging due to error:", error.message);
        const mockLog = {
          id: `mock-${mockActivityLogs.length + 1}`,
          user_id: userId,
          action,
          details,
          timestamp: new Date().toISOString(),
        };
        mockActivityLogs.unshift(mockLog);
        return mockLog;
      }

      return data[0];
    } catch (error) {
      console.error("Log activity error:", error.message);
      const mockLog = {
        id: `mock-${mockActivityLogs.length + 1}`,
        user_id: userId,
        action,
        details,
        timestamp: new Date().toISOString(),
      };
      mockActivityLogs.unshift(mockLog);
      return mockLog;
    }
  },

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      // Get count of active psychologists
      const { data: psychologistsCount, error: psychologistsError } =
        await supabase
          .from("psychologists")
          .select("id", { count: "exact" })
          .eq("is_active", true);

      if (psychologistsError) {
        console.log(
          "Using mock dashboard stats due to error:",
          psychologistsError.message
        );
        return {
          psychologistsCount: 0,
          patientsCount: mockUnassignedPatients.length,
          unassignedPatientsCount: mockUnassignedPatients.length,
        };
      }

      // Get count of all patients
      const { data: patientsCount, error: patientsError } = await supabase
        .from("patients")
        .select("id", { count: "exact" });

      if (patientsError) {
        console.log(
          "Using mock dashboard stats due to error:",
          patientsError.message
        );
        return {
          psychologistsCount: psychologistsCount.length,
          patientsCount: mockUnassignedPatients.length,
          unassignedPatientsCount: mockUnassignedPatients.length,
        };
      }

      // Get count of unassigned patients
      const { data: unassignedCount, error: unassignedError } = await supabase
        .from("patients")
        .select("id", { count: "exact" })
        .is("assigned_psychologist_id", null);

      if (unassignedError) {
        console.log(
          "Using mock dashboard stats due to error:",
          unassignedError.message
        );
        return {
          psychologistsCount: psychologistsCount.length,
          patientsCount: patientsCount.length,
          unassignedPatientsCount: mockUnassignedPatients.length,
        };
      }

      return {
        psychologistsCount: psychologistsCount.length,
        patientsCount: patientsCount.length,
        unassignedPatientsCount: unassignedCount.length,
      };
    } catch (error) {
      console.error("Get dashboard stats error:", error.message);
      return {
        psychologistsCount: 0,
        patientsCount: mockUnassignedPatients.length,
        unassignedPatientsCount: mockUnassignedPatients.length,
      };
    }
  },

  // Get unassigned patients
  async getUnassignedPatients() {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .is("assigned_psychologist_id", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.log(
          "Using mock unassigned patients due to error:",
          error.message
        );
        return mockUnassignedPatients;
      }

      return data || [];
    } catch (error) {
      console.error("Get unassigned patients error:", error.message);
      return mockUnassignedPatients;
    }
  },
};
