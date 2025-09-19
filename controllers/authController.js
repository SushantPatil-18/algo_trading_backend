const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const GenerateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// Register User
const register = async (req, res) =>{
    try{
        const {name, email, password} = req.body;

        // checck if user already exists
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        //create new user
        const user = new User({name,email,password});
        await user.save();

        // Generate token
        const token = GenerateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user:{
                id: user._id,
                name: user.name,
                email: user.email,
                emailNotifications: user.emailNotifications
            }
        });
    }catch(error){
        console.error('Register error: ', error);
        res.status(500).json({
            success: false,
            message: 'server error during registration'
        });
    }
};

// Login User
const login = async (req, res) =>{
    try{
        const {email, password} = req.body;

        // Find user by email
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // check password
        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = GenerateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user:{
                id: user._id,
                name: user.name,
                email: user.email,
                emailNotifications: user.emailNotifications
            }
        });
    }catch(error){
        console.error('Login error: ', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// get user profile
const getProfile = async (req, res) =>{
    try{
        const user = await User.findById(req.userId).select('-password');

        res.json({
            success: true,
            user
        });
    }catch (error){
        console.error('Get profile error: ', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile
};