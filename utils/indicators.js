const {SMA, RSI, EMA, MACD, BollingerBands} = require('technicalindicators');

class TechnicalIndicators{

    // Simple Moving Average
    static calculateSMA(prices, period){
        if(prices.length < period) return null;

        const sma = SMA.calculate({
            period,
            values: prices
        });

        return sma;
    }

    // Exponential Moving Average
    static calculateEMA(prices, period = 14){
        if(prices.length < period + 1) return null;

        const ema = EMA.calculate({
            period,
            values: prices
        });
        return ema;
    }

    // Relative Strength Index
    static calculateRSI(prices, period = 14){
        if(prices.length < period + 1 ) return null;

        const rsi = RSI.calculate({
            period,
            values: prices
        });
        return rsi;
    }

    // Moving Average Convergence Divergence
    static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9){
        if(prices.length < slowPeriod + signalPeriod) return null;

        const macd = MACD.calculate({
            values: prices,
            fastPeriod,
            slowPeriod,
            signalPeriod,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });

        return macd;
    }

    // Bollinger Bands
    static calculateBollingerBands(prices, period = 20, stdDev = 2){
        if(prices.length < period) return null;

        const bb = BollingerBands.calculate({
            period,
            values: prices,
            stdDev
        });

        return bb;
    }

    // Get last value from indicator array
    static getLastValue(indicatorArray){
        return indicatorArray && indicatorArray.length > 0 ? indicatorArray[indicatorArray.length - 1] : null;
    }

    // Check for SMA crossover
    static checkSMACrossover(fastSMA, slowSMA){
        if(!fastSMA || !slowSMA || fastSMA.length < 2 || slowSMA.length < 2){
            return null;
        }

        const currentFast = fastSMA[fastSMA.length - 1];
        const prevFast = fastSMA[fastSMA.length - 2];
        const currentSlow = slowSMA[slowSMA.length - 1];
        const prevSlow = slowSMA[slowSMA.length - 2];

        // Golden cross (bullish)
        if(prevFast <= prevSlow && currentFast > currentSlow){
            return 'golden_cross';
        }

        // Death cross (bearish)
        if(prevFast >= prevSlow && currentFast < currentSlow){
            return 'death_cross';
        }

        // No crossover
        return 'no_crossover';
    }

    // Calculate position size based on risk
    static calculatePositionSize(balance, price, riskPercent = 2, currency = 'USDT'){
        const availableBalance = balance[currency]?.free || 0;
        const riskAmount = availableBalance * (riskPercent / 100);
        const positionSize = riskAmount / price;

        return{
            size: positionSize,
            value: riskAmount,
            availableBalance
        };
    }

    // Calculate stop loss and take profit prices
    static calculateStopLossTakeProfit(entryPrice, side, stopLossPercent, takeProfitPercent){
        if(side === 'buy'){
            return{
                stopLoss: entryPrice * (1 - stopLossPercent / 100),
                takeProfit: entryPrice * (1 + takeProfitPercent / 100)
            };
        }else{
            return{
                stopLoss: entryPrice * (1 + stopLossPercent / 100),
                takeProfit: entryPrice * (1 - takeProfitPercent / 100)
            };
        }
    }
}

module.exports = TechnicalIndicators;