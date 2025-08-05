/**
 * Index des services frontend WhatsLand
 * Point d'entrée centralisé pour tous les services côté client
 */

import apiService from './apiService';
import frontendMonitoringService from './monitoringService';

/**
 * Initialiser tous les services frontend
 */
export async function initializeFrontendServices() {
  console.log('🚀 Initialisation des services frontend WhatsLand...');
  
  try {
    // 1. Valider la configuration
    const { validateConfig } = await import('../config/apiConfig');
    const configValidation = validateConfig();
    
    if (!configValidation.valid) {
      console.warn('⚠️ Configuration invalide:', configValidation.issues);
    }
    
    // 2. Tester la connexion API
    console.log('🔗 Test de connexion API...');
    const connectionTest = await apiService.testConnection();
    
    if (connectionTest.success) {
      console.log(`✅ API connectée (latence: ${connectionTest.latency}ms)`);
    } else {
      console.warn('⚠️ Test API échoué:', connectionTest.error);
    }
    
    // 3. Démarrer le monitoring (déjà fait automatiquement)
    console.log('📊 Service de monitoring actif');
    
    // 4. Configurer les écouteurs globaux
    setupGlobalEventListeners();
    
    console.log('✅ Services frontend initialisés avec succès');
    
    // Émettre un événement de réussite
    window.dispatchEvent(new CustomEvent('frontend-services-ready', {
      detail: {
        timestamp: Date.now(),
        services: ['api', 'monitoring'],
        apiConnection: connectionTest
      }
    }));
    
    return {
      success: true,
      services: {
        api: apiService.getConnectionInfo(),
        monitoring: frontendMonitoringService.getMetrics()
      }
    };
    
  } catch (error) {
    console.error('❌ Erreur initialisation services frontend:', error);
    
    // Émettre un événement d'erreur
    window.dispatchEvent(new CustomEvent('frontend-services-error', {
      detail: {
        timestamp: Date.now(),
        error: error.message
      }
    }));
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Configurer les écouteurs d'événements globaux
 */
function setupGlobalEventListeners() {
  // Erreurs non capturées
  window.addEventListener('error', (event) => {
    frontendMonitoringService.trackError('javascript', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Promesses rejetées
  window.addEventListener('unhandledrejection', (event) => {
    frontendMonitoringService.trackError('promise', event.reason);
  });

  // Changements de connexion
  window.addEventListener('online', () => {
    frontendMonitoringService.trackEvent('connection_restored');
    console.log('🌐 Connexion Internet restaurée');
  });

  window.addEventListener('offline', () => {
    frontendMonitoringService.trackEvent('connection_lost');
    console.warn('🌐 Connexion Internet perdue');
  });

  // Visibilité de la page
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      frontendMonitoringService.trackEvent('page_hidden');
    } else {
      frontendMonitoringService.trackEvent('page_visible');
    }
  });

  // Événements personnalisés WhatsApp
  window.addEventListener('whatsapp-status-change', (event) => {
    frontendMonitoringService.trackWhatsAppEvent(
      event.detail.status, 
      event.detail
    );
  });

  // Alerte mémoire du backend
  window.addEventListener('memoryAlert', (event) => {
    console.warn('⚠️ Alerte mémoire backend:', event.detail);
    frontendMonitoringService.trackEvent('backend_memory_alert', event.detail);
  });

  // Authentification requise
  window.addEventListener('auth-required', () => {
    console.log('🔐 Authentification requise');
    frontendMonitoringService.trackEvent('auth_required');
  });

  console.log('✅ Écouteurs globaux configurés');
}

/**
 * Obtenir le statut de tous les services frontend
 */
export function getFrontendServicesStatus() {
  return {
    api: {
      status: 'active',
      info: apiService.getConnectionInfo()
    },
    monitoring: {
      status: 'active',
      metrics: frontendMonitoringService.getPerformanceSummary()
    },
    timestamp: Date.now()
  };
}

/**
 * Vérifier la santé des services frontend
 */
export async function checkFrontendHealth() {
  try {
    const health = {
      overall: 'healthy',
      services: {},
      issues: [],
      timestamp: Date.now()
    };

    // Vérifier l'API
    const apiTest = await apiService.testConnection();
    health.services.api = {
      status: apiTest.success ? 'healthy' : 'error',
      latency: apiTest.latency,
      error: apiTest.error
    };

    if (!apiTest.success) {
      health.issues.push(`API inaccessible: ${apiTest.error}`);
      health.overall = 'error';
    }

    // Vérifier le monitoring
    const monitoringMetrics = frontendMonitoringService.getPerformanceSummary();
    health.services.monitoring = {
      status: 'healthy',
      errorCount: monitoringMetrics.errors?.total || 0
    };

    if (monitoringMetrics.errors?.total > 10) {
      health.issues.push(`Nombreuses erreurs frontend: ${monitoringMetrics.errors.total}`);
      health.overall = 'warning';
    }

    // Vérifier la mémoire frontend
    if (window.performance?.memory) {
      const memoryUsage = window.performance.memory;
      const memoryPercent = (memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100;
      
      health.services.memory = {
        status: memoryPercent > 80 ? 'warning' : 'healthy',
        usage: memoryPercent
      };

      if (memoryPercent > 80) {
        health.issues.push(`Mémoire JS élevée: ${memoryPercent.toFixed(1)}%`);
        if (health.overall === 'healthy') {
          health.overall = 'warning';
        }
      }
    }

    return health;

  } catch (error) {
    return {
      overall: 'error',
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Effectuer un diagnostic complet du frontend
 */
export async function runFrontendDiagnostics() {
  console.log('🔍 Démarrage du diagnostic frontend...');
  
  const diagnostics = {
    timestamp: Date.now(),
    environment: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    },
    performance: {},
    services: {},
    recommendations: []
  };

  try {
    // Performance
    if (window.performance) {
      diagnostics.performance = {
        navigation: window.performance.timing,
        memory: window.performance.memory,
        resources: window.performance.getEntriesByType('resource').length
      };
    }

    // Services
    diagnostics.services = getFrontendServicesStatus();

    // Santé générale
    const health = await checkFrontendHealth();
    diagnostics.health = health;

    // Recommandations basées sur les métriques
    if (health.overall !== 'healthy') {
      diagnostics.recommendations.push({
        priority: 'high',
        message: 'Problèmes détectés, vérifier les services',
        issues: health.issues
      });
    }

    const memoryPercent = diagnostics.performance.memory ? 
      (diagnostics.performance.memory.usedJSHeapSize / diagnostics.performance.memory.jsHeapSizeLimit) * 100 : 0;

    if (memoryPercent > 70) {
      diagnostics.recommendations.push({
        priority: 'medium',
        message: 'Utilisation mémoire élevée, considérer un rafraîchissement',
        value: `${memoryPercent.toFixed(1)}%`
      });
    }

    if (!navigator.onLine) {
      diagnostics.recommendations.push({
        priority: 'high',
        message: 'Connexion Internet non disponible'
      });
    }

    console.log('✅ Diagnostic frontend terminé');
    return diagnostics;

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    diagnostics.error = error.message;
    return diagnostics;
  }
}

/**
 * Nettoyer et redémarrer les services frontend
 */
export async function restartFrontendServices() {
  console.log('🔄 Redémarrage des services frontend...');
  
  try {
    // Réinitialiser le monitoring
    frontendMonitoringService.reset();
    
    // Réinitialiser les métriques API
    // Note: L'API service garde sa configuration de base
    
    // Forcer un garbage collection si disponible
    if (window.gc) {
      window.gc();
      console.log('🧹 Garbage collection effectué');
    }
    
    // Réinitialiser
    return await initializeFrontendServices();
    
  } catch (error) {
    console.error('❌ Erreur redémarrage services:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export des services individuels
export {
  apiService,
  frontendMonitoringService
};

// Export par défaut
export default {
  initializeFrontendServices,
  getFrontendServicesStatus,
  checkFrontendHealth,
  runFrontendDiagnostics,
  restartFrontendServices,
  apiService,
  frontendMonitoringService
};