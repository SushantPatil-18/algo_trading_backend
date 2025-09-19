const express = require('express');

const {addExchangeAccount,getExchangeAccounts,deleteExchangeAccount,testAccountConnection} = require('../controllers/exchangeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// all router require authentication
router.use(authMiddleware)

// Add exchange account
router.post('/accounts', addExchangeAccount);

// Get users exchange accounts
router.get('/accounts', getExchangeAccounts);

// Delete exchange account
router.delete('/account/:accountId',deleteExchangeAccount);

// Test account connection
router.post('/account/:accountId/test',testAccountConnection);

module.exports = router
