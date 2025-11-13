import React, { useEffect, useMemo, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

export default function Subjects() {
  const { token } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchSubjects() {
      setLoading(true);
      setError('');
      try {
        const path = '/midland/users/subjects/all';
        const url = getApiUrl(path);
        const res = await fetch(url, { 
          headers: getAuthHeaders(token)
        });
        if (!res.ok) {
          throw new Error(`Request failed ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) setSubjects(Array.isArray(data) ? data : []);
      } catch (err) {
        const errorMsg = err.message || 'Failed to load subjects';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSubjects();
    return () => { isMounted = false; };
  }, [token, toast]);

  const grades = useMemo(() => Array.from(new Set(subjects.map(s => String(s.gradeLevel || '').trim()).filter(Boolean))), [subjects]);
  const curricula = useMemo(() => Array.from(new Set(subjects.map(s => String(s.curriculumType || '').trim()).filter(Boolean))), [subjects]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subjects
      .filter(s => {
        const name = String(s.subjectName || '').toLowerCase();
        const code = String(s.subjectCode || '').toLowerCase();
        const gradeMatch = !grade || String(s.gradeLevel || '') === grade;
        const currMatch = !curriculum || String(s.curriculumType || '') === curriculum;
        const queryMatch = !q || name.includes(q) || code.includes(q);
        return gradeMatch && currMatch && queryMatch;
      })
      .map(s => ({
        key: s.subjectCode || s.subjectName,
        subjectName: s.subjectName || '-',
        subjectCode: s.subjectCode || '-',
        curriculumType: s.curriculumType || '-',
        gradeLevel: s.gradeLevel || '-',
        teacherCode: s.teacherCode || '-',
      }));
  }, [subjects, query, grade, curriculum]);

  return (
    <div className="page subjects">
      <div className="page-header">
        <div className="header-main">
          <h2>Subjects</h2>
          <div className="meta">{loading ? 'Loading…' : `${rows.length} subject${rows.length !== 1 ? 's' : ''}`}</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="filter-input"
        />
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className="filter-select">
          <option value="">All Grades</option>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={curriculum} onChange={(e) => setCurriculum(e.target.value)} className="filter-select">
          <option value="">All Curricula</option>
          {curricula.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : rows.length === 0 ? (
        <EmptyState type="subjects" />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
                <th>Grade Level</th>
                <th>Curriculum</th>
                <th>Teacher Code</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key}>
                  <td>{row.subjectName}</td>
                  <td>{row.subjectCode}</td>
                  <td>{row.gradeLevel}</td>
                  <td>{row.curriculumType}</td>
                  <td>{row.teacherCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

