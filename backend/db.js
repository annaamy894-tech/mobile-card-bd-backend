const { createClient } = require('@libsql/client');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN
});

const TABLES = [
  `CREATE TABLE IF NOT EXISTS users (_id TEXT PRIMARY KEY, fullName TEXT, username TEXT, email TEXT, password TEXT, role TEXT, status TEXT, trackingCode TEXT, created_at TEXT, phone TEXT, building TEXT, locality TEXT, region TEXT, city TEXT, area TEXT, address TEXT, division TEXT, district TEXT, thana TEXT)`,
  `CREATE TABLE IF NOT EXISTS links (_id TEXT PRIMARY KEY, category TEXT, trackingCode TEXT, pageUrl TEXT, buttonName TEXT, location TEXT, total_clicks INTEGER DEFAULT 0, created_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS sessions (_id TEXT PRIMARY KEY, trackingCode TEXT, visitorId TEXT, ip TEXT, browser TEXT, deviceType TEXT, status TEXT, isLive INTEGER DEFAULT 0, entryUrl TEXT, currentUrl TEXT, lastActivity TEXT, clicks INTEGER DEFAULT 0, userName TEXT, formData TEXT, adminStatus TEXT, lastMessage TEXT, timestamp TEXT)`,
  `CREATE TABLE IF NOT EXISTS trash (_id TEXT PRIMARY KEY, trackingCode TEXT, originalId TEXT, activity TEXT, systemData TEXT, deletedAt TEXT)`,
  `CREATE TABLE IF NOT EXISTS menuItems (_id TEXT PRIMARY KEY, buttonName TEXT, pageUrl TEXT, location TEXT, created_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS routeLogs (_id TEXT PRIMARY KEY, visitorId TEXT, changedBy TEXT, oldUrl TEXT, newUrl TEXT, changedAt TEXT)`,
  `CREATE TABLE IF NOT EXISTS clicks (_id TEXT PRIMARY KEY, trackingCode TEXT, visitorId TEXT, ip TEXT, clickedAt TEXT)`,
  `CREATE TABLE IF NOT EXISTS products (_id TEXT PRIMARY KEY, name TEXT, brand TEXT, price REAL, originalPrice REAL, condition TEXT, specs TEXT, rating REAL, image TEXT, images TEXT, color TEXT, deviceColor TEXT, screenSize TEXT, ram TEXT, storage TEXT, batteryHealth TEXT, warranty TEXT, returnPolicy TEXT, description TEXT, views INTEGER DEFAULT 0, created_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS comments (_id TEXT PRIMARY KEY, productId TEXT, name TEXT, text TEXT, created_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS orders (_id TEXT PRIMARY KEY, userId TEXT, productName TEXT, productId TEXT, productImage TEXT, productSpecs TEXT, productColor TEXT, price REAL, paymentMode TEXT, paymentStatus TEXT DEFAULT 'pending', address TEXT, created_at TEXT)`
];

async function initDB() {
  for (const sql of TABLES) {
    try { await client.execute(sql); } catch (e) { console.error('Table init error:', e.message); }
  }
  console.log('Turso DB ready');
}

function rowToObj(row) {
  if (!row) return null;
  const obj = {};
  for (const key of Object.keys(row)) {
    let val = row[key];
    if ((key === 'formData' || key === 'systemData' || key === 'images') && typeof val === 'string') {
      try { val = JSON.parse(val); } catch { val = (key === 'images') ? [] : {}; }
    }
    if (key === 'isLive') val = val === 1 || val === true;
    obj[key] = val;
  }
  return obj;
}

function prepForDB(obj) {
  const copy = { ...obj };
  if (copy.formData && typeof copy.formData === 'object') copy.formData = JSON.stringify(copy.formData);
  if (copy.systemData && typeof copy.systemData === 'object') copy.systemData = JSON.stringify(copy.systemData);
  if (copy.images && Array.isArray(copy.images)) copy.images = JSON.stringify(copy.images);
  if (typeof copy.isLive === 'boolean') copy.isLive = copy.isLive ? 1 : 0;
  return copy;
}

function buildWhere(f) {
  const clauses = [];
  const args = [];
  for (const key of Object.keys(f || {})) {
    if (f[key] && f[key] !== 'All') {
      clauses.push(`${key} = ?`);
      args.push(f[key]);
    }
  }
  return { where: clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '', args };
}

async function readAll(table, filter) {
  const { where, args } = buildWhere(filter);
  const rs = await client.execute({ sql: `SELECT * FROM ${table} ${where}`, args });
  return rs.rows.map(rowToObj);
}

async function findById(table, id) {
  const rs = await client.execute({ sql: `SELECT * FROM ${table} WHERE _id = ?`, args: [id] });
  return rowToObj(rs.rows[0]);
}

async function insertOne(table, data) {
  const d = prepForDB(data);
  const keys = Object.keys(d);
  const vals = Object.values(d);
  const placeholders = keys.map(() => '?').join(', ');
  await client.execute({ sql: `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, args: vals });
  return data;
}

async function updateOne(table, id, updates) {
  const existing = await findById(table, id);
  if (!existing) return null;
  const merged = prepForDB({ ...existing, ...updates });
  const keys = Object.keys(merged);
  const vals = Object.values(merged);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  await client.execute({ sql: `UPDATE ${table} SET ${setClause} WHERE _id = ?`, args: [...vals, id] });
  return { ...existing, ...updates };
}

async function deleteOne(table, id) {
  await client.execute({ sql: `DELETE FROM ${table} WHERE _id = ?`, args: [id] });
  return true;
}

async function countDocs(table, filter) {
  const { where, args } = buildWhere(filter);
  const rs = await client.execute({ sql: `SELECT COUNT(*) as cnt FROM ${table} ${where}`, args });
  return rs.rows[0]?.cnt || 0;
}

initDB();

module.exports = {
  users: {
    read: () => readAll('users'),
    write: async (data) => { for (const d of data) await insertOne('users', d); },
    findById: (id) => findById('users', id),
    findOne: async (f) => { const all = await readAll('users'); return all.find(x => Object.keys(f).every(k => x[k] == f[k])) || null; },
    find: async (f) => readAll('users', f),
    findByIdAndUpdate: (id, up) => updateOne('users', id, up),
    findByIdAndDelete: (id) => deleteOne('users', id),
    countDocuments: (f) => countDocs('users', f)
  },
  links: {
    read: () => readAll('links'),
    write: async (data) => { for (const d of data) await insertOne('links', d); },
    findById: (id) => findById('links', id),
    findOne: async (f) => { const all = await readAll('links'); return all.find(x => Object.keys(f).every(k => x[k] == f[k])) || null; },
    find: (f) => readAll('links', f),
    findByIdAndUpdate: (id, up) => updateOne('links', id, up),
    findByIdAndDelete: (id) => deleteOne('links', id),
    distinct: async (field) => { const all = await readAll('links'); return [...new Set(all.map(x => x[field]))]; }
  },
  sessions: {
    read: () => readAll('sessions'),
    write: async (data) => { for (const d of data) await insertOne('sessions', d); },
    findById: (id) => findById('sessions', id),
    find: () => readAll('sessions'),
    findByIdAndUpdate: (id, up) => updateOne('sessions', id, up),
    findByIdAndDelete: (id) => deleteOne('sessions', id),
    countDocuments: (f) => countDocs('sessions', f)
  },
  trash: {
    read: () => readAll('trash'),
    write: async (data) => { for (const d of data) await insertOne('trash', d); },
    findById: (id) => findById('trash', id),
    find: () => readAll('trash'),
    findByIdAndDelete: (id) => deleteOne('trash', id),
    deleteMany: async () => { await client.execute('DELETE FROM trash'); },
    countDocuments: () => countDocs('trash')
  },
  menuItems: {
    read: () => readAll('menuItems'),
    write: async (data) => { for (const d of data) await insertOne('menuItems', d); },
    find: () => readAll('menuItems'),
    findByIdAndUpdate: (id, up) => updateOne('menuItems', id, up),
    findByIdAndDelete: (id) => deleteOne('menuItems', id)
  },
  routeLogs: {
    read: () => readAll('routeLogs'),
    write: async (data) => { for (const d of data) await insertOne('routeLogs', d); }
  },
  clicks: {
    read: () => readAll('clicks'),
    write: async (data) => { for (const d of data) await insertOne('clicks', d); }
  },
  products: {
    read: () => readAll('products'),
    write: async (data) => { for (const d of data) await insertOne('products', d); },
    findById: (id) => findById('products', id),
    find: (f) => readAll('products', f),
    findByIdAndUpdate: (id, up) => updateOne('products', id, up),
    findByIdAndDelete: (id) => deleteOne('products', id),
    incrementViews: async (id) => { const p = await findById('products', id); if (p) { p.views = (p.views || 0) + 1; await updateOne('products', id, { views: p.views }); return p; } return null; },
    countDocuments: () => countDocs('products')
  },
  comments: {
    read: () => readAll('comments'),
    write: async (data) => { for (const d of data) await insertOne('comments', d); },
    findByProduct: async (productId) => { const all = await readAll('comments'); return all.filter(x => x.productId === productId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); },
    findByIdAndDelete: (id) => deleteOne('comments', id)
  },
  orders: {
    read: () => readAll('orders'),
    write: async (data) => { for (const d of data) await insertOne('orders', d); },
    findById: (id) => findById('orders', id)
  }
};