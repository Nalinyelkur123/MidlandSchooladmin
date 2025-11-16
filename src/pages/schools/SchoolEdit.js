import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearch } from '../../context/SearchContext';
import { FiArrowLeft, FiHome, FiMail, FiSearch } from 'react-icons/fi';
import { SkeletonForm } from '../../components/SkeletonLoader';

export default function SchoolEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const { searchQuery, setSearchQuery } = useSearch();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchSchool() {
      if (!token) {
        if (isMounted) {
          setError('Authentication required');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError('');
      try {
        // Decode the ID from URL
        const decodedId = decodeURIComponent(id || '');
        
        // Validate ID - don't make API calls with invalid IDs
        if (!decodedId || decodedId === '-' || decodedId.trim() === '') {
          if (isMounted) {
            setError('Invalid school identifier');
            setLoading(false);
            toast.error('Invalid school identifier');
          }
          return;
        }
        
        let schoolData = null;
        
        // Try to fetch by specific endpoint first
        try {
          const specificUrl = getApiUrl(`/midland/admin/schools/${encodeURIComponent(decodedId)}`);
          const specificRes = await fetch(specificUrl, {
            method: 'GET',
            headers: getAuthHeaders(token)
          });
          if (specificRes.ok) {
            schoolData = await specificRes.json();
          }
        } catch (err) {
          // Fall through to list endpoint
        }
        
        // If not found, fetch all and search
        if (!schoolData) {
          const url = getApiUrl('/midland/admin/schools/all');
          const res = await fetch(url, { 
            headers: getAuthHeaders(token)
          });
          
          if (!res.ok) {
            throw new Error('Failed to load school');
          }
          
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          
          // Try multiple matching strategies
          const match = list.find(s => {
            if (!s) return false;
            
            const schoolCode = String(s.schoolCode || '').trim();
            const schoolId = String(s.id || '').trim();
            const decodedIdLower = decodedId.toLowerCase().trim();
            
            // Try exact matches first (case-insensitive)
            if (schoolCode && schoolCode.toLowerCase() === decodedIdLower) return true;
            if (schoolId && schoolId.toLowerCase() === decodedIdLower) return true;
            
            // Try case-sensitive matches
            if (schoolCode && schoolCode === decodedId) return true;
            if (schoolId && schoolId === decodedId) return true;
            
            return false;
          });
          
          schoolData = match || null;
        }
        
        if (isMounted) {
          if (schoolData) {
            setForm(schoolData);
          } else {
            setError('School not found');
            toast.error('School not found');
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to load school';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSchool();
    return () => { isMounted = false; };
  }, [id, token, toast]);

  if (loading) return <div className="page"><SkeletonForm /></div>;
  if (error && !form.schoolCode && !form.id) {
    return <div className="page"><div className="alert alert-error">{error}</div></div>;
  }

  // Use the school code or ID from URL parameter for the API endpoint
  const schoolId = decodeURIComponent(id || '');

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <h2>Edit School</h2>
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
        <button className="btn-secondary" onClick={() => navigate('/schools')}>
          <FiArrowLeft size={16} style={{ marginRight: 8 }} />
          Back to List
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          
          // Check if token exists before submitting
          if (!token) {
            setError('Authentication required. Please log in again.');
            toast.error('Authentication required. Please log in again.');
            return;
          }
          
          setSubmitting(true);
          try {
            const payload = { ...form };
            // Use school code or ID from URL parameter (last part of endpoint)
            const url = getApiUrl(`/midland/admin/schools/update/${encodeURIComponent(schoolId)}`);
            const res = await fetch(url, {
              method: 'PUT',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              const errorText = await res.text().catch(() => '');
              throw new Error(errorText || `Failed to update: ${res.status}`);
            }
            
            toast.success('School updated successfully');
            navigate('/schools', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to update school';
            setError(errorMsg);
            toast.error(errorMsg);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="form-section">
          <h3>
            <FiHome />
            School Information
          </h3>
          <div className="form-grid">
            <label>
              School Code *
              <input value={form.schoolCode || ''} onChange={(e) => setForm({ ...form, schoolCode: e.target.value })} required />
            </label>
            <label>
              School Name *
              <input value={form.schoolName || form.name || ''} onChange={(e) => setForm({ ...form, schoolName: e.target.value, name: e.target.value })} required />
            </label>
            <label>
              Status
              <select 
                value={form.isActive !== undefined ? (form.isActive ? 'Active' : 'Inactive') : (form.status || 'Active')} 
                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'Active', status: e.target.value })} 
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              Email
              <input type="email" value={form.email || form.schoolEmail || ''} onChange={(e) => setForm({ ...form, email: e.target.value, schoolEmail: e.target.value })} />
            </label>
            <label>
              Phone Number
              <input value={form.phoneNumber || ''} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <FiHome />
            Address
          </h3>
          <div className="form-grid">
            <label>
              Address
              <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123, Street Name" />
            </label>
            <label>
              City
              <input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
            <label>
              State
              <input value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </label>
            <label>
              Country
              <input value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </label>
            <label>
              Pin Code
              <input value={form.pinCode || ''} onChange={(e) => setForm({ ...form, pinCode: e.target.value })} placeholder="500081" />
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/schools')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update School'}
          </button>
        </div>
      </form>
    </div>
  );
}

