import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearch } from '../../context/SearchContext';
import { FiEdit2, FiTrash2, FiPlus, FiBook, FiHash, FiX, FiSearch } from 'react-icons/fi';
import { SkeletonTable } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import SortableTableHeader from '../../components/SortableTableHeader';
import { debounce } from '../../utils/debounce';

export default function Subjects() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const { searchQuery, setSearchQuery, registerSearchHandler, unregisterSearchHandler } = useSearch();
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({ key: 'subjectName', direction: 'asc' });
  const hasFetchedRef = React.useRef(false);
  const isEmptyRef = React.useRef(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const debouncedSearchRef = useRef(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', itemsPerPage.toString());
      
      // Add sorting if configured
      if (sortConfig.key) {
        const sortBy = sortConfig.key;
        params.append('sortBy', sortBy);
        // Note: API might not support direction, but we'll include it if needed
      }
      
      const path = `/midland/users/subjects/all?${params.toString()}`;
      const url = getApiUrl(path);
      const res = await fetch(url, { 
        headers: getAuthHeaders(token)
      });
      
      if (!res.ok) {
        throw new Error(`Request failed ${res.status}`);
      }
      
      const data = await res.json();
      
      // Handle paginated response
      let subjectsData = [];
      if (data && Array.isArray(data)) {
        // Direct array response (fallback)
        subjectsData = data;
        setTotalPages(1);
        setTotalElements(data.length);
      } else if (data && Array.isArray(data.content)) {
        // Paginated response
        subjectsData = data.content;
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } else if (data && data.data && Array.isArray(data.data)) {
        // Alternative paginated response format
        subjectsData = data.data;
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      }
      
      setSubjects(subjectsData);
      setError('');
      isEmptyRef.current = subjectsData.length === 0;
    } catch (err) {
      const errorMsg = err.message || 'Failed to load subjects';
      setError(errorMsg);
      setSubjects([]);
      isEmptyRef.current = true;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token, toast, currentPage, itemsPerPage, sortConfig]);

  useEffect(() => {
    hasFetchedRef.current = false;
    isEmptyRef.current = false;
    fetchSubjects();
  }, [fetchSubjects]);

  // Debounced search
  useEffect(() => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value) => {
        setQuery(value);
        setCurrentPage(0); // Reset to first page on search
      }, 300);
    }
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current = null;
      }
    };
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync context search with local query
  useEffect(() => {
    if (debouncedSearchRef.current && searchQuery !== localSearchQuery) {
      debouncedSearchRef.current(searchQuery);
      setLocalSearchQuery(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    try { Modal.setAppElement('#root'); } catch (_) {}
  }, []);

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

  const grades = useMemo(() => Array.from(new Set(subjects.map(s => String(s.gradeLevel || '').trim()).filter(Boolean))), [subjects]);
  const curricula = useMemo(() => Array.from(new Set(subjects.map(s => String(s.curriculumType || '').trim()).filter(Boolean))), [subjects]);

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
    setCurrentPage(0); // Reset to first page when sorting changes
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count++;
    if (grade) count++;
    if (curriculum) count++;
    return count;
  }, [query, grade, curriculum]);

  const handleClearFilters = () => {
    setQuery('');
    setSearchQuery('');
    setLocalSearchQuery('');
    setGrade('');
    setCurriculum('');
    setCurrentPage(0);
  };

  // Client-side filtering (since API might not support all filters)
  const filteredRows = useMemo(() => {
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
        schoolCode: s.schoolCode || '-',
      }));
  }, [subjects, query, grade, curriculum]);

  const rows = filteredRows;

  // Update page if current page exceeds available pages
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  return (
    <div className="page subjects">
      <div className="page-header">
        <div className="header-main" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div>
            <h2>Subjects</h2>
            <div className="meta">
              {loading ? 'Loading…' : `${totalElements || filteredRows.length} subject${(totalElements || filteredRows.length) !== 1 ? 's' : ''}`}
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
              placeholder="Search subjects..."
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
          <button className="btn-primary" onClick={() => navigate('/subjects/create')}>
            <FiPlus size={18} style={{ marginRight: 8 }} />
            Add Subject
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filter-select-wrapper">
          <FiHash className="filter-icon" />
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="filter-select">
            <option value="">All Grades</option>
            {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
        <div className="filter-select-wrapper">
          <FiBook className="filter-icon" />
          <select value={curriculum} onChange={(e) => setCurriculum(e.target.value)} className="filter-select">
            <option value="">All Curricula</option>
            {curricula.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
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
        <SkeletonTable rows={5} columns={6} />
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FiBook size={64} />
          </div>
          <h3 className="empty-state-title">Error Loading Subjects</h3>
          <p className="empty-state-message">{error}</p>
          <button className="empty-state-action btn-secondary" onClick={() => {
            hasFetchedRef.current = false;
            isEmptyRef.current = false;
            fetchSubjects();
          }}>
            Try Again
          </button>
        </div>
      ) : filteredRows.length === 0 ? (
        <EmptyState type="subjects" />
      ) : (
        <div className="table-container" role="region" aria-label="Subjects table">
          <table className="data-table" role="table" aria-label="Subjects data table">
            <thead>
              <tr role="row">
                <SortableTableHeader 
                  sortKey="subjectName" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Subject Name
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="subjectCode" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Subject Code
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="gradeLevel" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Grade Level
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="curriculumType" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Curriculum
                </SortableTableHeader>
                <SortableTableHeader 
                  sortKey="teacherCode" 
                  currentSort={sortConfig} 
                  onSort={handleSort}
                >
                  Teacher Code
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
                  aria-label={`Subject ${row.subjectName}, ${row.subjectCode}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Could navigate to subject detail if needed
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
                  <td className="cell-name" role="gridcell">{row.subjectName}</td>
                  <td className="cell-id" role="gridcell">{row.subjectCode}</td>
                  <td className="cell-small" role="gridcell">{row.gradeLevel}</td>
                  <td className="cell-small" role="gridcell">{row.curriculumType}</td>
                  <td className="cell-small" role="gridcell">{row.teacherCode}</td>
                  <td className="cell-actions" role="gridcell">
                    <div className="action-buttons" role="group" aria-label={`Actions for ${row.subjectName}`}>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/subjects/${encodeURIComponent(row.subjectCode)}/edit`);
                        }}
                        title="Edit"
                        aria-label={`Edit ${row.subjectName}`}
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCode(row.subjectCode);
                          setDeleteOpen(true);
                        }}
                        title="Delete"
                        aria-label={`Delete ${row.subjectName}`}
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

      {!loading && filteredRows.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage + 1}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page - 1)}
        />
      )}

      <Modal
        isOpen={deleteOpen}
        onRequestClose={() => !deleting && setDeleteOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-content">
          <h3>Delete Subject</h3>
          <p>Are you sure you want to delete this subject? This action cannot be undone.</p>
          {deleteError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{deleteError}</div>}
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteCode('');
              }}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="btn-danger"
              disabled={deleting}
              onClick={async () => {
                if (!deleteCode) return;
                setDeleting(true);
                setDeleteError('');
                try {
                  const codeKey = encodeURIComponent(deleteCode);
                  const url = getApiUrl(`/midland/users/subjects/delete/${codeKey}`);
                  const res = await fetch(url, {
                    method: 'DELETE',
                    headers: getAuthHeaders(token)
                  });
                  
                  if (!res.ok) {
                    const errorText = await res.text().catch(() => '');
                    throw new Error(errorText || `Failed to delete: ${res.status}`);
                  }
                  
                  setDeleteOpen(false);
                  setDeleteCode('');
                  toast.success('Subject deleted successfully');
                  hasFetchedRef.current = false;
                  isEmptyRef.current = false;
                  fetchSubjects();
                } catch (err) {
                  const errorMsg = err.message || 'Failed to delete subject';
                  setDeleteError(errorMsg);
                  toast.error(errorMsg);
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
