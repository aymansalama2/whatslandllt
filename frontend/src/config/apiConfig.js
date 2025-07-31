/**
 * API Configuration
 * 
 * This file centralizes the API URL configuration for the entire application.
 * Import this file whenever you need to make API calls or socket connections.
 */

// Configuration pour whatsland.click - Production et développement
export const API_URL = import.meta.env.VITE_API_URL || 'https://whatsland.click:5001';

// Socket.IO configuration sécurisée
export const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'],
  withCredentials: true, // Activé pour les cookies/sessions
  secure: import.meta.env.PROD, // HTTPS en production
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 10000,
  forceNew: false,
  autoConnect: true,
  upgrade: true,
  rememberUpgrade: true,
  pingInterval: 5000,
  pingTimeout: 10000
};

export default {
  API_URL,
  SOCKET_CONFIG
}; 