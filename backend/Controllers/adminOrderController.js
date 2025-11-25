const Order = require('../models/Order4rest');
const { ApiError } = require('../Middleware/errorHandler');

// Helper function to emit order updates
const emitOrderUpdate = (req, event, order) => {
  try {
    const io = req.app.get('io');
    const adminClients = req.app.get('adminClients');
    
    if (!io) {
      console.error('Socket.io not initialized in request');
      return;
    }
    
    if (!adminClients || adminClients.size === 0) {
      console.warn('No admin clients connected to emit order update');
      return;
    }
    
    console.log(`Emitting order:update for ${event} to ${adminClients.size} admin clients`);
    
    // Prepare the order data to send
    const orderData = {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items,
      eventTime: new Date().toISOString()
    };
    
    // Emit to all connected admin clients
    adminClients.forEach((socket, socketId) => {
      if (socket && socket.connected) {
        console.log(`Sending to admin client: ${socketId}`);
        socket.emit('order:update', { 
          event,
          order: orderData
        });
      } else {
        console.log(`Admin client ${socketId} is not connected, cleaning up`);
        adminClients.delete(socketId);
      }
    });
    
    console.log(`Emitted ${event} for order ${order.orderNumber || order._id}`);
  } catch (error) {
    console.error('Error emitting order update:', error);
  }
};

const adminOrderController = {
  // Create new order
  createOrder: async (req, res, next) => {
    try {
      const order = await Order.create(req.body);
      
      // Populate the user and items for the order
      const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email')
        .populate('items.food', 'name price');
      
      // Emit new order event
      emitOrderUpdate(req, 'created', populatedOrder);
      
      res.status(201).json({ 
        success: true, 
        data: populatedOrder 
      });
    } catch (error) {
      console.error('Error creating order:', error);
      next(new ApiError(400, 'Failed to create order', error.message));
    }
  },
  
  // Get all orders (admin)
  getAllOrders: async (req, res, next) => {
    try {
      const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
      const query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      const orders = await Order.find(query)
        .populate('user', 'name email')
        .populate('items.food', 'name price')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
        
      const count = await Order.countDocuments(query);
      
      res.json({
        success: true,
        data: orders,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
    } catch (error) {
      next(new ApiError(500, 'Failed to fetch orders', error.message));
    }
  },

  // Update order status
  updateOrderStatus: async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return next(new ApiError(400, 'Invalid status'));
      }
      
      // Find and update the order, then populate the user and items
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true, runValidators: true }
      )
      .populate('user', 'name email')
      .populate('items.food', 'name price');
      
      if (!order) {
        return next(new ApiError(404, 'Order not found'));
      }
      
      // Emit event for status update with populated data
      emitOrderUpdate(req, 'status-updated', order);
      
      res.json({ 
        success: true, 
        data: order 
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      next(new ApiError(500, 'Failed to update order status', error.message));
    }
  },

  // Get order statistics
  getOrderStats: async (req, res, next) => {
    try {
      const stats = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: '$count' },
            totalRevenue: { $sum: '$totalAmount' },
            statuses: {
              $push: {
                status: '$_id',
                count: '$count',
                amount: '$totalAmount'
              }
            }
          }
        }
      ]);
      
      const result = stats[0] || { totalOrders: 0, totalRevenue: 0, statuses: [] };
      res.json({ success: true, data: result });
    } catch (error) {
      next(new ApiError(500, 'Failed to fetch order statistics', error.message));
    }
  }
};

module.exports = adminOrderController;
