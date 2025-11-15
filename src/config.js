// Centralized API configuration - uses direct backend URL
// All API calls use: getApiUrl() + getAuthHeaders(token) + fetch()

// Helper function to get API URL
export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check if custom API URL is set via environment variable (for Netlify)
  // This allows setting REACT_APP_API_BASE_URL in Netlify dashboard
  const customApiUrl = process.env.REACT_APP_API_BASE_URL;
  
  if (customApiUrl) {
    // Use custom API URL if provided (allows HTTPS if backend supports it)
    return `${customApiUrl}${cleanPath}`;
  }
  
  // In production (Netlify), try to use proxy first
  // If proxy function is not deployed, this will fail
  if (isProduction) {
    // Use Netlify function proxy (bypasses SSL cert issues and mixed content)
    // Proxy is configured in netlify.toml to route /api/* to the function
    // The proxy function will make HTTP request to backend
    return `/api${cleanPath}`;
  }
  
  // In development, always use HTTP directly (works perfectly locally)
  // DO NOT CHANGE THIS - local development works with HTTP
  const baseUrl = 'http://4.198.16.72.nip.io';
  return `${baseUrl}${cleanPath}`;
}

// Returns array with direct URL (for backward compatibility)
export function getApiUrls(path) {
  return [getApiUrl(path)];
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

