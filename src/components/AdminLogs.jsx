import { useState } from "react";

// Sample log data - in a real app, this would come from your backend
const sampleLogs = [
  {
    id: 1,
    action: "Added new psychiatrist",
    details: "Added Dr. Brooklyn Simmons (ID: 87364523)",
    timestamp: "2024-01-24 10:40 PM"
  },
  {
    id: 2,
    action: "Assigned patient",
    details: "Assigned Alice Smith to Dr. Jacob Jones",
    timestamp: "2024-01-24 03:15 PM"
  },
  {
    id: 3,
    action: "Deactivated psychiatrist",
    details: "Deactivated Dr. Kristin Watson (ID: 98374653)",
    timestamp: "2024-01-23 05:20 PM"
  },
  {
    id: 4,
    action: "Updated psychiatrist",
    details: "Updated information for Dr. Cody Fisher",
    timestamp: "2024-01-23 03:00 PM"
  }
];

// Define action types with their associated styles and icons
const actionTypes = {
  "Added new psychiatrist": {
    color: "success",
    icon: "➕",
    label: "ADD"
  },
  "Assigned patient": {
    color: "primary",
    icon: "🔄",
    label: "ASSIGN"
  },
  "Deactivated psychiatrist": {
    color: "danger",
    icon: "❌",
    label: "DEACTIVATE"
  },
  "Updated psychiatrist": {
    color: "info",
    icon: "🔄",
    label: "UPDATE"
  }
};

const AdminLogs = () => {
  const [filterDate, setFilterDate] = useState("");

  // Filter logs based on date only
  const filteredLogs = sampleLogs.filter(log => {
    const matchesDate = !filterDate || log.timestamp.includes(filterDate);
    return matchesDate;
  });

  // Get action type styling
  const getActionStyle = (action) => {
    const actionType = actionTypes[action] || {
      color: "secondary", 
      icon: "ℹ️",
      label: "INFO"
    };
    return actionType;
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">Activity Logs</h5>
          <small className="text-muted">{filteredLogs.length} activities found</small>
        </div>
        <div>
          <input
            type="date"
            className="form-control"
            style={{ width: '150px' }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>
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
            {filteredLogs.map((log) => {
              const actionStyle = getActionStyle(log.action);
              return (
                <tr key={log.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge rounded-pill px-3 py-2 
                        ${`bg-${actionStyle.color}-subtle text-${actionStyle.color} border border-${actionStyle.color}`}`}>
                        {actionStyle.label}
                      </span>
                      <span style={{ fontSize: "14px" }}>
                        <span className="me-2">{actionStyle.icon}</span>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td>{log.details}</td>
                  <td>{log.timestamp}</td>
                </tr>
              );
            })}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-4 text-muted">
                  No activity logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminLogs; 