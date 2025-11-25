const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../Middleware/auth');
const { adminAuth, isAdmin } = require('../Middleware/adminAuth');
const orderController = require('../Controllers/adminOrderController');

// Apply adminAuth middleware to all routes in this file
router.use(adminAuth);
router.use(isAdmin);

// Get all orders (admin)
router.get('/orders', orderController.getAllOrders);

// Update order status
router.put('/orders/:orderId/status', orderController.updateOrderStatus);

// Get order statistics
router.get('/orders/stats', orderController.getOrderStats);

module.exports = router;
