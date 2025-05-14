import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isValidEmail } from "../utils/validation";
import LogoutButton from "./LogoutButton";
import ChevronIcon from "./icons/ChevronIcon";
import AdminLogs from "./AdminLogs";
import AddDoctorModal from "./AddDoctorModal";
import { psychologistService } from "../services/psychologistService";
import { patientService } from "../services/patientService";
import { adminService } from "../services/adminService";

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("psychologists");
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    dateAdded: { key: "created_at", direction: null },
    numPatients: { key: "num_patients", direction: null },
  });

  // Data states
  const [psychologists, setPsychologists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    psychologistsCount: 0,
    patientsCount: 0,
    unassignedPatientsCount: 0,
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

  // New doctor addition state
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchPsychologists(),
          fetchPatients(),
          fetchUnassignedPatients(),
          fetchActivityLogs(),
          fetchDashboardStats(),
        ]);
      } catch (err) {
        setError(err.message);
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Fetch data functions
  const fetchPsychologists = async () => {
    try {
      const data = await psychologistService.getAllPsychologists();

      // Process data to match expected format
      const processedData = data.map((psych) => ({
        ...psych,
        num_patients: 0, // Will be updated later
        date_added: new Date(psych.created_at).toLocaleDateString("en-GB"),
        time_added: new Date(psych.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      }));

      // Update psychologist data
      setPsychologists(processedData);

      // Get patient counts for each psychologist
      for (const psych of processedData) {
        const psychPatients = await psychologistService.getPsychologistPatients(
          psych.id
        );
        psych.num_patients = psychPatients.length;
      }

      // Update state with patient counts
      setPsychologists([...processedData]);
    } catch (error) {
      console.error("Error fetching psychologists:", error);
      setError("Failed to load psychologists");
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await patientService.getAllPatients();

      // Process data to match expected format
      const processedData = data.map((patient) => ({
        ...patient,
        date_added: new Date(patient.created_at).toLocaleDateString("en-GB"),
        time_added: new Date(patient.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      }));

      setPatients(processedData);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setError("Failed to load patients");
    }
  };

  const fetchUnassignedPatients = async () => {
    try {
      const data = await adminService.getUnassignedPatients();
      setUnassignedPatients(data);
    } catch (error) {
      console.error("Error fetching unassigned patients:", error);
      setError("Failed to load unassigned patients");
    }
  };

  const fetchActivityLogs = async (dateFilter = null) => {
    try {
      const data = await adminService.getActivityLogs(dateFilter);
      setActivityLogs(data);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setError("Failed to load activity logs");
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const stats = await adminService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError("Failed to load dashboard statistics");
    }
  };

  // Function to convert date string to Date object for comparison
  const parseDate = (dateStr, timeStr) => {
    const [day, month, year] = dateStr.split("/");
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours);

    // Convert to 24-hour format
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return new Date(year, month - 1, day, hour, parseInt(minutes));
  };

  // Updated sorting function to handle independent columns
  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      const newConfig = { ...prevConfig };

      // Toggle sorting direction for the clicked column
      if (key === "created_at") {
        if (!newConfig.dateAdded.direction) {
          newConfig.dateAdded.direction = "asc";
        } else if (newConfig.dateAdded.direction === "asc") {
          newConfig.dateAdded.direction = "desc";
        } else {
          newConfig.dateAdded.direction = null;
        }
        // Keep num_patients sorting state
      } else if (key === "num_patients") {
        if (!newConfig.numPatients.direction) {
          newConfig.numPatients.direction = "asc";
        } else if (newConfig.numPatients.direction === "asc") {
          newConfig.numPatients.direction = "desc";
        } else {
          newConfig.numPatients.direction = null;
        }
        // Keep date_added sorting state
      }

      return newConfig;
    });
  };

  // Sort data based on sort config
  const getSortedData = (data) => {
    const sortedData = [...data];

    // Sort by date_added if it has a direction
    if (sortConfig.dateAdded.direction) {
      sortedData.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);

        if (sortConfig.dateAdded.direction === "asc") {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
    }

    // Sort by num_patients if it has a direction (only applies to psychologists)
    if (sortConfig.numPatients.direction && data === psychologists) {
      sortedData.sort((a, b) => {
        if (sortConfig.numPatients.direction === "asc") {
          return a.num_patients - b.num_patients;
        } else {
          return b.num_patients - a.num_patients;
        }
      });
    }

    return sortedData;
  };

  // Render sort indicator
  const SortIndicator = ({ column }) => {
    let direction;
    if (column === "created_at") {
      direction = sortConfig.dateAdded.direction;
    } else if (column === "num_patients") {
      direction = sortConfig.numPatients.direction;
    }

    return direction ? (
      <span className={`sort-indicator ${direction}`}>
        {direction === "asc" ? "↑" : "↓"}
      </span>
    ) : null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPsychologist((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!newPsychologist.name) errors.name = "Name is required";
    if (!newPsychologist.email) errors.email = "Email is required";
    else if (!isValidEmail(newPsychologist.email))
      errors.email = "Email is invalid";
    if (!newPsychologist.password) errors.password = "Password is required";
    else if (newPsychologist.password.length < 8)
      errors.password = "Password must be at least 8 characters";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePsychologist = async (doctorData) => {
    try {
      setLoading(true);
      setError(null);

      // Create psychologist via service
      const newPsychologist = await psychologistService.createPsychologist({
        name: doctorData.name,
        email: doctorData.email,
        contact: doctorData.contact,
      });

      // Refresh psychologists list
      await fetchPsychologists();

      // Refresh activity logs and dashboard stats
      await fetchActivityLogs();
      await fetchDashboardStats();

      // Show success message
      alert(
        `Invitation sent successfully to ${doctorData.email}. The psychologist will receive an email to set up their account.`
      );

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

        // Deactivate psychologist via service
        await psychologistService.deactivatePsychologist(psychologistId);

        // Refresh data
        await fetchPsychologists();
        await fetchActivityLogs();

        alert("Psychologist disabled successfully");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignPatient = async () => {
    if (!selectedPatientId || !selectedPsychologist) {
      setAssignmentError("Please select both a patient and a psychologist");
      return;
    }
    try {
      setLoading(true);
      setAssignmentError("");

      // Assign patient via service
      await psychologistService.assignPatient(
        selectedPatientId,
        selectedPsychologist.id
      );

      // Refresh data
      await fetchPatients();
      await fetchPsychologists();
      await fetchUnassignedPatients();
      await fetchActivityLogs();

      setSelectedPatient("");
      handleCloseAssignModal();

      alert(`Patient assigned to ${selectedPsychologist.name} successfully`);
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

        // Unassign patient via service
        await psychologistService.unassignPatient(patientId);

        // Refresh data
        await fetchPatients();
        await fetchPsychologists();
        await fetchUnassignedPatients();
        await fetchActivityLogs();

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
    handleAssignPatient();
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
        patientRow.scrollIntoView({ behavior: "smooth", block: "center" });
        patientRow.classList.add("highlight-row");
        setTimeout(() => patientRow.classList.remove("highlight-row"), 2000);
      }
    }, 100);
  };

  const handleDeletePsychologist = (psychologist) => {
    setPsychologistToDelete(psychologist);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeletePsychologist = async () => {
    try {
      setLoading(true);

      // Delete psychologist via service
      await psychologistService.deletePsychologist(psychologistToDelete.id);

      // Refresh data
      await fetchPsychologists();
      await fetchActivityLogs();
      await fetchDashboardStats();

      setShowDeleteConfirmModal(false);
      setShowDetailsModal(false);
      setPsychologistToDelete(null);

      alert("Psychologist removed successfully");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = async (date) => {
    try {
      setLoading(true);
      await fetchActivityLogs(date);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
            className={`admin-tab-btn ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            Activity Logs
          </button>
        </div>

        {/* Search Bar - Only show for non-logs tabs */}
        {activeTab !== "logs" && (
          <div
            className="position-relative flex-grow-1 mb-4"
            style={{ maxWidth: "300px" }}
          >
            <input
              type="text"
              placeholder="Search by ID, name, or email..."
              className="form-control"
              style={{
                paddingLeft: "2.5rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                height: "42px",
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{
                width: "20px",
                height: "20px",
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
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
                  <small className="text-muted">
                    {psychologists.length} available psychologist
                    {psychologists.length !== 1 ? "s" : ""}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-success" onClick={handleAddDoctor}>
                    Add new doctor
                  </button>
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
                        onClick={() => handleSort("num_patients")}
                        style={{ cursor: "pointer" }}
                      >
                        No. of Patients
                        <SortIndicator column="num_patients" />
                      </th>
                      <th
                        onClick={() => handleSort("created_at")}
                        style={{ cursor: "pointer" }}
                      >
                        Date added
                        <SortIndicator column="created_at" />
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(psychologists).map((p, idx) => (
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
                  <small className="text-muted">
                    {patients.length} patient{patients.length !== 1 ? "s" : ""}
                  </small>
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
                        onClick={() => handleSort("created_at")}
                        style={{ cursor: "pointer" }}
                      >
                        Date added
                        <SortIndicator column="created_at" />
                      </th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(patients).map((p, idx) => (
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
                    {unassignedPatients.length} unassigned
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
                        onClick={() => handleSort("created_at")}
                        style={{ cursor: "pointer" }}
                      >
                        Date added
                        <SortIndicator column="created_at" />
                      </th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(unassignedPatients).map((p, idx) => (
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
                  <small className="text-muted">
                    {activityLogs?.length || 0} activities found
                  </small>
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
              animation: "modalSlideIn 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-4">
              Assign Patient to {selectedPsychologist?.name}
            </h4>
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
                border: "1px solid #e2e8f0",
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
                        border: "2px solid #e2e8f0",
                      }}
                    />
                  </div>
                  <h4 className="mb-0">Psychologist Details</h4>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-danger"
                    onClick={() =>
                      handleDeletePsychologist(selectedPsychologist)
                    }
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
                      <h6 className="card-subtitle mb-3 text-muted">
                        Basic Information
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small text-muted">
                            Name
                          </label>
                          <p className="form-control-plaintext">
                            {selectedPsychologist.name}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small text-muted">
                            Email
                          </label>
                          <p className="form-control-plaintext">
                            {selectedPsychologist.email}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small text-muted">
                            ID
                          </label>
                          <p className="form-control-plaintext">
                            {selectedPsychologist.id}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small text-muted">
                            Status
                          </label>
                          <p className="form-control-plaintext">
                            {selectedPsychologist.is_active
                              ? "Active"
                              : "Inactive"}
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
                        <h6 className="card-subtitle text-muted mb-0">
                          Assigned Patients
                        </h6>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() =>
                            handleOpenAssignModal(selectedPsychologist)
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-plus me-1"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                          </svg>
                          Assign Patient
                        </button>
                      </div>
                      <div
                        className="table-responsive"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover mb-0">
                          <thead
                            style={{
                              position: "sticky",
                              top: 0,
                              background: "white",
                            }}
                          >
                            <tr>
                              <th>Name</th>
                              <th>ID</th>
                              <th>Email</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getPatientsForPsychologist(
                              selectedPsychologist.id
                            ).map((patient) => (
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
                                    onClick={() =>
                                      handleUnassignPatient(patient.id)
                                    }
                                  >
                                    Unassign
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {getPatientsForPsychologist(selectedPsychologist.id)
                              .length === 0 && (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="text-center text-muted py-4"
                                >
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    fill="currentColor"
                    className="text-danger"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                  </svg>
                </div>
              </div>
              <h5 className="mb-3">Remove Psychologist</h5>
              <p className="text-muted mb-0">
                Are you sure you want to remove {psychologistToDelete?.name}?
                This action cannot be undone.
                {psychologistToDelete?.num_patients > 0 && (
                  <span className="d-block mt-2 text-danger">
                    Warning: This psychologist has{" "}
                    {psychologistToDelete.num_patients} assigned patients that
                    will be unassigned.
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
