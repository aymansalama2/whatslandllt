/**
 * API Configuration
 * 
 * This file centralizes the API URL configuration for the entire application.
 * Import this file whenever you need to make API calls or socket connections.
 */

// For development, use localhost. For production, use the environment variable or your server IP address
export const API_URL = import.meta.env.VITE_API_URL || 'http://92.113.31.157:5001';

// Socket.IO configuration
export const SOCKET_CONFIG = {
  transports: ['polling'],
  withCredentials: false,
  extraHeaders: {
    "Access-Control-Allow-Origin": "*"
  },
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 10000
};

export default {
  API_URL,
  SOCKET_CONFIG
}; 