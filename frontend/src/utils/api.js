import axios from 'axios';

// Base URL points to backend port 5000. In production, this can be an empty string or process.env.VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'https://deskguard-4adh.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
