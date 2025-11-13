import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiBriefcase, FiTag } from 'react-icons/fi';
import { SkeletonTable } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import SortableTableHeader from '../../components/SortableTableHeader';

export default function Teachers() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = getApiUrl('/midland/admin/teachers/all');
      const res = await fetch(url, { 
        headers: getAuthHeaders(token)
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load teachers: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err.message || 'Failed to load teachers';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    try { Modal.setAppElement('#root'); } catch (_) {}
  }, []);

  const departments = useMemo(() => {
    return Array.from(new Set(teachers.map(t => String(t.department || '').trim()).filter(Boolean)));
  }, [teachers]);

  const designations = useMemo(() => {
    return Array.from(new Set(teachers.map(t => String(t.designation || '').trim()).filter(Boolean)));
  }, [teachers]);

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedAndFilteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = teachers
      .filter(t => {
        const name = String(t.fullName || '').toLowerCase();
        const email = String(t.schoolEmail || t.personalEmail || '').toLowerCase();
        const queryMatch = !q || name.includes(q) || email.includes(q);
        const deptMatch = !department || String(t.department || '') === department;
        const desigMatch = !designation || String(t.designation || '') === designation;
        return queryMatch && deptMatch && desigMatch;
      })
      .map(t => ({
        key: t.teacherCode || t.schoolEmail || Math.random(),
        id: t.teacherCode || t.schoolEmail || '-',
        name: t.fullName || '-',
        email: t.schoolEmail || t.personalEmail || '-',
        department: t.department || '-',
        designation: t.designation || '-',
        status: t.status || 'Active',
        emailKey: t.schoolEmail || t.personalEmail || '',
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
  }, [teachers, query, department, designation, sortConfig]);

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
    <div className="page teachers">
      <div className="page-header">
        <div className="header-main">
          <h2>Teachers</h2>
          <div className="meta">{loading ? 'Loading…' : `${sortedAndFilteredRows.length} teacher${sortedAndFilteredRows.length !== 1 ? 's' : ''}`}</div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/teachers/create')}>
          <FiPlus size={18} style={{ marginRight: 8 }} />
          Add Teacher
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <div className="filter-input-wrapper">
          <FiSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-select-wrapper">
          <FiBriefcase className="filter-icon" />
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="filter-select">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="filter-select-wrapper">
          <FiTag className="filter-icon" />
          <select value={designation} onChange={(e) => setDesignation(e.target.value)} className="filter-select">
            <option value="">All Designations</option>
            {designations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : sortedAndFilteredRows.length === 0 ? (
        <EmptyState 
          type="teachers" 
          actionLabel="Add Teacher"
          onAction={() => navigate('/teachers/create')}
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
                  sortKey="department" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Department
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="designation" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Designation
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
                      onClick={() => navigate(`/teachers/${row.emailKey || row.id}`)}
                      title="View Profile"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="cell-email">{row.email}</td>
                  <td className="cell-small">{row.department}</td>
                  <td className="cell-small">{row.designation}</td>
                  <td className="cell-status">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="cell-actions">
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/teachers/${row.emailKey || row.key}/edit`)}
                        title="Edit"
                        aria-label="Edit teacher"
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
                        aria-label="Delete teacher"
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
          <h3>Delete Teacher</h3>
          <p>Are you sure you want to delete this teacher? This action cannot be undone.</p>
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
                  const url = getApiUrl(`/midland/admin/teachers/delete/${emailKey}`);
                  const res = await fetch(url, {
                    method: 'DELETE',
                    headers: getAuthHeaders(token)
                  });
                  
                  if (!res.ok) {
                    const errorText = await res.text().catch(() => '');
                    throw new Error(errorText || `Failed to delete: ${res.status}`);
                  }
                  
                  setDeleteOpen(false);
                  fetchTeachers();
                } catch (err) {
                  setDeleteError(err.message || 'Failed to delete teacher');
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

