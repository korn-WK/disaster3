const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// ตัวอย่าง route admin
router.get('/dashboard', auth, requireAdmin, (req, res) => {
  res.json({ message: 'Admin dashboard data', user: req.user });
});

module.exports = router; 