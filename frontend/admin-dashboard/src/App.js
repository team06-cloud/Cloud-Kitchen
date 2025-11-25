import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { SnackbarProvider } from 'notistack';
import CssBaseline from '@mui/material/CssBaseline';
import { OrderProvider } from './contexts/OrderContext';

import theme from './theme';
import { Layout } from './components';
import Dashboard from './pages/Dashboard';

// Import other pages as they are created
const FoodItems = () => <div>Food Items Management</div>;
const Categories = () => <div>Categories Management</div>;
const Orders = () => <div>Orders Management</div>;
const Users = () => <div>Users Management</div>;
const Settings = () => <div>Settings</div>;


// Bypass login for now - Directly render children
const ProtectedRoute = ({ children }) => {
  // Set a dummy admin token to simulate authentication
  if (!localStorage.getItem('adminToken')) {
    localStorage.setItem('adminToken', 'bypass-token-for-development');
  }
  
  return children;
};

function App() {
  // Redirect root to dashboard
  useEffect(() => {
    if (window.location.pathname === '/') {
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <OrderProvider>
          <Router>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="food-items" element={<FoodItems />} />
                <Route path="categories" element={<Categories />} />
                <Route path="orders" element={<Orders />} />
                <Route path="users" element={<Users />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </OrderProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
