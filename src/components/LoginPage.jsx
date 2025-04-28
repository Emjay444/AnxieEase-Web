import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatErrorMessage } from "../utils/apiHelpers";

const EyeIcon = ({ show }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
    style={{ color: '#6c757d' }}
  >
    {show ? (
      <>
        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
      </>
    ) : (
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5c2.08 0 3.84-.684 5.359-2.262zm-4.076-2.522L10.72 8c0-.412-.099-.796-.255-1.145l.814-1.547a3 3 0 0 0-4.474 3.997l.755-.754zM6.75 8c0-.691.483-1.27 1.125-1.423l.056-.107a3 3 0 0 0-4.056 3.06l.784-.773C6.334 8.537 6.75 8.313 6.75 8zm1.5 0c0 .691-.483 1.27-1.125 1.423l-.056.107a3 3 0 0 0 4.056-3.06l-.784.773C8.666 7.463 8.25 7.687 8.25 8z"/>
    )}
  </svg>
);

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrors({ username: "Username is required" });
      return;
    }
    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }
    try {
      setIsSubmitting(true);
      setLoginError("");
      setErrors({});
      const { role } = await signIn(username, password);
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setLoginError(formatErrorMessage(error));
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
          <div className="text-muted mb-2">Health Care App</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className={`form-control ${errors.username ? "is-invalid" : ""}`}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            {errors.username && (
              <div className="invalid-feedback">{errors.username}</div>
            )}
          </div>
          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none border-0"
              onClick={() => setShowPassword(!showPassword)}
              style={{ padding: "0 12px" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon show={!showPassword} />
            </button>
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>
          <div className="mb-3 text-start">
            <Link
              to="/forgot-password"
              className="link-secondary link-underline-opacity-0 link-underline-opacity-100-hover small"
            >
              Forgot Password? Click here
            </Link>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
          {loginError && (
            <div
              className="alert alert-danger mt-3 mb-0 py-2 text-center"
              role="alert"
            >
              {loginError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
