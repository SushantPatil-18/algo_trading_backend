const express = require('express');

const {
    startBot,
    stopBot,
    pauseBot,
    resumeBot,
    getBotDetails,
    updateBotSettings,
    deleteBot
} = require('../controllers/botController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// all routes require authentication
router.use(authMiddleware);

// Bot control routes
router.post('/:botId/start', startBot);
router.post('/:botId/stop', stopBot);
router.post('/:botId/pause', pauseBot);
router.post('/:botId/resume', resumeBot);

// Bot management routes
router.get('/:botId', getBotDetails);
router.put('/:botId/settings', updateBotSettings);
router.delete('/:botId', deleteBot);

module.exports = router;