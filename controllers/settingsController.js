const User = require('../models/User');

// Update email notification settings
const updateEmailSettings = async (req, res) => {
    try{
        const userId = req.userId;
        const {emailNotifications} = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            {emailNotifications},
            {new: true}
        ).select('-password');

        res.json({
            success: true,
            message: 'Email settings updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                emailNotifications: user.emailNotifications
            }
        });
    }catch(error){
        console.error('Update email settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating settings'
        });
    }
};

// Test email notification
const testEmail = async(req, res) => {
    try{
        const userId = req.userId;
        const user = await User.findById(userId).select('-password');

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        // Send test email 
        const emailService = require('../services/emailService');

        await emailService.sendBotStatusNotification({
            email: user.email,
            name: user.name,
            bot:{
                name: 'Test Bot',
                symbol: 'BTC/USDT',
                strategy: 'Test Strategy'
            },
            status: 'started',
            message: 'This is a test notification to verify your email settings'
        });

        res.json({
            success: true,
            message: 'Test email sent successfully'
        });
    }catch (error){
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email'
        })
    }
};

module.exports = {
    updateEmailSettings,
    testEmail
};
