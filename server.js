const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');


// Import routes
const authRoutes = require('./routes/auth');
const exchangeRoutes = require('./routes/exchange');
const strategyRoutes = require('./routes/strategy');

// load environment variable
dotenv.config();

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

// API Routes
app.use('/api/auth',authRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/strategies',strategyRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
})