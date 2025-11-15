// Netlify Function to proxy API requests
// This bypasses SSL certificate issues and mixed content by proxying through Netlify

exports.handler = async (event, context) => {
  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST, GET, PUT, DELETE, PATCH methods
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  if (!allowedMethods.includes(event.httpMethod)) {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Extract the API path from the request
  // The redirect rule sends /api/* to this function
  // rawPath contains the original request path (e.g., /api/midland/auth/admin/login)
  let path = '';

  // Method 1: Extract from rawPath (original request path before redirect)
  // This is the most reliable method - rawPath contains the original /api/midland/... path
  if (event.rawPath && event.rawPath.startsWith('/api/')) {
    // Remove /api prefix to get the backend path
    path = event.rawPath.replace(/^\/api/, '');
  }
  // Method 2: Extract from path property (might contain /api/)
  else if (event.path && event.path.startsWith('/api/')) {
    path = event.path.replace(/^\/api/, '');
  }
  // Method 3: Get from query parameter (if redirect passes :splat)
  else if (event.queryStringParameters?.path) {
    path = event.queryStringParameters.path;
    // Remove /api prefix if present
    if (path.startsWith('/api/')) {
      path = path.replace(/^\/api/, '');
    }
  }
  // Method 4: Get from X-Original-URL header (if Netlify sets it)
  else if (event.headers?.['x-original-url'] || event.headers?.['X-Original-URL']) {
    const originalUrl = event.headers['x-original-url'] || event.headers['X-Original-URL'];
    const match = originalUrl.match(/\/api\/(.+)$/);
    if (match) {
      path = '/' + match[1];
    }
  }

  // Fallback if nothing worked - return error
  if (!path) {
    console.error('Could not extract path from request:', {
      path: event.path,
      rawPath: event.rawPath,
      queryParams: event.queryStringParameters,
      headers: Object.keys(event.headers),
      fullEvent: JSON.stringify(event, null, 2).substring(0, 500)
    });
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Invalid request path',
        message: 'Could not determine API path from request',
        debug: {
          path: event.path,
          rawPath: event.rawPath,
          queryParams: event.queryStringParameters
        }
      })
    };
  }

  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Construct target URL (using HTTP to avoid SSL issues)
  const targetUrl = `http://4.198.16.72.nip.io${path}`;

  // Log for debugging (check Netlify Function logs in dashboard)
  console.log('Proxy request:', {
    method: event.httpMethod,
    path: event.path,
    rawPath: event.rawPath,
    queryParams: event.queryStringParameters,
    extractedPath: path,
    targetUrl: targetUrl
  });

  try {
    // Prepare headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Forward authorization header if present
    if (event.headers.authorization || event.headers.Authorization) {
      headers['Authorization'] = event.headers.authorization || event.headers.Authorization;
    }

    // Prepare fetch options
    const fetchOptions = {
      method: event.httpMethod,
      headers: headers,
    };

    // Add body for POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(event.httpMethod) && event.body) {
      fetchOptions.body = event.body;
    }

    // Make the request to the backend
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    // Try to parse as JSON, otherwise return as text
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch {
      responseData = data;
    }

    // Return the response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      },
      body: typeof responseData === 'string' ? responseData : JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message
      })
    };
  }
};

