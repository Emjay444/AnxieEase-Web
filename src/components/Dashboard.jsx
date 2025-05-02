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
    urgency: "medium"
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
    urgency: "high"
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
    notes: "Confirmed appointment. Will review medication effectiveness."
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
    notes: "Suggested earlier appointment on May 10th instead."
  }
];

// Sample clinician notes for patients
const patientNotes = {
  "p1": [
    {
      id: "note1",
      date: "2024-05-15",
      title: "Initial Assessment",
      content: "Patient displays symptoms consistent with Generalized Anxiety Disorder. Exhibits worry across multiple domains including work, health, and relationships. Physical symptoms include tension, fatigue, and sleep disturbance.",
      tags: ["assessment", "GAD", "symptoms"]
    },
    {
      id: "note2",
      date: "2024-05-01",
      title: "Medication Review",
      content: "Sertraline seems to be effective in reducing overall anxiety levels. Patient reported minor side effects (mild nausea in the mornings) but these are diminishing. Buspirone added to regimen to address breakthrough anxiety.",
      tags: ["medication", "side effects", "sertraline", "buspirone"]
    }
  ],
  "p2": [
    {
      id: "note3",
      date: "2024-05-10",
      title: "Panic Attack Frequency",
      content: "Patient reports reduction in panic attack frequency (from 3-4 per week to 1-2). Still experiencing anticipatory anxiety about future attacks. Discussed breathing techniques and cognitive restructuring to address catastrophic thinking.",
      tags: ["panic attacks", "CBT", "breathing techniques"]
    }
  ]
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

// Create a memoized patient notes component
const PatientNotes = memo(({ 
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
  handleDeleteNote
}) => {
  return (
    <div className="patient-notes-section">
      <div className="section-header patient-notes-header">
        <h2>Patient Notes</h2>
        <button 
          className="primary-button"
          onClick={() => setShowNotesForm(!showNotesForm)}
        >
          {showNotesForm ? 'Hide Form' : '+ Add New Note'}
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
                onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                className="note-title-input"
              />
              <textarea
                placeholder="Note content..."
                value={editingNote.content}
                onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                rows="6"
                className="note-content-input"
              ></textarea>
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={typeof editingNote.tags === 'string' ? editingNote.tags : editingNote.tags.join(', ')}
                onChange={(e) => setEditingNote({...editingNote, tags: e.target.value})}
                className="note-tags-input"
              />
              <div className="note-actions">
                <button className="cancel-button" onClick={() => setEditingNote(null)}>
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
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                className="note-title-input"
              />
              <textarea
                placeholder="Note content..."
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                rows="6"
                className="note-content-input"
              ></textarea>
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={newNote.tags}
                onChange={(e) => setNewNote({...newNote, tags: e.target.value})}
                className="note-tags-input"
              />
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
                <p>{note.content}</p>
              </div>
              {note.tags && note.tags.length > 0 && (
                <div className="note-tags">
                  {note.tags.map((tag, index) => (
                    <span key={index} className="note-tag">{tag}</span>
                  ))}
                </div>
              )}
              <div className="note-actions">
                <button
                  className="edit-button"
                  onClick={() => {
                    setEditingNote({...note});
                    setShowNotesForm(true);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
});

// Settings panel component
const SettingsPanel = memo(({ 
  showSettings, 
  closeSettings, 
  darkMode, 
  toggleDarkMode, 
  user 
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: user?.phone || '(555) 123-4567',
    specialization: user?.specialization || 'Clinical Psychology',
    licenseNumber: user?.licenseNumber || 'PSY12345'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [formSuccess, setFormSuccess] = useState('');

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormSuccess('');
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormSuccess('');
  };

  const validateForm = () => {
    const errors = {};
    if (!profileData.name.trim()) errors.name = 'Name is required';
    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Only validate password fields if any of them are filled
    if (passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword) {
      if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
      if (!passwordData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (passwordData.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
      }
      if (!passwordData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (passwordData.newPassword !== passwordData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // In a real app, make API call to update profile and password if changed
      console.log('Profile updated:', profileData);
      if (passwordData.currentPassword) {
        console.log('Password updated');
      }
      setFormSuccess('Profile updated successfully!');
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
        </div>

        <div className="settings-content">
          {formSuccess && (
            <div className="success-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {formSuccess}
            </div>
          )}

          {activeTab === 'profile' && (
            <form className="settings-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3 className="section-title">Personal Information</h3>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className={formErrors.name ? 'error' : ''}
                  />
                  {formErrors.name && <div className="field-error">{formErrors.name}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className={formErrors.email ? 'error' : ''}
                  />
                  {formErrors.email && <div className="field-error">{formErrors.email}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="specialization">Specialization</label>
                  <input 
                    type="text" 
                    id="specialization" 
                    value={profileData.specialization}
                    onChange={(e) => handleProfileChange('specialization', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="license">License Number</label>
                  <input 
                    type="text" 
                    id="license" 
                    value={profileData.licenseNumber}
                    onChange={(e) => handleProfileChange('licenseNumber', e.target.value)}
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
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={formErrors.currentPassword ? 'error' : ''}
                  />
                  {formErrors.currentPassword && <div className="field-error">{formErrors.currentPassword}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input 
                    type="password" 
                    id="newPassword" 
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={formErrors.newPassword ? 'error' : ''}
                  />
                  {formErrors.newPassword && <div className="field-error">{formErrors.newPassword}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={formErrors.confirmPassword ? 'error' : ''}
                  />
                  {formErrors.confirmPassword && <div className="field-error">{formErrors.confirmPassword}</div>}
                </div>
              </div>
              
              <button type="submit" className="primary-button">
                Save Changes
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
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
});

// Add this mock data for existing doctors (for duplicate checking)
const existingDoctors = [
  {
    id: "D001",
    email: "john.smith@anxiease.com",
    name: "Dr. John Smith",
    contact: "(555) 123-4567",
    dateRegistered: "2024-03-01",
    profilePicture: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
  }
];

// Add Doctor Modal Component
const AddDoctorModal = memo(({ show, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    email: '',
    contact: '',
    profilePicture: null,
    dateRegistered: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    // Reset form when modal is opened
    if (show) {
      setFormData({
        name: '',
        idNumber: '',
        email: '',
        contact: '',
        profilePicture: null,
        dateRegistered: new Date().toISOString().split('T')[0]
      });
      setErrors({});
      setPreviewUrl('');
    }
  }, [show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          profilePicture: 'File size should not exceed 5MB'
        }));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          profilePicture: 'Please upload an image file'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      setErrors(prev => ({
        ...prev,
        profilePicture: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required';
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID Number is required';
    } else if (existingDoctors.some(doc => doc.id === formData.idNumber)) {
      newErrors.idNumber = 'ID number is already registered';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (existingDoctors.some(doc => doc.email === formData.email)) {
      newErrors.email = 'Email already exists';
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact Number is required';
    }

    if (!formData.profilePicture && !previewUrl) {
      newErrors.profilePicture = 'Profile Picture is required';
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
      <div className="modal-content add-doctor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Doctor</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="add-doctor-form">
            <div className="form-section">
              <div className="profile-picture-upload">
                <div className="preview-container">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile preview" className="profile-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  {errors.profilePicture && <div className="field-error">{errors.profilePicture}</div>}
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
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <div className="field-error">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="idNumber">ID Number</label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className={errors.idNumber ? 'error' : ''}
                />
                {errors.idNumber && <div className="field-error">{errors.idNumber}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="contact">Contact Number</label>
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className={errors.contact ? 'error' : ''}
                />
                {errors.contact && <div className="field-error">{errors.contact}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="dateRegistered">Date Registered</label>
                <input
                  type="date"
                  id="dateRegistered"
                  name="dateRegistered"
                  value={formData.dateRegistered}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
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

  const [showAppointments, setShowAppointments] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseNote, setResponseNote] = useState("");
  const [appointmentList, setAppointmentList] = useState(appointmentRequests);
  const [activeTab, setActiveTab] = useState("all");

  const [showNotesForm, setShowNotesForm] = useState(false);
  const [currentNotes, setCurrentNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [searchNotes, setSearchNotes] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [doctors, setDoctors] = useState(existingDoctors);

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

  // Load notes for selected patient
  React.useEffect(() => {
    if (selectedPatientId) {
      setCurrentNotes(patientNotes[selectedPatientId] || []);
    }
  }, [selectedPatientId]);

  // Apply dark mode when it changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

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

  // Memoized chart data and options to prevent recalculations
  const chartData = useMemo(() => ({
    labels: getDatesForCurrentMonth(),
    datasets: [
      {
        label: "Anxiety Attacks",
        data: generateRandomData(30, 0, 3),
        borderColor: "#3cba92",
        backgroundColor: "rgba(60, 186, 146, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  }), []);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Remove animations to prevent layout shifts
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5
      }
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
          maxTicksLimit: 10
        }
      }
    },
  }), []);

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
    return Array.from({ length: count }, () => 
      Math.floor(Math.random() * (max - min + 1)) + min
    );
  }

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

  // Filter appointments based on status
  const filteredAppointments = appointmentList.filter(req => {
    if (activeTab === "all") return true;
    return req.status === activeTab;
  });

  // Handle appointment response (approve/decline)
  const handleAppointmentResponse = (requestId, status) => {
    if (!responseNote.trim() && status === "declined") {
      alert("Please provide a note explaining why the appointment was declined");
      return;
    }

    setAppointmentList(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status, notes: responseNote || undefined } 
          : req
      )
    );
    
    setResponseNote("");
    setSelectedRequest(null);
  };

  // Handle creating a new note
  const handleAddNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      alert("Please provide both a title and content for the note");
      return;
    }

    const note = {
      id: `note${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags ? newNote.tags.split(',').map(tag => tag.trim()) : []
    };

    // In a real app, you would save this to the backend
    setCurrentNotes(prev => [note, ...prev]);
    setNewNote({ title: "", content: "", tags: "" });
    setEditingNote(null);
  };

  // Handle updating an existing note
  const handleUpdateNote = () => {
    if (!editingNote.title.trim() || !editingNote.content.trim()) {
      alert("Please provide both a title and content for the note");
      return;
    }

    // Process tags if they're a string
    if (typeof editingNote.tags === 'string') {
      editingNote.tags = editingNote.tags.split(',').map(tag => tag.trim());
    }

    // In a real app, you would save this to the backend
    setCurrentNotes(prev => 
      prev.map(note => 
        note.id === editingNote.id 
          ? { ...editingNote, date: new Date().toISOString().split('T')[0] } 
          : note
      )
    );
    setEditingNote(null);
  };

  // Handle deleting a note
  const handleDeleteNote = (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      // In a real app, you would delete this from the backend
      setCurrentNotes(prev => prev.filter(note => note.id !== noteId));
    }
  };

  // Filter notes based on search
  const filteredNotes = searchNotes.trim() 
    ? currentNotes.filter(note => 
        note.title.toLowerCase().includes(searchNotes.toLowerCase()) || 
        note.content.toLowerCase().includes(searchNotes.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchNotes.toLowerCase()))
      )
    : currentNotes;

  // Add these handlers right after the other handlers
  const handlePatientLogsClick = () => {
    setShowPatientLogs(true);
  };

  const handleAppointmentsClick = () => {
    setShowAppointments(true);
  };

  const handleCloseAppointments = () => {
    setShowAppointments(false);
    setSelectedRequest(null);
    setResponseNote("");
  };

  const handleClosePatientLogs = () => {
    setShowPatientLogs(false);
  };

  const handleAddDoctor = (doctorData) => {
    // In a real app, you would make an API call here
    const newDoctor = {
      ...doctorData,
      id: doctorData.idNumber,
      profilePicture: URL.createObjectURL(doctorData.profilePicture)
    };
    setDoctors(prev => [...prev, newDoctor]);
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
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="app-logo">
          <h1>
            <span className="text-gradient">Anxie</span>Ease
          </h1>
        </div>
        
        <div className="patient-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
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
            {patients.length} Patients
          </div>
          
          {patients.map((patient) => (
            <div
              key={patient.id}
              className={`patient-item ${selectedPatientId === patient.id ? 'active' : ''}`}
              onClick={() => setSelectedPatientId(patient.id)}
            >
              <img src={patient.avatar} alt={patient.name} />
              <div className="patient-info">
                <div className="patient-name">{patient.name}</div>
                <div className="patient-id">ID: {patient.id}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-actions">
          <button 
            className="action-button"
            onClick={handleAppointmentsClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Appointment Requests
            {appointmentList.filter(req => req.status === "pending").length > 0 && (
              <span className="badge">{appointmentList.filter(req => req.status === "pending").length}</span>
            )}
          </button>

          <button 
            className="action-button settings-button"
            onClick={() => setShowSettings(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </button>
        </div>
        
        <LogoutButton />
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Add Doctor Button - Place it at the top of the main content */}
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <button 
            className="add-doctor-button"
            onClick={() => setShowAddDoctor(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Doctor
          </button>
        </div>

        {showAppointments && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Appointment Requests</h2>
                <button className="close-button" onClick={handleCloseAppointments}>×</button>
              </div>
              <div className="modal-body">
                <div className="tab-navigation">
                  <button 
                    className={`tab-button ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveTab("all")}
                  >
                    All
                  </button>
                  <button 
                    className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
                    onClick={() => setActiveTab("pending")}
                  >
                    Pending
                    {appointmentList.filter(req => req.status === "pending").length > 0 && (
                      <span className="badge">{appointmentList.filter(req => req.status === "pending").length}</span>
                    )}
                  </button>
                  <button 
                    className={`tab-button ${activeTab === "approved" ? "active" : ""}`}
                    onClick={() => setActiveTab("approved")}
                  >
                    Approved
                  </button>
                  <button 
                    className={`tab-button ${activeTab === "declined" ? "active" : ""}`}
                    onClick={() => setActiveTab("declined")}
                  >
                    Declined
                  </button>
                </div>

                {selectedRequest ? (
                  <div className="request-detail-card">
                    <div className="card-header">
                      <h3>Appointment Details</h3>
                      <button className="close-button" onClick={() => setSelectedRequest(null)}>×</button>
                    </div>
                    <div className="request-info">
                      <div className="info-row">
                        <div className="info-label">Patient Name</div>
                        <div className="info-value">{selectedRequest.patientName}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Requested Date</div>
                        <div className="info-value">{selectedRequest.requestedDate}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Requested Time</div>
                        <div className="info-value">{selectedRequest.requestedTime}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Status</div>
                        <div className="info-value">
                          <span className={`status-badge ${selectedRequest.status}`}>
                            {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Reason</div>
                        <div className="info-value">
                          <div className="reason-text">{selectedRequest.reason}</div>
                        </div>
                      </div>
                      {selectedRequest.notes && (
                        <div className="info-row">
                          <div className="info-label">Notes</div>
                          <div className="info-value">
                            <div className="notes-text">{selectedRequest.notes}</div>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === "pending" && (
                        <div className="response-section">
                          <label htmlFor="responseNote">Response Note (Required for declining)</label>
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
                              onClick={() => handleAppointmentResponse(selectedRequest.id, "declined")}
                            >
                              Decline Request
                            </button>
                            <button 
                              className="approve-button"
                              onClick={() => handleAppointmentResponse(selectedRequest.id, "approved")}
                            >
                              Approve Request
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="appointment-list">
                    {filteredAppointments.map((request) => (
                      <div 
                        key={request.id} 
                        className={`appointment-request-card ${request.status}`}
                        onClick={() => setSelectedRequest(request)}
                      >
                        <div className="request-header">
                          <h3>{request.patientName}</h3>
                          <span className={`status-badge ${request.status}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <div className="request-details">
                          <p><strong>Date:</strong> {request.requestedDate}</p>
                          <p><strong>Time:</strong> {request.requestedTime}</p>
                          <p><strong>Reason:</strong> {request.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedPatient ? (
          <div className="no-selection">
            <p>Select a patient to view their details</p>
          </div>
        ) : (
          <>
            <div className="patient-detail-card">
                  <div className="patient-detail-header">
                    <img
                      src={selectedPatient.avatar}
                      alt={selectedPatient.name}
                    />
                    <div>
                      <div className="patient-name">{selectedPatient.name}</div>
                      <div className="patient-id">Patient ID: {selectedPatient.id}</div>
                          </div>
                      </div>
                  
                  <div className="patient-info-grid">
                    <div className="info-item">
                      <div className="label">Age</div>
                      <div className="value">{selectedPatient.age} years</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="label">Gender</div>
                      <div className="value">{selectedPatient.gender}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="label">Emergency Contact</div>
                      <div className="value">
                        {selectedPatient.emergencyContact.name}
                        <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                          {selectedPatient.emergencyContact.relationship}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                          {selectedPatient.emergencyContact.phone}
                        </div>
                      </div>
                    </div>
                  </div>
            </div>

            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="stat-card"
                  onClick={stat.label === "Patient logs" ? handlePatientLogsClick : undefined}
                  style={{ cursor: stat.label === "Patient logs" ? "pointer" : "default" }}
                >
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-sublabel">{stat.sub}</div>
                  <span className="stat-status">{stat.status}</span>
                </div>
              ))}
            </div>

            {/* Use memoized chart component */}
            <AnxietyChart 
              chartData={chartData} 
              chartOptions={chartOptions} 
            />

            {/* Use memoized notes component */}
            <PatientNotes
              selectedPatient={selectedPatient}
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
            />

            {/* Patient Logs Modal */}
            {showPatientLogs && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <div className="modal-title">
                      <h2>Patient Activity Logs</h2>
                      <p className="modal-subtitle">Daily mood and symptom tracking for {selectedPatient.name}</p>
                    </div>
                    <button className="close-button" onClick={handleClosePatientLogs}>×</button>
                  </div>
                  <div className="modal-body">
                    <div className="logs-container">
                      {Array.from(moodLogsData.entries()).map(([date, log]) => (
                        <div key={date} className="log-entry">
                          <div className="log-date">
                            <div className="date-circle">
                              {formatDisplayDate(date).split(' ')[0]}
                            </div>
                            <div className="full-date">
                              {formatDisplayDate(date)}
                            </div>
                          </div>
                          <div className="log-details">
                            <div className="log-row">
                              <div className="log-item">
                                <span className="log-label">Mood</span>
                                <span className={`mood-badge ${log.mood.toLowerCase()}`}>
                                  {log.mood}
                                </span>
                              </div>
                              <div className="log-item">
                                <span className="log-label">Stress Level</span>
                                <span className={`stress-badge ${log.stressLevel.toLowerCase()}`}>
                                  {log.stressLevel}
                                </span>
                              </div>
                            </div>
                            <div className="log-item symptoms-section">
                              <span className="log-label">Symptoms</span>
                              <div className="symptoms-container">
                                {log.symptoms.map((symptom, index) => (
                                  <span key={index} className={`symptom-tag ${symptom === 'None' ? 'no-symptoms' : ''}`}>
                                    {symptom}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
            user={user}
          />
        )}

        {showAddDoctor && (
          <AddDoctorModal
            show={showAddDoctor}
            onClose={() => setShowAddDoctor(false)}
            onSave={handleAddDoctor}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
