// Centralized API configuration - uses direct backend URL
// All API calls use: getApiUrl() + getAuthHeaders(token) + fetch()

// Helper function to get API URL
export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If a custom API URL is provided via env, use that (supports HTTPS)
  const customApiUrl = process.env.REACT_APP_API_BASE_URL;
  if (customApiUrl) {
    return `${customApiUrl}${cleanPath}`;
  }

  // Otherwise use an explicit base URL. In production prefer HTTPS.
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultHost = '4.198.16.72.nip.io';
  const baseUrl = isProduction ? `https://${defaultHost}` : `http://${defaultHost}`;
  return `${baseUrl}${cleanPath}`;
}

// Helper function to get headers with required Bearer token
export function getAuthHeaders(token) {
  if (!token) {
    throw new Error('Authentication token is required. Please log in again.');
  }
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Helper function for public asset URLs
export function publicAsset(path) {
  const base = process.env.PUBLIC_URL || '';
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

