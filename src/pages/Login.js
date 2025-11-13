import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicAsset } from '../config';
import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';

function IconLock() { return <FiLock className="icon-left" />; }
function IconMail() { return <FiMail className="icon-left" />; }

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setSubmitting(true);
      await auth.login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-layout">
      <div
        className="login-hero"
        style={{ backgroundImage: `url(${publicAsset('Images/home.jpg')})` }}
      />
      <div className="auth-container">
        <div className="auth-card">
          <div className="logo-container">
            <img src={publicAsset('Images/logo.png')} alt="Logo" />
          </div>
          {error ? <div className="auth-error">{error}</div> : null}
          <h2 className="login-title">Members Log in</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email
              <div className="input-group">
                <IconMail />
                <input
                  className="with-icon"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@midland.edu"
                />
              </div>
            </label>
            <label>
              Password
              <div className="input-group password-group">
                <IconLock />
                <input
                  className="with-icon"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </label>
            <button type="submit" className="auth-button auth-button-red" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

