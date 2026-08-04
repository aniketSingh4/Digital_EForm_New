import axios from 'axios';

// Update this URL to match your backend API
const API_BASE_URL = 'https://calibration-reports.onrender.com/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage if you have authentication
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    //Handle 401 and 403 unauthorized errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear all stored data
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('dashboard_data');
      localStorage.removeItem('dashboard_timestamp');
      localStorage.removeItem('notifications');
      
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;