const express = require('express');
const router = express.Router();
const { User, MenuItem, Product, Comment } = require('../models');
const { authenticate, isAdmin } = require('../middleware');

router.get('/users', authenticate, isAdmin, (req, res) => {
  try {
    const users = User.find();
    res.json({ users });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/users/pending', authenticate, isAdmin, (req, res) => {
  try { res.json(User.find({ status: 'pending' })); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/users/:id/approve', authenticate, isAdmin, (req, res) => {
  try {
    const code = 'TRK' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const user = User.findByIdAndUpdate(req.params.id, { status: 'active', trackingCode: code });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/users/:id/reject', authenticate, isAdmin, (req, res) => {
  try { User.findByIdAndDelete(req.params.id); res.json({ message: 'Rejected' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.patch('/users/:id/block', authenticate, isAdmin, (req, res) => {
  try { User.findByIdAndUpdate(req.params.id, { status: 'blocked' }); res.json({ message: 'Blocked' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.patch('/users/:id/unblock', authenticate, isAdmin, (req, res) => {
  try { User.findByIdAndUpdate(req.params.id, { status: 'active' }); res.json({ message: 'Unblocked' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/stats', authenticate, isAdmin, (req, res) => {
  try {
    res.json({ total: User.countDocuments(), active: User.countDocuments({ status: 'active' }), pending: User.countDocuments({ status: 'pending' }), blocked: User.countDocuments({ status: 'blocked' }) });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/menu-items', authenticate, isAdmin, (req, res) => {
  try { res.json(MenuItem.find()); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/menu-items', authenticate, isAdmin, (req, res) => {
  try { const item = MenuItem.create(req.body); res.status(201).json(item); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/menu-items/:id', authenticate, isAdmin, (req, res) => {
  try { MenuItem.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/products', authenticate, isAdmin, (req, res) => {
  try { res.json(Product.find(req.query)); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/products', authenticate, isAdmin, (req, res) => {
  try { const product = Product.create(req.body); res.status(201).json(product); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/products/:id', authenticate, isAdmin, (req, res) => {
  try { const product = Product.findByIdAndUpdate(req.params.id, req.body); res.json(product); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/products/:id', authenticate, isAdmin, (req, res) => {
  try { Product.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/comments/:productId', authenticate, isAdmin, (req, res) => {
  try { res.json(Comment.findByProduct(req.params.productId)); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/comments/:id', authenticate, isAdmin, (req, res) => {
  try { Comment.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;