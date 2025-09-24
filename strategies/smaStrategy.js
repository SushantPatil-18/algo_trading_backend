const TechnicalIndicators = require('../utils/indicators');

class SMAStrategy{
    static async execute(bot, prices, ticker, balance){
        try{
            const settings = bot.settings;
            const fastPeriod = settings.fastPeriod || 10;
            const slowPeriod = settings.slowPeriod || 30;
            const stopLoss = settings.stopLoss || 2;
            const takeProfit = settings.takeProfit || 4;

            console.log(`SMA Strategy - Fast: ${fastPeriod}, slow: ${slowPeriod}`);

            // Calculate moving averages
            const fastSMA = TechnicalIndicators.calculateSMA(prices, fastPeriod);
            const slowSMA = TechnicalIndicators.calculateSMA(prices, slowPeriod);

            if(!fastSMA || !slowSMA){
                console.log('Insufficient price data for SMA calculation');
                return {action: 'hold', reason: 'Insufficient data'};
            }

            // Check for crossover
            const crossover = TechnicalIndicators.checkSMACrossover(fastSMA, slowSMA);
            const currentPrice = ticker.last;

            // Get current position (Check if we have any of the base currency)
            const [baseCurrency] = bot.symbol.split('/');
            const baseBalance = balance[baseCurrency]?.free || 0;
            const hasPosition = baseBalance > 0;

            // Get current SMA values for debugging
            const currentFastSMA = TechnicalIndicators.getLastValue(fastSMA);
            const currentSlowSMA = TechnicalIndicators.getLastValue(slowSMA);

            console.log(`Current price: ${currentPrice}, Crossover: ${crossover}, Has position: ${hasPosition}`);
            console.log(`Fast SMA (${fastPeriod}): ${currentFastSMA?.toFixed(2)}, Slow SMA (${slowPeriod}): ${currentSlowSMA?.toFixed(2)}`);
            console.log(`Base currency: ${baseCurrency}, Base balance: ${baseBalance}`);

            // Trading logic
            if(crossover === 'golden_cross' && !hasPosition){
                // Buy signal
                const positionCalc = TechnicalIndicators.calculatePositionSize(
                    balance,
                    currentPrice,
                    2,
                    bot.allocation.currency
                );

                if(positionCalc.availableBalance < bot.allocation.amount * 0.1){
                    return{
                        action: 'hold',
                        reason: 'Insufficient balance'
                    };
                }

                const buyAmount = Math.min(
                    bot.allocation.amount / currentPrice,
                    positionCalc.size
                );

                const {stopLoss: stopLossPrice, takeProfit: takeProfitPrice} = TechnicalIndicators.calculateStopLossTakeProfit(
                    currentPrice,
                    'buy',
                    stopLoss,
                    takeProfit
                );

                return {
                    action: 'buy',
                    type: 'market',
                    amount: buyAmount,
                    price: currentPrice,
                    stopLoss: stopLossPrice,
                    takeProfit: takeProfitPrice,
                    reason: `Golden cross detected - Fast SMA (${TechnicalIndicators.getLastValue(fastSMA).toFixed(4)}) crossed above slow SMA (${TechnicalIndicators.getLastValue(slowSMA).toFixed(4)})`
                };

            }

            if(crossover === 'death_cross' && hasPosition){
                // Sell signal
                const sellAmount = baseBalance * 0.95;

                return{
                    action: 'sell',
                    type: 'market',
                    amount: sellAmount,
                    price: currentPrice,
                    reason: `Death cross detected - Fast SMA (${TechnicalIndicators.getLastValue(fastSMA).toFixed(4)}) crossed below slow SMA (${TechnicalIndicators.getLastValue(slowSMA).toFixed(4)})`
                };
            }

            // Check for stop loss or take profit if we have a position
            if(hasPosition){
                // This would require storing entry price - simplified for now
                return {action: 'hold', reason: 'Holding position, no exit signal' };
            }

            return {
                action: 'hold',
                reason: `No signal - Fast SMA: ${TechnicalIndicators.getLastValue(fastSMA)?.toFixed(4)}, slow SMA: ${TechnicalIndicators.getLastValue(slowSMA)?.toFixed(4)}`
            };
        }catch(error){
            console.error('SMA Strategy execution error:', error);
            throw error;
        }
    }
}

module.exports = SMAStrategy;