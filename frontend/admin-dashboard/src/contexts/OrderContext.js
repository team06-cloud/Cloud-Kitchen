import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { 
  initSocket, 
  disconnectSocket, 
  subscribeToEvent, 
  onConnectionChange,
  isSocketConnected
} from '../services/socket';

// Create the context with a default value
const OrderContext = createContext({
  orders: [],
  newOrdersCount: 0,
  isConnected: false,
  resetNewOrdersCount: () => {},
  // Add other context values with default implementations
});

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
};

// Debug log to track component rendering
console.log('OrderProvider is rendering');

export const OrderProvider = ({ children }) => {
  console.log('OrderProvider - Initializing state');
  const [orders, setOrders] = useState([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { enqueueSnackbar } = useSnackbar({ preventDuplicate: true });

  // Handle new order updates
  const handleNewOrder = useCallback((order) => {
    setOrders(prevOrders => [order, ...prevOrders]);
    setNewOrdersCount(prev => prev + 1);
    enqueueSnackbar(`New order #${order.orderNumber || order._id} received`, { 
      variant: 'success',
      autoHideDuration: 5000,
    });
  }, [enqueueSnackbar]);

  // Handle order status updates
  const handleStatusUpdate = useCallback((order) => {
    setOrders(prevOrders => 
      prevOrders.map(prevOrder => 
        prevOrder._id === order._id ? { ...prevOrder, status: order.status } : prevOrder
      )
    );
    enqueueSnackbar(`Order #${order.orderNumber || order._id} status updated to ${order.status}`, {
      variant: 'info',
      autoHideDuration: 3000,
    });
  }, [enqueueSnackbar]);

  // Initialize WebSocket connection and set up event listeners
  useEffect(() => {
    console.log('Setting up WebSocket connection and event listeners');
    
    // Initialize socket connection
    initSocket();
    
    // Set initial connection state
    setIsConnected(isSocketConnected());
    
    // Subscribe to connection status changes
    const unsubscribeConnection = onConnectionChange((connected) => {
      console.log('Connection status changed:', connected);
      setIsConnected(connected);
      
      if (connected) {
        enqueueSnackbar('Connected to real-time updates', { 
          variant: 'success',
          preventDuplicate: true,
          autoHideDuration: 2000
        });
      } else {
        enqueueSnackbar('Disconnected from real-time updates', { 
          variant: 'error',
          preventDuplicate: true,
          autoHideDuration: 2000
        });
      }
    });
    
    // Subscribe to order updates
    const unsubscribeOrderUpdate = subscribeToEvent('order:update', ({ event, order }) => {
      console.log('Order update received:', { event, order });
      
      if (!order || !order._id) {
        console.error('Received invalid order data:', order);
        return;
      }
      
      switch(event) {
        case 'created':
          handleNewOrder(order);
          break;
        case 'status-updated':
          handleStatusUpdate(order);
          break;
        default:
          console.log('Unhandled order event:', event, order);
      }
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket subscriptions');
      unsubscribeConnection();
      unsubscribeOrderUpdate();
    };
  }, [enqueueSnackbar, handleNewOrder, handleStatusUpdate]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    orders,
    newOrdersCount,
    isConnected,
    resetNewOrdersCount: () => {
      console.log('Resetting new orders count');
      setNewOrdersCount(0);
    },
    // Add other context values here
  }), [orders, newOrdersCount, isConnected]);

  console.log('OrderProvider - Rendering with context value:', {
    ordersCount: orders.length,
    newOrdersCount,
    isConnected
  });

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContext;
