const express = require('express');

const {getDashboard, getBotAnalytics} = require('../controllers/dashboardController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routers require authentication
router.use(authMiddleware);

// Dashboard overview
router.get('/',getDashboard);

// Bot analytics
router.get('/bots/:botId/analytics', getBotAnalytics);

module.exports = router;