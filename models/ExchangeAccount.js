const mongoose = require('mongoose');

const exchangeAccountSchema = mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exchange:{
        type: String,
        enum: ['binance', 'delta'],
        required: true,
    },
    label:{
        type: String,
        required: true,
        trim: true
    },
    apiKey:{
        type: String,
        required: true
    },
    apiSecret: {
        type: String,
        required: true
    },
    testnet:{
        type: Boolean,
        default: false
    },
    isActive:{
        type: Boolean,
        default: true
    },
    permissions:{
        spot: {type: Boolean, default: false},
        future: {type: Boolean, default: false},
        margin: {type: Boolean, default: false}
    },
    lastVerified:{
        type: Date,
        default: null   // when we last verified the api key works
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one user can't have duplicate exchange accounds with same lable
exchangeAccountSchema.index({userId:1,exchange: 1, label: 1}, {unique: true})

module.exports = mongoose.model('ExchangeAccount',exchangeAccountSchema);