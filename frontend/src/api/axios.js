import axios from 'axios';
import { API_URL } from '../config/apiConfig';

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