import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiBriefcase } from 'react-icons/fi';
import { SkeletonTable } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import SortableTableHeader from '../../components/SortableTableHeader';

export default function Admins() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [designation, setDesignation] = useState('');
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = getApiUrl('/midland/admin/all');
      const res = await fetch(url, { 
        headers: getAuthHeaders(token)
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load admins: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err.message || 'Failed to load admins';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    try { Modal.setAppElement('#root'); } catch (_) {}
  }, []);

  const designations = useMemo(() => {
    return Array.from(new Set(admins.map(a => String(a.designation || '').trim()).filter(Boolean)));
  }, [admins]);

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedAndFilteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = admins
      .filter(a => {
        const name = String(a.fullName || a.firstName || a.lastName || '').toLowerCase();
        const email = String(a.email || a.schoolEmail || a.personalEmail || '').toLowerCase();
        const queryMatch = !q || name.includes(q) || email.includes(q);
        const desigMatch = !designation || String(a.designation || '') === designation;
        return queryMatch && desigMatch;
      })
      .map(a => ({
        key: a.email || a.schoolEmail || a.personalEmail || a.id || Math.random(),
        id: a.adminCode || a.id || a.email || a.schoolEmail || '-',
        name: a.fullName || a.firstName || a.lastName || '-',
        email: a.email || a.schoolEmail || a.personalEmail || '-',
        designation: a.designation || '-',
        schoolCode: a.schoolCode || '-',
        status: a.isActive !== undefined ? (a.isActive ? 'Active' : 'Inactive') : (a.status || 'Active'),
        emailKey: a.email || a.schoolEmail || a.personalEmail || a.id || '',
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
  }, [admins, query, designation, sortConfig]);

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
    <div className="page admins">
      <div className="page-header">
        <div className="header-main">
          <h2>Administrators</h2>
          <div className="meta">{loading ? 'Loading…' : `${sortedAndFilteredRows.length} admin${sortedAndFilteredRows.length !== 1 ? 's' : ''}`}</div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/create')}>
          <FiPlus size={18} style={{ marginRight: 8 }} />
          Add Admin
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
          <select value={designation} onChange={(e) => setDesignation(e.target.value)} className="filter-select">
            <option value="">All Designations</option>
            {designations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : sortedAndFilteredRows.length === 0 ? (
        <EmptyState 
          type="admins" 
          actionLabel="Add Admin"
          onAction={() => navigate('/admin/create')}
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
                  sortKey="designation" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Designation
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="schoolCode" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  School Code
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
                      onClick={() => {
                        const profileId = row.emailKey || row.id;
                        if (profileId && profileId !== '-') {
                          navigate(`/admin/${encodeURIComponent(profileId)}`);
                        }
                      }}
                      title="View Profile"
                      disabled={!row.emailKey || row.emailKey === '-'}
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="cell-email">{row.email}</td>
                  <td className="cell-small">{row.designation}</td>
                  <td className="cell-small">{row.schoolCode}</td>
                  <td className="cell-status">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="cell-actions">
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => {
                          const profileId = row.emailKey || row.id;
                          if (profileId && profileId !== '-') {
                            navigate(`/admin/${encodeURIComponent(profileId)}/edit`);
                          }
                        }}
                        title="Edit"
                        aria-label="Edit admin"
                        disabled={!row.emailKey || row.emailKey === '-'}
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
                        aria-label="Delete admin"
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
          <h3>Delete Administrator</h3>
          <p>Are you sure you want to delete this administrator? This action cannot be undone.</p>
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
                  const url = getApiUrl(`/midland/admin/delete/${emailKey}`);
                  const res = await fetch(url, {
                    method: 'DELETE',
                    headers: getAuthHeaders(token)
                  });
                  
                  if (!res.ok) {
                    const errorText = await res.text().catch(() => '');
                    throw new Error(errorText || `Failed to delete: ${res.status}`);
                  }
                  
                  setDeleteOpen(false);
                  toast.success('Administrator deleted successfully');
                  fetchAdmins();
                } catch (err) {
                  const errorMsg = err.message || 'Failed to delete admin';
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

