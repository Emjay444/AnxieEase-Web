import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Calendar,
  Clock,
  ChevronRight,
  LogOut,
  Search,
  Filter,
  Mail,
  Phone,
  CalendarDays,
  MessageSquare,
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

// Top-level, memoized Profile modal to avoid remounts on parent re-render
const ProfileModal = React.memo(({
  isOpen,
  onClose,
  profileForm,
  user,
  handleProfilePictureChange,
  handleProfileFormChange,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  handleProfileUpdate,
  profileUpdateLoading,
}) => {
  if (!isOpen) return null;
  const fileInputRef = useRef(null);

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Profile Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-20 w-20 rounded-full overflow-hidden border bg-emerald-50 flex items-center justify-center"
                title="Change profile picture"
              >
                {profileForm.avatar_url ? (
                  <img src={profileForm.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-emerald-600 font-medium text-2xl">
                    {profileForm.first_name?.charAt(0) || user?.name?.charAt(0) || "D"}
                  </span>
                )}
                <span className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow group-hover:scale-105 transition-transform">
                  <Camera className="h-3 w-3" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Profile Picture</h4>
              <p className="text-sm text-gray-600">Click the camera icon to upload a new photo</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={profileForm.first_name}
                onChange={(e) => handleProfileFormChange("first_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={profileForm.last_name}
                onChange={(e) => handleProfileFormChange("last_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name (Optional)</label>
              <input
                type="text"
                value={profileForm.middle_name}
                onChange={(e) => handleProfileFormChange("middle_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Michael"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address <span className="text-xs text-gray-500 ml-1">(Read-only)</span></label>
              <input type="email" value={profileForm.email} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" placeholder="doctor@hospital.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => handleProfileFormChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender <span className="text-xs text-gray-500 ml-1">(Read-only)</span></label>
              <select value={profileForm.sex} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* License Number - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
            <input
              type="text"
              value={profileForm.license_number}
              onChange={(e) => handleProfileFormChange("license_number", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your professional license number"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
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
            <h4 className="font-medium text-gray-900 mb-4 flex items-center"><Lock className="h-4 w-4 mr-2" />Change Password</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={profileForm.currentPassword}
                    onChange={(e) => handleProfileFormChange("currentPassword", e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={profileForm.newPassword}
                      onChange={(e) => handleProfileFormChange("newPassword", e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={profileForm.confirmPassword}
                      onChange={(e) => handleProfileFormChange("confirmPassword", e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleProfileUpdate} disabled={profileUpdateLoading} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-emerald-300 flex items-center">
              {profileUpdateLoading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Updating...</>) : (<><Save className="h-4 w-4 mr-2" />Save Changes</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Top-level, memoized Profile overview modal to avoid remounts
const ProfileOverview = React.memo(({ isOpen, onClose, profileForm, user, stats, onEdit, onSignOut }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-xl p-6 md:p-7 max-w-xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Profile Overview</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="text-center space-y-4">
          {/* Profile Picture */}
          <div className="flex justify-center">
            {profileForm.avatar_url ? (
              <img src={profileForm.avatar_url} alt="Profile" className="h-20 w-20 rounded-full object-cover border" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 font-medium text-2xl">{profileForm.first_name?.charAt(0) || user?.name?.charAt(0) || "D"}</span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-3">
            <h4 className="text-xl font-semibold text-gray-900">
              Dr. {profileForm.last_name ? `${profileForm.last_name}, ${profileForm.first_name}${profileForm.middle_name ? ' ' + profileForm.middle_name.charAt(0) + '.' : ''}` : (user?.name || "Psychologist")}
            </h4>
            <p className="text-gray-600">{profileForm.email || user?.email}</p>

            {/* Professional Info */}
            {profileForm.license_number && (
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-sm font-medium text-emerald-800">License Number</p>
                <p className="text-emerald-700">{profileForm.license_number}</p>
              </div>
            )}

            {profileForm.phone && (
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {profileForm.phone}
              </div>
            )}

            {profileForm.bio && (
              <div className="bg-gray-50 rounded-lg p-3 text-left">
                <p className="text-sm font-medium text-gray-700 mb-1">About</p>
                <p className="text-sm text-gray-600 line-clamp-3">{profileForm.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 pt-2 border-t">
              <span className="flex items-center"><Users className="h-4 w-4 mr-1" />{stats.totalPatients} Patients</span>
              <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" />{stats.todayAppointments} Today</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t space-y-3">
            <button onClick={onEdit} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              <Settings className="h-4 w-4" />
              <span>Edit Profile Settings</span>
            </button>
            <button onClick={onSignOut} className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
import FullCalendar from "./FullCalendar";
import PatientProfileView from "./PatientProfileView";

const DashboardNew = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarReloadKey, setCalendarReloadKey] = useState(0);
  const [pendingScheduleRequest, setPendingScheduleRequest] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileOverview, setShowProfileOverview] = useState(false);
  const [psychologistId, setPsychologistId] = useState(null); // Store psychologist ID
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Real data states
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
  });
  const [patients, setPatients] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  

  // Profile form states
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    license_number: "",
    bio: "",
    sex: "",
  avatar_url: "",
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

        console.log("Loading dashboard data for auth user:", user.id);

        // First, get the psychologist record using the auth user_id
        const { data: psychologist, error: psychError } = await supabase
          .from("psychologists")
          .select("id, name, first_name, middle_name, last_name, email, contact, license_number, sex, avatar_url, bio")
          .eq("user_id", user.id)
          .single();

        if (psychError || !psychologist) {
          console.error("Error fetching psychologist:", psychError);
          console.log("No psychologist found for user_id:", user.id);
          return;
        }

        console.log("Found psychologist:", psychologist);

        // Use the psychologist's ID to load their data
        const psychologistId = psychologist.id;
        setPsychologistId(psychologistId); // Store for later use

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

        // Trigger calendar reload to show updated appointment statuses
        setCalendarReloadKey((prev) => prev + 1);

        // Update profile form with psychologist data
        setProfileForm((prev) => ({
          ...prev,
          first_name: psychologist.first_name || "",
          middle_name: psychologist.middle_name || "",
          last_name: psychologist.last_name || "",
          email: psychologist.email || "",
          phone: psychologist.contact || "",
          license_number: psychologist.license_number || "",
          bio: psychologist.bio || "",
          sex: psychologist.sex || "",
          avatar_url: psychologist.avatar_url || "",
        }));

        // Load real appointment requests for this psychologist
        const pending =
          await appointmentService.getPendingRequestsByPsychologist(
            psychologistId
          );
        console.log("Loaded pending requests:", pending);
        setAppointmentRequests(pending);

  // Recent activity card removed (placeholder data previously set here)
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]); // Only depend on user ID

  // Initialize profile form when user data is available
  useEffect(() => {
    if (user?.id && !profileForm.email) { // Only update if profileForm is empty
      setProfileForm((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        license_number: user.license_number || "",
        bio: user.bio || "",
      }));
    }
  }, [user?.id]); // Only depend on user ID to prevent unnecessary re-renders

  // Profile form handlers
  const handleProfileFormChange = useCallback((field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfileForm((prev) => ({
        ...prev,
        profilePicture: file,
        avatar_url: previewUrl,
      }));
    }
  };

  const handleProfileUpdate = async () => {
    setProfileUpdateLoading(true);
    try {
      console.log("Updating profile:", profileForm);

      if (!psychologistId) {
        throw new Error("Psychologist ID not found");
      }

      // If a new profile picture is selected, upload to Supabase Storage
      let uploadedAvatarUrl = profileForm.avatar_url || null;
      if (profileForm.profilePicture) {
        const file = profileForm.profilePicture;
        const fileExt = file.name.split('.').pop();
        const fileName = `${psychologistId}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true, contentType: file.type });
        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          throw uploadError;
        }
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);
        uploadedAvatarUrl = publicUrlData.publicUrl;
      }

      // Prepare the update data - map form fields to database columns
      const updateData = {
        first_name: profileForm.first_name,
        middle_name: profileForm.middle_name,
        last_name: profileForm.last_name,
        // Generate full name for backwards compatibility
        name: `${profileForm.last_name}, ${profileForm.first_name}${profileForm.middle_name ? ' ' + profileForm.middle_name.charAt(0) + '.' : ''}`,
        contact: profileForm.phone,
        license_number: profileForm.license_number,
        bio: profileForm.bio,
        avatar_url: uploadedAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      // Update psychologist profile in database
      const updatedPsychologist = await psychologistService.updatePsychologist(
        psychologistId,
        updateData
      );

      if (!updatedPsychologist) {
        throw new Error("Failed to update profile");
      }

      console.log("Profile updated successfully:", updatedPsychologist);
      
      setProfileUpdateLoading(false);
      setShowProfileModal(false);
      alert("Profile updated successfully!");
      
      // Reload dashboard data to reflect changes
      const loadDashboardData = async () => {
        // Re-run the data loading logic
        if (user?.id) {
          const { data: psychologist } = await supabase
            .from("psychologists")
            .select("id, name, first_name, middle_name, last_name, email, contact, license_number, sex, avatar_url, bio")
            .eq("user_id", user.id)
            .single();

          if (psychologist) {
            setProfileForm((prev) => ({
              ...prev,
              first_name: psychologist.first_name || "",
              middle_name: psychologist.middle_name || "",
              last_name: psychologist.last_name || "",
              email: psychologist.email || "",
              phone: psychologist.contact || "",
              license_number: psychologist.license_number || "",
              bio: psychologist.bio || "",
              sex: psychologist.sex || "",
              avatar_url: psychologist.avatar_url || prev.avatar_url || "",
            }));
          }
        }
      };
      
  await loadDashboardData();
  // Clear transient file to avoid re-uploads
  setProfileForm((prev) => ({ ...prev, profilePicture: null }));
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileUpdateLoading(false);
      alert(`Error updating profile: ${error.message}`);
    }
  };

  // Profile Modal Component (moved to top-level to prevent remounts)

  // Profile Overview Modal Component (moved to top-level to prevent remounts)

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
  const AppointmentRequestCard = ({ request, onAction, onSchedule }) => (
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
        <button
          onClick={() => onSchedule(request)}
          className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
        >
          <CalendarDays className="h-4 w-4 mr-1" />
          Schedule
        </button>
      </div>
    </div>
  );

  // Recent Activity card removed

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

  const handleOpenSchedule = (request) => {
    setPendingScheduleRequest(request);
    // Set default date to today and time to 9 AM
    const today = new Date();
    setScheduledDate(today.toISOString().split("T")[0]);
    setScheduledTime("09:00");
  };

  const handleConfirmSchedule = async () => {
    if (!pendingScheduleRequest || !scheduledDate || !scheduledTime) return;

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
      // Remove from requests, refresh calendar
      setAppointmentRequests((prev) =>
        prev.filter((r) => r.id !== pendingScheduleRequest.id)
      );
      // Refresh pending requests from backend
      if (psychologistId) {
        const pending =
          await appointmentService.getPendingRequestsByPsychologist(
            psychologistId
          );
        setAppointmentRequests(pending);
      }
      setCalendarReloadKey((k) => k + 1);
      setPendingScheduleRequest(null);
      setSelectedSlot(null);
      setScheduledDate("");
      setScheduledTime("");
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
                <div className="flex items-center space-x-3">
                  <img
                    src="/anxieease-logo.png"
                    alt="AnxieEase"
                    className="h-6 w-6 logo-breathe"
                  />
                  <div className="flex items-baseline space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <span className="text-sm text-gray-500">Psychologist Portal</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowProfileOverview(true)}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Profile Overview"
                    >
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Dr. {profileForm.last_name ? 
                            `${profileForm.last_name}, ${profileForm.first_name}${profileForm.middle_name ? ' ' + profileForm.middle_name.charAt(0) + '.' : ''}` 
                            : (user?.name || "Psychologist")}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      {profileForm.avatar_url ? (
                        <img src={profileForm.avatar_url} alt="Profile" className="h-8 w-8 rounded-full object-cover border" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-600 font-medium text-sm">
                            {profileForm.first_name?.charAt(0) || user?.name?.charAt(0) || "D"}
                          </span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Profile Settings"
                    >
                      <Settings className="h-5 w-5" />
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

                {/* Recent Activity card removed */}
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

                  <div className="space-y-3">
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

                  <div className="space-y-4">
                    {appointmentRequests.length > 0 ? (
                      appointmentRequests.map((request) => (
                        <AppointmentRequestCard
                          key={request.id}
                          request={request}
                          onAction={handleAppointmentAction}
                          onSchedule={handleOpenSchedule}
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

                  <div className="space-y-3">
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
            profileForm={profileForm}
            user={user}
            handleProfilePictureChange={handleProfilePictureChange}
            handleProfileFormChange={handleProfileFormChange}
            showCurrentPassword={showCurrentPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            handleProfileUpdate={handleProfileUpdate}
            profileUpdateLoading={profileUpdateLoading}
          />

          {/* Profile Overview Modal */}
          <ProfileOverview
            isOpen={showProfileOverview}
            onClose={() => setShowProfileOverview(false)}
            profileForm={profileForm}
            user={user}
            stats={stats}
            onEdit={() => { setShowProfileOverview(false); setShowProfileModal(true); }}
            onSignOut={signOut}
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

          {/* Schedule Appointment Modal (Updated with Date/Time Pickers) */}
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
                      setSelectedSlot(null);
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
                    <div className="font-semibold">
                      {pendingScheduleRequest.patientName}
                    </div>
                    <div className="text-gray-500">
                      {pendingScheduleRequest.message}
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
                      setSelectedSlot(null);
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
