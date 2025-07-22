import axios from 'axios';

// Get the API URL from environment variables or use the default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to handle errors globally
axiosInstance.interceptors.request.use(
  config => {
    // You can add authorization headers here if needed
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default axiosInstance; 