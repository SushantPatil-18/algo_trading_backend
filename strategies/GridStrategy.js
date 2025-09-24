class GridStrategy{
    static async execute(bot, ticker, balance, exchange){
        try{
            const settings = bot.settings;
            const gridLevels = settings.gridLevels || 10;
            const gridSpacing = settings.gridSpacing || 1; // percentage
            const orderSize = settings.orderSize || 50; //USDT
            const basePrice = settings.basePrice || 'current';

            console.log(`Grid Strategy - Levels: ${gridLevels}, Spacing: ${gridSpacing}%, Order Size: ${orderSize}`);

            const currentPrice = ticker.last;
            let centerPrice;
            
            // Determine center price
            if(basePrice === 'current'){
                centerPrice = currentPrice;
            }else{
                // For now, just use current price, Later can add SMA or manual price
                centerPrice = currentPrice;
            }

            console.log(`Center price: ${centerPrice}, Current price: ${currentPrice}`);

            // Get open orders
            const openOrders = await exchange.fetchOpenOrders(bot.symbol);
            const buyOrders = openOrders.filter(order => order.side === 'buy');
            const sellOrders = openOrders.filter(order => order.side === 'sell');

            console.log(`Open orders - Buy: ${buyOrders.length}, Sell: ${sellOrders.length}`);

            // Calculate grid levels
            const gridPrices = this.calculateGridLevels(centerPrice, gridLevels, gridSpacing);

            // Check if we need to place new orders
            const ordersToPlace = [];

            // Check buy levels (below current price)
            for(const level of gridPrices.buyLevels){
                const hasOrderAtLevel = buyOrders.some(order => Math.abs(order.price - level) / level < 0.001);  // 0.1% tolerance 

                if(!hasOrderAtLevel && level < currentPrice){
                    ordersToPlace.push({
                        action: 'buy',
                        type: 'limit',
                        amount: orderSize / level,
                        price: level,
                        reason: `Grid buy order at ${level.toFixed(4)}`
                    });
                }
            }

            // Check sell levels (above current price)
            for(const level of gridPrices.sellLevels){
                const hasOrderAtLevel = sellOrders.some(order => Math.abs(order.price - level) / level < 0.001);

                const [baseCurrency] = bot.symbol.split('/');
                const baseBalance = balance[baseCurrency]?.free || 0;

                if(!hasOrderAtLevel && level > currentPrice && baseBalance > 0){
                    const sellAmount = Math.min(orderSize / level, baseBalance * 0.1); // Dont sell more than 10% at once

                    if(sellAmount > 0){
                        ordersToPlace.push({
                            action: 'sell',
                            type: 'limit',
                            amount: sellAmount,
                            price: level,
                            reason: `Grid sell order at ${level.toFixed(4)}`
                        });
                    }
                }
            }

            // Limit the number of orders to place at once
            const maxOrdersPerExecution = 2;
            if(ordersToPlace.length > maxOrdersPerExecution){
                return ordersToPlace.slice(0, maxOrdersPerExecution);
            }

            if(ordersToPlace.length > 0){
                console.log(`Placing ${ordersToPlace.length} grid orders`);
                return ordersToPlace[0]; // Return first order (execute once at a time)
            }

            return {
                action: 'hold',
                reason: `Grid maintained - ${buyOrders.length + sellOrders.length} orders active`
            };
        }catch(error){
            console.error('Grid Strategy execution error:', error);
            throw error;
        }
    }

    static calculateGridLevels(centerPrice, levels, spacing){
        const buyLevels = [];
        const sellLevels = [];

        const halfLevels = Math.floor(levels / 2);

        // Calculate buy levels (Below center price)
        for(let i = 1; i <= halfLevels; i++){
            const price = centerPrice * (1 - (spacing * i) / 100);
            buyLevels.push(price);
        }


        // Calculate sell levels (above center price)
        for(let i = 1; i <= halfLevels; i++){
            const price = centerPrice * (1 + (spacing * i) / 100);
            sellLevels.push(price);
        }

        return {
            buyLevels: buyLevels.sort((a, b) => b - a), // Highest first
            sellLevels: sellLevels.sort((a, b) => a - b),  // Lowest first
            centerPrice
        }
    }
}

module.exports = GridStrategy;