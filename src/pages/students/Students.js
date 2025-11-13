import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiBook, FiHash } from 'react-icons/fi';
import { SkeletonTable } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import SortableTableHeader from '../../components/SortableTableHeader';

export default function Students() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [klass, setKlass] = useState('');
  const [section, setSection] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = getApiUrl('/midland/admin/students/all');
      const res = await fetch(url, { 
        headers: getAuthHeaders(token)
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load students: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err.message || 'Failed to load students';
      if (err.message && (err.message.includes('CORS') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError('CORS error: The backend at http://4.198.16.72.nip.io needs to allow requests from your frontend origin. Please configure CORS headers on the backend.');
        toast.error('Failed to load students. Please check your connection.');
      } else {
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && deleteOpen && !deleting) {
        setDeleteOpen(false);
        setDeleteError('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteOpen, deleting]);

  useEffect(() => {
    try { Modal.setAppElement('#root'); } catch (_) {}
  }, []);

  const classes = useMemo(() => {
    return Array.from(new Set(students.map(s => String(s.gradeLevel || '').trim()).filter(Boolean)));
  }, [students]);

  const sections = useMemo(() => {
    return Array.from(new Set(students.map(s => String(s.section || '').trim()).filter(Boolean)));
  }, [students]);

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedAndFilteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = students
      .filter(s => {
        const id = String(s.admissionNumber || s.rollNo || '').toLowerCase();
        const name = String(s.fullName || '').toLowerCase();
        const email = String(s.schoolEmail || s.personalEmail || '').toLowerCase();
        const queryMatch = !q || id.includes(q) || name.includes(q) || email.includes(q);
        const classMatch = !klass || String(s.gradeLevel || '') === klass;
        const sectionMatch = !section || String(s.section || '') === section;
        return queryMatch && classMatch && sectionMatch;
      })
      .map(s => ({
        key: s.admissionNumber || s.rollNo || s.studentUid || Math.random(),
        id: s.admissionNumber || s.rollNo || '-',
        name: s.fullName || '-',
        email: s.schoolEmail || s.personalEmail || '-',
        class: s.gradeLevel || '-',
        section: s.section || '-',
        status: s.status || 'Active',
        emailKey: s.schoolEmail || s.personalEmail || '',
      }));

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [students, query, klass, section, sortConfig]);

  const totalPages = Math.ceil(sortedAndFilteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const rows = sortedAndFilteredRows.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="page students">
      <div className="page-header">
        <div className="header-main">
          <h2>Students</h2>
          <div className="meta">{loading ? 'Loading…' : `${sortedAndFilteredRows.length} student${sortedAndFilteredRows.length !== 1 ? 's' : ''}`}</div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/students/create')}>
          <FiPlus size={18} style={{ marginRight: 8 }} />
          Add Student
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <div className="filter-input-wrapper">
          <FiSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Search by ID, name, or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-select-wrapper">
          <FiBook className="filter-icon" />
          <select value={klass} onChange={(e) => setKlass(e.target.value)} className="filter-select">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-select-wrapper">
          <FiHash className="filter-icon" />
          <select value={section} onChange={(e) => setSection(e.target.value)} className="filter-select">
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={7} />
      ) : sortedAndFilteredRows.length === 0 ? (
        <EmptyState 
          type="students" 
          actionLabel="Add Student"
          onAction={() => navigate('/students/create')}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <SortableTableHeader 
                  sortKey="id" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  ID
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="name" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Name
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="email" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Email
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="class" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Class
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="section" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Section
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="status" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Status
                </SortableTableHeader>
                <SortableTableHeader 
                  className="actions-column"
                >
                  Actions
                </SortableTableHeader>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key}>
                  <td className="cell-id">{row.id}</td>
                  <td className="cell-name">
                    <button
                      className="name-link"
                      onClick={() => navigate(`/students/${row.emailKey || row.id}`)}
                      title="View Profile"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="cell-email">{row.email}</td>
                  <td className="cell-small">{row.class}</td>
                  <td className="cell-small">{row.section}</td>
                  <td className="cell-status">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="cell-actions">
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/students/${row.emailKey || row.id}/edit`)}
                        title="Edit"
                        aria-label="Edit student"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => {
                          setDeleteEmail(row.emailKey);
                          setDeleteOpen(true);
                        }}
                        title="Delete"
                        aria-label="Delete student"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && sortedAndFilteredRows.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <Modal
        isOpen={deleteOpen}
        onRequestClose={() => !deleting && setDeleteOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-content">
          <h3>Delete Student</h3>
          <p>Are you sure you want to delete this student? This action cannot be undone.</p>
          {deleteError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{deleteError}</div>}
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="btn-danger"
              disabled={deleting}
              onClick={async () => {
                if (!deleteEmail) return;
                setDeleting(true);
                setDeleteError('');
                try {
                  const emailKey = encodeURIComponent(deleteEmail);
                  const url = getApiUrl(`/midland/admin/students/delete/${emailKey}`);
                  const res = await fetch(url, {
                    method: 'DELETE',
                    headers: getAuthHeaders(token)
                  });
                  
                  if (!res.ok) {
                    const errorText = await res.text().catch(() => '');
                    throw new Error(errorText || `Failed to delete: ${res.status}`);
                  }
                  
                  setDeleteOpen(false);
                  toast.success('Student deleted successfully');
                  fetchStudents();
                } catch (err) {
                  const errorMsg = err.message || 'Failed to delete student';
                  setDeleteError(errorMsg);
                  toast.error(errorMsg);
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

