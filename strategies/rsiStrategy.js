const TechnicalIndicators = require('../utils/indicators');

class RSIStrategy{

    static async execute(bot, prices, ticker, balance){
        try{
            const settings = bot.settings;
            const rsiPeriod = settings.rsiPeriod || 14;
            const oversoldLevel = settings.oversoldLevel || 30;
            const overboughtLevel = settings.overboughtLevel || 70;
            const positionSizePercent = settings.positionSize || 25;

            console.log(`RSI Strategy - Period: ${rsiPeriod}, Oversold: ${oversoldLevel}, Overbought: ${overboughtLevel}`);

            // Calculate RSI
            const rsiValues = TechnicalIndicators.calculateRSI(prices, rsiPeriod);

            if(!rsiValues || rsiValues === 0){
                console.log('Insufficient price data for RSI calculation');
                return {action: 'hold', reason: 'Insufficient data for RSI'};
            }

            const currentRSI = TechnicalIndicators.getLastValue(rsiValues);
            const currentPrice = ticker.last;

            // Get current position
            const [baseCurrency] = bot.symbol.split('/');
            const baseBalance = balance[baseCurrency]?.free || 0;
            const hasPosition = baseBalance > 0;

            console.log(`Current RSI: ${currentRSI.toFixed(2)}, Price: ${currentPrice}, Has position: ${hasPosition}`);

            // Check for oversold condition (buy signal)
            if(currentRSI <= oversoldLevel && !hasPosition){
                const availableBalance = balance[bot.allocation.currency]?.free || 0;

                if(availableBalance < bot.allocation.amount * 0.1){
                    return {
                        action: 'hold',
                        reason: 'Insufficient balance for RSI buy signal'
                    }
                }

                // Calculate position size based on allocation percentage
                const maxBuyAmount = bot.allocation.amount / currentPrice;
                const buyAmount = maxBuyAmount * (positionSizePercent / 100);

                return {
                    action: 'buy',
                    type: 'market',
                    amount: buyAmount,
                    price: currentPrice,
                    reason: `RSI oversold signal - RSI: ${currentRSI.toFixed(2)} <= ${oversoldLevel}`
                };
            }

            // Additional logic: buy on RSI recovery from oversold
            if(rsiValues.length >= 2){
                const prevRSI = rsiValues[rsiValues.length - 2];

                // Buy on RSI recovery (was oversold, now recovering)
                if(prevRSI <= oversoldLevel && currentRSI > oversoldLevel && currentRSI < 50 && !hasPosition){
                    const availableBalance = balance[bot.allocation.currency]?.free || 0;

                    if(availableBalance >= bot.allocation.amount * 0.1){
                        const maxBuyAmount = bot.allocation.amount / currentPrice;
                        const buyAmount = maxBuyAmount * (positionSizePercent / 100);

                        return {
                            action: 'buy',
                            type: 'market',
                            amount: buyAmount,
                            price: currentPrice,
                            reason: `RSI recovery from oversold - Previous RSI: ${prevRSI.toFixed(2)}, current RSI: ${currentRSI.toFixed(2)}`
                        };
                    }
                }

                // sell on RSI decline from overbought
                if(prevRSI >= overboughtLevel && currentRSI < overboughtLevel && currentRSI > 50 && hasPosition){
                    const sellAmount = baseBalance * 0.95;

                    return {
                        action: 'sell',
                        type: 'market',
                        amount: sellAmount,
                        price: currentPrice,
                        reason: `RSI decline from overbought - Previous RSI: ${prevRSI.toFixed(2)}, Current RSI: ${currentRSI.toFixed(2)}`
                    };
                }
            }

            return {
                action: 'hold',
                reason: `RSI neutral - Current RSI: ${currentRSI.toFixed(2)} (Oversold: < ${oversoldLevel}, Overbought: > ${overboughtLevel})`
            };
        }catch(error){
            console.error('RSI Strategy execution error:', error);
            throw error;
        }
    }
}

module.exports = RSIStrategy;