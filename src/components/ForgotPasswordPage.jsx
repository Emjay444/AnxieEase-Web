import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Simulated registered emails for demo purposes
  const registeredEmails = ["test@email.com", "user@example.com"];

  const handleSubmit = async (e) => {
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

      // Simulate API call to check if email is registered
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if email is registered
      if (!registeredEmails.includes(email.toLowerCase())) {
        setError("Email not found. Please check your email and try again.");
        setIsSubmitting(false);
        return;
      }

      // Simulate sending reset email and generating a token
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate a dummy token for the demo (in real app, this would come from backend)
      const dummyToken = Math.random().toString(36).substring(2, 15);

      // Redirect to new password page with the token
      navigate(
        `/new-password?token=${dummyToken}&email=${encodeURIComponent(email)}`
      );
    } catch (error) {
      setError("Failed to send reset email. Please try again.");
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
            Reset Password
          </h1>
          <p className="text-emerald-100 drop-shadow-sm">
            Enter your email to receive reset instructions
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  Processing...
                </>
              ) : (
                "Send Reset Instructions"
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
