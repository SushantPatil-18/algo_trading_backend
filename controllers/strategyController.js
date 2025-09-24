const Strategy = require('../models/Strategy');
const ExchangeAccount = require('../models/ExchangeAccount');
const TradingBot = require('../models/TradingBot');
const StrategyTester = require('../utils/strategyTester');
const StrategyEngine = require('../services/strategyEngine');

// Get all available strategies
const getStrategies = async (req, res) => {
    try{
        const strategies = await Strategy.find({isActive: true}).sort({category: 1, name: 1});

        res.json({
            success: true,
            strategies
        });
    }
    catch(error){
        console.error("Get strategies error: ", error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching strategies'
        });
    }
};

// Get strategies by category
const getStrategiesByCategory = async (req,res) =>{
    try{
        const {category} = req.params;

        const strategies = await Strategy.find({
            category,
            isActive: true
        }).sort({name:1});
    
        res.json({
            success: true,
            strategies,
            category
        });
    }catch(error){
        console.error("Get strategies by category error:",error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching strategies'
        });
    }
};

// Get single strategy details
const getStrategy = async (req,res) => {
    try{
        const {strategyId} = req.params;

        const strategy = await Strategy.findById(strategyId)

        if(!strategy){
            return res.status(404).json({
                success: false,
                message: 'Strategy not found'
            });
        }

        res.json({
            success: true,
            strategy
        })
    }catch(error){
        console.error("Get strategy error: ", error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching strategy'
        });
    }
};

// Create trading bot
const createTradingBot = async (req,res) => {
    try{
        const userId = req.userId;

        const{
            name,
            exchangeAccountId,
            strategyId,
            symbol,
            settings,
            allocation
        } = req.body;

        // Validation
        if (!name || !exchangeAccountId || !strategyId || !symbol || !settings || !allocation){
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        } 

        // Verify exchange account belongs to user
        const exchangeAccount = await ExchangeAccount.findOne({
            _id: exchangeAccountId,
            userId
        });

        if(!exchangeAccount){
            return res.status(404).json({
                success: false,
                message: 'Exchange account not found'
            })
        }

        // Verfy strategy exists and supports the exchange
        const strategy = await Strategy.findById(strategyId);

        if(!strategy){
            return res.status(404).json({
                success: false,
                message: 'Strategy not found'
            });
        }

        if(!strategy.supportedExchanges.includes(exchangeAccount.exchange)){
            return res.status(400).json({
                success: false,
                message: `Strategy does not support ${exchangeAccount.exchange} exchange`
            });
        }

        // Validate allocation amount
        if(allocation.amount < strategy.minBalance){
            return res.status(400).json({
                success: false,
                message: `Minimum balance required: ${strategy.minBalance} ${allocation.currency}`
            });
        }

        // Validate strategy settings
        const validationResult = validateStrategySettings(strategy.parameters, settings);
        if(!validationResult.isValid){
            return res.status(400).json({
                success: false,
                message: `Invalid settings: ${validationResult.error}`
            })
        }

        // Create trading bot
        const tradingBot = new TradingBot({
            userId,
            exchangeAccountId,
            strategyId,
            name,
            symbol: symbol.toUpperCase(),
            settings,
            allocation
        });
        await tradingBot.save();

        // Populate references for response
        await tradingBot.populate([
            {path: 'strategyId', select: 'name category riskLevel'},
            {path: 'exchangeAccountId', select: 'exchange label'}
        ])

        res.status(201).json({
            success: true,
            message: "Trading bot created successfully",
            bot: tradingBot
        })
    }catch(error){
        console.error("Create trading bot error: ", error);

        // Handle duplicate name error
        if(error.code === 11000){
            return res.status(400).json({
                success: false,
                message: 'A bot with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating trading bot'
        })
    }
}

// Get user's trading bots
const getTradingBots = async (req,res) => {
    try{
        const userId = req.userId;

        const bots = await TradingBot.find({userId})
        .populate('strategyId', 'name category riskLevel')
        .populate('exchangeAccountId', 'exchange label')
        .sort({createdAt: -1});

        res.json({
            success: true,
            bots
        })
    }catch(error){
        console.error("Get trading bots error: ",error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching trading bots"
        });
    }
};

const validateStrategySettings = (parameters, settings) => {
    for (const param of parameters){
        const value = settings[param.name];

        // Check required parameters
        if(param.required && (value === undefined || value === null)){
            return{
                isValid: false,
                error: `${param.name} is required`
            }
        };

        // Skip validation if parameter is not provided and not required
        if(value === undefined || value === null) continue;

        // Type validation
        if(param.type === 'number') {
            if(typeof value !== 'number'){
                return {
                    isValid: false,
                    error: `${param.name} must be a number`
                }
            }

            // Range validation 
            if(param.min !== undefined && value < param.min){
                return {
                    isValid: false,
                    error: `${param.name} must be at least ${param.min}`
                };
            }

            if(param.max !== undefined && value > param.max){
                return {
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
                };
            }
        }
    }

    return {
        isValid: true
    };
    
};

// Test strategy without executing trades
const testStrategy = async (req, res) => {
    try{
        const {botId} = req.params;
        const userId = req.userId;

        const bot = await TradingBot.findOne({_id: botId, userId})
        .populate('strategyId')
        .populate('exchangeAccountId');

        if(!bot){
            return res.status(404).json({
                success: false,
                message: 'Trading bot not found'
            });
        }

        // Create strategy enginr instance
        const strategyEngine = new StrategyEngine();
        const exchange = await strategyEngine.getExchangeInstance(bot);

        // Test the strategy
        const testResult = await StrategyTester.testStrategy(bot, exchange);

        res.json({
            success: true,
            bot:{
                id: bot._id,
                name: bot.name,
                symbol: bot.symbol,
                strategy: bot.strategyId.name
            },
            testResult
        });
    }catch(error){
        console.error('Test strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while testing strategy'
        });
    }
};

// Validate strategy settings
const validateSettings = async(req, res) => {
    try{
        const {strategyId} = req.params;
        const {settings} = req.body;

        const strategy = await Strategy.findById(strategyId);

        if(!strategy){
            return res.status(404).json({
                success: false,
                message: 'Strategy not found'
            });
        }

        const validationResult = validateStrategySettings(strategy.parameters, settings);

        res.json({
            success: true,
            isValid: validationResult.isValid,
            error: validationResult.error || null,
            strategy: {
                name: strategy.name,
                parameters: strategy.parameters
            }
        });
    }catch(error){
        console.error('Validate settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while validating settings'
        });
    }
};

module.exports = {
    getStrategies,
    getStrategiesByCategory,
    getStrategy,
    createTradingBot,
    getTradingBots,
    testStrategy,
    validateSettings
}