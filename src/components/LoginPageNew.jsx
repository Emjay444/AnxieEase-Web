import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { signIn, user, userRole, loading } = useAuth();

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Check for existing lockout on page load
  useEffect(() => {
    if (email) {
      const existingLockout = authService.getLockoutInfo(email);
      if (existingLockout && existingLockout.isLocked) {
        setLockoutInfo(existingLockout);
        setCountdown(Math.ceil(existingLockout.remainingMs / 1000));
        setError("Account locked. Too many failed attempts.");
      }
    }
  }, [email]);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutInfo && lockoutInfo.isLocked) {
      const timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, lockoutInfo.lockoutEnd - now);

        if (remaining <= 0) {
          setLockoutInfo(null);
          setCountdown(0);
          setError("");
          clearInterval(timer);
        } else {
          setCountdown(Math.ceil(remaining / 1000)); // Convert to seconds
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lockoutInfo]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const cached = localStorage.getItem("userRole");
      const role = userRole || cached;
      if (!role) return; // wait for a known role
      const dest = role === "admin" ? "/admin" : "/dashboard";
      console.log("Authenticated, navigating to:", dest, "role:", role);
      navigate(dest, { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Input validation
    if (!email.trim()) {
      setError("Email address is required");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting to sign in...");
      const { role } = await signIn(email, password);
      console.log("Sign in successful, role:", role);

      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberMe");
      }

      // Show success message briefly before redirect
      setError("");
      setSuccess("Sign in successful! Redirecting...");

      // Small delay to show success state
      setTimeout(() => {
        // Redirect based on role
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "psychologist") {
          navigate("/dashboard");
        } else {
          navigate("/patient-profile");
        }
      }, 800);
    } catch (err) {
      console.error("Sign in error:", err);

      // Handle different types of errors with specific messages
      let errorMessage = "Failed to sign in";

      if (err.message.includes("Invalid login credentials")) {
        errorMessage =
          "Invalid email or password. Please check your credentials and try again.";
      } else if (err.message.includes("Email not confirmed")) {
        errorMessage =
          "Please check your email and confirm your account before signing in.";
      } else if (err.message.includes("Too many requests")) {
        errorMessage =
          "Too many login attempts. Please wait a moment before trying again.";
      } else if (err.message.includes("Network")) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (err.message.includes("Account locked")) {
        errorMessage = err.message; // Keep lockout messages as they are
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Handle lockout information
      if (err.lockoutInfo) {
        setLockoutInfo(err.lockoutInfo);
        setCountdown(Math.ceil(err.lockoutInfo.remainingMs / 1000));
      } else {
        setLockoutInfo(null);
        setCountdown(0);
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

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
            Breathe easy. You're in a safe space.
          </p>
        </div>

        {/* Sign In Form */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Error Messages */}
          {error && (
            <div className="mb-6 p-4 border rounded-lg flex items-center gap-2 bg-red-50 border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Success Messages */}
          {success && (
            <div className="mb-6 p-4 border rounded-lg flex items-center gap-2 bg-green-50 border-green-200">
              <div className="w-5 h-5 rounded-full border-2 border-green-600 flex items-center justify-center">
                <div className="w-2 h-1 border-green-600 border-l-2 border-b-2 transform rotate-[-45deg] translate-x-[1px] translate-y-[-1px]"></div>
              </div>
              <div className="flex-1">
                <span className="text-green-700">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when user starts typing
                    if (error) setError("");
                    if (success) setSuccess("");
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors peer"
                  required
                  aria-label="Email address"
                />
                <label
                  htmlFor="email"
                  className="absolute left-10 top-3 text-gray-500 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:left-2 peer-focus:text-emerald-600 peer-focus:text-sm peer-focus:bg-white peer-focus:px-1 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-emerald-600 peer-valid:text-sm peer-valid:bg-white peer-valid:px-1"
                >
                  Email
                </label>
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear error when user starts typing
                    if (error) setError("");
                    if (success) setSuccess("");
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors peer"
                  required
                  aria-label="Password"
                />
                <label
                  htmlFor="password"
                  className="absolute left-10 top-3 text-gray-500 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:left-2 peer-focus:text-emerald-600 peer-focus:text-sm peer-focus:bg-white peer-focus:px-1 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-emerald-600 peer-valid:text-sm peer-valid:bg-white peer-valid:px-1"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRememberMe(checked);

                    // If unchecking, clear saved credentials immediately
                    if (!checked) {
                      localStorage.removeItem("rememberedEmail");
                      localStorage.removeItem("rememberMe");
                    }
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-gray-700 text-sm">Remember Me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (lockoutInfo && lockoutInfo.isLocked)}
              className="w-full btn-gradient text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Countdown Timer */}
            {lockoutInfo && lockoutInfo.isLocked && countdown > 0 && (
              <div className="mt-3 text-center text-sm text-red-600">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    Unlocking in: {Math.floor(countdown / 60)}:
                    {(countdown % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
