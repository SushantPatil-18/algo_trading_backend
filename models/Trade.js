const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    botId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradingBot',
        required: true
    },
    exchangeAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExchangeAccount',
        required: true
    },
    symbol:{
        type: String,
        required: true
    },
    side: {
        type: String,
        enum: ['buy', 'sell'],
        required: true
    },
    type: {
        type: String,
        enum: ['market', 'limit', 'stop'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    cost: {
        type: Number,
        required: true  // amount * price
    },
    fee: {
        currency: String,
        cost: Number
    },
    status: {
        type: String,
        enum: ['pending', 'filled', 'cancelled', 'failed'],
        default: 'pending'
    },
    exchangeOrderId: {
        type: String,
        required: true
    },
    strategy:{
        type: String,
        required: true
    },
    reason: {
        type: String, // why the trade was made (e.g., 'sma crossover')
        required: true
    },
    pnl: {
        type: Number,
        default: 0  // profit/loss for this trade
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    executedAt: {
        type: Date,
        default: null
    }
});

// Index for efficient queries
tradeSchema.index({userId: 1, createdAt: -1});
tradeSchema.index({botId: 1, createdAt: -1});

module.exports = mongoose.model('Trade', tradeSchema);