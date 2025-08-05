import { MONITORING_CONFIG } from '../config/apiConfig';
import apiService from './apiService';

/**
 * Service de monitoring frontend pour WhatsLand
 * Collecte les métriques côté client et synchronise avec le backend
 */
class FrontendMonitoringService {
  constructor() {
    this.metrics = {
      page: {
        loadTime: 0,
        renderTime: 0,
        navigationTiming: null,
        resourceTiming: [],
        errors: []
      },
      user: {
        interactions: 0,
        sessionDuration: 0,
        pageViews: 0,
        currentPage: window.location.pathname
      },
      api: {
        requestCount: 0,
        averageResponseTime: 0,
        errorRate: 0,
        errors: []
      },
      whatsapp: {
        connectionAttempts: 0,
        qrCodesReceived: 0,
        messagesAttempted: 0,
        messagesSuccessful: 0,
        lastConnectionStatus: 'unknown'
      },
      system: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine
      }
    };

    this.startTime = Date.now();
    this.heartbeatInterval = null;
    this.metricsInterval = null;
    this.isEnabled = MONITORING_CONFIG.enabled;

    if (this.isEnabled) {
      this.initialize();
    }
  }

  /**
   * Initialiser le monitoring
   */
  initialize() {
    console.log('📊 Initialisation du monitoring frontend...');

    this.collectPageMetrics();
    this.setupEventListeners();
    this.startHeartbeat();
    this.startMetricsCollection();

    console.log('✅ Monitoring frontend démarré');
  }

  /**
   * Collecter les métriques de performance de la page
   */
  collectPageMetrics() {
    // Performance timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      this.metrics.page.loadTime = timing.loadEventEnd - timing.navigationStart;
      this.metrics.page.renderTime = timing.domContentLoadedEventEnd - timing.navigationStart;
      this.metrics.page.navigationTiming = timing;
    }

    // Resource timing
    if (window.performance && window.performance.getEntriesByType) {
      this.metrics.page.resourceTiming = window.performance.getEntriesByType('resource');
    }

    // Core Web Vitals
    this.collectWebVitals();
  }

  /**
   * Collecter les Core Web Vitals
   */
  collectWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.page.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.page.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
          this.metrics.page.cls = clsScore;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.warn('⚠️ Erreur collecte Web Vitals:', error);
      }
    }
  }

  /**
   * Configurer les écouteurs d'événements
   */
  setupEventListeners() {
    // Erreurs JavaScript
    window.addEventListener('error', (event) => {
      this.trackError('javascript', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('promise', event.reason);
    });

    // Erreurs API
    window.addEventListener('api-error', (event) => {
      this.trackApiError(event.detail);
    });

    // Interactions utilisateur
    ['click', 'keypress', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.metrics.user.interactions++;
      }, { passive: true });
    });

    // Changements de page (pour SPA)
    window.addEventListener('popstate', () => {
      this.trackPageView();
    });

    // État de connexion
    window.addEventListener('online', () => {
      this.metrics.system.onlineStatus = true;
      this.trackSystemEvent('connection_restored');
    });

    window.addEventListener('offline', () => {
      this.metrics.system.onlineStatus = false;
      this.trackSystemEvent('connection_lost');
    });

    // Événements WhatsApp personnalisés
    window.addEventListener('whatsapp-status-change', (event) => {
      this.trackWhatsAppEvent(event.detail.status, event.detail);
    });

    // Visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden');
      } else {
        this.trackEvent('page_visible');
      }
    });
  }

  /**
   * Démarrer le heartbeat
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, MONITORING_CONFIG.heartbeatInterval);
  }

  /**
   * Démarrer la collecte de métriques
   */
  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectRuntimeMetrics();
      this.sendMetrics();
    }, MONITORING_CONFIG.metricsInterval);
  }

  /**
   * Collecter les métriques en temps réel
   */
  collectRuntimeMetrics() {
    // Durée de session
    this.metrics.user.sessionDuration = Date.now() - this.startTime;

    // Mémoire (si disponible)
    if (window.performance && window.performance.memory) {
      this.metrics.system.memory = {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
      };
    }

    // Connexion réseau (si disponible)
    if (navigator.connection) {
      this.metrics.system.connection = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
  }

  /**
   * Tracker une erreur
   */
  trackError(type, error, context = {}) {
    const errorInfo = {
      type,
      message: error?.message || error?.toString() || 'Erreur inconnue',
      stack: error?.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.metrics.page.errors.push(errorInfo);

    // Limiter le nombre d'erreurs stockées
    if (this.metrics.page.errors.length > MONITORING_CONFIG.maxErrorsStored) {
      this.metrics.page.errors.shift();
    }

    console.error(`❌ Frontend Error (${type}):`, errorInfo);

    // Envoyer immédiatement pour les erreurs critiques
    if (type === 'javascript' || type === 'promise') {
      this.sendErrorReport(errorInfo);
    }
  }

  /**
   * Tracker une erreur API
   */
  trackApiError(errorDetails) {
    this.metrics.api.errors.push({
      ...errorDetails,
      timestamp: Date.now()
    });

    this.metrics.api.errorRate = this.calculateErrorRate();

    // Limiter le nombre d'erreurs API stockées
    if (this.metrics.api.errors.length > MONITORING_CONFIG.maxErrorsStored) {
      this.metrics.api.errors.shift();
    }
  }

  /**
   * Calculer le taux d'erreur API
   */
  calculateErrorRate() {
    const totalRequests = this.metrics.api.requestCount;
    const totalErrors = this.metrics.api.errors.length;
    
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  /**
   * Tracker un événement WhatsApp
   */
  trackWhatsAppEvent(status, details = {}) {
    this.metrics.whatsapp.lastConnectionStatus = status;

    switch (status) {
      case 'qr':
        this.metrics.whatsapp.qrCodesReceived++;
        break;
      case 'connecting':
        this.metrics.whatsapp.connectionAttempts++;
        break;
      case 'connected':
        this.trackEvent('whatsapp_connected', details);
        break;
      case 'disconnected':
        this.trackEvent('whatsapp_disconnected', details);
        break;
    }

    console.log(`📱 WhatsApp Event: ${status}`, details);
  }

  /**
   * Tracker une vue de page
   */
  trackPageView(page = window.location.pathname) {
    this.metrics.user.pageViews++;
    this.metrics.user.currentPage = page;
    
    this.trackEvent('page_view', { page });
  }

  /**
   * Tracker un événement système
   */
  trackSystemEvent(event, details = {}) {
    this.trackEvent(`system_${event}`, details);
  }

  /**
   * Tracker un événement générique
   */
  trackEvent(eventName, details = {}) {
    const event = {
      name: eventName,
      details,
      timestamp: Date.now(),
      url: window.location.href
    };

    console.log(`📊 Event: ${eventName}`, details);

    // Envoyer l'événement au backend si nécessaire
    if (this.shouldSendEvent(eventName)) {
      this.sendEvent(event);
    }
  }

  /**
   * Vérifier si on doit envoyer l'événement au backend
   */
  shouldSendEvent(eventName) {
    const criticalEvents = [
      'whatsapp_connected',
      'whatsapp_disconnected',
      'system_connection_lost',
      'page_load_slow'
    ];

    return criticalEvents.includes(eventName);
  }

  /**
   * Envoyer un heartbeat au backend
   */
  async sendHeartbeat() {
    try {
      const heartbeatData = {
        timestamp: Date.now(),
        sessionDuration: this.metrics.user.sessionDuration,
        currentPage: this.metrics.user.currentPage,
        onlineStatus: this.metrics.system.onlineStatus,
        interactions: this.metrics.user.interactions
      };

      // Envoyer via API si disponible
      await apiService.post('/api/monitoring/heartbeat', heartbeatData);
      
    } catch (error) {
      // Ignorer les erreurs de heartbeat pour éviter les boucles
      console.warn('⚠️ Heartbeat failed:', error.message);
    }
  }

  /**
   * Envoyer les métriques au backend
   */
  async sendMetrics() {
    try {
      const metricsData = {
        ...this.metrics,
        timestamp: Date.now()
      };

      await apiService.post('/api/monitoring/metrics', metricsData);
      console.log('📊 Métriques envoyées au backend');
      
    } catch (error) {
      console.warn('⚠️ Envoi métriques échoué:', error.message);
    }
  }

  /**
   * Envoyer un rapport d'erreur
   */
  async sendErrorReport(errorInfo) {
    try {
      await apiService.post('/api/monitoring/error', errorInfo);
    } catch (error) {
      console.warn('⚠️ Envoi rapport d\'erreur échoué:', error.message);
    }
  }

  /**
   * Envoyer un événement
   */
  async sendEvent(event) {
    try {
      await apiService.post('/api/monitoring/event', event);
    } catch (error) {
      console.warn('⚠️ Envoi événement échoué:', error.message);
    }
  }

  /**
   * Obtenir les métriques actuelles
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.startTime
    };
  }

  /**
   * Obtenir un résumé des performances
   */
  getPerformanceSummary() {
    const metrics = this.getMetrics();
    
    return {
      pageLoad: {
        loadTime: metrics.page.loadTime,
        renderTime: metrics.page.renderTime,
        lcp: metrics.page.lcp,
        fid: metrics.page.fid,
        cls: metrics.page.cls
      },
      api: {
        requestCount: metrics.api.requestCount,
        averageResponseTime: metrics.api.averageResponseTime,
        errorRate: metrics.api.errorRate
      },
      session: {
        duration: metrics.user.sessionDuration,
        pageViews: metrics.user.pageViews,
        interactions: metrics.user.interactions
      },
      errors: {
        total: metrics.page.errors.length,
        apiErrors: metrics.api.errors.length
      }
    };
  }

  /**
   * Réinitialiser les métriques
   */
  reset() {
    this.metrics = {
      page: { loadTime: 0, renderTime: 0, navigationTiming: null, resourceTiming: [], errors: [] },
      user: { interactions: 0, sessionDuration: 0, pageViews: 0, currentPage: window.location.pathname },
      api: { requestCount: 0, averageResponseTime: 0, errorRate: 0, errors: [] },
      whatsapp: { connectionAttempts: 0, qrCodesReceived: 0, messagesAttempted: 0, messagesSuccessful: 0, lastConnectionStatus: 'unknown' },
      system: { userAgent: navigator.userAgent, language: navigator.language, platform: navigator.platform, cookieEnabled: navigator.cookieEnabled, onlineStatus: navigator.onLine }
    };
    
    this.startTime = Date.now();
    console.log('✅ Métriques frontend réinitialisées');
  }

  /**
   * Arrêter le monitoring
   */
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    console.log('✅ Monitoring frontend arrêté');
  }
}

// Instance singleton
const frontendMonitoringService = new FrontendMonitoringService();

// Export pour usage dans les composants
export default frontendMonitoringService;