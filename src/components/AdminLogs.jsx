import { useState, useEffect } from "react";
import { adminService } from "../services/adminService";

const AdminLogs = ({
  logs = [],
  loading = false,
  dateFilter,
  onFilterChange,
}) => {
  const [date, setDate] = useState(dateFilter || "");

  // Handle date filter changes
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);

    // Call parent component's filter function
    if (onFilterChange) {
      onFilterChange(newDate);
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Activity Logs</h5>
        <div className="d-flex align-items-center">
          <label htmlFor="dateFilter" className="me-2">
            Filter by date:
          </label>
          <input
            type="date"
            id="dateFilter"
            className="form-control form-control-sm"
            value={date}
            onChange={handleDateChange}
          />
          {date && (
            <button
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={() => {
                setDate("");
                if (onFilterChange) onFilterChange("");
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <tr key={log.id || index}>
                    <td>{log.action}</td>
                    <td>{log.details}</td>
                    <td>{formatTimestamp(log.timestamp)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4">
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
                      {date && (
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
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
