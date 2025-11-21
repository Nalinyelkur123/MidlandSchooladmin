import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchAllPaginatedItems } from '../../utils/api';
import { useSearch } from '../../context/SearchContext';
import { FiEdit2, FiTrash2, FiPlus, FiBook, FiHash, FiUsers, FiDownload, FiX, FiSearch, FiUpload } from 'react-icons/fi';
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
  const hasFetchedRef = React.useRef(false);
  const isEmptyRef = React.useRef(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const { searchQuery, setSearchQuery, registerSearchHandler, unregisterSearchHandler } = useSearch();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [admissionDateRange, setAdmissionDateRange] = useState({ startDate: '', endDate: '' });
  const debouncedSearchRef = useRef(null);
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const fetchStudents = useCallback(async () => {
    // Don't refetch if we already fetched and data is empty
    if (hasFetchedRef.current && isEmptyRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    setLoading(true);
    setError('');
    try {
      const allStudents = await fetchAllPaginatedItems(
        '/midland/admin/students/all',
        token,
        getApiUrl,
        getAuthHeaders
      );
      
      setStudents(allStudents);
      setError('');
      isEmptyRef.current = allStudents.length === 0;
    } catch (err) {
      const errorMsg = err.message || 'Failed to load students';
      if (err.message && (err.message.includes('CORS') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError('CORS error: The backend at http://4.237.122.143.nip.io needs to allow requests from your frontend origin. Please configure CORS headers on the backend.');
        toast.error('Failed to load students. Please check your connection.');
      } else {
        setError(errorMsg);
        toast.error(errorMsg);
      }
      setStudents([]);
      isEmptyRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    // Reset fetch flags when token changes
    hasFetchedRef.current = false;
    isEmptyRef.current = false;
    fetchStudents();
  }, [fetchStudents, token]);

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
      { key: 'class', label: 'Class' },
      { key: 'section', label: 'Section' },
      { key: 'status', label: 'Status' }
    ];
    const dataToExport = selectedItems.size > 0
      ? sortedAndFilteredRows.filter(row => selectedItems.has(row.key))
      : sortedAndFilteredRows;
    exportToExcel(dataToExport, headers, `students_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${dataToExport.length} student(s) to Excel`);
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
        'student id': 'id',
        'admission number': 'id',
        'admissionnumber': 'id',
        'name': 'name',
        'full name': 'name',
        'fullname': 'name',
        'student name': 'name',
        'email': 'email',
        'school email': 'email',
        'schoolemail': 'email',
        'class': 'class',
        'grade': 'class',
        'grade level': 'class',
        'gradelevel': 'class',
        'section': 'section',
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

      // Import each student
      let successCount = 0;
      let errorCount = 0;

      for (const row of validData) {
        try {
          const studentData = {
            username: row.email?.split('@')[0] || row.id || `student_${Date.now()}`,
            password: 'TempPassword123!',
            fullName: row.name || '',
            schoolEmail: row.email || '',
            gradeLevel: row.class || '',
            section: row.section || '',
            admissionNumber: row.id || '',
            status: row.status || 'Active',
          };

          const url = getApiUrl('/midland/admin/students/create');
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData),
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
            const errorData = await res.json().catch(() => ({}));
            console.error(`Failed to import student ${row.name}:`, errorData);
          }
        } catch (err) {
          errorCount++;
          console.error(`Error importing student ${row.name}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} student(s)`);
        // Refresh the list
        hasFetchedRef.current = false;
        fetchStudents();
      }

      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} student(s)`);
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
    if (klass) count++;
    if (section) count++;
    if (admissionDateRange.startDate || admissionDateRange.endDate) count++;
    return count;
  }, [query, klass, section, admissionDateRange]);

  const handleClearFilters = () => {
    setQuery('');
    setSearchQuery('');
    setLocalSearchQuery('');
    setKlass('');
    setSection('');
    setAdmissionDateRange({ startDate: '', endDate: '' });
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
        
        // Date range filter for admission date
        let dateMatch = true;
        if (admissionDateRange.startDate || admissionDateRange.endDate) {
          const admissionDate = s.admissionDate ? new Date(s.admissionDate) : null;
          if (admissionDate) {
            if (admissionDateRange.startDate) {
              const startDate = new Date(admissionDateRange.startDate);
              startDate.setHours(0, 0, 0, 0);
              if (admissionDate < startDate) {
                dateMatch = false;
              }
            }
            if (admissionDateRange.endDate && dateMatch) {
              const endDate = new Date(admissionDateRange.endDate);
              endDate.setHours(23, 59, 59, 999);
              if (admissionDate > endDate) {
                dateMatch = false;
              }
            }
          } else {
            dateMatch = false; // If no admission date, exclude if filter is set
          }
        }
        
        return queryMatch && classMatch && sectionMatch && dateMatch;
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
  }, [students, query, klass, section, admissionDateRange, sortConfig]);

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
        <div className="header-main" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div>
          <h2>Students</h2>
            <div className="meta">
              {loading ? 'Loading…' : `${sortedAndFilteredRows.length} student${sortedAndFilteredRows.length !== 1 ? 's' : ''}`}
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
              placeholder="Search students..."
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
              <button className="btn-danger btn-compact" onClick={handleBulkDelete} title="Delete selected">
                <FiTrash2 size={18} style={{ marginRight: 6 }} />
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
        <button className="btn-primary" onClick={() => navigate('/students/create')}>
          <FiPlus size={18} style={{ marginRight: 8 }} />
          Add Student
        </button>
        </div>
      </div>

      <div className="filters">
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
        <DateRangeFilter
          label="Admission Date"
          startDate={admissionDateRange.startDate}
          endDate={admissionDateRange.endDate}
          onChange={setAdmissionDateRange}
          fieldName="admission"
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
        <SkeletonTable rows={5} columns={7} />
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FiUsers size={64} />
          </div>
          <h3 className="empty-state-title">Error Loading Students</h3>
          <p className="empty-state-message">{error}</p>
          <button className="empty-state-action btn-secondary" onClick={() => {
            hasFetchedRef.current = false;
            isEmptyRef.current = false;
            fetchStudents();
          }}>
            Try Again
          </button>
        </div>
      ) : sortedAndFilteredRows.length === 0 ? (
        <EmptyState 
          type="students" 
          actionLabel="Add Student"
          onAction={() => navigate('/students/create')}
        />
      ) : (
        <div className="table-container" role="region" aria-label="Students table">
          <table className="data-table" role="table" aria-label="Students data table">
            <thead>
              <tr role="row">
                <th style={{ width: '40px', textAlign: 'center' }} role="columnheader" aria-label="Select all rows">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every(row => selectedItems.has(row.key))}
                    onChange={handleSelectAll}
                    title="Select all"
                    aria-label="Select all students"
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
              {rows.map((row, index) => (
                <tr 
                  key={row.key} 
                  role="row"
                  tabIndex={0}
                  aria-label={`Student ${row.name}, ${row.email}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/students/${row.emailKey || row.id}`);
                    } else if (e.key === 'ArrowDown' && index < rows.length - 1) {
                      e.preventDefault();
                      const nextRow = document.querySelector(`tr[data-row-index="${index + 1}"]`);
                      nextRow?.focus();
                    } else if (e.key === 'ArrowUp' && index > 0) {
                      e.preventDefault();
                      const prevRow = document.querySelector(`tr[data-row-index="${index - 1}"]`);
                      prevRow?.focus();
                    }
                  }}
                  data-row-index={index}
                >
                  <td style={{ textAlign: 'center', width: '40px' }} role="gridcell">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(row.key)}
                      onChange={() => handleSelectItem(row.key)}
                      title="Select row"
                      aria-label={`Select ${row.name}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="cell-id" role="gridcell">{row.id}</td>
                  <td className="cell-name" role="gridcell">
                    <button
                      className="name-link"
                      onClick={() => navigate(`/students/${row.emailKey || row.id}`)}
                      title="View Profile"
                      aria-label={`View profile for ${row.name}`}
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="cell-email" role="gridcell">{row.email}</td>
                  <td className="cell-small" role="gridcell">{row.class}</td>
                  <td className="cell-small" role="gridcell">{row.section}</td>
                  <td className="cell-status" role="gridcell">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="cell-actions" role="gridcell">
                    <div className="action-buttons" role="group" aria-label={`Actions for ${row.name}`}>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/students/${row.emailKey || row.id}/edit`);
                        }}
                        title="Edit"
                        aria-label={`Edit ${row.name}`}
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteEmail(row.emailKey);
                          setDeleteOpen(true);
                        }}
                        title="Delete"
                        aria-label={`Delete ${row.name}`}
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
          <h3>{deleteEmail.includes(',') ? 'Delete Multiple Students' : 'Delete Student'}</h3>
          <p>
            {deleteEmail.includes(',') 
              ? `Are you sure you want to delete ${deleteEmail.split(',').length} selected student(s)? This action cannot be undone.`
              : 'Are you sure you want to delete this student? This action cannot be undone.'}
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
                  const url = getApiUrl(`/midland/admin/students/delete/${emailKey}`);
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
                    toast.success(`${successCount} student(s) deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
                  } else {
                    toast.error('Failed to delete students');
                  }
                  
                  // Reset flags to allow fresh fetch after delete
                  hasFetchedRef.current = false;
                  isEmptyRef.current = false;
                  fetchStudents();
                } catch (err) {
                  const errorMsg = err.message || 'Failed to delete student(s)';
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

