import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, CircularProgress, Tooltip, IconButton, Grid } from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  ShoppingCart as OrdersIcon,
  People as UsersIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { foodItemsAPI, categoriesAPI } from '../services/api';
import { useOrderContext } from '../contexts/OrderContext';

const StatCard = ({ title, value, icon, color }) => {
  // Handle image loading errors
  const handleImageError = (e) => {
    console.warn('Failed to load image, using fallback icon');
    e.target.style.display = 'none';
    // Show a fallback icon if needed
    const fallbackIcon = document.createElement('div');
    fallbackIcon.innerHTML = icon;
    e.target.parentNode.appendChild(fallbackIcon);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#fff',
      }}
    >
      <Box
        sx={{
          backgroundColor: `${color}.light`,
          color: `${color}.dark`,
          width: 60,
          height: 60,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {React.cloneElement(icon, { fontSize: 'large' })}
      </Box>
      <Typography variant="h4" component="div" gutterBottom>
        {value}
      </Typography>
      <Typography variant="subtitle1" color="textSecondary">
        {title}
      </Typography>
    </Paper>
  );
};

const Dashboard = () => {
  const { orders, newOrdersCount, isConnected, resetNewOrdersCount } = useOrderContext();
  const [stats, setStats] = useState({
    foodItems: 0,
    categories: 0,
    totalOrders: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🚀 [Dashboard] Fetching dashboard stats...');
      
      // Log the full API URL being called
      const foodItemsUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:7000'}/api/admin/food-items`;
      const categoriesUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:7000'}/api/admin/categories`;
      console.log('🌐 [Dashboard] API Endpoints:', { foodItemsUrl, categoriesUrl });
      
      // Make API calls with detailed logging
      console.log('🔍 [Dashboard] Making API calls...');
      const [foodItemsRes, categoriesRes] = await Promise.all([
        foodItemsAPI.getAll().catch(err => {
          console.error('❌ [Dashboard] Error fetching food items:', err);
          return { data: [] }; // Return empty array on error
        }),
        categoriesAPI.getAll().catch(err => {
          console.error('❌ [Dashboard] Error fetching categories:', err);
          return { data: [] }; // Return empty array on error
        })
      ]);

      const foodItemsData = Array.isArray(foodItemsRes?.data)
        ? foodItemsRes.data
        : foodItemsRes?.data?.data || [];
      const categoriesData = Array.isArray(categoriesRes?.data)
        ? categoriesRes.data
        : categoriesRes?.data?.data || [];

      // Log the responses
      console.log('📊 [Dashboard] API Responses:', {
        foodItemsCount: foodItemsData.length,
        categoriesCount: categoriesData.length,
        ordersCount: orders?.length || 0
      });

      // Update state with the fetched data
      const newStats = {
        foodItems: foodItemsData.length,
        categories: categoriesData.length,
        totalOrders: orders?.length || 0,
        users: 0, // Not currently implemented
      };
      
      console.log('✅ [Dashboard] Updated stats:', newStats);
      setStats(newStats);
      setError(null);
      
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Unknown error';
      console.error('❌ [Dashboard] Error in fetchStats:', {
        error: errorMessage,
        status: err?.response?.status,
        config: {
          url: err?.config?.url,
          method: err?.config?.method,
          headers: err?.config?.headers
        }
      });
      setError(`Failed to load dashboard data: ${errorMessage}`);
    } finally {
      console.log('🏁 [Dashboard] Fetch completed');
      setRefreshing(false);
      setLoading(false);
    }
  }, [orders.length]); // Only depend on orders.length

  // Initial data fetch
  useEffect(() => {
    console.log('Dashboard mounted, fetching data...');
    fetchStats();
    
    // Set up interval to refresh data periodically (every 30 seconds)
    const intervalId = setInterval(fetchStats, 30000);
    
    // Clean up interval on unmount
    return () => {
      console.log('Cleaning up dashboard interval');
      clearInterval(intervalId);
    };
  }, [fetchStats]);

  const handleRefresh = () => {
    resetNewOrdersCount();
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Dashboard</Typography>
        <Box>
          <Tooltip title={isConnected ? 'Connected to server' : 'Disconnected from server'}>
            <IconButton color={isConnected ? 'success' : 'error'} sx={{ mr: 1 }}>
              {isConnected ? <WifiIcon /> : <WifiOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh data">
            <span>
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Food Items"
            value={stats.foodItems}
            icon={<RestaurantIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Categories"
            value={stats.categories}
            icon={<CategoryIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={
              <Box display="flex" alignItems="center">
                <span>Total Orders</span>
                {newOrdersCount > 0 && (
                  <Box 
                    component="span" 
                    sx={{
                      backgroundColor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      ml: 1
                    }}
                  >
                    {newOrdersCount}
                  </Box>
                )}
              </Box>
            }
            value={stats.totalOrders}
            icon={<OrdersIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.users}
            icon={<UsersIcon />}
            color="warning"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
