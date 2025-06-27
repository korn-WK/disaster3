const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// POST - สร้างรายงานใหม่
router.post('/', reportController.createReport);

// GET - ดึงรายการรายงานทั้งหมด
router.get('/', reportController.getAllReports);

module.exports = router;