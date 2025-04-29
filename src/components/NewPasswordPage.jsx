import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

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

  // Extract token and email from URL when component mounts
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get("token");
    const emailFromUrl = queryParams.get("email");
    
    if (tokenFromUrl && emailFromUrl) {
      setToken(tokenFromUrl);
      setEmail(emailFromUrl);
    } else {
      setError("Invalid or missing reset information. Please try the reset password process again.");
    }
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
      
      // Simulate API call to reset password
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful password reset
      setSuccess(true);
      
      // Redirect to login page after a delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (error) {
      setError("Failed to reset password. Please try again.");
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
          <h2>Create New Password</h2>
        </div>

        {!token && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 14H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Invalid or missing reset token.
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="success-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Password reset successful!
            </div>
            <p className="mt-2 text-center">
              Your password has been updated. Redirecting to login page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  className={error && !confirmPassword ? "error" : ""}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || !token}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                  disabled={isSubmitting || !token}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 10C2.5 10 5 4.16667 10 4.16667C15 4.16667 17.5 10 17.5 10C17.5 10 15 15.8333 10 15.8333C5 15.8333 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.7678 11.7678C11.2989 12.2366 10.663 12.5 10 12.5C9.33696 12.5 8.70107 12.2366 8.23223 11.7678C7.76339 11.2989 7.5 10.663 7.5 10C7.5 9.33696 7.76339 8.70107 8.23223 8.23223C8.70107 7.76339 9.33696 7.5 10 7.5C10.663 7.5 11.2989 7.76339 11.7678 8.23223" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.04834 2.04834L17.9517 17.9517" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.11334 3.89667C8.72001 3.70334 9.35334 3.60834 10 3.60834C14.1667 3.60834 16.3917 8.33334 16.3917 8.33334C15.9367 9.215 15.3833 10.0233 14.7517 10.7433" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.24834 5.25C4.61668 5.97 4.06334 6.77834 3.60834 7.66C3.60834 7.66 5.83334 12.3917 10 12.3917C10.6467 12.3917 11.28 12.2967 11.8867 12.1033" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={error && confirmPassword !== password ? "error" : ""}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting || !token}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                  disabled={isSubmitting || !token}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 10C2.5 10 5 4.16667 10 4.16667C15 4.16667 17.5 10 17.5 10C17.5 10 15 15.8333 10 15.8333C5 15.8333 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.7678 11.7678C11.2989 12.2366 10.663 12.5 10 12.5C9.33696 12.5 8.70107 12.2366 8.23223 11.7678C7.76339 11.2989 7.5 10.663 7.5 10C7.5 9.33696 7.76339 8.70107 8.23223 8.23223C8.70107 7.76339 9.33696 7.5 10 7.5C10.663 7.5 11.2989 7.76339 11.7678 8.23223" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.04834 2.04834L17.9517 17.9517" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.11334 3.89667C8.72001 3.70334 9.35334 3.60834 10 3.60834C14.1667 3.60834 16.3917 8.33334 16.3917 8.33334C15.9367 9.215 15.3833 10.0233 14.7517 10.7433" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.24834 5.25C4.61668 5.97 4.06334 6.77834 3.60834 7.66C3.60834 7.66 5.83334 12.3917 10 12.3917C10.6467 12.3917 11.28 12.2967 11.8867 12.1033" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
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
            
            <div className="mb-4"></div>
            
            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting || !token}
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
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewPasswordPage; 