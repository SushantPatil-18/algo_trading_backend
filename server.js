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

// CORS Configuration - Allow frontend to make requests
const allowedOrigins = [
  'http://localhost:5173',  // Local development
  'http://localhost:3000',  // Alternative local
  process.env.FRONTEND_URL  // Production frontend (set in Render environment variables)
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
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