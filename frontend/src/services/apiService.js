import axios from 'axios';
import { 
  API_URL, 
  API_TIMEOUTS, 
  RETRY_CONFIG, 
  API_ENDPOINTS 
} from '../config/apiConfig';

/**
 * Service API robuste avec authentification Firebase, retry automatique
 * et gestion d'erreurs avancée pour WhatsLand
 */
class ApiService {
  constructor() {
    this.baseURL = API_URL;
    this.authToken = null;
    this.refreshTokenPromise = null;
    this.requestQueue = [];
    this.isRefreshing = false;
    
    this.setupAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Configuration de l'instance Axios
   */
  setupAxiosInstance() {
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: API_TIMEOUTS.default,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: false
    });
  }

  /**
   * Configuration des intercepteurs
   */
  setupInterceptors() {
    // Intercepteur de requête
    this.axios.interceptors.request.use(
      async (config) => {
        // Ajouter le token Firebase si disponible
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Ajouter des headers spécifiques selon l'endpoint
        if (config.url?.includes('/api/whatsapp/')) {
          config.timeout = API_TIMEOUTS.whatsapp;
        } else if (config.url?.includes('/api/firebase/')) {
          config.timeout = API_TIMEOUTS.firebase;
        } else if (config.url?.includes('/api/files/upload')) {
          config.timeout = API_TIMEOUTS.upload;
          config.headers['Content-Type'] = 'multipart/form-data';
        }

        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur de réponse
    this.axios.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        return this.handleResponseError(error);
      }
    );
  }

  /**
   * Gérer les erreurs de réponse avec retry automatique
   */
  async handleResponseError(error) {
    const originalRequest = error.config;

    try {
      // Éviter les boucles infinies
      if (originalRequest._retry) {
        throw error;
      }

      // Gestion des erreurs 401 (token expiré)
      if (error.response?.status === 401 && this.authToken) {
        return await this.handleTokenRefresh(originalRequest);
      }

      // Gestion des erreurs 503 (service indisponible)
      if (error.response?.status === 503) {
        console.warn('⚠️ Service temporairement indisponible, tentative de reconnexion...');
        
        // Attendre un peu plus longtemps avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Forcer une nouvelle tentative
        originalRequest._retry = true;
        return this.axios(originalRequest);
      }

      // Retry automatique pour les erreurs réseau et 5xx
      if (this.shouldRetry(error, originalRequest)) {
        return await this.retryRequest(originalRequest);
      }

      // Log de l'erreur
      this.logError(error);
      
      // Émettre un événement pour le monitoring
      window.dispatchEvent(new CustomEvent('api-error', {
        detail: {
          type: 'api',
          error: this.formatError(error),
          request: {
            url: originalRequest.url,
            method: originalRequest.method
          }
        }
      }));

      throw this.formatError(error);
    } catch (handlingError) {
      console.error('❌ Erreur lors de la gestion d\'erreur:', handlingError);
      throw handlingError;
    }
  }

  /**
   * Gestion du rafraîchissement de token
   */
  async handleTokenRefresh(originalRequest) {
    if (this.isRefreshing) {
      // Mettre en queue les requêtes pendant le refresh
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject, request: originalRequest });
      });
    }

    this.isRefreshing = true;

    try {
      // Émettre un événement pour que AuthContext rafraîchisse le token
      window.dispatchEvent(new CustomEvent('token-refresh-needed'));
      
      // Attendre que le nouveau token soit disponible
      await new Promise((resolve) => {
        const handler = (event) => {
          this.setAuthToken(event.detail.token);
          window.removeEventListener('token-refreshed', handler);
          resolve();
        };
        window.addEventListener('token-refreshed', handler);
        
        // Timeout si le refresh prend trop de temps
        setTimeout(() => {
          window.removeEventListener('token-refreshed', handler);
          resolve();
        }, 10000);
      });

      // Rejouer les requêtes en queue
      this.processRequestQueue();
      
      // Rejouer la requête originale
      originalRequest.headers.Authorization = `Bearer ${this.authToken}`;
      return this.axios(originalRequest);

    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);
      this.clearAuthToken();
      // Rediriger vers login si nécessaire
      window.dispatchEvent(new CustomEvent('auth-required'));
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Traiter la queue de requêtes
   */
  processRequestQueue() {
    this.requestQueue.forEach(({ resolve, request }) => {
      request.headers.Authorization = `Bearer ${this.authToken}`;
      resolve(this.axios(request));
    });
    this.requestQueue = [];
  }

  /**
   * Vérifier si on doit retry la requête
   */
  shouldRetry(error, originalRequest) {
    if (!RETRY_CONFIG.retryCondition(error)) {
      return false;
    }

    const retryCount = originalRequest._retryCount || 0;
    return retryCount < RETRY_CONFIG.maxRetries;
  }

  /**
   * Retry d'une requête avec backoff exponentiel
   */
  async retryRequest(originalRequest) {
    originalRequest._retry = true;
    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

    const delay = Math.min(
      RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryDelayMultiplier, originalRequest._retryCount - 1),
      RETRY_CONFIG.maxRetryDelay
    );

    console.log(`🔄 Retrying request (${originalRequest._retryCount}/${RETRY_CONFIG.maxRetries}) in ${delay}ms`);

    await new Promise(resolve => setTimeout(resolve, delay));
    return this.axios(originalRequest);
  }

  /**
   * Logger les erreurs
   */
  logError(error) {
    const errorInfo = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      timestamp: new Date().toISOString()
    };

    console.error('❌ API Error:', errorInfo);
    
    // Émettre un événement pour le monitoring
    window.dispatchEvent(new CustomEvent('api-error', { detail: errorInfo }));
  }

  /**
   * Formater les erreurs pour l'UI
   */
  formatError(error) {
    const formattedError = {
      message: 'Une erreur est survenue',
      status: error.response?.status,
      code: error.code,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    };

    // Messages d'erreur personnalisés
    if (error.response?.status === 401) {
      formattedError.message = 'Session expirée, veuillez vous reconnecter';
    } else if (error.response?.status === 403) {
      formattedError.message = 'Accès non autorisé';
    } else if (error.response?.status === 404) {
      formattedError.message = 'Ressource non trouvée';
    } else if (error.response?.status >= 500) {
      formattedError.message = 'Erreur du serveur, veuillez réessayer plus tard';
    } else if (error.code === 'NETWORK_ERROR') {
      formattedError.message = 'Erreur de connexion réseau';
    } else if (error.code === 'ECONNABORTED') {
      formattedError.message = 'Délai d\'attente dépassé';
    }

    return formattedError;
  }

  /**
   * Définir le token d'authentification
   */
  setAuthToken(token) {
    this.authToken = token;
    console.log('🔑 Auth token set for API requests');
  }

  /**
   * Supprimer le token d'authentification
   */
  clearAuthToken() {
    this.authToken = null;
    console.log('🚪 Auth token cleared');
  }

  /**
   * Méthodes HTTP avec gestion d'erreurs
   */
  async get(url, config = {}) {
    try {
      const response = await this.axios.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async post(url, data, config = {}) {
    try {
      const response = await this.axios.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async put(url, data, config = {}) {
    try {
      const response = await this.axios.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.axios.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Méthodes spécialisées pour WhatsLand
   */

  // Auth (optimisé pour login rapide)
  async verifyFirebaseToken(token) {
    try {
      // Vérifier que le token est valide
      if (!token || typeof token !== 'string') {
        throw new Error('Token invalide');
      }

      // Configurer la requête avec timeout court et pas de health check préalable
      const config = {
        timeout: API_TIMEOUTS.firebase, // 8 secondes maintenant
        headers: {
          'Authorization': `Bearer ${token}`
        },
        // Désactiver les retry pour cette requête critique
        retry: false
      };

      // Faire la requête directement sans health check préalable
      return await this.post(API_ENDPOINTS.firebase.verify, { token }, config);
    } catch (error) {
      console.error('❌ Erreur vérification token Firebase:', error);
      
      // Formater l'erreur pour l'UI
      const formattedError = this.formatError(error);
      formattedError.context = { token: '***' };
      
      throw formattedError;
    }
  }

  // WhatsApp
  async getWhatsAppStatus() {
    return this.get(API_ENDPOINTS.whatsapp.status);
  }

  async sendWhatsAppMessage(data) {
    return this.post(API_ENDPOINTS.whatsapp.send, data);
  }

  async initWhatsAppSession() {
    return this.post(API_ENDPOINTS.firebase.init);
  }

  // System
  async getSystemHealth() {
    return this.get(API_ENDPOINTS.system.health);
  }

  async getSystemMetrics() {
    return this.get(API_ENDPOINTS.system.metrics);
  }

  // Files
  async uploadFile(file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      };
    }

    return this.post(API_ENDPOINTS.files.upload, formData, config);
  }

  /**
   * Utilitaires de diagnostic
   */
  async testConnection() {
    try {
      const startTime = Date.now();
      // Test de connexion via un endpoint qui fonctionne
    const response = await this.get('/api/firebase/health', { timeout: 5000 });
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        latency: latency,
        status: response.status || 'ok',
        response: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  getConnectionInfo() {
    return {
      baseURL: this.baseURL,
      hasAuthToken: !!this.authToken,
      isRefreshing: this.isRefreshing,
      queueLength: this.requestQueue.length
    };
  }
}

// Instance singleton
const apiService = new ApiService();

export default apiService;