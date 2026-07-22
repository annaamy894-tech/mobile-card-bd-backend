const express = require('express');
const router = express.Router();
const { Link } = require('../models');

router.get('/', (req, res) => {
  try { res.json(Link.find()); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id', (req, res) => {
  try {
    const link = Link.findById(req.params.id);
    if (!link) return res.status(404).json({ message: 'Not found' });
    res.json(link);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', (req, res) => {
  try { const link = Link.create(req.body); res.status(201).json(link); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/:id', (req, res) => {
  try { const link = Link.findByIdAndUpdate(req.params.id, req.body); res.json(link); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', (req, res) => {
  try { Link.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;