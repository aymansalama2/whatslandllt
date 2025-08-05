/**
 * Index des services WhatsLand
 * Point d'entrée centralisé pour tous les services
 */

const firebaseManager = require('./firebaseManager');
const whatsappSessionManager = require('./whatsappSessionManager');
const monitoringService = require('./monitoringService');
const performanceOptimizer = require('./performanceOptimizer');

/**
 * Initialiser tous les services
 */
async function initializeServices() {
  console.log('🚀 Initialisation des services WhatsLand...');
  
  try {
    // 1. Initialiser Firebase
    console.log('🔥 Initialisation de Firebase...');
    await firebaseManager.initialize();
    
    // 2. Démarrer le monitoring
    console.log('📊 Démarrage du monitoring...');
    monitoringService.startMonitoring();
    
    // 3. Configurer l'optimiseur de performance
    console.log('⚡ Configuration de l\'optimiseur...');
    performanceOptimizer.initialize();
    
    // 4. Préparer le gestionnaire de sessions WhatsApp
    console.log('📱 Préparation du gestionnaire WhatsApp...');
    whatsappSessionManager.startPeriodicCleanup();
    
    console.log('✅ Tous les services sont initialisés');
    
    // Émettre un événement de réussite
    process.emit('servicesReady', {
      timestamp: Date.now(),
      services: ['firebase', 'monitoring', 'performance', 'whatsapp']
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur initialisation des services:', error.message);
    
    // Émettre un événement d'erreur
    process.emit('servicesError', {
      timestamp: Date.now(),
      error: error.message
    });
    
    return false;
  }
}

/**
 * Arrêter tous les services proprement
 */
async function shutdownServices() {
  console.log('🔄 Arrêt des services WhatsLand...');
  
  try {
    // Arrêter dans l'ordre inverse
    await whatsappSessionManager.shutdown();
    performanceOptimizer.shutdown();
    monitoringService.stopMonitoring();
    await firebaseManager.reset();
    
    console.log('✅ Tous les services sont arrêtés');
    
  } catch (error) {
    console.error('❌ Erreur arrêt des services:', error.message);
  }
}

/**
 * Obtenir le statut de tous les services
 */
function getServicesStatus() {
  return {
    firebase: firebaseManager.getStatus(),
    whatsapp: whatsappSessionManager.getSessionStatus(),
    monitoring: monitoringService.getMetrics(),
    performance: performanceOptimizer.getPerformanceStats(),
    timestamp: Date.now()
  };
}

/**
 * Vérifier la santé de tous les services
 */
async function checkServicesHealth() {
  try {
    const health = {
      overall: 'healthy',
      services: {},
      issues: [],
      timestamp: Date.now()
    };
    
    // Vérifier Firebase
    const firebaseStatus = firebaseManager.getStatus();
    health.services.firebase = {
      status: firebaseStatus.initialized ? 'healthy' : 'degraded',
      details: firebaseStatus
    };
    
    if (!firebaseStatus.initialized) {
      health.issues.push('Firebase non initialisé');
      health.overall = 'degraded';
    }
    
    // Vérifier WhatsApp
    const whatsappStatus = await whatsappSessionManager.getSessionStatus();
    health.services.whatsapp = {
      status: whatsappStatus.error ? 'error' : 'healthy',
      details: whatsappStatus
    };
    
    if (whatsappStatus.error) {
      health.issues.push(`WhatsApp: ${whatsappStatus.error}`);
      health.overall = 'error';
    }
    
    // Vérifier le monitoring
    const systemHealth = await monitoringService.checkSystemHealth();
    health.services.monitoring = {
      status: systemHealth.healthy ? 'healthy' : 'warning',
      details: systemHealth
    };
    
    if (!systemHealth.healthy) {
      health.issues.push(...systemHealth.issues);
      if (health.overall === 'healthy') {
        health.overall = 'warning';
      }
    }
    
    // Vérifier les performances
    const perfStats = performanceOptimizer.getPerformanceStats();
    const memoryPercent = perfStats.memory ? perfStats.memory.heapPercent : 0;
    
    health.services.performance = {
      status: memoryPercent > 80 ? 'warning' : 'healthy',
      details: perfStats
    };
    
    if (memoryPercent > 80) {
      health.issues.push(`Mémoire élevée: ${memoryPercent.toFixed(1)}%`);
      if (health.overall === 'healthy') {
        health.overall = 'warning';
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

// Gestion propre de l'arrêt
process.on('SIGINT', shutdownServices);
process.on('SIGTERM', shutdownServices);
process.on('exit', shutdownServices);

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  monitoringService.trackSystemError('uncaught_exception', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejetée non gérée:', reason);
  monitoringService.trackSystemError('unhandled_rejection', new Error(reason));
});

// Export des services
module.exports = {
  // Services individuels
  firebaseManager,
  whatsappSessionManager,
  monitoringService,
  performanceOptimizer,
  
  // Fonctions de gestion
  initializeServices,
  shutdownServices,
  getServicesStatus,
  checkServicesHealth
};