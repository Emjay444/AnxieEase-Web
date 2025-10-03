import React, { useState, useEffect, useCallback, useRef } from "react";
import SuccessModal from "./SuccessModal";
import {
  Users,
  Calendar,
  Clock,
  ChevronRight,
  Search,
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
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { psychologistService } from "../services/psychologistService";
import { appointmentService } from "../services/appointmentService";
import { supabase } from "../services/supabaseClient";
import ProfilePicture from "./ProfilePicture";
import LogoutButton from "./LogoutButton";

// Top-level, memoized Profile modal to avoid remounts on parent re-render
const ProfileModal = React.memo(
  ({
    isOpen,
    onClose,
    profileForm,
    user,
    handleProfilePictureChange,
    handleProfileFormChange,
    handleProfileUpdate,
    profileUpdateLoading,
    setShowChangePasswordModal,
  }) => {
    if (!isOpen) return null;
    const fileInputRef = useRef(null);

    return (
      <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-32 w-32 rounded-full overflow-hidden border bg-emerald-50 flex items-center justify-center"
                  title="Change profile picture"
                >
                  {profileForm.avatar_url ? (
                    <img
                      src={profileForm.avatar_url}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-emerald-600 font-medium text-4xl">
                      {profileForm.first_name?.charAt(0) ||
                        user?.name?.charAt(0) ||
                        "D"}
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 bg-emerald-500 text-white p-2 rounded-full shadow group-hover:scale-105 transition-transform">
                    <Camera className="h-4 w-4" />
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
              <div className="text-center">
                <h4 className="font-medium text-gray-900">Profile Picture</h4>
                <p className="text-sm text-gray-600">
                  Click the camera icon to upload a new photo
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) => {
                    // Only allow letters, spaces, and common name characters
                    const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, "");
                    handleProfileFormChange("first_name", value);
                  }}
                  onKeyPress={(e) => {
                    // Prevent numbers and special characters from being typed
                    if (
                      !/[a-zA-Z\s'-]/.test(e.key) &&
                      e.key !== "Backspace" &&
                      e.key !== "Delete" &&
                      e.key !== "Tab" &&
                      e.key !== "Enter"
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your first name (letters only, min 2 chars)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileForm.last_name}
                  onChange={(e) => {
                    // Only allow letters, spaces, and common name characters
                    const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, "");
                    handleProfileFormChange("last_name", value);
                  }}
                  onKeyPress={(e) => {
                    // Prevent numbers and special characters from being typed
                    if (
                      !/[a-zA-Z\s'-]/.test(e.key) &&
                      e.key !== "Backspace" &&
                      e.key !== "Delete" &&
                      e.key !== "Tab" &&
                      e.key !== "Enter"
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your last name (letters only, min 2 chars)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name (Optional)
                </label>
                <input
                  type="text"
                  value={profileForm.middle_name}
                  onChange={(e) => {
                    // Only allow letters, spaces, and common name characters
                    const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, "");
                    handleProfileFormChange("middle_name", value);
                  }}
                  onKeyPress={(e) => {
                    // Prevent numbers and special characters from being typed
                    if (
                      !/[a-zA-Z\s'-]/.test(e.key) &&
                      e.key !== "Backspace" &&
                      e.key !== "Delete" &&
                      e.key !== "Tab" &&
                      e.key !== "Enter"
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your middle name (letters only, optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => {
                    // Only allow numbers and limit to 11 characters
                    const value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 11);
                    handleProfileFormChange("phone", value);
                  }}
                  onKeyPress={(e) => {
                    // Prevent non-numeric characters from being typed
                    if (
                      !/[0-9]/.test(e.key) &&
                      e.key !== "Backspace" &&
                      e.key !== "Delete" &&
                      e.key !== "Tab" &&
                      e.key !== "Enter"
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="09123456789"
                  maxLength="11"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {profileForm.phone.length}/11 characters (numbers only)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={profileForm.sex}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* License Number - Full Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profileForm.license_number}
                onChange={(e) =>
                  handleProfileFormChange("license_number", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your professional license number"
                required
              />
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

            {/* Password Change Button */}
            <div className="border-t pt-6">
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Lock className="h-4 w-4" />
                <span>Change Password</span>
              </button>
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
  }
);

// Top-level, memoized Profile overview modal to avoid remounts
const ProfileOverview = React.memo(
  ({ isOpen, onClose, profileForm, user, stats, onEdit }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 md:p-7 max-w-xl w-full shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Profile Overview
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="text-center space-y-4">
            {/* Profile Picture */}
            <div className="flex justify-center">
              {profileForm.avatar_url ? (
                <img
                  src={profileForm.avatar_url}
                  alt="Profile"
                  className="h-32 w-32 rounded-full object-cover border"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-medium text-4xl">
                    {profileForm.first_name?.charAt(0) ||
                      user?.name?.charAt(0) ||
                      "D"}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="space-y-3">
              <h4 className="text-xl font-semibold text-gray-900">
                {profileForm.first_name && profileForm.last_name
                  ? `Dr. ${profileForm.first_name} ${
                      profileForm.middle_name
                        ? profileForm.middle_name.charAt(0) + ". "
                        : ""
                    }${profileForm.last_name}`
                  : `Dr. ${user?.email?.split("@")[0] || "Psychologist"}`}
              </h4>
              <p className="text-gray-600">
                {profileForm.email || user?.email}
              </p>

              {/* Professional Info */}
              {profileForm.license_number && (
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-emerald-800">
                    License Number
                  </p>
                  <p className="text-emerald-700">
                    {profileForm.license_number}
                  </p>
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
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    About
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {profileForm.bio}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 pt-2 border-t">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {stats.totalPatients} Patients
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {stats.todayAppointments} Today
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t space-y-3">
              <button
                onClick={onEdit}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Edit Profile Settings</span>
              </button>
              <LogoutButton
                variant="button"
                tone="outline"
                label="Sign Out"
                title="Sign out"
                className="w-full justify-center"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// Change Password Modal Component
const ChangePasswordModal = React.memo(
  ({
    isOpen,
    onClose,
    passwordForm,
    handlePasswordFormChange,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handlePasswordChange,
    passwordUpdateLoading,
  }) => {
    if (!isOpen) return null;

    // Password validation logic
    const validatePassword = (password) => {
      const requirements = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      };
      return requirements;
    };

    const passwordRequirements = validatePassword(passwordForm.newPassword);
    const allRequirementsMet =
      Object.values(passwordRequirements).every(Boolean);
    const passwordsMatch =
      passwordForm.newPassword &&
      passwordForm.confirmPassword &&
      passwordForm.newPassword === passwordForm.confirmPassword;

    // Field validation errors
    const currentPasswordError =
      passwordForm.currentPassword === ""
        ? "Please enter current password"
        : "";
    const newPasswordError =
      passwordForm.newPassword && !allRequirementsMet
        ? "Password must meet all requirements"
        : "";
    const confirmPasswordError =
      passwordForm.confirmPassword && !passwordsMatch
        ? "Passwords do not match"
        : "";

    return (
      <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 md:p-10 max-w-lg w-full shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h3 className="text-xl font-semibold text-gray-900">
                Change Password
              </h3>
            </div>
          </div>

          <div className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    handlePasswordFormChange("currentPassword", e.target.value)
                  }
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    currentPasswordError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {currentPasswordError && (
                <p className="text-red-500 text-sm mt-1">
                  {currentPasswordError}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    handlePasswordFormChange("newPassword", e.target.value)
                  }
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    newPasswordError ? "border-red-500" : "border-gray-300"
                  }`}
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
              {newPasswordError && (
                <p className="text-red-500 text-sm mt-1">{newPasswordError}</p>
              )}
            </div>

            {/* Password Requirements - Always Show */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Password Requirements:
              </h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  {passwordRequirements.minLength ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mr-3">
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
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3"></div>
                  )}
                  <span
                    className={`text-sm ${
                      passwordRequirements.minLength
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    At least 8 characters
                  </span>
                </div>

                <div className="flex items-center">
                  {passwordRequirements.hasUppercase ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mr-3">
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
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3"></div>
                  )}
                  <span
                    className={`text-sm ${
                      passwordRequirements.hasUppercase
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    One uppercase letter (A-Z)
                  </span>
                </div>

                <div className="flex items-center">
                  {passwordRequirements.hasLowercase ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mr-3">
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
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3"></div>
                  )}
                  <span
                    className={`text-sm ${
                      passwordRequirements.hasLowercase
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    One lowercase letter (a-z)
                  </span>
                </div>

                <div className="flex items-center">
                  {passwordRequirements.hasNumber ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mr-3">
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
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3"></div>
                  )}
                  <span
                    className={`text-sm ${
                      passwordRequirements.hasNumber
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    One number (0-9)
                  </span>
                </div>

                <div className="flex items-center">
                  {passwordRequirements.hasSpecialChar ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mr-3">
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
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3"></div>
                  )}
                  <span
                    className={`text-sm ${
                      passwordRequirements.hasSpecialChar
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    One special character (!@#$%^&*)
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    handlePasswordFormChange("confirmPassword", e.target.value)
                  }
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    confirmPasswordError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-red-500 text-sm mt-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-8">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordUpdateLoading}
                className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-emerald-300 flex items-center justify-center font-medium"
              >
                {passwordUpdateLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

import FullCalendar from "./FullCalendar";
import PatientProfileView from "./PatientProfileView";

const DashboardNew = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarReloadKey, setCalendarReloadKey] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileOverview, setShowProfileOverview] = useState(false);
  const [psychologistId, setPsychologistId] = useState(null); // Store psychologist ID
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
    profilePicture: null,
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  // Change Password Modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);

  // Notification modal states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModal, setNotificationModal] = useState({
    type: "success", // success, warning, error
    title: "",
    message: "",
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Load real data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!user?.id) {
          console.log("No user ID found, skipping data load");
          return;
        }

        console.log("=== DASHBOARD DATA LOADING DEBUG ===");
        console.log("Loading dashboard data for auth user:", user.id);
        console.log("User email:", user.email);

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
          .select(
            "id, first_name, middle_name, last_name, email, contact, license_number, sex, avatar_url, bio, specialization, is_active"
          )
          .eq("user_id", user.id)
          .single();

        if (psychError || !psychologist) {
          console.error("❌ Error fetching psychologist:", psychError);
          console.log("❌ No psychologist found for user_id:", user.id);

          // Try to find by email as fallback
          const psychByEmail = allPsychologists?.find(
            (p) => p.email === user.email && p.is_active
          );
          if (psychByEmail) {
            console.log(
              "🔧 Found psychologist by email instead:",
              psychByEmail
            );
            console.log(
              "⚠️ user_id mismatch! Auth user_id:",
              user.id,
              "vs DB user_id:",
              psychByEmail.user_id
            );

            // Fix the user_id mismatch by updating the psychologist record
            console.log("🔧 Attempting to fix user_id mismatch...");
            const { error: updateError } = await supabase
              .from("psychologists")
              .update({ user_id: user.id })
              .eq("email", user.email)
              .eq("is_active", true);

            if (updateError) {
              console.error(
                "❌ Failed to update psychologist user_id:",
                updateError
              );
            } else {
              console.log(
                "✅ Successfully updated psychologist user_id, reloading..."
              );
              // Recursively call the function to reload with fixed data
              setTimeout(() => loadDashboardData(), 100);
              return;
            }
          }

          setLoading(false);
          return;
        }

        console.log("Found psychologist:", psychologist);
        console.log("Psychologist first_name:", psychologist.first_name);
        console.log("Psychologist last_name:", psychologist.last_name);
        // Legacy `name` may be present during transition; prefer split fields
        console.log("Psychologist gender (sex) value:", psychologist.sex);

        // Use the psychologist's ID to load their data
        const psychologistId = psychologist.id;
        setPsychologistId(psychologistId); // Store for later use

        // Load patients assigned to this psychologist
        const patientsData = await psychologistService.getPsychologistPatients(
          psychologistId
        );
        console.log("Loaded patients:", patientsData);
        console.log(
          "Patient avatar URLs:",
          patientsData.map((p) => ({
            name:
              [p.first_name, p.middle_name, p.last_name]
                .filter(Boolean)
                .join(" ") || p.name,
            avatar_url: p.avatar_url,
          }))
        );
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
        const updatedProfileForm = {
          first_name: psychologist.first_name || "",
          middle_name: psychologist.middle_name || "",
          last_name: psychologist.last_name || "",
          email: psychologist.email || "",
          phone: psychologist.contact || "",
          license_number: psychologist.license_number || "",
          bio: psychologist.bio || "",
          sex: psychologist.sex || "",
          avatar_url: psychologist.avatar_url || "",
          profilePicture: null,
        };
        setProfileForm(updatedProfileForm);

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

  // Initialize profile form when user data is available - REMOVED
  // This was conflicting with the psychologist data loading
  // The main useEffect already populates profileForm with psychologist data

  // Notification helper function
  const showNotification = (type, title, message) => {
    setNotificationModal({ type, title, message });
    setShowNotificationModal(true);
  };

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
    // Validation: Check for required fields
    const requiredFields = [
      { field: "first_name", label: "First Name" },
      { field: "last_name", label: "Last Name" },
      { field: "phone", label: "Phone Number" },
      { field: "license_number", label: "License Number" },
    ];

    const emptyFields = requiredFields.filter(
      ({ field }) => !profileForm[field]?.trim()
    );

    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map(({ label }) => label).join(", ");
      showNotification(
        "warning",
        "Required Fields Missing",
        `Please fill in the following required fields: ${fieldNames}`
      );
      return;
    }

    // Name validation (no numbers, minimum 2 letters)
    const nameFields = [
      { field: "first_name", label: "First Name" },
      { field: "last_name", label: "Last Name" },
      { field: "middle_name", label: "Middle Name" },
    ];

    for (const { field, label } of nameFields) {
      const value = profileForm[field]?.trim();

      // Skip validation for middle name if it's empty (optional field)
      if (field === "middle_name" && !value) continue;

      if (value) {
        // Check for numbers in name
        if (/\d/.test(value)) {
          showNotification(
            "warning",
            "Invalid Name Format",
            `${label} cannot contain numbers. Please use only letters.`
          );
          return;
        }

        // Check minimum length (2 letters)
        if (value.length < 2) {
          showNotification(
            "warning",
            "Name Too Short",
            `${label} must be at least 2 characters long.`
          );
          return;
        }
      }
    }

    // Phone validation (should be 11 digits)
    if (profileForm.phone.length !== 11) {
      showNotification(
        "warning",
        "Invalid Phone Number",
        "Phone number must be exactly 11 digits."
      );
      return;
    }

    if (!profileForm.phone.startsWith("09")) {
      showNotification(
        "warning",
        "Invalid Phone Number",
        "Phone number must start with 09."
      );
      return;
    }

    setProfileUpdateLoading(true);
    try {
      console.log("Updating profile:", profileForm);
      console.log("Psychologist ID:", psychologistId);

      if (!psychologistId) {
        throw new Error("Psychologist ID not found");
      }

      // Handle profile picture upload
      let uploadedAvatarUrl = profileForm.avatar_url || null;
      if (profileForm.profilePicture) {
        const file = profileForm.profilePicture;
        const fileExt = file.name.split(".").pop();
        const fileName = `${psychologistId}/${Date.now()}.${fileExt}`;

        console.log("Uploading avatar:", fileName);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, { upsert: true, contentType: file.type });

        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
          throw new Error(`Failed to upload avatar: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(uploadData.path);
        uploadedAvatarUrl = publicUrlData.publicUrl;
        console.log("Avatar uploaded successfully:", uploadedAvatarUrl);
      }

      // Prepare the update data
      const updateData = {
        first_name: profileForm.first_name.trim(),
        middle_name: profileForm.middle_name?.trim() || null,
        last_name: profileForm.last_name.trim(),
        contact: profileForm.phone.trim(),
        license_number: profileForm.license_number.trim(),
        bio: profileForm.bio?.trim() || null,
        avatar_url: uploadedAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      console.log("Update data being sent:", updateData);

      // Update directly with Supabase instead of using the service
      const { data: updatedData, error: updateError } = await supabase
        .from("psychologists")
        .update(updateData)
        .eq("id", psychologistId)
        .select()
        .single();

      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log("Profile updated successfully:", updatedData);

      // Update the local profile form with the returned data
      setProfileForm((prev) => ({
        ...prev,
        first_name: updatedData.first_name || "",
        middle_name: updatedData.middle_name || "",
        last_name: updatedData.last_name || "",
        phone: updatedData.contact || "",
        license_number: updatedData.license_number || "",
        bio: updatedData.bio || "",
        avatar_url: updatedData.avatar_url || prev.avatar_url || "",
        profilePicture: null, // Clear the temporary file
      }));

      setProfileUpdateLoading(false);
      setShowProfileModal(false);
      showNotification(
        "success",
        "Profile Updated",
        "Your profile has been updated successfully!"
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileUpdateLoading(false);
      showNotification(
        "error",
        "Update Failed",
        `Error updating profile: ${error.message}`
      );
    }
  };
  // Handle Password Change
  const handlePasswordChange = async () => {
    setPasswordUpdateLoading(true);
    try {
      // Validate required fields first
      if (!passwordForm.currentPassword) {
        throw new Error("Please enter your current password");
      }
      if (!passwordForm.newPassword) {
        throw new Error("Please enter a new password");
      }
      if (!passwordForm.confirmPassword) {
        throw new Error("Please confirm your new password");
      }

      // Check if passwords match
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error("New passwords do not match");
      }

      // Enhanced password validation with specific error messages
      if (passwordForm.newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }
      if (!/[A-Z]/.test(passwordForm.newPassword)) {
        throw new Error(
          "Password must contain at least one uppercase letter (A-Z)"
        );
      }
      if (!/[a-z]/.test(passwordForm.newPassword)) {
        throw new Error(
          "Password must contain at least one lowercase letter (a-z)"
        );
      }
      if (!/[0-9]/.test(passwordForm.newPassword)) {
        throw new Error("Password must contain at least one number (0-9)");
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword)) {
        throw new Error(
          "Password must contain at least one special character (!@#$%^&*)"
        );
      }

      // Verify current password by attempting to sign in
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: profileForm.email,
          password: passwordForm.currentPassword,
        });
        if (signInError) {
          throw new Error("Current password is incorrect");
        }
      } catch (error) {
        throw new Error("Current password is incorrect");
      }

      // Update the password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (passwordError) {
        throw new Error(`Failed to update password: ${passwordError.message}`);
      }

      // Clear password form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordUpdateLoading(false);
      setShowChangePasswordModal(false);
      showNotification(
        "success",
        "Password Updated",
        "Your password has been updated successfully!"
      );
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordUpdateLoading(false);
      showNotification("error", "Password Update Failed", error.message);
    }
  };

  // Handle password form changes
  const handlePasswordFormChange = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
          <ProfilePicture patient={patient} size={40} className="" />
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

  // Filter patients based on search term
  const filteredPatients = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return patients;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return patients.filter((patient) => {
      const name = (patient.name || patient.full_name || "").toLowerCase();
      const email = (patient.email || "").toLowerCase();

      return name.includes(searchLower) || email.includes(searchLower);
    });
  }, [patients, searchTerm]);

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
                    <h1 className="text-2xl font-bold text-gray-900">
                      Dashboard
                    </h1>
                    <span className="text-sm text-gray-500">
                      Psychologist Portal
                    </span>
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
                          Dr.{" "}
                          {profileForm.last_name
                            ? `${profileForm.last_name}, ${
                                profileForm.first_name
                              }${
                                profileForm.middle_name
                                  ? " " +
                                    profileForm.middle_name.charAt(0) +
                                    "."
                                  : ""
                              }`
                            : user?.name || "Psychologist"}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      {profileForm.avatar_url ? (
                        <img
                          src={profileForm.avatar_url}
                          alt="Profile"
                          className="h-12 w-12 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-600 font-medium text-lg">
                            {profileForm.first_name?.charAt(0) ||
                              user?.name?.charAt(0) ||
                              "D"}
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
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-900">
                        My Patients
                      </h2>
                      {searchTerm.trim() ? (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {filteredPatients.length} found
                          </span>
                          <span className="text-xs text-gray-400">of</span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                            {patients.length} total
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {patients.length}{" "}
                          {patients.length === 1 ? "patient" : "patients"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search patients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <PatientCard
                          key={patient.id}
                          patient={patient}
                          onClick={(patient) => {
                            setSelectedPatient(patient);
                            setShowPatientProfile(true);
                          }}
                        />
                      ))
                    ) : searchTerm.trim() ? (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No patients found matching "{searchTerm}"</p>
                        <button
                          onClick={() => setSearchTerm("")}
                          className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm"
                        >
                          Clear search
                        </button>
                      </div>
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
            handleProfileUpdate={handleProfileUpdate}
            profileUpdateLoading={profileUpdateLoading}
            setShowChangePasswordModal={setShowChangePasswordModal}
          />

          {/* Change Password Modal */}
          <ChangePasswordModal
            isOpen={showChangePasswordModal}
            onClose={() => setShowChangePasswordModal(false)}
            passwordForm={passwordForm}
            handlePasswordFormChange={handlePasswordFormChange}
            showCurrentPassword={showCurrentPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            handlePasswordChange={handlePasswordChange}
            passwordUpdateLoading={passwordUpdateLoading}
          />

          {/* Success/Error Notification Modal */}
          <SuccessModal
            isOpen={showNotificationModal}
            onClose={() => setShowNotificationModal(false)}
            type={notificationModal.type}
            title={notificationModal.title}
            message={notificationModal.message}
          />

          {/* Profile Overview Modal */}
          <ProfileOverview
            isOpen={showProfileOverview}
            onClose={() => setShowProfileOverview(false)}
            profileForm={profileForm}
            user={user}
            stats={stats}
            onEdit={() => {
              setShowProfileOverview(false);
              setShowProfileModal(true);
            }}
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
                    <ProfilePicture
                      patient={selectedPatient}
                      size={100}
                      className=""
                    />
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
