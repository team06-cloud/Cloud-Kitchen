import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Avatar, 
  InputAdornment, 
  IconButton,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { authAPI } from '../services/api';

// Very permissive email validation that accepts admin[cloudkitchen.com] format
const validateEmail = (email) => {
  // Accept either format: admin@cloudkitchen.com or admin[cloudkitchen.com]
  const re = /^(?:[^\s@]+@[^\s@]+\.[^\s@]+|\w+\[\w+\.\w+\])$/i;
  const isValid = re.test(email);
  
  // Convert to standard email format if using the [domain.com] format
  let cleanEmail = email;
  if (email.includes('[') && email.includes(']')) {
    const [username, domain] = email.replace(']', '').split('[');
    cleanEmail = `${username}@${domain}`.toLowerCase();
  } else {
    cleanEmail = email.toLowerCase();
  }
  
  return { 
    isValid, 
    email: cleanEmail,
    original: email 
  };
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    showPassword: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    const email = formData.email.trim();
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else {
      const { isValid, email: cleanEmail } = validateEmail(email);
      if (!isValid) {
        newErrors.email = 'Please enter a valid email address (e.g., admin@cloudkitchen.com or admin[cloudkitchen.com])';
      } else if (cleanEmail !== email) {
        // Update the email field with the cleaned version
        setFormData(prev => ({
          ...prev,
          email: cleanEmail
        }));
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (prop) => (event) => {
    setFormData({ ...formData, [prop]: event.target.value });
    // Clear error when user starts typing
    if (errors[prop]) {
      setErrors({ ...errors, [prop]: '' });
    }
  };

  const handleClickShowPassword = () => {
    setFormData({ ...formData, showPassword: !formData.showPassword });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Format the email for submission
    let emailToSend = formData.email.trim();
    if (emailToSend.includes('[') && emailToSend.includes(']')) {
      const [username, domain] = emailToSend.replace(']', '').split('[');
      emailToSend = `${username}@${domain}`.toLowerCase();
    }
    
    setLoading(true);
    
    try {
      // Try with the exact email first
      let response;
      try {
        response = await authAPI.login({
          email: emailToSend,
          password: formData.password,
        });
      } catch (error) {
        // If first attempt fails, try with the domain in lowercase
        if (error.response?.status === 400 || error.response?.status === 401) {
          response = await authAPI.login({
            email: formData.email.toLowerCase(),
            password: formData.password,
          });
        } else {
          throw error;
        }
      }
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        enqueueSnackbar('Login successful!', { variant: 'success' });
        navigate('/dashboard');
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        // Handle specific error messages from the server
        if (error.response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Admin Sign In
        </Typography>
        <Paper elevation={3} sx={{ mt: 3, p: 4, width: '100%' }}>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              inputProps={{
                'data-testid': 'email-input',
                'aria-label': 'Email Address'
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={formData.showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange('password')}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              inputProps={{
                'data-testid': 'password-input',
                'aria-label': 'Password'
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {formData.showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Forgot password?
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
