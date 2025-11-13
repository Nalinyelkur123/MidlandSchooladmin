const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for /midland/* paths - MUST be registered FIRST before other routes
  app.use(
    '/midland',
    createProxyMiddleware({
      target: 'http://4.198.16.72.nip.io',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      headers: {
        'Accept': 'application/json',
      },
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Host', '4.198.16.72.nip.io');
        
        if (req.headers['content-type']) {
          proxyReq.setHeader('Content-Type', req.headers['content-type']);
        } else {
          proxyReq.setHeader('Content-Type', 'application/json');
        }
        
        if (req.headers['accept']) {
          proxyReq.setHeader('Accept', req.headers['accept']);
        } else {
          proxyReq.setHeader('Accept', 'application/json');
        }
        
        if (req.headers['authorization']) {
          proxyReq.setHeader('Authorization', req.headers['authorization']);
        }
      },
      onError: (err, req, res) => {
        // Error handler
      },
      onProxyRes: (proxyRes, req, res) => {
        // Proxy response handler
      },
    })
  );
};

