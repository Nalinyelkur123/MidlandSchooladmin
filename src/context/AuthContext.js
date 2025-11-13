import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config';

const AuthContext = createContext(null);

const idleMs = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    try {
      const storedToken = window.sessionStorage.getItem('authToken');
      const storedUser = window.sessionStorage.getItem('authUser');
      if (storedToken) {
        setToken(storedToken);
      }
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser(null);
        }
      }
    } catch (e) {
      setUser(null);
    }
    setIsReady(true);
  }, []);

  // Handle tab/window close - ensure session is cleared
  useEffect(() => {
    if (!token) return;

    const shouldForceClearOnUnload = process.env.NODE_ENV === 'production';
    if (!shouldForceClearOnUnload) {
      return undefined;
    }

    const handleBeforeUnload = () => {
      // Explicitly clear auth data when tab/window is closing
      window.sessionStorage.removeItem('authToken');
      window.sessionStorage.removeItem('authUser');
    };

    // Listen for page unload events
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const loginUrl = process.env.REACT_APP_LOGIN_ENDPOINT || getApiUrl('/midland/auth/admin/login');

    try {
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        
        if (res.status === 404) {
          throw new Error(`Login endpoint not found (404). URL: ${loginUrl}. Please check the API endpoint configuration.`);
        }
        if (res.status === 403) {
          throw new Error('Access forbidden (403). The server rejected the request. This may be a CORS or authentication issue. Check backend configuration.');
        }
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || errorData.error || `Login failed: ${res.status} ${res.statusText}`);
        } catch {
          throw new Error(errorText || `Login failed: ${res.status} ${res.statusText}`);
        }
      }
      
      const data = await res.json();

      if (!data) {
        throw new Error('No response from server');
      }

      const receivedToken = data.token || data.accessToken || data.jwt;
      const usernameFromResponse = data.username;
      const roleFromResponse = data.role;

      const receivedUser = {
        email: email,
        username: usernameFromResponse || email,
        role: roleFromResponse || 'USER',
      };
      if (!receivedToken) {
        throw new Error('No token returned by server');
      }

      window.sessionStorage.setItem('authToken', receivedToken);
      window.sessionStorage.setItem('authUser', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return true;
    } catch (err) {
      throw err;
    }
  }, []);

  const register = useCallback(async (email, password) => {
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    // Clear auth data from session and local storage
    window.sessionStorage.removeItem('authToken');
    window.sessionStorage.removeItem('authUser');
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return undefined;
    }

    const resetIdleTimer = () => {
      lastActivityRef.current = Date.now();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (Date.now() - lastActivityRef.current >= idleMs) {
          logout();
        }
      }, idleMs);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer, true));
    resetIdleTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer, true));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [token, logout]);

  const value = {
    token,
    user,
    isReady,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({ children }) {
  const { token, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && !token) {
      navigate('/login', { replace: true });
    }
  }, [token, isReady, navigate]);

  if (!isReady) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!token) {
    return null;
  }

  return children;
}

