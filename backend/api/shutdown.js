const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware');

router.all('/', authenticate, isAdmin, (req, res) => {
  try {
    res.json({ message: 'System PERMANENTLY shut down. Restart from Render dashboard.' });
    console.log('PERMANENT SHUTDOWN triggered by admin:', req.user?._id);
    setInterval(() => {}, 1000);
  } catch (err) {
    res.status(500).json({ message: 'Shutdown failed' });
  }
});

module.exports = router;