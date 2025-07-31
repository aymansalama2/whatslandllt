// Script pour optimiser les logs et réduire l'utilisation CPU
// À ajouter au début de server.js

// Système de logging optimisé pour réduire l'utilisation CPU
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Niveau de log par défaut en production (0=ERROR, 1=WARN, 2=INFO, 3=DEBUG)
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;

// Système de logging optimisé qui remplace console.log/error
const logger = {
  error: (message, ...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  info: (message, ...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  debug: (message, ...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};

// Remplacer les méthodes console par des versions optimisées
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function(...args) {
  if (LOG_LEVEL >= LOG_LEVELS.INFO) {
    originalConsoleLog.apply(console, args);
  }
};

console.error = function(...args) {
  if (LOG_LEVEL >= LOG_LEVELS.ERROR) {
    originalConsoleError.apply(console, args);
  }
};

console.warn = function(...args) {
  if (LOG_LEVEL >= LOG_LEVELS.WARN) {
    originalConsoleWarn.apply(console, args);
  }
};

module.exports = { logger, LOG_LEVELS };