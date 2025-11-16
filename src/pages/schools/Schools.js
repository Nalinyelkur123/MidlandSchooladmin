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
import { FiEdit2, FiTrash2, FiPlus, FiLayers, FiSearch, FiUpload, FiDownload } from 'react-icons/fi';
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
  const hasFetchedRef = React.useRef(false);
  const isEmptyRef = React.useRef(false);
  const { searchQuery, setSearchQuery, registerSearchHandler, unregisterSearchHandler } = useSearch();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const debouncedSearchRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [importing, setImporting] = useState(false);

  const fetchSchools = useCallback(async () => {
    // Don't refetch if we already fetched and data is empty
    if (hasFetchedRef.current && isEmptyRef.current) {
      return;
    }

    hasFetchedRef.current = true;
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
      const schoolsData = Array.isArray(data) ? data : [];
      
      // Only treat as empty data if we got a successful 200 OK response with empty array
      setSchools(schoolsData);
      setError(''); // Clear any previous errors
      isEmptyRef.current = schoolsData.length === 0;
    } catch (err) {
      const errorMsg = err.message || 'Failed to load schools';
      setError(errorMsg);
      toast.error(errorMsg);
      setSchools([]);
      isEmptyRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    // Reset fetch flags when token changes
    hasFetchedRef.current = false;
    isEmptyRef.current = false;
    fetchSchools();
  }, [fetchSchools, token]);

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
      { key: 'address', label: 'Address' },
      { key: 'status', label: 'Status' }
    ];
    exportToExcel(sortedAndFilteredRows, headers, `schools_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${sortedAndFilteredRows.length} school(s) to Excel`);
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
        'school id': 'id',
        'school code': 'id',
        'schoolcode': 'id',
        'name': 'name',
        'school name': 'name',
        'schoolname': 'name',
        'email': 'email',
        'school email': 'email',
        'schoolemail': 'email',
        'address': 'address',
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

      // Import each school
      let successCount = 0;
      let errorCount = 0;

      for (const row of validData) {
        try {
          const schoolData = {
            schoolCode: row.id || '',
            schoolName: row.name || '',
            email: row.email || '',
            address: row.address || '',
          };

          const url = getApiUrl('/midland/admin/schools/create');
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(schoolData),
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
            const errorData = await res.json().catch(() => ({}));
            console.error(`Failed to import school ${row.name}:`, errorData);
          }
        } catch (err) {
          errorCount++;
          console.error(`Error importing school ${row.name}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} school(s)`);
        // Refresh the list
        hasFetchedRef.current = false;
        fetchSchools();
      }

      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} school(s)`);
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
        <div className="header-main" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div>
            <h2>Schools</h2>
            <div className="meta">{loading ? 'Loading…' : `${sortedAndFilteredRows.length} school${sortedAndFilteredRows.length !== 1 ? 's' : ''}`}</div>
          </div>
          <div style={{ position: 'relative', flex: '0 0 300px', maxWidth: '300px' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              placeholder="Search schools..."
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
          <button className="btn-primary" onClick={() => navigate('/schools/create')}>
            <FiPlus size={18} style={{ marginRight: 8 }} />
            Add School
          </button>
        </div>
      </div>

      <div className="filters">
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FiLayers size={64} />
          </div>
          <h3 className="empty-state-title">Error Loading Schools</h3>
          <p className="empty-state-message">{error}</p>
          <button className="empty-state-action btn-secondary" onClick={() => {
            hasFetchedRef.current = false;
            isEmptyRef.current = false;
            fetchSchools();
          }}>
            Try Again
          </button>
        </div>
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
                  // Reset flags to allow fresh fetch after delete
                  hasFetchedRef.current = false;
                  isEmptyRef.current = false;
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

