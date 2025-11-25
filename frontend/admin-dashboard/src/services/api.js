import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'http://localhost:7000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
};

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    // In development, use a valid JWT token format
    if (process.env.NODE_ENV === 'development') {
      // This is a properly formatted (but invalid) JWT for development
      const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRldi11c2VyLWlkIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.INVALID_SIGNATURE';
      config.headers.Authorization = `Bearer ${devToken}`;
      return config;
    }
    
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Simplified response interceptor - just pass through errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error but don't redirect or refresh token
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => {
    // Return a mock successful login response
    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          name: 'Admin',
          email: 'admin@example.com',
          role: 'admin'
        }
      }
    };
    return Promise.resolve(mockResponse);
  },
  logout: () => {
    localStorage.removeItem('adminToken');
    return Promise.resolve();
  },
  getProfile: () => {
    // Return a mock user profile
    return Promise.resolve({
      data: {
        id: '1',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    });
  }
};

// Food Items API
export const foodItemsAPI = {
  getAll: (params = {}) => api.get('/admin/food-items', { params }),
  getById: (id) => api.get(`/admin/food-items/${id}`),
  create: (data) => api.post('/admin/food-items', data),
  update: (id, data) => api.put(`/admin/food-items/${id}`, data),
  delete: (id) => api.delete(`/admin/food-items/${id}`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/admin/categories'),
  getById: (id) => api.get(`/admin/categories/${id}`),
  create: (data) => api.post('/admin/categories', data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  delete: (id) => api.delete(`/admin/categories/${id}`),
};

// Orders API
export const ordersAPI = {
  getAll: (params = {}) => api.get('/admin/orders', { params }),
  getById: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, status) => 
    api.patch(`/admin/orders/${id}/status`, { status }),
  getStats: (params = {}) => 
    api.get('/admin/orders/stats', { params }),
};

// Users API
export const usersAPI = {
  getAll: (params = {}) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getPopularItems: () => api.get('/admin/dashboard/popular-items'),
};

export default api;
