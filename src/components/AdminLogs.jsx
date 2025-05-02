import { useState } from "react";

const AdminLogs = () => {
  const [logs] = useState([
    {
      action: "Added Dr. Brooklyn Simmons",
      details: "Added Dr. Brooklyn Simmons (ID: 87364523)",
      timestamp: "2024-01-24 10:40 PM"
    },
    {
      action: "Assigned Patient",
      details: "Assigned Alice Smith to Dr. Jacob Jones",
      timestamp: "2024-01-24 03:15 PM"
    },
    {
      action: "Deactivated Doctor",
      details: "Deactivated Dr. Kristin Watson (ID: 98374653)",
      timestamp: "2024-01-23 05:20 PM"
    },
    {
      action: "Updated Information",
      details: "Updated information for Dr. Cody Fisher",
      timestamp: "2024-01-23 03:00 PM"
    }
  ]);

  return (
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
          {logs.map((log, index) => (
            <tr key={index}>
              <td>{log.action}</td>
              <td>{log.details}</td>
              <td>{log.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminLogs; 