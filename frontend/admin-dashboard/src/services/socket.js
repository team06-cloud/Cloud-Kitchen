import { io } from 'socket.io-client';

// Use REACT_APP_WS_URL from environment or fallback to default
const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:7000';
let socket = null;
let connectionListeners = new Set();
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Connection options
const getSocketOptions = () => ({
  reconnection: true,
  reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000, // Increased timeout
  transports: ['websocket'], // Try with websocket only first
  withCredentials: true,
  autoConnect: false, // We'll connect manually
  path: '/socket.io/',
  forceNew: true, // Force new connection
  rejectUnauthorized: false, // For development only
  secure: process.env.NODE_ENV === 'production',
  // Add query parameters if needed for authentication
  query: {
    clientType: 'admin-dashboard',
    version: '1.0.0'
  }
});

const notifyConnectionChange = (connected) => {
  const previousState = isConnected;
  isConnected = connected;
  
  // Only notify if the state actually changed
  if (previousState !== connected) {
    console.log(`Connection state changed to: ${connected}`);
    connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (err) {
        console.error('Error in connection listener:', err);
      }
    });
  }
};

/**
 * Initialize WebSocket connection with reconnection and error handling
 * @returns {Socket} The socket instance
 */
export const initSocket = () => {
  if (socket) {
    if (socket.connected) {
      console.log('Socket already connected, reusing existing connection');
      return socket;
    }
    // If socket exists but disconnected, try to reconnect
    console.log('Socket exists but disconnected, attempting to reconnect...');
    socket.connect();
    return socket;
  }

  console.log('Initializing new socket connection to:', SOCKET_URL);
  
  socket = io(SOCKET_URL, getSocketOptions());

  // Connection established
  socket.on('connect', () => {
    console.log('Socket connected with ID:', socket.id);
    reconnectAttempts = 0;
    notifyConnectionChange(true);
    
    // Identify as admin client
    console.log('Identifying as admin client...');
    
    // Add a small delay before sending admin-connect
    setTimeout(() => {
      socket.emit('admin-connect', { 
        clientType: 'admin-dashboard',
        timestamp: new Date().toISOString(),
        clientId: socket.id
      });
    }, 100);
    
    // Set up a ping-pong to keep the connection alive
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', { time: Date.now() });
      }
    }, 30000); // Every 30 seconds
    
    // Clean up interval on disconnect
    socket.on('disconnect', () => {
      clearInterval(pingInterval);
    });
  });

  // Handle connection errors
  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
    notifyConnectionChange(false);
    
    // Attempt to reconnect with backoff
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
      console.log(`Reconnection attempt ${reconnectAttempts + 1} in ${delay}ms...`);
      
      setTimeout(() => {
        reconnectAttempts++;
        socket.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected. Reason:', reason);
    notifyConnectionChange(false);
    
    // If the disconnection was not initiated by the client, try to reconnect
    if (reason !== 'io client disconnect') {
      console.log('Attempting to reconnect...');
      setTimeout(() => {
        if (socket && !socket.connected) {
          socket.connect();
        }
      }, 1000);
    }
  });
  
  // Handle pong responses
  socket.on('pong', (data) => {
    const latency = Date.now() - data.time;
    console.log(`Ping-pong latency: ${latency}ms`);
  });
  
  // Handle connection status
  socket.on('connection-status', (data) => {
    console.log('Connection status:', data);
    if (data.status === 'connected') {
      console.log('Successfully connected to WebSocket server as admin');
    }
  });

  // Connect manually since autoConnect is false
  console.log('Initiating WebSocket connection...');
  socket.connect();
  
  return socket;
};

/**
 * Get the socket instance
 * @returns {Socket} The socket instance
 */
export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket() first.');
  }
  return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
    notifyConnectionChange(false);
  }
};

/**
 * Get current connection status
 * @returns {boolean} True if connected, false otherwise
 */
export const isSocketConnected = () => {
  return isConnected && socket?.connected;
};

/**
 * Subscribe to connection status changes
 * @param {Function} callback - Callback function that receives connection status (boolean)
 * @returns {Function} Unsubscribe function
 */
export const onConnectionChange = (callback) => {
  connectionListeners.add(callback);
  // Immediately call with current status
  callback(isConnected);
  
  // Return unsubscribe function
  return () => {
    connectionListeners.delete(callback);
  };
};

/**
 * Subscribe to an event
 * @param {string} eventName - Name of the event to subscribe to
 * @param {Function} callback - Callback function to handle the event
 * @returns {Function} Unsubscribe function
 */
export const subscribeToEvent = (eventName, callback) => {
  if (!socket) {
    console.warn('Socket not initialized when subscribing to event:', eventName);
    return () => {}; // Return empty cleanup function
  }
  
  socket.on(eventName, callback);
  
  // Return cleanup function
  return () => {
    if (socket) {
      socket.off(eventName, callback);
    }
  };
};

/**
 * Unsubscribe from an event
 * @param {string} eventName - Name of the event to unsubscribe from
 * @param {Function} [callback] - Optional callback function to remove
 */
export const unsubscribeFromEvent = (eventName, callback) => {
  if (socket) {
    if (callback) {
      socket.off(eventName, callback);
    } else {
      socket.off(eventName);
    }
  }
};

// Initialize socket when this module is loaded
if (typeof window !== 'undefined') {
  initSocket();
}