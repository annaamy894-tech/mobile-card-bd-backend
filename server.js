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

const authRoutes = require('./api/auth');
const linksRoutes = require('./api/links');
const trackRoutes = require('./api/track');
const sessionsRoutes = require('./api/sessions');
const adminRoutes = require('./api/admin');
const webhookRoutes = require('./api/webhook');
const productsRoutes = require('./api/products');
const ordersRoutes = require('./api/orders');

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:6200";

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] } });

app.set('io', io);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "https://iili.io"],
      connectSrc: ["'self'", "ws:", "wss:", "https://freeimage.host", FRONTEND_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Payment - from local public folder (both dev and production)
const paymentDir = path.join(__dirname, 'public', 'Payment');
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
  const all = db.sessions.read(); const now = Date.now(); let changed = false;
  all.forEach(s => { if(!s.lastActivity) return; const diff = (now - new Date(s.lastActivity).getTime())/1000; if(s.isLive && diff > 45) { s.isLive = false; s.status = 'Offline'; changed = true; } });
  if(changed) { db.sessions.write(all); io.emit('visitorOffline', {}); }
}, 10000);

async function seed() {
  const bcrypt = require('bcryptjs');
  const users = db.users.read();
  if (users.length === 0) {
    const h1 = await bcrypt.hash('admin123', 12); const h2 = await bcrypt.hash('user123', 12);
    db.users.write([{ _id:'u_admin', fullName:'Admin User', username:'admin', email:'admin@trackmaster.com', password:h1, role:'admin', status:'active', trackingCode:'ADMIN01', created_at:new Date().toISOString() },{ _id:'u_user', fullName:'Demo User', username:'user', email:'user@trackmaster.com', password:h2, role:'user', status:'active', trackingCode:'USER01', created_at:new Date().toISOString() }]);
    console.log('Seeded 2 users');
  }
  const products = db.products.read();
  if (products.length === 0) {
    db.products.write([
      { _id:'p_iphone15', name:'iPhone 15 Pro Max', brand:'Apple', price:125000, originalPrice:169000, condition:'Like New', specs:'256GB | Titanium | 1 Year Used', rating:4.9, images:[], color:'#1d1d1f', created_at:new Date().toISOString(), views:128, deviceColor:'Natural Titanium', screenSize:'6.7"', ram:'8GB', storage:'256GB', batteryHealth:'92%', warranty:'1 Year', returnPolicy:'7 Days', description:'🔥 Premium Condition — Like New\n\n✅ 100% Original Apple iPhone 15 Pro Max\n📱 256GB Storage — Natural Titanium Color\n🔋 Battery Health: 92% (Excellent)\n🛡 1 Year Official Warranty Included\n🔄 7 Days Easy Return\n\n📦 Box Contents: Phone, Charger, SIM Ejector Tool\n✨ No scratches, no dents — mint condition\n🚚 Free Home Delivery Across Bangladesh' },
      { _id:'p_s24ultra', name:'Samsung Galaxy S24 Ultra', brand:'Samsung', price:95000, originalPrice:139000, condition:'Excellent', specs:'512GB | Titanium Gray | 6 Months', rating:4.8, images:[], color:'#1428a0', created_at:new Date().toISOString(), views:96, deviceColor:'Titanium Gray', screenSize:'6.8"', ram:'12GB', storage:'512GB', batteryHealth:'95%', warranty:'6 Months', returnPolicy:'7 Days', description:'⭐ Excellent Condition — Barely Used\n\n✅ 100% Original Samsung Galaxy S24 Ultra\n📱 512GB Storage — Titanium Gray\n🔋 Battery Health: 95% (Like New)\n🖊 S Pen Included\n🛡 6 Months Official Warranty\n🔄 7 Days Easy Return\n\n📦 Full Box with all accessories\n✨ Minor signs of use — flawless screen\n🚚 Free Home Delivery Across Bangladesh' },
      { _id:'p_ip14pro', name:'iPhone 14 Pro', brand:'Apple', price:82000, originalPrice:119000, condition:'Good', specs:'128GB | Deep Purple | 1.5 Years', rating:4.7, images:[], color:'#5b2d8e', created_at:new Date().toISOString(), views:64, deviceColor:'Deep Purple', screenSize:'6.1"', ram:'6GB', storage:'128GB', batteryHealth:'87%', warranty:'3 Months', returnPolicy:'7 Days', description:'✅ Original iPhone 14 Pro — Deep Purple\n📱 128GB Storage\n🔋 Battery Health: 87%\n🛡 3 Months Warranty\n🔄 7 Days Easy Return\n🚚 Free Delivery' },
      { _id:'p_pixel8', name:'Google Pixel 8 Pro', brand:'Google', price:68000, originalPrice:95000, condition:'Like New', specs:'256GB | Obsidian | 4 Months', rating:4.8, images:[], color:'#1a1a1a', created_at:new Date().toISOString(), views:42, deviceColor:'Obsidian', screenSize:'6.7"', ram:'12GB', storage:'256GB', batteryHealth:'96%', warranty:'1 Year', returnPolicy:'7 Days', description:'📸 Best Camera Phone — Google Pixel 8 Pro\n📱 256GB Storage — Obsidian Black\n🔋 Battery Health: 96%\n🛡 1 Year Warranty\n🔄 7 Days Easy Return\n🚚 Free Delivery' },
      { _id:'p_op12', name:'OnePlus 12', brand:'OnePlus', price:55000, originalPrice:75000, condition:'Excellent', specs:'256GB | Flowy Emerald | 8 Months', rating:4.6, images:[], color:'#2d2d2d', created_at:new Date().toISOString(), views:38, deviceColor:'Flowy Emerald', screenSize:'6.82"', ram:'16GB', storage:'256GB', batteryHealth:'90%', warranty:'6 Months', returnPolicy:'7 Days', description:'⚡ Fast & Smooth — OnePlus 12\n📱 256GB Storage — Flowy Emerald\n🔋 Battery Health: 90%\n💨 16GB RAM — Super Fast\n🛡 6 Months Warranty\n🔄 7 Days Easy Return\n🚚 Free Delivery' },
      { _id:'p_xiaomi14', name:'Xiaomi 14 Ultra', brand:'Xiaomi', price:48000, originalPrice:70000, condition:'Good', specs:'512GB | Black | 1 Year', rating:4.5, images:[], color:'#1a1a1a', created_at:new Date().toISOString(), views:27, deviceColor:'Black', screenSize:'6.73"', ram:'12GB', storage:'512GB', batteryHealth:'84%', warranty:'1 Month', returnPolicy:'3 Days', description:'💰 Best Value — Xiaomi 14 Ultra\n📱 512GB Storage — Black\n🔋 Battery Health: 84%\n🛡 1 Month Warranty\n🔄 3 Days Return\n🚚 Free Delivery' },
      { _id:'p_ip13', name:'iPhone 13', brand:'Apple', price:42000, originalPrice:65000, condition:'Fair', specs:'128GB | Red | 2 Years', rating:4.4, images:[], color:'#e74c3c', created_at:new Date().toISOString(), views:53, deviceColor:'Red', screenSize:'6.1"', ram:'4GB', storage:'128GB', batteryHealth:'78%', warranty:'No Warranty', returnPolicy:'No Return', description:'🔴 Budget iPhone — iPhone 13 Red\n📱 128GB Storage\n🔋 Battery Health: 78%\n⚠️ No Warranty — Fair Condition\n🚚 Free Delivery' },
      { _id:'p_zflip5', name:'Samsung Galaxy Z Flip5', brand:'Samsung', price:72000, originalPrice:99900, condition:'Like New', specs:'256GB | Lavender | 3 Months', rating:4.7, images:[], color:'#b784a7', created_at:new Date().toISOString(), views:71, deviceColor:'Lavender', screenSize:'6.7"', ram:'8GB', storage:'256GB', batteryHealth:'94%', warranty:'1 Year', returnPolicy:'7 Days', description:'✨ Foldable Style — Galaxy Z Flip5\n📱 256GB Storage — Lavender\n🔋 Battery Health: 94%\n🛡 1 Year Warranty\n🔄 7 Days Easy Return\n🚚 Free Delivery' }
    ]);
    console.log('Seeded 8 products with full details');
  }
}
const PORT = process.env.PORT || 5000;
seed().then(() => { server.listen(PORT, () => console.log('Backend running on http://localhost:' + PORT)); });