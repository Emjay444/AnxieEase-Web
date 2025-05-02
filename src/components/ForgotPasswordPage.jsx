import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email is registered
      if (!registeredEmails.includes(email.toLowerCase())) {
        setError("Email not found. Please check your email and try again.");
        setIsSubmitting(false);
        return;
      }
      
      // Simulate sending reset email and generating a token
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a dummy token for the demo (in real app, this would come from backend)
      const dummyToken = Math.random().toString(36).substring(2, 15);
      
      // Redirect to new password page with the token
      navigate(`/new-password?token=${dummyToken}&email=${encodeURIComponent(email)}`);
      
    } catch (error) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="text-center mb-4">
          <h1>
            <span className="text-gradient">Anxie</span>Ease
          </h1>
          <h2>Reset Password</h2>
        </div>

          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-with-icon">
              <input
                type="email"
                className={error ? "error" : ""}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <div className="field-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 11H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {error}
              </div>
            )}
          </div>
          
          <div className="mb-4"></div>
          
            <button
              type="submit"
            className="login-button"
              disabled={isSubmitting}
            >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3.75V6.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path opacity="0.5" d="M13.75 5L12.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path opacity="0.25" d="M15 10H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path opacity="0.15" d="M13.75 15L12.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path opacity="0.35" d="M10 16.25V13.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path opacity="0.5" d="M6.25 15L7.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path opacity="0.65" d="M5 10H7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path opacity="0.8" d="M6.25 5L7.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Processing...
              </>
            ) : (
              "Send Reset Instructions"
            )}
            </button>
          
          <div className="text-center mt-4">
            <Link to="/login" className="forgot-password-link">
                Back to Login
            </Link>
            </div>
          </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 