const jwt = require('jsonwebtoken');
const User = require('../User'); // Import your User model

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header
    if (!token) return res.sendStatus(401); // No token provided
  
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) return res.sendStatus(403); // Invalid token
      req.user = await User.findById(user.id); // Fetch user from database
      next();
    });
  };
  
  module.exports = { authenticateToken }; // Export the middleware function