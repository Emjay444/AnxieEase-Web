import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatErrorMessage } from "../utils/apiHelpers";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
          <div className="mb-3">
            <input
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>
          <div className="mb-3 text-start">
            <a
              href="#"
              className="link-secondary link-underline-opacity-0 link-underline-opacity-100-hover small"
              onClick={(e) => {
                e.preventDefault();
                alert("Forgot Password?");
              }}
            >
              Forgot Password? Click here
            </a>
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
