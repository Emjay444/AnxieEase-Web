import React, { useState, useMemo, memo, useEffect } from "react";
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
  Filler,
} from "chart.js";
import { supabase } from "../services/supabaseClient";
import { appointmentService } from "../services/appointmentService";
import { anxietyService } from "../services/anxietyService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const patients = [
  {
    id: "p1",
    name: "Brooklyn Simmons",
    avatar: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
    age: 28,
    gender: "Female",
    emergencyContact: {
      name: "John Simmons",
      relationship: "Brother",
      phone: "(555) 123-4567",
    },
  },
  {
    id: "p2",
    name: "Kristin Watson",
    avatar: "https://cdn-icons-png.flaticon.com/512/2922/2922656.png",
    age: 32,
    gender: "Female",
    emergencyContact: {
      name: "Sarah Watson",
      relationship: "Sister",
      phone: "(555) 987-6543",
    },
  },
];

// Function to get all dates in current month
const getDatesInMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = 3; // April is 3 (0-based index)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    // Format date as YYYY-MM-DD with padded days
    return `2024-04-${String(i + 1).padStart(2, "0")}`;
  }).reverse(); // Reverse to show most recent dates first
};

// Helper function to format display date
const formatDisplayDate = (dateString) => {
  if (!dateString) return "Unknown date";

  try {
    // Check if the date is already a valid date object
    let date;
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Handle different date string formats
      // First, try to split by dash (YYYY-MM-DD)
      if (dateString.includes("-")) {
        const [year, month, day] = dateString.split("-");
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateString.includes("/")) {
        // Try to split by slash (MM/DD/YYYY)
        const [month, day, year] = dateString.split("/");
        date = new Date(
          parseInt(year || new Date().getFullYear()),
          parseInt(month) - 1,
          parseInt(day)
        );
      } else {
        // Attempt to parse the date directly
        date = new Date(dateString);
      }
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date format:", dateString);
      return "Invalid date";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch (err) {
    console.error("Error formatting date:", err, dateString);
    return "Date error";
  }
};

// Sample mood logs data - using Map for easier date lookup
const moodLogsData = new Map([
  [
    "2024-04-30",
    {
      mood: "Happy",
      stressLevel: "Low",
      symptoms: ["None"],
    },
  ],
  [
    "2024-04-29",
    {
      mood: "Anxious",
      stressLevel: "High",
      symptoms: ["Restlessness", "Racing thoughts"],
    },
  ],
  [
    "2024-04-28",
    {
      mood: "Neutral",
      stressLevel: "Medium",
      symptoms: ["Mild headache"],
    },
  ],
  [
    "2024-04-27",
    {
      mood: "Sad",
      stressLevel: "High",
      symptoms: ["Fatigue", "Loss of appetite"],
    },
  ],
  [
    "2024-04-26",
    {
      mood: "Calm",
      stressLevel: "Low",
      symptoms: ["None"],
    },
  ],
  [
    "2024-04-25",
    {
      mood: "Happy",
      stressLevel: "Low",
      symptoms: ["None"],
    },
  ],
  [
    "2024-04-24",
    {
      mood: "Anxious",
      stressLevel: "Medium",
      symptoms: ["Mild anxiety", "Trouble sleeping"],
    },
  ],
  [
    "2024-04-23",
    {
      mood: "Neutral",
      stressLevel: "Low",
      symptoms: ["None"],
    },
  ],
  [
    "2024-04-22",
    {
      mood: "Happy",
      stressLevel: "Low",
      symptoms: ["None"],
    },
  ],
  [
    "2024-04-21",
    {
      mood: "Anxious",
      stressLevel: "High",
      symptoms: ["Panic attack", "Shortness of breath"],
    },
  ],
  [
    "2024-04-20",
    {
      mood: "Calm",
      stressLevel: "Low",
      symptoms: ["None"],
    },
  ],
  [
    "2024-04-19",
    {
      mood: "Sad",
      stressLevel: "Medium",
      symptoms: ["Low energy"],
    },
  ],
  [
    "2024-04-18",
    {
      mood: "Happy",
      stressLevel: "Low",
      symptoms: ["None"],
    },
  ],
  [
    "2024-04-17",
    {
      mood: "Neutral",
      stressLevel: "Medium",
      symptoms: ["Mild tension"],
    },
  ],
  [
    "2024-04-16",
    {
      mood: "Calm",
      stressLevel: "Low",
      symptoms: ["None"],
    },
  ],
]);

// Sample appointment requests
const appointmentRequests = [
  {
    id: "req1",
    patientId: "p1",
    patientName: "Brooklyn Simmons",
    requestDate: "2024-05-10",
    requestedDate: "2024-05-20",
    requestedTime: "10:00 AM",
    reason: "Follow-up on medication adjustment",
    status: "pending",
    urgency: "medium",
  },
  {
    id: "req2",
    patientId: "p2",
    patientName: "Kristin Watson",
    requestDate: "2024-05-11",
    requestedDate: "2024-05-22",
    requestedTime: "2:30 PM",
    reason: "Experiencing increased anxiety attacks",
    status: "pending",
    urgency: "high",
  },
  {
    id: "req3",
    patientId: "p1",
    patientName: "Brooklyn Simmons",
    requestDate: "2024-05-08",
    requestedDate: "2024-05-18",
    requestedTime: "9:00 AM",
    reason: "Regular monthly check-in",
    status: "approved",
    urgency: "low",
    notes: "Confirmed appointment. Will review medication effectiveness.",
  },
  {
    id: "req4",
    patientId: "p2",
    patientName: "Kristin Watson",
    requestDate: "2024-05-05",
    requestedDate: "2024-05-12",
    requestedTime: "11:30 AM",
    reason: "Need to discuss new symptoms",
    status: "declined",
    urgency: "medium",
    notes: "Suggested earlier appointment on May 10th instead.",
  },
];

// Sample clinician notes for patients
const patientNotes = {
  p1: [
    {
      id: "note1",
      date: "2024-05-15",
      title: "Initial Assessment",
      content:
        "Patient displays symptoms consistent with Generalized Anxiety Disorder. Exhibits worry across multiple domains including work, health, and relationships. Physical symptoms include tension, fatigue, and sleep disturbance.",
      tags: ["assessment", "GAD", "symptoms"],
    },
    {
      id: "note2",
      date: "2024-05-01",
      title: "Medication Review",
      content:
        "Sertraline seems to be effective in reducing overall anxiety levels. Patient reported minor side effects (mild nausea in the mornings) but these are diminishing. Buspirone added to regimen to address breakthrough anxiety.",
      tags: ["medication", "side effects", "sertraline", "buspirone"],
    },
  ],
  p2: [
    {
      id: "note3",
      date: "2024-05-10",
      title: "Panic Attack Frequency",
      content:
        "Patient reports reduction in panic attack frequency (from 3-4 per week to 1-2). Still experiencing anticipatory anxiety about future attacks. Discussed breathing techniques and cognitive restructuring to address catastrophic thinking.",
      tags: ["panic attacks", "CBT", "breathing techniques"],
    },
  ],
};

// Create a memoized chart component
const AnxietyChart = memo(({ chartData, chartOptions }) => {
  return (
    <div className="chart-card">
      <div className="chart-title">Attack Frequency Over Time</div>
      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
});

// Add this before any component definitions
const initialNoteState = {
  title: "",
  content: "",
  note_content: "",
  tags: [],
};

// Create a memoized patient notes component
const PatientNotes = memo(
  ({
    selectedPatient,
    filteredNotes,
    searchNotes,
    setSearchNotes,
    showNotesForm,
    setShowNotesForm,
    newNote,
    setNewNote,
    editingNote,
    setEditingNote,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
    initialNoteState,
  }) => {
    return (
      <div className="patient-notes-section">
        <div className="section-header patient-notes-header">
          <h2>Patient Notes</h2>
          <button
            className="primary-button"
            onClick={() => setShowNotesForm(!showNotesForm)}
          >
            {showNotesForm ? "Hide Form" : "+ Add New Note"}
          </button>
        </div>

        {showNotesForm && (
          <div className="create-note-card">
            {editingNote ? (
              <>
                <h3>Edit Note</h3>
                <input
                  type="text"
                  placeholder="Note title"
                  value={editingNote.title}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, title: e.target.value })
                  }
                  className="note-title-input"
                />
                <textarea
                  placeholder="Note content..."
                  value={editingNote.content}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, content: e.target.value })
                  }
                  rows="6"
                  className="note-content-input"
                ></textarea>
                <div className="note-actions">
                  <button
                    className="cancel-button"
                    onClick={() => setEditingNote(null)}
                  >
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleUpdateNote}>
                    Update Note
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Create New Note</h3>
                <input
                  type="text"
                  placeholder="Note title"
                  value={newNote.title || ""}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  className="note-title-input"
                />
                <textarea
                  placeholder="Note content..."
                  value={newNote.content || ""}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  rows="6"
                  className="note-content-input"
                ></textarea>
                <button className="create-note-button" onClick={handleAddNote}>
                  Add Note
                </button>
              </>
            )}
          </div>
        )}

        <div className="notes-search-container">
          <div className="notes-search">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchNotes}
              onChange={(e) => setSearchNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="notes-list">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <h3>{note.title}</h3>
                  <div className="note-date">{note.date}</div>
                </div>
                <div className="note-content">
                  <p>{note.note_content}</p>
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
                    className="edit-button"
                    onClick={() => {
                      // Parse note_content to get title and content if they don't exist
                      let title = note.title;
                      let content = note.content;

                      // If we only have note_content, try to split it into title and content
                      if (!title && !content && note.note_content) {
                        const parts = note.note_content.split("\n\n");
                        title = parts[0] || "";
                        content = parts.slice(1).join("\n\n") || "";
                      }

                      const noteForEdit = {
                        ...initialNoteState,
                        ...note,
                        title: title || "",
                        content: content || "",
                        note_content: note.note_content || "",
                      };

                      setEditingNote(noteForEdit);
                      setNewNote(noteForEdit);
                      setShowNotesForm(true);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3>No notes found</h3>
              <p>
                {searchNotes.trim()
                  ? `No notes matching "${searchNotes}"`
                  : `No notes created yet for ${selectedPatient?.name}`}
              </p>
              {searchNotes.trim() && (
                <button
                  className="clear-search-button"
                  onClick={() => setSearchNotes("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

// Settings panel component
const SettingsPanel = memo(
  ({ showSettings, closeSettings, darkMode, toggleDarkMode, user }) => {
    const [activeTab, setActiveTab] = useState("profile");
    const [profileData, setProfileData] = useState({
      name: user?.name || "John Doe",
      email: user?.email || "john.doe@example.com",
      phone: user?.phone || "(555) 123-4567",
      specialization: user?.specialization || "Clinical Psychology",
      licenseNumber: user?.licenseNumber || "PSY12345",
    });

    const [passwordData, setPasswordData] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    const [formErrors, setFormErrors] = useState({});
    const [formSuccess, setFormSuccess] = useState("");

    const handleProfileChange = (field, value) => {
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setFormSuccess("");
    };

    const handlePasswordChange = (field, value) => {
      setPasswordData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setFormSuccess("");
    };

    const validateForm = () => {
      const errors = {};
      if (!profileData.name.trim()) errors.name = "Name is required";
      if (!profileData.email.trim()) {
        errors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
        errors.email = "Email is invalid";
      }

      // Only validate password fields if any of them are filled
      if (
        passwordData.currentPassword ||
        passwordData.newPassword ||
        passwordData.confirmPassword
      ) {
        if (!passwordData.currentPassword)
          errors.currentPassword = "Current password is required";
        if (!passwordData.newPassword) {
          errors.newPassword = "New password is required";
        } else if (passwordData.newPassword.length < 8) {
          errors.newPassword = "Password must be at least 8 characters";
        }
        if (!passwordData.confirmPassword) {
          errors.confirmPassword = "Please confirm your password";
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
          errors.confirmPassword = "Passwords do not match";
        }
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        // In a real app, make API call to update profile and password if changed
        console.log("Profile updated:", profileData);
        if (passwordData.currentPassword) {
          console.log("Password updated");
        }
        setFormSuccess("Profile updated successfully!");

        // Reset password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Reset form errors
        setFormErrors({});
      }
    };

    if (!showSettings) return null;

    return (
      <div className="settings-overlay">
        <div className="settings-panel">
          <div className="settings-header">
            <h2>Settings</h2>
            <button className="close-button" onClick={closeSettings}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="settings-tabs">
            <button
              className={`settings-tab ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button
              className={`settings-tab ${
                activeTab === "appearance" ? "active" : ""
              }`}
              onClick={() => setActiveTab("appearance")}
            >
              Appearance
            </button>
          </div>

          <div className="settings-content">
            {formSuccess && (
              <div className="success-message">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                {formSuccess}
              </div>
            )}

            {activeTab === "profile" && (
              <form className="settings-form" onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3 className="section-title">Personal Information</h3>
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        handleProfileChange("name", e.target.value)
                      }
                      className={formErrors.name ? "error" : ""}
                    />
                    {formErrors.name && (
                      <div className="field-error">{formErrors.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                      className={formErrors.email ? "error" : ""}
                    />
                    {formErrors.email && (
                      <div className="field-error">{formErrors.email}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleProfileChange("phone", e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="specialization">Specialization</label>
                    <input
                      type="text"
                      id="specialization"
                      value={profileData.specialization}
                      onChange={(e) =>
                        handleProfileChange("specialization", e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="license">License Number</label>
                    <input
                      type="text"
                      id="license"
                      value={profileData.licenseNumber}
                      onChange={(e) =>
                        handleProfileChange("licenseNumber", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">Change Password</h3>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      className={formErrors.currentPassword ? "error" : ""}
                    />
                    {formErrors.currentPassword && (
                      <div className="field-error">
                        {formErrors.currentPassword}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      className={formErrors.newPassword ? "error" : ""}
                    />
                    {formErrors.newPassword && (
                      <div className="field-error">
                        {formErrors.newPassword}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      className={formErrors.confirmPassword ? "error" : ""}
                    />
                    {formErrors.confirmPassword && (
                      <div className="field-error">
                        {formErrors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="primary-button">
                  Save Changes
                </button>
              </form>
            )}

            {activeTab === "appearance" && (
              <div className="appearance-settings">
                <div className="theme-option">
                  <div className="theme-info">
                    <h3>Dark Mode</h3>
                    <p>Switch between light and dark theme.</p>
                  </div>
                  <div className="theme-toggle">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={toggleDarkMode}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// Add this mock data for existing doctors (for duplicate checking)
const existingDoctors = [
  {
    id: "D001",
    email: "john.smith@anxiease.com",
    name: "Dr. John Smith",
    contact: "(555) 123-4567",
    dateRegistered: "2024-03-01",
    profilePicture: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
  },
];

// Add Doctor Modal Component
const AddDoctorModal = memo(({ show, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    idNumber: "",
    email: "",
    contact: "",
    profilePicture: null,
    dateRegistered: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    // Reset form when modal is opened
    if (show) {
      setFormData({
        name: "",
        idNumber: "",
        email: "",
        contact: "",
        profilePicture: null,
        dateRegistered: new Date().toISOString().split("T")[0],
      });
      setErrors({});
      setPreviewUrl("");
    }
  }, [show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors((prev) => ({
          ...prev,
          profilePicture: "File size should not exceed 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          profilePicture: "Please upload an image file",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      setErrors((prev) => ({
        ...prev,
        profilePicture: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required";
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "ID Number is required";
    } else if (existingDoctors.some((doc) => doc.id === formData.idNumber)) {
      newErrors.idNumber = "ID number is already registered";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    } else if (existingDoctors.some((doc) => doc.email === formData.email)) {
      newErrors.email = "Email already exists";
    }

    if (!formData.contact.trim()) {
      newErrors.contact = "Contact Number is required";
    }

    if (!formData.profilePicture && !previewUrl) {
      newErrors.profilePicture = "Profile Picture is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-doctor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Add New Doctor</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="add-doctor-form">
            <div className="form-section">
              <div className="profile-picture-upload">
                <div className="preview-container">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="profile-preview"
                    />
                  ) : (
                    <div className="upload-placeholder">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="upload-controls">
                  <label className="upload-button" htmlFor="profilePicture">
                    Upload Picture
                    <input
                      type="file"
                      id="profilePicture"
                      name="profilePicture"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {errors.profilePicture && (
                    <div className="field-error">{errors.profilePicture}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? "error" : ""}
                />
                {errors.name && (
                  <div className="field-error">{errors.name}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="idNumber">ID Number</label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className={errors.idNumber ? "error" : ""}
                />
                {errors.idNumber && (
                  <div className="field-error">{errors.idNumber}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "error" : ""}
                />
                {errors.email && (
                  <div className="field-error">{errors.email}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contact">Contact Number</label>
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className={errors.contact ? "error" : ""}
                />
                {errors.contact && (
                  <div className="field-error">{errors.contact}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="dateRegistered">Date Registered</label>
                <input
                  type="date"
                  id="dateRegistered"
                  name="dateRegistered"
                  value={formData.dateRegistered}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-button">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

// Create a helper component for patient details that can handle both mock and real data
const PatientDetailCard = ({ patient }) => {
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    async function fetchUserDetails() {
      if (!patient?.id) return;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", patient.id)
        .single();
      if (!error && data) setUserDetails(data);
    }
    fetchUserDetails();
  }, [patient?.id]);

  // Helper to calculate age from birth_date
  function calculateAge(birthDate) {
    if (!birthDate) return null;
    const dob = new Date(birthDate);
    const diff = Date.now() - dob.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  return (
    <div className="patient-detail-card">
      <div className="patient-detail-header">
        <img
          src={
            patient.avatar ||
            `https://cdn-icons-png.flaticon.com/512/2922/2922510.png`
          }
          alt={
            userDetails
              ? `${userDetails.first_name} ${userDetails.last_name}`
              : patient.name
          }
        />
        <div>
          <div className="patient-name">
            {userDetails
              ? `${userDetails.first_name || ""} ${
                  userDetails.last_name || ""
                }`.trim() || patient.name
              : patient.name}
          </div>
          <div className="patient-id">Patient ID: {patient.id}</div>
        </div>
      </div>

      <div className="patient-info-grid">
        <div className="info-item">
          <div className="label">Age</div>
          <div className="value">
            {userDetails?.birth_date
              ? calculateAge(userDetails.birth_date)
              : "Not available"}
          </div>
        </div>

        <div className="info-item">
          <div className="label">Gender</div>
          <div className="value">{userDetails?.gender || "Not specified"}</div>
        </div>

        <div className="info-item">
          <div className="label">Contact Number</div>
          <div className="value">
            {userDetails?.contact_number || "Not available"}
          </div>
        </div>

        <div className="info-item">
          <div className="label">Emergency Contact</div>
          <div className="value">
            {userDetails?.emergency_contact || "Not provided"}
          </div>
        </div>
      </div>
    </div>
  );
};

// Create a PsychologistProfile component for managing psychologist profile
const PsychologistProfile = memo(({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Add states for verification flow
  const [verificationStep, setVerificationStep] = useState("initial"); // initial, codeSent, verifying
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    licenseNumber: user?.licenseNumber || "",
    bio: user?.bio || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  // Fetch psychologist profile data when component mounts
  useEffect(() => {
    const fetchPsychologistData = async () => {
      try {
        setLoading(true);
        // Get the current user's auth data
        const { data: userData } = await supabase.auth.getUser();

        if (!userData?.user) {
          throw new Error("User not authenticated");
        }

        // Query the psychologists table to get the full profile
        const { data: psychData, error } = await supabase
          .from("psychologists")
          .select("*")
          .eq("user_id", userData.user.id)
          .single();

        if (error) {
          // If no match by user_id, try with email
          const { data: psychByEmail, error: emailError } = await supabase
            .from("psychologists")
            .select("*")
            .eq("email", userData.user.email)
            .single();

          if (emailError) {
            throw new Error("Couldn't find psychologist profile");
          }

          // Get name components if they exist, otherwise parse from full name
          setProfileData({
            name: psychByEmail.name || userData.user.user_metadata?.name || "",
            // Store individual name components if they exist in the database
            firstName: psychByEmail.firstName || "",
            middleName: psychByEmail.middleName || "",
            lastName: psychByEmail.lastName || "",
            email: psychByEmail.email || userData.user.email || "",
            phone: psychByEmail.contact || "",
            licenseNumber: psychByEmail.license_number || "",
            bio: psychByEmail.bio || "",
          });

          // Set avatar URL if available
          if (psychByEmail.avatar_url) {
            setAvatarUrl(psychByEmail.avatar_url);
          }
        } else {
          // Get name components if they exist, otherwise parse from full name
          setProfileData({
            name: psychData.name || userData.user.user_metadata?.name || "",
            // Store individual name components if they exist in the database
            firstName: psychData.firstName || "",
            middleName: psychData.middleName || "",
            lastName: psychData.lastName || "",
            email: psychData.email || userData.user.email || "",
            phone: psychData.contact || "",
            licenseNumber: psychData.license_number || "",
            bio: psychData.bio || "",
          });

          // Set avatar URL if available
          if (psychData.avatar_url) {
            setAvatarUrl(psychData.avatar_url);
          }
        }
      } catch (error) {
        console.error("Error fetching psychologist data:", error);
        setMessage({
          type: "error",
          text: "Failed to load profile data. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPsychologistData();
  }, []);

  // Handle profile data changes
  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear any error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle password data changes
  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear any error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({
          type: "error",
          text: "Image is too large. Maximum size is 2MB.",
        });
        return;
      }

      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        setMessage({
          type: "error",
          text: "Unsupported file type. Please upload a JPEG, PNG, or GIF image.",
        });
        return;
      }

      setUploadLoading(true);
      setMessage({ type: "", text: "" });

      // Get current user data
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error("User not authenticated");
      }

      // Generate a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${userData.user.id}_${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload the file to Supabase Storage using the correct bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL from the same bucket
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update the psychologist record with the new avatar URL
      const { error: updateError } = await supabase
        .from("psychologists")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", userData.user.id);

      if (updateError) {
        // Try email if user_id fails
        const { error: emailUpdateError } = await supabase
          .from("psychologists")
          .update({ avatar_url: avatarUrl })
          .eq("email", userData.user.email);

        if (emailUpdateError) throw emailUpdateError;
      }

      // Update local state
      setAvatarUrl(avatarUrl);

      setMessage({
        type: "success",
        text: "Profile picture updated successfully!",
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setMessage({
        type: "error",
        text: "Failed to upload profile picture. Please try again.",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle profile photo removal
  const handleRemoveProfilePhoto = async () => {
    try {
      if (!avatarUrl) return;

      setUploadLoading(true);
      setMessage({ type: "", text: "" });

      // Get current user data
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error("User not authenticated");
      }

      // Update the psychologist record to remove the avatar URL
      const { error: updateError } = await supabase
        .from("psychologists")
        .update({ avatar_url: null })
        .eq("user_id", userData.user.id);

      if (updateError) {
        // Try email if user_id fails
        const { error: emailUpdateError } = await supabase
          .from("psychologists")
          .update({ avatar_url: null })
          .eq("email", userData.user.email);

        if (emailUpdateError) throw emailUpdateError;
      }

      // Update local state
      setAvatarUrl(null);

      setMessage({
        type: "success",
        text: "Profile picture removed successfully!",
      });
    } catch (error) {
      console.error("Error removing profile picture:", error);
      setMessage({
        type: "error",
        text: "Failed to remove profile picture. Please try again.",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Add function to request verification code
  const requestVerificationCode = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      // Get the current user's email
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error("User not authenticated");
      }

      // Store email for verification step
      setVerificationEmail(userData.user.email);

      // Request password reset (this sends the 6-digit code)
      const { error } = await supabase.auth.resetPasswordForEmail(
        userData.user.email,
        {
          redirectTo: window.location.origin,
        }
      );

      if (error) throw error;

      // Update UI state
      setVerificationStep("codeSent");
      setMessage({
        type: "success",
        text: "Verification code sent to your email. Please check your inbox.",
      });
    } catch (error) {
      console.error("Error requesting verification code:", error);
      setMessage({
        type: "error",
        text: "Failed to send verification code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add function to verify code and update password
  const verifyCodeAndUpdatePassword = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      if (!verificationCode || verificationCode.length !== 6) {
        setErrors({ verificationCode: "Please enter a valid 6-digit code" });
        setLoading(false);
        return;
      }

      // Verify the code and update password
      const { error } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: verificationCode,
        type: "recovery",
      });

      if (error) throw error;

      // If verification successful, update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      // Reset form and show success
      setVerificationStep("initial");
      setVerificationCode("");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage({
        type: "success",
        text: "Password updated successfully!",
      });
    } catch (error) {
      console.error("Error verifying code or updating password:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to verify code or update password.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};

    if (activeTab === "personal") {
      if (!profileData.name.trim()) newErrors.name = "Name is required";
      if (!profileData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
        newErrors.email = "Email is invalid";
      }
      // Add other validations as needed
    } else if (activeTab === "security") {
      if (verificationStep === "initial") {
        if (!passwordData.currentPassword) {
          newErrors.currentPassword = "Current password is required";
        }
        if (!passwordData.newPassword) {
          newErrors.newPassword = "New password is required";
        } else if (passwordData.newPassword.length < 8) {
          newErrors.newPassword = "Password must be at least 8 characters";
        }
        if (!passwordData.confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      } else if (verificationStep === "codeSent") {
        if (!verificationCode.trim()) {
          newErrors.verificationCode = "Verification code is required";
        } else if (verificationCode.length !== 6) {
          newErrors.verificationCode = "Verification code must be 6 digits";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update handleSubmit to use the verification flow
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (activeTab === "personal") {
      setLoading(true);
      setMessage({ type: "", text: "" });

      try {
        // Get the current user's auth data
        const { data: userData } = await supabase.auth.getUser();

        if (!userData?.user) {
          throw new Error("User not authenticated");
        }

        // Find the psychologist record
        const { data: psychData, error: fetchError } = await supabase
          .from("psychologists")
          .select("*")
          .eq("user_id", userData.user.id)
          .single();

        // If no match by user_id, try with email
        if (fetchError) {
          const { data: psychByEmail, error: emailError } = await supabase
            .from("psychologists")
            .select("*")
            .eq("email", userData.user.email)
            .single();

          if (emailError) {
            throw new Error("Couldn't find psychologist profile to update");
          }

          // Update the psychologist record
          const { error: updateError } = await supabase
            .from("psychologists")
            .update({
              contact: profileData.phone,
              license_number: profileData.licenseNumber,
              bio: profileData.bio,
            })
            .eq("id", psychByEmail.id);

          if (updateError) throw updateError;
        } else {
          // Update the psychologist record
          const { error: updateError } = await supabase
            .from("psychologists")
            .update({
              contact: profileData.phone,
              license_number: profileData.licenseNumber,
              bio: profileData.bio,
            })
            .eq("id", psychData.id);

          if (updateError) throw updateError;
        }

        setMessage({
          type: "success",
          text: "Profile information updated successfully!",
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        setMessage({
          type: "error",
          text: "An error occurred. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    } else if (activeTab === "security") {
      if (verificationStep === "initial") {
        // Request verification code
        requestVerificationCode();
      } else if (verificationStep === "codeSent") {
        // Verify code and update password
        verifyCodeAndUpdatePassword();
      }
    }
  };

  return (
    <div className="profile-overlay">
      <div className="profile-container">
        <div className="profile-header">
          <h2>Your Profile</h2>
          <button className="close-button" onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${
              activeTab === "personal" ? "active" : ""
            }`}
            onClick={() => setActiveTab("personal")}
          >
            Personal Information
          </button>
          <button
            className={`profile-tab ${
              activeTab === "security" ? "active" : ""
            }`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </button>
        </div>

        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.type === "success" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {message.type === "error" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
            {message.text}
          </div>
        )}

        <div className="profile-content">
          {loading && verificationStep === "initial" ? (
            <div className="loading-state">
              <div className="spinner-container">
                <div className="spinner"></div>
              </div>
              <p>Loading profile information...</p>
            </div>
          ) : (
            activeTab === "personal" && (
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-section">
                  <div className="profile-picture-section">
                    <div className="profile-picture">
                      {uploadLoading ? (
                        <div className="profile-picture-loading">
                          <div className="spinner"></div>
                        </div>
                      ) : (
                        <img
                          src={
                            avatarUrl ||
                            user?.avatar ||
                            "https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
                          }
                          alt={profileData.name}
                        />
                      )}
                    </div>
                    <div className="profile-picture-actions">
                      <label className="upload-picture-button">
                        Upload Photo
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleProfilePhotoUpload(e)}
                        />
                      </label>
                      <button
                        type="button"
                        className="remove-picture-button"
                        onClick={handleRemoveProfilePhoto}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="name-fields-section">
                    <h4 className="section-subtitle">Personal Information</h4>
                    <p className="field-info">
                      Your name information was provided during account creation
                      and cannot be edited.
                    </p>

                    <div className="name-fields-grid">
                      <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                          type="text"
                          id="firstName"
                          value={(() => {
                            // Use firstName if it exists, otherwise parse from full name
                            if (profileData.firstName) {
                              return profileData.firstName;
                            }

                            // Split the full name to show only the first name(s)
                            const nameParts = profileData.name.split(" ");
                            if (nameParts.length <= 2) {
                              // If there are only 1-2 parts, first part is the first name
                              return nameParts[0] || "";
                            } else if (nameParts.length === 3) {
                              // If there are 3 parts, first part is first name (like Mark in Mark Joseph Molina)
                              return nameParts[0] || "";
                            } else if (nameParts.length >= 4) {
                              // If there are 4+ parts (like Shawn Michael Baybayon Gako)
                              // First two parts are considered first name (Shawn Michael)
                              return `${nameParts[0]} ${nameParts[1]}`;
                            }
                            return nameParts[0] || "";
                          })()}
                          className="name-field"
                          disabled
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="middleName">Middle Name</label>
                        <input
                          type="text"
                          id="middleName"
                          value={(() => {
                            // Use middleName if it exists, otherwise parse from full name
                            if (profileData.middleName) {
                              return profileData.middleName;
                            }

                            // Split the full name to get the middle name(s)
                            const nameParts = profileData.name.split(" ");
                            if (nameParts.length <= 2) {
                              // If only 1-2 parts, no middle name
                              return "";
                            } else if (nameParts.length === 3) {
                              // If 3 parts, second part is middle name (like Joseph in Mark Joseph Molina)
                              return nameParts[1] || "";
                            } else if (nameParts.length >= 4) {
                              // If 4+ parts (like Shawn Michael Baybayon Gako)
                              // The part before the last name is middle name (Baybayon)
                              return nameParts[nameParts.length - 2] || "";
                            }
                            return "";
                          })()}
                          className="name-field"
                          disabled
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                          type="text"
                          id="lastName"
                          value={(() => {
                            // Use lastName if it exists, otherwise parse from full name
                            if (profileData.lastName) {
                              return profileData.lastName;
                            }

                            // Split the full name to get the last name
                            const nameParts = profileData.name.split(" ");
                            // Last part is always the last name
                            return nameParts[nameParts.length - 1] || "";
                          })()}
                          className="name-field"
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ display: "none" }}>
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        handleProfileChange("name", e.target.value)
                      }
                      className={errors.name ? "error" : ""}
                    />
                    {errors.name && (
                      <div className="field-error">{errors.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                      className={errors.email ? "error" : ""}
                      disabled
                    />
                    {errors.email && (
                      <div className="field-error">{errors.email}</div>
                    )}
                    <div className="field-info">
                      Email cannot be changed as it's used for login.
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleProfileChange("phone", e.target.value)
                      }
                      className={errors.phone ? "error" : ""}
                    />
                    {errors.phone && (
                      <div className="field-error">{errors.phone}</div>
                    )}
                  </div>

                  {/* Removed specialization field */}

                  <div className="form-group">
                    <label htmlFor="licenseNumber">License Number</label>
                    <input
                      type="text"
                      id="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={(e) =>
                        handleProfileChange("licenseNumber", e.target.value)
                      }
                      className={errors.licenseNumber ? "error" : ""}
                    />
                    {errors.licenseNumber && (
                      <div className="field-error">{errors.licenseNumber}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Professional Bio</label>
                    <textarea
                      id="bio"
                      rows="4"
                      value={profileData.bio}
                      onChange={(e) =>
                        handleProfileChange("bio", e.target.value)
                      }
                      className={errors.bio ? "error" : ""}
                      placeholder="Write a short professional bio..."
                    ></textarea>
                    {errors.bio && (
                      <div className="field-error">{errors.bio}</div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )
          )}

          {!loading && activeTab === "security" && (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3 className="section-title">Change Password</h3>

                {verificationStep === "initial" ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          handlePasswordChange(
                            "currentPassword",
                            e.target.value
                          )
                        }
                        className={errors.currentPassword ? "error" : ""}
                      />
                      {errors.currentPassword && (
                        <div className="field-error">
                          {errors.currentPassword}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          handlePasswordChange("newPassword", e.target.value)
                        }
                        className={errors.newPassword ? "error" : ""}
                      />
                      {errors.newPassword && (
                        <div className="field-error">{errors.newPassword}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          handlePasswordChange(
                            "confirmPassword",
                            e.target.value
                          )
                        }
                        className={errors.confirmPassword ? "error" : ""}
                      />
                      {errors.confirmPassword && (
                        <div className="field-error">
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="verification-section">
                    <p className="verification-info">
                      A 6-digit verification code has been sent to your email
                      address. Please enter it below to confirm your password
                      change.
                    </p>

                    <div className="form-group">
                      <label htmlFor="verificationCode">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) =>
                          setVerificationCode(
                            e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
                          )
                        }
                        className={errors.verificationCode ? "error" : ""}
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                      />
                      {errors.verificationCode && (
                        <div className="field-error">
                          {errors.verificationCode}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        setVerificationStep("initial");
                        setVerificationCode("");
                      }}
                    >
                      ← Back to password change
                    </button>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      {verificationStep === "initial"
                        ? "Sending Code..."
                        : "Verifying..."}
                    </>
                  ) : verificationStep === "initial" ? (
                    "Send Verification Code"
                  ) : (
                    "Verify & Update Password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
});

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Add missing state variables
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [anxietyRecords, setAnxietyRecords] = useState([]);
  const [anxietyStats, setAnxietyStats] = useState({
    averageAttacksPerWeek: 0,
    totalAttacksThisMonth: 0,
    patientLogsThisMonth: 0,
  });

  // Initialize state with initialNoteState
  const [newNote, setNewNote] = useState(initialNoteState);
  const [editingNote, setEditingNote] = useState(null);

  // Other state variables...
  const {
    patients: apiPatients,
    loading: apiLoading,
    error: apiError,
    loadPatients,
    searchPatients,
    filterPatients,
    moodLogs,
    loadMoodLogs,
    addNote,
    updateNote,
    deleteNote,
    loadPatientNotes, // Add this
  } = usePatient();

  // Effect for fetching anxiety data when a patient is selected
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!selectedPatientId) {
        setAnxietyRecords([]);
        setAnxietyStats({
          averageAttacksPerWeek: 0,
          totalAttacksThisMonth: 0,
          patientLogsThisMonth: 0,
        });
        setCurrentNotes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log("Fetching data for patient:", selectedPatientId);

      try {
        // Fetch anxiety records
        const records = await anxietyService.getAnxietyRecords(
          selectedPatientId
        );
        console.log("Fetched records:", records);
        setAnxietyRecords(records);

        // Fetch anxiety stats
        const stats = await anxietyService.getAnxietyStats(selectedPatientId);
        console.log("Fetched stats:", stats);
        setAnxietyStats(stats);

        // Fetch patient notes
        const { data: notes, error: notesError } = await supabase
          .from("patient_notes")
          .select("*")
          .eq("patient_id", selectedPatientId)
          .order("created_at", { ascending: false });

        console.log("Fetched notes:", notes);
        if (notesError) {
          console.error("Error fetching notes:", notesError);
        } else {
          setCurrentNotes(notes || []);
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [selectedPatientId]); // Only re-run when selectedPatientId changes

  // Handle patient selection
  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId);
  };

  // Update the patient click handler
  const handlePatientClick = (patientId) => {
    setSelectedPatientId(patientId);
  };

  // Memoized chart data using real anxiety records
  const chartData = useMemo(() => {
    if (!anxietyRecords.length) {
      return {
        labels: [],
        datasets: [
          {
            label: "Anxiety Attacks",
            data: [],
            borderColor: "#3cba92",
            backgroundColor: "rgba(60, 186, 146, 0.2)",
            tension: 0.4,
            fill: true,
          },
        ],
      };
    }

    // Group records by date and count occurrences
    const recordsByDate = anxietyRecords.reduce((acc, record) => {
      const date = new Date(record.timestamp);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {});

    // Get unique dates and sort them
    const dates = Object.keys(recordsByDate).sort((a, b) => {
      const [aMonth, aDay] = a.split("/").map(Number);
      const [bMonth, bDay] = b.split("/").map(Number);
      return aMonth === bMonth ? aDay - bDay : aMonth - bMonth;
    });

    return {
      labels: dates,
      datasets: [
        {
          label: "Anxiety Attacks",
          data: dates.map((date) => recordsByDate[date]),
          borderColor: "#3cba92",
          backgroundColor: "rgba(60, 186, 146, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [anxietyRecords]);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchId, setSearchId] = useState("");
  const [showPatientLogs, setShowPatientLogs] = useState(false);
  const [filters, setFilters] = useState({
    mood: "",
    stress: "",
    symptoms: "",
  });
  const [completionNotes, setCompletionNotes] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showAppointments, setShowAppointments] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseNote, setResponseNote] = useState("");
  const [appointmentList, setAppointmentList] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [viewedNotifications, setViewedNotifications] = useState({
    pending: false,
    approved: false,
    completed: false,
  });

  const [showNotesForm, setShowNotesForm] = useState(false);
  const [currentNotes, setCurrentNotes] = useState([]);
  const [searchNotes, setSearchNotes] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [showProfile, setShowProfile] = useState(false);

  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [doctors, setDoctors] = useState(existingDoctors);

  // Load patients on component mount
  React.useEffect(() => {
    loadPatients();
    // eslint-disable-next-line
  }, []);

  // Load appointments for the psychologist
  React.useEffect(() => {
    const fetchAppointments = async () => {
      if (currentUser && currentUser.id) {
        setLoadingAppointments(true);
        try {
          console.log(
            "Fetching appointments for psychologist:",
            currentUser.id
          );
          const appointments =
            await appointmentService.getAppointmentsByPsychologist(
              currentUser.id
            );
          console.log("Fetched appointments:", appointments);

          // Compare with previous appointments to see if there are new ones
          const previousAppointments = appointmentList || [];
          const hasNewAppointments = appointments.some(
            (appointment) =>
              !previousAppointments.some(
                (prevApp) => prevApp.id === appointment.id
              )
          );

          // Reset viewed notifications if there are new appointments
          if (hasNewAppointments) {
            setViewedNotifications({
              pending: false,
              approved: false,
              completed: false,
            });
          }

          setAppointmentList(appointments);
        } catch (error) {
          console.error("Error fetching appointments:", error);
        } finally {
          setLoadingAppointments(false);
        }
      }
    };

    fetchAppointments();
  }, [currentUser]);

  // Load mood logs for selected patient
  React.useEffect(() => {
    if (selectedPatientId) {
      console.log(
        "Dashboard: Loading mood logs for patient:",
        selectedPatientId
      );
      loadMoodLogs(selectedPatientId)
        .then((data) => {
          console.log(
            `Dashboard: Successfully loaded ${data.length} mood logs`
          );
        })
        .catch((err) => {
          console.error("Dashboard: Error loading mood logs:", err);
        });
    }
  }, [selectedPatientId]); // Removed loadMoodLogs from dependencies

  // Update filtered patients when search term or filters change
  React.useEffect(() => {
    let result = apiPatients;

    // Apply search
    if (searchTerm) {
      result = searchPatients(searchTerm);
    }

    // Apply ID search
    if (searchId) {
      result = result.filter((patient) =>
        patient.id.toString().includes(searchId)
      );
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
  }, [
    apiPatients,
    searchTerm,
    searchId,
    filters,
    searchPatients,
    filterPatients,
  ]);

  // Load notes for selected patient
  React.useEffect(() => {
    if (selectedPatientId) {
      setCurrentNotes(patientNotes[selectedPatientId] || []);
    }
  }, [selectedPatientId]);

  // Apply dark mode when it changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
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

  // Memoized chart data and options to prevent recalculations
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0, // Remove animations to prevent layout shifts
      },
      layout: {
        padding: {
          top: 5,
          bottom: 5,
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
        x: {
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
      },
    }),
    []
  );

  // Helper function to generate dates for the current month
  function getDatesForCurrentMonth() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${month + 1}/${day}`;
    });
  }

  // Helper function to generate random data
  function generateRandomData(count, min, max) {
    return Array.from(
      { length: count },
      () => Math.floor(Math.random() * (max - min + 1)) + min
    );
  }

  // Get mood badge color
  const getMoodColor = (mood) => {
    const colors = {
      Happy: { bg: "#e6f9ed", text: "#22c55e" },
      Anxious: { bg: "#fae8ff", text: "#d946ef" },
      Neutral: { bg: "#f3f4f6", text: "#6b7280" },
      Sad: { bg: "#dbeafe", text: "#3b82f6" },
      Calm: { bg: "#e6f9ed", text: "#22c55e" },
    };
    return colors[mood] || { bg: "#f3f4f6", text: "#6b7280" };
  };

  // Get stress level colors
  const getStressLevelColor = (level) => {
    const colors = {
      High: { bg: "#fee2e2", text: "#ef4444" },
      Medium: { bg: "#fef3c7", text: "#f59e0b" },
      Low: { bg: "#e6f9ed", text: "#22c55e" },
    };
    return colors[level] || { bg: "#f3f4f6", text: "#6b7280" };
  };

  // Filter appointments based on status
  const filteredAppointments = appointmentList.filter((req) => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return req.status === "completed";
    return req.status === activeTab;
  });

  // Handle appointment response (approve/decline)
  const handleAppointmentResponse = async (requestId, status) => {
    if (!responseNote.trim() && status === "declined") {
      alert(
        "Please provide a note explaining why the appointment was declined"
      );
      return;
    }

    // Update the appointment in the database
    const success = await appointmentService.updateAppointmentStatus(
      requestId,
      status,
      responseNote || undefined
    );

    if (success) {
      // Update the local state only if database update was successful
      setAppointmentList((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status, responseMessage: responseNote || undefined }
            : req
        )
      );

      setResponseNote("");
      setSelectedRequest(null);
    } else {
      alert("Failed to update appointment. Please try again.");
    }
  };

  // Handle creating a new note
  const handleAddNote = async () => {
    // Check if either title or content is empty
    if (!newNote.title?.trim()) {
      alert("Please provide a title for the note");
      return;
    }

    if (!newNote.content?.trim()) {
      alert("Please provide content for the note");
      return;
    }

    try {
      console.log("Adding note:", newNote);
      // Combine title and content into note_content for database
      const noteContent = `${newNote.title}\n\n${newNote.content}`;
      await addNote(selectedPatientId, noteContent);
      console.log("Note successfully added!");

      // Reset form state
      setNewNote({ ...initialNoteState });
      setEditingNote(null);
      setShowNotesForm(false);

      // Refresh notes list
      const { data: updatedNotes } = await supabase
        .from("patient_notes")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("created_at", { ascending: false });

      if (updatedNotes) {
        setCurrentNotes(updatedNotes);
      }
    } catch (error) {
      console.error("Add note error:", error);
      alert("Failed to add note. Please try again.");
    }
  };

  // Handle updating an existing note
  const handleUpdateNote = async () => {
    if (!editingNote?.id) {
      alert("No note selected for editing");
      return;
    }

    if (!newNote.title?.trim() || !newNote.content?.trim()) {
      alert("Please provide both title and content for the note");
      return;
    }

    try {
      console.log("Updating note:", editingNote.id);

      // Combine title and content for the database
      const noteContent = `${newNote.title}\n\n${newNote.content}`;

      // Update in Supabase
      const { data, error } = await supabase
        .from("patient_notes")
        .update({
          note_content: noteContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingNote.id)
        .select();

      if (error) throw error;

      console.log("Note successfully updated in database:", data);

      // Update the local state with the new data
      setCurrentNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === editingNote.id
            ? {
                ...note,
                note_content: noteContent,
                updated_at: new Date().toISOString(),
              }
            : note
        )
      );

      // Reset form state
      setNewNote({ ...initialNoteState });
      setEditingNote(null);
      setShowNotesForm(false);

      // Fetch updated notes to ensure UI is in sync with database
      const { data: updatedNotes, error: fetchError } = await supabase
        .from("patient_notes")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (updatedNotes) {
        setCurrentNotes(updatedNotes);
      }
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note. Please try again.");
    }
  };

  // Update the note form to match the validation fields
  const renderNoteForm = () => (
    <div className="create-note-card">
      <h3>{editingNote ? "Edit Note" : "Create New Note"}</h3>
      <textarea
        placeholder="Note content..."
        value={newNote.note_content || ""} // Ensure it's never undefined
        onChange={(e) => setNewNote({ note_content: e.target.value })}
        rows="6"
        className="note-content-input"
      ></textarea>
      <div className="note-form-buttons">
        <button
          className="cancel-button"
          onClick={() => {
            setEditingNote(null);
            setNewNote({ note_content: "" }); // Reset to initial state
            setShowNotesForm(false);
          }}
        >
          Cancel
        </button>
        <button
          className="create-note-button"
          onClick={editingNote ? handleUpdateNote : handleAddNote}
        >
          {editingNote ? "Update Note" : "Add Note"}
        </button>
      </div>
    </div>
  );

  // Add some CSS for the buttons
  const styles = {
    // ... existing styles ...
    noteFormButtons: {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "10px",
    },
    cancelButton: {
      padding: "8px 16px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      backgroundColor: "#fff",
      cursor: "pointer",
    },
    createNoteButton: {
      padding: "8px 16px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
  };

  // Update handleDeleteNote to handle database deletion
  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        // Delete from Supabase database
        const { error } = await supabase
          .from("patient_notes")
          .delete()
          .eq("id", noteId);

        if (error) {
          throw error;
        }

        // If deletion was successful, update local state
        setCurrentNotes((prev) => prev.filter((note) => note.id !== noteId));
        console.log("Note successfully deleted!");
      } catch (error) {
        console.error("Error deleting note:", error);
        alert("Failed to delete note. Please try again.");
      }
    }
  };

  // Filter notes based on search
  const filteredNotes = searchNotes.trim()
    ? currentNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchNotes.toLowerCase()) ||
          note.content.toLowerCase().includes(searchNotes.toLowerCase()) ||
          note.tags.some((tag) =>
            tag.toLowerCase().includes(searchNotes.toLowerCase())
          )
      )
    : currentNotes;

  // Add these handlers right after the other handlers
  const handlePatientLogsClick = () => {
    setShowPatientLogs(true);
  };

  const handleAppointmentsClick = () => {
    setShowAppointments(true);
    // Reset viewed notifications when opening appointments modal
    // This is intentionally not clearing them so you can see which tabs have notifications
  };

  const handleCloseAppointments = () => {
    setShowAppointments(false);
    setSelectedRequest(null);
    setResponseNote("");
    setCompletionNotes("");
  };

  // Handle marking an appointment as completed
  const handleMarkAppointmentCompleted = async (appointmentId) => {
    if (!completionNotes.trim()) {
      alert("Please provide completion notes before marking as completed");
      return;
    }

    // Update the appointment in the database
    const success = await appointmentService.markAppointmentCompleted(
      appointmentId,
      completionNotes
    );

    if (success) {
      // Update the local state only if database update was successful
      setAppointmentList((prev) =>
        prev.map((req) =>
          req.id === appointmentId ? { ...req, status: "completed" } : req
        )
      );

      setCompletionNotes("");
      setSelectedRequest(null);

      // Show a success message
      alert("Appointment marked as completed successfully!");
    } else {
      alert("Failed to mark appointment as completed. Please try again.");
    }
  };

  const handleClosePatientLogs = () => {
    setShowPatientLogs(false);
  };

  const handleAddDoctor = (doctorData) => {
    // In a real app, you would make an API call here
    const newDoctor = {
      ...doctorData,
      id: doctorData.idNumber,
      profilePicture: doctorData.profilePicture
        ? URL.createObjectURL(doctorData.profilePicture)
        : null,
      // Make sure we store the individual name components for proper display later
      firstName: doctorData.firstName || "",
      middleName: doctorData.middleName || "",
      lastName: doctorData.lastName || "",
    };
    setDoctors((prev) => [...prev, newDoctor]);

    // Log for debugging
    console.log("Adding new doctor with name structure:", {
      fullName: doctorData.name,
      firstName: doctorData.firstName,
      middleName: doctorData.middleName,
      lastName: doctorData.lastName,
    });
  };

  // Add psychologist-specific welcome message
  const renderPsychologistHeader = () => {
    if (currentUser?.userRole === "psychologist") {
      return (
        <div className="dashboard-section mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="text-success mb-3">Your Assigned Patients</h4>
              <p className="mb-0">
                Welcome {currentUser?.name || currentUser?.email?.split("@")[0]}
                . This dashboard shows only patients assigned to you.
                {apiLoading
                  ? " Loading patient data..."
                  : apiPatients.length === 0
                  ? " You currently have no assigned patients."
                  : ` You have ${apiPatients.length} assigned patient${
                      apiPatients.length !== 1 ? "s" : ""
                    }.`}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate stats dynamically
  const patientStats = useMemo(() => {
    if (loading) {
      return [
        {
          label: "Average Attacks",
          value: "...",
          sub: "Per week",
          status: "Loading",
        },
        {
          label: "Total Attacks",
          value: "...",
          sub: "This Month",
          status: "Loading",
        },
        {
          label: "Patient logs",
          value: "...",
          sub: "This Month",
          status: "Loading",
        },
      ];
    }

    return [
      {
        label: "Average Attacks",
        value: anxietyStats.averageAttacksPerWeek.toString(),
        sub: "Per week",
        status: "Normal",
      },
      {
        label: "Total Attacks",
        value: anxietyStats.totalAttacksThisMonth.toString(),
        sub: "This Month",
        status: "Normal",
      },
      {
        label: "Patient logs",
        value: anxietyStats.patientLogsThisMonth.toString(),
        sub: "This Month",
        status: "Normal",
      },
    ];
  }, [loading, anxietyStats]);

  if (apiLoading) {
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
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="app-logo">
          <h1>
            <span className="text-gradient">Anxie</span>Ease
          </h1>
        </div>

        <div className="patient-search">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="patient-list">
          <div className="patient-list-header">
            {filteredPatients.length} Patient
            {filteredPatients.length !== 1 ? "s" : ""}
          </div>

          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className={`patient-item ${
                  selectedPatientId === patient.id ? "active" : ""
                }`}
                onClick={() => handlePatientSelect(patient.id)}
              >
                <img
                  src={
                    patient.avatar ||
                    `https://cdn-icons-png.flaticon.com/512/2922/2922510.png`
                  }
                  alt={patient.name}
                />
                <div className="patient-info">
                  <div className="patient-name">{patient.name}</div>
                  <div className="patient-id">ID: {patient.id}</div>
                </div>
              </div>
            ))
          ) : apiLoading ? (
            <div className="empty-state">Loading patients...</div>
          ) : (
            <div className="empty-state">No patients found</div>
          )}
        </div>

        <div className="sidebar-actions">
          <button className="action-button" onClick={handleAppointmentsClick}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Appointment Requests
            {/* Only show badge for notifications that haven't been viewed */}
            {(viewedNotifications.pending
              ? 0
              : appointmentList.filter((req) => req.status === "pending")
                  .length) +
              (viewedNotifications.approved
                ? 0
                : appointmentList.filter((req) => req.status === "approved")
                    .length) +
              (viewedNotifications.completed
                ? 0
                : appointmentList.filter((req) => req.status === "completed")
                    .length) >
              0 && (
              <span className="badge">
                {(viewedNotifications.pending
                  ? 0
                  : appointmentList.filter((req) => req.status === "pending")
                      .length) +
                  (viewedNotifications.approved
                    ? 0
                    : appointmentList.filter((req) => req.status === "approved")
                        .length) +
                  (viewedNotifications.completed
                    ? 0
                    : appointmentList.filter(
                        (req) => req.status === "completed"
                      ).length)}
              </span>
            )}
          </button>

          <button
            className="action-button profile-button"
            onClick={() => setShowProfile(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Profile
          </button>
        </div>

        <LogoutButton />
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Add the psychologist header here */}
        {!selectedPatientId && renderPsychologistHeader()}

        {/* Admin's Add Doctor Button - Only visible for admins and only on the dashboard view */}
        {currentUser?.userRole === "admin" && !selectedPatientId && (
          <div className="admin-controls">
            <button
              className="add-doctor-button"
              onClick={() => setShowAddDoctor(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add New Doctor
            </button>
          </div>
        )}

        {showAppointments && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Appointment Requests</h2>
                <button
                  className="close-button"
                  onClick={handleCloseAppointments}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="tab-navigation">
                  <button
                    className={`tab-button ${
                      activeTab === "all" ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveTab("all");
                      // Mark all tabs as viewed when clicking "All"
                      setViewedNotifications({
                        pending: true,
                        approved: true,
                        completed: true,
                      });
                    }}
                  >
                    All
                  </button>
                  <button
                    className={`tab-button ${
                      activeTab === "pending" ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveTab("pending");
                      // Mark pending notifications as viewed
                      setViewedNotifications((prev) => ({
                        ...prev,
                        pending: true,
                      }));
                    }}
                  >
                    Pending
                    {activeTab !== "pending" &&
                      !viewedNotifications.pending &&
                      appointmentList.filter((req) => req.status === "pending")
                        .length > 0 && (
                        <span className="badge">
                          {
                            appointmentList.filter(
                              (req) => req.status === "pending"
                            ).length
                          }
                        </span>
                      )}
                  </button>
                  <button
                    className={`tab-button ${
                      activeTab === "approved" ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveTab("approved");
                      // Mark approved notifications as viewed
                      setViewedNotifications((prev) => ({
                        ...prev,
                        approved: true,
                      }));
                    }}
                  >
                    Approved
                    {activeTab !== "approved" &&
                      !viewedNotifications.approved &&
                      appointmentList.filter((req) => req.status === "approved")
                        .length > 0 && (
                        <span className="badge">
                          {
                            appointmentList.filter(
                              (req) => req.status === "approved"
                            ).length
                          }
                        </span>
                      )}
                  </button>
                  <button
                    className={`tab-button ${
                      activeTab === "completed" ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveTab("completed");
                      // Mark completed notifications as viewed
                      setViewedNotifications((prev) => ({
                        ...prev,
                        completed: true,
                      }));
                    }}
                  >
                    Completed
                    {activeTab !== "completed" &&
                      !viewedNotifications.completed &&
                      appointmentList.filter(
                        (req) => req.status === "completed"
                      ).length > 0 && (
                        <span className="badge">
                          {
                            appointmentList.filter(
                              (req) => req.status === "completed"
                            ).length
                          }
                        </span>
                      )}
                  </button>
                  <button
                    className={`tab-button ${
                      activeTab === "declined" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("declined")}
                  >
                    Declined
                  </button>
                </div>

                {loadingAppointments ? (
                  <div className="loading-state">
                    <div className="spinner-container">
                      <div className="spinner"></div>
                    </div>
                    <p>Loading appointment requests...</p>
                  </div>
                ) : selectedRequest ? (
                  <div className="request-detail-card">
                    <div className="card-header">
                      <h3>Appointment Details</h3>
                      <button
                        className="close-button"
                        onClick={() => setSelectedRequest(null)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="request-info">
                      <div className="info-row">
                        <div className="info-label">Patient Name</div>
                        <div className="info-value">
                          {selectedRequest.patientName}
                        </div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Requested Date</div>
                        <div className="info-value">
                          {selectedRequest.requestedDate
                            ? new Date(
                                selectedRequest.requestedDate
                              ).toLocaleDateString()
                            : "Not specified"}
                        </div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Requested Time</div>
                        <div className="info-value">
                          {selectedRequest.requestedDate
                            ? new Date(
                                selectedRequest.requestedDate
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : selectedRequest.requestedTime}
                        </div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Status</div>
                        <div className="info-value">
                          <span
                            className={`status-badge ${selectedRequest.status}`}
                          >
                            {selectedRequest.status.charAt(0).toUpperCase() +
                              selectedRequest.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Reason</div>
                        <div className="info-value">
                          <div className="reason-text">
                            {selectedRequest.reason}
                          </div>
                        </div>
                      </div>
                      {selectedRequest.responseMessage && (
                        <div className="info-row">
                          <div className="info-label">Notes</div>
                          <div className="info-value">
                            <div className="notes-text">
                              {selectedRequest.responseMessage}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === "pending" && (
                        <div className="response-section">
                          <label htmlFor="responseNote">
                            Response Note (Required for declining)
                          </label>
                          <textarea
                            id="responseNote"
                            value={responseNote}
                            onChange={(e) => setResponseNote(e.target.value)}
                            placeholder="Add a note about your decision..."
                            rows={4}
                          />
                          <div className="action-buttons">
                            <button
                              className="decline-button"
                              onClick={() =>
                                handleAppointmentResponse(
                                  selectedRequest.id,
                                  "declined"
                                )
                              }
                            >
                              Decline Request
                            </button>
                            <button
                              className="approve-button"
                              onClick={() =>
                                handleAppointmentResponse(
                                  selectedRequest.id,
                                  "approved"
                                )
                              }
                            >
                              Approve Request
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === "approved" && (
                        <div className="response-section">
                          <label htmlFor="completionNotes">
                            Completion Notes (Required)
                          </label>
                          <textarea
                            id="completionNotes"
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Add notes about the completed appointment (e.g., summary, follow-up plans)..."
                            rows={4}
                          />
                          <div className="action-buttons">
                            <button
                              className="complete-button"
                              onClick={() =>
                                handleMarkAppointmentCompleted(
                                  selectedRequest.id
                                )
                              }
                            >
                              Mark as Completed
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="appointment-list">
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map((request) => (
                        <div
                          key={request.id}
                          className={`appointment-request-card ${request.status}`}
                          onClick={() => setSelectedRequest(request)}
                        >
                          <div className="request-header">
                            <h3>{request.patientName}</h3>
                            <span className={`status-badge ${request.status}`}>
                              {request.status.charAt(0).toUpperCase() +
                                request.status.slice(1)}
                            </span>
                          </div>
                          <div className="request-details">
                            <p>
                              <strong>Date:</strong>{" "}
                              {request.requestedDate
                                ? new Date(
                                    request.requestedDate
                                  ).toLocaleDateString()
                                : "Not specified"}
                            </p>
                            <p>
                              <strong>Time:</strong>{" "}
                              {request.requestedDate
                                ? new Date(
                                    request.requestedDate
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : request.requestedTime}
                            </p>
                            <p>
                              <strong>Reason:</strong> {request.reason}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          ></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <h4>No appointment requests found</h4>
                        <p>
                          {activeTab !== "all"
                            ? `No ${activeTab} appointments at this time`
                            : "You don't have any appointment requests yet"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedPatientId && (
          <div className="dashboard-welcome">
            <div className="welcome-header">
              <h2>
                Welcome,{" "}
                {currentUser?.name || currentUser?.email?.split("@")[0]}
              </h2>
              <p>Your patient dashboard overview</p>
            </div>

            <div className="dashboard-summary-cards">
              <div className="summary-card">
                <div className="summary-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="summary-content">
                  <h3>Total Patients</h3>
                  <div className="summary-value">{filteredPatients.length}</div>
                  <p>Select a patient from the sidebar to view their details</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div className="summary-content">
                  <h3>Upcoming Appointments</h3>
                  <div className="summary-value">
                    {
                      appointmentList.filter((req) => req.status === "approved")
                        .length
                    }
                  </div>
                  <p>Click on Appointment Requests in the sidebar to manage</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="summary-content">
                  <h3>Patient Requests</h3>
                  <div className="summary-value">
                    {
                      appointmentList.filter((req) => req.status === "pending")
                        .length
                    }
                  </div>
                  <p>Pending appointment requests that need your response</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Patient Activity</h3>
              <div className="activity-list">
                {filteredPatients.length > 0 ? (
                  <div className="activity-table">
                    <div className="activity-header">
                      <div className="activity-cell">Patient</div>
                      <div className="activity-cell">Last Activity</div>
                      <div className="activity-cell">Status</div>
                      <div className="activity-cell">Action</div>
                    </div>
                    {filteredPatients.slice(0, 5).map((patient) => (
                      <div key={patient.id} className="activity-row">
                        <div className="activity-cell">
                          <div className="patient-cell">
                            <img
                              src={
                                patient.avatar ||
                                "https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
                              }
                              alt={patient.name}
                              className="patient-avatar"
                            />
                            <span>{patient.name}</span>
                          </div>
                        </div>
                        <div className="activity-cell">
                          {new Date().toLocaleDateString()}
                        </div>
                        <div className="activity-cell">
                          <span className="status-pill active">Active</span>
                        </div>
                        <div className="activity-cell">
                          <button
                            className="view-button"
                            onClick={() => handlePatientSelect(patient.id)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-activity">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h4>No patients assigned yet</h4>
                    <p>
                      When patients are assigned to you, they will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="quick-tips">
              <h3>Quick Tips</h3>
              <div className="tips-container">
                <div className="tip-card">
                  <div className="tip-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </div>
                  <div className="tip-content">
                    <h4>Patient Notes</h4>
                    <p>
                      Add detailed notes for each patient to track their
                      progress over time.
                    </p>
                  </div>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div className="tip-content">
                    <h4>Appointment Management</h4>
                    <p>
                      Respond to appointment requests promptly to provide better
                      care.
                    </p>
                  </div>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <div className="tip-content">
                    <h4>Patient Analytics</h4>
                    <p>
                      Review patient data regularly to identify patterns and
                      improve treatment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPatientId && (
          <>
            <div className="back-to-dashboard">
              <button
                className="back-button"
                onClick={() => setSelectedPatientId("")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Dashboard
              </button>
            </div>
            <PatientDetailCard
              patient={
                apiPatients.find((p) => p.id === selectedPatientId) || null
              }
            />

            <div className="stats-grid">
              {patientStats.map((stat, index) => (
                <div
                  key={index}
                  className="stat-card"
                  onClick={
                    stat.label === "Patient logs"
                      ? handlePatientLogsClick
                      : undefined
                  }
                  style={{
                    cursor:
                      stat.label === "Patient logs" ? "pointer" : "default",
                  }}
                >
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-sublabel">{stat.sub}</div>
                  <span className="stat-status">{stat.status}</span>
                </div>
              ))}
            </div>

            {/* Use memoized chart component */}
            <AnxietyChart chartData={chartData} chartOptions={chartOptions} />

            {/* Use memoized notes component */}
            <PatientNotes
              selectedPatient={
                apiPatients.find((p) => p.id === selectedPatientId) || null
              }
              filteredNotes={filteredNotes}
              searchNotes={searchNotes}
              setSearchNotes={setSearchNotes}
              showNotesForm={showNotesForm}
              setShowNotesForm={setShowNotesForm}
              newNote={newNote}
              setNewNote={setNewNote}
              editingNote={editingNote}
              setEditingNote={setEditingNote}
              handleAddNote={handleAddNote}
              handleUpdateNote={handleUpdateNote}
              handleDeleteNote={handleDeleteNote}
              initialNoteState={initialNoteState}
            />

            {/* Patient Logs Modal */}
            {showPatientLogs && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <div className="modal-title">
                      <h2>Patient Activity Logs</h2>
                      <p className="modal-subtitle">
                        Daily mood and symptom tracking for{" "}
                        {
                          apiPatients.find((p) => p.id === selectedPatientId)
                            ?.name
                        }
                      </p>
                    </div>
                    <button
                      className="close-button"
                      onClick={handleClosePatientLogs}
                    >
                      ×
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="logs-container">
                      {console.log("Rendering modal with moodLogs:", moodLogs)}
                      {moodLogs && moodLogs.length > 0 ? (
                        moodLogs.map((log) => {
                          console.log("Rendering log:", log);

                          // Safely access properties with checks
                          const mood = log.mood || "Neutral";
                          const stressLevel = log.stress_level || "Low";
                          const symptoms = Array.isArray(log.symptoms)
                            ? log.symptoms
                            : ["None"];
                          const notes = log.notes || "";
                          console.log("Log date format:", log.log_date);

                          return (
                            <div key={log.id} className="log-entry">
                              <div className="log-date">
                                <div className="date-circle">
                                  {log.log_date
                                    ? formatDisplayDate(log.log_date).split(
                                        " "
                                      )[0]
                                    : formatDisplayDate(log.date || "").split(
                                        " "
                                      )[0]}
                                </div>
                                <div className="full-date">
                                  {log.log_date
                                    ? formatDisplayDate(log.log_date)
                                    : formatDisplayDate(log.date || "")}
                                </div>
                              </div>
                              <div className="log-details">
                                <div className="log-row">
                                  <div className="log-item">
                                    <span className="log-label">Mood</span>
                                    <span
                                      className={`mood-badge ${mood.toLowerCase()}`}
                                    >
                                      {mood}
                                    </span>
                                  </div>
                                  <div className="log-item">
                                    <span className="log-label">
                                      Stress Level
                                    </span>
                                    <span
                                      className={`stress-badge ${stressLevel.toLowerCase()}`}
                                    >
                                      {stressLevel}
                                      {log.stress_level_value && (
                                        <span className="stress-value">
                                          {" "}
                                          ({log.stress_level_value})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="log-item symptoms-section">
                                  <span className="log-label">Symptoms</span>
                                  <div className="symptoms-container">
                                    {symptoms.length > 0 ? (
                                      symptoms.map((symptom, index) => (
                                        <span
                                          key={index}
                                          className={`symptom-tag ${
                                            symptom === "None"
                                              ? "no-symptoms"
                                              : ""
                                          }`}
                                        >
                                          {symptom}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="symptom-tag no-symptoms">
                                        None recorded
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {notes && (
                                  <div className="log-item notes-section">
                                    <span className="log-label">Notes</span>
                                    <div className="notes-content">{notes}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="empty-logs">
                          <p>No mood logs found for this patient.</p>
                          <p className="help-text">
                            {moodLogs === undefined
                              ? "Logs data is undefined. There might be a data loading issue."
                              : "The patient hasn't recorded any mood logs yet."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showSettings && (
          <SettingsPanel
            showSettings={showSettings}
            closeSettings={() => setShowSettings(false)}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            user={currentUser}
          />
        )}

        {showAddDoctor && (
          <AddDoctorModal
            show={showAddDoctor}
            onClose={() => setShowAddDoctor(false)}
            onSave={handleAddDoctor}
          />
        )}

        {/* Psychologist Profile Modal */}
        {showProfile && (
          <PsychologistProfile
            user={currentUser}
            onClose={() => setShowProfile(false)}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
