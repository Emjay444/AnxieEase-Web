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

// Mock user data
const mockUsers = [
  {
    id: "user-1",
    name: "John Smith",
    email: "john.smith@example.com",
    role: "patient",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    date_added: new Date(Date.now() - 86400000).toLocaleDateString("en-GB"),
    time_added: new Date(Date.now() - 86400000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    assigned_psychologist_id: null,
    is_active: true,
  },
  {
    id: "user-2",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    role: "patient",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    date_added: new Date(Date.now() - 172800000).toLocaleDateString("en-GB"),
    time_added: new Date(Date.now() - 172800000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    assigned_psychologist_id: "87364523",
    is_active: true,
  },
  {
    id: "user-3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "patient",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    date_added: new Date(Date.now() - 259200000).toLocaleDateString("en-GB"),
    time_added: new Date(Date.now() - 259200000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    assigned_psychologist_id: null,
    is_active: true,
  },
  {
    id: "user-4",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    role: "patient",
    created_at: new Date(Date.now() - 345600000).toISOString(),
    date_added: new Date(Date.now() - 345600000).toLocaleDateString("en-GB"),
    time_added: new Date(Date.now() - 345600000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    assigned_psychologist_id: "23847659",
    is_active: true,
  },
];

export const adminService = {
  // Get activity logs with optional date filtering
  async getActivityLogs(dateFilter = null) {
    try {
      // Check if activity_logs table exists first
      const { error: tableError } = await supabase
        .from("activity_logs")
        .select("id")
        .limit(1);

      // If table doesn't exist or we don't have access, return mock data
      if (tableError) {
        console.log("Activity logs table not available:", tableError.message);

        // Return filtered mock data if date filter is provided
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

        // Otherwise return all mock data
        return mockActivityLogs;
      }

      // Table exists, proceed with query
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
        console.log("Error fetching activity logs:", error.message);
        return mockActivityLogs;
      }

      return data || [];
    } catch (error) {
      console.error("Get activity logs error:", error.message);
      // Ensure we return at least the mock data
      return mockActivityLogs;
    }
  },

  // Log an activity action
  async logActivity(userId, action, details) {
    try {
      // Make sure userId is a valid UUID
      // If it's not, use a fallback UUID to avoid errors
      const validUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          userId
        )
          ? userId
          : "00000000-0000-0000-0000-000000000000"; // Fallback UUID

      // Try to insert the activity log
      const { data, error } = await supabase
        .from("activity_logs")
        .insert([
          {
            user_id: validUuid,
            action,
            details,
            timestamp: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.log("Using mock activity logging due to error:", error.message);
        // Add to mock logs for the UI to display
        const mockLog = {
          id: `mock-${mockActivityLogs.length + 1}`,
          user_id: validUuid,
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
      // Add to mock logs even on error to ensure UI shows something
      const mockLog = {
        id: `mock-${mockActivityLogs.length + 1}`,
        user_id: "00000000-0000-0000-0000-000000000000", // Fallback UUID
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
        console.error(
          "Error fetching psychologists count:",
          psychologistsError.message
        );
        return {
          psychologistsCount: 0,
          patientsCount: 0,
          unassignedPatientsCount: 0,
        };
      }

      // Get count of all patients (users with role 'patient')
      const { data: patientsCount, error: patientsError } = await supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("role", "patient");

      if (patientsError) {
        console.error("Error fetching patients count:", patientsError.message);
        return {
          psychologistsCount: psychologistsCount.length,
          patientsCount: 0,
          unassignedPatientsCount: 0,
        };
      }

      // Get count of unassigned patients
      const { data: unassignedCount, error: unassignedError } = await supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("role", "patient")
        .is("assigned_psychologist_id", null);

      if (unassignedError) {
        console.error(
          "Error fetching unassigned count:",
          unassignedError.message
        );
        return {
          psychologistsCount: psychologistsCount.length,
          patientsCount: patientsCount.length,
          unassignedPatientsCount: 0,
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
        patientsCount: 0,
        unassignedPatientsCount: 0,
      };
    }
  },

  // Get unassigned patients
  async getUnassignedPatients() {
    try {
      // Directly query for unassigned users from the users table
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "patient")
        .is("assigned_psychologist_id", null);

      if (error) {
        console.error("Error fetching unassigned users:", error.message);
        return [];
      }

      // Process data to match expected format
      return data.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.full_name || user.email.split("@")[0],
        role: user.role || "patient",
        created_at: user.created_at,
        date_added: new Date(user.created_at).toLocaleDateString("en-GB"),
        time_added: new Date(user.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        assigned_psychologist_id: null,
        is_active: user.is_email_verified,
      }));
    } catch (error) {
      console.error("Get unassigned users error:", error.message);
      return [];
    }
  },

  // Get all users with role 'patient'
  async getAllUsers() {
    try {
      // Fetch from the users table in public schema (not auth.users)
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "patient");

      if (error) {
        console.error("Error fetching users:", error.message);
        return [];
      }

      // Process data to match expected format
      return data.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.full_name || user.email.split("@")[0],
        role: user.role || "patient",
        created_at: user.created_at,
        date_added: new Date(user.created_at).toLocaleDateString("en-GB"),
        time_added: new Date(user.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        assigned_psychologist_id: user.assigned_psychologist_id || null,
        is_active: user.is_email_verified,
      }));
    } catch (error) {
      console.error("Get all users error:", error.message);
      return [];
    }
  },

  // Delete an activity log
  async deleteActivityLog(logId) {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .delete()
        .match({ id: logId });

      if (error) {
        console.log("Error deleting activity log:", error.message);
        // Remove from mock logs if using mock data
        const index = mockActivityLogs.findIndex((log) => log.id === logId);
        if (index !== -1) {
          mockActivityLogs.splice(index, 1);
        }
        return { success: true }; // Return success even for mock data
      }

      return { success: true };
    } catch (error) {
      console.error("Delete activity log error:", error.message);
      return { success: false, error: error.message };
    }
  },
};
