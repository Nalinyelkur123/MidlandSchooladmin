import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearch } from '../../context/SearchContext';
import { debounce } from '../../utils/debounce';
import { exportToExcel } from '../../utils/export';
import { readFileAsText, parseCSV, validateImportedData, normalizeFieldNames } from '../../utils/import';
import { FiEdit2, FiTrash2, FiPlus, FiBriefcase, FiUser, FiSearch, FiUpload, FiDownload } from 'react-icons/fi';
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
  const hasFetchedRef = React.useRef(false);
  const isEmptyRef = React.useRef(false);
  const { searchQuery, setSearchQuery, registerSearchHandler, unregisterSearchHandler } = useSearch();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const debouncedSearchRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [importing, setImporting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    // Don't refetch if we already fetched and data is empty
    if (hasFetchedRef.current && isEmptyRef.current) {
      return;
    }

    hasFetchedRef.current = true;
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
      const adminsData = Array.isArray(data) ? data : [];
      
      // Only treat as empty data if we got a successful 200 OK response with empty array
      setAdmins(adminsData);
      setError(''); // Clear any previous errors
      isEmptyRef.current = adminsData.length === 0;
    } catch (err) {
      const errorMsg = err.message || 'Failed to load admins';
      setError(errorMsg);
      toast.error(errorMsg);
      setAdmins([]);
      isEmptyRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    // Reset fetch flags when token changes
    hasFetchedRef.current = false;
    isEmptyRef.current = false;
    fetchAdmins();
  }, [fetchAdmins, token]);

  // Register search handler with context
  useEffect(() => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value) => {
        setQuery(value);
        setCurrentPage(1);
      }, 300);
    }
    const handler = (value) => {
      setLocalSearchQuery(value);
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current(value);
      }
    };
    registerSearchHandler(handler);
    return () => {
      unregisterSearchHandler();
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current = null;
      }
    };
  }, [registerSearchHandler, unregisterSearchHandler]);

  // Sync context search with local query
  useEffect(() => {
    if (debouncedSearchRef.current && searchQuery !== localSearchQuery) {
      debouncedSearchRef.current(searchQuery);
      setLocalSearchQuery(searchQuery);
    }
  }, [searchQuery, localSearchQuery]);

  useEffect(() => {
    try { Modal.setAppElement('#root'); } catch (_) {}
  }, []);

  // Export functions
  const handleExportExcel = () => {
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'designation', label: 'Designation' },
      { key: 'status', label: 'Status' }
    ];
    exportToExcel(sortedAndFilteredRows, headers, `admins_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${sortedAndFilteredRows.length} admin(s) to Excel`);
  };

  // Import functions
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    setImporting(true);
    try {
      const fileContent = await readFileAsText(file);
      const { data } = parseCSV(fileContent);

      if (data.length === 0) {
        toast.error('No data found in the file');
        return;
      }

      // Field mapping for common variations
      const fieldMapping = {
        'id': 'id',
        'admin id': 'id',
        'admin code': 'id',
        'admincode': 'id',
        'name': 'name',
        'full name': 'name',
        'fullname': 'name',
        'admin name': 'name',
        'email': 'email',
        'school email': 'email',
        'schoolemail': 'email',
        'designation': 'designation',
        'status': 'status',
      };

      const normalizedData = normalizeFieldNames(data, fieldMapping);

      // Validate data
      const requiredFields = ['name', 'email'];
      const { validData, errors } = validateImportedData(normalizedData, requiredFields, {
        email: (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) ? null : 'Invalid email format';
        }
      });

      if (errors.length > 0) {
        toast.error(`Import completed with ${errors.length} error(s). Check console for details.`);
        console.error('Import errors:', errors);
      }

      if (validData.length === 0) {
        toast.error('No valid data to import');
        return;
      }

      // Import each admin
      let successCount = 0;
      let errorCount = 0;

      for (const row of validData) {
        try {
          const adminData = {
            username: row.email?.split('@')[0] || row.id || `admin_${Date.now()}`,
            password: 'TempPassword123!',
            fullName: row.name || '',
            schoolEmail: row.email || '',
            designation: row.designation || '',
          };

          const url = getApiUrl('/midland/admin/create');
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adminData),
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
            const errorData = await res.json().catch(() => ({}));
            console.error(`Failed to import admin ${row.name}:`, errorData);
          }
        } catch (err) {
          errorCount++;
          console.error(`Error importing admin ${row.name}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} admin(s)`);
        // Refresh the list
        hasFetchedRef.current = false;
        fetchAdmins();
      }

      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} admin(s)`);
      }
    } catch (error) {
      toast.error(`Failed to import file: ${error.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
        <div className="header-main" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div>
            <h2>Administrators</h2>
            <div className="meta">{loading ? 'Loading…' : `${sortedAndFilteredRows.length} admin${sortedAndFilteredRows.length !== 1 ? 's' : ''}`}</div>
          </div>
          <div style={{ position: 'relative', flex: '0 0 300px', maxWidth: '300px' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--color-border-strong)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--color-surface)',
                color: 'var(--color-text-default)',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleExportExcel} title="Export all to Excel">
            <FiDownload size={18} style={{ marginRight: 8 }} />
            Export Excel
          </button>
          <button className="btn-secondary" onClick={handleImportClick} disabled={importing} title="Import from CSV/Excel">
            <FiUpload size={18} style={{ marginRight: 8 }} />
            {importing ? 'Importing...' : 'Import CSV/Excel'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <button className="btn-primary" onClick={() => navigate('/admin/create')}>
            <FiPlus size={18} style={{ marginRight: 8 }} />
            Add Admin
          </button>
        </div>
      </div>

      <div className="filters">
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
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FiUser size={64} />
          </div>
          <h3 className="empty-state-title">Error Loading Administrators</h3>
          <p className="empty-state-message">{error}</p>
          <button className="empty-state-action btn-secondary" onClick={() => {
            hasFetchedRef.current = false;
            isEmptyRef.current = false;
            fetchAdmins();
          }}>
            Try Again
          </button>
        </div>
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
                  // Reset flags to allow fresh fetch after delete
                  hasFetchedRef.current = false;
                  isEmptyRef.current = false;
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

