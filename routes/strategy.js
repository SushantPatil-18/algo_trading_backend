const express = require('express');

const {
    getStrategies,
    getStrategiesByCategory,
    getStrategy,
    createTradingBot,
    getTradingBots
} = require('../controllers/strategyController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);


// Get all strategies
router.get('/', getStrategies);


// Get strategies by category
router.get('/category/:category', getStrategiesByCategory);

// Get single strategy
router.get('/:strategyId', getStrategy);

// Trading bot routes
router.post('/bots', createTradingBot);
router.get('/bots/my', getTradingBots);

module.exports = router;