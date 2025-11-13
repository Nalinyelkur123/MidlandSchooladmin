import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

export default function Timetable() {
  const { token } = useAuth();
  const toast = useToast();
  const [teacherCode, setTeacherCode] = useState('TCH2025');
  const [day, setDay] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const path = `/midland/users/timetables/teacher/${encodeURIComponent(teacherCode)}`;
      const url = getApiUrl(path);
      const res = await fetch(url, { 
        headers: getAuthHeaders(token)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err.message || 'Failed to load timetable';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [teacherCode, token, toast]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const days = useMemo(() => Array.from(new Set(entries.map(e => e.dayOfWeek))), [entries]);
  const filtered = useMemo(() => {
    const d = day.trim();
    return entries
      .filter(e => !d || e.dayOfWeek === d)
      .sort((a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.periodNumber - b.periodNumber);
  }, [entries, day]);

  return (
    <div className="page timetable">
      <div className="page-header">
        <div className="header-main">
          <h2>Timetable</h2>
          <div className="meta">{loading ? 'Loading…' : `${filtered.length} periods`}</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <input 
          value={teacherCode} 
          onChange={(e) => setTeacherCode(e.target.value)} 
          placeholder="Teacher Code (e.g., TCH2025)" 
          className="filter-input"
        />
        <select 
          value={day} 
          onChange={(e) => setDay(e.target.value)} 
          disabled={loading}
          className="filter-select"
        >
          <option value="">All Days</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={7} />
      ) : filtered.length === 0 ? (
        <EmptyState type="timetable" />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Period</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Section</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.dayOfWeek || '-'}</td>
                  <td>{entry.periodNumber || '-'}</td>
                  <td>{entry.startTime && entry.endTime ? `${entry.startTime} - ${entry.endTime}` : '-'}</td>
                  <td>{entry.subjectName || entry.subjectCode || '-'}</td>
                  <td>{entry.gradeLevel || '-'}</td>
                  <td>{entry.section || '-'}</td>
                  <td>{entry.roomNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

