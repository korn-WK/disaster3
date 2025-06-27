const express = require('express');
const router = express.Router();
const disasterAnalysisService = require('../services/disasterAnalysisService');

// GET /api/analysis/reports - วิเคราะห์รายงานภัยพิบัติทั้งหมดในช่วงเวลาที่กำหนด
router.get('/reports', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const analysis = await disasterAnalysisService.analyzeDisasterReports(timeRange);
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Error in analysis route:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถวิเคราะห์ข้อมูลได้' });
  }
});

// GET /api/analysis/disaster-type/:type - วิเคราะห์รายงานภัยพิบัติตามประเภท
router.get('/disaster-type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const insights = await disasterAnalysisService.getDisasterTypeInsights(type);
    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('Error in disaster type analysis route:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถวิเคราะห์ข้อมูลได้' });
  }
});

module.exports = router; 