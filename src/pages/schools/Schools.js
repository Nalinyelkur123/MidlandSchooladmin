import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import { SkeletonTable } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import SortableTableHeader from '../../components/SortableTableHeader';

export default function Schools() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = getApiUrl('/midland/admin/schools/all');
      const res = await fetch(url, { 
        headers: getAuthHeaders(token)
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load schools: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setSchools(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err.message || 'Failed to load schools';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    try { Modal.setAppElement('#root'); } catch (_) {}
  }, []);

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedAndFilteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = schools
      .filter(s => {
        const code = String(s.schoolCode || '').toLowerCase();
        const name = String(s.schoolName || s.name || '').toLowerCase();
        const email = String(s.email || s.schoolEmail || '').toLowerCase();
        const queryMatch = !q || code.includes(q) || name.includes(q) || email.includes(q);
        return queryMatch;
      })
      .map(s => ({
        key: s.schoolCode || s.id || Math.random(),
        id: s.schoolCode || s.id || '-',
        name: s.schoolName || s.name || '-',
        email: s.email || s.schoolEmail || '-',
        address: s.address || '-',
        status: s.isActive !== undefined ? (s.isActive ? 'Active' : 'Inactive') : (s.status || 'Active'),
        schoolCode: s.schoolCode || '-',
        schoolId: s.schoolCode || s.id || '',
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
  }, [schools, query, sortConfig]);

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
    <div className="page schools">
      <div className="page-header">
        <div className="header-main">
          <h2>Schools</h2>
          <div className="meta">{loading ? 'Loading…' : `${sortedAndFilteredRows.length} school${sortedAndFilteredRows.length !== 1 ? 's' : ''}`}</div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/schools/create')}>
          <FiPlus size={18} style={{ marginRight: 8 }} />
          Add School
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <div className="filter-input-wrapper">
          <FiSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Search by code, name, or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="filter-input"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : sortedAndFilteredRows.length === 0 ? (
        <EmptyState 
          type="schools" 
          actionLabel="Add School"
          onAction={() => navigate('/schools/create')}
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
                  School Code
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
                  sortKey="address" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Address
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
                        const profileId = row.schoolId || row.id;
                        if (profileId && profileId !== '-') {
                          navigate(`/schools/${encodeURIComponent(profileId)}`);
                        }
                      }}
                      title="View Profile"
                      disabled={!row.schoolId || row.schoolId === '-'}
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="cell-email">{row.email}</td>
                  <td className="cell-small">{row.address}</td>
                  <td className="cell-status">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="cell-actions">
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => {
                          const profileId = row.schoolId || row.id;
                          if (profileId && profileId !== '-') {
                            navigate(`/schools/${encodeURIComponent(profileId)}/edit`);
                          }
                        }}
                        title="Edit"
                        aria-label="Edit school"
                        disabled={!row.schoolId || row.schoolId === '-'}
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => {
                          setDeleteId(row.schoolId);
                          setDeleteOpen(true);
                        }}
                        title="Delete"
                        aria-label="Delete school"
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
          <h3>Delete School</h3>
          <p>Are you sure you want to delete this school? This action cannot be undone.</p>
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
                if (!deleteId) return;
                setDeleting(true);
                setDeleteError('');
                try {
                  const idKey = encodeURIComponent(deleteId);
                  const url = getApiUrl(`/midland/admin/schools/delete/${idKey}`);
                  const res = await fetch(url, {
                    method: 'DELETE',
                    headers: getAuthHeaders(token)
                  });
                  
                  if (!res.ok) {
                    const errorText = await res.text().catch(() => '');
                    throw new Error(errorText || `Failed to delete: ${res.status}`);
                  }
                  
                  setDeleteOpen(false);
                  toast.success('School deleted successfully');
                  fetchSchools();
                } catch (err) {
                  const errorMsg = err.message || 'Failed to delete school';
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

