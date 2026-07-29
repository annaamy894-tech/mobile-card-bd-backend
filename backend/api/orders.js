const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware');

router.get('/my', authenticate, (req, res) => {
  try {
    const all = db.orders.read();
    const myOrders = all.filter(o => o.userId === req.user._id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(myOrders);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const orders = db.orders.read();
    const order = orders.find(o => o._id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== req.user._id) return res.status(403).json({ message: 'Not your order' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', authenticate, (req, res) => {
  try {
    const { productId, productName, price, paymentMode, address } = req.body;

    if (!productId || !productName || !price) {
      return res.status(400).json({ message: 'Missing required fields: productId, productName, price' });
    }
    if (!paymentMode || !['cod', 'online'].includes(paymentMode)) {
      return res.status(400).json({ message: 'Invalid paymentMode. Must be cod or online' });
    }

    const products = db.products.read();
    const product = products.find(p => p._id === productId);

    const order = {
      _id: 'ord_' + Date.now(),
      userId: req.user._id,
      productName: productName,
      productId: productId,
      productImage: (product && product.image) ? product.image : (product && product.images && product.images[0]) ? product.images[0] : '',
      productSpecs: (product && product.specs) ? product.specs : '',
      productColor: (product && product.color) ? product.color : '#6366f1',
      price: Number(price),
      paymentMode: paymentMode,
      paymentStatus: 'pending',
      address: address || '',
      created_at: new Date().toISOString()
    };

    const orders = db.orders.read();
    orders.push(order);
    db.orders.write(orders);
    res.status(201).json(order);
  } catch (err) {
    console.error('Order creation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', authenticate, (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!paymentStatus) return res.status(400).json({ message: 'paymentStatus required' });
    const orders = db.orders.read();
    const idx = orders.findIndex(o => o._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Order not found' });
    orders[idx].paymentStatus = paymentStatus;
    db.orders.write(orders);
    res.json({ message: 'Status updated', paymentStatus });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', authenticate, (req, res) => {
  try {
    const orders = db.orders.read();
    const idx = orders.findIndex(o => o._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Order not found' });
    if (orders[idx].userId !== req.user._id) return res.status(403).json({ message: 'Not your order' });
    orders.splice(idx, 1);
    db.orders.write(orders);
    res.json({ message: 'Order deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;