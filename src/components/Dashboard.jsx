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
  },
  {
    id: "p2",
    name: "Kristin Watson",
    avatar: "https://cdn-icons-png.flaticon.com/512/2922/2922656.png",
  },
];

const stats = [
  { label: "Average Attacks", value: "1.1", sub: "Per day", status: "Normal" },
  { label: "Total Attacks", value: "8", sub: "Last 7 days", status: "Normal" },
  { label: "Mood logs", value: "5", sub: "Total Record", status: "Normal" },
];

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

    // Apply filters
    const activeFilters = {};
    if (filters.mood) activeFilters.mood = parseInt(filters.mood);
    if (filters.stress) activeFilters.stress = parseInt(filters.stress);
    if (filters.symptoms) activeFilters.symptoms = parseInt(filters.symptoms);

    if (Object.keys(activeFilters).length > 0) {
      result = filterPatients(activeFilters);
    }

    setFilteredPatients(result);
  }, [apiPatients, searchTerm, filters, searchPatients, filterPatients]);

  const handlePatientClick = (patientId) => {
    navigate(`/patient/${patientId}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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
            disabled
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
        <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                flex: 1,
                boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
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
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Happy</span>
            <span
              style={{
                background: "#e6f9ed",
                color: "#22c55e",
                borderRadius: 8,
                padding: "2px 10px",
                fontSize: 12,
              }}
            >
              January 17, 2021
            </span>
            <span style={{ color: "#b0b0b0", fontSize: 14 }}>
              Sample Mood log
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
