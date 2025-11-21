/**
 * Utility function to fetch all items from a paginated API endpoint
 * Handles pagination automatically and returns all items
 * 
 * @param {string} endpoint - API endpoint path (e.g., '/midland/admin/students/all')
 * @param {string} token - Authentication token
 * @param {Function} getApiUrl - Function to get full API URL
 * @param {Function} getAuthHeaders - Function to get auth headers
 * @returns {Promise<Array>} - Array of all items from all pages
 */
export async function fetchAllPaginatedItems(endpoint, token, getApiUrl, getAuthHeaders) {
  let allItems = [];
  let page = 0;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', pageSize.toString());
      
      const url = getApiUrl(`${endpoint}?${params.toString()}`);
      const res = await fetch(url, {
        headers: getAuthHeaders(token)
      });
      
      if (!res.ok) {
        // If pagination fails, try without pagination parameters
        if (page === 0) {
          const fallbackUrl = getApiUrl(endpoint);
          const fallbackRes = await fetch(fallbackUrl, {
            headers: getAuthHeaders(token)
          });
          
          if (!fallbackRes.ok) {
            return [];
          }
          
          const fallbackData = await fallbackRes.json();
          return Array.isArray(fallbackData) ? fallbackData : (fallbackData.content || []);
        } else {
          hasMore = false;
          break;
        }
      }
      
      const data = await res.json();
      
      // Handle different response formats
      let pageData = [];
      if (Array.isArray(data)) {
        pageData = data;
        hasMore = data.length === pageSize;
      } else if (data.content && Array.isArray(data.content)) {
        pageData = data.content;
        hasMore = !data.last && pageData.length === pageSize;
      } else if (data.data && Array.isArray(data.data)) {
        pageData = data.data;
        hasMore = !data.last && pageData.length === pageSize;
      } else {
        hasMore = false;
      }
      
      allItems = [...allItems, ...pageData];
      
      // If we got less than pageSize, we've reached the end
      if (pageData.length < pageSize) {
        hasMore = false;
      }
      
      page++;
    } catch (err) {
      if (page === 0) {
        // Try fallback without pagination
        try {
          const fallbackUrl = getApiUrl(endpoint);
          const fallbackRes = await fetch(fallbackUrl, {
            headers: getAuthHeaders(token)
          });
          
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            return Array.isArray(fallbackData) ? fallbackData : (fallbackData.content || []);
          }
        } catch (fallbackErr) {
          return [];
        }
      }
      hasMore = false;
    }
  }
  
  return allItems;
}

