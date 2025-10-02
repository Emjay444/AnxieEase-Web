import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabaseClient";
import { authService } from "../services/authService";
import { adminService } from "../services/adminService";
import { psychologistService } from "../services/psychologistService";
import deviceService from "../services/deviceService";
import AddDoctorModal from "./AddDoctorModal";
import ProfilePicture from "./ProfilePicture";
import ChangePasswordOTPModal from "./ChangePasswordOTPModal";
import { getFullName } from "../utils/helpers";
import {
  Users,
  UserPlus,
  Settings,
  Activity,
  Search,
  Filter,
  MoreVertical,
  ChevronDown,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  BarChart3,
  CheckCircle,
  User,
  X,
  AlertTriangle,
  Smartphone,
  Battery,
  Wifi,
  WifiOff,
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import LogoutButton from "./LogoutButton";
// Charts
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

ChartJS.register(
  ArcElement,
  ChartTooltip,
  ChartLegend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

// Success Modal Component
const SuccessModal = ({ isOpen, onClose, title, message, details = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred backdrop with slight dark tint */}
      <div
        className="absolute inset-0 bg-transparent backdrop-blur-md"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        onClick={onClose}
      ></div>

      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Success icon and title */}
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>

          {/* Message */}
          <p className="text-gray-600 mb-4">{message}</p>

          {/* OK button */}
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPanelNew = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [psychologistSearchTerm, setPsychologistSearchTerm] = useState("");
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [patientSortBy, setPatientSortBy] = useState("all"); // all, assigned, unassigned, name

  // Device Management state
  const [deviceStatus, setDeviceStatus] = useState({
    device_id: "AnxieEase001",
    device_name: "AnxieEase Sensor #001",
    status: "available",
    assigned_user: null,
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [deviceStats, setDeviceStats] = useState({
    total_devices: 1,
    device_status: "available",
    assigned_user: null,
    total_users: 0,
    available_users: 0,
  });
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceError, setDeviceError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Pagination state for activity logs
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Analytics state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showAddPsychologistModal, setShowAddPsychologistModal] =
    useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCreatingPsychologist, setIsCreatingPsychologist] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    message: "",
    details: [],
  });

  // Password change states (OTP-based only)
  const [showChangePasswordOTPModal, setShowChangePasswordOTPModal] =
    useState(false);

  // Admin management states
  const [adminsList, setAdminsList] = useState([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({
    email: "",
    fullName: "",
  });
  const [addAdminFormErrors, setAddAdminFormErrors] = useState({
    email: "",
    fullName: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(false);
  const [showDeleteOwnAccountModal, setShowDeleteOwnAccountModal] =
    useState(false);
  const [deletingOwnAccount, setDeletingOwnAccount] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Real data states - connected to Supabase
  const [stats, setStats] = useState({
    totalPsychologists: 0,
    activePsychologists: 0,
    inactivePsychologists: 0,
    totalPatients: 0,
    activeAssignments: 0,
    pendingRequests: 0,
  });

  const [psychologists, setPsychologists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Activity logs filtering and sorting state
  const [activityDateFilter, setActivityDateFilter] = useState(null);
  const [activitySortOrder, setActivitySortOrder] = useState("desc"); // "desc" for newest first, "asc" for oldest first

  const [analyticsData, setAnalyticsData] = useState({
    genderDistribution: { male: 0, female: 0, other: 0 },
    ageDistribution: { "18-25": 0, "26-35": 0, "36-45": 0, "46+": 0 },
    monthlyRegistrations: {
      Jan: 0,
      Feb: 0,
      Mar: 0,
      Apr: 0,
      May: 0,
      Jun: 0,
      Jul: 0,
      Aug: 0,
      Sep: 0,
      Oct: 0,
      Nov: 0,
      Dec: 0,
    },
    totalPatients: 0,
  });

  // State for psychologist actions
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    contact: "",
    specialization: "",
  });
  const [isUpdatingPsychologist, setIsUpdatingPsychologist] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [psychologistToDelete, setPsychologistToDelete] = useState(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [deleteResult, setDeleteResult] = useState({
    success: false,
    message: "",
    psychologistName: "",
  });
  const [showActivateConfirmModal, setShowActivateConfirmModal] =
    useState(false);
  const [psychologistToToggle, setPsychologistToToggle] = useState(null);
  const [showResetEmailModal, setShowResetEmailModal] = useState(false);
  const [psychologistToReset, setPsychologistToReset] = useState(null);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  // State for deactivate blocked modal
  const [showDeactivateBlockedModal, setShowDeactivateBlockedModal] =
    useState(false);
  const [deactivateBlockedData, setDeactivateBlockedData] = useState({
    psychologist: null,
    errorMessage: "",
  });

  // State for deactivation success modal
  const [showDeactivateSuccessModal, setShowDeactivateSuccessModal] =
    useState(false);
  const [deactivateSuccessData, setDeactivateSuccessData] = useState({
    psychologist: null,
    action: "", // "activated" or "deactivated"
  });

  // State for general error modal
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({
    title: "",
    message: "",
  });

  // State for patient actions
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientViewModal, setShowPatientViewModal] = useState(false);
  const [showPatientEditModal, setShowPatientEditModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [patientToAssign, setPatientToAssign] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState(null);

  // Load real data from Supabase
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard statistics
      const statsData = await adminService.getDashboardStats();
      setStats({
        totalPsychologists: statsData.psychologistsCount || 0,
        activePsychologists: statsData.activePsychologistsCount || 0,
        inactivePsychologists: statsData.inactivePsychologistsCount || 0,
        totalPatients: statsData.patientsCount || 0,
        activeAssignments:
          statsData.patientsCount - statsData.unassignedPatientsCount || 0,
        pendingRequests: statsData.unassignedPatientsCount || 0,
      });

      // Load unassigned patients
      const unassignedData = await adminService.getUnassignedPatients();
      setUnassignedPatients(unassignedData);

      // Load all users and separate patients
      const allUsers = await adminService.getAllUsers();
      const patientsList = allUsers.filter((user) => user.role === "patient");
      setPatients(patientsList);

      // Load psychologists
      let psychologistsList = [];
      try {
        psychologistsList = await psychologistService.getAllPsychologists();
        console.log("✅ Loaded psychologists:", psychologistsList);
        console.log("✅ Psychologist count:", psychologistsList.length);
        console.log(
          "✅ Psychologist names:",
          psychologistsList.map((p) => ({
            name: getFullName(p),
            email: p.email,
            avatar_url: p.avatar_url,
          }))
        );
        setPsychologists(psychologistsList);
      } catch (psychError) {
        console.error("❌ Error loading psychologists:", psychError);
        // Set empty array as fallback
        setPsychologists([]);
      }

      // Load activity logs
      const logs = await adminService.getActivityLogs();
      setActivityLogs(logs);

      // Load analytics data
      const analytics = await adminService.getAnalyticsData(selectedYear);
      setAnalyticsData(analytics);

      console.log("Dashboard data loaded:", {
        stats: statsData,
        unassigned: unassignedData,
        patients: patientsList,
        psychologists: psychologistsList,
        logs: logs,
        analytics: analytics,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load devices data
  const loadDevicesData = async () => {
    try {
      setLoadingDevices(true);
      setDeviceError(null);
      const [deviceStatusData, usersData, statsData] = await Promise.all([
        deviceService.getDeviceStatus(),
        deviceService.getAvailableUsers(),
        deviceService.getDeviceStats(),
      ]);
      setDeviceStatus(deviceStatusData);
      setAvailableUsers(usersData);
      setDeviceStats(statsData);
    } catch (error) {
      console.error("Error loading devices:", error);
      setDeviceError(error.message || "Failed to load device data");
    } finally {
      setLoadingDevices(false);
    }
  };

  // Handle device assignment
  const handleAssignDevice = async (userId) => {
    try {
      setLoadingDevices(true);
      await deviceService.assignDeviceToUser(userId);
      setShowAssignModal(false);
      await loadDevicesData(); // Refresh data

      // Find the assigned user for success message
      const assignedUser = availableUsers.find((user) => user.id === userId);
      setSuccessMessage({
        title: "Device Assigned Successfully",
        message: `AnxieEase device has been successfully assigned to ${assignedUser?.first_name} ${assignedUser?.last_name}`,
        details: [
          `Device ID: AnxieEase001`,
          `Patient: ${assignedUser?.first_name} ${assignedUser?.last_name}`,
          `Assignment Date: ${new Date().toLocaleString()}`,
        ],
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error assigning device:", error);
      setDeviceError(error.message || "Failed to assign device");
    } finally {
      setLoadingDevices(false);
    }
  };

  // Handle device access removal
  const handleRemoveAccess = async () => {
    try {
      setLoadingDevices(true);
      const previousUser = deviceStatus.assigned_user;
      await deviceService.removeDeviceAccess();
      await loadDevicesData(); // Refresh data

      setSuccessMessage({
        title: "Device Access Removed",
        message: `AnxieEase device access has been successfully removed from ${previousUser?.first_name} ${previousUser?.last_name}`,
        details: [
          `Device ID: AnxieEase001`,
          `Previous Patient: ${previousUser?.first_name} ${previousUser?.last_name}`,
          `Removal Date: ${new Date().toLocaleString()}`,
        ],
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error removing access:", error);
      setDeviceError(error.message || "Failed to remove device access");
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load devices when switching to devices tab
  useEffect(() => {
    if (activeTab === "devices") {
      loadDevicesData();
    }
  }, [activeTab]);

  // Reset pagination when switching to activity tab
  useEffect(() => {
    if (activeTab === "activity") {
      setCurrentPage(1);
    }
  }, [activeTab]);

  // Load admins list when switching to settings tab
  useEffect(() => {
    if (activeTab === "settings") {
      loadAdminsList();
    }
  }, [activeTab]);

  // Load analytics data when year changes
  const loadAnalyticsData = async (year) => {
    try {
      const analytics = await adminService.getAnalyticsData(year);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    }
  };

  // Effect to reload analytics when year changes
  useEffect(() => {
    loadAnalyticsData(selectedYear);
  }, [selectedYear]);

  // OTP-based password change handlers
  const handleOTPPasswordChangeSuccess = (message) => {
    setSuccessMessage({
      title: "Password Updated Successfully",
      message: message,
      details: [
        "Your password has been updated with OTP verification",
        "The new password is now active for your account",
        "Please use your new password for future logins",
      ],
    });
    setShowSuccessModal(true);
  };

  const handleOTPPasswordChangeError = (message) => {
    setErrorModalData({
      title: "OTP Password Update Failed",
      message: message,
    });
    setShowErrorModal(true);
  };

  // Admin management functions
  const loadAdminsList = async () => {
    try {
      const result = await adminService.getAllAdmins();
      if (result.success) {
        console.log("📋 All admins from database:", result.admins);
        console.log("📋 Current user email:", user?.email);
        console.log("📋 Current user ID:", user?.id);
        console.log(
          "📋 Admin IDs and emails:",
          result.admins.map((admin) => `${admin.id}: "${admin.email}"`)
        );
        console.log("📋 Filtering out current user from admin list...");
        const filteredAdmins = result.admins.filter((admin) => {
          const shouldKeep = admin.id !== user?.id;
          console.log(
            `📋 Admin "${admin.email}" (ID: ${admin.id}) - Keep: ${shouldKeep}`
          );
          return shouldKeep;
        });
        console.log("📋 Filtered admins:", filteredAdmins);
        setAdminsList(filteredAdmins);
      } else {
        console.error("Error loading admins:", result.error);
        setAdminsList([]);
      }
    } catch (error) {
      console.error("Error loading admins:", error);
      setAdminsList([]);
    }
  };

  const handleAddAdminFormChange = (field, value) => {
    setAddAdminForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific errors when user starts typing
    if (addAdminFormErrors[field]) {
      setAddAdminFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleAddAdmin = async () => {
    setAddingAdmin(true);
    setAddAdminFormErrors({ email: "", fullName: "" });

    try {
      // Validate form
      const errors = {};

      // Email validation
      if (!addAdminForm.email.trim()) {
        errors.email = "Email address is required";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(addAdminForm.email.trim())) {
          errors.email = "Please enter a valid email address";
        }
      }

      // Full name validation
      if (!addAdminForm.fullName.trim()) {
        errors.fullName = "Full name is required";
      }

      // If there are validation errors, show them and stop
      if (Object.keys(errors).length > 0) {
        setAddAdminFormErrors(errors);
        setAddingAdmin(false);
        return;
      }

      // Create admin invitation using the same method as psychologist creation
      const newAdmin = await authService.createAdmin(
        addAdminForm.email,
        addAdminForm.fullName
      );

      // Clear form and close modal
      setAddAdminForm({
        email: "",
        fullName: "",
      });
      setAddAdminFormErrors({
        email: "",
        fullName: "",
      });
      setShowAddAdminModal(false);

      // Reload admins list
      await loadAdminsList();

      // Log the activity
      try {
        await adminService.logActivity(
          user?.id,
          "Admin Account Invited",
          `Sent admin invitation to ${addAdminForm.email} (${addAdminForm.fullName})`
        );
      } catch (logError) {
        console.warn("Failed to log admin invitation activity:", logError);
      }

      // Show success message
      setSuccessMessage({
        title: "Admin Invitation Sent",
        message: `Invitation sent to ${
          addAdminForm.fullName || addAdminForm.email
        }.`,
        details: [
          `Email: ${addAdminForm.email}`,
          `Full Name: ${addAdminForm.fullName || "Not specified"}`,
          "📧 A magic link has been sent to their email address",
          "🔐 They will set their own password during setup",
          "✅ Once setup is complete, they will have full admin access",
        ],
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error adding admin:", error);
      setErrorModalData({
        title: "Failed to Add Admin",
        message: error.message,
      });
      setShowErrorModal(true);
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = (admin) => {
    // Safeguard: prevent deletion of current user (should not happen due to filtering)
    if (admin.id === user?.id) {
      setErrorModalData({
        title: "Cannot Remove Self",
        message: "You cannot remove your own admin account from this list.",
      });
      setShowErrorModal(true);
      return;
    }

    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;

    setDeletingAdmin(true);
    try {
      console.log("🗑️ Removing admin:", adminToDelete.email);

      // Remove from admin_profiles table
      const removeResult = await adminService.removeUserFromAdminsTable(
        adminToDelete.id
      );

      if (!removeResult.success) {
        throw new Error(removeResult.error);
      }

      // Close delete modal
      setShowDeleteModal(false);
      setAdminToDelete(null);

      // Reload admins list
      await loadAdminsList();

      // Log the activity
      try {
        await adminService.logActivity(
          user?.id,
          "Admin Account Deleted",
          `Permanently removed admin account: ${adminToDelete.email} (${
            adminToDelete.full_name || "No name"
          })`
        );
      } catch (logError) {
        console.warn("Failed to log admin deletion activity:", logError);
      }

      // Show success message
      setSuccessMessage({
        title: "Admin Removed",
        message: `${
          adminToDelete.full_name || adminToDelete.email
        } has been permanently removed from the admin system.`,
        details: [
          "The admin account has been completely deleted from the system",
          "They can no longer access the admin dashboard",
        ],
      });
      setShowSuccessModal(true);

      console.log("✅ Admin removed successfully");
    } catch (error) {
      console.error("❌ Error removing admin:", error);
      setErrorModalData({
        title: "Failed to Remove Admin",
        message: error.message || "An unexpected error occurred.",
      });
      setShowErrorModal(true);
    } finally {
      setDeletingAdmin(false);
    }
  };

  const cancelDeleteAdmin = () => {
    setShowDeleteModal(false);
    setAdminToDelete(null);
  };

  const handleDeleteOwnAccount = async () => {
    setDeletingOwnAccount(true);
    try {
      console.log("🗑️ Deleting own admin account:", user?.email);

      // Remove from admin_profiles table
      const removeResult = await adminService.removeUserFromAdminsTable(
        user?.id
      );

      if (!removeResult.success) {
        throw new Error(removeResult.error);
      }

      console.log("✅ Own admin account deleted successfully");

      // Log the activity before signing out
      try {
        await adminService.logActivity(
          user?.id,
          "Admin Self-Deletion",
          `Admin account self-deleted: ${user?.email}`
        );
      } catch (logError) {
        console.warn("Failed to log self-deletion activity:", logError);
      }

      // Close modal
      setShowDeleteOwnAccountModal(false);

      // Sign out the user since their admin account is deleted
      await authService.signOut();

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("❌ Error deleting own account:", error);
      setErrorModalData({
        title: "Failed to Delete Account",
        message: error.message || "An unexpected error occurred.",
      });
      setShowErrorModal(true);
    } finally {
      setDeletingOwnAccount(false);
    }
  };

  const cancelDeleteOwnAccount = () => {
    setShowDeleteOwnAccountModal(false);
  };

  // Handle adding new psychologist
  const handleAddPsychologist = async (psychologistData) => {
    try {
      // Show immediate loading feedback
      setIsCreatingPsychologist(true);

      // Set psychologist as inactive by default until email is verified
      const psychologistWithStatus = {
        ...psychologistData,
        is_active: false, // Set to inactive until email verification
      };

      // Close the modal immediately but keep loading state
      setShowAddPsychologistModal(false);

      // Map the name fields from AddDoctorModal format to service format
      const mappedPsychologist = {
        ...psychologistWithStatus,
        first_name:
          psychologistWithStatus.firstName || psychologistWithStatus.first_name,
        middle_name:
          psychologistWithStatus.middleName ||
          psychologistWithStatus.middle_name,
        last_name:
          psychologistWithStatus.lastName || psychologistWithStatus.last_name,
        // Clean up the old format fields to avoid confusion
        firstName: undefined,
        middleName: undefined,
        lastName: undefined,
      };

      const newPsychologist = await psychologistService.createPsychologist(
        mappedPsychologist
      );

      // Run these operations in parallel for better performance
      const [updatedPsychologists, statsData, updatedLogs] = await Promise.all([
        psychologistService.getAllPsychologists(),
        adminService.getDashboardStats(),
        adminService.getActivityLogs(), // Reload activity logs to show the new creation
      ]);

      // Update state
      setPsychologists(updatedPsychologists);
      setStats({
        totalPsychologists: statsData.psychologistsCount || 0,
        activePsychologists: statsData.activePsychologistsCount || 0,
        inactivePsychologists: statsData.inactivePsychologistsCount || 0,
        totalPatients: statsData.patientsCount || 0,
        activeAssignments:
          statsData.patientsCount - statsData.unassignedPatientsCount || 0,
        pendingRequests: 0,
      });

      // Update activity logs with the new entry
      setActivityLogs(updatedLogs);

      // Show success modal with detailed information
      setSuccessMessage({
        title: "Psychologist Account Created Successfully!",
        message: `Dr. ${psychologistData.name}'s account has been created and an invitation email has been sent.`,
        details: [
          {
            type: "info",
            text: `An email verification link has been sent to ${psychologistData.email}.`,
          },
          {
            type: "warning",
            text: "The account will remain inactive until the psychologist verifies their email address.",
          },
          {
            type: "info",
            text: "Once verified, they can complete their profile setup and begin seeing patients.",
          },
          {
            type: "warning",
            text: "⚠️ IMPORTANT: When the psychologist clicks the setup link, it may affect your current session. We recommend opening the setup link in a private/incognito browser tab to avoid being logged out.",
          },
        ],
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error adding psychologist:", error);
      alert("❌ Failed to create psychologist account: " + error.message);
    } finally {
      // Clear loading state
      setIsCreatingPsychologist(false);
    }
  };

  // Handle psychologist actions
  const handleViewPsychologist = (psychologist) => {
    setSelectedPsychologist(psychologist);
    setShowViewModal(true);
  };

  const handleEditPsychologist = (psychologist) => {
    setSelectedPsychologist(psychologist);
    setEditFormData({
      name: getFullName(psychologist) || "",
      contact: psychologist.contact || "",
      specialization: psychologist.specialization || "",
    });
    setShowEditModal(true);
  };

  const handleSavePsychologistChanges = async () => {
    try {
      setIsUpdatingPsychologist(true);

      // Update in the database with timeout
      const updatePromise = psychologistService.updatePsychologist(
        selectedPsychologist.id,
        {
          name: editFormData.name,
          contact: editFormData.contact,
          specialization: editFormData.specialization,
        }
      );

      // Add timeout to prevent UI hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Update operation timed out")), 8000)
      );

      const updatedPsychologist = await Promise.race([
        updatePromise,
        timeoutPromise,
      ]);

      // Update local state
      setPsychologists((prev) =>
        prev.map((p) =>
          p.id === selectedPsychologist.id ? { ...p, ...editFormData } : p
        )
      );

      // Log the activity
      await adminService.logActivity(
        user?.id,
        "Edit Psychologist",
        `Updated psychologist information: ${editFormData.name}`
      );

      // Refresh activity logs
      const updatedLogs = await adminService.getActivityLogs();
      setActivityLogs(updatedLogs);

      // Show success message
      setSuccessMessage({
        title: "Psychologist Updated Successfully!",
        message: `${editFormData.name}'s information has been updated.`,
      });
      setShowSuccessModal(true);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating psychologist:", error);
      alert(`Error updating psychologist: ${error.message}`);
    } finally {
      setIsUpdatingPsychologist(false);
    }
  };

  const handlePsychologistOptions = (psychologistId) => {
    setShowOptionsMenu(
      showOptionsMenu === psychologistId ? null : psychologistId
    );
  };

  const handleDeactivatePsychologist = async (psychologist) => {
    try {
      // Check if we're deactivating or activating
      const newStatus = !psychologist.is_active;

      if (!newStatus) {
        // Deactivating - use the special deactivation method with patient check
        await psychologistService.deactivatePsychologist(psychologist.id);
      } else {
        // Activating - use regular update method
        await psychologistService.updatePsychologist(psychologist.id, {
          is_active: newStatus,
        });
      }

      // Update local state
      setPsychologists((prev) =>
        prev.map((p) =>
          p.id === psychologist.id ? { ...p, is_active: newStatus } : p
        )
      );

      // Refresh dashboard statistics to reflect the change
      await loadDashboardData();

      setShowOptionsMenu(null);

      // Show custom success modal instead of browser alert
      setDeactivateSuccessData({
        psychologist: psychologist,
        action: newStatus ? "activated" : "deactivated",
      });
      setShowDeactivateSuccessModal(true);
    } catch (error) {
      console.error("Error updating psychologist:", error);

      // Show user-friendly error message
      if (error.message.includes("assigned patient")) {
        // Show custom modal instead of browser alert
        setDeactivateBlockedData({
          psychologist: psychologist,
          errorMessage: error.message,
        });
        setShowDeactivateBlockedModal(true);
      } else {
        setErrorModalData({
          title: "Update Failed",
          message: "Failed to update psychologist status: " + error.message,
        });
        setShowErrorModal(true);
      }
    }
  };

  // Patient handler functions
  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientViewModal(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientEditModal(true);
  };

  // Handle opening assignment modal
  const handleOpenAssignmentModal = (patient) => {
    setPatientToAssign(patient);
    setShowAssignmentModal(true);
  };

  // Handle assignment confirmation
  const handleAssignmentConfirmation = (
    patientId,
    psychologistId,
    psychologistName,
    isUnassign = false
  ) => {
    // Get patient name using helper function
    const patientName = getFullName(patientToAssign);

    // Set all states together to minimize re-renders
    setPendingAssignment({
      patientId,
      psychologistId,
      psychologistName,
      isUnassign,
      patientName,
      patientData: patientToAssign, // Add the full patient object
    });
    setShowAssignmentModal(false);
    setShowConfirmationModal(true);
  };

  // Confirm the assignment
  const confirmAssignment = async () => {
    if (!pendingAssignment) return;

    setShowConfirmationModal(false);

    try {
      await handlePsychologistAssignment(
        pendingAssignment.patientId,
        pendingAssignment.psychologistId
      );

      // Show success modal instead of alert
      setSuccessMessage({
        title: pendingAssignment.isUnassign
          ? "Patient Unassigned"
          : "Patient Assigned",
        message: pendingAssignment.isUnassign
          ? `${pendingAssignment.patientName} has been unassigned successfully.`
          : `${pendingAssignment.patientName} has been assigned to ${pendingAssignment.psychologistName}.`,
        details: [],
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Assignment error:", error);
      // Show error in success modal format
      setSuccessMessage({
        title: "Assignment Failed",
        message: `Failed to ${
          pendingAssignment.isUnassign ? "unassign" : "assign"
        } patient. Please try again.`,
        details: [{ text: error.message, type: "warning" }],
      });
      setShowSuccessModal(true);
    } finally {
      setPendingAssignment(null);
      setPatientToAssign(null);
    }
  };

  // Handle psychologist assignment change
  const handlePsychologistAssignment = async (patientId, psychologistId) => {
    try {
      const result = await adminService.assignPatientToPsychologist(
        patientId,
        psychologistId
      );

      if (result.success) {
        // Update the local state to reflect the change
        setPatients(
          patients.map((patient) =>
            patient.id === patientId
              ? {
                  ...patient,
                  assigned_psychologist_id: psychologistId,
                  assigned_psychologist_name: psychologistId
                    ? getFullName(
                        psychologists.find((p) => p.id === psychologistId)
                      ) || null
                    : null,
                }
              : patient
          )
        );

        // Reload dashboard data to refresh stats
        await loadDashboardData();

        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error with patient assignment:", error);
      throw error;
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = "emerald" }) => {
    const palette = {
      emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
      green: { bg: "bg-green-50", text: "text-green-600" },
      purple: { bg: "bg-purple-50", text: "text-purple-600" },
      orange: { bg: "bg-orange-50", text: "text-orange-600" },
      blue: { bg: "bg-blue-50", text: "text-blue-600" },
      yellow: { bg: "bg-yellow-50", text: "text-yellow-600" },
      gray: { bg: "bg-gray-50", text: "text-gray-600" },
    };
    const colors = palette[color] || palette.emerald;
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
        </div>
      </div>
    );
  };

  const TabButton = ({ tab, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </button>
  );

  const PsychologistCard = ({ psychologist }) => (
    <div
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all ${
        !psychologist.is_active ? "opacity-60 bg-gray-50" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`${!psychologist.is_active ? "opacity-60" : ""}`}>
            <ProfilePicture patient={psychologist} size={48} className="" />
          </div>
          <div>
            <h3
              className={`font-semibold ${
                psychologist.is_active ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {getFullName(psychologist)}
            </h3>
            <p
              className={`text-sm ${
                psychologist.is_active ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {psychologist.specialization || ""}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => handlePsychologistOptions(psychologist.id)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showOptionsMenu === psychologist.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowOptionsMenu(null);
                    setPsychologistToToggle(psychologist);
                    setShowActivateConfirmModal(true);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    psychologist.is_active
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {psychologist.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(null);
                    setPsychologistToReset(psychologist);
                    setShowResetEmailModal(true);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Send Reset Email
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(null);
                    handleEditPsychologist(psychologist);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    console.log(
                      "Delete button clicked for:",
                      getFullName(psychologist)
                    );
                    setShowOptionsMenu(null);
                    setPsychologistToDelete(psychologist);
                    setShowDeleteConfirmModal(true);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div
          className={`flex items-center text-sm ${
            psychologist.is_active ? "text-gray-600" : "text-gray-400"
          }`}
        >
          <Mail className="h-4 w-4 mr-2" />
          {psychologist.email}
        </div>
        <div
          className={`flex items-center text-sm ${
            psychologist.is_active ? "text-gray-600" : "text-gray-400"
          }`}
        >
          <Phone className="h-4 w-4 mr-2" />
          {psychologist.contact || "No contact info"}
        </div>
        <div
          className={`flex items-center text-sm ${
            psychologist.is_active ? "text-gray-600" : "text-gray-400"
          }`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Joined {new Date(psychologist.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            psychologist.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {psychologist.is_active ? "Active" : "Deactivated"}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewPsychologist(psychologist)}
            className={`text-sm font-medium ${
              psychologist.is_active
                ? "text-blue-600 hover:text-blue-900"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );

  // Don't show full-screen loading after initial load
  if (loading && !stats.totalPsychologists && !stats.totalPatients) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="/anxieease-logo.png"
                alt="AnxieEase"
                className="h-6 w-6 logo-breathe"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <h1 className="text-2xl font-bold text-gray-900">
                AnxieEase Admin
              </h1>
              <span className="text-sm text-gray-500">Dashboard</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Welcome back!
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <LogoutButton variant="icon" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6">
          <TabButton
            tab="overview"
            label="Overview"
            icon={BarChart3}
            isActive={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            tab="psychologists"
            label="Psychologists"
            icon={Users}
            isActive={activeTab === "psychologists"}
            onClick={() => setActiveTab("psychologists")}
          />
          <TabButton
            tab="patients"
            label="Patients"
            icon={UserPlus}
            isActive={activeTab === "patients"}
            onClick={() => setActiveTab("patients")}
          />
          <TabButton
            tab="devices"
            label="Device Management"
            icon={Smartphone}
            isActive={activeTab === "devices"}
            onClick={() => setActiveTab("devices")}
          />
          <TabButton
            tab="activity"
            label="Activity"
            icon={Activity}
            isActive={activeTab === "activity"}
            onClick={() => setActiveTab("activity")}
          />
          <TabButton
            tab="settings"
            label="Settings"
            icon={Settings}
            isActive={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Enhanced Psychologists Card with Breakdown */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-emerald-100">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      Total Psychologists
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalPsychologists}
                    </p>
                  </div>
                </div>
                {/* Breakdown */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active:</span>
                    <span className="font-medium text-emerald-600">
                      {stats.activePsychologists}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Inactive:</span>
                    <span className="font-medium text-gray-500">
                      {stats.inactivePsychologists}
                    </span>
                  </div>
                </div>
              </div>

              <StatCard
                title="Total Patients"
                value={stats.totalPatients}
                icon={UserPlus}
                color="green"
              />
              <StatCard
                title="Active Assignments"
                value={stats.activeAssignments}
                icon={UserCheck}
                color="purple"
              />
              <StatCard
                title="Total Devices"
                value={1}
                icon={Smartphone}
                color="blue"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab("psychologists")}
                  className="flex items-center p-4 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-emerald-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Add Psychologist
                    </p>
                    <p className="text-sm text-gray-600">
                      Create new psychologist profile
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("patients")}
                  className="flex items-center p-4 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <UserCheck className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Assign Patient</p>
                    <p className="text-sm text-gray-600">
                      View and manage patient assignments
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gender Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 text-emerald-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Gender Distribution
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="w-full h-64">
                    <Pie
                      data={{
                        labels: ["Male", "Female"],
                        datasets: [
                          {
                            data: [
                              analyticsData.genderDistribution.male || 0,
                              analyticsData.genderDistribution.female || 0,
                            ],
                            backgroundColor: ["#22c55e", "#ef4444"], // green, red
                            borderColor: "#ffffff",
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: "bottom" },
                        },
                      }}
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Total:
                      </span>
                      <span className="font-semibold">
                        {analyticsData.totalPatients} patients
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Age Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Age Distribution
                  </h3>
                </div>
                <div className="w-full h-64">
                  <Bar
                    data={(() => {
                      const hist = analyticsData.ageHistogram || {};

                      // Define age groups (5-year ranges)
                      const ageGroups = [
                        { label: "0-4", min: 0, max: 4 },
                        { label: "5-9", min: 5, max: 9 },
                        { label: "10-14", min: 10, max: 14 },
                        { label: "15-19", min: 15, max: 19 },
                        { label: "20-24", min: 20, max: 24 },
                        { label: "25-29", min: 25, max: 29 },
                        { label: "30-34", min: 30, max: 34 },
                        { label: "35-39", min: 35, max: 39 },
                        { label: "40-44", min: 40, max: 44 },
                        { label: "45-49", min: 45, max: 49 },
                        { label: "50-54", min: 50, max: 54 },
                        { label: "55-59", min: 55, max: 59 },
                        { label: "60-64", min: 60, max: 64 },
                        { label: "65-69", min: 65, max: 69 },
                        { label: "70-74", min: 70, max: 74 },
                        { label: "75+", min: 75, max: 120 },
                      ];

                      // Calculate count for each age group
                      const groupCounts = ageGroups.map((group) => {
                        let count = 0;
                        for (let age = group.min; age <= group.max; age++) {
                          count += hist[String(age)] || 0;
                        }
                        return count;
                      });

                      return {
                        labels: ageGroups.map((group) => group.label),
                        datasets: [
                          {
                            label: "Patients",
                            data: groupCounts,
                            backgroundColor: "#3b82f6", // blue-500
                            borderRadius: 4,
                            borderSkipped: false,
                            barThickness: 40,
                            maxBarThickness: 60,
                            categoryPercentage: 0.8,
                            barPercentage: 0.9,
                          },
                        ],
                      };
                    })()}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            title: function (context) {
                              return `Age Group: ${context[0].label}`;
                            },
                            label: function (context) {
                              const hist = analyticsData.ageHistogram || {};
                              const ageGroups = [
                                { label: "0-4", min: 0, max: 4 },
                                { label: "5-9", min: 5, max: 9 },
                                { label: "10-14", min: 10, max: 14 },
                                { label: "15-19", min: 15, max: 19 },
                                { label: "20-24", min: 20, max: 24 },
                                { label: "25-29", min: 25, max: 29 },
                                { label: "30-34", min: 30, max: 34 },
                                { label: "35-39", min: 35, max: 39 },
                                { label: "40-44", min: 40, max: 44 },
                                { label: "45-49", min: 45, max: 49 },
                                { label: "50-54", min: 50, max: 54 },
                                { label: "55-59", min: 55, max: 59 },
                                { label: "60-64", min: 60, max: 64 },
                                { label: "65-69", min: 65, max: 69 },
                                { label: "70-74", min: 70, max: 74 },
                                { label: "75+", min: 75, max: 120 },
                              ];

                              // Find the current age group
                              const currentGroup = ageGroups[context.dataIndex];
                              if (!currentGroup)
                                return `Total: ${context.parsed.y} patients`;

                              // Build detailed breakdown
                              const breakdown = [];
                              for (
                                let age = currentGroup.min;
                                age <= currentGroup.max;
                                age++
                              ) {
                                const count = hist[String(age)] || 0;
                                if (count > 0) {
                                  breakdown.push(
                                    `Age ${age}: ${count} patient${
                                      count > 1 ? "s" : ""
                                    }`
                                  );
                                }
                              }

                              if (breakdown.length === 0) {
                                return `Total: ${context.parsed.y} patients`;
                              }

                              return [
                                `Total: ${context.parsed.y} patients`,
                                "─────────────────",
                                ...breakdown,
                              ];
                            },
                          },
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          titleColor: "white",
                          bodyColor: "white",
                          borderColor: "#3b82f6",
                          borderWidth: 1,
                          cornerRadius: 8,
                          displayColors: false,
                          titleFont: {
                            size: 14,
                            weight: "bold",
                          },
                          bodyFont: {
                            size: 12,
                          },
                          padding: 12,
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: {
                            font: {
                              size: 12,
                              weight: "bold",
                            },
                            maxRotation: 0,
                            minRotation: 0,
                          },
                        },
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                            stepSize: (() => {
                              const hist = analyticsData.ageHistogram || {};
                              const allValues = Object.values(hist).filter(
                                (val) => typeof val === "number" && val > 0
                              );
                              const maxVal = allValues.length
                                ? Math.max(...allValues)
                                : 0;

                              // Dynamic step size based on max value
                              if (maxVal <= 10) return 1; // Steps of 1 for small numbers
                              if (maxVal <= 50) return 5; // Steps of 5 for medium numbers
                              if (maxVal <= 100) return 10; // Steps of 10 for larger numbers
                              return Math.ceil(maxVal / 10); // Dynamic steps for very large numbers
                            })(),
                            font: {
                              size: 12,
                            },
                            callback: function (value) {
                              // Always show whole numbers only
                              return Number.isInteger(value) ? value : "";
                            },
                          },
                          suggestedMax: (() => {
                            const hist = analyticsData.ageHistogram || {};

                            // Calculate max from grouped data (more accurate for our chart)
                            const ageGroups = [
                              { label: "0-4", min: 0, max: 4 },
                              { label: "5-9", min: 5, max: 9 },
                              { label: "10-14", min: 10, max: 14 },
                              { label: "15-19", min: 15, max: 19 },
                              { label: "20-24", min: 20, max: 24 },
                              { label: "25-29", min: 25, max: 29 },
                              { label: "30-34", min: 30, max: 34 },
                              { label: "35-39", min: 35, max: 39 },
                              { label: "40-44", min: 40, max: 44 },
                              { label: "45-49", min: 45, max: 49 },
                              { label: "50-54", min: 50, max: 54 },
                              { label: "55-59", min: 55, max: 59 },
                              { label: "60-64", min: 60, max: 64 },
                              { label: "65-69", min: 65, max: 69 },
                              { label: "70-74", min: 70, max: 74 },
                              { label: "75+", min: 75, max: 120 },
                            ];

                            // Calculate max group count
                            let maxGroupCount = 0;
                            ageGroups.forEach((group) => {
                              let groupCount = 0;
                              for (
                                let age = group.min;
                                age <= group.max;
                                age++
                              ) {
                                groupCount += hist[String(age)] || 0;
                              }
                              maxGroupCount = Math.max(
                                maxGroupCount,
                                groupCount
                              );
                            });

                            // Smart scaling based on actual chart data
                            if (maxGroupCount === 0) {
                              return 5; // Show small scale when no data
                            } else if (maxGroupCount <= 5) {
                              return 10; // Minimum readable scale
                            } else if (maxGroupCount <= 10) {
                              return Math.ceil(maxGroupCount * 1.5); // 50% headroom for small numbers
                            } else if (maxGroupCount <= 50) {
                              return Math.ceil(maxGroupCount * 1.3); // 30% headroom for medium numbers
                            } else if (maxGroupCount <= 100) {
                              return Math.ceil(maxGroupCount * 1.2); // 20% headroom for larger numbers
                            } else {
                              return Math.ceil(maxGroupCount * 1.1); // 10% headroom for very large numbers
                            }
                          })(),
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Monthly Registrations */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Monthly Registrations
                    </h3>
                  </div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="text-sm bg-white border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {(() => {
                      const currentYear = new Date().getFullYear();
                      const years = [];
                      for (
                        let year = currentYear;
                        year >= currentYear - 10;
                        year--
                      ) {
                        years.push(year);
                      }
                      return years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
                <div className="w-full h-64">
                  <Line
                    data={{
                      labels: Object.keys(
                        analyticsData.monthlyRegistrations || {}
                      ),
                      datasets: [
                        {
                          label: `Registrations ${selectedYear}`,
                          data: Object.values(
                            analyticsData.monthlyRegistrations || {}
                          ),
                          borderColor: "#a855f7", // purple-500
                          backgroundColor: "rgba(168, 85, 247, 0.15)",
                          tension: 0.3,
                          fill: true,
                          pointRadius: 3,
                          pointBackgroundColor: "#7c3aed", // purple-600
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false } },
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                            stepSize: 1,
                          },
                          suggestedMax: (() => {
                            const vals = Object.values(
                              analyticsData.monthlyRegistrations || {}
                            ).map((v) => Number(v) || 0);
                            const maxVal = vals.length ? Math.max(...vals) : 0;

                            // Dynamic scaling based on actual data
                            if (maxVal === 0) return 5; // Show 0-5 when no data
                            if (maxVal <= 5) return maxVal + 2; // Small numbers: add 2 for headroom
                            if (maxVal <= 10) return maxVal + 3; // Medium numbers: add 3 for headroom
                            return Math.ceil(maxVal * 1.2); // Large numbers: add 20% headroom
                          })(),
                        },
                      },
                    }}
                  />
                </div>
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Total {selectedYear}:
                    </span>
                    <span className="font-semibold">
                      {Object.values(
                        analyticsData.monthlyRegistrations || {}
                      ).reduce((sum, count) => sum + count, 0)}{" "}
                      patients
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Psychologists Tab */}
        {activeTab === "psychologists" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Psychologists
              </h2>
              <button
                onClick={() => setShowAddPsychologistModal(true)}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Psychologist
              </button>
            </div>

            {/* Search Bar for Psychologists */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search psychologists..."
                value={psychologistSearchTerm}
                onChange={(e) => setPsychologistSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {psychologists.filter((psychologist) => {
                const name = getFullName(psychologist).toLowerCase();
                const term = psychologistSearchTerm.toLowerCase();
                return (
                  name.includes(term) ||
                  (psychologist.email || "").toLowerCase().includes(term)
                );
              }).length > 0 ? (
                psychologists
                  .filter((psychologist) => {
                    const name = getFullName(psychologist).toLowerCase();
                    const term = psychologistSearchTerm.toLowerCase();
                    return (
                      name.includes(term) ||
                      (psychologist.email || "").toLowerCase().includes(term)
                    );
                  })
                  .map((psychologist) => (
                    <PsychologistCard
                      key={psychologist.id}
                      psychologist={psychologist}
                    />
                  ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No psychologists found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {psychologistSearchTerm.trim()
                      ? `No psychologists match "${psychologistSearchTerm}". Try adjusting your search terms.`
                      : "No psychologists have been added yet."}
                  </p>
                  {psychologistSearchTerm.trim() && (
                    <button
                      onClick={() => setPsychologistSearchTerm("")}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === "patients" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Patients</h2>
              <div className="flex space-x-2">
                {/* Sort Dropdown */}
                <select
                  value={patientSortBy}
                  onChange={(e) => setPatientSortBy(e.target.value)}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">All Patients</option>
                  <option value="assigned">Assigned Patients</option>
                  <option value="unassigned">Unassigned Patients</option>
                  <option value="name">Sort by Name</option>
                  <option value="dateAsc">Date Added (Oldest First)</option>
                  <option value="dateDesc">Date Added (Newest First)</option>
                </select>
                <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
              </div>
            </div>

            {/* Search Bar for Patients */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Psychologist
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          if (patientSortBy === "dateAsc") {
                            setPatientSortBy("dateDesc");
                          } else {
                            setPatientSortBy("dateAsc");
                          }
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date Added</span>
                          {patientSortBy === "dateAsc" && (
                            <ChevronDown className="h-4 w-4 rotate-180" />
                          )}
                          {patientSortBy === "dateDesc" && (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      // First filter by search term
                      let filteredPatients = patients.filter((patient) => {
                        const patientName = getFullName(patient);

                        return patientName
                          .toLowerCase()
                          .includes(patientSearchTerm.toLowerCase());
                      });

                      // Then apply sorting/filtering by assignment status
                      switch (patientSortBy) {
                        case "assigned":
                          filteredPatients = filteredPatients.filter(
                            (patient) => patient.assigned_psychologist_id
                          );
                          break;
                        case "unassigned":
                          filteredPatients = filteredPatients.filter(
                            (patient) => !patient.assigned_psychologist_id
                          );
                          break;
                        case "name":
                          filteredPatients = filteredPatients.sort((a, b) => {
                            const nameA =
                              a.name ||
                              `${a.first_name || ""} ${
                                a.last_name || ""
                              }`.trim() ||
                              "Unknown";
                            const nameB =
                              b.name ||
                              `${b.first_name || ""} ${
                                b.last_name || ""
                              }`.trim() ||
                              "Unknown";
                            return nameA.localeCompare(nameB);
                          });
                          break;
                        case "dateAsc":
                          filteredPatients = filteredPatients.sort((a, b) => {
                            const dateA = new Date(
                              a.created_at || a.date_added || 0
                            );
                            const dateB = new Date(
                              b.created_at || b.date_added || 0
                            );
                            return dateA - dateB; // Oldest first
                          });
                          break;
                        case "dateDesc":
                          filteredPatients = filteredPatients.sort((a, b) => {
                            const dateA = new Date(
                              a.created_at || a.date_added || 0
                            );
                            const dateB = new Date(
                              b.created_at || b.date_added || 0
                            );
                            return dateB - dateA; // Newest first
                          });
                          break;
                        case "all":
                        default:
                          // Sort by assignment status first (assigned first), then by name
                          filteredPatients = filteredPatients.sort((a, b) => {
                            // First priority: assignment status (assigned patients first)
                            const aAssigned = !!a.assigned_psychologist_id;
                            const bAssigned = !!b.assigned_psychologist_id;

                            if (aAssigned !== bAssigned) {
                              return bAssigned - aAssigned; // assigned (true) comes before unassigned (false)
                            }

                            // Second priority: alphabetical by name
                            const nameA =
                              a.name ||
                              `${a.first_name || ""} ${
                                a.last_name || ""
                              }`.trim() ||
                              "Unknown";
                            const nameB =
                              b.name ||
                              `${b.first_name || ""} ${
                                b.last_name || ""
                              }`.trim() ||
                              "Unknown";
                            return nameA.localeCompare(nameB);
                          });
                          break;
                      }

                      if (patients.length > 0 && filteredPatients.length > 0) {
                        return filteredPatients.map((patient) => (
                          <tr key={patient.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {patient.assigned_psychologist_id ? (
                                    <div
                                      className="w-3 h-3 bg-green-500 rounded-full"
                                      title="Assigned"
                                    ></div>
                                  ) : (
                                    <div
                                      className="w-3 h-3 bg-gray-400 rounded-full"
                                      title="Unassigned"
                                    ></div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {getFullName(patient)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {patient.assigned_psychologist_id ? (
                                  <div className="flex items-center space-x-2">
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                    <span className="text-green-600 font-medium">
                                      {loading ? (
                                        <div className="flex items-center space-x-2">
                                          <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin"></div>
                                          <span className="text-gray-500">
                                            Loading psychologist...
                                          </span>
                                        </div>
                                      ) : (
                                        getFullName(
                                          psychologists.find(
                                            (p) =>
                                              p.id ===
                                              patient.assigned_psychologist_id
                                          )
                                        ) || "Unknown Psychologist"
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <UserX className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-400 italic">
                                      Unassigned
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {patient.created_at || patient.date_added
                                ? new Date(
                                    patient.created_at || patient.date_added
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {/* Assignment button */}
                                <button
                                  onClick={() =>
                                    handleOpenAssignmentModal(patient)
                                  }
                                  className="text-emerald-600 hover:text-emerald-900 px-2 py-1 rounded border border-emerald-600 hover:border-emerald-900 text-xs font-medium transition-colors"
                                >
                                  {patient.assigned_psychologist_id
                                    ? "Reassign"
                                    : "Assign"}
                                </button>

                                {/* View button */}
                                <button
                                  onClick={() => handleViewPatient(patient)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      } else if (
                        patients.length > 0 &&
                        filteredPatients.length === 0 &&
                        patientSearchTerm
                      ) {
                        // Show no results message when search yields no results
                        return (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="bg-gray-100 p-3 rounded-full">
                                  <svg
                                    className="h-8 w-8 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                  </svg>
                                </div>
                                <div className="text-center">
                                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    No patients found
                                  </h3>
                                  <p className="text-gray-500 mb-4">
                                    No patients match your search for "
                                    {patientSearchTerm}"
                                  </p>
                                  <button
                                    onClick={() => setPatientSearchTerm("")}
                                    className="text-emerald-600 hover:text-emerald-800 font-medium"
                                  >
                                    Clear search
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      } else {
                        // Show default no patients message
                        return (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-6 py-8 text-center text-gray-500"
                            >
                              {loading
                                ? "Loading patients..."
                                : "No patients found"}
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Device Management Tab */}
        {activeTab === "devices" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Device Management
                </h2>
                <p className="text-gray-600">
                  Manage device assignments and user access
                </p>
              </div>
            </div>

            {/* Enhanced Device Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Total Devices
                    </p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">1</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Total Patients
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {deviceStats.total_users}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-emerald-50 p-4 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                      Assigned Patients
                    </p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">
                      {deviceStats.available_users}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Device Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              {loadingDevices ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading device...</p>
                </div>
              ) : deviceError ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-red-600 font-semibold mb-1">
                    Error loading device
                  </p>
                  <p className="text-gray-600 text-sm mb-4">{deviceError}</p>
                  <button
                    onClick={loadDevicesData}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center shadow-inner">
                        <Smartphone className="w-7 h-7 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                          {deviceStatus.device_name}
                        </h3>
                        <p className="text-gray-500 text-xs font-medium mb-2">
                          Device ID: {deviceStatus.device_id}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              deviceStatus.status === "available"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {deviceStatus.status === "available" && (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {deviceStatus.status === "assigned" && (
                              <User className="w-3 h-3 mr-1" />
                            )}
                            {deviceStatus.status === "available"
                              ? "Available"
                              : "Assigned"}
                          </span>
                          {deviceStatus.status === "assigned" && (
                            <div className="flex items-center bg-gray-100 px-2.5 py-0.5 rounded-full">
                              <span className="text-xs font-medium text-gray-700">
                                Assigned to:{" "}
                                {deviceStatus.assigned_user_name ||
                                  [
                                    deviceStatus.assigned_user?.first_name,
                                    deviceStatus.assigned_user?.last_name,
                                  ]
                                    .filter(Boolean)
                                    .join(" ") ||
                                  "Unknown patient"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {deviceStatus.status === "assigned" ? (
                        <button
                          onClick={handleRemoveAccess}
                          disabled={loadingDevices}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-sm hover:shadow"
                        >
                          <UserX className="w-4 h-4" />
                          <span>Remove Access</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAssignModal(true)}
                          disabled={
                            loadingDevices || availableUsers.length === 0
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-sm hover:shadow"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Assign Device</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {deviceStatus.linked_at && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <span className="font-medium">Assignment Date:</span>
                        <span>
                          {new Date(deviceStatus.linked_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Assignment Modal */}
            {showAssignModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowAssignModal(false)}
                ></div>
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">
                        Assign Device to Patient
                      </h3>
                      <button
                        onClick={() => setShowAssignModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <p className="text-gray-600 mb-6">
                      Select a patient to assign the AnxieEase device to:
                    </p>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleAssignDevice(user.id)}
                          className="w-full text-left p-4 border border-gray-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Patient ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowAssignModal(false)}
                        className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Activity
              </h2>

              {/* Date Filter and Sort Controls */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <label htmlFor="activityDateFilter" className="sr-only">
                    Filter by date
                  </label>
                  <input
                    type="date"
                    id="activityDateFilter"
                    value={activityDateFilter || ""}
                    onChange={(e) => {
                      setActivityDateFilter(e.target.value || null);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={() => {
                    setActivitySortOrder(
                      activitySortOrder === "desc" ? "asc" : "desc"
                    );
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {activitySortOrder === "desc"
                      ? "Newest First"
                      : "Oldest First"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      activitySortOrder === "desc" ? "" : "rotate-180"
                    }`}
                  />
                </button>

                {activityDateFilter && (
                  <button
                    onClick={() => {
                      setActivityDateFilter(null);
                      setCurrentPage(1);
                    }}
                    className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading activity logs...</p>
                </div>
              ) : activityLogs.length > 0 ? (
                (() => {
                  // Apply date filtering and sorting
                  let filteredAndSortedLogs = [...activityLogs];

                  // Apply date filter
                  if (activityDateFilter) {
                    const filterDate = new Date(activityDateFilter);
                    filteredAndSortedLogs = filteredAndSortedLogs.filter(
                      (log) => {
                        const logDate = new Date(log.timestamp);
                        return (
                          logDate.getDate() === filterDate.getDate() &&
                          logDate.getMonth() === filterDate.getMonth() &&
                          logDate.getFullYear() === filterDate.getFullYear()
                        );
                      }
                    );
                  }

                  // Apply sorting
                  filteredAndSortedLogs.sort((a, b) => {
                    const dateA = new Date(a.timestamp);
                    const dateB = new Date(b.timestamp);
                    return activitySortOrder === "desc"
                      ? dateB - dateA
                      : dateA - dateB;
                  });

                  // Calculate pagination based on filtered results
                  const totalPages = Math.ceil(
                    filteredAndSortedLogs.length / itemsPerPage
                  );
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentLogs = filteredAndSortedLogs.slice(
                    startIndex,
                    endIndex
                  );

                  return (
                    <>
                      <div className="space-y-4">
                        {currentLogs.map((log, index) => (
                          <div
                            key={log.id || index}
                            className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <Activity className="h-4 w-4 text-emerald-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {log.action}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {log.details && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {log.details}
                                </p>
                              )}
                              {log.user_id && (
                                <p className="text-xs text-gray-400 mt-1">
                                  User ID: {log.user_id}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-500">
                            Showing {startIndex + 1} to{" "}
                            {Math.min(endIndex, filteredAndSortedLogs.length)}{" "}
                            of {filteredAndSortedLogs.length} activity logs
                            {activityDateFilter && (
                              <span className="ml-2 text-emerald-600">
                                (filtered by{" "}
                                {new Date(
                                  activityDateFilter
                                ).toLocaleDateString()}
                                )
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                currentPage === 1
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              Previous
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center space-x-1">
                              {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                              ).map((pageNum) => {
                                // Show first page, last page, current page, and pages around current
                                const showPage =
                                  pageNum === 1 ||
                                  pageNum === totalPages ||
                                  Math.abs(pageNum - currentPage) <= 1;

                                if (
                                  !showPage &&
                                  pageNum !== 2 &&
                                  pageNum !== totalPages - 1
                                ) {
                                  // Show ellipsis for gaps
                                  if (pageNum === 2 && currentPage > 4) {
                                    return (
                                      <span
                                        key={pageNum}
                                        className="text-gray-400"
                                      >
                                        ...
                                      </span>
                                    );
                                  }
                                  if (
                                    pageNum === totalPages - 1 &&
                                    currentPage < totalPages - 3
                                  ) {
                                    return (
                                      <span
                                        key={pageNum}
                                        className="text-gray-400"
                                      >
                                        ...
                                      </span>
                                    );
                                  }
                                  return null;
                                }

                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                      currentPage === pageNum
                                        ? "bg-emerald-600 text-white"
                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                currentPage === totalPages
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No activity logs found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Activity will appear here as users interact with the system
                  </p>
                </div>
              ) : (
                // No results after filtering
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No activity found for{" "}
                    {new Date(activityDateFilter).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try selecting a different date or clear the filter
                  </p>
                  <button
                    onClick={() => {
                      setActivityDateFilter(null);
                      setCurrentPage(1);
                    }}
                    className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Clear date filter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Admin Settings
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Manage your admin account settings
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Account Information */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Account Information
                    </h3>
                    <button
                      onClick={() => setShowDeleteOwnAccountModal(true)}
                      className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm border border-red-200 hover:border-red-300"
                      title="Delete My Account"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                        {user?.email}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed for security reasons
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                        Administrator
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Management */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Password Management
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Change Password
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Secure password change with OTP verification via email
                        </p>
                      </div>
                      <button
                        onClick={() => setShowChangePasswordOTPModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Change Password</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Admin Management */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Admin Management
                  </h3>

                  {/* Current Admins List */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Current Administrators
                        </h4>
                        <button
                          onClick={() => setShowAddAdminModal(true)}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Add Admin</span>
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {adminsList.length > 0 ? (
                        adminsList.map((admin, index) => (
                          <div key={admin.id} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {admin.full_name || "Admin User"}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {admin.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  Administrator
                                </span>
                                <button
                                  onClick={() => handleRemoveAdmin(admin)}
                                  className="flex items-center space-x-1 px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-sm"
                                  title="Delete Admin Account"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No administrators found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Psychologist Modal */}
      <AddDoctorModal
        show={showAddPsychologistModal}
        onClose={() => setShowAddPsychologistModal(false)}
        onSave={handleAddPsychologist}
        isLoading={isCreatingPsychologist}
      />

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Add New Administrator
              </h3>
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setAddAdminForm({ email: "", fullName: "" });
                  setAddAdminFormErrors({ email: "", fullName: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={addAdminForm.email}
                  onChange={(e) =>
                    handleAddAdminFormChange("email", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    addAdminFormErrors.email
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="admin@example.com"
                  required
                />
                {addAdminFormErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {addAdminFormErrors.email}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={addAdminForm.fullName}
                  onChange={(e) =>
                    handleAddAdminFormChange("fullName", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    addAdminFormErrors.fullName
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="John Doe"
                  required
                />
                {addAdminFormErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">
                    {addAdminFormErrors.fullName}
                  </p>
                )}
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📧 <strong>Invitation Process:</strong> A magic link will be
                  sent to this email address. The recipient will set their own
                  password during account setup.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setAddAdminForm({ email: "", fullName: "" });
                    setAddAdminFormErrors({ email: "", fullName: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={addingAdmin}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAdmin}
                  disabled={
                    addingAdmin ||
                    !addAdminForm.email.trim() ||
                    !addAdminForm.fullName.trim()
                  }
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingAdmin ? "Sending Invitation..." : "Send Invitation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
        details={successMessage.details}
        type="success"
      />

      {/* Enhanced View Psychologist Modal */}
      {showViewModal && selectedPsychologist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            {/* Enhanced Header with modern gradient */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 py-8">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>

              <div className="relative flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                      Psychologist Details
                    </h2>
                    <p className="text-emerald-100 text-lg font-medium mt-1">
                      Complete professional information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                >
                  <X className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-140px)] px-8 py-8 custom-scrollbar">
              <div className="space-y-8">
                {/* Enhanced Profile Section */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                      <div className="relative group">
                        <div className="relative">
                          <ProfilePicture
                            patient={selectedPsychologist}
                            size={128}
                            className="ring-4 ring-white shadow-xl"
                          />
                        </div>
                        <div
                          className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                            selectedPsychologist.is_active
                              ? "bg-gradient-to-r from-green-400 to-green-500"
                              : "bg-gradient-to-r from-amber-400 to-yellow-500"
                          }`}
                        >
                          {selectedPsychologist.is_active ? (
                            <CheckCircle className="h-5 w-5 text-white" />
                          ) : (
                            <Clock className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">
                          {getFullName(selectedPsychologist)}
                        </h3>
                        {selectedPsychologist.specialization && (
                          <p className="text-emerald-700 font-semibold text-lg mb-4 bg-emerald-50 px-4 py-2 rounded-xl inline-block">
                            {selectedPsychologist.specialization}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                          <span
                            className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
                              selectedPsychologist.is_active
                                ? "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200"
                                : "bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                selectedPsychologist.is_active
                                  ? "bg-green-500"
                                  : "bg-amber-500"
                              }`}
                            ></div>
                            {selectedPsychologist.is_active
                              ? "Active"
                              : "Pending Verification"}
                          </span>
                          <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            <Calendar className="w-4 h-4 mr-2" />
                            Joined{" "}
                            {new Date(
                              selectedPsychologist.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="group hover:scale-[1.02] transition-transform duration-300">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full hover:shadow-lg transition-shadow">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                          <Mail className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          Contact Information
                        </h4>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <Mail className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              Email Address
                            </p>
                            <p className="text-gray-900 font-semibold break-all">
                              {selectedPsychologist.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <Phone className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              Contact Number
                            </p>
                            <p className="text-gray-900 font-semibold">
                              {selectedPsychologist.contact || (
                                <span className="text-gray-500 italic">
                                  Not provided
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="group hover:scale-[1.02] transition-transform duration-300">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full hover:shadow-lg transition-shadow">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          Account Information
                        </h4>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <Calendar className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              Join Date
                            </p>
                            <p className="text-gray-900 font-semibold">
                              {new Date(
                                selectedPsychologist.created_at
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <Users className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              Gender
                            </p>
                            <p className="text-gray-900 font-semibold">
                              {selectedPsychologist.sex || (
                                <span className="text-gray-500 italic">
                                  Not specified
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <Calendar className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              Birth Date
                            </p>
                            <p className="text-gray-900 font-semibold">
                              {selectedPsychologist.birth_date ? (
                                <>
                                  {new Date(
                                    selectedPsychologist.birth_date
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}{" "}
                                  (
                                  {Math.floor(
                                    (Date.now() -
                                      new Date(
                                        selectedPsychologist.birth_date
                                      ).getTime()) /
                                      (365.25 * 24 * 60 * 60 * 1000)
                                  )}{" "}
                                  years old)
                                </>
                              ) : (
                                <span className="text-gray-500 italic">
                                  Not specified
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Assigned Patients Section */}
                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900">
                        Assigned Patients
                      </h4>
                    </div>
                    {(() => {
                      const assignedPatients = patients.filter(
                        (patient) =>
                          patient.assigned_psychologist_id ===
                          selectedPsychologist.id
                      );
                      return (
                        assignedPatients.length > 0 && (
                          <div className="bg-emerald-100 px-4 py-2 rounded-xl">
                            <span className="text-emerald-800 font-semibold text-sm">
                              {assignedPatients.length} patient
                              {assignedPatients.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )
                      );
                    })()}
                  </div>

                  {(() => {
                    const assignedPatients = patients.filter(
                      (patient) =>
                        patient.assigned_psychologist_id ===
                        selectedPsychologist.id
                    );

                    if (assignedPatients.length === 0) {
                      return (
                        <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-200">
                          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-10 w-10 text-gray-400" />
                          </div>
                          <h5 className="text-xl font-semibold text-gray-700 mb-2">
                            No Patients Yet
                          </h5>
                          <p className="text-gray-500 max-w-sm mx-auto">
                            This psychologist hasn't been assigned any patients
                            yet. Patients will appear here once assigned.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                          {assignedPatients.map((patient, index) => (
                            <div
                              key={patient.id}
                              className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:bg-gray-100 hover:shadow-md hover:scale-[1.01] transition-all duration-200 group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="relative">
                                    <ProfilePicture
                                      patient={patient}
                                      size={48}
                                      className="ring-2 ring-gray-300 group-hover:ring-emerald-300 transition-colors"
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                      <CheckCircle className="h-3 w-3 text-white" />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-lg">
                                      {getFullName(patient)}
                                    </p>
                                    <p className="text-gray-600 font-medium">
                                      {patient.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Assigned
                                  </span>
                                  {patient.created_at && (
                                    <p className="text-xs text-gray-500 mt-2 font-medium">
                                      Since{" "}
                                      {new Date(
                                        patient.created_at
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Enhanced Footer */}
              <div className="bg-gray-50 px-8 py-6 flex justify-end border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl hover:from-gray-900 hover:to-black transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Psychologist Modal */}
      {showEditModal && selectedPsychologist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-4 border border-white/20">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 -m-8 mb-8 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Edit Psychologist
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 transition-all duration-200 hover:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600">
                  {selectedPsychologist?.email}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-gray-600 font-medium">
                    � Email addresses cannot be changed for security reasons.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={editFormData.contact}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      contact: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 transition-all duration-200 hover:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Birth Date
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600">
                  {selectedPsychologist?.birth_date ? (
                    <>
                      {new Date(
                        selectedPsychologist.birth_date
                      ).toLocaleDateString()}{" "}
                      (
                      {Math.floor(
                        (Date.now() -
                          new Date(selectedPsychologist.birth_date).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                      )}{" "}
                      years old)
                    </>
                  ) : (
                    "Not specified"
                  )}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-gray-600 font-medium">
                    🔒 Birth date cannot be changed through the admin panel.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  value={editFormData.specialization}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      specialization: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 transition-all duration-200 hover:bg-white"
                  placeholder="e.g., Anxiety Disorders, Depression, PTSD"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-xl hover:from-gray-200 hover:to-gray-300 hover:shadow-md transition-all duration-200 font-medium"
                disabled={isUpdatingPsychologist}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePsychologistChanges}
                disabled={isUpdatingPsychologist || !editFormData.name.trim()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 font-medium"
              >
                {isUpdatingPsychologist && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                )}
                {isUpdatingPsychologist ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Loading Overlay for Creating Psychologist */}
      {isCreatingPsychologist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-6 max-w-sm mx-4 border border-white/20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
                Creating Psychologist Account
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Please wait while we set up the account and send the invitation
                email...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirmModal && psychologistToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => {
              setShowDeleteConfirmModal(false);
              setPsychologistToDelete(null);
            }}
          ></div>

          {/* Modal content */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/20">
            <div className="p-6">
              {/* Warning icon and title */}
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.664 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Psychologist Account
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-gray-900">
                    {psychologistToDelete.name}
                  </strong>
                  's account?
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg
                      className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="text-sm text-red-700">
                      <p className="font-medium">This will permanently:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Delete the psychologist's account</li>
                        <li>Remove all patient assignments</li>
                        <li>Clear appointment history</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setPsychologistToDelete(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log(
                        "Deleting psychologist:",
                        psychologistToDelete.id
                      );

                      // Call the delete function
                      const success =
                        await psychologistService.deletePsychologist(
                          psychologistToDelete.id
                        );

                      if (success) {
                        // Log the activity
                        await adminService.logActivity(
                          user?.id,
                          "Delete Psychologist",
                          `Deleted psychologist: ${psychologistToDelete.name} (ID: ${psychologistToDelete.id})`
                        );

                        // Refresh the psychologists list and activity logs
                        const [updatedPsychologists, updatedLogs] =
                          await Promise.all([
                            psychologistService.getAllPsychologists(),
                            adminService.getActivityLogs(),
                          ]);
                        setPsychologists(updatedPsychologists);
                        setActivityLogs(updatedLogs);

                        // Show success modal
                        setDeleteResult({
                          success: true,
                          message:
                            "The psychologist account has been successfully deleted from the system.",
                          psychologistName: psychologistToDelete.name,
                        });
                      } else {
                        // Show error modal
                        setDeleteResult({
                          success: false,
                          message:
                            "Failed to delete psychologist. Please try again or contact support if the issue persists.",
                          psychologistName: psychologistToDelete.name,
                        });
                      }
                    } catch (error) {
                      console.error("Delete error:", error);
                      // Show error modal
                      setDeleteResult({
                        success: false,
                        message: `An error occurred while deleting the psychologist: ${error.message}. Please try again.`,
                        psychologistName: psychologistToDelete.name,
                      });
                    }

                    // Close the confirmation modal and show result modal
                    setShowDeleteConfirmModal(false);
                    setPsychologistToDelete(null);
                    setShowDeleteSuccessModal(true);
                  }}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Activate/Deactivate Confirmation Modal */}
      {showActivateConfirmModal && psychologistToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => {
              setShowActivateConfirmModal(false);
              setPsychologistToToggle(null);
            }}
          ></div>

          {/* Modal content */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/20">
            <div className="p-6">
              {/* Icon and title */}
              <div className="flex items-center mb-6">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    psychologistToToggle.is_active
                      ? "bg-orange-100"
                      : "bg-green-100"
                  }`}
                >
                  {psychologistToToggle.is_active ? (
                    <UserX className="h-6 w-6 text-orange-600" />
                  ) : (
                    <UserCheck className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {psychologistToToggle.is_active ? "Deactivate" : "Activate"}{" "}
                    Psychologist
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {psychologistToToggle.is_active
                      ? "Restrict access"
                      : "Grant access"}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to{" "}
                  {psychologistToToggle.is_active ? "deactivate" : "activate"}{" "}
                  <strong className="text-gray-900">
                    {getFullName(psychologistToToggle)}
                  </strong>
                  ?
                </p>

                <div
                  className={`${
                    psychologistToToggle.is_active
                      ? "bg-orange-50 border-orange-200"
                      : "bg-green-50 border-green-200"
                  } border rounded-lg p-4`}
                >
                  <div className="flex items-start">
                    {psychologistToToggle.is_active ? (
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    )}
                    <div
                      className={`text-sm ${
                        psychologistToToggle.is_active
                          ? "text-orange-800"
                          : "text-green-800"
                      }`}
                    >
                      <p className="font-medium mb-2">
                        {psychologistToToggle.is_active
                          ? "Deactivation Effects:"
                          : "Activation Effects:"}
                      </p>
                      {psychologistToToggle.is_active ? (
                        <ul className="list-disc list-inside space-y-1 text-orange-700">
                          <li>Will not be able to access their account</li>
                          <li>Cannot receive new patient assignments</li>
                          <li>Existing patients will need reassignment</li>
                        </ul>
                      ) : (
                        <ul className="list-disc list-inside space-y-1 text-green-700">
                          <li>Will regain access to their account</li>
                          <li>Can receive new patient assignments</li>
                          <li>Can resume providing services</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowActivateConfirmModal(false);
                    setPsychologistToToggle(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeactivatePsychologist(psychologistToToggle);
                    setShowActivateConfirmModal(false);
                    setPsychologistToToggle(null);
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 text-white ${
                    psychologistToToggle.is_active
                      ? "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                      : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  }`}
                >
                  {psychologistToToggle.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Reset Email Confirmation Modal */}
      {showResetEmailModal && psychologistToReset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Send Password Reset Email
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Send a password reset link to{" "}
                <strong>{psychologistToReset.name}</strong>?
              </p>
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-blue-700">
                  📧 Reset link will be sent to:{" "}
                  <strong>{psychologistToReset.email}</strong>
                </p>
              </div>
              <p className="text-xs text-gray-500">
                The psychologist will receive an email with instructions to
                reset their password.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowResetEmailModal(false);
                  setPsychologistToReset(null);
                }}
                className="flex-1 bg-gray-100 text-gray-900 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsSendingResetEmail(true);
                    const result = await psychologistService.sendResetEmail(
                      psychologistToReset.id
                    );

                    // Show success modal
                    setSuccessMessage({
                      title: "Password Reset Email Sent!",
                      message: `A password reset email has been sent to ${psychologistToReset.email}.`,
                      details: [
                        {
                          type: "info",
                          text: `${psychologistToReset.name} will receive an email with instructions to reset their password.`,
                        },
                        {
                          type: "success",
                          text: "The email should arrive within a few minutes.",
                        },
                      ],
                    });
                    setShowSuccessModal(true);

                    setShowResetEmailModal(false);
                    setPsychologistToReset(null);
                  } catch (error) {
                    console.error("Error sending reset email:", error);
                    alert(`Error sending reset email: ${error.message}`);
                  } finally {
                    setIsSendingResetEmail(false);
                  }
                }}
                disabled={isSendingResetEmail}
                className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSendingResetEmail ? "Sending..." : "Send Reset Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Patient View Modal */}
      {showPatientViewModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            {/* Enhanced Header with Gradient */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-8 py-6">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/30">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Patient Details
                    </h3>
                    <p className="text-emerald-100 text-sm font-medium">
                      Complete patient information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPatientViewModal(false)}
                  className="text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-xl"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Enhanced Content */}
            <div className="p-8">
              {/* Enhanced Patient Profile Section */}
              <div className="text-center mb-8 pb-6 border-b border-gray-200">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto overflow-hidden ring-4 ring-white shadow-xl">
                    <ProfilePicture
                      patient={selectedPatient}
                      size={96}
                      className="h-24 w-24 block rounded-full"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center ring-4 ring-white">
                    <UserCheck className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
                  {getFullName(selectedPatient)}
                </h2>
                <p className="text-gray-500 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full inline-block">
                  Patient Profile
                </p>
              </div>

              {/* Enhanced Information Grid */}
              <div className="space-y-4">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="group hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/50 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-semibold text-emerald-900 mb-1">
                          Email Address
                        </label>
                        <p className="text-emerald-800 text-sm break-all font-medium">
                          {selectedPatient.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Number */}
                  <div className="group hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/50 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-emerald-900 mb-1">
                          Contact Number
                        </label>
                        <p className="text-emerald-800 text-sm font-medium">
                          {selectedPatient.contact_number || (
                            <span className="text-gray-500 italic">
                              No contact number
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div className="group hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200/50 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-teal-900 mb-1">
                          Gender
                        </label>
                        <p className="text-teal-800 text-sm font-medium">
                          {selectedPatient.gender || (
                            <span className="text-gray-500 italic">
                              Not specified
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div className="group hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200/50 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-teal-900 mb-1">
                          Birth Date
                        </label>
                        <p className="text-teal-800 text-sm font-medium">
                          {selectedPatient.birth_date ? (
                            new Date(
                              selectedPatient.birth_date
                            ).toLocaleDateString("en-GB")
                          ) : (
                            <span className="text-gray-500 italic">
                              Not specified
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Added */}
                  <div className="group hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200/50 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-emerald-900 mb-1">
                          Date Added
                        </label>
                        <p className="text-emerald-800 text-sm font-medium">
                          {selectedPatient.date_added}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Psychologist */}
                  <div className="group hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200/50 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <UserCheck className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-emerald-900 mb-1">
                          Assigned Psychologist
                        </label>
                        <p className="text-emerald-800 text-sm font-bold">
                          {selectedPatient.assigned_psychologist_id ? (
                            loading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                                <span className="text-gray-500">
                                  Loading...
                                </span>
                              </div>
                            ) : (
                              getFullName(
                                psychologists.find(
                                  (p) =>
                                    p.id ===
                                    selectedPatient.assigned_psychologist_id
                                )
                              ) || "Unknown Psychologist"
                            )
                          ) : (
                            <span className="text-amber-600 font-medium bg-amber-100 px-2 py-1 rounded-lg">
                              Unassigned
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowPatientViewModal(false)}
                className="px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl hover:from-gray-900 hover:to-black transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Edit Modal */}
      {showPatientEditModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Patient
              </h3>
              <button
                onClick={() => setShowPatientEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  defaultValue={getFullName(selectedPatient)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={selectedPatient.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Psychologist
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">No assignment</option>
                  {psychologists.map((psych) => (
                    <option
                      key={psych.id}
                      value={psych.id}
                      selected={
                        psych.id === selectedPatient.assigned_psychologist_id
                      }
                    >
                      {psych.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPatientEditModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save functionality
                  alert("Save functionality to be implemented");
                  setShowPatientEditModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Assignment Modal */}
      {showAssignmentModal && patientToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Enhanced Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity"
            onClick={() => {
              setShowAssignmentModal(false);
              setPatientToAssign(null);
            }}
          ></div>

          {/* Enhanced Modal content */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20">
            {/* Enhanced Header with gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {patientToAssign.assigned_psychologist_id
                    ? "Reassign Patient"
                    : "Assign Patient"}
                </h2>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setPatientToAssign(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Enhanced Patient Info Header */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 mb-4 border border-emerald-100">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <ProfilePicture
                      patient={patientToAssign}
                      size={48}
                      className="ring-2 ring-white shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <User className="h-2 w-2 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {getFullName(patientToAssign)}
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 shadow-sm">
                      Patient
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Current Assignment */}
              {patientToAssign.assigned_psychologist_id && (
                <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-1 bg-blue-100 rounded-lg">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-blue-900">
                      Currently Assigned
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/60 rounded-lg p-3">
                    <ProfilePicture
                      patient={psychologists.find(
                        (p) => p.id === patientToAssign.assigned_psychologist_id
                      )}
                      size={32}
                      className="ring-1 ring-blue-200"
                    />
                    <div>
                      <p className="text-blue-900 font-bold text-sm">
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <span className="text-gray-500">Loading...</span>
                          </div>
                        ) : (
                          getFullName(
                            psychologists.find(
                              (p) =>
                                p.id ===
                                patientToAssign.assigned_psychologist_id
                            )
                          ) || "Unknown Psychologist"
                        )}
                      </p>
                      <p className="text-blue-600 text-xs font-medium">
                        Psychologist
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Psychologist Selection */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <div className="p-1 bg-emerald-100 rounded-lg mr-2">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  {patientToAssign.assigned_psychologist_id
                    ? "Choose New Assignment"
                    : "Choose Psychologist"}
                </h4>

                {/* Enhanced Unassign option */}
                {patientToAssign.assigned_psychologist_id && (
                  <button
                    onClick={() =>
                      handleAssignmentConfirmation(
                        patientToAssign.id,
                        null,
                        null,
                        true
                      )
                    }
                    className="w-full text-left p-3 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 hover:shadow-lg transition-all duration-200 group bg-gradient-to-br from-red-50 to-pink-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors shadow-sm">
                        <UserX className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-red-700">
                          Remove Assignment
                        </div>
                        <div className="text-xs text-red-600 font-medium">
                          Patient will become unassigned
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Enhanced List of available psychologists */}
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {psychologists
                    .filter(
                      (p) =>
                        (p.status === "active" ||
                          p.is_active === true ||
                          !p.hasOwnProperty("status")) &&
                        p.id !== patientToAssign.assigned_psychologist_id
                    )
                    .map((psychologist) => (
                      <button
                        key={psychologist.id}
                        onClick={() =>
                          handleAssignmentConfirmation(
                            patientToAssign.id,
                            psychologist.id,
                            getFullName(psychologist),
                            false
                          )
                        }
                        className="w-full text-left p-3 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group bg-gradient-to-br from-emerald-50 to-teal-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <ProfilePicture
                              patient={psychologist}
                              size={40}
                              className="ring-1 ring-emerald-200 group-hover:ring-emerald-300 transition-all"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-1 ring-white">
                              <UserCheck className="h-2 w-2 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-900 mb-1">
                              {getFullName(psychologist)}
                            </div>
                            <div className="text-xs text-emerald-600 font-medium mb-1">
                              {psychologist.specialization || "Psychologist"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {psychologist.email}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>

                {/* Enhanced No psychologists available */}
                {psychologists.filter(
                  (p) =>
                    (p.status === "active" ||
                      p.is_active === true ||
                      !p.hasOwnProperty("status")) &&
                    p.id !== patientToAssign.assigned_psychologist_id
                ).length === 0 && (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center shadow-lg">
                        <UserX className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-600 mb-2">
                          No Available Psychologists
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                          All psychologists may be inactive or this patient may
                          already be assigned to all available psychologists
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setPatientToAssign(null);
                  }}
                  className="px-4 py-2 text-sm font-bold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-lg hover:from-gray-200 hover:to-gray-300 hover:shadow-md transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && pendingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowConfirmationModal(false);
              setPendingAssignment(null);
            }}
          ></div>

          {/* Modal content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {pendingAssignment.isUnassign
                  ? "Confirm Unassignment"
                  : "Confirm Assignment"}
              </h2>
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setPendingAssignment(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Patient Info Header */}
              <div className="flex items-center space-x-4 mb-6">
                <ProfilePicture
                  patient={pendingAssignment.patientData}
                  size={48}
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {pendingAssignment.patientName}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Patient
                  </span>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="grid grid-cols-1 gap-6">
                {pendingAssignment.isUnassign ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Action Details
                    </h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <UserX className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            Remove Assignment
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            This patient will become unassigned and available
                            for reassignment to another psychologist.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Assignment Details
                    </h4>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <UserCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-emerald-900">
                            Assign to Psychologist
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium text-emerald-700">
                              {pendingAssignment.psychologistName}
                            </span>
                          </p>
                          <p className="text-xs text-emerald-600 mt-2">
                            The psychologist will be notified of this new
                            assignment.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setPendingAssignment(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={confirmAssignment}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    pendingAssignment.isUnassign
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                  }`}
                >
                  {pendingAssignment.isUnassign
                    ? "Confirm Unassignment"
                    : "Confirm Assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Success/Error Modal */}
      {showDeleteSuccessModal && deleteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setShowDeleteSuccessModal(false)}
          ></div>

          {/* Modal content */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/20">
            <div className="p-6">
              {/* Success/Error icon and title */}
              <div className="flex items-center mb-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    deleteResult.success ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {deleteResult.success ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <X className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  {deleteResult.success
                    ? "Psychologist Deleted Successfully"
                    : "Deletion Failed"}
                </h3>
              </div>

              {/* Message */}
              <div className="mb-6">
                {deleteResult.success ? (
                  <div>
                    <p className="text-gray-600 mb-3">
                      <strong>{deleteResult.psychologistName}</strong> has been
                      successfully removed from the system.
                    </p>
                    <p className="text-sm text-gray-500">
                      {deleteResult.message}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-3">
                      Unable to delete{" "}
                      <strong>{deleteResult.psychologistName}</strong>.
                    </p>
                    <p className="text-sm text-red-600">
                      {deleteResult.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Action button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDeleteSuccessModal(false)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
                    deleteResult.success
                      ? "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
                      : "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                  }`}
                >
                  {deleteResult.success ? "Got it" : "Try Again"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Deactivate Blocked Modal */}
      {showDeactivateBlockedModal && deactivateBlockedData.psychologist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => {
              setShowDeactivateBlockedModal(false);
              setDeactivateBlockedData({
                psychologist: null,
                errorMessage: "",
              });
            }}
          ></div>

          {/* Modal content */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/20">
            <div className="p-6">
              {/* Warning icon and title */}
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cannot Deactivate Psychologist
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Active patient assignments found
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  <strong className="text-gray-900">
                    {getFullName(deactivateBlockedData.psychologist)}
                  </strong>{" "}
                  cannot be deactivated because they have active patient
                  assignments.
                </p>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-2">Required Action:</p>
                      <p className="mb-3">
                        {deactivateBlockedData.errorMessage}
                      </p>
                      <p className="text-orange-700">
                        Please go to the <strong>Patients tab</strong> to
                        reassign these patients to another psychologist first.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeactivateBlockedModal(false);
                    setDeactivateBlockedData({
                      psychologist: null,
                      errorMessage: "",
                    });
                  }}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeactivateBlockedModal(false);
                    setDeactivateBlockedData({
                      psychologist: null,
                      errorMessage: "",
                    });
                    // Switch to patients tab when "Go to Patients Tab" is clicked
                    setActiveTab("patients");
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Go to Patients Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Success Modal */}
      {showDeactivateSuccessModal && deactivateSuccessData.psychologist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => {
              setShowDeactivateSuccessModal(false);
              setDeactivateSuccessData({
                psychologist: null,
                action: "",
              });
            }}
          ></div>

          {/* Modal content */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/20">
            <div className="p-6">
              {/* Success icon and title */}
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Psychologist{" "}
                    {deactivateSuccessData.action === "activated"
                      ? "Activated"
                      : "Deactivated"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Status updated successfully
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  <strong className="text-gray-900">
                    {getFullName(deactivateSuccessData.psychologist)}
                  </strong>{" "}
                  has been {deactivateSuccessData.action} successfully.
                </p>

                <div
                  className={`${
                    deactivateSuccessData.action === "activated"
                      ? "bg-green-50 border-green-200"
                      : "bg-orange-50 border-orange-200"
                  } border rounded-lg p-4`}
                >
                  <div className="flex items-start">
                    {deactivateSuccessData.action === "activated" ? (
                      <UserCheck className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    ) : (
                      <UserX className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                    )}
                    <div
                      className={`text-sm ${
                        deactivateSuccessData.action === "activated"
                          ? "text-green-800"
                          : "text-orange-800"
                      }`}
                    >
                      <p className="font-medium mb-2">Status Updated:</p>
                      <p className="mb-1">
                        The psychologist is now{" "}
                        <strong>
                          {deactivateSuccessData.action === "activated"
                            ? "Active"
                            : "Inactive"}
                        </strong>
                        {deactivateSuccessData.action === "activated"
                          ? " and can receive new patient assignments."
                          : " and cannot receive new patient assignments."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="flex">
                <button
                  onClick={() => {
                    setShowDeactivateSuccessModal(false);
                    setDeactivateSuccessData({
                      psychologist: null,
                      action: "",
                    });
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => {
              setShowErrorModal(false);
              setErrorModalData({
                title: "",
                message: "",
              });
            }}
          ></div>

          {/* Modal content */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/20">
            <div className="p-6">
              {/* Error icon and title */}
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {errorModalData.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Something went wrong
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <X className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-2">Error Details:</p>
                      <p>{errorModalData.message}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="flex">
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setErrorModalData({
                      title: "",
                      message: "",
                    });
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation Modal */}
      {showDeleteModal && adminToDelete && (
        <div
          className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Confirm Admin Removal
              </h3>
              <button
                onClick={cancelDeleteAdmin}
                className="text-gray-400 hover:text-gray-600"
                disabled={deletingAdmin}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900">
                    Remove Administrator
                  </p>
                  <p className="text-sm text-red-700">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  You are about to remove:
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {adminToDelete.full_name || "Admin User"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {adminToDelete.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently remove the
                  admin account from the system. This action cannot be undone.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={cancelDeleteAdmin}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deletingAdmin}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAdmin}
                  disabled={deletingAdmin}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deletingAdmin ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Own Account Confirmation Modal */}
      {showDeleteOwnAccountModal && (
        <div
          className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Delete My Account
              </h3>
              <button
                onClick={cancelDeleteOwnAccount}
                className="text-gray-400 hover:text-gray-600"
                disabled={deletingOwnAccount}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900">
                    Delete Your Account
                  </p>
                  <p className="text-sm text-red-700">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  You are about to delete your own account:
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Your Account</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently remove your
                  admin account from the system and log you out immediately.
                  This action cannot be undone.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={cancelDeleteOwnAccount}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deletingOwnAccount}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOwnAccount}
                  disabled={deletingOwnAccount}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deletingOwnAccount ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete My Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP-Based Password Change Modal */}
      <ChangePasswordOTPModal
        isOpen={showChangePasswordOTPModal}
        onClose={() => setShowChangePasswordOTPModal(false)}
        userEmail={user?.email}
        onSuccess={handleOTPPasswordChangeSuccess}
        onError={handleOTPPasswordChangeError}
      />
    </div>
  );
};

export default AdminPanelNew;
