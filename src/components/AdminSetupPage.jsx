import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminSetupService } from "../services/adminSetupService";
import { adminService } from "../services/adminService";
import { supabase } from "../services/supabaseClient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
  X,
  Shield,
} from "lucide-react";

const AdminSetupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  // Auto-redirect after success
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, navigate]);

  useEffect(() => {
    const initializeSetup = async () => {
      try {
        console.log("🔧 Initializing admin setup...");
        console.log("🔗 Current URL:", window.location.href);
        console.log("🔑 URL Hash:", window.location.hash);

        // Mark that we're in the setup flow
        try {
          localStorage.setItem("isInAdminSetupFlow", "true");
        } catch (_) {}

        // Get email from URL parameters
        const urlParams = new URLSearchParams(location.search);
        const emailFromUrl = urlParams.get("email");

        // Handle magic link auth callback
        let authCallbackData = null;
        let callbackError = null;

        if (
          window.location.hash &&
          window.location.hash.includes("access_token")
        ) {
          console.log("🔐 Processing magic link callback from URL hash...");

          // Parse the hash parameters
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            // Set the session using the parsed tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            authCallbackData = data;
            callbackError = error;
            console.log("🔐 Magic link callback result:", { data, error });
          }
        } else {
          // Check for existing session
          console.log("🔍 Checking for existing session...");
          const { data, error } = await supabase.auth.getSession();
          authCallbackData = data;
          callbackError = error;
        }

        if (callbackError) {
          console.error("❌ Auth callback error:", callbackError);
          setErrors({
            general: "Authentication failed. Please try the setup link again.",
          });
          setLoading(false);
          return;
        }

        const session = authCallbackData?.session;
        if (!session) {
          console.log("❌ No session found");
          setErrors({
            general:
              "No valid session found. Please use the setup link from your email.",
          });
          setLoading(false);
          return;
        }

        console.log("✅ Session found:", session.user.email);
        setSessionData(session);

        // Use email from session or URL
        const email = session.user.email || emailFromUrl;
        if (!email) {
          setErrors({
            general:
              "No email found. Please use the setup link from your email.",
          });
          setLoading(false);
          return;
        }

        // Check if this is a valid admin invitation by looking at user metadata
        console.log("🔍 Checking admin invitation for:", email);
        console.log("📋 User metadata:", session.user.user_metadata);
        console.log("🔑 Role:", session.user.user_metadata?.role);
        console.log(
          "⏳ Invitation pending:",
          session.user.user_metadata?.invitation_pending
        );

        if (
          session.user.user_metadata?.invitation_pending &&
          session.user.user_metadata?.role === "admin"
        ) {
          console.log("✅ Valid admin invitation found");
          setAdminProfile({
            email: email,
            full_name: session.user.user_metadata?.full_name,
          });
        } else {
          console.log("❌ Invalid invitation - metadata check failed");
          setErrors({
            general:
              "Invalid admin invitation. Please contact the main administrator.",
          });
          setLoading(false);
          return;
        }
        setFormData((prev) => ({ ...prev, email }));
        setLoading(false);
      } catch (error) {
        console.error("❌ Setup initialization error:", error);
        setErrors({
          general: "Setup failed. Please try the setup link again.",
        });
        setLoading(false);
      }
    };

    initializeSetup();

    // Cleanup
    return () => {
      try {
        localStorage.removeItem("isInAdminSetupFlow");
      } catch (_) {}
    };
  }, [location]);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    return errors;
  };

  const getPasswordRequirements = (password) => {
    return [
      {
        text: "At least 8 characters long",
        met: password.length >= 8,
      },
      {
        text: "One uppercase letter (A-Z)",
        met: /[A-Z]/.test(password),
      },
      {
        text: "One lowercase letter (a-z)",
        met: /[a-z]/.test(password),
      },
      {
        text: "One number (0-9)",
        met: /[0-9]/.test(password),
      },
      {
        text: "One special character (!@#$%^&*)",
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    ];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific field errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form
      const newErrors = {};

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else {
        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
          newErrors.password = passwordErrors[0];
        }
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Complete admin setup
      console.log("🚀 Completing admin setup...");
      const setupResult = await adminSetupService.completeSetup(
        formData.email,
        formData.password,
        sessionData
      );

      // Log the activity
      try {
        await adminService.logActivity(
          setupResult.user?.id,
          "Admin Account Setup Completed",
          `Admin account setup completed for: ${formData.email} (${
            adminProfile?.full_name || "No name"
          })`
        );
      } catch (logError) {
        console.warn(
          "Failed to log admin setup completion activity:",
          logError
        );
      }

      console.log("🎉 Admin setup completed successfully!");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("❌ Setup completion error:", error);
      setErrors({
        general: error.message || "Setup failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !errors.general) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Setting up your admin account...
          </h2>
          <p className="text-gray-600">
            Please wait while we prepare your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Admin Setup
          </h1>
          <p className="text-gray-600">
            Welcome
            {adminProfile?.full_name ? `, ${adminProfile.full_name}` : ""}! Set
            up your admin password to get started.
          </p>
        </div>

        {/* Error Alert */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Setup Error</p>
              <p className="text-red-700 text-sm mt-1">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Form */}
        {!errors.general && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
              <div className="mt-2 text-xs">
                <p className="text-gray-500 mb-2">Password requirements:</p>
                <ul className="ml-2 space-y-1">
                  {getPasswordRequirements(formData.password).map(
                    (req, index) => (
                      <li
                        key={index}
                        className={`flex items-center space-x-2 ${
                          req.met ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            req.met
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {req.met ? "✓" : "○"}
                        </span>
                        <span>{req.text}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Setting up account...
                </div>
              ) : (
                "Complete Admin Setup"
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        {errors.general && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Setup Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Your admin account has been set up successfully. You can now log
              in with your credentials.
            </p>
            <div className="text-sm text-gray-500">
              Redirecting to login page in 3 seconds...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSetupPage;
