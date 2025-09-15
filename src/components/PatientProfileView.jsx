import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Brain,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CalendarDays,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { patientService } from "../services/patientService";
import { appointmentService } from "../services/appointmentService";
import { supabase } from "../services/supabaseClient";
import { anxietyService } from "../services/anxietyService";
import SuccessModal from "./SuccessModal";
import ConfirmModal from "./ConfirmModal";
import ProfilePicture from "./ProfilePicture";

const PatientProfileView = ({ patient, onBack, psychologistId }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [patientData, setPatientData] = useState(patient); // Create state for patient data
  const [moodLogs, setMoodLogs] = useState([]);
  const [patientNotes, setPatientNotes] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientRequests, setPatientRequests] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [stats, setStats] = useState({
    totalAttacks: 0,
    avgMoodScore: 0,
    improvementTrend: 0,
    attackRatePerWeek: 0,
  });
  const [attackSeries, setAttackSeries] = useState([]);
  // Anxiety tab state
  const [anxietySummary, setAnxietySummary] = useState({
    totalAllTime: 0,
    attacksLast30: 0,
    ratePerWeek: 0,
  });
  const [anxietyRecords, setAnxietyRecords] = useState([]);
  const [attackRange, setAttackRange] = useState(30);
  const [attackSeriesFull, setAttackSeriesFull] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [attacksPage, setAttacksPage] = useState(1);
  const [attacksPageSize, setAttacksPageSize] = useState(10);
  const [severityFilter, setSeverityFilter] = useState("all"); // all, 1m, 3m, 6m, 1y
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  // UI state: confirmations
  const [noteConfirmOpen, setNoteConfirmOpen] = useState(false);
  const [noteDeleteConfirmOpen, setNoteDeleteConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Scheduling state
  const [pendingScheduleRequest, setPendingScheduleRequest] = useState(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Helpers: normalize severity (supports severity_level) and colors
  const normalizeSeverity = (r) => {
    let rawVal =
      r?.severity_level ??
      r?.severityLevel ??
      r?.severity ??
      r?.level ??
      r?.intensity;
    if (rawVal === undefined || rawVal === null) return "Unknown";
    let raw = typeof rawVal === "string" ? rawVal : String(rawVal);
    raw = raw.trim();
    if (!raw) return "Unknown";
    const num = Number(raw);
    if (!isNaN(num)) {
      // Map numeric scales (0-10 or 1-10) to Severe/Moderate/Mild
      if (num >= 8) return "Severe";
      if (num >= 4) return "Moderate";
      return "Mild";
    }
    const s = raw.toLowerCase();
    if (
      s.includes("severe") ||
      s.includes("extreme") ||
      s.includes("very high") ||
      s.includes("high")
    )
      return "Severe";
    if (s.includes("moderate") || s.includes("medium") || s.includes("avg"))
      return "Moderate";
    if (s.includes("mild") || s.includes("low") || s.includes("light"))
      return "Mild";
    return "Unknown";
  };
  const SEVERITY_COLORS = {
    Severe: "#7C3AED",
    Moderate: "#F59E0B",
    Mild: "#10B981",
    Unknown: "#9CA3AF",
  };

  useEffect(() => {
    loadPatientData();
  }, [patient.id]);

  // Update patientData when the patient prop changes
  useEffect(() => {
    setPatientData(patient);
  }, [patient]);

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // Load updated patient profile data
      const updatedPatient = await patientService.getPatientById(patient.id);
      if (updatedPatient) {
        // Update the patient data state to trigger re-render
        setPatientData(updatedPatient);
      }

      // Load mood logs
      const mood = await patientService.getPatientMoodLogs(patient.id);
      setMoodLogs(mood);

      // Load patient notes
      const notes = await patientService.getPatientNotes(patient.id);
      setPatientNotes(notes);

      // Load patient's appointments
      const appointments = await appointmentService.getAppointmentsByPatient(
        patient.id
      );
      setPatientAppointments(appointments);

      // Load pending requests for this specific patient
      const { data: requests } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", patient.id)
        .eq("psychologist_id", psychologistId)
        .in("status", ["pending", "requested"])
        .order("created_at", { ascending: false });

      setPatientRequests(requests || []);

      // Calculate stats from mood + appointments
      const completedSessions = appointments.filter(
        (apt) => apt.status === "completed"
      );
      const avgMood =
        mood.length > 0
          ? mood.reduce((sum, log) => sum + (log.stress_level_value || 5), 0) /
            mood.length
          : 0;
      const recentMoods = mood.slice(0, 7);
      const olderMoods = mood.slice(7, 14);
      const recentAvg =
        recentMoods.length > 0
          ? recentMoods.reduce(
              (sum, log) => sum + (log.stress_level_value || 5),
              0
            ) / recentMoods.length
          : 0;
      const olderAvg =
        olderMoods.length > 0
          ? olderMoods.reduce(
              (sum, log) => sum + (log.stress_level_value || 5),
              0
            ) / olderMoods.length
          : 0;
      const improvement = olderAvg - recentAvg; // Lower stress = improvement

      // Anxiety attacks
      const summary = await anxietyService.getAnxietySummary(patient.id);
      setAnxietySummary(summary);
      const allRecords = await anxietyService.getAnxietyRecordsRobust(
        patient.id
      );
      setAnxietyRecords(allRecords);
      computeSeverity(allRecords);
      const series = await anxietyService.getAnxietyTimeSeries(patient.id, 14);
      setAttackSeries(series);

      setStats({
        totalAttacks: summary.totalAllTime,
        avgMoodScore: avgMood,
        improvementTrend: improvement,
        attackRatePerWeek: summary.ratePerWeek,
      });
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load series for Anxiety tab when patient/range changes
  useEffect(() => {
    let cancelled = false;
    const loadSeries = async () => {
      try {
        const s = await anxietyService.getAnxietyTimeSeries(
          patient.id,
          attackRange
        );
        if (!cancelled) setAttackSeriesFull(s);
      } catch (e) {
        console.error("Error loading anxiety time series:", e);
        if (!cancelled) setAttackSeriesFull([]);
      }
    };
    loadSeries();
    return () => {
      cancelled = true;
    };
  }, [patient.id, attackRange]);

  // Recompute severity when records change or month/year changes
  useEffect(() => {
    const filteredRecords = filterRecordsByMonth(
      anxietyRecords,
      selectedMonth,
      selectedYear
    );
    computeSeverity(filteredRecords);
  }, [anxietyRecords, selectedMonth, selectedYear]);

  // Helper function to filter records by specific month and year
  const filterRecordsByMonth = (records, month, year) => {
    return records.filter((record) => {
      const recordDate = new Date(
        record.timestamp || record.created_at || record.date
      );
      return (
        recordDate.getMonth() === month && recordDate.getFullYear() === year
      );
    });
  };

  const computeSeverity = (records = []) => {
    const counts = { Severe: 0, Moderate: 0, Mild: 0 };
    (records || []).forEach((r) => {
      const sev = normalizeSeverity(r);
      if (counts[sev] !== undefined) counts[sev] += 1;
    });
    const data = [
      {
        category: "Severe",
        key: "Severe",
        count: counts.Severe,
        color: SEVERITY_COLORS.Severe,
      },
      {
        category: "Moderate",
        key: "Moderate",
        count: counts.Moderate,
        color: SEVERITY_COLORS.Moderate,
      },
      {
        category: "Mild",
        key: "Mild",
        count: counts.Mild,
        color: SEVERITY_COLORS.Mild,
      },
    ];
    setSeverityData(data);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await patientService.addPatientNote(patient.id, newNote, psychologistId);
      setNewNote("");
      await loadPatientData(); // Refresh to show new note
      setNoteConfirmOpen(true); // Show confirmation
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleEditNote = async (noteId, content) => {
    try {
      await patientService.updatePatientNote(noteId, content);
      setEditingNote(null);
      loadPatientData(); // Refresh
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = (noteId) => {
    setConfirmDeleteId(noteId);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await patientService.deletePatientNote(confirmDeleteId);
      setConfirmDeleteId(null);
      await loadPatientData();
      setNoteDeleteConfirmOpen(true);
    } catch (error) {
      console.error("Error deleting note:", error);
      setConfirmDeleteId(null);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const status = action === "approve" ? "approved" : "declined";
      await appointmentService.updateAppointmentStatus(requestId, status);
      loadPatientData(); // Refresh
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  const handleOpenSchedule = (request) => {
    setPendingScheduleRequest(request);
    // Set default date to today and time to 9 AM
    const today = new Date();
    setScheduledDate(today.toISOString().split("T")[0]);
    setScheduledTime("09:00");
  };

  const handleConfirmSchedule = async () => {
    if (!pendingScheduleRequest || !scheduledDate || !scheduledTime) return;

    try {
      // Combine date and time into ISO string
      const datetime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const iso = datetime.toISOString();

      // Update appointment in DB: set appointment_date and mark scheduled
      const success = await appointmentService.setAppointmentSchedule(
        pendingScheduleRequest.id,
        iso,
        "scheduled"
      );

      if (success) {
        // Close modal and refresh data
        setPendingScheduleRequest(null);
        setScheduledDate("");
        setScheduledTime("");
        loadPatientData(); // Refresh the patient data
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error);
    }
  };

  // Prepare chart data
  const moodChartData = moodLogs
    .slice(0, 14)
    .reverse()
    .map((log) => {
      const d = log.log_date ? new Date(log.log_date) : null;
      const dateLabel =
        d && !isNaN(d.getTime())
          ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "";
      const stressVal =
        typeof log.stress_level_value === "number"
          ? log.stress_level_value
          : parseFloat(log.stress_level_value) || 0;
      const moodVal =
        log.mood === "Happy"
          ? 8
          : log.mood === "Calm"
          ? 7
          : log.mood === "Neutral"
          ? 5
          : log.mood === "Anxious"
          ? 3
          : log.mood === "Sad"
          ? 2
          : 0;
      return { date: dateLabel, stress: stressVal, mood: moodVal };
    })
    .filter(
      (p) =>
        p.date && typeof p.stress === "number" && typeof p.mood === "number"
    );

  const symptomData = moodLogs.reduce((acc, log) => {
    log.symptoms?.forEach((symptom) => {
      if (symptom !== "None") {
        acc[symptom] = (acc[symptom] || 0) + 1;
      }
    });
    return acc;
  }, {});

  const symptomChartData = Object.entries(symptomData).map(
    ([symptom, count]) => ({
      name: symptom,
      value: count,
    })
  );

  const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

  // Custom label to avoid clipping and long-text overflow for pie slices
  const renderPieLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
    if (!name) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 14; // place label just outside the slice
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? "start" : "end";
    const pct = `${Math.round((percent || 0) * 100)}%`;
    const max = 18; // truncate long names to prevent overflow
    const short = name.length > max ? `${name.slice(0, max - 1)}…` : name;
    return (
      <text
        x={x}
        y={y}
        fill="#059669"
        fontSize={12}
        textAnchor={textAnchor}
        dominantBaseline="central"
      >
        {short} {pct}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Debug: Log patient data to see if avatar_url is included
  // console.log('Patient data in PatientProfileView:', patientData);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success confirmation for adding a note */}
      <SuccessModal
        isOpen={noteConfirmOpen}
        onClose={() => setNoteConfirmOpen(false)}
        title="Note saved"
        message="The note has been added to this patient's record."
        type="success"
      />
      {/* Success confirmation for deleting a note */}
      <SuccessModal
        isOpen={noteDeleteConfirmOpen}
        onClose={() => setNoteDeleteConfirmOpen(false)}
        title="Note deleted"
        message="The note has been removed from this patient's record."
        type="success"
      />
      {/* Confirm delete modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
        title="Delete note?"
        message="This will permanently remove the note from the patient's record."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
      {/* Header */}
      <div className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
        <div className="w-full mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <ProfilePicture patient={patientData} size={48} className="" />
                <div className="leading-tight">
                  <h1 className="text-xl font-bold text-gray-900">
                    {patientData.name}
                  </h1>
                  <p className="text-sm text-gray-600">Patient Profile</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  patientData.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {patientData.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Anxiety Attacks
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalAttacks}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 ring-1 ring-emerald-100">
                <BarChart3 className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Stress Level
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.avgMoodScore.toFixed(1)}/10
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 ring-1 ring-blue-100">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Improvement</p>
                <div className="flex items-center mt-1">
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.abs(stats.improvementTrend).toFixed(1)}
                  </p>
                  {stats.improvementTrend > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500 ml-2" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500 ml-2" />
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 ring-1 ring-purple-100">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Attack Rate (per week)
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.attackRatePerWeek}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 ring-1 ring-amber-100">
                <TrendingUp className="h-8 w-8 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 px-4 sm:px-6 overflow-x-auto">
              {[
                { id: "overview", name: "Overview", icon: Activity },
                { id: "anxiety", name: "Anxiety", icon: AlertTriangle },
                { id: "mood", name: "Mood Analytics", icon: Heart },
                { id: "notes", name: "Notes", icon: FileText },
                { id: "appointments", name: "Appointments", icon: Calendar },
                { id: "requests", name: "Requests", icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Patient Info */}
                  <div className="bg-gray-50 rounded-lg p-5 ring-1 ring-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Patient Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {patientData.email}
                      </div>
                      {patientData.contact_number && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {patientData.contact_number}
                        </div>
                      )}
                      {patientData.emergency_contact && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-red-700 font-medium">
                            Emergency:
                          </span>
                          <span className="ml-1">
                            {patientData.emergency_contact}
                          </span>
                        </div>
                      )}
                      {patientData.gender && (
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="capitalize">
                            {patientData.gender.toLowerCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        Joined: {patientData.date_added}
                      </div>
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        Status: {patientData.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-lg p-5 ring-1 ring-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Recent Activity
                    </h3>
                    {moodLogs.length > 0 ? (
                      <div className="space-y-2">
                        {moodLogs.slice(0, 5).map((log, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>Mood log: {log.mood}</span>
                            <span className="text-gray-500">
                              {new Date(log.log_date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        {moodLogs.length > 5 && (
                          <div className="pt-2 border-t border-gray-200">
                            <button
                              onClick={() => setActiveTab("mood")}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center"
                            >
                              <span>See more activities</span>
                              <span className="ml-1 text-gray-500">
                                ({moodLogs.length - 5} more)
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No recent activity yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Stress Level Trend (Last 2 Weeks)
                    </h3>
                    {moodChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={moodChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} allowDecimals={false} />
                          <RechartsTooltip />
                          <Line
                            type="monotone"
                            dataKey="stress"
                            stroke="#EF4444"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[220px] flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-500">
                        No mood data yet
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Common Symptoms
                    </h3>
                    {symptomChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart
                          margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
                        >
                          <Pie
                            data={symptomChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={renderPieLabel}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {symptomChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[220px] flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-500">
                        No symptom data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Anxiety Attacks (Last 2 Weeks) */}
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Anxiety Attacks (Last 2 Weeks)
                  </h3>
                  {attackSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={attackSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar
                          dataKey="count"
                          fill="#0EA5E9"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-500">
                      No attacks recorded yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Anxiety Tab */}
            {activeTab === "anxiety" && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-600">
                      Total Attacks (All-time)
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {anxietySummary.totalAllTime}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-600">
                      Last 30 Days
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {anxietySummary.attacksLast30}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-600">
                      Rate (per week)
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {anxietySummary.ratePerWeek}
                    </p>
                  </div>
                </div>

                {/* Severity Breakdown */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                    <h3 className="font-semibold text-gray-900">
                      Severity Breakdown
                    </h3>
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedMonth}
                        onChange={(e) =>
                          setSelectedMonth(parseInt(e.target.value))
                        }
                        className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {[
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ].map((month, index) => (
                          <option key={index} value={index}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedYear}
                        onChange={(e) =>
                          setSelectedYear(parseInt(e.target.value))
                        }
                        className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {Array.from(
                          { length: 5 },
                          (_, i) => new Date().getFullYear() - i
                        ).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-xs">
                      {severityData.map((s) => (
                        <div
                          key={s.key}
                          className="flex items-center gap-1 text-gray-600"
                        >
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          ></span>
                          {s.category}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {
                        [
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ][selectedMonth]
                      }{" "}
                      {selectedYear}:{" "}
                      {severityData.reduce((sum, s) => sum + s.count, 0)}{" "}
                      attacks
                    </div>
                  </div>
                  {severityData.some((s) => s.count > 0) ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={severityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="count">
                          {severityData.map((s, idx) => (
                            <Cell key={`sev-${idx}`} fill={s.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-500">
                      No severity data available
                    </div>
                  )}
                </div>

                {/* Time series with range selector */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Anxiety Attacks Over Time
                    </h3>
                    <div className="flex items-center gap-2">
                      {[7, 14, 30, 60, 90].map((d) => (
                        <button
                          key={d}
                          onClick={() => setAttackRange(d)}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${
                            attackRange === d
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  {attackSeriesFull.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={attackSeriesFull}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar
                          dataKey="count"
                          fill="#0EA5E9"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-500">
                      No data for selected range
                    </div>
                  )}
                </div>

                {/* Remove duplicate/broken block above (cleaned) */}

                {/* Recent attacks list with pagination */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Recent Attacks
                  </h3>
                  {anxietyRecords && anxietyRecords.length > 0 ? (
                    <>
                      <div className="divide-y divide-gray-100">
                        {anxietyRecords
                          .slice()
                          .sort(
                            (a, b) =>
                              (b.ts?.getTime?.() || 0) -
                              (a.ts?.getTime?.() || 0)
                          )
                          .slice(
                            (attacksPage - 1) * attacksPageSize,
                            attacksPage * attacksPageSize
                          )
                          .map((r, idx) => (
                            <div
                              key={r.id || r._id || r.uuid || idx}
                              className="py-3 flex items-start justify-between"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {r.ts
                                    ? new Date(r.ts).toLocaleString()
                                    : "Unknown time"}
                                </p>
                                <p className="text-sm text-gray-600 mt-1 flex items-center flex-wrap gap-x-2">
                                  {(() => {
                                    const sev = normalizeSeverity(r);
                                    return (
                                      <span
                                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                        style={{
                                          backgroundColor: `${SEVERITY_COLORS[sev]}20`,
                                          color: SEVERITY_COLORS[sev],
                                          border: `1px solid ${SEVERITY_COLORS[sev]}40`,
                                        }}
                                      >
                                        <span
                                          className="inline-block w-1.5 h-1.5 rounded-full"
                                          style={{
                                            backgroundColor:
                                              SEVERITY_COLORS[sev],
                                          }}
                                        />
                                        {sev}
                                      </span>
                                    );
                                  })()}
                                  {(r.trigger ||
                                    (Array.isArray(r.triggers) &&
                                      r.triggers.length)) && (
                                    <>
                                      <span className="mx-2 text-gray-300">
                                        •
                                      </span>
                                      Trigger:{" "}
                                      <span className="font-medium text-gray-800">
                                        {r.trigger ||
                                          (Array.isArray(r.triggers)
                                            ? r.triggers.join(", ")
                                            : "")}
                                      </span>
                                    </>
                                  )}
                                </p>
                                {(r.notes || r.note || r.description) && (
                                  <p className="text-sm text-gray-700 mt-1">
                                    {r.notes || r.note || r.description}
                                  </p>
                                )}
                              </div>
                              {(r.duration_minutes || r.duration) && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                  {r.duration_minutes || r.duration} min
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                          Showing {(attacksPage - 1) * attacksPageSize + 1}–
                          {Math.min(
                            attacksPage * attacksPageSize,
                            anxietyRecords.length
                          )}{" "}
                          of {anxietyRecords.length}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            className="border border-gray-200 rounded-lg px-2 py-1 text-gray-700"
                            value={attacksPageSize}
                            onChange={(e) => {
                              setAttacksPage(1);
                              setAttacksPageSize(parseInt(e.target.value, 10));
                            }}
                          >
                            {[5, 10, 20, 50].map((s) => (
                              <option key={s} value={s}>
                                {s}/page
                              </option>
                            ))}
                          </select>
                          <button
                            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                            disabled={attacksPage === 1}
                            onClick={() =>
                              setAttacksPage((p) => Math.max(1, p - 1))
                            }
                          >
                            Prev
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                            disabled={
                              attacksPage * attacksPageSize >=
                              anxietyRecords.length
                            }
                            onClick={() => setAttacksPage((p) => p + 1)}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No recorded attacks yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Mood Analytics Tab */}
            {activeTab === "mood" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Mood & Stress Trends
                  </h3>
                  {moodChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={moodChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} allowDecimals={false} />
                        <RechartsTooltip />
                        <Line
                          type="monotone"
                          dataKey="stress"
                          stroke="#EF4444"
                          strokeWidth={2}
                          name="Stress Level"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="mood"
                          stroke="#10B981"
                          strokeWidth={2}
                          name="Mood Score"
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-500">
                      No mood data yet
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Recent Mood Logs
                  </h3>
                  {moodLogs.length > 0 ? (
                    <div className="space-y-3">
                      {moodLogs.slice(0, 10).map((log, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4 ring-1 ring-gray-100"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {log.mood}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(log.log_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Stress: {log.stress_level}</span>
                            <span>
                              Symptoms: {log.symptoms?.join(", ") || "None"}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-sm text-gray-700 mt-2">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No mood logs yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-6">
                {/* Add Note */}
                <div className="bg-gray-50 rounded-lg p-4 ring-1 ring-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Add New Note
                  </h3>
                  <div className="flex space-x-3 items-start">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a note about this patient..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center self-start"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Previous Notes
                  </h3>
                  {patientNotes.length > 0 ? (
                    <div className="space-y-3">
                      {patientNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {editingNote === note.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    defaultValue={note.note_content}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    rows={3}
                                    onBlur={(e) =>
                                      handleEditNote(note.id, e.target.value)
                                    }
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setEditingNote(null)}
                                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-700">
                                  {note.note_content}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                <span>
                                  {new Date(note.created_at).toLocaleString()}
                                </span>
                                {note.psychologists && (
                                  <span className="text-emerald-600 font-medium">
                                    By: {note.psychologists.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => setEditingNote(note.id)}
                                className="p-1 text-gray-400 hover:text-emerald-600"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No notes yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-900">
                  Appointment History
                </h3>
                {patientAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {patientAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(
                                appointment.appointment_date
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {appointment.reason}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "scheduled"
                                ? "bg-blue-100 text-blue-800"
                                : appointment.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        {appointment.responseMessage && (
                          <p className="text-sm text-gray-700 mt-2">
                            {appointment.responseMessage}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No appointments yet.</p>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-900">
                  Pending Appointment Requests
                </h3>
                <div className="space-y-3">
                  {patientRequests.length > 0 ? (
                    patientRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {new Date(
                                request.appointment_date || request.created_at
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {request.reason}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() =>
                                handleRequestAction(request.id, "approve")
                              }
                              className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleRequestAction(request.id, "decline")
                              }
                              className="flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </button>
                            <button
                              onClick={() => handleOpenSchedule(request)}
                              className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
                            >
                              <CalendarDays className="h-4 w-4 mr-1" />
                              Schedule
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No pending appointment requests</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Appointment Modal */}
      {pendingScheduleRequest && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Schedule Appointment
              </h3>
              <button
                onClick={() => {
                  setPendingScheduleRequest(null);
                  setScheduledDate("");
                  setScheduledTime("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-700">
                <div className="font-medium">Patient Request</div>
                <div className="font-semibold">{patient.name}</div>
                <div className="text-gray-500">
                  {pendingScheduleRequest.reason}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Date:
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Time:
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {scheduledDate && scheduledTime && (
                <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-800">
                  <div className="font-medium">Scheduled For:</div>
                  <div>
                    {new Date(
                      `${scheduledDate}T${scheduledTime}`
                    ).toLocaleString("en-US", {
                      timeZone: "Asia/Manila",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setPendingScheduleRequest(null);
                  setScheduledDate("");
                  setScheduledTime("");
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                disabled={!scheduledDate || !scheduledTime}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfileView;
