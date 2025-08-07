/**
 * Configuration API avancée avec gestion robuste des environnements
 * Intégration optimisée avec le backend WhatsLand et Firebase
 */

// Configuration des URLs selon l'environnement
const getApiUrl = () => {
  // Ignorer la variable d'environnement si elle contient l'IP problématique
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('92.113.31.157')) {
    console.log('🔧 URL API depuis variable d\'environnement:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  } else if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.includes('92.113.31.157')) {
    console.log('🚫 Variable d\'environnement ignorée (contient IP problématique):', import.meta.env.VITE_API_URL);
  }
  
  // Force proxy en mode développement (Vite proxy)
  const isDev = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development' || !import.meta.env.PROD;
  if (isDev) {
    console.log('🔧 Mode développement détecté, utilisation du proxy Vite');
    return ''; // Utilise le proxy Vite
  }
  
  // Auto-detection based on location
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('🔧 Hostname détecté:', hostname);
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      console.log('🔧 Hostname local détecté, utilisation du proxy');
      return ''; // Utilise le proxy Vite ou direct
    }
    
    if (hostname.includes('whatsland.click')) {
      // Use the same domain without port - nginx will proxy to backend
      const url = `${window.location.protocol}//${hostname}`;
      console.log('🔧 Domaine production détecté (proxy via nginx):', url);
      return url;
    }
    
    // Vérifier si c'est une IP directe (comme 92.113.31.157)
    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      console.log('🔧 Accès par IP détecté, utilisation du même domaine');
      return `${window.location.protocol}//${hostname}`;
    }
  }
  
  // Fallback sécurisé - utilise le proxy
  console.log('🔧 Fallback vers proxy');
  return '';
};

export const API_URL = getApiUrl();

// Configuration Socket.IO optimisée avec reconnexion intelligente
export const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  secure: import.meta.env.PROD || window?.location?.protocol === 'https:',
  reconnectionAttempts: 10, // Augmenté pour plus de robustesse
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 20000, // Augmenté pour réseaux lents
  forceNew: false,
  autoConnect: true,
  upgrade: true,
  rememberUpgrade: true,
  pingInterval: 25000,
  pingTimeout: 20000,
  
  // Configuration avancée pour stabilité
  closeOnBeforeunload: false,
  transports: ['websocket', 'polling'],
  forceBase64: false,
  enablesXDR: false,
  
  // Gestion des erreurs de transport
  transportOptions: {
    polling: {
      extraHeaders: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    },
    websocket: {
      extraHeaders: {}
    }
  }
};

// Configuration des timeouts API
export const API_TIMEOUTS = {
  default: 30000,      // 30 secondes par défaut
  upload: 60000,       // 1 minute pour uploads
  whatsapp: 45000,     // 45 secondes pour WhatsApp
  firebase: 30000,     // 30 secondes pour Firebase
  health: 10000        // 10 secondes pour health checks
};

// Configuration retry policy
export const RETRY_CONFIG = {
  maxRetries: 5,
  retryDelay: 2000,
  retryDelayMultiplier: 1.5,
  maxRetryDelay: 15000,
  retryCondition: (error) => {
    // Retry sur erreurs réseau, 5xx et certaines erreurs spécifiques
    if (!error.response) return true; // Erreur réseau
    if (error.response.status >= 500) return true; // Erreur serveur
    if (error.response.status === 429) return true; // Rate limit
    if (error.code === 'ECONNABORTED') return true; // Timeout
    if (error.code === 'ETIMEDOUT') return true; // Timeout réseau
    return false;
  }
};

// Configuration monitoring frontend
export const MONITORING_CONFIG = {
  enabled: true,
  heartbeatInterval: 30000,    // 30 secondes
  metricsInterval: 60000,      // 1 minute
  errorTracking: true,
  performanceTracking: true,
  maxErrorsStored: 50,
  maxMetricsStored: 100
};

// Endpoints API standardisés
export const API_ENDPOINTS = {
  // Auth & Users
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    verify: '/api/auth/verify',
    refresh: '/api/auth/refresh'
  },
  
  // Firebase
  firebase: {
    init: '/api/firebase/init',
    status: '/api/firebase/status',
    verify: '/api/firebase/verify'
  },
  
  // WhatsApp
  whatsapp: {
    status: '/api/whatsapp/status',
    send: '/api/whatsapp/send',
    qr: '/api/whatsapp/qr',
    disconnect: '/api/whatsapp/disconnect'
  },
  
  // System
  system: {
    health: '/api/health',
    metrics: '/api/metrics',
    status: '/api/status'
  },
  
  // Files
  files: {
    upload: '/api/files/upload',
    download: '/api/files/download'
  }
};

// Configuration Firebase Frontend
export const FIREBASE_CONFIG = {
  persistenceEnabled: true,
  cacheSizeBytes: 40 * 1024 * 1024, // 40MB cache
  experimentalForceLongPolling: false,
  experimentalAutoDetectLongPolling: true
};

// Validation de la configuration
export const validateConfig = () => {
  const issues = [];
  
  if (!API_URL) {
    issues.push('API_URL non définie');
  }
  
  if (!API_URL.startsWith('http')) {
    issues.push('API_URL doit commencer par http/https');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

// Utilitaires de configuration
export const getEnvironment = () => {
  if (import.meta.env.DEV) return 'development';
  if (import.meta.env.PROD) return 'production';
  return 'unknown';
};

export const isLocalhost = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1');
};

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return '';
};

// Configuration complète exportée
export default {
  API_URL,
  SOCKET_CONFIG,
  API_TIMEOUTS,
  RETRY_CONFIG,
  MONITORING_CONFIG,
  API_ENDPOINTS,
  FIREBASE_CONFIG,
  validateConfig,
  getEnvironment,
  isLocalhost,
  getBaseUrl
}; 