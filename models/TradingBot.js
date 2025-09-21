const mongoose = require('mongoose');

const tradingBotSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exchangeAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExchangeAccount',
        required: true
    },
    strategyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strategy',
        required: true
    },
    name:{
        type: String,
        required: true,
        trim: true
    },
    symbol:{
        type: String,
        required: true
    },
    status:{
        type: String,
        enum: ['stopped','running','paused','error'],
        default: 'stopped'
    },
    settings:{
        type: Object,
        required: true
    },
    allocation:{
        amount:{
            type: Number,
            required: true
        },
        currency:{
            type: String,
            required: true,
            default: 'USDT'
        }
    },
    performance:{
        totalTrades: {type: Number, default: 0},
        winningTrades: {type: Number, default: 0},
        losingTrades: {type: Number, default: 0},
        totalPnl: {type: Number, default: 0},
        currentPnl: {type: Number, default: 0},
        maxDrawdown:{type: Number,default: 0}
    },
    lastExecution: {
        type: Date,
        default: null
    },
    stoppedAt:{
        type: Date,
        default: null
    },
    errorMessage: {
        type: String,
        default: null
    },
    createdAt:{
        type: Date,
        default: Date.now
    }

});

tradingBotSchema.index({userId: 1, name: 1}, {unique: true});

module.exports = mongoose.model('TradingBot',tradingBotSchema);