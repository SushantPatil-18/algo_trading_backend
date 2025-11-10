const dotenv = require('dotenv');

// load environment variables FIRST
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const SummaryService = require('./services/summaryService');

// Import routes
const authRoutes = require('./routes/auth');
const exchangeRoutes = require('./routes/exchange');
const strategyRoutes = require('./routes/strategy');
const botRouter = require('./routes/bot');
const dashboardRouter = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');

// connect to database
connectDB();


const app = express();

// Middleware
app.use(cors())
app.use(express.json());  // to parse json
app.use(express.urlencoded({extended: true}));  // to parse url-encoded data like forms

// Basic route 
app.get('/', (req,res) => {
    res.json({message: 'Algo Trading API is running!'});
});

SummaryService.initDailySummary();

// API Routes
app.use('/api/auth',authRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/strategies',strategyRoutes);
app.use('/api/bots', botRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 5000

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
})