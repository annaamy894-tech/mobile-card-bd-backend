const bcrypt = require('bcryptjs');
const db = require('./db');

const User = {
  create: async (d) => {
    d._id = 'u_' + Date.now();
    d.created_at = new Date().toISOString();
    if (d.password) d.password = await bcrypt.hash(d.password, 12);
    if (!d.status) d.status = 'active';
    return await db.users.write([d]) && d;
  },
  findOne: (f) => db.users.findOne(f),
  findById: (id) => db.users.findById(id),
  find: (f) => db.users.find(f),
  findByIdAndUpdate: async (id, up) => {
    if (up.password) up.password = await bcrypt.hash(up.password, 12);
    return db.users.findByIdAndUpdate(id, up);
  },
  findByIdAndDelete: (id) => db.users.findByIdAndDelete(id),
  countDocuments: (f) => db.users.countDocuments(f)
};

const Link = {
  create: (d) => { d._id = 'l_' + Date.now(); d.created_at = new Date().toISOString(); d.total_clicks = d.total_clicks || 0; db.links.write([d]); return d; },
  find: (f) => db.links.find(f),
  findOne: (f) => db.links.findOne(f),
  findById: (id) => db.links.findById(id),
  findByIdAndUpdate: (id, up) => db.links.findByIdAndUpdate(id, up),
  findByIdAndDelete: (id) => db.links.findByIdAndDelete(id),
  distinct: (field) => db.links.distinct(field)
};

const Session = {
  create: (d) => {
    d._id = 's_' + Date.now();
    d.timestamp = new Date().toISOString();
    d.lastActivity = new Date().toISOString();
    d.isLive = true;
    d.entryUrl = d.entryUrl || '';
    d.currentUrl = d.currentUrl || '';
    d.clicks = d.clicks || 0;
    db.sessions.write([d]);
    return d;
  },
  find: () => db.sessions.find(),
  findById: (id) => db.sessions.findById(id),
  findByIdAndUpdate: (id, up) => db.sessions.findByIdAndUpdate(id, up),
  findByIdAndDelete: (id) => db.sessions.findByIdAndDelete(id),
  countDocuments: (f) => db.sessions.countDocuments(f)
};

const Trash = {
  create: (d) => { d._id = 't_' + Date.now(); d.deletedAt = new Date().toISOString(); db.trash.write([d]); return d; },
  find: () => db.trash.find(),
  findById: (id) => db.trash.findById(id),
  findByIdAndDelete: (id) => db.trash.findByIdAndDelete(id),
  deleteMany: () => db.trash.deleteMany(),
  countDocuments: () => db.trash.countDocuments()
};

const MenuItem = {
  create: (d) => { d._id = 'm_' + Date.now(); d.created_at = new Date().toISOString(); db.menuItems.write([d]); return d; },
  find: () => db.menuItems.find(),
  findByIdAndUpdate: (id, up) => db.menuItems.findByIdAndUpdate(id, up),
  findByIdAndDelete: (id) => db.menuItems.findByIdAndDelete(id)
};

const RouteLog = {
  create: (d) => { d._id = 'r_' + Date.now(); d.changedAt = new Date().toISOString(); db.routeLogs.write([d]); return d; }
};

const Click = {
  create: (d) => { d._id = 'c_' + Date.now(); d.clickedAt = new Date().toISOString(); db.clicks.write([d]); return d; }
};

const Product = {
  create: (d) => {
    d._id = 'p_' + Date.now();
    d.created_at = new Date().toISOString();
    d.views = d.views || 0;
    d.price = Number(d.price);
    d.originalPrice = Number(d.originalPrice);
    if (!d.images) d.images = [];
    if (d.image && !d.images.includes(d.image)) d.images.unshift(d.image);
    db.products.write([d]);
    return d;
  },
  find: (f) => db.products.find(f),
  findById: (id) => db.products.findById(id),
  findByIdAndUpdate: (id, up) => {
    if (up.price) up.price = Number(up.price);
    if (up.originalPrice) up.originalPrice = Number(up.originalPrice);
    if (up.image) {
      if (!up.images || up.images.length === 0) { up.images = [up.image]; }
      else if (!up.images.includes(up.image)) { up.images.unshift(up.image); }
    }
    return db.products.findByIdAndUpdate(id, up);
  },
  findByIdAndDelete: (id) => db.products.findByIdAndDelete(id),
  incrementViews: (id) => db.products.incrementViews(id),
  countDocuments: () => db.products.countDocuments()
};

const Comment = {
  create: (d) => { d._id = 'cm_' + Date.now(); d.created_at = new Date().toISOString(); db.comments.write([d]); return d; },
  findByProduct: (productId) => db.comments.findByProduct(productId),
  findByIdAndDelete: (id) => db.comments.findByIdAndDelete(id)
};

module.exports = { User, Link, Session, Trash, MenuItem, RouteLog, Click, Product, Comment };