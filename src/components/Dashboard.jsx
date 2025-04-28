import React, { useState } from "react";
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
      </main>
    </div>
  );
};

export default Dashboard;
