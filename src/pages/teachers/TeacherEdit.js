import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchAllPaginatedItems } from '../../utils/api';
import { useSearch } from '../../context/SearchContext';
import { FiArrowLeft, FiUser, FiBriefcase, FiMail, FiSearch } from 'react-icons/fi';
import { SkeletonForm } from '../../components/SkeletonLoader';

export default function TeacherEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const { searchQuery, setSearchQuery } = useSearch();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchTeacher() {
      setLoading(true);
      setError('');
      try {
        const list = await fetchAllPaginatedItems(
          '/midland/admin/teachers/all',
          token,
          getApiUrl,
          getAuthHeaders
        );
        
        const match = list.find(t => 
          String(t.schoolEmail) === id || 
          String(t.personalEmail) === id ||
          String(t.teacherCode) === id
        );
        
        if (isMounted) {
          if (match) {
            setForm(match);
          } else {
            setError('Teacher not found');
            toast.error('Teacher not found');
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to load teacher';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTeacher();
    return () => { isMounted = false; };
  }, [id, token, toast]);

  // Fetch schools for dropdown
  useEffect(() => {
    let isMounted = true;
    async function fetchSchools() {
      setLoadingSchools(true);
      try {
        const schoolsData = await fetchAllPaginatedItems(
          '/midland/admin/schools/all',
          token,
          getApiUrl,
          getAuthHeaders
        );
        
        if (isMounted) {
          setSchools(schoolsData);
        }
      } catch (err) {
        if (isMounted) {
          toast.error('Failed to load schools. You can still enter school code manually.');
        }
      } finally {
        if (isMounted) setLoadingSchools(false);
      }
    }
    
    if (token) {
      fetchSchools();
    }
    
    return () => { isMounted = false; };
  }, [token, toast]);

  if (loading) return <div className="page"><SkeletonForm /></div>;
  if (error && !form.schoolEmail) return <div className="page"><div className="alert alert-error">{error}</div></div>;

  const emailKey = form.schoolEmail || form.personalEmail || id;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <h2>Edit Teacher</h2>
          <div style={{ position: 'relative', flex: '0 0 300px', maxWidth: '300px' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search..."
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
        <button className="btn-secondary" onClick={() => navigate('/teachers')}>
          <FiArrowLeft size={16} style={{ marginRight: 8 }} />
          Back to List
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setSubmitting(true);
          try {
            const payload = { ...form };
            const url = getApiUrl(`/midland/admin/teachers/update/${encodeURIComponent(emailKey)}`);
            const res = await fetch(url, {
              method: 'PUT',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              const errorText = await res.text().catch(() => '');
              throw new Error(errorText || `Failed to update: ${res.status}`);
            }
            
            toast.success('Teacher updated successfully');
            navigate('/teachers', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to update teacher';
            setError(errorMsg);
            toast.error(errorMsg);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="form-section">
          <h3>
            <FiUser />
            Account
          </h3>
          <div className="form-grid">
            <label>
              Username *
              <input value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current password" />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <FiUser />
            Personal Info
          </h3>
          <div className="form-grid">
            <label>
              Full Name *
              <input value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </label>
            <label>
              Gender *
              <select value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Date of Birth *
              <input type="date" value={form.dateOfBirth || ''} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <FiBriefcase />
            Professional Info
          </h3>
          <div className="form-grid">
            <label>
              Department *
              <input value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
            </label>
            <label>
              Designation *
              <input value={form.designation || ''} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
            </label>
            <label>
              Teacher Code *
              <input value={form.teacherCode || ''} onChange={(e) => setForm({ ...form, teacherCode: e.target.value })} required />
            </label>
            <label>
              Experience (Years)
              <input 
                type="number"
                min="0"
                value={form.experience || ''} 
                onChange={(e) => setForm({ ...form, experience: e.target.value })} 
                placeholder="e.g., 5"
              />
            </label>
            <label>
              School Code *
              {loadingSchools ? (
                <input 
                  value={form.schoolCode || ''} 
                  onChange={(e) => setForm({ ...form, schoolCode: e.target.value })} 
                  placeholder="Loading schools..."
                  disabled
                  required 
                />
              ) : schools.length > 0 ? (
                <select 
                  value={form.schoolCode || ''} 
                  onChange={(e) => setForm({ ...form, schoolCode: e.target.value })} 
                  required 
                >
                  <option value="">Select School Code</option>
                  {schools.map(school => (
                    <option key={school.schoolCode || school.id} value={school.schoolCode || school.id}>
                      {school.schoolCode || school.id} {school.schoolName ? `- ${school.schoolName}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input 
                  value={form.schoolCode || ''} 
                  onChange={(e) => setForm({ ...form, schoolCode: e.target.value })} 
                  placeholder="Enter school code"
                  required 
                />
              )}
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <FiMail />
            Contact Details
          </h3>
          <div className="form-grid">
            <label>
              Phone Number
              <input value={form.phoneNumber || ''} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            </label>
            <label>
              School Email *
              <input type="email" value={form.schoolEmail || ''} onChange={(e) => setForm({ ...form, schoolEmail: e.target.value })} required />
            </label>
            <label>
              Personal Email
              <input type="email" value={form.personalEmail || ''} onChange={(e) => setForm({ ...form, personalEmail: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/teachers')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}
