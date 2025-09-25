const TradingBot = require('../models/TradingBot');
const ExchangeAccount = require('../models/ExchangeAccount');
const Strategy = require('../models/Strategy');
const {decrypt} = require('../utils/encryption');
const ccxt = require('ccxt');
const cron = require('node-cron');
const StrategyEngine = require('../services/strategyEngine');
const emailService = require('../services/emailService');

// Create strategy engine instance
const strategyEngine = new StrategyEngine();


// Store active cron jobs
const activeBots = new Map();

// Start Trading Bot
const startBot = async (req,res) => {
    try{
        const {botId} = req.params;
        const userId = req.userId;

        // Find bot
        const bot = await TradingBot.findOne({_id: botId, userId})
        .populate('exchangeAccountId')
        .populate('strategyId')
        .populate('userId', 'email name emailNotifications');

        if(!bot){
            return res.status(404).json({
                success: false,
                message: 'Trading bot not found'
            });
        }

        if(bot.status === 'running'){
            return res.status(400).json({
                success: false,
                message: 'Bot is already running'
            });
        }

        // Test exchange connection before starting
        const connectionTest = await testBotExchangeConnection(bot);
        if(!connectionTest.success){
            return res.status(400).json({
                success: false,
                message: `Cannot start bot: ${connectionTest.error}`
            });
        }

        // Update bot status
        bot.status = 'running';
        bot.startedAt = new Date();
        bot.errorMessage = null;
        await bot.save();

        // Start the bot execution
        await startBotExecution(bot);

        // Send email notification
        if(bot.userId.emailNotifications){
            await emailService.sendBotStatusNotification({
                email: bot.userId.email,
                name: bot.userId.name,
                bot: {
                    name: bot.name,
                    symbol: bot.symbol,
                    strategy: bot.strategyId.name
                },
                status: 'started',
                message: 'Your trading bot has been started successfully'
            });
        }

        res.json({
            success: true,
            message: 'Trading bot started successfully',
            bot: {
                id: bot._id,
                name: bot.name,
                status: bot.status,
                startedAt: bot.startedAt
            }
        });
    }catch(error){
        console.error("Start bot error:", error);
        res.status(500).json({
            success: false,
            message: 'Server error while starting bot'
        });
    }
};

// Stop Trading Bot
const stopBot = async(req,res) =>{
    try{
        const {botId} = req.params;
        const userId = req.userId;

        const bot = await TradingBot.findOne({_id: botId, userId })
        .populate('exchangeAccountId')
        .populate('strategyId')
        .populate('userId', 'email name emailNotifications');

        if(!bot){
            return res.status(404).json({
                success: false,
                message: 'Trading bot not found'
            });
        }

        if(bot.status === 'stopped'){
            return res.status(400).json({
                success: false,
                message: 'Bot is already stopped'
            });
        }

        // Stop the bot execution
        await stopBotExecution(botId);

        // Update bot status
        bot.status = 'stopped';
        bot.stoppedAt = new Date();
        await bot.save();

        // Send email notification
        if(bot.userId.emailNotifications){
            await emailService.sendBotStatusNotification({
                email: bot.userId.email,
                name: bot.userId.name,
                bot: {
                    name: bot.name,
                    symbol: bot.symbol,
                    strategy: bot.strategyId.name
                },
                status: 'stopped',
                message: 'Your trading bot has been stopped'
            })
        }

        res.json({
            success: true,
            message: 'Trading bot stopped successfully',
            bot: {
                id: bot._id,
                name: bot.name,
                status: bot.status,
                stoppedAt: bot.stoppedAt
            }
        });
    }catch(error){
        console.error('Stop bot error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while stopping bot'
        });
    }
};

// Pause Trading bot
const pauseBot = async (req,res) =>{
    try{
        const {botId} = req.params;
        const userId = req.userId;

        const bot = await TradingBot.findOne({_id: botId, userId })
        .populate('exchangeAccountId')
        .populate('strategyId')
        .populate('userId', 'email name emailNotifications');

        if(!bot){
            return res.status(404).json({
                success: false,
                message: "Trading bot not found"
            });
        }

        if(bot.status !== 'running'){
            return res.status(400).json({
                success: false,
                message: 'Bot must be running to pause'
            });
        }

        // Pause the bot (stop execution but keep data)
        await stopBotExecution(botId);

        bot.status = 'paused';
        await bot.save();

        // Send email notification
        if(bot.userId.emailNotifications){
            await emailService.sendBotStatusNotification({
                email: bot.userId.email,
                name: bot.userId.name,
                bot: {
                    name: bot.name,
                    symbol: bot.symbol,
                    strategy: bot.strategyId.name
                },
                status: 'paused',
                message: 'Your trading bot has been paused'
            })
        }

        res.json({
            success: true,
            message: 'Trading bot paused successfully',
            bot: {
                id: bot._id,
                name: bot.name,
                status: bot.status
            }
        });
    }catch(error){
        console.error('Pause bot error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while pausing bot'
        });
    }
};

// Resume Trading bot
const resumeBot = async (req,res) => {
    try{
        const {botId} = req.params;
        const userId = req.userId;

        const bot = await TradingBot.findOne({_id: botId, userId })
        .populate('exchangeAccountId')
        .populate('strategyId')
        .populate('userId', 'email name emailNotifications');

        if(!bot){
            return res.status(404).json({
                success: false,
                message: 'Trading bot not found'
            });
        }

        if(bot.status !== 'paused'){
            return res.status(400).json({
                success: false,
                message: 'Bot must be paused to resume'
            });
        }

        // Test connection before resuming
        const connectionTest = await testBotExchangeConnection(bot);
        if(!connectionTest.success){
            return res.status(400).json({
                success: false,
                message: `Cannot resume bot: ${connectionTest.error}`
            });
        }

        bot.status = 'running';
        bot.errorMessage = null;
        await bot.save();

        // Resume bot execution
        await startBotExecution(bot);

        // Send email notification
        if(bot.userId.emailNotifications){
            await emailService.sendBotStatusNotification({
                email: bot.userId.email,
                name: bot.userId.name,
                bot: {
                    name: bot.name,
                    symbol: bot.symbol,
                    strategy: bot.strategyId.name
                },
                status: 'resumed',
                message: 'Your trading bot has been resumed'
            })
        }

        res.json({
            success: true,
            message: 'Trading bot resumed successfully',
            bot: {
                id: bot._id,
                name: bot.name,
                status: bot.status
            }
        });
    }catch(error){
        console.error('Resume bot error: ', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resuming bot'
        });
    }
};

// Get Bot details whith Performance

const getBotDetails = async (req,res) =>{
    try{
        const {botId} = req.params;
        const userId = req.userId;

        const bot = await TradingBot.findOne({_id: botId, userId })
        .populate('strategyId', 'name description category riskLevel')
        .populate('exchangeAccountId', 'exchange label');

        if(!bot){
            return res.status(404).json({
                success: false,
                message: 'Trading bot not found'
            });
        }

        res.json({
            success: true,
            bot
        });
    }catch(error){
        console.error('Get bot details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching bot details'
        });
    }
};

// Update Bot setting
const updateBotSettings = async (req, res) => {
    try{
        const {botId} = req.params;
        const userId = req.userId;
        const{settings, allocation} = req.body;

        const bot = await TradingBot.findOne({_id: botId, userId })
        .populate('strategyId');

        if(!bot){
            return res.status(404).json({
                success: false,
                message: 'Trading bot not found'
            });
        }

        if(bot.status === 'running'){
            return res.status(400).json({
                success: false,
                message: 'Cannot update settings while bot is running. Please pause the bot first.'
            });
        }

        //Validate new settings if provided
        if(settings){
            const strategy = bot.strategyId;
            const validationResult = validateStrategySettings(strategy.parameters, settings);
            if(!validationResult.isValid){
                return res.status(400).json({
                    success: false,
                    message: `Invalid settings: ${validationResult.error}`
                });
            }
            bot.settings = settings;
        }

        // Update allocation if provided
        if(allocation){
            if(allocation.amount < bot.strategyId.minBalance){
            return res.status(400).json({
                success: false,
                message: `Minimum balance required: ${bot.strategyId.minBalance} ${allocation.currency}`
            });
            }
            bot.allocation = allocation;
        }
        await bot.save();
        
        res.json({
            success: true,
            message: 'Bot settings updated successfully',
            bot
        })
    }catch(error){
        console.error('Update bot settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating bot settings'
        });
    }
};

// Delete Trading Bot
const deleteBot = async (req, res) => {
    try{
        const {botId} = req.params;
        const userId = req.userId;

        const bot = await TradingBot.findOne({_id: botId, userId });

        if(!bot){
            return res.status(404).json({
                success: false,
                message: 'Trading bot not found'
            });
        }

        if(bot.status === 'running'){
            return res.status(400).json({
                success: false,
                message: 'Cannot delete a running bot. please stop it first.'
            });
        }

        // stop execution if paused
        if(bot.status === 'paused'){
            await stopBotExecution(botId);
        }

        // Delete the bot
        await TradingBot.findByIdAndDelete(botId);

        res.json({
            success: true,
            message: 'Trading bot deleted successfully'
        });
    }catch(error){
        console.error('Delete bot error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting bot'
        });
    }
};

// Helper function

// Start bot execution with cron job
const startBotExecution = async (bot) =>{
    try{
        const botId = bot._id.toString();

        // Stop existing job if any
        if(activeBots.has(botId)){
            activeBots.get(botId).destroy();
            activeBots.delete(botId);
        }

        // Determine execution interval based on strategy
        let cronPattern = '*/30 * * * * *';  // Default: every 30 seconds

        // Adjust based on strategy type or settings
        if(bot.settings.interval){
            cronPattern = convertIntervalToCron(bot.settings.interval);
        }

        console.log(`Starting bot ${bot.name} with pattern: ${cronPattern}`);

        // Create and start cron job
        const task = cron.schedule(cronPattern, async () => {
            await executeBotStrategy(bot)
        }, {
            scheduled: false
        });

        task.start();
        activeBots.set(botId, task);

        console.log(`Bot ${bot.name} started successfully`);
    }catch(error){
        console.error('Error starting bot execution:', error);
        throw error;
    }
};

// Stop bot execution
const stopBotExecution = async (botId) =>{
    try{
        if(activeBots.has(botId)){
            const task = activeBots.get(botId);
            task.destroy();
            activeBots.delete(botId);
            console.log(`Bot ${botId} execution stopped`);
        }
    }catch(error){
        console.error('Error stopping bot execution:', error);
    }
};

// Convert interval to cron pattern
const convertIntervalToCron = (interval) =>{
    const pattern = {
        '15m': '0 */15 * * * *',
        '30m': '0 */30 * * * *',
        '1h': '0 0 * * * *',
        '4h': '0 0 */4 * * *',
        '1d': '0 0 0 * * *'
    };

    return pattern[interval]  || '*/30 * * * * *'
};

// Execute bot strategy (placeholder - will be implemented with actual strategies)
const executeBotStrategy = async (bot) => {
    try{
        console.log(`Executing strategy for bot: ${bot.name}`);

        // populate required fields if not already populated
        if(!bot.strategyId || !bot.strategyId.name){
            bot = await TradingBot.findById(bot._id)
            .populate('strategyId')
            .populate('exchangeAccountId');
            
            if(!bot){
                throw new Error('Bot not found in database');
            }
            
            if(!bot.strategyId){
                throw new Error('Bot strategyId is null - please check bot configuration');
            }
        }

        // Execute the strategy
        // This will call specific strategy files based on bot.strategyId
        await strategyEngine.executeStrategy(bot);

    }catch(error){
        console.error(`Error executing strategy for bot ${bot.name}:`, error);

        //Update bot status to error
        await TradingBot.findByIdAndUpdate(bot._id, {
            status: 'error',
            errorMessage: error.message
        });

        // Stop the bot
        await stopBotExecution(bot._id.toString());
    }
};

// Test bot exchange connection
const testBotExchangeConnection = async(bot) => {
    try{
        const exchangeAccount = bot.exchangeAccountId;

        // Decrypt credentials
        const apiKey = decrypt(exchangeAccount.apiKey);
        const apiSecret = decrypt(exchangeAccount.apiSecret);

        // Test connection (similar to exchange controller)
        let exchangeClass;
        let exchangeConfig = {
            apiKey,
            secret: apiSecret,
            sandbox: exchangeAccount.testnet,
            enableRateLimit: true,
        };

        if(exchangeAccount.exchange === 'binance'){
            exchangeClass = ccxt.binance;
        }else if(exchangeAccount.exchange === 'delta'){
            exchangeClass = ccxt.delta;
        }

        const exchangeInstance = new exchangeClass(exchangeConfig);
        await exchangeInstance.fetchBalance();

        return {success: true};
    }catch(error){
        return {
            success: false,
            error: error.message
        };
    }
};

// Validate strategy settings (from strategy controller)
const validateStrategySettings = (parameters, settings) => {
    for(const param of parameters){
        const value = settings[param.name];

        if(param.required && (value === undefined || value === null)){
            return {
                isValid: false,
                error: `${param.name} is required`
            };
        }

        if (value === undefined || value === null) continue;

        if(param.type === "number"){
            if(typeof value !== 'number'){
                return {
                    isValid: false,
                    error: `${param.name} must be a number`
                };
            }
            if(param.min !== undefined && value < param.min){
                return {
                    isValid: false,
                    error: `${param.name} must be at least ${param.min}`
                };
            }
            if(param.max !== undefined && value > param.max){
                return{
                    isValid: false,
                    error: `${param.name} must be at most ${param.max}`
                };
            }
        }

        if(param.type === 'select' && param.options){
            if(!param.options.includes(value)){
                return {
                    isValid: false,
                    error: `${param.name} must be one of: ${param.options.join(', ')}`
                }
            }
        }
    }

    return {isValid: true}
};

module.exports = {
    startBot,
    stopBot,
    pauseBot,
    resumeBot,
    getBotDetails,
    updateBotSettings,
    deleteBot
};