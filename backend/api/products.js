const express = require('express');
const router = express.Router();
const { Product, Comment } = require('../models');

router.get('/', (req, res) => {
  try { res.json(Product.find(req.query)); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id', (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    Product.incrementViews(req.params.id);
    res.json(product);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id/comments', (req, res) => {
  try { res.json(Comment.findByProduct(req.params.id)); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/:id/comments', (req, res) => {
  try {
    const { name, text } = req.body;
    if (!name || !text) return res.status(400).json({ message: 'Name and text required' });
    const comment = Comment.create({ productId: req.params.id, name, text });
    res.status(201).json(comment);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;