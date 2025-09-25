const express = require('express');
const {updateEmailSettings, testEmail} = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Update email settings
router.put('/email', updateEmailSettings);

// Test email notification
router.post('/email/test', testEmail);

module.exports = router;