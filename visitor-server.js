const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

const PORT = 4000;
const BACKEND_URL = 'http://localhost:6000';
const FRONTEND_URL = 'http://localhost:6200';

// Proxy API + Socket.io to backend
app.use('/api', createProxyMiddleware({ target: BACKEND_URL, changeOrigin: true }));
app.use('/socket.io', createProxyMiddleware({ target: BACKEND_URL, changeOrigin: true, ws: true }));

// Proxy everything else to frontend dev server
app.use('/', createProxyMiddleware({ target: FRONTEND_URL, changeOrigin: true }));

app.listen(PORT, () => console.log('Visitor Proxy running on http://localhost:' + PORT));