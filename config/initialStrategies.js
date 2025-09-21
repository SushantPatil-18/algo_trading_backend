const strategies = [
    {
        name: 'Simple Moving Average Crossover',
        description: 'Buy when fast SMA crosses above slow SMA, sell when it crosses below. Classic trend-following strategy.',
        category: 'trend_following',
        riskLevel: 'medium',
        minBalance: 100,
        parameters: [
            {
                name: 'fastPeriod',
                type: 'number',
                description: 'Fast moving average period',
                defaultValue: 10,
                min: 5,
                max: 50,
                required: true
            },
            {
                name: 'slowPeriod',
                type: 'number',
                description: 'Slow moving average period',
                defaultValue: 30,
                min: 20,
                max: 200,
                required: true
            },
            {
                name: 'stopLoss',
                type: 'number',
                description: 'Stop loss percentage',
                defaultValue: 2,
                min: 0.5,
                max: 10,
                required: true
            },
            {
                name: 'takeProfit',
                type: 'number',
                description: 'Take profit percentage',
                defaultValue: 4,
                min: 1,
                max: 20,
                required: true
            }
        ],
        supportedExchanges: ['binance', 'delta'],
        isActive: true
    },
    {
        name: "RSI Mean Reversion",
        description: "Buy when RSI is oversold (<30), sell when overbought (>70). Works well in ranging markets.",
        category: 'mean_reversion',
        riskLevel: "medium",
        minBalance: 200,
        parameters: [
            {
                name: "rsiPeriod",
                type: "number",
                description: "RSI calculation period",
                defaultValue: 14,
                min: 7,
                max: 30,
                required: true
            },
            {
                name: "oversoldLevel",
                type: "number",
                description: "RSI oversold level for buying",
                defaultValue: 30,
                min: 10,
                max: 40,
                required: true
            },
            {
                name: "overboughtLevel",
                type: "number",
                description: "RSI overbought level for selling",
                defaultValue: 70,
                min: 60,
                max: 90,
                required: true
            },
            {
                name: "positionSize",
                type: "number",
                description: "Position size percentage of allocation funds",
                defaultValue: 25,
                min: 10,
                max: 100,
                required: true
            }
        ],
        supportedExchanges: ["binance", "delta"],
        isActive: true
    },
    {
        name: "Grid Trading",
        description: "Place buy and sell orders at predetermined intervals. Profits from market volatility",
        category: "grid",
        riskLevel: "low",
        minBalance: 500,
        parameters: [
            {
                name: "gridLevels",
                type: 'number',
                description: 'Number of grid levels',
                defaultValue: 10,
                min: 5,
                max: 50,
                required: true
            },
            {
                name: "basePrice",
                type: "string",
                description: "Base Price calculation method",
                defaultValue: "current",
                options: ["current", "sma", "manual"],
                required: true
            },
            {
                name: "orderSize",
                type: "number",
                description: "Order size per grid level (USDT)",
                defaultValue: 50,
                min: 10,
                max: 1000,
                required: true
            }
        ],
        supportedExchanges: ["binance", "delta"],
        isActive: true
    },
    {
        name: "DCA (Dollar Cost Averaging)",
        description: "Regularly buys a fixed amount regardless of price. Good for long-term accumulation.",
        category: "trend_following",
        minBalance: 100,
        riskLevel: "low",
        parameters: [
            {
                name: "interval",
                type: "select",
                description: "Purchase interval",
                defaultValue: "1h",
                options: ["15m", "30m", "1h", "4h", "1d"],
                required: true
            },
            {
                name: "amount",
                type: "number",
                description: "Amount to buy each interval (USDT)",
                defaultValue: 0,
                min: 0,
                max: 1000,
                required: true
            },
            {
                name: "maxPrice",
                type: "number",
                description: "Maximum price to buy at (optional)",
                defaultValue: 0,
                min: 0,
                max: 1000000,
                required: false
            }
        ],
        supportedExchanges: ["binance", "delta"],
        isActive: true
    }
];

module.exports = strategies;