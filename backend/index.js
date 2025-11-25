require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { authenticateToken } = require('./Middleware/auth');
const { adminAuth } = require('./Middleware/adminAuth');
const { errorHandler, notFoundHandler } = require('./Middleware/errorHandler');

const app = express();

// CORS configuration
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://foodiii.onrender.com'
];

const parseOrigins = (value) =>
  value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

const envOrigins = new Set([
  ...defaultOrigins,
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.ADDITIONAL_CORS_ORIGINS)
]);

const allowedOrigins = Array.from(envOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  allowEIO3: true, // For Socket.IO v4 compatibility
  transports: ['websocket', 'polling'],
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  cookie: false
});

// Add error handling for WebSocket connections
io.engine.on("connection_error", (err) => {
  console.error('WebSocket connection error:', {
    code: err.code,
    message: err.message,
    context: err.context
  });
});

// Store connected admin clients
const adminClients = new Map();

// Store the io instance globally
const { setIO, getIO } = require('./socket');
setIO(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Set up error handlers
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Handle admin dashboard connection
  socket.on('admin-connect', (data) => {
    console.log('Admin dashboard connection request:', { 
      socketId: socket.id, 
      clientData: data 
    });
    
    adminClients.set(socket.id, socket);
    console.log('Admin dashboard connected:', socket.id);
    
    // Store adminClients in the app for use in controllers
    app.set('adminClients', adminClients);
    
    // Send a welcome message with connection details
    const response = { 
      status: 'connected', 
      message: 'Successfully connected to WebSocket server',
      clientId: socket.id,
      serverTime: new Date().toISOString(),
      clientsCount: adminClients.size
    };
    
    console.log('Sending connection status:', response);
    socket.emit('connection-status', response);
    
    // Send initial data if needed
    // socket.emit('initial-data', { /* your initial data */ });
  });
  
  // Handle ping from client
  socket.on('ping', (data) => {
    // console.log('Ping received from client:', socket.id);
    socket.emit('pong', { 
      ...data, 
      serverTime: new Date().toISOString() 
    });
  });

  // Handle regular client disconnection
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
    adminClients.delete(socket.id);
    
    // Notify other clients if needed
    // socket.broadcast.emit('user-disconnected', { userId: socket.id });
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  // Handle custom events from clients
  socket.on('ping', (data) => {
    console.log('Ping received:', data);
    socket.emit('pong', { ...data, serverTime: new Date().toISOString() });
  });
});

// Make adminClients available in the app
app.set('adminClients', adminClients);
setIO(io);
app.set('io', io);
app.set('adminClients', adminClients);

const port = process.env.PORT || 7000;

// In index.js, replace the database connection code with:

// Connect to MongoDB
const { connectDb, getDb } = require('./db');

// Initialize database connection
const initDb = async () => {
  try {
    const connection = await connectDb();
    app.locals.db = connection.db; // This makes the database connection available in all routes
    console.log('Database connection initialized');
    
    // Start the server after database connection is established
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`API Documentation: http://localhost:${port}/api-docs`);
      console.log('WebSocket server is running');
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Initialize the database and start the server
initDb();

// Make database connection available in routes
app.use((req, res, next) => {
  req.app.locals.db = getDb();
  if (!req.app.locals.db) {
    return res.status(500).json({ 
      success: false, 
      message: 'Database not connected' 
    });
  }
  next();
});

// Import routes
app.use('/api/auth', require('./Routes/auth'));
app.use('/api/foodData', require('./Routes/foodData'));
app.use('/api/category', require('./Routes/category'));

// Admin routes
const adminRouter = require('./Routes/adminRoutes');
const restaurantRouter = require('./Routes/restaurantRoutes');
app.use('/api/admin', adminRouter);
app.use('/api/restaurants', restaurantRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});