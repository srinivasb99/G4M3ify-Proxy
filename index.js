const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Basic homepage
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>G4M3ify Proxy Server</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #7c3aed; }
          code { background: #f1f1f1; padding: 2px 4px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>G4M3ify Proxy Server</h1>
        <p>This server proxies game websites to bypass Content Security Policy restrictions.</p>
        <p>Usage: <code>/proxy?url=https://example.com/game</code></p>
      </body>
    </html>
  `);
});

// Proxy middleware options
const options = {
  changeOrigin: true,
  secure: false,
  followRedirects: true,
  selfHandleResponse: false,
  // Modify headers to bypass some restrictions
  onProxyReq: (proxyReq, req, res) => {
    // Modify request headers
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
    proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.5');
    proxyReq.setHeader('Referer', req.query.url);
    
    // Remove headers that might cause issues
    proxyReq.removeHeader('Origin');
    proxyReq.removeHeader('Sec-Fetch-Dest');
    proxyReq.removeHeader('Sec-Fetch-Mode');
    proxyReq.removeHeader('Sec-Fetch-Site');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Remove CSP headers that would block embedding
    proxyRes.headers['content-security-policy'] = '';
    proxyRes.headers['content-security-policy-report-only'] = '';
    proxyRes.headers['x-frame-options'] = '';
    
    // Add headers to allow embedding
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
};

// Create the proxy middleware
app.get('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).send('URL parameter is required');
  }
  
  // Create a proxy specifically for this request
  const proxy = createProxyMiddleware({
    target: targetUrl,
    ...options,
    router: (req) => req.query.url
  });
  
  proxy(req, res, next);
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
