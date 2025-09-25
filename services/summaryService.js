const cron = require('node-cron');
const User = require('../models/User');
const TradingBot = require('../models/TradingBot');
const Trade = require('../models/Trade');
const emailService = require('../services/emailService');

class SummaryService {

    // Initialize daily summary cron job
    static initDailySummary(){
        // Run every day at 8 AM
        cron.schedule('0 8 * * *', async() => {
            console.log('Generating daily summaries...');
            await this.generateDailySummaries();
        });
    }

    // Generate and send daily summaries to all users
    static async generateDailySummaries(){
        try{
            const users = await User.find({emailNotifications: true});

            for (const user of users){

                const summary = await this.getUserDailySummary(user._id);

                if(summary.totalTrades > 0){
                    await emailService.sendDailySummary({
                        email: user.email,
                        name: user.name,
                        summary
                    });
                }
            }

            console.log(`Daily summaries sent to ${users.length} users`);

        }catch(error){
            console.error('Daily summary generation error:', error);
        }
    }

    // Get daily summary for a user
    static async getUserDailySummary(userId){
        try{
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            // Get today's trades
            const todayTrades = await Trade.find({
                userId,
                createdAt: {$gte: todayStart, $lte: todayEnd}
            });

            // Get active bots
            const activeBots = await TradingBot.countDocuments({
                userId,
                status: 'running'
            });

            // Calculate metrics
            const totalTrades = todayTrades.length;
            const winningTrades = todayTrades.filter(t => t.pnl > 0).length;
            const losingTrades = todayTrades.filter(t => t.pnl < 0).length;
            const totalPnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;

            // Get top performing bots
            const topBots = await TradingBot.aggregate([
                {$match: {userId}},
                {$lookup: {
                    from: 'trades',
                    localField: '_id',
                    foreignField: 'botId',
                    as: 'trades',
                    pipeline: [
                        {$match: {createdAt: {$gte: todayStart, $lte: todayEnd}}}
                    ]
                }},
                {$addFields: {
                    dailyPnl: {$sum: '$trades.pnl'}
                }},
                {$sort: {dailyPnl: -1}},
                {$limit: 3},
                {$project: {
                    name: 1,
                    pnl: '$dailyPnl'
                }}
            ]);

            return {
                totalTrades,
                winningTrades,
                losingTrades,
                totalPnl,
                winRate,
                activeBots,
                topPerformingBots: topBots.filter(bot => bot.pnl !== 0)
            };
        }catch(error){
            console.error('User daily summary error:', error);
            return {
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                totalPnl: 0,
                winRate: 0,
                activeBots: 0,
                topPerformingBots: []
            };
        }
    }
}

module.exports = SummaryService;