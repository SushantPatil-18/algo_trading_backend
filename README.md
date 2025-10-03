# Algorithmic Trading Backend

A robust Node.js backend API for automated cryptocurrency trading with multiple strategy support, real-time monitoring, and exchange integrations.

## 🚀 Features

- **Multi-Exchange Support** - Connect to various cryptocurrency exchanges via CCXT
- **Multiple Trading Strategies** - SMA Crossover, RSI, Grid Trading, DCA, and more
- **Real-time Monitoring** - Live bot status, trade tracking, and performance analytics
- **User Authentication** - Secure JWT-based authentication system
- **Strategy Testing** - Backtest strategies before deploying with real funds
- **Encrypted API Keys** - Secure storage of exchange credentials
- **Daily Summaries** - Automated daily performance reports via email
- **Risk Management** - Configurable stop-loss, take-profit, and position sizing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/SushantPatil-18/algo_trading_backend.git
cd algo_trading_backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/algo_trading

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Encryption Key (32 characters for AES-256)
ENCRYPTION_KEY=your_32_character_encryption_key

# Email Configuration (for daily summaries)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@gmail.com

# Admin Email (receives daily summaries)
ADMIN_EMAIL=admin@example.com
```

4. **Seed the database with initial strategies**
```bash
npm run seed:strategies
```

5. **Start the server**

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "trader123",
  "email": "trader@example.com",
  "password": "securePassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "username": "trader123",
    "email": "trader@example.com"
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

---

### Exchange Account Endpoints

#### Add Exchange Account
```http
POST /api/exchange/accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "exchangeName": "binance",
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret",
  "label": "My Binance Account"
}
```

#### Get All Exchange Accounts
```http
GET /api/exchange/accounts
Authorization: Bearer <token>
```

#### Delete Exchange Account
```http
DELETE /api/exchange/account/:accountId
Authorization: Bearer <token>
```

#### Test Exchange Connection
```http
POST /api/exchange/account/:accountId/test
Authorization: Bearer <token>
```

---

### Strategy Endpoints

#### Get All Strategies
```http
GET /api/strategies
Authorization: Bearer <token>
```

**Response:**
```json
{
  "strategies": [
    {
      "_id": "strategy_id",
      "name": "Simple Moving Average Crossover",
      "description": "Buy when fast SMA crosses above slow SMA",
      "category": "trend_following",
      "riskLevel": "medium",
      "minBalance": 100,
      "parameters": [...]
    }
  ]
}
```

#### Get Strategies by Category
```http
GET /api/strategies/category/:category
Authorization: Bearer <token>
```

Categories: `trend_following`, `mean_reversion`, `volatility`, `grid_trading`, `dca`

#### Get Single Strategy
```http
GET /api/strategies/:strategyId
Authorization: Bearer <token>
```

#### Create Trading Bot
```http
POST /api/strategies/bots
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My SMA Bot",
  "exchangeAccount": "exchange_account_id",
  "strategy": "strategy_id",
  "tradingPair": "BTC/USDT",
  "investmentAmount": 1000,
  "settings": {
    "fastPeriod": 10,
    "slowPeriod": 30,
    "stopLoss": 5,
    "takeProfit": 10
  }
}
```

#### Get My Trading Bots
```http
GET /api/strategies/bots/my
Authorization: Bearer <token>
```

#### Validate Strategy Settings
```http
POST /api/strategies/:strategyId/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": {
    "fastPeriod": 10,
    "slowPeriod": 30
  }
}
```

---

### Bot Control Endpoints

#### Start Bot
```http
POST /api/bots/:botId/start
Authorization: Bearer <token>
```

#### Stop Bot
```http
POST /api/bots/:botId/stop
Authorization: Bearer <token>
```

#### Pause Bot
```http
POST /api/bots/:botId/pause
Authorization: Bearer <token>
```

#### Resume Bot
```http
POST /api/bots/:botId/resume
Authorization: Bearer <token>
```

#### Get Bot Details
```http
GET /api/bots/:botId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "bot": {
    "_id": "bot_id",
    "name": "My SMA Bot",
    "status": "running",
    "strategy": {...},
    "tradingPair": "BTC/USDT",
    "currentBalance": 1050.25,
    "totalProfit": 50.25,
    "profitPercentage": 5.025,
    "settings": {...},
    "performance": {...}
  }
}
```

#### Update Bot Settings
```http
PUT /api/bots/:botId/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": {
    "stopLoss": 3,
    "takeProfit": 15
  }
}
```

#### Delete Bot
```http
DELETE /api/bots/:botId
Authorization: Bearer <token>
```

---

### Dashboard Endpoints

#### Get Dashboard Overview
```http
GET /api/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "overview": {
    "totalBots": 5,
    "activeBots": 3,
    "totalInvested": 5000,
    "totalProfit": 250.50,
    "profitPercentage": 5.01
  },
  "bots": [...],
  "recentTrades": [...]
}
```

#### Get Bot Analytics
```http
GET /api/dashboard/bots/:botId/analytics
Authorization: Bearer <token>
```

---

### Settings Endpoints

#### Update User Settings
```http
PUT /api/settings/user
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailNotifications": true,
  "tradeAlerts": true,
  "dailySummary": true
}
```

#### Change Password
```http
PUT /api/settings/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword"
}
```

---

## 🎯 Seeding Strategies

The application comes with pre-configured trading strategies. To seed them into your database:

```bash
npm run seed:strategies
```

### Available Strategies:

1. **Simple Moving Average Crossover** (Trend Following)
   - Fast/Slow SMA periods configurable
   - Risk Level: Medium
   - Min Balance: $100

2. **RSI Strategy** (Mean Reversion)
   - Overbought/Oversold levels
   - Risk Level: Medium
   - Min Balance: $100

3. **Grid Trading** (Range Trading)
   - Multiple orders at different price levels
   - Risk Level: Low
   - Min Balance: $500

4. **DCA Strategy** (Dollar Cost Averaging)
   - Regular interval purchases
   - Risk Level: Low
   - Min Balance: $100

The seed script will:
- Clear existing strategies
- Insert predefined strategies with parameters
- Set up default configurations

## 🏗️ Project Structure

```
Backend/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   └── initialStrategies.js  # Default strategies
├── controllers/         # Request handlers
│   ├── authController.js
│   ├── botController.js
│   ├── dashboardController.js
│   ├── exchangeController.js
│   ├── settingsController.js
│   └── strategyController.js
├── middleware/          # Custom middleware
│   └── authMiddleware.js
├── models/              # Mongoose schemas
│   ├── ExchangeAccount.js
│   ├── Strategy.js
│   ├── Trade.js
│   ├── TradingBot.js
│   └── User.js
├── routes/              # API routes
│   ├── auth.js
│   ├── bot.js
│   ├── dashboard.js
│   ├── exchange.js
│   ├── settings.js
│   └── strategy.js
├── scripts/             # Utility scripts
│   └── seedStrategies.js
├── services/            # Business logic
│   ├── emailService.js
│   ├── strategyEngine.js
│   ├── summaryService.js
│   └── tradeMonitor.js
├── strategies/          # Strategy implementations
│   ├── dcaStrategy.js
│   ├── GridStrategy.js
│   ├── rsiStrategy.js
│   └── smaStrategy.js
├── utils/               # Helper functions
│   ├── encryption.js
│   ├── indicators.js
│   └── strategyTester.js
├── .env                 # Environment variables
├── package.json         # Dependencies
└── server.js            # Entry point
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password encryption
- **API Key Encryption** - AES-256 encryption for exchange credentials
- **CORS Protection** - Configured CORS policies
- **Rate Limiting** - Prevent API abuse
- **Helmet.js** - Security headers

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 📦 Dependencies

### Main Dependencies
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **ccxt** - Cryptocurrency exchange integration
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **crypto-js** - Encryption utilities
- **technicalindicators** - Trading indicators
- **nodemailer** - Email notifications
- **node-cron** - Scheduled tasks
- **socket.io** - Real-time updates

## 🚧 Development

### Run in development mode
```bash
npm run dev
```

This uses nodemon for automatic server restarts on file changes.

### Seed strategies
```bash
npm run seed:strategies
```

## 📈 Performance Monitoring

The application includes:
- Real-time trade monitoring
- Daily performance summaries
- Profit/loss tracking
- Win rate calculations
- Drawdown analysis

## ⚠️ Disclaimer

**Trading cryptocurrencies carries a high level of risk and may not be suitable for all investors. This software is for educational purposes only. Always do your own research and never invest more than you can afford to lose.**

## 📧 Contact

Sushant Patil - [@SushantPatil-18](https://github.com/SushantPatil-18)

Project Link: [https://github.com/SushantPatil-18/algo_trading_backend](https://github.com/SushantPatil-18/algo_trading_backend)

## 🙏 Acknowledgments

- [CCXT](https://github.com/ccxt/ccxt) - Cryptocurrency exchange integration
- [TechnicalIndicators](https://github.com/anandanand84/technicalindicators) - Technical analysis library
- Express.js community
- MongoDB community
