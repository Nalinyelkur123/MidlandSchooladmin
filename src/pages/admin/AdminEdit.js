import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FiArrowLeft } from 'react-icons/fi';
import { SkeletonForm } from '../../components/SkeletonLoader';

export default function AdminEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchAdmin() {
      setLoading(true);
      setError('');
      try {
        const url = getApiUrl('/midland/admin/all');
        const res = await fetch(url, { 
          headers: getAuthHeaders(token)
        });
        
        if (!res.ok) {
          throw new Error('Failed to load admin');
        }
        
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const match = list.find(a => 
          String(a.schoolEmail) === id || 
          String(a.personalEmail) === id
        );
        
        if (isMounted) {
          if (match) {
            setForm(match);
          } else {
            setError('Admin not found');
            toast.error('Admin not found');
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to load admin';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAdmin();
    return () => { isMounted = false; };
  }, [id, token, toast]);

  if (loading) return <div className="page"><SkeletonForm /></div>;
  if (error && !form.schoolEmail) return <div className="page"><div className="alert alert-error">{error}</div></div>;

  const emailKey = form.schoolEmail || form.personalEmail || id;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Edit Administrator</h2>
        <button className="btn-secondary" onClick={() => navigate('/admin')}>
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
            const url = getApiUrl(`/midland/admin/update/${encodeURIComponent(emailKey)}`);
            const res = await fetch(url, {
              method: 'PUT',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              const errorText = await res.text().catch(() => '');
              throw new Error(errorText || `Failed to update: ${res.status}`);
            }
            
            toast.success('Administrator updated successfully');
            navigate('/admin', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to update admin';
            setError(errorMsg);
            toast.error(errorMsg);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="form-section">
          <h3>Account</h3>
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
          <h3>Personal Info</h3>
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
              Designation *
              <input value={form.designation || ''} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
            </label>
            <label>
              School Code *
              <input value={form.schoolCode || ''} onChange={(e) => setForm({ ...form, schoolCode: e.target.value })} required />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Details</h3>
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
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Administrator'}
          </button>
        </div>
      </form>
    </div>
  );
}
