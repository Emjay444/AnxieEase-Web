import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { psychologistAuthService } from "../services/psychologistAuthService";
import { psychologistService } from "../services/psychologistService";
import { supabase } from "../services/supabaseClient";
import { Brain } from "lucide-react";

const PsychologistSetupPage = () => {
  const { email, inviteCode } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: email || "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        // If we have URL parameters but no session, try to verify the email
        if (email && inviteCode && !session) {
          // Verify the email first
          const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: inviteCode,
            type: "email",
          });

          if (verifyError) throw verifyError;
        }

        // If we have a session, update the psychologist's user_id
        if (session?.user) {
          try {
            await psychologistService.updatePsychologistUserId(
              session.user.email,
              session.user.id
            );
          } catch (updateError) {
            console.error(
              "Failed to update psychologist user_id:",
              updateError
            );
          }
        }

        // Set the email from params or session
        setFormData((prev) => ({
          ...prev,
          email: email || session?.user?.email || "",
        }));

        setLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setErrors({ general: "Authentication failed. Please try again." });
        setLoading(false);
      }
    };

    initializeAuth();
  }, [email, inviteCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Complete the signup process
      await psychologistAuthService.completeSignup(
        formData.email,
        formData.password,
        inviteCode
      );

      // Success! Redirect to login page
      alert(
        "Account setup complete! You can now log in with your credentials."
      );

      // Sign out any existing session
      await supabase.auth.signOut();

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Setup error:", error);
      setErrors({
        general:
          error.message ||
          "Failed to complete account setup. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="w-full max-w-md glass rounded-2xl shadow-xl border border-white/40 p-8 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 mb-3">
            ⏳
          </div>
          <h2 className="text-gray-800 font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center relative overflow-hidden px-4">
      <div className="blob -top-10 -left-10 w-72 h-72 bg-emerald-200/40 rounded-full"></div>
      <div className="blob -bottom-16 -right-10 w-80 h-80 bg-teal-200/40 rounded-full"></div>
      <div className="w-full max-w-lg glass rounded-2xl shadow-xl border border-white/40 p-8 relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 mb-3">
            <Brain className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Complete Your Account Setup
          </h2>
          <p className="text-gray-600 mt-1">
            Create a password to finish setting up your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
              {errors.general}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                aria-label="Create password"
                className={`w-full px-4 py-2.5 rounded-lg border bg-white/70 focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.password
                    ? "border-red-300 focus:ring-red-300"
                    : "border-gray-300 focus:ring-emerald-300"
                }`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-900"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <div className="mt-2 text-sm text-red-600">{errors.password}</div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              aria-label="Confirm password"
              className={`w-full px-4 py-2.5 rounded-lg border bg-white/70 focus:outline-none focus:ring-2 focus:border-transparent ${
                errors.confirmPassword
                  ? "border-red-300 focus:ring-red-300"
                  : "border-gray-300 focus:ring-emerald-300"
              }`}
            />
            {errors.confirmPassword && (
              <div className="mt-2 text-sm text-red-600">
                {errors.confirmPassword}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-white font-medium shadow-sm btn-gradient hover:opacity-95 active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Setting up..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PsychologistSetupPage;
