import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearch } from '../../context/SearchContext';
import { FiEdit2, FiTrash2, FiPlus, FiBriefcase, FiTag, FiUserCheck, FiDownload, FiX, FiSearch, FiUpload } from 'react-icons/fi';
import { SkeletonTable } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import SortableTableHeader from '../../components/SortableTableHeader';
import DateRangeFilter from '../../components/DateRangeFilter';
import { debounce } from '../../utils/debounce';
import { exportToExcel } from '../../utils/export';
import { readFileAsText, parseCSV, validateImportedData, normalizeFieldNames } from '../../utils/import';
import '../../components/DateRangeFilter.css';

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
  const hasFetchedRef = React.useRef(false);
  const isEmptyRef = React.useRef(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const { searchQuery, setSearchQuery, registerSearchHandler, unregisterSearchHandler } = useSearch();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [dobDateRange, setDobDateRange] = useState({ startDate: '', endDate: '' });
  const debouncedSearchRef = useRef(null);
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const fetchTeachers = useCallback(async () => {
    // Don't refetch if we already fetched and data is empty
    if (hasFetchedRef.current && isEmptyRef.current) {
      return;
    }

    hasFetchedRef.current = true;
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
      const teachersData = Array.isArray(data) ? data : [];
      
      // Only treat as empty data if we got a successful 200 OK response with empty array
      setTeachers(teachersData);
      setError(''); // Clear any previous errors
      isEmptyRef.current = teachersData.length === 0;
    } catch (err) {
      const errorMsg = err.message || 'Failed to load teachers';
      setError(errorMsg);
      toast.error(errorMsg);
      setTeachers([]);
      isEmptyRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    // Reset fetch flags when token changes
    hasFetchedRef.current = false;
    isEmptyRef.current = false;
    fetchTeachers();
  }, [fetchTeachers, token]);

  // Register search handler with context
  useEffect(() => {
    const handler = (value) => {
      setLocalSearchQuery(value);
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current(value);
      }
    };
    registerSearchHandler(handler);
    return () => {
      unregisterSearchHandler();
    };
  }, [registerSearchHandler, unregisterSearchHandler]);

  // Debounced search
  useEffect(() => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value) => {
        setQuery(value);
        setCurrentPage(1);
      }, 300);
    }
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current = null;
      }
    };
  }, []);

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

  // Bulk operations
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allKeys = new Set(rows.map(row => row.key));
      setSelectedItems(allKeys);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (key) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to delete');
      return;
    }
    // Get email keys for selected items
    const selectedEmails = sortedAndFilteredRows
      .filter(row => selectedItems.has(row.key))
      .map(row => row.emailKey)
      .filter(Boolean);
    if (selectedEmails.length === 0) {
      toast.error('Selected items do not have valid email addresses');
      return;
    }
    setDeleteEmail(selectedEmails.join(','));
    setDeleteOpen(true);
  };

  // Export functions
  const handleExportExcel = () => {
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'status', label: 'Status' }
    ];
    const dataToExport = selectedItems.size > 0
      ? sortedAndFilteredRows.filter(row => selectedItems.has(row.key))
      : sortedAndFilteredRows;
    exportToExcel(dataToExport, headers, `teachers_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${dataToExport.length} teacher(s) to Excel`);
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
        'teacher id': 'id',
        'teacher code': 'id',
        'teachercode': 'id',
        'name': 'name',
        'full name': 'name',
        'fullname': 'name',
        'teacher name': 'name',
        'email': 'email',
        'school email': 'email',
        'schoolemail': 'email',
        'department': 'department',
        'dept': 'department',
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

      // Import each teacher
      let successCount = 0;
      let errorCount = 0;

      for (const row of validData) {
        try {
          const teacherData = {
            username: row.email?.split('@')[0] || row.id || `teacher_${Date.now()}`,
            password: 'TempPassword123!',
            fullName: row.name || '',
            schoolEmail: row.email || '',
            department: row.department || '',
            designation: row.designation || '',
            teacherCode: row.id || '',
          };

          const url = getApiUrl('/midland/admin/teachers/create');
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(teacherData),
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
            const errorData = await res.json().catch(() => ({}));
            console.error(`Failed to import teacher ${row.name}:`, errorData);
          }
        } catch (err) {
          errorCount++;
          console.error(`Error importing teacher ${row.name}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} teacher(s)`);
        // Refresh the list
        hasFetchedRef.current = false;
        fetchTeachers();
      }

      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} teacher(s)`);
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

  // Filter management
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count++;
    if (department) count++;
    if (designation) count++;
    if (dobDateRange.startDate || dobDateRange.endDate) count++;
    return count;
  }, [query, department, designation, dobDateRange]);

  const handleClearFilters = () => {
    setQuery('');
    setSearchQuery('');
    setLocalSearchQuery('');
    setDepartment('');
    setDesignation('');
    setDobDateRange({ startDate: '', endDate: '' });
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
        
        // Date range filter for date of birth
        let dateMatch = true;
        if (dobDateRange.startDate || dobDateRange.endDate) {
          const dob = t.dateOfBirth ? new Date(t.dateOfBirth) : null;
          if (dob) {
            if (dobDateRange.startDate) {
              const startDate = new Date(dobDateRange.startDate);
              startDate.setHours(0, 0, 0, 0);
              if (dob < startDate) {
                dateMatch = false;
              }
            }
            if (dobDateRange.endDate && dateMatch) {
              const endDate = new Date(dobDateRange.endDate);
              endDate.setHours(23, 59, 59, 999);
              if (dob > endDate) {
                dateMatch = false;
              }
            }
          } else {
            dateMatch = false; // If no date of birth, exclude if filter is set
          }
        }
        
        return queryMatch && deptMatch && desigMatch && dateMatch;
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
  }, [teachers, query, department, designation, dobDateRange, sortConfig]);

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
        <div className="header-main" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div>
            <h2>Teachers</h2>
            <div className="meta">
              {loading ? 'Loading…' : `${sortedAndFilteredRows.length} teacher${sortedAndFilteredRows.length !== 1 ? 's' : ''}`}
              {activeFilterCount > 0 && (
                <span style={{ marginLeft: '12px', color: 'var(--color-primary)' }}>
                  ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)
                </span>
              )}
            </div>
          </div>
          <div style={{ position: 'relative', flex: '0 0 300px', maxWidth: '300px' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              placeholder="Search teachers..."
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
          {selectedItems.size > 0 && (
            <>
              <button className="btn-danger" onClick={handleBulkDelete} title="Delete selected">
                <FiTrash2 size={18} style={{ marginRight: 8 }} />
                Delete ({selectedItems.size})
              </button>
            </>
          )}
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
          <button className="btn-primary" onClick={() => navigate('/teachers/create')}>
            <FiPlus size={18} style={{ marginRight: 8 }} />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="filters">
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
        <DateRangeFilter
          label="Date of Birth"
          startDate={dobDateRange.startDate}
          endDate={dobDateRange.endDate}
          onChange={setDobDateRange}
          fieldName="dob"
        />
        {activeFilterCount > 0 && (
          <button 
            className="btn-secondary" 
            onClick={handleClearFilters}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              whiteSpace: 'nowrap', 
              width: '100%', 
              minWidth: 0,
              padding: '10px 16px',
              fontSize: '14px',
              minHeight: 'auto',
              height: 'auto'
            }}
            title="Clear all filters"
            aria-label="Clear all filters"
          >
            <FiX size={16} />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FiUserCheck size={64} />
          </div>
          <h3 className="empty-state-title">Error Loading Teachers</h3>
          <p className="empty-state-message">{error}</p>
          <button className="empty-state-action btn-secondary" onClick={() => {
            hasFetchedRef.current = false;
            isEmptyRef.current = false;
            fetchTeachers();
          }}>
            Try Again
          </button>
        </div>
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
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every(row => selectedItems.has(row.key))}
                    onChange={handleSelectAll}
                    title="Select all"
                  />
                </th>
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
                  <td style={{ textAlign: 'center', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(row.key)}
                      onChange={() => handleSelectItem(row.key)}
                      title="Select row"
                    />
                  </td>
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
          <h3>{deleteEmail.includes(',') ? 'Delete Multiple Teachers' : 'Delete Teacher'}</h3>
          <p>
            {deleteEmail.includes(',') 
              ? `Are you sure you want to delete ${deleteEmail.split(',').length} selected teacher(s)? This action cannot be undone.`
              : 'Are you sure you want to delete this teacher? This action cannot be undone.'}
          </p>
          {deleteError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{deleteError}</div>}
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteEmail('');
                setSelectedItems(new Set());
              }}
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
                  const emails = deleteEmail.includes(',') ? deleteEmail.split(',') : [deleteEmail];
                  let successCount = 0;
                  let failCount = 0;
                  
                  for (const email of emails) {
                    try {
                      const emailKey = encodeURIComponent(email);
                      const url = getApiUrl(`/midland/admin/teachers/delete/${emailKey}`);
                      const res = await fetch(url, {
                        method: 'DELETE',
                        headers: getAuthHeaders(token)
                      });
                      
                      if (res.ok) {
                        successCount++;
                      } else {
                        failCount++;
                      }
                    } catch (err) {
                      failCount++;
                    }
                  }
                  
                  setDeleteOpen(false);
                  setDeleteEmail('');
                  setSelectedItems(new Set());
                  
                  if (successCount > 0) {
                    toast.success(`${successCount} teacher(s) deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
                  } else {
                    toast.error('Failed to delete teachers');
                  }
                  
                  // Reset flags to allow fresh fetch after delete
                  hasFetchedRef.current = false;
                  isEmptyRef.current = false;
                  fetchTeachers();
                } catch (err) {
                  const errorMsg = err.message || 'Failed to delete teacher(s)';
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

