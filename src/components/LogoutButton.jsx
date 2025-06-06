import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const LogoutButton = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      className="btn btn-danger"
      onClick={handleLogout}
      disabled={isLoggingOut}
      title="Logout"
    >
      {isLoggingOut ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Logging out...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-box-arrow-right me-2"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"
            />
            <path
              fillRule="evenodd"
              d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
            />
          </svg>
          Logout
        </>
      )}
    </button>
  );
};

export default LogoutButton;
