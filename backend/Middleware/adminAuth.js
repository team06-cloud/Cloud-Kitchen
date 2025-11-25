const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
};

const adminAuth = (req, res, next) => {
  // Bypass authentication in development
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'dev-user-id',
      email: 'admin@example.com',
      role: 'admin'
    };
    return next();
  }

  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new ApiError(401, 'No token, authorization denied');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to access this route');
    }

    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};

module.exports = {
  adminAuth,
  isAdmin
};
