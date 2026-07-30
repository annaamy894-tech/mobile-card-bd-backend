require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const db = require('./db');
const bcrypt = require('bcryptjs');

const authRoutes = require('./api/auth');
const linksRoutes = require('./api/links');
const trackRoutes = require('./api/track');
const sessionsRoutes = require('./api/sessions');
const adminRoutes = require('./api/admin');
const webhookRoutes = require('./api/webhook');
const productsRoutes = require('./api/products');
const ordersRoutes = require('./api/orders');

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || "http://localhost:6200",
  "http://localhost:6200",
  "http://localhost:4000",
  "https://playful-chimera-284bb0.netlify.app",
  "https://mobilecard.gonow.site"
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'], credentials: true } });

app.set('io', io);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "https://iili.io"],
      connectSrc: ["'self'", "ws:", "wss:", "https://freeimage.host", ...ALLOWED_ORIGINS],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

const paymentDir = path.join(__dirname, '..', 'frontend', 'public', 'Payment');
app.use('/Payment', express.static(paymentDir));
app.get('/Payment/:slug', (req, res) => res.sendFile(path.join(paymentDir, 'index.html')));

const locationsPath = path.join(__dirname, 'data', 'locations.json');
const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));

app.get('/api/locations', (req, res) => {
  const divisions = Object.keys(locationsData).map(div => ({
    division: div,
    districts: Object.keys(locationsData[div].districts).map(dist => ({
      district: dist,
      thanas: locationsData[div].districts[dist]
    }))
  }));
  res.json(divisions);
});

app.post('/api/upload/image', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: 'No image provided' });
    const apiKey = process.env.IMGDB_API_KEY;
    const uploadUrl = process.env.IMGDB_UPLOAD_URL || 'https://freeimage.host/api/1/upload';
    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    formData.append('source', image);
    formData.append('format', 'json');
    const response = await axios.post(uploadUrl, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000
    });
    if (response.data && response.data.status_code === 200) {
      const imgUrl = response.data.image.url;
      const thumbUrl = response.data.image.thumb?.url || imgUrl;
      const mediumUrl = response.data.image.medium?.url || imgUrl;
      res.json({ success: true, url: imgUrl, thumb: thumbUrl, medium: mediumUrl });
    } else {
      res.status(500).json({ message: 'Upload failed', details: response.data });
    }
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

io.on('connection', (socket) => { console.log('Socket:', socket.id); socket.on('disconnect', () => console.log('Socket gone:', socket.id)); });

setInterval(() => {
  db.sessions.read().then(all => {
    const now = Date.now();
    let changed = false;
    all.forEach(s => {
      if (!s.lastActivity) return;
      const diff = (now - new Date(s.lastActivity).getTime()) / 1000;
      if (s.isLive && diff > 45) { s.isLive = false; s.status = 'Offline'; changed = true; }
    });
    if (changed) {
      Promise.all(all.filter(s => !s.isLive).map(s => db.sessions.findByIdAndUpdate(s._id, { isLive: false, status: 'Offline' })))
        .then(() => io.emit('visitorOffline', {}));
    }
  });
}, 10000);

const PORT = process.env.PORT || 5000;

async function seedUsers() {
  try {
    const users = await db.users.read();
    if (users.length === 0) {
      const h1 = await bcrypt.hash('admin123', 12);
      const h2 = await bcrypt.hash('user123', 12);
      await db.users.write([
        { _id: 'u_admin', fullName: 'Admin User', username: 'admin', email: 'admin@trackmaster.com', password: h1, role: 'admin', status: 'active', trackingCode: 'ADMIN01', created_at: new Date().toISOString() },
        { _id: 'u_user', fullName: 'Demo User', username: 'user', email: 'user@trackmaster.com', password: h2, role: 'user', status: 'active', trackingCode: 'USER01', created_at: new Date().toISOString() }
      ]);
      console.log('Seeded admin + demo user');
    }
  } catch (e) { console.error('Seed error:', e.message); }
}

seedUsers().then(() => {
  server.listen(PORT, () => console.log('Backend running on http://localhost:' + PORT));
});