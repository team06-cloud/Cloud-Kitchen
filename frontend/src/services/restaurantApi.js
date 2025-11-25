const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:7000';
const API_URL = `${API_BASE_URL}/api/restaurants`;

const getAuthToken = () => localStorage.getItem('restaurantToken');

const ensureJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
};

const request = async (path, options = {}) => {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const body = await ensureJson(response);

  if (!response.ok) {
    const message = body.message || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.data = body;
    throw error;
  }

  return body;
};

export const restaurantApi = {
  getProfile: () => request('/me', { method: 'GET' }),
  updateProfile: (payload) =>
    request('/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  createMenuItem: (payload) =>
    request('/menu', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateMenuItem: (id, payload) =>
    request(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteMenuItem: (id) =>
    request(`/menu/${id}`, {
      method: 'DELETE'
    })
};
