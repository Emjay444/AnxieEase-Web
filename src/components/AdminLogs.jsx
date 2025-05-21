import { useState } from "react";
import { adminService } from "../services/adminService";

const AdminLogs = ({
  logs = [],
  loading = false,
  dateFilter,
  onFilterChange,
  onLogDeleted,
}) => {
  const [deletingLogId, setDeletingLogId] = useState(null);

  // Handle log deletion
  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Are you sure you want to delete this log entry?")) {
      return;
    }

    setDeletingLogId(logId);
    try {
      const result = await adminService.deleteActivityLog(logId);
      if (result.success) {
        if (onLogDeleted) {
          onLogDeleted(logId);
        }
      } else {
        alert("Failed to delete log entry. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("An error occurred while deleting the log entry.");
    } finally {
      setDeletingLogId(null);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="table-responsive">
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <table className="table align-middle admin-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Details</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr key={log.id || index}>
                  <td>{log.action}</td>
                  <td>{log.details}</td>
                  <td>{formatTimestamp(log.timestamp)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteLog(log.id)}
                      disabled={deletingLogId === log.id}
                    >
                      {deletingLogId === log.id ? (
                        <span
                          className="spinner-border spinner-border-sm me-1"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  <div className="d-flex flex-column align-items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: "#94a3b8" }}
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p className="text-muted mb-0">
                      No logs found for this period
                    </p>
                    {dateFilter && (
                      <p className="text-muted small mb-0">
                        Try selecting a different date
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminLogs;
