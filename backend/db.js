const fs = require('fs');
const path = require('path');
const D = path.join(__dirname, 'data');
if (!fs.existsSync(D)) fs.mkdirSync(D);

function r(f) {
  const p = path.join(D, f + '.json');
  if (!fs.existsSync(p)) return [];
  let raw = fs.readFileSync(p);
  if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) raw = raw.slice(3);
  const str = raw.toString('utf-8').trim();
  if (!str) return [];
  try { return JSON.parse(str); } catch (e) { console.error('JSON parse error in ' + f + ':', e.message); return []; }
}

function w(f, d) {
  const p = path.join(D, f + '.json');
  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
}

module.exports = {
  users: { read: () => r('users'), write: d => w('users', d) },
  links: { read: () => r('links'), write: d => w('links', d) },
  sessions: { read: () => r('sessions'), write: d => w('sessions', d) },
  trash: { read: () => r('trash'), write: d => w('trash', d) },
  menuItems: { read: () => r('menuItems'), write: d => w('menuItems', d) },
  routeLogs: { read: () => r('routeLogs'), write: d => w('routeLogs', d) },
  clicks: { read: () => r('clicks'), write: d => w('clicks', d) },
  products: { read: () => r('products'), write: d => w('products', d) },
  comments: { read: () => r('comments'), write: d => w('comments', d) },
  orders: { read: () => r('orders'), write: d => w('orders', d) }
};