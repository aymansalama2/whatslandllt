import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiActivity, 
  FiCpu, 
  FiHardDrive, 
  FiWifi, 
  FiWifiOff,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import apiService from '../services/apiService';
import frontendMonitoringService from '../services/monitoringService';

/**
 * Composant de monitoring de la santé système
 * Affiche les métriques backend et frontend en temps réel
 */
export default function SystemHealth({ compact = false, autoRefresh = true }) {
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [isVisible, setIsVisible] = useState(!compact);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Charger les métriques système
   */
  const loadSystemMetrics = async () => {
    try {
      setError(null);
      
      // Métriques backend
      const [health, metrics] = await Promise.all([
        apiService.getSystemHealth(),
        apiService.getSystemMetrics()
      ]);

      // Métriques frontend
      const frontendMetrics = frontendMonitoringService.getPerformanceSummary();

      setSystemMetrics({
        backend: { health, metrics },
        frontend: frontendMetrics,
        timestamp: Date.now()
      });

      setLastUpdate(new Date());
      
    } catch (err) {
      setError(err.message);
      console.error('❌ Erreur chargement métriques:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh des métriques
  useEffect(() => {
    loadSystemMetrics();

    if (autoRefresh) {
      const interval = setInterval(loadSystemMetrics, 30000); // 30 secondes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  /**
   * Obtenir la couleur selon le statut
   */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'critical':
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  /**
   * Formater la mémoire en MB
   */
  const formatMemory = (bytes) => {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  /**
   * Formater le pourcentage
   */
  const formatPercentage = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  /**
   * Obtenir l'icône de statut
   */
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
        return FiCheckCircle;
      case 'warning':
      case 'degraded':
        return FiAlertTriangle;
      case 'error':
      case 'critical':
        return FiXCircle;
      default:
        return FiActivity;
    }
  };

  if (compact && !isVisible) {
    return (
      <motion.button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiActivity size={20} />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`${compact ? 'fixed bottom-4 right-4 z-50' : 'w-full'}`}
      >
        <div className={`bg-white rounded-xl shadow-lg border ${compact ? 'w-80' : 'w-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <FiActivity className="text-blue-600" size={20} />
              <h3 className="font-semibold text-gray-800">Santé Système</h3>
              {systemMetrics?.backend?.health?.healthy ? (
                <FiCheckCircle className="text-green-500" size={16} />
              ) : (
                <FiXCircle className="text-red-500" size={16} />
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={loadSystemMetrics}
                disabled={loading}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
              </button>
              
              {compact && (
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiEyeOff size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <FiRefreshCw className="animate-spin text-blue-500" size={24} />
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-red-600">
                <FiXCircle size={20} />
                <span className="ml-2">{error}</span>
              </div>
            ) : systemMetrics ? (
              <>
                {/* Statut global */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Backend</span>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        getStatusColor(systemMetrics.backend?.health?.overall || 'unknown')
                      }`}>
                        {systemMetrics.backend?.health?.overall || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Frontend</span>
                      <div className="px-2 py-1 rounded text-xs font-medium text-green-600 bg-green-100">
                        Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métriques détaillées */}
                <div className="space-y-3">
                  {/* Mémoire */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FiCpu className="text-blue-500" size={16} />
                        <span className="text-sm font-medium">Mémoire</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {systemMetrics.backend?.metrics?.memory?.heapPercent 
                          ? formatPercentage(systemMetrics.backend.metrics.memory.heapPercent)
                          : 'N/A'
                        }
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Backend Heap:</span>
                        <span>{formatMemory(systemMetrics.backend?.metrics?.memory?.heapUsed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frontend JS:</span>
                        <span>{formatMemory(systemMetrics.frontend?.system?.memory?.usedJSHeapSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* API */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FiWifi className="text-green-500" size={16} />
                        <span className="text-sm font-medium">API</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {systemMetrics.frontend?.api?.errorRate 
                          ? formatPercentage(systemMetrics.frontend.api.errorRate)
                          : '0%'
                        } erreurs
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Requêtes:</span>
                        <span>{systemMetrics.frontend?.api?.requestCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Temps moyen:</span>
                        <span>{systemMetrics.frontend?.api?.averageResponseTime || 0}ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Frontend */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FiTrendingUp className="text-purple-500" size={16} />
                        <span className="text-sm font-medium">Performance</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Page Load:</span>
                        <span>{systemMetrics.frontend?.pageLoad?.loadTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Session:</span>
                        <span>{Math.round((systemMetrics.frontend?.session?.duration || 0) / 1000)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pages vues:</span>
                        <span>{systemMetrics.frontend?.session?.pageViews || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Erreurs */}
                  {(systemMetrics.frontend?.errors?.total > 0 || 
                    systemMetrics.backend?.health?.issues?.length > 0) && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <FiAlertTriangle className="text-red-500" size={16} />
                        <span className="text-sm font-medium text-red-700">Problèmes détectés</span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-red-600">
                        {systemMetrics.backend?.health?.issues?.map((issue, index) => (
                          <div key={index}>• {issue}</div>
                        ))}
                        {systemMetrics.frontend?.errors?.total > 0 && (
                          <div>• {systemMetrics.frontend.errors.total} erreurs frontend</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                  Dernière mise à jour: {lastUpdate?.toLocaleTimeString()}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}