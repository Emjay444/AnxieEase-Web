import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatErrorMessage } from "../utils/apiHelpers";
import "./Login.css";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();

  // Handle session timeout
  useEffect(() => {
    let timeoutId;
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await signOut();
        navigate("/login");
      }, SESSION_TIMEOUT);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => document.addEventListener(event, resetTimeout));

    resetTimeout();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimeout));
    };
  }, [signOut, navigate]);

  // Handle lockout countdown
  useEffect(() => {
    let intervalId;
    if (lockoutTime) {
      intervalId = setInterval(() => {
        const remaining = lockoutTime - Date.now();
        if (remaining <= 0) {
          setLockoutTime(null);
          setLoginAttempts(0);
          setRemainingTime(0);
          clearInterval(intervalId);
        } else {
          setRemainingTime(Math.ceil(remaining / 1000));
        }
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [lockoutTime]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if account is locked
    if (lockoutTime && lockoutTime > Date.now()) {
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      setLoginError(`Account is locked. Please try again in ${minutes}:${seconds.toString().padStart(2, '0')}`);
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setLoginError("");
      setErrors({});
      
      const { role } = await signIn(email, password);
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
      
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Check if account should be locked
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutEndTime = Date.now() + LOCKOUT_DURATION;
        setLockoutTime(lockoutEndTime);
        setLoginError(`Too many failed attempts. Account is locked for 15 minutes.`);
      } else {
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts;
        setLoginError(`${formatErrorMessage(error)}. ${remainingAttempts} attempts remaining.`);
      }
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
          <h2>Health Care App</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-with-icon">
              <input
                type="email"
                className={errors.email ? "error" : ""}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isSubmitting || (lockoutTime && lockoutTime > Date.now())}
              />
            </div>
            {errors.email && (
              <div className="field-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 11H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {errors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                className={errors.password ? "error" : ""}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting || (lockoutTime && lockoutTime > Date.now())}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
                disabled={isSubmitting || (lockoutTime && lockoutTime > Date.now())}
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
            {errors.password && (
              <div className="field-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 11H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {errors.password}
              </div>
            )}
          </div>

          <div className="mb-4">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting || (lockoutTime && lockoutTime > Date.now())}
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
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          {loginError && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 14H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {loginError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
