import React from 'react';
import './Attendance.css';

export default function Attendance() {
  // Simple placeholder attendance table
  const rows = [
    { id: 1, name: 'Alice Johnson', date: '2025-11-16', status: 'Present' },
    { id: 2, name: 'Bob Smith', date: '2025-11-16', status: 'Absent' },
    { id: 3, name: 'Charlie Lee', date: '2025-11-16', status: 'Late' },
  ];

  return (
    <div className="attendance-page">
      <div className="page-header">
        <h2>Attendance</h2>
        <p className="muted">View and manage daily attendance</p>
      </div>

      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.date}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
