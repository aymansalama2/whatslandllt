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
  transports: ['websocket', 'polling'],
  withCredentials: false,
  extraHeaders: {
    "Access-Control-Allow-Origin": "*"
  },
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  timeout: 5000,
  forceNew: true,
  autoConnect: true,
  upgrade: true,
  rememberUpgrade: true,
  pingInterval: 2000,
  pingTimeout: 5000
};

export default {
  API_URL,
  SOCKET_CONFIG
}; 