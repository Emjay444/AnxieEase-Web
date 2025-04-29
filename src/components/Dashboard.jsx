import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePatient } from "../contexts/PatientContext";
import LogoutButton from "./LogoutButton";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const patients = [
  {
    id: "p1",
    name: "Brooklyn Simmons",
    avatar: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
    age: 28,
    gender: "Female",
    diagnosis: "Generalized Anxiety Disorder",
    medications: ["Sertraline", "Buspirone"],
    emergencyContact: {
      name: "John Simmons",
      relationship: "Brother",
      phone: "(555) 123-4567"
    }
  },
  {
    id: "p2",
    name: "Kristin Watson",
    avatar: "https://cdn-icons-png.flaticon.com/512/2922/2922656.png",
    age: 32,
    gender: "Female",
    diagnosis: "Panic Disorder",
    medications: ["Escitalopram", "Alprazolam"],
    emergencyContact: {
      name: "Sarah Watson",
      relationship: "Sister",
      phone: "(555) 987-6543"
    }
  },
];

const stats = [
  { label: "Average Attacks", value: "1.1", sub: "Per week", status: "Normal" },
  { label: "Total Attacks", value: "8", sub: "This Month", status: "Normal" },
  { label: "Patient logs", value: "5", sub: "This Month", status: "Normal" },
];

// Function to get all dates in current month
const getDatesInMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = 3; // April is 3 (0-based index)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  return Array.from({ length: daysInMonth }, (_, i) => {
    // Format date as YYYY-MM-DD with padded days
    return `2024-04-${String(i + 1).padStart(2, '0')}`;
  }).reverse(); // Reverse to show most recent dates first
};

// Helper function to format display date
const formatDisplayDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

// Sample mood logs data - using Map for easier date lookup
const moodLogsData = new Map([
  ["2024-04-30", { 
    mood: "Happy",
    stressLevel: "Low",
    symptoms: ["None"]
  }],
  ["2024-04-29", { 
    mood: "Anxious",
    stressLevel: "High",
    symptoms: ["Restlessness", "Racing thoughts"]
  }],
  ["2024-04-28", { 
    mood: "Neutral",
    stressLevel: "Medium",
    symptoms: ["Mild headache"]
  }],
  ["2024-04-27", { 
    mood: "Sad",
    stressLevel: "High",
    symptoms: ["Fatigue", "Loss of appetite"]
  }],
  ["2024-04-26", { 
    mood: "Calm",
    stressLevel: "Low",
    symptoms: ["None"]
  }],
  ["2024-04-25", { 
    mood: "Happy",
    stressLevel: "Low",
    symptoms: ["None"]
  }],
  ["2024-04-24", { 
    mood: "Anxious",
    stressLevel: "Medium",
    symptoms: ["Mild anxiety", "Trouble sleeping"]
  }],
  ["2024-04-23", { 
    mood: "Neutral",
    stressLevel: "Low",
    symptoms: ["None"]
  }],
  ["2024-04-22", { 
    mood: "Happy",
    stressLevel: "Low",
    symptoms: ["None"]
  }],
  ["2024-04-21", { 
    mood: "Anxious",
    stressLevel: "High",
    symptoms: ["Panic attack", "Shortness of breath"]
  }],
  ["2024-04-20", { 
    mood: "Calm",
    stressLevel: "Low",
    symptoms: ["None"]
  }],
  ["2024-04-19", { 
    mood: "Sad",
    stressLevel: "Medium",
    symptoms: ["Low energy"]
  }],
  ["2024-04-18", { 
    mood: "Happy",
    stressLevel: "Low",
    symptoms: ["None"]
  }],
  ["2024-04-17", { 
    mood: "Neutral",
    stressLevel: "Medium",
    symptoms: ["Mild tension"]
  }],
  ["2024-04-16", { 
    mood: "Calm",
    stressLevel: "Low",
    symptoms: ["None"]
  }]
]);

// Sample appointment requests data
const sampleAppointmentRequests = [
  {
    id: "ar1",
    patientId: "p1",
    patientName: "John Smith",
    requestDate: "2023-07-15T10:30:00Z",
    requestedDateTime: "2023-07-20T14:00:00Z",
    reason: "Need to discuss recent panic attacks",
    status: "pending", // pending, approved, declined
    urgency: "medium", // low, medium, high
    notes: ""
  },
  {
    id: "ar2",
    patientId: "p3",
    patientName: "Sarah Johnson",
    requestDate: "2023-07-14T15:45:00Z",
    requestedDateTime: "2023-07-19T11:30:00Z",
    reason: "Medication follow-up",
    status: "pending",
    urgency: "low",
    notes: ""
  },
  {
    id: "ar3",
    patientId: "p2",
    patientName: "Emily Brown",
    requestDate: "2023-07-12T09:15:00Z",
    requestedDateTime: "2023-07-18T16:00:00Z",
    reason: "Emergency - severe anxiety episode yesterday",
    status: "approved",
    urgency: "high",
    notes: "Approved for urgent consultation"
  },
  {
    id: "ar4",
    patientId: "p4",
    patientName: "Michael Wilson",
    requestDate: "2023-07-10T13:20:00Z",
    requestedDateTime: "2023-07-17T10:00:00Z",
    reason: "Regular check-in",
    status: "declined",
    urgency: "low",
    notes: "Unavailable on requested date. Please reschedule for the following week."
  }
];

// Sample patient notes data
const patientNotes = {
  p1: [
    { id: "n1", date: "2023-07-10T14:30:00Z", title: "Initial Assessment", content: "Patient shows signs of generalized anxiety disorder. Recommended CBT and will monitor progress over next 3 sessions.", tags: ["assessment", "GAD", "CBT"] },
    { id: "n2", date: "2023-07-05T10:15:00Z", title: "Follow-up Session", content: "Patient reports reduced anxiety symptoms after starting medication. Sleep has improved but still experiences morning anxiety.", tags: ["follow-up", "medication", "sleep"] }
  ],
  p2: [
    { id: "n3", date: "2023-07-12T11:00:00Z", title: "Crisis Intervention", content: "Emergency session after panic attack at work. Discussed coping strategies and breathing techniques. Will follow up in 3 days.", tags: ["crisis", "panic attack", "techniques"] },
    { id: "n4", date: "2023-07-08T15:45:00Z", title: "Therapy Progress", content: "Making good progress with exposure therapy. Patient successfully completed two exposure exercises this week with reduced anxiety response.", tags: ["exposure therapy", "progress"] }
  ]
};

const Dashboard = () => {
  const { user, userRole } = useAuth();
  const {
    patients: apiPatients,
    loading,
    error,
    loadPatients,
    searchPatients,
    filterPatients,
  } = usePatient();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchId, setSearchId] = useState("");
  const [showPatientLogs, setShowPatientLogs] = useState(false);
  const [filters, setFilters] = useState({
    mood: "",
    stress: "",
    symptoms: "",
  });
  const [filteredPatients, setFilteredPatients] = useState([]);
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0].id);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Load patients on component mount
  React.useEffect(() => {
    loadPatients();
    // eslint-disable-next-line
  }, []);

  // Update filtered patients when search term or filters change
  React.useEffect(() => {
    let result = apiPatients;

    // Apply search
    if (searchTerm) {
      result = searchPatients(searchTerm);
    }

    // Apply ID search
    if (searchId) {
      result = result.filter(patient => patient.id.toString().includes(searchId));
    }

    // Apply filters
    const activeFilters = {};
    if (filters.mood) activeFilters.mood = parseInt(filters.mood);
    if (filters.stress) activeFilters.stress = parseInt(filters.stress);
    if (filters.symptoms) activeFilters.symptoms = parseInt(filters.symptoms);

    if (Object.keys(activeFilters).length > 0) {
      result = filterPatients(activeFilters);
    }

    setFilteredPatients(result);
  }, [apiPatients, searchTerm, searchId, filters, searchPatients, filterPatients]);

  const handlePatientClick = (patientId) => {
    navigate(`/patient/${patientId}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchIdChange = (e) => {
    setSearchId(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSearchId("");
    setFilters({
      mood: "",
      stress: "",
      symptoms: "",
    });
  };

  // Update chartData to cover a full month (Jan 1 to Jan 31)
  const chartData = {
    labels: Array.from({ length: 31 }, (_, i) => `Jan ${i + 1}`),
    datasets: [
      {
        label: "Attacks",
        data: [
          1, 2, 1, 3, 2, 1, 2, 2, 1, 3, 2, 1, 2, 1, 2, 1, 3, 2, 1, 2, 2, 1, 3,
          2, 1, 2, 1, 2, 1, 3, 2,
        ],
        fill: false,
        borderColor: "#22c55e",
        backgroundColor: "#e6f9ed",
        tension: 0.4,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  const moodChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        max: 5,
        ticks: { 
          stepSize: 1,
          callback: function(value) {
            const moodLabels = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Excellent'];
            return moodLabels[value];
          }
        }
      },
    },
  };

  const handlePatientLogsClick = () => {
    setShowPatientLogs(!showPatientLogs);
  };

  // Get mood badge color
  const getMoodColor = (mood) => {
    const colors = {
      "Happy": { bg: "#e6f9ed", text: "#22c55e" },
      "Anxious": { bg: "#fae8ff", text: "#d946ef" },
      "Neutral": { bg: "#f3f4f6", text: "#6b7280" },
      "Sad": { bg: "#dbeafe", text: "#3b82f6" },
      "Calm": { bg: "#e6f9ed", text: "#22c55e" }
    };
    return colors[mood] || { bg: "#f3f4f6", text: "#6b7280" };
  };

  // Get stress level colors
  const getStressLevelColor = (level) => {
    const colors = {
      "High": { bg: "#fee2e2", text: "#ef4444" },
      "Medium": { bg: "#fef3c7", text: "#f59e0b" },
      "Low": { bg: "#e6f9ed", text: "#22c55e" }
    };
    return colors[level] || { bg: "#f3f4f6", text: "#6b7280" };
  };

  // Inside the Dashboard component, add these constants for tag colors
  const TAG_COLORS = [
    { bg: '#e6f7ff', text: '#0072b1' }, // blue
    { bg: '#f6ffed', text: '#52c41a' }, // green
    { bg: '#fff7e6', text: '#fa8c16' }, // orange
    { bg: '#fff0f6', text: '#eb2f96' }, // pink
    { bg: '#f9f0ff', text: '#722ed1' }, // purple
    { bg: '#fcffe6', text: '#a0d911' }  // lime
  ];

  // Replace the tag color function
  const getTagColor = (tag) => {
    // Generate a consistent index based on tag string
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % TAG_COLORS.length;
    return TAG_COLORS[index];
  };

  // Appointment requests state
  const [showAppointments, setShowAppointments] = useState(false);
  const [appointmentRequests, setAppointmentRequests] = useState(sampleAppointmentRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseNotes, setResponseNotes] = useState("");
  const [activeRequestsTab, setActiveRequestsTab] = useState("all");
  
  // Patient notes state
  const [showNotes, setShowNotes] = useState(false);
  const [currentNotes, setCurrentNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [searchNotes, setSearchNotes] = useState("");

  // Load notes for selected patient
  React.useEffect(() => {
    if (selectedPatientId && patientNotes[selectedPatientId]) {
      setCurrentNotes(patientNotes[selectedPatientId]);
    } else {
      setCurrentNotes([]);
    }
  }, [selectedPatientId]);

  // Filter appointment requests
  const getFilteredRequests = () => {
    if (activeRequestsTab === "all") return appointmentRequests;
    return appointmentRequests.filter(request => request.status === activeRequestsTab);
  };

  // Handle appointment request response
  const handleRequestResponse = (requestId, status) => {
    if (status === "declined" && !responseNotes.trim()) {
      alert("Please provide notes when declining a request");
      return;
    }

    setAppointmentRequests(
      appointmentRequests.map(req => 
        req.id === requestId 
          ? { ...req, status, notes: responseNotes } 
          : req
      )
    );
    
    setSelectedRequest(null);
    setResponseNotes("");
  };

  // Add new note
  const handleAddNote = () => {
    // Validate inputs
    if (!newNote.title.trim() || !newNote.content.trim()) {
      alert("Please enter a title and content for the note");
      return;
    }

    const noteId = `n${Date.now()}`;
    const newNoteObj = {
      id: noteId,
      date: new Date().toISOString(),
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
    };

    // Update state
    setCurrentNotes([newNoteObj, ...currentNotes]);
    
    // Reset form
    setNewNote({ title: "", content: "", tags: "" });
  };

  // Update note
  const handleUpdateNote = () => {
    if (!editingNote.title.trim() || !editingNote.content.trim()) {
      alert("Please enter a title and content for the note");
      return;
    }

    setCurrentNotes(
      currentNotes.map(note => 
        note.id === editingNote.id 
          ? { 
              ...note, 
              title: editingNote.title,
              content: editingNote.content,
              tags: typeof editingNote.tags === 'string' 
                ? editingNote.tags.split(",").map(tag => tag.trim()).filter(tag => tag) 
                : editingNote.tags
            } 
          : note
      )
    );
    
    setEditingNote(null);
  };

  // Delete note
  const handleDeleteNote = (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      setCurrentNotes(currentNotes.filter(note => note.id !== noteId));
    }
  };

  // Filter notes based on search
  const filteredNotes = searchNotes.trim() 
    ? currentNotes.filter(note => 
        note.title.toLowerCase().includes(searchNotes.toLowerCase()) || 
        note.content.toLowerCase().includes(searchNotes.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchNotes.toLowerCase()))
      )
    : currentNotes;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="lead">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6faf7" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 24, borderBottom: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>
            Patients Details
          </h3>
          <input
            type="text"
            placeholder="Search Patients"
            style={{
              width: "100%",
              marginTop: 16,
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <input
            type="text"
            placeholder="Search by ID"
            style={{
              width: "100%",
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
            value={searchId}
            onChange={handleSearchIdChange}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 8 }}>
            {patients.length} patients
          </div>
          {patients.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPatientId(p.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                cursor: "pointer",
                background:
                  selectedPatientId === p.id ? "#e6f9ed" : "transparent",
                borderRadius: 8,
                marginBottom: 4,
              }}
            >
              <img
                src={p.avatar}
                alt={p.name}
                style={{ width: 36, height: 36, borderRadius: "50%" }}
              />
              <span style={{ fontWeight: 500 }}>{p.name}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: 24, borderTop: "1px solid #e5e7eb" }}>
          <LogoutButton />
        </div>
      </aside>
      {/* Main Content */}
      <main style={{ flex: 1, padding: 40 }}>
        {selectedPatient && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <img
                src={selectedPatient.avatar}
                alt={selectedPatient.name}
                style={{ width: 64, height: 64, borderRadius: "50%" }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{selectedPatient.name}</h3>
                <div style={{ color: "#6b7280", fontSize: 14 }}>Patient ID: {selectedPatient.id}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Age</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{selectedPatient.age} years</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Gender</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{selectedPatient.gender}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Diagnosis</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{selectedPatient.diagnosis}</div>
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Medications</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {selectedPatient.medications.map((med, index) => (
                      <div key={index}>{med}</div>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Emergency Contact</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    <div>{selectedPatient.emergencyContact.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 14 }}>
                      {selectedPatient.emergencyContact.relationship}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 14 }}>
                      {selectedPatient.emergencyContact.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
          {stats.map((stat, i) => (
            <div
              key={i}
              onClick={stat.label === "Patient logs" ? handlePatientLogsClick : undefined}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                flex: 1,
                boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
                cursor: stat.label === "Patient logs" ? "pointer" : "default",
                transition: "transform 0.2s",
                "&:hover": stat.label === "Patient logs" ? {
                  transform: "scale(1.02)"
                } : {}
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: "#b0b0b0", fontSize: 14 }}>{stat.label}</div>
              <div style={{ color: "#b0b0b0", fontSize: 12 }}>{stat.sub}</div>
              <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
                {stat.status}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
            marginBottom: 32,
            width: "100%",
            display: "block",
          }}
        >
          <h4 style={{ marginBottom: 24 }}>Attack Frequency Over Time</h4>
          <div style={{ width: "100%", height: 400 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
        {showPatientLogs && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}>
            <div style={{
              background: "#fff",
              borderRadius: 16,
              width: "90%",
              maxWidth: 600,
              maxHeight: "80vh",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: "1px solid #e5e7eb",
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 16, 
                  fontWeight: 500,
                  color: "#111827"
                }}>
                  Patient Calendar Entries
                </h3>
                <button
                  onClick={handlePatientLogsClick}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "#6b7280",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{
                overflowY: "auto",
                flex: 1,
              }}>
                {getDatesInMonth().map(date => {
                  const log = moodLogsData.get(date);
                  console.log('Date:', date, 'Log:', log);
                  
                  return (
                    <div
                      key={date}
                      style={{
                        padding: "12px 24px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: log ? 8 : 0,
                      }}>
                        <div style={{ 
                          width: "120px", 
                          fontSize: 14,
                          color: "#374151"
                        }}>
                          {formatDisplayDate(date)}
                        </div>
                        {log ? (
                          <>
                            <div style={{
                              padding: "2px 12px",
                              borderRadius: 12,
                              fontSize: 13,
                              background: getMoodColor(log.mood).bg,
                              color: getMoodColor(log.mood).text,
                              minWidth: "70px",
                              textAlign: "center"
                            }}>
                              {log.mood}
                            </div>
                            <div style={{
                              padding: "2px 12px",
                              borderRadius: 12,
                              fontSize: 13,
                              background: getStressLevelColor(log.stressLevel).bg,
                              color: getStressLevelColor(log.stressLevel).text,
                              minWidth: "70px",
                              textAlign: "center"
                            }}>
                              {log.stressLevel}
                            </div>
                            {log.symptoms && log.symptoms.length > 0 && log.symptoms[0] !== "None" && (
                              <div style={{
                                flex: 1,
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap"
                              }}>
                                {log.symptoms.map((symptom, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: 12,
                                      fontSize: 13,
                                      background: "#f3f4f6",
                                      color: "#6b7280",
                                    }}
                                  >
                                    {symptom}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ 
                            color: "#9ca3af", 
                            fontSize: 13
                          }}>
                            No entry
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {showAppointments ? (
          <div className="appointment-management">
            <div className="section-header">
              <h2>Appointment Requests</h2>
              <button 
                className="close-button"
                onClick={() => setShowAppointments(false)}
              >
                ×
              </button>
            </div>
            
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeRequestsTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveRequestsTab('all')}
              >
                All
              </button>
              <button 
                className={`tab-button ${activeRequestsTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveRequestsTab('pending')}
              >
                Pending
              </button>
              <button 
                className={`tab-button ${activeRequestsTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveRequestsTab('approved')}
              >
                Approved
              </button>
              <button 
                className={`tab-button ${activeRequestsTab === 'declined' ? 'active' : ''}`}
                onClick={() => setActiveRequestsTab('declined')}
              >
                Declined
              </button>
            </div>
            
            {selectedRequest ? (
              <div className="request-details">
                <div className="detail-header">
                  <h3>Request Details</h3>
                  <button 
                    className="back-button"
                    onClick={() => {
                      setSelectedRequest(null);
                      setResponseNotes("");
                    }}
                  >
                    Back to List
                  </button>
                </div>
                
                <div className="detail-content">
                  <div className="info-row">
                    <div className="info-label">Patient:</div>
                    <div className="info-value">{selectedRequest.patientName}</div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-label">Requested Date:</div>
                    <div className="info-value">
                      {new Date(selectedRequest.requestedDateTime).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-label">Request Date:</div>
                    <div className="info-value">
                      {new Date(selectedRequest.requestDate).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-label">Urgency:</div>
                    <div className="info-value">
                      <span className={`urgency-badge ${selectedRequest.urgency}`}>
                        {selectedRequest.urgency}
                      </span>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-label">Status:</div>
                    <div className="info-value">
                      <span className={`status-badge ${selectedRequest.status}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="info-section">
                    <div className="section-label">Reason:</div>
                    <div className="reason-text">{selectedRequest.reason}</div>
                  </div>
                  
                  {selectedRequest.notes && (
                    <div className="info-section">
                      <div className="section-label">Notes:</div>
                      <div className="notes-text">{selectedRequest.notes}</div>
                    </div>
                  )}
                  
                  {selectedRequest.status === "pending" && (
                    <div className="response-section">
                      <div className="section-label">
                        Response Notes (required for declining):
                      </div>
                      <textarea
                        value={responseNotes}
                        onChange={(e) => setResponseNotes(e.target.value)}
                        placeholder="Enter your notes here..."
                        rows={4}
                      ></textarea>
                      
                      <div className="action-buttons">
                        <button 
                          className="decline-button"
                          onClick={() => handleRequestResponse(selectedRequest.id, "declined")}
                        >
                          Decline Request
                        </button>
                        <button 
                          className="approve-button"
                          onClick={() => handleRequestResponse(selectedRequest.id, "approved")}
                        >
                          Approve Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="appointment-list">
                {getFilteredRequests().length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <div className="empty-text">No {activeRequestsTab !== "all" ? activeRequestsTab : ""} appointment requests found</div>
                  </div>
                ) : (
                  getFilteredRequests().map(request => (
                    <div 
                      key={request.id} 
                      className={`appointment-request-card ${request.status}`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="request-header">
                        <span className="patient-name">{request.patientName}</span>
                        <span className={`urgency-badge ${request.urgency}`}>
                          {request.urgency}
                        </span>
                      </div>
                      
                      <div className="request-time">
                        {new Date(request.requestedDateTime).toLocaleString()}
                      </div>
                      
                      <div className="request-reason">
                        {request.reason.length > 100 
                          ? `${request.reason.substring(0, 100)}...` 
                          : request.reason}
                      </div>
                      
                      <div className="request-footer">
                        <span className={`status-badge ${request.status}`}>
                          {request.status}
                        </span>
                        <span className="view-details">View Details</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : showNotes ? (
          <div className="notes-management">
            <div className="section-header">
              <h2>Notes for {selectedPatient?.name}</h2>
              <button 
                className="close-button"
                onClick={() => setShowNotes(false)}
              >
                ×
              </button>
            </div>
            
            <div className="notes-actions">
              <div className="notes-search">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchNotes}
                  onChange={(e) => setSearchNotes(e.target.value)}
                />
              </div>
            </div>
            
            <div className="notes-grid">
              <div className="new-note-card">
                <h3>Add New Note</h3>
                
                <div className="note-form">
                  <input
                    type="text"
                    placeholder="Note Title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    className="note-title-input"
                  />
                  
                  <textarea
                    placeholder="Note Content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    className="note-content-input"
                    rows={6}
                  ></textarea>
                  
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={newNote.tags}
                    onChange={(e) => setNewNote({...newNote, tags: e.target.value})}
                    className="note-tags-input"
                  />
                  
                  <button 
                    className="add-note-button"
                    onClick={handleAddNote}
                  >
                    Add Note
                  </button>
                </div>
              </div>
              
              {editingNote && (
                <div className="edit-note-card">
                  <h3>Edit Note</h3>
                  
                  <div className="note-form">
                    <input
                      type="text"
                      placeholder="Note Title"
                      value={editingNote.title}
                      onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                      className="note-title-input"
                    />
                    
                    <textarea
                      placeholder="Note Content"
                      value={editingNote.content}
                      onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                      className="note-content-input"
                      rows={6}
                    ></textarea>
                    
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      value={typeof editingNote.tags === 'string' 
                        ? editingNote.tags 
                        : editingNote.tags.join(", ")}
                      onChange={(e) => setEditingNote({...editingNote, tags: e.target.value})}
                      className="note-tags-input"
                    />
                    
                    <div className="edit-note-actions">
                      <button 
                        className="cancel-edit-button"
                        onClick={() => setEditingNote(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="update-note-button"
                        onClick={handleUpdateNote}
                      >
                        Update Note
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {filteredNotes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <div className="empty-text">
                    {searchNotes.trim() 
                      ? "No notes found matching your search" 
                      : "No notes found for this patient"}
                  </div>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div key={note.id} className="note-card">
                    <div className="note-card-header">
                      <h3 className="note-title">{note.title}</h3>
                      <div className="note-date">
                        {new Date(note.date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="note-content">
                      {note.content}
                    </div>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="note-tags">
                        {note.tags.map((tag, index) => (
                          <span key={index} className="note-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="note-actions">
                      <button 
                        className="edit-note-button"
                        onClick={() => setEditingNote({...note, tags: note.tags.join(", ")})}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-note-button"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default Dashboard;
