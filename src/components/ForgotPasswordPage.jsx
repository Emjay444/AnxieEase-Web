import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { authService } from "../services/authService";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();

    // Check for empty email
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Check for valid email format
    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Request OTP from Supabase
      await authService.requestPasswordReset(email);
      setOtpSent(true);
    } catch (error) {
      setError(error?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    // Check for empty OTP
    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    // Check OTP length (6 digits)
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP from your email");
      return;
    }

    try {
      setIsVerifying(true);
      setError("");

      // Verify OTP with Supabase
      await authService.verifyPasswordResetOtp(email, otp);

      // Navigate to new password page
      navigate(`/new-password?email=${encodeURIComponent(email)}&token=${otp}`);
    } catch (error) {
      setError("Invalid OTP. Please check your email and try again.");
    } finally {
      setIsVerifying(false);
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
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Reset Password
          </h1>
          <p className="text-emerald-100 drop-shadow-sm">
            {!otpSent
              ? "Enter your email and we will send you a 6-digit OTP code."
              : "Check your email and enter the 6-digit OTP code."}
          </p>
        </div>

        {/* Reset Form */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              {/* Email Field */}
              <div className="relative">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-gradient text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>

              {/* Back to Sign In */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* Email Display */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  OTP sent to <strong>{email}</strong>
                </p>
              </div>

              {/* OTP Field */}
              <div className="relative">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    disabled={isVerifying}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-center text-lg font-mono tracking-widest"
                    placeholder="511936"
                    maxLength="6"
                    required
                    aria-label="OTP Code"
                  />
                  <label
                    htmlFor="otp"
                    className="absolute left-10 top-3 text-gray-500 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:left-2 peer-focus:text-emerald-600 peer-focus:text-sm peer-focus:bg-white peer-focus:px-1 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-emerald-600 peer-valid:text-sm peer-valid:bg-white peer-valid:px-1"
                  >
                    6-Digit OTP
                  </label>
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="w-full btn-gradient text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>

              {/* Back Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                  }}
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
