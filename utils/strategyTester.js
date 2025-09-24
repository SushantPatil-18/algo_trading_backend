const TechnicalIndicators = require('./indicators');
const SMAStrategy = require('../strategies/smaStrategy');
const RSIStrategy = require('../strategies/rsiStrategy');

class StrategyTester {
    static async backtest(strategy, symbol, timeframe, startDate, endDate, settings){
        try{
            console.log(`Backtesting ${strategy} strategy for ${symbol}`);

            // This would fetch historical data for backtesting
            
            const results = {
                strategy,
                symbol,
                timeframe,
                period: `${startDate} to ${endDate}`,
                settings,
                performance: {
                    totalTrades: 0,
                    winningTrades: 0,
                    losingTrades: 0,
                    winRate: 0,
                    totalReturn: 0,
                    maxDrawdown: 0,
                    sharpeRatio: 0
                }
            };

            return results;
        }catch(error){
            console.error('Backtesting error:', error);
            throw error;
        }
    }

    // Test strategy with current market data
    static async testStrategy(bot, exchange){
        try{
            console.log(`Testing strategy for bot: ${bot.name}`);

            // Get market data
            const ticker = await exchange.fetchTicker(bot.symbol);
            const ohlcv = await exchange.fetchOHLCV(bot.symbol, '1m', undefined, 100);
            const balance = await exchange.fetchBalance();

            const prices = ohlcv.map(candle => candle[4]);
            
            // Test the strategy without executing trades
            let decision;
            const strategyName = bot.strategyId.name;

            switch(strategyName){
                case 'Simple Moving Average Crossover':
                    decision = await SMAStrategy.execute(bot, prices, ticker, balance);
                    break;
                case 'RSI Mean Reversion':
                    decision = await RSIStrategy.execute(bot, prices, ticker, balance);
                    break;
                default:
                    decision = {action: 'hold', reason: 'Strategy not implemented for testing'};
            }

            return {
                success: true,
                decision,
                marketData: {
                    price: ticker.last,
                    volume: ticker.baseVolume,
                    change: ticker.percentage
                }
            };
        }catch(error){
            console.error('Strategy testing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = StrategyTester;