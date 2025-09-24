class DCAStrategy{
    
    static async execute(bot, ticker, balance){
        try{
            const settings = bot.settings;
            const amount = settings.amount || 10; // USDT per purchase
            const maxPrice = settings.maxPrice || 0; // Max price to buy at (0 = no limit)
            const interval = settings.interval || '1h';

            console.log(`DCA Strategy - Amount: ${amount} USDT, Max price: ${maxPrice || 'No limit'}`);

            const currentPrice = ticker.last;

            // Check if price is within acceptable range
            if(maxPrice > 0 && currentPrice > maxPrice){
                return {
                    action: 'hold',
                    reason: `Price ${currentPrice} exceeds max price ${maxPrice}`
                };
            }

            // Check available balance
            const availableBalance = balance[bot.allocation.currency]?.free || 0;

            if(availableBalance < amount){
                return {
                    action: 'hold',
                    reason: `Insufficient balance, Available: ${availableBalance}, Required: ${amount}`
                }
            }

            // Check if We've already made a purchase recently (based on interval)
            const intervalMinutes = this.parseInterval(interval);
            const lastExecution = bot.lastExecution || new Date(0);
            const timeSinceLastExecution = (Date.now() - lastExecution) / (1000 * 60);
            
            if(timeSinceLastExecution < intervalMinutes){
                const remainingMinutes = Math.ceil(intervalMinutes - timeSinceLastExecution);
                return {
                    action: 'hold',
                    reason: `DCA interval not reached. Next purchase in ${remainingMinutes} minutes`
                };
            }

            // Calculate buy amount
            const buyAmount = amount / currentPrice;

            console.log(`DCA buy: ${buyAmount} at ${currentPrice}`);

            return {
                action: 'buy',
                type: 'market',
                amount: buyAmount,
                price: currentPrice,
                reason: `DCA purchase - ${amount} USDT every ${interval}`
            }
        }catch(error){
            console.error('DCA Strategy execution error:', error);
            throw error;
        }
    }

    static parseInterval(interval){
        const intervalMap = {
            '15m': 15,
            '30m': 30,
            '1h': 60,
            '4h': 240,
            '1d': 1440
        };

        return intervalMap[interval] || 60;  // Default to 1 hour
    }
}

module.exports = DCAStrategy;