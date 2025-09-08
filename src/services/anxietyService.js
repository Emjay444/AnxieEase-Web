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

  // Robust fetch: support both 'anxiety_records' and 'anxiety_record' table names and timestamp/date columns
  async getAnxietyRecordsRobust(patientId) {
    // Try plural first
    let records = [];
    try {
      const { data, error } = await supabase
        .from("anxiety_records")
        .select("*")
        .eq("user_id", patientId)
        .order("timestamp", { ascending: true });
      if (!error && data) records = data;
    } catch (_) {}

    // If still empty, try singular table
    if (!records || records.length === 0) {
      try {
        // Try ordering by timestamp first, then date
        let resp = await supabase
          .from("anxiety_record")
          .select("*")
          .eq("user_id", patientId)
          .order("timestamp", { ascending: true });
        if (resp.error) {
          resp = await supabase
            .from("anxiety_record")
            .select("*")
            .eq("user_id", patientId)
            .order("date", { ascending: true });
        }
        if (!resp.error && resp.data) records = resp.data;
      } catch (_) {}
    }

    // Normalize to include a Date value in 'ts'
    const normalized = (records || [])
      .map((r) => {
        const iso = r.timestamp || r.date || r.created_at;
        const ts = iso ? new Date(iso) : null;
        return { ...r, ts };
      })
      .filter((r) => r.ts && !isNaN(r.ts.getTime()));

    // Ensure ascending order
    normalized.sort((a, b) => a.ts - b.ts);
    return normalized;
  },

  // Build a daily time series for the last N days
  async getAnxietyTimeSeries(patientId, days = 30) {
    const records = await this.getAnxietyRecordsRobust(patientId);
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));

    // Initialize map with zero counts
    const map = new Map();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      map.set(key, 0);
    }

    // Count records per day
    records.forEach((r) => {
      const key = r.ts.toISOString().slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });

    // Build array for chart
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    });
    return Array.from(map.entries()).map(([key, count]) => ({
      date: formatter.format(new Date(key)),
      count,
    }));
  },

  // Summary stats
  async getAnxietySummary(patientId) {
    const records = await this.getAnxietyRecordsRobust(patientId);
    const totalAllTime = records.length;
    const now = new Date();
    const last30Start = new Date();
    last30Start.setDate(now.getDate() - 29);
    const inLast30 = records.filter(
      (r) => r.ts >= last30Start && r.ts <= now
    ).length;
    const ratePerWeek = inLast30 / 4; // approx per week over last 30 days
    return {
      totalAllTime,
      attacksLast30: inLast30,
      ratePerWeek: Number(ratePerWeek.toFixed(1)),
    };
  },
};
