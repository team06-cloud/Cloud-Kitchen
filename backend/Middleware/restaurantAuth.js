const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const RESTAURANT_JWT_SECRET = process.env.RESTAURANT_JWT_SECRET || process.env.JWT_SECRET || 'restaurant_jwt_secret';

const authenticateRestaurant = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, RESTAURANT_JWT_SECRET);

    const db = req.app?.locals?.db;
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const restaurant = await db
      .collection('restaurants')
      .findOne({ _id: new ObjectId(decoded.restaurantId), isActive: { $ne: false } });

    if (!restaurant) {
      return res.status(401).json({
        success: false,
        message: 'Restaurant not found or inactive'
      });
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    console.error('Restaurant authentication error:', error);
    const message =
      error.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid authentication token';

    return res.status(401).json({
      success: false,
      message
    });
  }
};

module.exports = {
  authenticateRestaurant,
  RESTAURANT_JWT_SECRET
};
