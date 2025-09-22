const TradingBot = require('../models/TradingBot');
const Trade = require('../models/Trade');
const ExchangeAccount = require('../models/ExchangeAccount');

// Get dashboard overview
const getDashboard = async (req, res) =>{
    try{
        const userId = req.userId;

        // Get bot statistics
        const totalBots = await TradingBot.countDocuments({userId});
        const runningBots = await TradingBot.countDocuments({userId, status: 'running' });
        const pausedBots = await TradingBot.countDocuments({userId, status: 'paused' });
        const stoppedBots = await TradingBot.countDocuments({userId, status: 'stopped' });

        // Get recent bots with performance
        const recentBots = await TradingBot.find({userId})
        .populate('strategyId', 'name category riskLevel')
        .populate('exchangeAccountId', 'exchange label')
        .sort({lastExecution: -1})
        .limit(5);

        // Get trade statistics
        const totalTrades = await Trade.countDocuments({userId});
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);

        const todayTrades = await Trade.countDocuments({
            userId,
            createdAt: {$gte: todayStart}
        })

        // Calculate total Pnl
        const pnlResult = await Trade.aggregate([
            {$match: {userId: userId }},
            {$group: {_id: null, totalPnl: {$sum: '$pnl' }}}
        ]);

        const totalPnl = pnlResult[0]?.totalPnl || 0;

        // Get exchange accounts count
        const exchangeAccounts = await ExchangeAccount.countDocuments({userId});

        res.json({
            success: true,
            dashboard: {
                bots:{
                    total: totalBots,
                    running: runningBots,
                    paused: pausedBots,
                    stopped: stoppedBots
                },
                trades: {
                    total: totalTrades,
                    today: todayTrades,
                    totalPnl: parseFloat(totalPnl.toFixed(4))
                },
                exchangeAccounts,
                recentBots
            }
        });
    }catch(error){
        console.error('Get dashboard error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard'
        })
    }
};

// Get bot performance analytics
const getBotAnalytics = async (req, res) => {
    try{
        const {botId} = req.params;
        const userId = req.userId;

        // verify bot belong to user
        const bot = await TradingBot.findOne({_id: botId, userId});
        if(!bot){
            return res.status(404).json({
                success: false,
                message: 'Bot not found'
            });
        }

        // Get trades for this bot
        const trades = await Trade.find({ botId, userId })
        .sort({createdAt: -1})
        .limit(100);

        // Calculate analytics
        const analytics = {
            totalTrades: trades.length,
            winningTrades: trades.filter(t => t.pnl > 0).length,
            losingTrades: trades.filter(t => t.pnl < 0).length,
            totalPnl: trades.reduce((sum, t) => sum + t.pnl, 0),
            avgTradeSize: trades.length > 0 ? trades.reduce((sum, t) => sum + t.cost, 0) / trades.length : 0,
            winRate: trades.length > 0 ? (trades.filter(t => t.pnl > 0).length / trades.length * 100) : 0
        };

        // Get daily Pnl for chart
        const dailyPnl = await Trade.aggregate([
            {$match: {botId: bot._id, userId}},
            {
                $group: {
                    _id: {$dateToString: {format: "%Y-%m-%d",  date: "$createdAt" }},
                    pnl: {$sum: "$pnl"},
                    trades: {$sum: 1}
                }
            },
            {$sort: {_id: 1}},
            {$limit: 30}
        ]);

        res.json({
            success: true,
            analytics,
            dailyPnl,
            recentTrades: trades.slice(0,10)
        });
    }catch(error){
        console.error('Get bot analytics error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching analytics'
        });
    }
};

module.exports = {
    getDashboard,
    getBotAnalytics
}