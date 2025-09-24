const ccxt = require('ccxt');
const {decrypt} = require('../utils/encryption');
const TradingBot = require('../models/TradingBot');
const Trade = require('../models/Trade');
const SMAStrategy = require('../strategies/smaStrategy');
const RSIStrategy = require('../strategies/rsiStrategy');
const GridStrategy = require('../strategies/GridStrategy');
const DCAStrategy = require('../strategies/dcaStrategy');

class StrategyEngine {
    constructor(){
        this.exchangeInstances = new Map();
    }

    // Execute SMA Strategy
    async executeSMAStrategy(bot, prices, ticker, balance){
        return await SMAStrategy.execute(bot, prices, ticker, balance);
    }

    // Execute RSI Strategy
    async executeRSIStrategy(bot, prices, ticker, balance){
        return await RSIStrategy.execute(bot, prices, ticker, balance);
    }

    // Execute Grid Strategy
    async executeGridStrategy(bot, ticker, balance, exchange){
        return await GridStrategy.execute(bot, ticker, balance, exchange);
    }

    // Execute DCA Strategy
    async executeDCAStrategy(bot, ticker, balance){
        return await DCAStrategy.execute(bot, ticker, balance);
    }

    // Get or create exchange instance for a bot
    async getExchangeInstance(bot){
        const key = `${bot.exchangeAccountId._id}_${bot._id}`;

        if(this.exchangeInstances.has(key)){
            return this.exchangeInstances.get(key);
        }

        const exchangeAccount = bot.exchangeAccountId;
        const apiKey = decrypt(exchangeAccount.apiKey);
        const apiSecret = decrypt(exchangeAccount.apiSecret);

        let exchangeClass;
        let config = {
            apiKey,
            secret: apiSecret,
            sandbox: exchangeAccount.testnet,
            enableRateLimit: true
        };

        // Config exchange
        if(exchangeAccount.exchange === 'binance'){
            exchangeClass = ccxt.binance;
            if(exchangeAccount.testnet){
                config.urls = {
                    api:{
                        public: 'https://testnet.binance.vision/api',
                        private: 'https://testnet.binance.vision/api'
                    }
                }
            }
        }else if(exchangeAccount.exchange === 'delta'){
            exchangeClass = ccxt.delta;
            if(exchangeAccount.testnet){
                config.urls = {
                    api: {
                        public: 'https://testnet-api.delta.exchange',
                        private: 'https://testnet-api.delta.exchange'
                    }
                }
            }
        }

        const exchange = new exchangeClass(config);
        this.exchangeInstances.set(key, exchange);

        return exchange;
    }

    // Execute strategy for a bot
    async executeStrategy(bot){
        try{
            // Validate bot has required fields
            if(!bot.strategyId){
                throw new Error('Bot strategyId is null or undefined');
            }
            
            if(!bot.strategyId.name){
                throw new Error('Bot strategyId.name is null or undefined');
            }
            
            console.log(`Executing strategy: ${bot.strategyId.name} for bot: ${bot.name}`);

            const exchange = await this.getExchangeInstance(bot);

            // Get current market data
            const ticker = await exchange.fetchTicker(bot.symbol);
            const ohlcv = await exchange.fetchOHLCV(bot.symbol, '1m', undefined, 100);

            // Get current balance
            const balance = await exchange.fetchBalance();

            // convert OHLCV to price array for indicators
            const prices = ohlcv.map(candle => candle[4]);  // closing prices

            // Execute specific strategy based on strategy name
            const strategyName = bot.strategyId.name;
            let decision;

            switch(strategyName){
                case 'Simple Moving Average Crossover':
                    decision = await this.executeSMAStrategy(bot, prices, ticker, balance);
                    break;
                case 'RSI Mean Reversion':
                    decision = await this.executeRSIStrategy(bot, prices, ticker, balance);
                    break;
                case 'Grid Trading':
                    decision = await this.executeGridStrategy(bot, ticker, balance, exchange);
                    break;
                case 'DCA (Dollar Cost Averaging)':
                    decision = await this.executeDCAStrategy(bot, ticker, balance)
                    break;
                default: 
                    console.log(`Unknown strategy: ${strategyName}`)
                    return;
            }

            // Execute the trading decision
            if(decision && decision.action !== 'hold'){
                await this.executeTrade(bot, decision, exchange)
            }

            // Update bot performance
            await this.updateBotPerformance(bot);
        } catch(error){
            console.error(`Strategy execution error for bot ${bot.name}:`, error);

            // Update bot with error status
            await TradingBot.findByIdAndUpdate(bot._id, {
                status: 'error',
                errorMessage: error.message
            });

            throw error;
        }
    }

    // Execute actual trade 
    async executeTrade(bot, decision, exchange){
        try{
            console.log(`Executing ${decision.action} trade for ${bot.symbol}:`, decision);

            let order;
            const symbol = bot.symbol;
            const amount = decision.amount;
            const price = decision.price;

            if(decision.action === 'buy'){
                if(decision.type === 'market'){
                    order = await exchange.createMarketBuyOrder(symbol, amount);
                }else{
                    order = await exchange.createLimitBuyOrder(symbol, amount, price);
                }
            }else if(decision.action === 'sell'){
                if(decision.type === 'market'){
                    order = await exchange.createMarketSellOrder(symbol, amount);
                }else{
                    order = await exchange.createLimitSellOrder(symbol, amount, price);
                }
            }

            // save trade to database
            const trade = new Trade({
                userId: bot.userId,
                botId: bot._id,
                exchangeAccountId: bot.exchangeAccountId._id,
                symbol: bot.symbol,
                side: decision.action,
                type: decision.type,
                amount: order.amount,
                price: order.price || decision.price,
                cost: order.cost,
                fee: order.fee,
                status: order.status === 'closed' ? 'filled' : 'pending',
                exchangeOrderId: order.id,
                strategy: bot.strategyId.name,
                reason: decision.reason,
                executedAt: order.status === 'closed' ? new Date() : null
            });

            await trade.save();
            console.log(`Trade saved: ${trade._id}`);

            return order;
        }catch(error){
            console.error('Trade execution error:', error);
            throw error;
        }
    }

    // Update bot performance metrics
    async updateBotPerformance(bot){
        try{
            const trades = await Trade.find({botId: bot._id}).sort({createdAt: -1});
            
            const totalTrades = trades.length;
            const winningTrades = trades.filter(t => t.pnl > 0).length;
            const losingTrades = trades.filter(t => t.pnl < 0).length;
            const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

            // Calculate current Pnl (unrealized)
            const openTrades = trades.filter(t => t.status === 'filled' && t.side === 'buy');
            // this would need current market price to calculate unrealized Pnl

            // Calculate max drawdown
            let peak = 0;
            let maxDrawdown = 0;
            let runningPnl = 0;

            for(const trade of trades.reverse()){
                runningPnl += trade.pnl || 0;
                if(runningPnl > peak) peak = runningPnl;
                const drawdown = (peak - runningPnl) / Math.max(peak, 1);
                if(drawdown > maxDrawdown) maxDrawdown = drawdown;
            }

            await TradingBot.findByIdAndUpdate(bot._id, {
                'performance.totalTrades': totalTrades,
                'performance.winningTrades': winningTrades,
                'performance.losingTrades': losingTrades,
                'performance.totalPnl': totalPnl,
                'performance.maxDrawdown': maxDrawdown,
                lastExecution: new Date()
            });
        }catch(error){
            console.error('Error updating bot performance:', error);
        }
    }
}

module.exports = StrategyEngine; 