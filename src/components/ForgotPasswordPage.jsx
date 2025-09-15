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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Set new password
  const [success, setSuccess] = useState(false);
  const [verifiedOtp, setVerifiedOtp] = useState(false);
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
      setStep(2);
    } catch (error) {
      setError(error?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    // Validation
    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Verify OTP
      await authService.verifyPasswordResetOtp(email, otp);
      setVerifiedOtp(true);
      setStep(3);
    } catch (error) {
      setError(
        error?.message || "Invalid OTP. Please check your code and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!newPassword.trim()) {
      setError("New password is required");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Update password
      await authService.updatePasswordAfterVerification(newPassword);
      setSuccess(true);
    } catch (error) {
      setError(error?.message || "Failed to reset password. Please try again.");
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
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {step === 1 && "Reset Password"}
            {step === 2 && "Enter Verification Code"}
            {step === 3 && "Set New Password"}
          </h1>
          <p className="text-emerald-100 drop-shadow-sm">
            {step === 1 && "Enter your email to receive a verification code"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Choose a new secure password for your account"}
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

          {success ? (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                Password reset successfully!
              </div>
              <p className="text-sm text-gray-700">
                Your password has been updated. You can now log in with your new
                password.
              </p>
              <Link
                to="/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          ) : step === 1 ? (
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
                    Sending Code...
                  </>
                ) : (
                  "Send Verification Code"
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
          ) : step === 2 ? (
            // Step 2: OTP Verification
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* Info Message */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 text-sm">
                  We've sent a 6-digit verification code to{" "}
                  <strong>{email}</strong>. Please enter it below.
                </span>
              </div>

              {/* OTP Field */}
              <div className="relative">
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors peer text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength="6"
                    required
                    aria-label="Verification code"
                  />
                  <label
                    htmlFor="otp"
                    className="absolute left-10 top-3 text-gray-500 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:left-2 peer-focus:text-emerald-600 peer-focus:text-sm peer-focus:bg-white peer-focus:px-1 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-emerald-600 peer-valid:text-sm peer-valid:bg-white peer-valid:px-1"
                  >
                    Verification Code
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
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </button>

              {/* Back to Step 1 */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                  }}
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Email Entry
                </button>
              </div>
            </form>
          ) : (
            // Step 3: New Password Entry
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Success Message for OTP Verification */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 text-sm">
                  Code verified successfully! Now set your new password.
                </span>
              </div>

              {/* New Password Field */}
              <div className="relative">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors peer"
                    required
                    aria-label="New password"
                  />
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
                  <label
                    htmlFor="newPassword"
                    className="absolute left-10 top-3 text-gray-500 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:left-2 peer-focus:text-emerald-600 peer-focus:text-sm peer-focus:bg-white peer-focus:px-1 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-emerald-600 peer-valid:text-sm peer-valid:bg-white peer-valid:px-1"
                  >
                    New Password
                  </label>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="relative">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors peer"
                    required
                    aria-label="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <label
                    htmlFor="confirmPassword"
                    className="absolute left-10 top-3 text-gray-500 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:left-2 peer-focus:text-emerald-600 peer-focus:text-sm peer-focus:bg-white peer-focus:px-1 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-emerald-600 peer-valid:text-sm peer-valid:bg-white peer-valid:px-1"
                  >
                    Confirm Password
                  </label>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                Password must be at least 6 characters long
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
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>

              {/* Back to Step 2 */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Code Verification
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
