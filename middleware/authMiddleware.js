// Authorization middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req,res,next) =>{
    try{
        //Get token from header
        const token = req.header('Authorization')?.replace('Bearer ','');

        if(!token){
            return res.header(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.userId).select('-password');
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Add user to request
        req.userId = user._id;
        req.user = user;
        next();
    }catch(error){
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = authMiddleware;