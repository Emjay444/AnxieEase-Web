import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "./ConfirmModal";
import { LogOut as LogOutIcon } from "lucide-react";

const LogoutButton = ({
  variant = "button", // 'button' | 'icon'
  tone = "primary", // 'primary' | 'outline' (for button variant)
  label = "Sign Out",
  title = "Sign out",
  className = "",
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Show success acknowledgement then navigate
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${className}`}
          onClick={() => setShowConfirm(true)}
          disabled={isLoggingOut}
          title={title}
          aria-label="Logout"
        >
          {isLoggingOut ? (
            <svg
              className="animate-spin"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 3.75V6.25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                opacity="0.5"
                d="M13.75 5L12.5 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                opacity="0.25"
                d="M15 10H12.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                opacity="0.15"
                d="M13.75 15L12.5 12.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                opacity="0.35"
                d="M10 16.25V13.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                opacity="0.5"
                d="M6.25 15L7.5 12.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                opacity="0.65"
                d="M5 10H7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                opacity="0.8"
                d="M6.25 5L7.5 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <LogOutIcon className="h-5 w-5" />
          )}
        </button>
      ) : (
        <button
          className={`inline-flex items-center ${
            tone === "primary"
              ? "px-3 py-2 text-white bg-emerald-600 hover:bg-emerald-700"
              : "px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
          } disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors ${className}`}
          onClick={() => setShowConfirm(true)}
          disabled={isLoggingOut}
          title={title}
        >
          {isLoggingOut ? (
            <>
              <svg
                className="animate-spin mr-2"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 3.75V6.25"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  opacity="0.5"
                  d="M13.75 5L12.5 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  opacity="0.25"
                  d="M15 10H12.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  opacity="0.15"
                  d="M13.75 15L12.5 12.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  opacity="0.35"
                  d="M10 16.25V13.75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  opacity="0.5"
                  d="M6.25 15L7.5 12.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  opacity="0.65"
                  d="M5 10H7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  opacity="0.8"
                  d="M6.25 5L7.5 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Logging out...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="mr-2"
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
              {label}
            </>
          )}
        </button>
      )}

      {/* Confirm Logout Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          doLogout();
        }}
        title="Sign out?"
        message="Are you sure you want to sign out of your account?"
        confirmText="Yes, sign out"
        cancelText="Cancel"
        type="warning"
      />

      {/* Success Modal */}
      <ConfirmModal
        isOpen={showSuccess}
        onCancel={() => setShowSuccess(false)}
        onConfirm={() => {
          setShowSuccess(false);
          navigate("/login");
        }}
        title="Signed out successfully"
        message="You have been signed out. Redirecting to sign in..."
        confirmText="Go to sign in"
        cancelText=""
        type="success"
      />
    </>
  );
};

export default LogoutButton;
