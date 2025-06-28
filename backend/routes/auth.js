const express = require('express');
const router = express.Router();
const { authController } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback, authController.handleCallback);
router.get('/me', auth, authController.getCurrentUser);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/test', authController.testOAuth);

module.exports = router; 