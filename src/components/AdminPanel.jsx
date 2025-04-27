import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isValidEmail } from "../utils/validation";
import LogoutButton from "./LogoutButton";
import ChevronIcon from "./icons/ChevronIcon";

const psychologists = [
  {
    id: "87364523",
    name: "Brooklyn Simmons",
    email: "brooklyns@mail.com",
    num_patients: 1,
    date_added: "21/12/2022",
    time_added: "10:40 PM",
    is_active: true,
  },
  {
    id: "98374653",
    name: "Kristin Watson",
    email: "kristinw@mail.com",
    num_patients: 0,
    date_added: "22/12/2022",
    time_added: "05:20 PM",
    is_active: false,
  },
  {
    id: "23847659",
    name: "Jacob Jones",
    email: "jacobj@mail.com",
    num_patients: 3,
    date_added: "23/12/2022",
    time_added: "12:40 PM",
    is_active: true,
  },
  {
    id: "39485632",
    name: "Cody Fisher",
    email: "cody@mail.com",
    num_patients: 2,
    date_added: "24/12/2022",
    time_added: "03:00 PM",
    is_active: true,
  },
];

const patients = [
  {
    id: "p1",
    name: "Alice Smith",
    email: "alice@mail.com",
    assigned_psychologist_id: "87364523",
    is_active: true,
    date_added: "21/12/2022",
    time_added: "10:40 PM",
  },
  {
    id: "p2",
    name: "Bob Brown",
    email: "bob@mail.com",
    assigned_psychologist_id: null,
    is_active: true,
    date_added: "22/12/2022",
    time_added: "05:20 PM",
  },
  {
    id: "p3",
    name: "Charlie Green",
    email: "charlie@mail.com",
    assigned_psychologist_id: "23847659",
    is_active: false,
    date_added: "23/12/2022",
    time_added: "12:40 PM",
  },
  {
    id: "p4",
    name: "Diana Blue",
    email: "diana@mail.com",
    assigned_psychologist_id: null,
    is_active: true,
    date_added: "24/12/2022",
    time_added: "03:00 PM",
  },
];

const AVATAR_LIST = [
  "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
  "https://cdn-icons-png.flaticon.com/512/2922/2922656.png",
  "https://cdn-icons-png.flaticon.com/512/2922/2922561.png",
  "https://cdn-icons-png.flaticon.com/512/2922/2922688.png",
];

function getAvatar(idx) {
  return AVATAR_LIST[idx % AVATAR_LIST.length];
}

function getPatientsForPsychologist(psychologistId) {
  return patients.filter(
    (patient) => patient.assigned_psychologist_id === psychologistId
  );
}

function getUnassignedPatients() {
  return patients.filter((patient) => !patient.assigned_psychologist_id);
}

const AdminPanel = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("psychologists");
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  // New psychologist form state
  const [newPsychologist, setNewPsychologist] = useState({
    name: "",
    email: "",
    password: "",
    role: "psychologist",
  });
  const [formErrors, setFormErrors] = useState({});

  // Assignment state
  const [selectedPatient, setSelectedPatient] = useState("");
  const [assignmentError, setAssignmentError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPsychologist((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newPsychologist.name.trim()) errors.name = "Name is required";
    if (!newPsychologist.email.trim()) errors.email = "Email is required";
    else if (!isValidEmail(newPsychologist.email))
      errors.email = "Invalid email format";
    if (!newPsychologist.password.trim())
      errors.password = "Password is required";
    else if (newPsychologist.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePsychologist = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      setError(null);
      // Placeholder for creating a new psychologist
      setNewPsychologist({
        name: "",
        email: "",
        password: "",
        role: "psychologist",
      });
      alert("Psychologist created successfully");
    } catch (err) {
      setError(err.message);
      if (err.message.includes("Email already exists")) {
        setFormErrors((prev) => ({ ...prev, email: "Email already exists" }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePsychologist = async (psychologistId) => {
    if (window.confirm("Are you sure you want to disable this psychologist?")) {
      try {
        setLoading(true);
        setError(null);
        // Placeholder for disabling a psychologist
        alert("Psychologist disabled successfully");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignPatient = async () => {
    if (!selectedPatient || !selectedPsychologist) {
      setAssignmentError("Please select both a patient and a psychologist");
      return;
    }
    try {
      setLoading(true);
      setAssignmentError("");
      // Placeholder for assigning a patient to a psychologist
      setSelectedPatient("");
      setSelectedPsychologist("");
      alert("Patient assigned successfully");
    } catch (err) {
      setAssignmentError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignPatient = async (patientId) => {
    if (window.confirm("Are you sure you want to unassign this patient?")) {
      try {
        setLoading(true);
        setError(null);
        // Placeholder for unassigning a patient
        alert("Patient unassigned successfully");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  function handleOpenAssignModal(psychologist) {
    setSelectedPsychologist(psychologist);
    setShowAssignModal(true);
    setSelectedPatientId("");
  }

  function handleCloseAssignModal() {
    setShowAssignModal(false);
    setSelectedPsychologist(null);
    setSelectedPatientId("");
  }

  function handleAssignPatientToPsychologist() {
    if (!selectedPatientId || !selectedPsychologist) return;
    // Update the patient assignment in the patients array (UI only)
    const patientIdx = patients.findIndex((p) => p.id === selectedPatientId);
    if (patientIdx !== -1) {
      patients[patientIdx].assigned_psychologist_id = selectedPsychologist.id;
      alert(
        `Assigned ${patients[patientIdx].name} to ${selectedPsychologist.name}`
      );
      handleCloseAssignModal();
    }
  }

  if (loading && psychologists.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="lead">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="admin-bg py-5"
      style={{ minHeight: "100vh", background: "#f6faf7" }}
    >
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0" style={{ color: "#234c2e" }}>
              Admin
            </h2>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted me-2">{user?.email}</span>
            <span
              className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32, fontWeight: 600 }}
            >
              A
            </span>
            <LogoutButton />
          </div>
        </div>

        {/* Tabs */}
        <div className="d-flex mb-4">
          <button
            className={`admin-tab-btn ${
              activeTab === "psychologists" ? "active" : ""
            }`}
            onClick={() => setActiveTab("psychologists")}
          >
            Psychiatrists
          </button>
          <button
            className={`admin-tab-btn ${
              activeTab === "patients" ? "active" : ""
            }`}
            onClick={() => setActiveTab("patients")}
          >
            Patients
          </button>
          <button
            className={`admin-tab-btn ${
              activeTab === "unassigned" ? "active" : ""
            }`}
            onClick={() => setActiveTab("unassigned")}
          >
            Unassigned Patients
          </button>
        </div>

        {/* Card */}
        <div className="admin-card p-4 mx-auto">
          {activeTab === "psychologists" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">List of psychologist</h5>
                  <small className="text-muted">
                    345 available psychologist
                  </small>
                </div>
                <button className="btn btn-success rounded-pill px-4 py-2">
                  <i className="bi bi-person-plus me-2"></i> Add new doctor
                </button>
              </div>
              <div className="table-responsive">
                <table className="table align-middle admin-table">
                  <thead>
                    <tr>
                      <th>Psychologist</th>
                      <th>ID</th>
                      <th>Email</th>
                      <th>No. Of Patients</th>
                      <th>Date added</th>
                      <th>STATUS</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {psychologists.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="d-flex align-items-center gap-2">
                          <img
                            src={getAvatar(idx)}
                            alt="avatar"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                            }}
                          />
                          <span>{p.name}</span>
                        </td>
                        <td>{p.id}</td>
                        <td>{p.email}</td>
                        <td>
                          {p.num_patients || Math.floor(Math.random() * 5)}
                        </td>
                        <td>
                          {p.date_added}
                          <br />
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {p.time_added}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill px-3 py-2 ${
                              p.is_active === false
                                ? "bg-light text-danger border border-danger"
                                : "bg-light text-success border border-success"
                            }`}
                          >
                            {p.is_active === false ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-light rounded-circle border"
                            style={{ width: 32, height: 32 }}
                            onClick={() => handleOpenAssignModal(p)}
                          >
                            <ChevronIcon size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === "patients" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">List of Patients</h5>
                  <small className="text-muted">345 patients</small>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle admin-table">
                  <thead>
                    <tr>
                      <th>Patients</th>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Psychologist</th>
                      <th>Date added</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="d-flex align-items-center gap-2">
                          <img
                            src={getAvatar(idx)}
                            alt="avatar"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                            }}
                          />
                          <span>{p.name}</span>
                        </td>
                        <td>{p.id}</td>
                        <td>{p.email}</td>
                        <td>
                          {psychologists.find(
                            (ps) => ps.id === p.assigned_psychologist_id
                          )?.name || "-"}
                        </td>
                        <td>
                          {p.date_added}
                          <br />
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {p.time_added}
                          </span>
                        </td>
                        <td>
                          <span className="badge rounded-pill px-3 py-2 bg-light text-success border border-success">
                            Assigned
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === "unassigned" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">Unassigned Patients</h5>
                  <small className="text-muted">
                    {getUnassignedPatients().length} unassigned
                  </small>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle admin-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Date added</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getUnassignedPatients().map((p, idx) => (
                      <tr key={p.id}>
                        <td className="d-flex align-items-center gap-2">
                          <img
                            src={getAvatar(idx)}
                            alt="avatar"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                            }}
                          />
                          <span>{p.name}</span>
                        </td>
                        <td>{p.id}</td>
                        <td>{p.email}</td>
                        <td>
                          {p.date_added}
                          <br />
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {p.time_added}
                          </span>
                        </td>
                        <td>
                          <span className="badge rounded-pill px-3 py-2 bg-light text-secondary border border-secondary">
                            Unassigned
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Modal for assigning patients */}
      {showAssignModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 32,
              minWidth: 350,
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            <h4>Assign Patient to {selectedPsychologist?.name}</h4>
            <button
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                border: "none",
                background: "none",
                fontSize: 20,
                cursor: "pointer",
              }}
              onClick={handleCloseAssignModal}
              aria-label="Close"
            >
              ×
            </button>
            <div style={{ margin: "20px 0" }}>
              <label htmlFor="assign-patient-select">
                Select Unassigned Patient:
              </label>
              <select
                id="assign-patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 8 }}
              >
                <option value="">-- Select Patient --</option>
                {getUnassignedPatients().map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-success"
              disabled={!selectedPatientId}
              onClick={handleAssignPatientToPsychologist}
            >
              Assign
            </button>
          </div>
        </div>
      )}
      <style>{`
        .admin-bg { background: #f6faf7; }
        .admin-card { background: #fff; border-radius: 18px; box-shadow: 0 2px 12px rgba(44,62,80,0.06); max-width: 1200px; }
        .admin-tab-btn { background: none; border: none; outline: none; font-weight: 600; font-size: 1.1rem; color: #234c2e; padding: 0.75rem 2.5rem; border-radius: 18px 18px 0 0; margin-right: 1rem; transition: background 0.2s, color 0.2s; }
        .admin-tab-btn.active { background: #e6f9ed; color: #22c55e; box-shadow: 0 2px 8px rgba(34,197,94,0.06); }
        .admin-table th, .admin-table td { vertical-align: middle; border: none; }
        .admin-table th { color: #b0b0b0; font-weight: 600; background: #f8fafc; }
        .admin-table tr { border-radius: 12px; }
        .admin-table tr:not(:last-child) { border-bottom: 1px solid #f0f0f0; }
      `}</style>
    </div>
  );
};

export default AdminPanel;
