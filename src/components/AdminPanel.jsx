import React, { useState, useEffect, useRef } from "react";
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

async function loadPatientsForPsychologist(psychologistId) {
  try {
    return await psychologistService.getPsychologistPatients(psychologistId);
  } catch (error) {
    console.error("Error loading patients for psychologist:", error);
    return [];
  }
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
  // Add state for assignment confirmation
  const [showAssignConfirmModal, setShowAssignConfirmModal] = useState(false);
  // Add state for unassignment confirmation
  const [showUnassignConfirmModal, setShowUnassignConfirmModal] =
    useState(false);
  const [patientToUnassign, setPatientToUnassign] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientName, setSelectedPatientName] = useState("");
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

  // New patient search state
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [filteredUnassignedPatients, setFilteredUnassignedPatients] = useState(
    []
  );

  // Activity logs state
  const [dateFilter, setDateFilter] = useState("");

  // Add filtered data states
  const [filteredPsychologists, setFilteredPsychologists] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);

  // Add a state for loading patients in the modal
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Add a state to store patients for the selected psychologist
  const [selectedPsychologistPatients, setSelectedPsychologistPatients] =
    useState([]);
  const [assignments, setAssignments] = useState([]); // Track active assignments

  // Add a reference for the search input
  const searchInputRef = useRef(null);

  // Add pagination state for activity logs
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(8); // Show 8 logs per page

  // Add pagination state for other tables
  const [psychologistsPage, setPsychologistsPage] = useState(1);
  const [patientsPage, setPatientsPage] = useState(1);
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 items per page for other tables

  useEffect(() => {
    fetchData();
  }, []);

  // Add effect to filter data based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      // If search is empty, show all data
      setFilteredPsychologists(psychologists);
      setFilteredPatients(patients);
      setFilteredUnassignedPatients(unassignedPatients);
    } else {
      // Filter psychologists
      const filteredPsychs = psychologists.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPsychologists(filteredPsychs);

      // Filter patients
      const filteredPats = patients.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filteredPats);

      // Filter unassigned patients
      const filteredUnassigned = unassignedPatients.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUnassignedPatients(filteredUnassigned);
    }
  }, [searchTerm, psychologists, patients, unassignedPatients]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPsychologists(),
        fetchPatients(),
        fetchUnassignedPatients(),
        fetchActivityLogs(),
        fetchDashboardStats(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = (value) => {
    setDateFilter(value);
    fetchActivityLogs(value);
  };

  const handleLogDeleted = (logId) => {
    setActivityLogs((prevLogs) => prevLogs.filter((log) => log.id !== logId));
  };

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
      setFilteredPsychologists(processedData);

      // Get patient counts for each psychologist
      for (const psych of processedData) {
        const psychPatients = await psychologistService.getPsychologistPatients(
          psych.id
        );
        psych.num_patients = psychPatients.length;
      }

      // Update state with patient counts
      setPsychologists([...processedData]);
      setFilteredPsychologists([...processedData]);
    } catch (error) {
      console.error("Error fetching psychologists:", error);
      setError("Failed to load psychologists");
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await adminService.getAllUsers();
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setError("Failed to load patients");
    }
  };

  const fetchUnassignedPatients = async () => {
    try {
      const data = await adminService.getUnassignedPatients();
      setUnassignedPatients(data);
      setFilteredUnassignedPatients(data);
    } catch (error) {
      console.error("Error fetching unassigned patients:", error);
      setError("Failed to load unassigned patients");
    }
  };

  const fetchActivityLogs = async (dateFilter = null) => {
    try {
      // Add a small delay to ensure new logs are captured
      await new Promise((resolve) => setTimeout(resolve, 300));

      const data = await adminService.getActivityLogs(dateFilter);
      setActivityLogs(data);

      // Force a state update
      if (activeTab === "logs") {
        setActiveTab("logs");
      }
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
        name: `${doctorData.firstName}${
          doctorData.middleName ? " " + doctorData.middleName : ""
        } ${doctorData.lastName}`.trim(),
        email: doctorData.email,
        contact: doctorData.contact,
        licenseNumber: doctorData.licenseNumber,
        sex: doctorData.sex,
      });

      // Log the psychologist creation activity
      await adminService.logActivity(
        "00000000-0000-0000-0000-000000000000", // Admin user ID placeholder
        "Psychologist Created",
        `Created new psychologist account for ${newPsychologist.name} (${doctorData.email})`
      );

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

    // Show confirmation modal instead of immediately assigning
    setShowAssignConfirmModal(true);
  };

  // Add new function to confirm and execute assignment
  const confirmAssignPatient = async () => {
    try {
      // Prevent any default confirmation dialogs from appearing
      if (window.confirm !== undefined) {
        const originalConfirm = window.confirm;
        window.confirm = function () {
          return true;
        };

        // Reset after execution is complete
        setTimeout(() => {
          window.confirm = originalConfirm;
        }, 500); // Longer timeout to ensure it covers the entire operation
      }

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

      // Explicitly fetch fresh activity logs to show the new assignment
      await fetchActivityLogs();

      // Refresh the selected psychologist's patient list
      if (selectedPsychologist) {
        const patients = await loadPatientsForPsychologist(
          selectedPsychologist.id
        );
        setSelectedPsychologistPatients(patients);
      }

      setSelectedPatient("");
      setShowAssignConfirmModal(false);
      handleCloseAssignModal();
    } catch (err) {
      setAssignmentError(err.message);
      setShowAssignConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignPatient = (patientId) => {
    // Find the patient to unassign to show in confirmation dialog
    const patientToUnassign = selectedPsychologistPatients.find(
      (p) => p.id === patientId
    );
    setPatientToUnassign(patientToUnassign);
    setShowUnassignConfirmModal(true);
  };

  // Add new function to confirm and execute unassignment
  const confirmUnassignPatient = async () => {
    if (!patientToUnassign) return;

    try {
      setLoading(true);
      setError(null);

      // Unassign patient via service
      await psychologistService.unassignPatient(patientToUnassign.id);

      // Refresh data
      await fetchPatients();
      await fetchPsychologists();
      await fetchUnassignedPatients();

      // Explicitly fetch fresh activity logs
      await fetchActivityLogs();

      // Refresh the selected psychologist's patient list if in details view
      if (selectedPsychologist) {
        const patients = await loadPatientsForPsychologist(
          selectedPsychologist.id
        );
        setSelectedPsychologistPatients(patients);
      }

      setShowUnassignConfirmModal(false);
    } catch (err) {
      setError(err.message);
      setShowUnassignConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUnassignedPatients = () => {
    if (!unassignedPatients || unassignedPatients.length === 0) return [];

    // Don't show any patients until user types something
    if (!patientSearchTerm || patientSearchTerm.trim() === "") {
      return []; // Return empty array when search term is empty
    }

    // Filter patients by name or email
    const filtered = unassignedPatients.filter(
      (p) =>
        p.name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(patientSearchTerm.toLowerCase())
    );

    // Return results
    return filtered.slice(0, 10); // Show first 10 matching patients
  };

  // Modified to ensure we don't get empty values in the confirmation dialog
  const getSelectedPatientName = () => {
    // First try to find in filtered patients
    const patient = getFilteredUnassignedPatients().find(
      (p) => p.id === selectedPatientId
    );

    if (patient && patient.name) {
      return patient.name;
    }

    // If we can't find the patient in filtered results, look in all unassigned patients
    const fallbackPatient = unassignedPatients.find(
      (p) => p.id === selectedPatientId
    );

    if (fallbackPatient?.name) {
      return fallbackPatient.name;
    }

    // Last attempt - check if we have the patient in the original selection text
    const selectionText = document.querySelector(
      "[aria-selected='true'] .patient-name"
    )?.textContent;
    if (selectionText) {
      return selectionText;
    }

    // Only if all else fails, use a generic term
    return selectedPatientId || "the selected patient";
  };

  function handleOpenAssignModal(psychologist) {
    // Close details modal first to prevent modal stacking issues
    setShowDetailsModal(false);

    // Then set up the assign modal
    setTimeout(() => {
      setSelectedPsychologist(psychologist);
      setShowAssignModal(true);
      setSelectedPatientId("");
      setSelectedPatientName("");
      setPatientSearchTerm("");
      setLoadingPatients(true);

      // Fetch unassigned patients and don't display them by default
      adminService
        .getUnassignedPatients()
        .then((data) => {
          setUnassignedPatients(data);
          setLoadingPatients(false);
          // Don't set filtered patients so nothing shows initially
        })
        .catch((error) => {
          console.error("Error fetching unassigned patients:", error);
          setLoadingPatients(false);
        });
    }, 100); // Small delay to ensure smooth transition
  }

  function handleCloseAssignModal() {
    setShowAssignModal(false);
    setSelectedPatientId("");
    setSelectedPatientName("");
    setPatientSearchTerm("");
  }

  function handleCloseDetails() {
    setShowDetailsModal(false);
    setSelectedPsychologist(null);
    setShowAssignModal(false);
    setSelectedPatientId("");
    setSelectedPatientName("");
  }

  const handleOpenDetails = async (psychologist) => {
    setSelectedPsychologist(psychologist);
    setShowDetailsModal(true);

    // Load patients for this psychologist
    const patients = await loadPatientsForPsychologist(psychologist.id);
    setSelectedPsychologistPatients(patients);
  };

  function handleAssignPatientToPsychologist() {
    // Prevent any default confirmation dialogs
    if (window.confirm !== undefined) {
      const originalConfirm = window.confirm;
      window.confirm = function () {
        return true;
      };

      // Reset after a short delay
      setTimeout(() => {
        window.confirm = originalConfirm;
      }, 100);
    }

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

      // Get the psychologist details for the log
      const psychName = psychologistToDelete.name;
      const psychEmail = psychologistToDelete.email;

      // Delete psychologist via service
      await psychologistService.deletePsychologist(psychologistToDelete.id);

      // Log the psychologist deletion activity
      await adminService.logActivity(
        "00000000-0000-0000-0000-000000000000", // Admin user ID placeholder
        "Psychologist Removed",
        `Removed psychologist ${psychName} (${psychEmail})`
      );

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

  const handleAddDoctor = () => {
    setShowAddDoctor(true);
  };

  // Add a specific function for handling assign from details view
  function handleAssignFromDetailsView() {
    // Store the current psychologist
    const psychologist = selectedPsychologist;

    // After a brief delay to avoid modal conflicts, open the assign modal
    setTimeout(() => {
      // Fetch unassigned patients
      adminService
        .getUnassignedPatients()
        .then((data) => {
          setUnassignedPatients(data);
          // Don't set filtered patients so nothing shows initially
          setLoadingPatients(false);

          // Set up the assign modal state
          setSelectedPsychologist(psychologist);
          setShowAssignModal(true);
          setSelectedPatientId("");
          setSelectedPatientName("");
          setPatientSearchTerm("");

          // Focus the search input after modal opens
          setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 100);
        })
        .catch((error) => {
          console.error("Error fetching unassigned patients:", error);
          setLoadingPatients(false);
        });
    }, 150);
  }

  // When patient is selected in the patients list
  const handlePatientSelection = (patient) => {
    setSelectedPatientId(patient.id);
    setSelectedPatientName(patient.name);
  };

  // Calculate pagination for logs
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = activityLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(activityLogs.length / logsPerPage);

  // Calculate pagination for psychologists
  const indexOfLastPsychologist = psychologistsPage * itemsPerPage;
  const indexOfFirstPsychologist = indexOfLastPsychologist - itemsPerPage;
  const currentPsychologists = getSortedData(filteredPsychologists).slice(
    indexOfFirstPsychologist,
    indexOfLastPsychologist
  );
  const totalPsychologistPages = Math.ceil(
    filteredPsychologists.length / itemsPerPage
  );

  // Calculate pagination for patients
  const indexOfLastPatient = patientsPage * itemsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - itemsPerPage;
  const currentPatients = getSortedData(filteredPatients).slice(
    indexOfFirstPatient,
    indexOfLastPatient
  );
  const totalPatientPages = Math.ceil(filteredPatients.length / itemsPerPage);

  // Calculate pagination for unassigned patients
  const indexOfLastUnassigned = unassignedPage * itemsPerPage;
  const indexOfFirstUnassigned = indexOfLastUnassigned - itemsPerPage;
  const currentUnassigned = getSortedData(filteredUnassignedPatients).slice(
    indexOfFirstUnassigned,
    indexOfLastUnassigned
  );
  const totalUnassignedPages = Math.ceil(
    filteredUnassignedPatients.length / itemsPerPage
  );

  // Handle page changes
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePsychologistsPageChange = (pageNumber) => {
    setPsychologistsPage(pageNumber);
  };

  const handlePatientsPageChange = (pageNumber) => {
    setPatientsPage(pageNumber);
  };

  const handleUnassignedPageChange = (pageNumber) => {
    setUnassignedPage(pageNumber);
  };

  // Add a helper function for pagination UI to avoid code duplication
  const renderPagination = (
    currentPage,
    totalPages,
    handleChange,
    itemCount,
    itemName
  ) => {
    if (itemCount <= itemsPerPage) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, itemCount);

    return (
      <div className="pagination-container mt-3">
        <div className="pagination-info">
          Showing {startItem}-{endItem} of {itemCount} {itemName}
        </div>
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => handleChange(currentPage - 1)}
          >
            Previous
          </button>

          {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
            let pageNum;

            // Show pages around current page
            if (totalPages <= 5) {
              pageNum = index + 1;
            } else if (currentPage <= 3) {
              pageNum = index + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + index;
            } else {
              pageNum = currentPage - 2 + index;
            }

            return (
              <button
                key={pageNum}
                className={`pagination-num ${
                  currentPage === pageNum ? "active" : ""
                }`}
                onClick={() => handleChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => handleChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    );
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
                    {filteredPsychologists.length} available psychologist
                    {filteredPsychologists.length !== 1 ? "s" : ""}
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
                      <th style={{ width: "25%" }}>Psychologist</th>
                      <th style={{ width: "20%" }} className="id-column">
                        ID
                      </th>
                      <th style={{ width: "25%" }}>Email</th>
                      <th
                        onClick={() => handleSort("num_patients")}
                        style={{ width: "10%", cursor: "pointer" }}
                      >
                        No. of Patients
                        <SortIndicator column="num_patients" />
                      </th>
                      <th
                        onClick={() => handleSort("created_at")}
                        style={{ width: "15%", cursor: "pointer" }}
                      >
                        Date added
                        <SortIndicator column="created_at" />
                      </th>
                      <th style={{ width: "5%" }} className="text-end">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPsychologists.map((p, idx) => (
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
                        <td className="id-column text-truncate" title={p.id}>
                          {p.id}
                        </td>
                        <td>{p.email}</td>
                        <td>{p.num_patients}</td>
                        <td>
                          {p.date_added}
                          <br />
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {p.time_added}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenDetails(p)}
                            aria-label="View details"
                          >
                            <ChevronIcon size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPsychologists.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              fill="currentColor"
                              className="bi bi-people text-muted mb-2"
                              viewBox="0 0 16 16"
                            >
                              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                            </svg>
                            <p className="text-muted mb-0">
                              {searchTerm
                                ? `No psychologists found matching "${searchTerm}"`
                                : "No psychologists found"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(
                psychologistsPage,
                totalPsychologistPages,
                handlePsychologistsPageChange,
                filteredPsychologists.length,
                "psychologists"
              )}
            </>
          )}
          {activeTab === "patients" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">List of Patients</h5>
                  <small className="text-muted">
                    {filteredPatients.length} patient
                    {filteredPatients.length !== 1 ? "s" : ""}
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
                      <th>Assigned To</th>
                      <th
                        onClick={() => handleSort("created_at")}
                        style={{ cursor: "pointer" }}
                      >
                        Date added
                        <SortIndicator column="created_at" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPatients.map((p, idx) => (
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
                          {p.assigned_psychologist_id ? (
                            psychologists.find(
                              (psy) => psy.id === p.assigned_psychologist_id
                            )?.name || "Unknown"
                          ) : (
                            <span className="text-muted">Not assigned</span>
                          )}
                        </td>
                        <td>
                          {p.date_added}
                          <br />
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {p.time_added}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              fill="currentColor"
                              className="bi bi-people text-muted mb-2"
                              viewBox="0 0 16 16"
                            >
                              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                            </svg>
                            <p className="text-muted mb-0">
                              {searchTerm
                                ? `No patients found matching "${searchTerm}"`
                                : "No patients found"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(
                patientsPage,
                totalPatientPages,
                handlePatientsPageChange,
                filteredPatients.length,
                "patients"
              )}
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
                      <th>Role</th>
                      <th
                        onClick={() => handleSort("created_at")}
                        style={{ cursor: "pointer" }}
                      >
                        Date added
                        <SortIndicator column="created_at" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUnassigned.map((p, idx) => (
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
                        <td>{p.role || "patient"}</td>
                        <td>
                          {p.date_added}
                          <br />
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {p.time_added}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredUnassignedPatients.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              fill="currentColor"
                              className="bi bi-people text-muted mb-2"
                              viewBox="0 0 16 16"
                            >
                              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                            </svg>
                            <p className="text-muted mb-0">
                              {searchTerm
                                ? `No unassigned patients found matching "${searchTerm}"`
                                : "No unassigned patients found"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(
                unassignedPage,
                totalUnassignedPages,
                handleUnassignedPageChange,
                filteredUnassignedPatients.length,
                "patients"
              )}
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
                <div className="d-flex align-items-center">
                  <label htmlFor="dateFilter" className="me-2">
                    Filter by date:
                  </label>
                  <input
                    type="date"
                    id="dateFilter"
                    className="form-control form-control-sm"
                    value={dateFilter}
                    onChange={(e) => handleDateFilter(e.target.value)}
                  />
                  {dateFilter && (
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={() => handleDateFilter("")}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="table-responsive">
                <AdminLogs
                  logs={currentLogs}
                  loading={loading}
                  dateFilter={dateFilter}
                  onFilterChange={handleDateFilter}
                  onLogDeleted={handleLogDeleted}
                />
              </div>
              {renderPagination(
                currentPage,
                totalPages,
                handlePageChange,
                activityLogs.length,
                "logs"
              )}
            </>
          )}
        </div>
      </div>
      {/* Modal for assigning patients */}
      {showAssignModal && (
        <div
          className="modal-backdrop assign-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseAssignModal();
            }
          }}
        >
          <div
            className="modal-content assign-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="assign-modal-title"
            aria-modal="true"
          >
            <div className="modal-header">
              <h4 className="modal-title" id="assign-modal-title">
                Assign Patient to {selectedPsychologist?.name}
              </h4>
              <button
                className="btn-close"
                onClick={handleCloseAssignModal}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <div className="mb-4">
                <label htmlFor="patient-search" className="form-label">
                  Search Unassigned Patients:
                </label>
                <div className="search-container">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                  </svg>
                  <input
                    type="text"
                    id="patient-search"
                    className="search-input"
                    placeholder="Search by name or email..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    aria-label="Search unassigned patients"
                    ref={searchInputRef}
                  />
                  {patientSearchTerm && (
                    <button
                      className="clear-search"
                      onClick={() => setPatientSearchTerm("")}
                      aria-label="Clear search"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                      </svg>
                    </button>
                  )}
                </div>

                <label className="form-label mt-3">Select Patient:</label>
                <div
                  className="patient-selection-list"
                  role="listbox"
                  aria-label="Unassigned patients"
                >
                  {loadingPatients ? (
                    <div className="text-center p-3">
                      <div
                        className="spinner-border spinner-border-sm text-secondary me-2"
                        role="status"
                      >
                        <span className="visually-hidden">
                          Loading patients...
                        </span>
                      </div>
                      <span className="text-muted">Loading patients...</span>
                    </div>
                  ) : getFilteredUnassignedPatients().length === 0 ? (
                    patientSearchTerm ? (
                      <div className="empty-state">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                        </svg>
                        <p className="mt-2">
                          No patients found matching "{patientSearchTerm}"
                        </p>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                        <p className="mt-2">
                          Type patient name or email to search...
                        </p>
                      </div>
                    )
                  ) : (
                    getFilteredUnassignedPatients().map((p) => (
                      <div
                        key={p.id}
                        className={`patient-card ${
                          p.id === selectedPatientId
                            ? "patient-card-selected"
                            : ""
                        }`}
                        onClick={() => {
                          // Prevent any default confirmation dialogs
                          if (window.confirm !== undefined) {
                            const originalConfirm = window.confirm;
                            window.confirm = function () {
                              return true;
                            };

                            // Reset after a short delay
                            setTimeout(() => {
                              window.confirm = originalConfirm;
                            }, 100);
                          }

                          handlePatientSelection(p);
                        }}
                        tabIndex="0"
                        role="option"
                        aria-selected={p.id === selectedPatientId}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            // Prevent any default confirmation dialogs
                            if (window.confirm !== undefined) {
                              const originalConfirm = window.confirm;
                              window.confirm = function () {
                                return true;
                              };

                              // Reset after a short delay
                              setTimeout(() => {
                                window.confirm = originalConfirm;
                              }, 100);
                            }

                            handlePatientSelection(p);
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="patient-avatar">
                          <img
                            src={getAvatar(0)}
                            alt=""
                            className="avatar-sm"
                          />
                          {p.id === selectedPatientId && (
                            <div className="selection-indicator">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle cx="8" cy="8" r="8" fill="#34A853" />
                                <path
                                  d="M6.5 10.5L4 8L3 9L6.5 12.5L13.5 5.5L12.5 4.5L6.5 10.5Z"
                                  fill="white"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="patient-info">
                          <p className="patient-name">{p.name}</p>
                          <p className="patient-email">{p.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {getFilteredUnassignedPatients().length > 0 &&
                  getFilteredUnassignedPatients().length === 10 && (
                    <div className="text-muted mt-2 small">
                      Showing first 10 results. Refine your search if needed.
                    </div>
                  )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-assign"
                disabled={!selectedPatientId || loading}
                onClick={handleAssignPatientToPsychologist}
                aria-label={
                  selectedPatientId
                    ? `Assign ${
                        getFilteredUnassignedPatients().find(
                          (p) => p.id === selectedPatientId
                        )?.name || "selected patient"
                      } to ${selectedPsychologist?.name}`
                    : "Assign patient"
                }
              >
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    Assigning...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H9v2.5a.5.5 0 0 1-1 0V8.5H5.5a.5.5 0 0 1 0-1H8V5a.5.5 0 0 1 1 0v2.5h2.5z" />
                    </svg>
                    Assign Selected Patient
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Improved Psychologist Details Modal */}
      {showDetailsModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header psychologist-header">
              <div className="d-flex align-items-center gap-3">
                <div className="position-relative">
                  <img src={getAvatar(0)} alt="avatar" className="avatar-lg" />
                  {selectedPsychologist.is_active && (
                    <span className="status-dot active" title="Active"></span>
                  )}
                </div>
                <div>
                  <h4 className="modal-title mb-0">
                    {selectedPsychologist.name}
                  </h4>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn-remove-psychologist"
                  onClick={() => handleDeletePsychologist(selectedPsychologist)}
                >
                  Remove Psychologist
                </button>
                <button
                  className="btn-close"
                  onClick={handleCloseDetails}
                  aria-label="Close"
                />
              </div>
            </div>

            <div className="modal-body">
              <div className="row g-4">
                {/* Basic Information */}
                <div className="col-12">
                  <div className="info-card">
                    <h6 className="section-title">Basic Information</h6>
                    <div className="info-grid">
                      <div className="info-item">
                        <label className="info-label">First Name</label>
                        <p className="info-value">
                          {(() => {
                            const name = selectedPsychologist.name || "";
                            // Special case for your name pattern
                            if (
                              name.includes("Mark") &&
                              name.includes("Joseph") &&
                              name.includes("Rosales") &&
                              name.includes("Molina")
                            ) {
                              return "Mark Joseph";
                            }

                            // Default fallback
                            const nameParts = name.split(" ");
                            return nameParts[0] || "";
                          })()}
                        </p>
                      </div>
                      <div className="info-item">
                        <label className="info-label">Middle Name</label>
                        <p className="info-value">
                          {(() => {
                            const name = selectedPsychologist.name || "";
                            // Special case for your name pattern
                            if (
                              name.includes("Mark") &&
                              name.includes("Joseph") &&
                              name.includes("Rosales") &&
                              name.includes("Molina")
                            ) {
                              return "Rosales";
                            }

                            // Default fallback
                            const nameParts = name.split(" ");
                            if (nameParts.length > 2) {
                              return nameParts.slice(1, -1).join(" ");
                            }
                            return "";
                          })()}
                        </p>
                      </div>
                      <div className="info-item">
                        <label className="info-label">Last Name</label>
                        <p className="info-value">
                          {(() => {
                            const name = selectedPsychologist.name || "";
                            // Special case for your name pattern
                            if (
                              name.includes("Mark") &&
                              name.includes("Joseph") &&
                              name.includes("Rosales") &&
                              name.includes("Molina")
                            ) {
                              return "Molina";
                            }

                            // Default fallback
                            const nameParts = name.split(" ");
                            if (nameParts.length > 1) {
                              return nameParts[nameParts.length - 1];
                            }
                            return "";
                          })()}
                        </p>
                      </div>
                      <div className="info-item">
                        <label className="info-label">Email</label>
                        <p className="info-value">
                          {selectedPsychologist.email}
                        </p>
                      </div>
                      <div className="info-item">
                        <label className="info-label">ID</label>
                        <p className="info-value id-value">
                          {selectedPsychologist.id}
                        </p>
                      </div>
                      <div className="info-item">
                        <label className="info-label">License Number</label>
                        <p className="info-value">
                          {selectedPsychologist.license_number ||
                            "Not provided"}
                        </p>
                      </div>
                      <div className="info-item">
                        <label className="info-label">Gender</label>
                        <p className="info-value">
                          {selectedPsychologist.sex || "Not provided"}
                        </p>
                      </div>
                      <div className="info-item">
                        <label className="info-label">Contact Number</label>
                        <p className="info-value contact-value">
                          {selectedPsychologist.contact ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                fill="currentColor"
                                className="me-1 text-success"
                                viewBox="0 0 16 16"
                              >
                                <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                              </svg>
                              <a
                                href={`tel:${selectedPsychologist.contact.replace(
                                  /\D/g,
                                  ""
                                )}`}
                                className="contact-link"
                              >
                                {selectedPsychologist.contact}
                              </a>
                            </>
                          ) : (
                            <span className="text-muted">Not provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Patients Section */}
                <div className="col-12">
                  <div className="info-card">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="section-title mb-0">Assigned Patients</h6>
                      <button
                        className="btn btn-success btn-sm assign-btn"
                        onClick={handleAssignFromDetailsView}
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
                    <div className="patients-table-container">
                      <table className="table table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPsychologistPatients.map((patient) => (
                            <tr key={patient.id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <img
                                    src={getAvatar(0)}
                                    alt="avatar"
                                    className="avatar-sm"
                                  />
                                  {patient.name}
                                </div>
                              </td>
                              <td className="id-cell">{patient.id}</td>
                              <td>{patient.email}</td>
                              <td>
                                <button
                                  className="btn-unassign"
                                  onClick={() =>
                                    handleUnassignPatient(patient.id)
                                  }
                                >
                                  Unassign
                                </button>
                              </td>
                            </tr>
                          ))}
                          {selectedPsychologistPatients.length === 0 && (
                            <tr>
                              <td colSpan="4" className="text-center py-4">
                                <div className="empty-state">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    fill="currentColor"
                                    className="bi bi-people text-muted mb-2"
                                    viewBox="0 0 16 16"
                                  >
                                    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                                  </svg>
                                  <p className="text-muted mb-0">
                                    No patients assigned yet
                                  </p>
                                  <p className="text-muted small">
                                    Click "Assign Patient" to add patients to
                                    this psychologist
                                  </p>
                                </div>
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
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-sm">
            <div className="modal-body text-center">
              <div className="mb-4">
                <div className="delete-icon-container mb-3">
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
                <h5 className="modal-title mb-3">Remove Psychologist</h5>
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
        </div>
      )}
      {/* Add Assign Confirmation Modal */}
      {showAssignConfirmModal && (
        <div className="modal-backdrop confirmation-backdrop">
          <div className="modal-content modal-sm confirmation-modal">
            <div className="modal-body text-center">
              <div className="mb-4">
                <div className="confirm-icon-container mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    fill="currentColor"
                    className="text-primary"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                  </svg>
                </div>
                <h5 className="modal-title mb-3">Confirm Assignment</h5>
                <p className="text-muted mb-0">
                  Are you sure you want to assign{" "}
                  <strong>
                    {selectedPatientName || getSelectedPatientName()}
                  </strong>{" "}
                  to <strong>{selectedPsychologist?.name}</strong>?
                </p>
              </div>
              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn btn-light"
                  onClick={() => setShowAssignConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    // Prevent any default confirmation dialogs
                    if (window.confirm !== undefined) {
                      const originalConfirm = window.confirm;
                      window.confirm = function () {
                        return true;
                      };

                      // Reset after a delay that covers the operation
                      setTimeout(() => {
                        window.confirm = originalConfirm;
                      }, 500);
                    }

                    confirmAssignPatient();
                  }}
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Unassign Confirmation Modal */}
      {showUnassignConfirmModal && (
        <div className="modal-backdrop confirmation-backdrop">
          <div className="modal-content modal-sm confirmation-modal">
            <div className="modal-body text-center">
              <div className="mb-4">
                <div className="warning-icon-container mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    fill="currentColor"
                    className="text-warning"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                  </svg>
                </div>
                <h5 className="modal-title mb-3">Confirm Unassignment</h5>
                <p className="text-muted mb-0">
                  Are you sure you want to unassign{" "}
                  <strong>{patientToUnassign?.name}</strong> from{" "}
                  <strong>{selectedPsychologist?.name}</strong>?
                </p>
              </div>
              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn btn-light"
                  onClick={() => {
                    setShowUnassignConfirmModal(false);
                    setPatientToUnassign(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    // Prevent any default confirmation dialogs
                    if (window.confirm !== undefined) {
                      const originalConfirm = window.confirm;
                      window.confirm = function () {
                        return true;
                      };

                      // Reset after a delay that covers the operation
                      setTimeout(() => {
                        window.confirm = originalConfirm;
                      }, 500);
                    }

                    confirmUnassignPatient();
                  }}
                >
                  Confirm Unassignment
                </button>
              </div>
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

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        
        .modal-content {
          background: #fff;
          border-radius: 16px;
          width: 500px;
          max-width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          position: relative;
          animation: modalFadeIn 0.3s ease-out;
        }
        
        /* Assign modal should appear on top */
        .assign-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20000; /* Higher z-index than regular modal */
        }
        
        .assign-modal-content {
          background: #fff;
          border-radius: 16px;
          width: 500px;
          max-width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
          position: relative;
          animation: modalFadeIn 0.3s ease-out;
          z-index: 20001; /* Even higher z-index */
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-content.modal-lg {
          width: 800px;
        }

        .modal-content.modal-sm {
          width: 400px;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .psychologist-header {
          background: linear-gradient(to right, #d1f5e0, #e8f7ef);
          border-radius: 16px 16px 0 0;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e9ecef;
        }

        .btn-close {
          padding: 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .btn-close:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.05);
        }

        .btn-close::before {
          content: "×";
          font-size: 24px;
          line-height: 1;
        }

        /* Information card styling */
        .info-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e9ecef;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #495057;
          margin-bottom: 1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 0.875rem;
          color: #6c757d;
          margin-bottom: 0.25rem;
        }

        .info-value {
          font-size: 1rem;
          color: #212529;
          margin: 0;
        }

        .id-value {
          font-family: monospace;
          font-size: 0.875rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-active {
          color: #22c55e;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
        }

        .status-inactive {
          color: #6c757d;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
        }

        .status-dot {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .status-dot.active {
          background-color: #34a853;
        }

        /* Patients table styling */
        .patients-table-container {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
          max-height: 300px;
          overflow-y: auto;
        }

        .table {
          margin-bottom: 0;
        }

        .table thead {
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
          box-shadow: 0 1px 0 #e9ecef;
        }

        .table th {
          font-weight: 600;
          color: #6c757d;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          border-bottom: 2px solid #e9ecef;
        }

        .table td {
          vertical-align: middle;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e9ecef;
        }

        .table tbody tr:last-child td {
          border-bottom: none;
        }

        .table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .id-cell {
          font-family: monospace;
          font-size: 0.875rem;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #e9ecef;
        }

        .avatar-lg {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .assign-btn {
          background: #34a853;
          border-color: #34a853;
          font-weight: 500;
        }

        .assign-btn:hover {
          background: #2d9249;
          border-color: #2d9249;
        }

        .btn-unassign {
          border: 1px solid #6c757d;
          color: #ffffff;
          background-color: #6c757d;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s;
          font-weight: normal;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .btn-unassign:hover {
          color: #ffffff;
          border-color: #dc3545;
          background-color: #dc3545;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-unassign:active {
          transform: translateY(1px);
          box-shadow: none;
          background-color: #c82333;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          color: #6c757d;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .btn-remove-psychologist {
          border: 1px solid #dc3545;
          color: #ffffff;
          background-color: #dc3545;
          font-size: 0.875rem;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          transition: all 0.2s;
          font-weight: normal;
          cursor: pointer;
          margin-right: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .btn-remove-psychologist:hover {
          background-color: #c82333;
          border-color: #bd2130;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .btn-remove-psychologist:active {
          transform: translateY(1px);
          box-shadow: none;
          background-color: #bd2130;
        }

        /* Enhanced assign modal styles */
        .patient-selection-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 4px;
        }
        
        .patient-card {
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #FFFFFF;
          border: 1px solid transparent;
        }
        
        .patient-card:hover {
          background: #F9FAFB;
        }
        
        .patient-card:focus {
          outline: none;
          box-shadow: 0 0 0 2px #34A853;
        }
        
        .patient-card-selected {
          background: #F0FDF4;
          border-color: #34A853;
        }
        
        .patient-avatar {
          position: relative;
          margin-right: 12px;
        }
        
        .selection-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #34A853;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
        
        .patient-info {
          flex: 1;
        }
        
        .patient-name {
          font-weight: 500;
          color: #111827;
          margin: 0 0 4px 0;
        }
        
        .patient-email {
          font-size: 0.75rem;
          color: #6B7280;
          margin: 0;
        }
        
        .search-container {
          position: relative;
          margin-bottom: 16px;
        }
        
        .search-container svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
        }
        
        .search-input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #34A853;
          box-shadow: 0 0 0 3px rgba(52, 168, 83, 0.1);
        }
        
        .clear-search {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9CA3AF;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .clear-search:hover {
          background: #F3F4F6;
          color: #4B5563;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          color: #6B7280;
        }
        
        .btn-assign {
          background: #34A853;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px 16px;
          font-weight: 500;
          width: 100%;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-assign:hover {
          background: #2D9249;
        }
        
        .btn-assign:disabled {
          background: #9CA3AF;
          cursor: not-allowed;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }
        
        /* Assign modal header styles */
        .assign-modal .modal-header {
          border-bottom: 1px solid #E5E7EB;
          background: #34A853;
          color: white;
          border-radius: 8px 8px 0 0;
        }
        
        .assign-modal .modal-title {
          color: white;
          font-weight: 600;
        }
        
        .assign-modal .btn-close {
          color: white;
          opacity: 0.8;
        }
        
        .assign-modal .btn-close:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.2);
        }

        .assign-modal .modal-content {
          max-width: 480px;
        }
        
        /* Update existing modal styles to match new design */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        
        .modal-content {
          background: #fff;
          border-radius: 16px;
          width: 500px;
          max-width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          position: relative;
          animation: modalFadeIn 0.3s ease-out;
        }
        
        /* Assign modal should appear on top */
        .assign-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20000; /* Higher z-index than regular modal */
        }
        
        .assign-modal-content {
          background: #fff;
          border-radius: 16px;
          width: 500px;
          max-width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
          position: relative;
          animation: modalFadeIn 0.3s ease-out;
          z-index: 20001; /* Even higher z-index */
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .patient-card {
            padding: 10px;
          }
          
          .patient-name {
            font-size: 0.9rem;
          }
          
          .patient-email {
            font-size: 0.7rem;
          }
          
          .btn-assign {
            padding: 10px;
          }
        }

        /* Add styles for confirmation modals to appear above other modals */
        .confirmation-backdrop {
          z-index: 30000; /* Higher than assign modal */
          background: rgba(0, 0, 0, 0.8);
        }

        .confirmation-modal {
          z-index: 30001; /* Higher than confirmation backdrop */
          position: relative;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        /* Icon container styles */
        .confirm-icon-container, .warning-icon-container, .delete-icon-container {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .confirm-icon-container {
          background-color: rgba(13, 110, 253, 0.15);
        }

        .warning-icon-container {
          background-color: rgba(255, 193, 7, 0.15);
        }

        .delete-icon-container {
          background-color: rgba(220, 53, 69, 0.15);
        }

        /* Add these styles at the end of the style tag */
        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        
        .pagination-info {
          font-size: 0.875rem;
          color: #6c757d;
        }
        
        .pagination {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        
        .pagination-btn {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #212529;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .pagination-btn:hover:not(:disabled) {
          background: #e9ecef;
          border-color: #dee2e6;
        }
        
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination-num {
          min-width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          cursor: pointer;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #212529;
        }
        
        .pagination-num:hover {
          background: #e9ecef;
        }
        
        .pagination-num.active {
          background: #34A853;
          color: white;
          border-color: #34A853;
        }

        .btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #495057;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .btn-icon:hover {
          background-color: #e9ecef;
          color: #212529;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .btn-icon:active {
          transform: translateY(1px);
          box-shadow: none;
        }

        .text-end {
          text-align: right;
        }

        .id-column {
          font-family: monospace;
          font-size: 0.875rem;
        }

        .text-truncate {
          max-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .contact-value {
          display: flex;
          align-items: center;
        }

        .contact-link {
          color: #212529;
          text-decoration: none;
          transition: color 0.2s;
        }

        .contact-link:hover {
          color: #34A853;
          text-decoration: underline;
        }

        .name-display-item {
          grid-column: span 2;
        }
        .name-parts-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .name-part {
          display: flex;
          align-items: center;
        }
        .name-part-label {
          width: 60px;
          font-size: 0.75rem;
          color: #6c757d;
        }
        .name-part-value {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
