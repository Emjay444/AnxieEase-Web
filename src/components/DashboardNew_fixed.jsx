import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Clock,
  ChevronRight,
  Bell,
  LogOut,
  Search,
  Filter,
  Mail,
  Phone,
  CalendarDays,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  User,
  Lock,
  Camera,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { psychologistService } from "../services/psychologistService";
import { appointmentService } from "../services/appointmentService";
import { supabase } from "../services/supabaseClient";
import FullCalendar from "./FullCalendar";
import PatientProfileView from "./PatientProfileView";

// Helper function to construct full name from separate fields
const buildFullName = (first_name, middle_name, last_name) => {
  const parts = [first_name, middle_name, last_name].filter(
    (part) => part && part.trim().length > 0
  );
  return parts.join(" ") || "Doctor";
};

const DashboardNew = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarReloadKey, setCalendarReloadKey] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [psychologistId, setPsychologistId] = useState(null); // Store psychologist ID
  const [psychologistProfile, setPsychologistProfile] = useState(null); // Store full psychologist profile
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Real data states
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
  });
  const [patients, setPatients] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Profile form states
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    profilePicture: null,
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  // Load real data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!user?.id) {
          console.log("No user ID found, skipping data load");
          return;
        }

        console.log("=== DASHBOARD DEBUG ===");
        console.log("Loading dashboard data for auth user:", user.id);
        console.log("User email:", user.email);
        console.log("Full user object:", user);

        // Debug: Check all psychologists to see if there's a match
        const { data: allPsychologists, error: allPsychError } = await supabase
          .from("psychologists")
          .select(
            "id, user_id, first_name, middle_name, last_name, email, is_active"
          );

        console.log("All psychologists in database:", allPsychologists);
        console.log("Looking for user_id match:", user.id);

        // First, get the psychologist record using the auth user_id
        const { data: psychologist, error: psychError } = await supabase
          .from("psychologists")
          .select("id, first_name, middle_name, last_name, email")
          .eq("user_id", user.id)
          .single();

        if (psychError || !psychologist) {
          console.error("Error fetching psychologist:", psychError);
          console.log("No psychologist found for user_id:", user.id);
          console.log(
            "Available psychologists with email",
            user.email,
            ":",
            allPsychologists?.filter((p) => p.email === user.email)
          );

          // Try to find by email as fallback
          const psychByEmail = allPsychologists?.find(
            (p) => p.email === user.email && p.is_active
          );
          if (psychByEmail) {
            console.log("Found psychologist by email instead:", psychByEmail);
            console.log(
              "user_id mismatch! Auth user_id:",
              user.id,
              "vs DB user_id:",
              psychByEmail.user_id
            );

            // Fix the user_id mismatch by updating the psychologist record
            console.log("Attempting to fix user_id mismatch...");
            const { error: updateError } = await supabase
              .from("psychologists")
              .update({ user_id: user.id })
              .eq("email", user.email)
              .eq("is_active", true);

            if (updateError) {
              console.error(
                "Failed to update psychologist user_id:",
                updateError
              );
            } else {
              console.log(
                "Successfully updated psychologist user_id, reloading..."
              );
              // Recursively call the function to reload with fixed data
              setTimeout(() => loadDashboardData(), 100);
              return;
            }
          }

          return;
        }

        console.log("Found psychologist:", psychologist);

        // Use the psychologist's ID to load their data
        const psychologistId = psychologist.id;
        setPsychologistId(psychologistId); // Store for later use

        // Load complete psychologist profile data
        const { data: fullPsychProfile, error: profileError } = await supabase
          .from("psychologists")
          .select("*")
          .eq("id", psychologistId)
          .single();

        if (!profileError && fullPsychProfile) {
          console.log("Loaded full psychologist profile:", fullPsychProfile);

          // Construct full name from separate fields
          const fullName = buildFullName(
            fullPsychProfile.first_name,
            fullPsychProfile.middle_name,
            fullPsychProfile.last_name
          );

          // Store the complete profile data for use in header and forms
          setPsychologistProfile({
            ...fullPsychProfile,
            fullName: fullName,
          });

          // Update profile form with real data from database
          setProfileForm({
            firstName: fullPsychProfile.first_name || "",
            middleName: fullPsychProfile.middle_name || "",
            lastName: fullPsychProfile.last_name || "",
            email: fullPsychProfile.email || "",
            phone: fullPsychProfile.phone || "",
            specialization: fullPsychProfile.specialization || "",
            bio: fullPsychProfile.bio || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            profilePicture: null,
          });
        } else {
          console.error("Error loading psychologist profile:", profileError);
        }

        // Load patients assigned to this psychologist
        const patientsData = await psychologistService.getPsychologistPatients(
          psychologistId
        );
        console.log("Loaded patients:", patientsData);
        setPatients(patientsData);

        // Load appointments
        const appointmentsData =
          await appointmentService.getAppointmentsByPsychologist(
            psychologistId
          );
        console.log("Loaded appointments:", appointmentsData);

        // Filter today's appointments (robust to missing dates)
        const today = new Date().toDateString();
        const todayAppts = appointmentsData.filter((appt) => {
          const apptRaw =
            appt.appointment_date || appt.requestedDate || appt.requestDate;
          if (!apptRaw) return false;
          const apptDate = new Date(apptRaw).toDateString();
          return apptDate === today;
        });
        setTodayAppointments(todayAppts);

        // Update stats
        setStats({
          totalPatients: patientsData.length,
          todayAppointments: todayAppts.length,
        });

        // Load real appointment requests for this psychologist
        const pending =
          await appointmentService.getPendingRequestsByPsychologist(
            psychologistId
          );
        console.log("Loaded pending requests:", pending);
        setAppointmentRequests(pending);

        setRecentActivity([
          {
            id: 1,
            action: "Session completed",
            target: "Patient consultation",
            timestamp: new Date().toISOString(),
            type: "session",
          },
          {
            id: 2,
            action: "Patient assigned",
            target: "New patient added to caseload",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            type: "assignment",
          },
        ]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Profile form is now initialized in fetchPsychologistData with complete database profile
  // This ensures we get the actual psychologist data like "Romeo Buagas" instead of auth user metadata

  // Profile form handlers
  const handleProfileFormChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileForm((prev) => ({
        ...prev,
        profilePicture: file,
      }));
    }
  };

  const handleProfileUpdate = async () => {
    setProfileUpdateLoading(true);
    try {
      console.log("Updating profile:", profileForm);

      // Update psychologist profile with separate name fields
      const updates = {
        first_name: profileForm.firstName,
        middle_name: profileForm.middleName || null,
        last_name: profileForm.lastName,
        phone: profileForm.phone,
        specialization: profileForm.specialization,
        bio: profileForm.bio,
      };

      const { error } = await supabase
        .from("psychologists")
        .update(updates)
        .eq("id", psychologistId);

      if (error) throw error;

      // Update local state with new full name
      const newFullName = buildFullName(
        profileForm.firstName,
        profileForm.middleName,
        profileForm.lastName
      );

      setPsychologistProfile((prev) => ({
        ...prev,
        ...updates,
        fullName: newFullName,
      }));

      setProfileUpdateLoading(false);
      setShowProfileModal(false);
      console.log("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileUpdateLoading(false);
      alert("Error updating profile. Please try again.");
    }
  };

  // Profile Modal Component
  const ProfileModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Profile Settings
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-medium text-2xl">
                    {profileForm.firstName?.charAt(0) || "D"}
                  </span>
                </div>
                <label className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-emerald-600 transition-colors">
                  <Camera className="h-3 w-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Profile Picture</h4>
                <p className="text-sm text-gray-600">
                  Click the camera icon to upload a new photo
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) =>
                    handleProfileFormChange("firstName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={profileForm.middleName}
                  onChange={(e) =>
                    handleProfileFormChange("middleName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Middle name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) =>
                    handleProfileFormChange("lastName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    handleProfileFormChange("email", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="doctor@hospital.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    handleProfileFormChange("phone", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  value={profileForm.specialization}
                  onChange={(e) =>
                    handleProfileFormChange("specialization", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Anxiety Disorders, CBT"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio
              </label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => handleProfileFormChange("bio", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Brief description of your experience and approach..."
              />
            </div>

            {/* Password Change Section */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={profileForm.currentPassword}
                      onChange={(e) =>
                        handleProfileFormChange(
                          "currentPassword",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={profileForm.newPassword}
                        onChange={(e) =>
                          handleProfileFormChange("newPassword", e.target.value)
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={profileForm.confirmPassword}
                        onChange={(e) =>
                          handleProfileFormChange(
                            "confirmPassword",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                disabled={profileUpdateLoading}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-emerald-300 flex items-center"
              >
                {profileUpdateLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color = "emerald" }) => {
    const palette = {
      emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
      blue: { bg: "bg-blue-50", text: "text-blue-600" },
    };
    const colors = palette[color] || palette.emerald;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`h-8 w-8 ${colors.text}`} />
          </div>
        </div>
      </div>
    );
  };

  // Patient Card Component
  const PatientCard = ({ patient, onClick }) => (
    <div
      onClick={() => onClick(patient)}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-600 font-medium">
              {patient.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{patient.name}</h3>
            <p className="text-sm text-gray-600">{patient.email}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );

  // Appointment Card Component
  const AppointmentCard = ({ appointment }) => (
    <div className="flex items-center p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
        <Clock className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">
          {appointment.patient_name || "Patient"}
        </h4>
        <p className="text-sm text-gray-600">
          {appointment.appointment_type || "Session"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {new Date(appointment.appointment_date).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
        <p className="text-xs text-gray-500">Today</p>
      </div>
    </div>
  );

  // Appointment Request Card
  const AppointmentRequestCard = ({ request, onAction }) => (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{request.patientName}</h4>
          <p className="text-sm text-gray-600">
            {request.requestedDate} at {request.requestedTime}
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {request.status}
        </span>
      </div>

      <p className="text-sm text-gray-700 mb-3">{request.message}</p>

      <div className="flex space-x-2">
        <button
          onClick={() => onAction(request.id, "approve")}
          className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve
        </button>
        <button
          onClick={() => onAction(request.id, "decline")}
          className="flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
        >
          <XCircle className="h-4 w-4 mr-1" />
          Decline
        </button>
      </div>
    </div>
  );

  // Activity Item Component
  const ActivityItem = ({ activity }) => (
    <div className="flex items-center text-sm">
      <div
        className={`h-2 w-2 rounded-full mr-3 ${
          activity.type === "session"
            ? "bg-green-500"
            : activity.type === "assignment"
            ? "bg-blue-500"
            : "bg-gray-500"
        }`}
      ></div>
      <span className="text-gray-600">
        {activity.action} - {activity.target}
      </span>
      <span className="text-gray-400 text-xs ml-auto">
        {new Date(activity.timestamp).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </span>
    </div>
  );

  const handleAppointmentAction = async (requestId, action) => {
    // Show confirmation modal instead of immediately processing
    setPendingAction({ requestId, action });
    setShowConfirmModal(true);
  };

  const confirmAppointmentAction = async () => {
    if (!pendingAction) return;

    try {
      const { requestId, action } = pendingAction;
      const status = action === "approve" ? "scheduled" : "declined"; // Use "scheduled" not "approved"
      const ok = await appointmentService.updateAppointmentStatus(
        requestId,
        status,
        action === "approve"
          ? "Approved by psychologist"
          : "Declined by psychologist"
      );
      if (ok) {
        // Remove from local list and refresh from backend to stay in sync
        setAppointmentRequests((prev) =>
          prev.filter((req) => req.id !== requestId)
        );
        if (psychologistId) {
          const pending =
            await appointmentService.getPendingRequestsByPsychologist(
              psychologistId
            );
          setAppointmentRequests(pending);
        }
        // Trigger calendar reload to reflect the change
        setCalendarReloadKey((prev) => prev + 1);
      }
    } catch (e) {
      console.error("Failed to update appointment request:", e);
    } finally {
      setShowConfirmModal(false);
      setPendingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Patient Profile View */}
      {showPatientProfile && selectedPatient ? (
        <PatientProfileView
          patient={selectedPatient}
          psychologistId={psychologistId}
          onBack={() => {
            setShowPatientProfile(false);
            setSelectedPatient(null);
          }}
        />
      ) : (
        <>
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard
                  </h1>
                  <span className="text-sm text-gray-500">
                    Psychologist Portal
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Bell className="h-5 w-5" />
                  </button>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Dr. {psychologistProfile?.fullName || "Psychologist"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {psychologistProfile?.email || user?.email}
                        </p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 font-medium text-sm">
                          {psychologistProfile?.fullName?.charAt(0) || "D"}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Profile Settings"
                    >
                      <Settings className="h-5 w-5" />
                    </button>

                    <button
                      onClick={signOut}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <StatCard
                title="Total Patients"
                value={stats.totalPatients}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Today's Appointments"
                value={stats.todayAppointments}
                icon={Calendar}
                color="emerald"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Big Calendar - Inline */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Calendar
                    </h2>
                  </div>
                  <FullCalendar
                    inline
                    userId={psychologistId}
                    reloadKey={calendarReloadKey}
                    selectable
                    onSlotSelect={(slot) => {
                      setSelectedSlot(slot);
                      // If there is a pending request to schedule, open scheduling modal
                      if (!pendingScheduleRequest) return;
                    }}
                  />
                </div>

                {/* Recent Activity (moved here from right sidebar) */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Recent Activity
                  </h3>

                  <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* My Patients (moved here above Appointment Requests) */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      My Patients
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search patients..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Filter className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {patients.length > 0 ? (
                      patients.map((patient) => (
                        <PatientCard
                          key={patient.id}
                          patient={patient}
                          onClick={(patient) => {
                            setSelectedPatient(patient);
                            setShowPatientProfile(true);
                          }}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No patients assigned yet</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Appointment Requests */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Appointment Requests
                    </h3>
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  </div>

                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {appointmentRequests.length > 0 ? (
                      appointmentRequests.map((request) => (
                        <AppointmentRequestCard
                          key={request.id}
                          request={request}
                          onAction={handleAppointmentAction}
                        />
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No pending requests</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Today's Appointments (moved here) */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Today's Appointments
                    </h2>
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {todayAppointments.length > 0 ? (
                      todayAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No appointments scheduled for today</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity removed from here (moved to left column) */}
              </div>
            </div>
          </div>

          {/* Profile Modal */}
          <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
          />

          {/* Full Calendar (modal) removed since calendar is inline now */}

          {/* Patient Detail Modal */}
          {selectedPatient && (
            <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Patient Details
                  </h3>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-600 font-medium text-xl">
                        {selectedPatient.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {selectedPatient.name}
                      </h4>
                      <p className="text-gray-600">{selectedPatient.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedPatient.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      Added: {selectedPatient.date_added}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-gray-900 mb-2">Status</h5>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedPatient.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedPatient.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointment Action Confirmation Modal */}
          {showConfirmModal && pendingAction && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Action
                  </h3>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingAction(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    Are you sure you want to {pendingAction.action} this
                    appointment request?
                  </p>
                  <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-700">
                    <div className="font-medium">
                      {pendingAction.action === "approve"
                        ? "This will:"
                        : "This will:"}
                    </div>
                    <ul className="mt-1 text-xs space-y-1">
                      {pendingAction.action === "approve" ? (
                        <>
                          <li>• Change status to "scheduled"</li>
                          <li>• Show appointment in calendar</li>
                          <li>• Remove from pending requests</li>
                        </>
                      ) : (
                        <>
                          <li>• Change status to "declined"</li>
                          <li>• Remove from pending requests</li>
                          <li>• Notify patient of decline</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingAction(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAppointmentAction}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                      pendingAction.action === "approve"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {pendingAction.action === "approve" ? "Approve" : "Decline"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardNew;
