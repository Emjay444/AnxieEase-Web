import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isValidEmail } from "../utils/validation";
import LogoutButton from "./LogoutButton";
import ChevronIcon from "./icons/ChevronIcon";
import AdminLogs from "./AdminLogs";
import AddDoctorModal from "./AddDoctorModal";

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    dateAdded: { key: 'date_added', direction: null },
    numPatients: { key: 'num_patients', direction: null }
  });

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

  // New psychologist deletion state
  const [psychologistToDelete, setPsychologistToDelete] = useState(null);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([
    {
      action: "Added Dr. Brooklyn Simmons",
      details: "Added Dr. Brooklyn Simmons (ID: 87364523)",
      timestamp: "2024-01-24 10:40 PM"
    },
    {
      action: "Assigned Patient",
      details: "Assigned Alice Smith to Dr. Jacob Jones",
      timestamp: "2024-01-24 03:15 PM"
    },
    {
      action: "Deactivated Doctor",
      details: "Deactivated Dr. Kristin Watson (ID: 98374653)",
      timestamp: "2024-01-23 05:20 PM"
    },
    {
      action: "Updated Information",
      details: "Updated information for Dr. Cody Fisher",
      timestamp: "2024-01-23 03:00 PM"
    }
  ]);

  // New doctor addition state
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  // Function to convert date string to Date object for comparison
  const parseDate = (dateStr, timeStr) => {
    const [day, month, year] = dateStr.split('/');
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    return new Date(year, month - 1, day, hour, parseInt(minutes));
  };

  // Updated sorting function to handle independent columns
  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      
      // Toggle sorting direction for the clicked column
      if (key === 'date_added') {
        if (!newConfig.dateAdded.direction) {
          newConfig.dateAdded.direction = 'asc';
        } else if (newConfig.dateAdded.direction === 'asc') {
          newConfig.dateAdded.direction = 'desc';
        } else {
          newConfig.dateAdded.direction = null;
        }
        // Keep num_patients sorting state
      } else if (key === 'num_patients') {
        if (!newConfig.numPatients.direction) {
          newConfig.numPatients.direction = 'asc';
        } else if (newConfig.numPatients.direction === 'asc') {
          newConfig.numPatients.direction = 'desc';
        } else {
          newConfig.numPatients.direction = null;
        }
        // Keep date_added sorting state
      }
      
      return newConfig;
    });
  };

  // Updated function to get sorted data
  const getSortedData = (data) => {
    let sortedData = [...data];

    // Sort by number of patients if that sorting is active
    if (sortConfig.numPatients.direction) {
      sortedData.sort((a, b) => {
        const comparison = a.num_patients - b.num_patients;
        return sortConfig.numPatients.direction === 'asc' ? comparison : -comparison;
      });
    }

    // Sort by date if that sorting is active
    if (sortConfig.dateAdded.direction) {
      sortedData.sort((a, b) => {
        const dateA = parseDate(a.date_added, a.time_added);
        const dateB = parseDate(b.date_added, b.time_added);
        const comparison = dateA - dateB;
        return sortConfig.dateAdded.direction === 'asc' ? comparison : -comparison;
      });
    }

    return sortedData;
  };

  // Filter functions
  const filteredPsychologists = getSortedData(psychologists.filter(psy =>
    psy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    psy.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    psy.id.includes(searchTerm)
  ));

  const filteredPatients = getSortedData(patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.includes(searchTerm)
  ));

  const filteredUnassignedPatients = getSortedData(patients.filter(patient =>
    (!patient.assigned_psychologist_id) &&
    (patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     patient.id.includes(searchTerm))
  ));

  // Updated Sort indicator component with improved styling
  const SortIndicator = ({ column }) => {
    const config = column === 'date_added' ? sortConfig.dateAdded : sortConfig.numPatients;
    return (
      <span className="ms-2" style={{ display: 'inline-block', color: config.direction ? '#3cba92' : '#94a3b8' }}>
        {!config.direction && '↕'}
        {config.direction === 'asc' && '↑'}
        {config.direction === 'desc' && '↓'}
      </span>
    );
  };

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

  const handleCreatePsychologist = async (doctorData) => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, you would make an API call to create the user account
      // with the password and other details
      const newPsychologist = {
        id: doctorData.licenseNumber,
        name: doctorData.name,
        email: doctorData.email,
        contact: doctorData.contact,
        num_patients: 0,
        date_added: new Date().toLocaleDateString('en-GB'),
        time_added: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true 
        }),
        is_active: true,
      };
      
      // Add to the psychologists array (in a real app, this would be an API call)
      psychologists.unshift(newPsychologist);
      
      // Add to activity logs
      setActivityLogs(prev => [{
        action: `Created Account for Dr. ${doctorData.name}`,
        details: `Added Dr. ${doctorData.name} (License: ${doctorData.licenseNumber}) and created account`,
        timestamp: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      }, ...prev]);

      // Show success message with credentials
      alert(`Account created successfully!\n\nPlease provide these credentials to Dr. ${doctorData.name}:\nEmail: ${doctorData.email}\nPassword: ${doctorData.password}`);

      setShowAddDoctor(false);
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
    setSelectedPatientId("");
  }

  function handleCloseDetails() {
    setShowDetailsModal(false);
    setSelectedPsychologist(null);
    setShowAssignModal(false); // Also close assign modal if open
    setSelectedPatientId("");
  }

  const handleOpenDetails = (psychologist) => {
    setSelectedPsychologist(psychologist);
    setShowDetailsModal(true);
  };

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

  const handlePatientClick = (patientId) => {
    // Set the active tab to "patients"
    setActiveTab("patients");
    // Clear any search terms
    setSearchTerm("");
    // Optionally scroll to the patient in the list
    setTimeout(() => {
      const patientRow = document.getElementById(`patient-row-${patientId}`);
      if (patientRow) {
        patientRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        patientRow.classList.add('highlight-row');
        setTimeout(() => patientRow.classList.remove('highlight-row'), 2000);
      }
    }, 100);
  };

  const handleDeletePsychologist = (psychologist) => {
    setPsychologistToDelete(psychologist);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeletePsychologist = () => {
    // Here you would typically make an API call to delete the psychologist
    // For now, we'll just update the UI
    const updatedPsychologists = psychologists.filter(p => p.id !== psychologistToDelete.id);
    psychologists.splice(0, psychologists.length, ...updatedPsychologists);
    setShowDeleteConfirmModal(false);
    setShowDetailsModal(false);
    setPsychologistToDelete(null);
  };

  const handleDateFilter = (date) => {
    if (!date) {
      // If no date selected, show all logs
      setActivityLogs([
        {
          action: "Added Dr. Brooklyn Simmons",
          details: "Added Dr. Brooklyn Simmons (ID: 87364523)",
          timestamp: "2024-01-24 10:40 PM"
        },
        {
          action: "Assigned Patient",
          details: "Assigned Alice Smith to Dr. Jacob Jones",
          timestamp: "2024-01-24 03:15 PM"
        },
        {
          action: "Deactivated Doctor",
          details: "Deactivated Dr. Kristin Watson (ID: 98374653)",
          timestamp: "2024-01-23 05:20 PM"
        },
        {
          action: "Updated Information",
          details: "Updated information for Dr. Cody Fisher",
          timestamp: "2024-01-23 03:00 PM"
        }
      ]);
      return;
    }

    // Filter logs based on selected date
    const selectedDate = new Date(date);
    const filteredLogs = activityLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === selectedDate.toDateString();
    });
    setActivityLogs(filteredLogs);
  };

  const handleAddDoctor = () => {
    setShowAddDoctor(true);
  };

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
    <div className="admin-bg">
      <div className="container-fluid container-md py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0" style={{ color: "#234c2e" }}>
              Admin
            </h2>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs mb-4">
          <button
            className={`admin-tab-btn ${
              activeTab === "psychologists" ? "active" : ""
            }`}
            onClick={() => setActiveTab("psychologists")}
          >
            Psychologists
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
          <button
            className={`admin-tab-btn ${
              activeTab === "logs" ? "active" : ""
            }`}
            onClick={() => setActiveTab("logs")}
          >
            Activity Logs
          </button>
        </div>

        {/* Search Bar - Only show for non-logs tabs */}
        {activeTab !== "logs" && (
          <div className="position-relative flex-grow-1 mb-4" style={{ maxWidth: '300px' }}>
            <input
              type="text"
              placeholder="Search by ID, name, or email..."
              className="form-control"
              style={{
                paddingLeft: '2.5rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                height: '42px'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{
                width: '20px',
                height: '20px',
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {/* Card */}
        <div className="admin-card p-4">
          {activeTab === "psychologists" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">List of psychologist</h5>
                  <small className="text-muted">345 available psychologist</small>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-success" onClick={handleAddDoctor}>Add new doctor</button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle admin-table">
                  <thead>
                    <tr>
                      <th>Psychologist</th>
                      <th>ID</th>
                      <th>Email</th>
                      <th 
                        onClick={() => handleSort('num_patients')}
                        style={{ cursor: 'pointer' }}
                      >
                        No. of Patients
                        <SortIndicator column="num_patients" />
                      </th>
                      <th 
                        onClick={() => handleSort('date_added')}
                        style={{ cursor: 'pointer' }}
                      >
                        Date added
                        <SortIndicator column="date_added" />
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPsychologists.length > 0 ? (
                      filteredPsychologists.map((p, idx) => (
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
                          <td>{p.num_patients}</td>
                          <td>
                            {p.date_added}
                            <br />
                            <span className="text-muted" style={{ fontSize: 12 }}>
                              {p.time_added}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-light rounded-circle border"
                              style={{ width: 32, height: 32 }}
                              onClick={() => handleOpenDetails(p)}
                            >
                              <ChevronIcon size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}>
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              <line x1="11" y1="8" x2="11" y2="14"></line>
                              <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                            <p className="text-muted mb-0">No results found</p>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.875rem' }}>
                              Try adjusting your search term
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
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
                      <th 
                        onClick={() => handleSort('date_added')}
                        style={{ cursor: 'pointer' }}
                      >
                        Date added
                        <SortIndicator column="date_added" />
                      </th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p, idx) => (
                      <tr key={p.id} id={`patient-row-${p.id}`}>
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
                    {filteredUnassignedPatients.length} unassigned
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
                      <th 
                        onClick={() => handleSort('date_added')}
                        style={{ cursor: 'pointer' }}
                      >
                        Date added
                        <SortIndicator column="date_added" />
                      </th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnassignedPatients.map((p, idx) => (
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
          {activeTab === "logs" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">Activity Logs</h5>
                  <small className="text-muted">{activityLogs?.length || 0} activities found</small>
                </div>
                <div>
                  <input
                    type="date"
                    className="form-control"
                    onChange={(e) => handleDateFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle admin-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Details</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs?.map((log, index) => (
                      <tr key={index}>
                        <td>{log.action}</td>
                        <td>{log.details}</td>
                        <td>{log.timestamp}</td>
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
            zIndex: 10000,
          }}
          onClick={(e) => {
            // Only close if clicking the backdrop
            if (e.target === e.currentTarget) {
              handleCloseAssignModal();
            }
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 32,
              minWidth: 350,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              position: "relative",
              border: "1px solid rgba(0,0,0,0.1)",
              animation: "modalSlideIn 0.3s ease-out"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-4">Assign Patient to {selectedPsychologist?.name}</h4>
            <button
              className="btn btn-icon btn-light rounded-circle position-absolute"
              style={{
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e2e8f0"
              }}
              onClick={handleCloseAssignModal}
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-4">
              <label htmlFor="assign-patient-select" className="form-label">
                Select Unassigned Patient:
              </label>
              <select
                id="assign-patient-select"
                className="form-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
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
              className="btn btn-success w-100"
              disabled={!selectedPatientId}
              onClick={handleAssignPatientToPsychologist}
            >
              Assign Patient
            </button>
          </div>
        </div>
      )}
      {/* Improved Psychologist Details Modal */}
      {showDetailsModal && (
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
              borderRadius: 16,
              width: "800px",
              maxWidth: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            {/* Header Section */}
            <div className="modal-header border-bottom p-4">
              <div className="d-flex justify-content-between align-items-center w-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="position-relative">
                    <img
                      src={getAvatar(0)}
                      alt="avatar"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        border: "2px solid #e2e8f0"
                      }}
                    />
                  </div>
                  <h4 className="mb-0">Psychologist Details</h4>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeletePsychologist(selectedPsychologist)}
                  >
                    Remove Psychologist
                  </button>
                  <button
                    className="btn btn-icon btn-light rounded-circle modal-close"
                    onClick={handleCloseDetails}
                    aria-label="Close"
                    style={{ width: 32, height: 32 }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
              <div className="row g-4">
                {/* Basic Information */}
                <div className="col-12">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-3 text-muted">Basic Information</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small text-muted">Name</label>
                          <p className="form-control-plaintext">{selectedPsychologist.name}</p>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small text-muted">Email</label>
                          <p className="form-control-plaintext">{selectedPsychologist.email}</p>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small text-muted">ID</label>
                          <p className="form-control-plaintext">{selectedPsychologist.id}</p>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small text-muted">Status</label>
                          <p className="form-control-plaintext">
                            {selectedPsychologist.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Patients Section */}
                <div className="col-12">
                  <div className="card border-0">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="card-subtitle text-muted mb-0">Assigned Patients</h6>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleOpenAssignModal(selectedPsychologist)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus me-1" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                          </svg>
                          Assign Patient
                        </button>
                      </div>
                      <div className="table-responsive" style={{ maxHeight: "300px" }}>
                        <table className="table table-hover mb-0">
                          <thead style={{ position: "sticky", top: 0, background: "white" }}>
                            <tr>
                              <th>Name</th>
                              <th>ID</th>
                              <th>Email</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getPatientsForPsychologist(selectedPsychologist.id).map(patient => (
                              <tr key={patient.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <img
                                      src={getAvatar(0)}
                                      alt="avatar"
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                      }}
                                    />
                                    {patient.name}
                                  </div>
                                </td>
                                <td>{patient.id}</td>
                                <td>{patient.email}</td>
                                <td>
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleUnassignPatient(patient.id)}
                                  >
                                    Unassign
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {getPatientsForPsychologist(selectedPsychologist.id).length === 0 && (
                              <tr>
                                <td colSpan="4" className="text-center text-muted py-4">
                                  No patients assigned yet
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
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
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              width: "400px",
              maxWidth: "95%",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="text-center mb-4">
              <div className="d-flex justify-content-center mb-3">
                <div
                  className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{ width: 64, height: 64 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="text-danger" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                </div>
              </div>
              <h5 className="mb-3">Remove Psychologist</h5>
              <p className="text-muted mb-0">
                Are you sure you want to remove {psychologistToDelete?.name}? This action cannot be undone.
                {psychologistToDelete?.num_patients > 0 && (
                  <span className="d-block mt-2 text-danger">
                    Warning: This psychologist has {psychologistToDelete.num_patients} assigned patients that will be unassigned.
                  </span>
                )}
              </p>
            </div>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-light"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setPsychologistToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDeletePsychologist}
              >
                Remove Psychologist
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddDoctor && (
        <AddDoctorModal
          show={showAddDoctor}
          onClose={() => setShowAddDoctor(false)}
          onSave={handleCreatePsychologist}
        />
      )}
      <style>{`
        .admin-bg {
          background: #f6faf7;
          min-height: 100vh;
          width: 100vw;
          position: fixed;
          top: 0;
          left: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .admin-tabs {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 4px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .admin-tabs::-webkit-scrollbar {
          display: none;
        }
        
        .admin-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 12px rgba(44,62,80,0.06);
        }
        
        .admin-tab-btn {
          background: none;
          border: none;
          outline: none;
          font-weight: 600;
          font-size: 1.1rem;
          color: #234c2e;
          padding: 0.75rem 2.5rem;
          border-radius: 18px 18px 0 0;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        
        .admin-tab-btn.active {
          background: #e6f9ed;
          color: #22c55e;
          box-shadow: 0 2px 8px rgba(34,197,94,0.06);
        }
        
        .admin-table {
          margin-bottom: 0;
        }
        
        .table-responsive {
          max-height: calc(100vh - 280px);
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .admin-table th {
          position: sticky;
          top: 0;
          background: #f8fafc;
          z-index: 1;
          color: #b0b0b0;
          font-weight: 600;
          padding: 1rem;
        }
        
        .admin-table td {
          padding: 1rem;
          vertical-align: middle;
          border: none;
        }
        
        .admin-table tr:not(:last-child) {
          border-bottom: 1px solid #f0f0f0;
        }
        
        /* Hide all scrollbars */
        ::-webkit-scrollbar {
          display: none;
        }
        
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        @media (max-width: 768px) {
          .admin-card {
            border-radius: 12px;
          }
          
          .table-responsive {
            max-height: calc(100vh - 200px);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
