import { supabase } from "./supabaseClient";

export const anxietyService = {
  // Fetch anxiety records for a specific patient
  async getAnxietyRecords(patientId) {
    try {
      console.log("Fetching anxiety records for patient:", patientId);

      const { data, error } = await supabase
        .from("anxiety_records")
        .select("*")
        .eq("user_id", patientId)
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Error fetching anxiety records:", error);
        return [];
      }

      console.log("Fetched anxiety records:", data);
      return data || [];
    } catch (error) {
      console.error("Error in getAnxietyRecords:", error);
      return [];
    }
  },

  // Get wellness logs count
  async getWellnessLogsCount(patientId) {
    try {
      console.log("Fetching wellness logs count for patient:", patientId);

      // Get the current month's start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const today = now.toISOString().split("T")[0];

      console.log("Fetching logs between:", startOfMonth, "and", today);

      const { data, error } = await supabase
        .from("wellness_logs")
        .select("*")
        .eq("user_id", patientId)
        .gte("date", startOfMonth)
        .lte("date", today);

      if (error) {
        console.error("Error fetching wellness logs:", error);
        return 0;
      }

      console.log("Found wellness logs:", data);
      return data?.length || 0;
    } catch (error) {
      console.error("Error getting wellness logs count:", error);
      return 0;
    }
  },

  // Get statistics for anxiety records
  async getAnxietyStats(patientId) {
    try {
      const records = await this.getAnxietyRecords(patientId);
      const wellnessLogsCount = await this.getWellnessLogsCount(patientId);

      console.log("Calculating stats with:", {
        anxietyRecords: records.length,
        wellnessLogs: wellnessLogsCount,
      });

      if (!records.length) {
        return {
          averageAttacksPerWeek: 0,
          totalAttacksThisMonth: 0,
          patientLogsThisMonth: wellnessLogsCount,
        };
      }

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // Filter records for this month
      const thisMonthRecords = records.filter((record) => {
        const recordDate = new Date(record.timestamp);
        return (
          recordDate.getMonth() === thisMonth &&
          recordDate.getFullYear() === thisYear
        );
      });

      // Calculate total attacks this month
      const totalAttacksThisMonth = thisMonthRecords.length;

      // Calculate average attacks per week
      const weeksInMonth = 4; // Approximate
      const averageAttacksPerWeek = totalAttacksThisMonth / weeksInMonth;

      const stats = {
        averageAttacksPerWeek: parseFloat(averageAttacksPerWeek.toFixed(1)),
        totalAttacksThisMonth,
        patientLogsThisMonth: wellnessLogsCount,
      };

      console.log("Calculated stats:", stats);
      return stats;
    } catch (error) {
      console.error("Error calculating anxiety stats:", error);
      return {
        averageAttacksPerWeek: 0,
        totalAttacksThisMonth: 0,
        patientLogsThisMonth: 0,
      };
    }
  },
};
