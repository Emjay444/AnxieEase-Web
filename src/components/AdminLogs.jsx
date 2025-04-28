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

const AdminLogs = () => {
  const [filterDate, setFilterDate] = useState("");

  // Filter logs based on date only
  const filteredLogs = sampleLogs.filter(log => {
    const matchesDate = !filterDate || log.timestamp.includes(filterDate);
    return matchesDate;
  });

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
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span className={`badge rounded-pill px-3 py-2 
                    ${log.action.includes('Added') ? 'bg-success-subtle text-success' : 
                      log.action.includes('Deactivated') ? 'bg-danger-subtle text-danger' :
                      log.action.includes('Updated') ? 'bg-info-subtle text-info' :
                      'bg-primary-subtle text-primary'}`}>
                    {log.action}
                  </span>
                </td>
                <td>{log.details}</td>
                <td>{log.timestamp}</td>
              </tr>
            ))}
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