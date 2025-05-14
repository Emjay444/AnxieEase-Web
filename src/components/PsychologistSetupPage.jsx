import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { psychologistAuthService } from "../services/psychologistAuthService";
import { psychologistService } from "../services/psychologistService";
import { supabase } from "../services/supabaseClient";

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
      <div className="setup-page-container">
        <div className="setup-card">
          <div className="setup-header">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-page-container">
      <div className="setup-card">
        <div className="setup-header">
          <h2>Complete Your Account Setup</h2>
          <p>Please create a password to complete your account setup</p>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              className="form-control"
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Create Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-control ${
                  errors.password ? "is-invalid" : ""
                }`}
                placeholder="Create a secure password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`form-control ${
                errors.confirmPassword ? "is-invalid" : ""
              }`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <div className="invalid-feedback">{errors.confirmPassword}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block setup-button"
            disabled={loading}
          >
            {loading ? "Setting up..." : "Complete Setup"}
          </button>
        </form>
      </div>

      <style>{`
        .setup-page-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .setup-card {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .setup-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .setup-header h2 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .setup-header p {
          color: #666;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-control {
          height: 48px;
          border-radius: 8px;
          font-size: 1rem;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
        }

        .setup-button {
          height: 48px;
          font-size: 1rem;
          font-weight: 500;
          background-color: #28a745;
          border-color: #28a745;
          width: 100%;
          margin-top: 1rem;
        }

        .setup-button:hover {
          background-color: #218838;
          border-color: #1e7e34;
        }

        .invalid-feedback {
          display: block;
          color: #dc3545;
          margin-top: 0.25rem;
        }

        .alert {
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 8px;
        }

        .alert-danger {
          background-color: #f8d7da;
          border-color: #f5c6cb;
          color: #721c24;
        }
      `}</style>
    </div>
  );
};

export default PsychologistSetupPage;
