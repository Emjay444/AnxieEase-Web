import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      // Here you would typically make an API call to handle password reset
      // For now, we'll simulate a successful request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (error) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body-secondary">
      <div
        className="card shadow-lg p-4"
        style={{ minWidth: 350, maxWidth: 400, width: "100%" }}
      >
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-0" style={{ letterSpacing: "-1px" }}>
            <span className="text-primary">Anxie</span>Ease
          </h1>
          <div className="text-muted mb-2">Reset Password</div>
        </div>

        {success ? (
          <div className="text-center">
            <div className="alert alert-success" role="alert">
              Password reset instructions have been sent to your email.
            </div>
            <button
              className="btn btn-primary w-100 mt-3"
              onClick={() => navigate("/login")}
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`form-control ${error ? "is-invalid" : ""}`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              {error && <div className="invalid-feedback">{error}</div>}
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold py-2 mb-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Instructions"}
            </button>
            <div className="text-center">
              <button
                type="button"
                className="btn btn-link text-decoration-none"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 