import React from 'react';
import './Events.css';

export default function Events() {
  const events = [
    { id: 1, name: 'Annual Sports Day', date: '2025-12-01', location: 'Sports Ground' },
    { id: 2, name: 'Science Fair', date: '2025-12-10', location: 'Auditorium' },
    { id: 3, name: 'Annual Day Celebration', date: '2025-12-20', location: 'Main Hall' },
  ];

  return (
    <div className="events-page">
      <div className="page-header">
        <h2>Events</h2>
        <p className="muted">Upcoming school events</p>
      </div>

      <div className="events-grid">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <h3>{event.name}</h3>
            <p><strong>Date:</strong> {event.date}</p>
            <p><strong>Location:</strong> {event.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
