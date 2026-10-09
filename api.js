import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization Bearer token to every request if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('classconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      localStorage.removeItem('classconnect_token');
      localStorage.removeItem('classconnect_user');
      if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
