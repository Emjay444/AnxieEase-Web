import React from "react";
import { AlertTriangle } from "lucide-react";
import { WARNING_SECONDS } from "../hooks/useSessionTimeout";

// Purely presentational - the countdown lives in useSessionTimeout, which
// is the single timer that decides when to actually log out. This modal
// only renders whatever `secondsLeft` it's given.
const SessionWarningModal = ({ show, secondsLeft, onExtend, onLogout }) => {
  if (!show) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const percentLeft = Math.max(0, Math.min(100, (secondsLeft / WARNING_SECONDS) * 100));
  const isUrgent = secondsLeft <= 30;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md session-warning-overlay"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.45)" }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 session-warning-card">
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`flex items-center justify-center w-11 h-11 rounded-full shrink-0 ${
              isUrgent ? "bg-red-100" : "bg-amber-100"
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${isUrgent ? "text-red-600" : "text-amber-600"}`}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session Expiring</h3>
            <p className="text-xs text-gray-500">Due to inactivity</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          You'll be signed out automatically in:
        </p>
        <div
          className={`text-4xl font-bold text-center mb-3 tabular-nums tracking-wide ${
            isUrgent ? "text-red-600" : "text-gray-900"
          }`}
        >
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>

        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
              isUrgent ? "bg-red-500" : "bg-amber-500"
            }`}
            style={{ width: `${percentLeft}%` }}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Logout Now
          </button>
          <button
            onClick={onExtend}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
