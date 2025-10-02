import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const SessionWarningModal = ({ show, timeRemaining, onExtend, onLogout }) => {
  const [countdown, setCountdown] = useState(120); // Start with 2 minutes (120 seconds)

  useEffect(() => {
    if (show) {
      setCountdown(120); // Reset to 2 minutes when modal shows

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [show, onLogout]);

  if (!show) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div
      className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Session Expiring
          </h3>
        </div>

        <p className="text-gray-600 mb-4">
          Your session will expire in{" "}
          <strong>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </strong>{" "}
          due to inactivity.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Logout Now
          </button>
          <button
            onClick={onExtend}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
