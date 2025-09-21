const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description:{
        type: String,
        required: true
    },
    category:{
        type: String,
        enum: ['trend_following', 'mean_reversion','arbitrage','scalping','grid'],
        required: true
    },
    riskLevel:{
        type: String,
        enum: ['low','medium','high'],
        required: true
    },
    minBalance:{
        type: Number,
        required: true,
        default: 100
    },
    parameters: [{
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        defaultValue: mongoose.Schema.Types.Mixed,
        min: Number,
        max: Number,
        options: [String],
        required: {
            type: Boolean,
            default: false
        }
    }],
    supportedExchanges: [{
        type: String,
        enum: ['binance', 'delta']
    }],
    isActive:{
        type: Boolean,
        default: true
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Strategy',strategySchema);