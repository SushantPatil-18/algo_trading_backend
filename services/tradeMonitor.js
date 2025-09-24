const Trade = require('../models/Trade');
const TradingBot = require('../models/TradingBot');
// const {sendTradeNotification} = require('./emailService');

class TradeMonitor {

    // Monitor trade execution and update status
    static async monitorTrade(trade, exchange){
        try{
            console.log(`Monitoring trade: ${trade.exchangeOrderId}`);

            // Fetch order status from exchange
            const order = await exchange.fetchOrder(trade.exchangeOrderId, trade.symbol);

            let updateData = {};
            let shouldNotify = false;

            if(order.status === 'closed' && trade.status !== 'filled'){
                updateData = {
                    status: 'filled',
                    executedAt: new Date(),
                    price: order.price,
                    amount: order.amount,
                    cost: order.cost,
                    fee: order.fee
                };
                shouldNotify = true;

                // Calculate Pnl for sell orders
                if(trade.side === 'sell'){
                    const pnl = await this.calculateTradePnl(trade, order);
                    updateData.pnl = pnl;
                }
            }else if(order.status === 'canceled'){
                updateData = {
                    status: 'cancelled'
                };
            }

            if(Object.keys(updateData).length > 0){
                await Trade.findByIdAndUpdate(trade._id, updateData);

                if(shouldNotify){
                    await this.notifyTradeExecution(trade, updateData);
                }
            }
        }catch(error){
            console.log('Trade monitoring error:', error);

            // Mark trade as failed if we can't fetch order
            await Trade.findByIdAndUpdate(trade._id, {
                status: 'failed',
                pnl: 0
            });
        }
    }

    // Calculate Pnl for a trade
    static async calculateTradePnl(sellTrade, sellOrder){
        try{
            // Find corresponding buy trades for this bot
            const buyTrades = await Trade.find({
                botId: sellTrade.botId,
                side: 'buy',
                status: 'filled',
                symbol: sellTrade.symbol,
                createdAt: {$lt: sellTrade.createdAt}
            }).sort({createdAt: 1});

            if(buyTrades.length === 0) return 0;

            // Simple FIFO Pnl calculation
            const avgBuyPrice = buyTrades.reduce((sum, trade) => 
            sum + (trade.price * trade.amount),  0
            ) / buyTrades.reduce((sum, trade) => sum + trade.amount, 0);

            const pnl = (sellOrder.price - avgBuyPrice) * sellOrder.amount;

            return pnl;
        }catch(error){
            console.error('Pnl calculation error:', error);
            return 0;
        }
    }

    // send trade notification
    static async notifyTradeExecution(trade, updateData){
        try{
            const bot = await TradingBot.findById(trade.botId)
            .populate('userId', 'email name emailNotifications');

            if(bot && bot.userId.emailNotifications){
                await sendTradeNotification({
                    email: bot.userId.email,
                    name: bot.userId.name,
                    trade: {
                        ...trade.toObject(),
                        ...updateData
                    },
                    bot: bot.name
                });
            }
        }catch(error){
            console.error('Trade notification error:', error);
        }
    }
}

module.exports = TradeMonitor;