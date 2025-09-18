import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { supabase } from "../services/supabaseClient";

const NewPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Check for Supabase session from password recovery
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          setError(
            "Invalid or expired reset link. Please try the reset password process again."
          );
          return;
        }

        if (session && session.user) {
          // Valid recovery session
          setToken("valid");
          setEmail(session.user.email);
        } else {
          // Check URL parameters as fallback
          const queryParams = new URLSearchParams(location.search);
          const tokenFromUrl = queryParams.get("token");
          const emailFromUrl = queryParams.get("email");

          if (tokenFromUrl && emailFromUrl) {
            setToken(tokenFromUrl);
            setEmail(emailFromUrl);
          } else {
            setError(
              "Invalid or missing reset information. Please try the reset password process again."
            );
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
        setError("Failed to verify reset link. Please try again.");
      }
    };

    checkSession();
  }, [location]);

  // Password toggle handlers
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Validate password
  const validatePassword = () => {
    // Reset errors
    setError("");

    // Check for empty password
    if (!password) {
      setError("Password is required");
      return false;
    }

    // Check password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validatePassword()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Use Supabase to update the password
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Password update error:", error);

        // Handle specific error cases
        if (
          error.message &&
          (error.message.includes("same") ||
            error.message.includes("different from the old password"))
        ) {
          setError("New password must be different from your current password");
        } else if (error.message && error.message.includes("weak")) {
          setError("Password is too weak. Please choose a stronger password");
        } else if (error.message && error.message.includes("length")) {
          setError("Password must be at least 6 characters long");
        } else {
          setError("Failed to reset password. Please try again.");
        }
        throw error;
      }

      setSuccess(true);

      // Redirect to login page after a delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      // Error already handled above
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative">
      {/* Floating shapes for enhanced animation */}
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/anxieease-logo.png"
            alt="AnxieEase"
            className="mx-auto mb-3 h-16 w-16 drop-shadow-lg logo-breathe"
          />
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Anxie<span className="text-emerald-300">Ease</span>
          </h1>
          <p className="mt-1 text-emerald-100/90 drop-shadow-sm">
            Create your new password
          </p>
        </div>

        {/* Password Reset Form */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {!token && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 flex items-start">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 mt-0.5"
              >
                <path
                  d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 6V10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 14H10.01"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>Invalid or missing reset token.</div>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 p-3 inline-flex items-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 10L9 12L13 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Password update successful!
              </div>
              <p className="text-gray-600">
                Your password has been updated. Redirecting to sign in page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    aria-label="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || !token}
                    className={`w-full px-4 py-2.5 rounded-lg border bg-white/70 focus:outline-none focus:ring-2 focus:border-transparent ${
                      error && !confirmPassword
                        ? "border-red-300 focus:ring-red-300"
                        : "border-gray-300 focus:ring-emerald-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-900"
                    disabled={isSubmitting || !token}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    aria-label="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting || !token}
                    className={`w-full px-4 py-2.5 rounded-lg border bg-white/70 focus:outline-none focus:ring-2 focus:border-transparent ${
                      error && confirmPassword !== password
                        ? "border-red-300 focus:ring-red-300"
                        : "border-gray-300 focus:ring-emerald-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-900"
                    disabled={isSubmitting || !token}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm flex items-start">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 mt-0.5"
                  >
                    <path
                      d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 5V8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 11H8.01"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-white font-medium shadow-sm btn-gradient hover:opacity-95 active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSubmitting || !token}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 3.75V6.25"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        opacity="0.5"
                        d="M13.75 5L12.5 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        opacity="0.25"
                        d="M15 10H12.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        opacity="0.15"
                        d="M13.75 15L12.5 12.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        opacity="0.35"
                        d="M10 16.25V13.75"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        opacity="0.5"
                        d="M6.25 15L7.5 12.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        opacity="0.65"
                        d="M5 10H7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        opacity="0.8"
                        d="M6.25 5L7.5 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Updating Password...
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewPasswordPage;
