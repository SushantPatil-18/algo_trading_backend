const mongoose = require('mongoose');
const Strategy = require('../models/Strategy');
const initialStrategies = require('../config/initialStrategies');
require('dotenv').config();

const seedStrategies = async () =>{
    try{
        //connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing strategies and drop collection to avoid schema conflicts
        await Strategy.deleteMany({})
        console.log('Cleared existing strategies');
        
        // Insert initial strategies
        await Strategy.insertMany(initialStrategies);
        console.log('Seeded the strategies successfully');

        process.exit(0);
    }catch(error){
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedStrategies();