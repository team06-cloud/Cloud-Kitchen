import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../Component/Navbar';
import "../styles/Auth.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:7000';
const API_URL = `${API_BASE_URL}/api`;

const initialLoginState = {
  email: '',
  password: ''
};

const initialRegisterState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  ownerName: '',
  phone: '',
  cuisine: '',
  city: '',
  address: ''
};

const YourRestaurent = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loginState, setLoginState] = useState(initialLoginState);
  const [registerState, setRegisterState] = useState(initialRegisterState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasRestaurantSession = useMemo(
    () => Boolean(localStorage.getItem('restaurantToken')),
    []
  );

  const handleModeToggle = (nextMode) => {
    if (mode === nextMode) return;
    setError('');
    setLoading(false);
    setMode(nextMode);
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginState((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterState((prev) => ({ ...prev, [name]: value }));
  };

  const persistSession = (token, restaurant) => {
    localStorage.setItem('restaurantToken', token);
    localStorage.setItem('restaurantProfile', JSON.stringify(restaurant));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/restaurants/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginState)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Invalid credentials');
      }

      persistSession(result.token, result.restaurant);
      navigate('/restaurant/dashboard', { replace: true });
    } catch (err) {
      console.error('Restaurant login error:', err);
      setError(err.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (registerState.password !== registerState.confirmPassword) {
      setLoading(false);
      setError('Passwords do not match');
      return;
    }

    const payload = {
      name: registerState.name,
      email: registerState.email,
      password: registerState.password,
      ownerName: registerState.ownerName,
      phone: registerState.phone,
      cuisine: registerState.cuisine,
      city: registerState.city,
      address: registerState.address
    };

    try {
      const response = await fetch(`${API_URL}/restaurants/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to register restaurant');
      }

      persistSession(result.token, result.restaurant);
      navigate('/restaurant/dashboard', { replace: true });
    } catch (err) {
      console.error('Restaurant registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Navbar />

      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{mode === 'login' ? 'Restaurant Login' : 'Register Your Restaurant'}</h1>
            <p>
              {mode === 'login'
                ? 'Access your restaurant dashboard'
                : 'Create your restaurant profile to start receiving orders'}
            </p>
          </div>

          <div className="auth-toggle">
            <button
              type="button"
              className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => handleModeToggle('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-toggle-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => handleModeToggle('register')}
            >
              Register
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <input
                  type="email"
                  placeholder="Business email"
                  name="email"
                  value={loginState.email}
                  onChange={handleLoginChange}
                  required
                />
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-lock"></i>
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  name="password"
                  value={loginState.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-store"></i>
                </div>
                <input
                  type="text"
                  placeholder="Restaurant name"
                  name="name"
                  value={registerState.name}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-user"></i>
                </div>
                <input
                  type="text"
                  placeholder="Owner name"
                  name="ownerName"
                  value={registerState.ownerName}
                  onChange={handleRegisterChange}
                />
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <input
                  type="email"
                  placeholder="Business email"
                  name="email"
                  value={registerState.email}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-phone"></i>
                </div>
                <input
                  type="tel"
                  placeholder="Contact number"
                  name="phone"
                  value={registerState.phone}
                  onChange={handleRegisterChange}
                />
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-utensils"></i>
                </div>
                <input
                  type="text"
                  placeholder="Cuisine type"
                  name="cuisine"
                  value={registerState.cuisine}
                  onChange={handleRegisterChange}
                />
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-location-dot"></i>
                </div>
                <input
                  type="text"
                  placeholder="City"
                  name="city"
                  value={registerState.city}
                  onChange={handleRegisterChange}
                />
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <input
                  type="text"
                  placeholder="Address (optional)"
                  name="address"
                  value={registerState.address}
                  onChange={handleRegisterChange}
                />
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-lock"></i>
                </div>
                <input
                  type="password"
                  placeholder="Create password"
                  name="password"
                  value={registerState.password}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <i className="fas fa-lock"></i>
                </div>
                <input
                  type="password"
                  placeholder="Confirm password"
                  name="confirmPassword"
                  value={registerState.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Register restaurant'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>
              Looking to order food? <Link to="/login">Login as customer</Link>
            </p>
            {hasRestaurantSession && (
              <p className="auth-note">You are already signed in on this device.</p>
            )}
          </div>
        </div>
      </div>

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
        integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default YourRestaurent;
