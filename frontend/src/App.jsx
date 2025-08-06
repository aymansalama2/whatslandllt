import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import SystemHealth from './components/SystemHealth';
import BackendStatusNotification from './components/BackendStatusNotification';
import { initializeFrontendServices, checkFrontendHealth } from './services/index';
import { getEnvironment, isLocalhost } from './config/apiConfig';
import backendStatusService from './services/backendStatusService';
import apiService from './services/apiService';

function App() {
  const [loading, setLoading] = useState(true);
  const [servicesReady, setServicesReady] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [showSystemHealth, setShowSystemHealth] = useState(false);

  // Marquer le temps de démarrage
  if (!window.appStartTime) {
    window.appStartTime = Date.now();
  }

  // Initialiser les services frontend
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initialisation de l\'application WhatsLand...');
        
        // Initialiser les services frontend
        const servicesResult = await initializeFrontendServices();
        
        if (servicesResult.success) {
          console.log('✅ Services frontend prêts');
          setServicesReady(true);
          
          // Démarrer la surveillance du backend
          backendStatusService.startMonitoring(apiService);
          
          // Vérifier la santé système initial
          const health = await checkFrontendHealth();
          setSystemHealth(health);
          
          // Afficher SystemHealth en développement ou si localhost
          if (getEnvironment() === 'development' || isLocalhost()) {
            setShowSystemHealth(true);
          }
        } else {
          console.error('❌ Échec initialisation services:', servicesResult.error);
          // Continuer même si les services échouent
          setServicesReady(false);
        }
        
      } catch (error) {
        console.error('❌ Erreur initialisation app:', error);
        setServicesReady(false);
      } finally {
        // Délai minimum pour l'animation de chargement ou fin des services
        const minLoadingTime = 800; // 800ms minimum pour l'animation
        const currentTime = Date.now();
        const elapsedTime = currentTime - (window.appStartTime || currentTime);
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      }
    };

    initializeApp();
  }, []);

  // Écouteurs d'événements pour le statut des services
  useEffect(() => {
    const handleServicesReady = (event) => {
      console.log('✅ Services prêts:', event.detail);
      setServicesReady(true);
    };

    const handleServicesError = (event) => {
      console.error('❌ Erreur services:', event.detail);
      setServicesReady(false);
    };

    const handleHealthUpdate = async () => {
      try {
        const health = await checkFrontendHealth();
        setSystemHealth(health);
      } catch (error) {
        console.error('❌ Erreur vérification santé:', error);
      }
    };

    // Écouteurs d'événements
    window.addEventListener('frontend-services-ready', handleServicesReady);
    window.addEventListener('frontend-services-error', handleServicesError);
    
    // Vérification périodique de la santé (en développement uniquement)
    let healthInterval;
    if (getEnvironment() === 'development') {
      healthInterval = setInterval(handleHealthUpdate, 60000); // Toutes les minutes
    }

    return () => {
      window.removeEventListener('frontend-services-ready', handleServicesReady);
      window.removeEventListener('frontend-services-error', handleServicesError);
      if (healthInterval) {
        clearInterval(healthInterval);
      }
    };
  }, []);

  // Gestion des raccourcis clavier pour le développement
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + Shift + H pour toggle SystemHealth
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        setShowSystemHealth(prev => !prev);
        console.log('🔧 SystemHealth toggled:', !showSystemHealth);
      }
      
      // Ctrl/Cmd + Shift + D pour diagnostic complet
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        import('./services/index').then(({ runFrontendDiagnostics }) => {
          runFrontendDiagnostics().then(diagnostics => {
            console.table(diagnostics);
            console.log('🔍 Diagnostic complet:', diagnostics);
          });
        });
      }
    };

    if (getEnvironment() === 'development') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSystemHealth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-green-50 relative overflow-hidden">
      {/* Global Background Pattern */}
      <div className="fixed inset-0 z-0">
        {/* Animated gradient mesh */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(5, 150, 105, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(13, 148, 136, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 60% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 60%, rgba(5, 150, 105, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(13, 148, 136, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 60%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(5, 150, 105, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(13, 148, 136, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(5, 150, 105, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(13, 148, 136, 0.1) 0%, transparent 50%)"
            ]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Floating particles */}
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-300/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Geometric shapes */}
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 border border-green-200/30 rounded-full"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        <motion.div
          className="absolute bottom-32 left-20 w-24 h-24 border border-emerald-200/30 rounded-lg"
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 },
          }}
        />
      </div>

      <Router>
        <AuthProvider>
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loader"
                    className="fixed inset-0 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center z-50"
                    exit={{ 
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.5, ease: "easeOut" }
                    }}
                  >
                    {/* Loading background pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          background: [
                            "radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)"
                          ]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </div>

                    <div className="relative">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut" 
                        }}
                        className="absolute inset-0 bg-white/30 rounded-full blur-2xl"
                      />
                      <motion.div
                        animate={{ 
                          scale: [1, 1.15, 1],
                          rotate: [0, 360]
                        }}
                        transition={{ 
                          repeat: Infinity,
                          duration: 3,
                          ease: "easeInOut" 
                        }}
                        className="w-24 h-24 relative z-10"
                      >
                        <div className="w-full h-full bg-white/90 backdrop-blur-sm rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                          <motion.span 
                            className="text-green-600 font-bold text-3xl"
                            animate={{
                              scale: [1, 1.1, 1]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            W
                          </motion.span>
                        </div>
                      </motion.div>
                    </div>
                    
                    <motion.div
                      className="absolute bottom-16 left-0 w-full flex justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                    >
                      <div className="text-white font-semibold text-xl tracking-wide">
                        <div className="flex items-center">
                          <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                            WhatsLand
                          </span>
                          <motion.div
                            className="ml-3 flex space-x-1"
                            animate={{
                              opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                              duration: 1.8,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </motion.div>
                        </div>
                        <motion.p 
                          className="text-center text-white/80 text-sm mt-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                        >
                          Connectivité sans frontières
                        </motion.p>
                        
                        {/* Indicateur de statut des services */}
                        <motion.div 
                          className="flex items-center justify-center space-x-2 mt-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 }}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            servicesReady ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <span className="text-white/70 text-xs">
                            Services {servicesReady ? 'actifs' : 'en cours...'}
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="min-h-screen"
                  >
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route
                        path="/dashboard/*"
                        element={
                          <PrivateRoute>
                            <Dashboard />
                          </PrivateRoute>
                        }
                      />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </AuthProvider>
      </Router>
      
      {/* Composant SystemHealth (affiché selon les conditions) */}
      {showSystemHealth && (
        <SystemHealth 
          compact={true} 
          autoRefresh={true}
        />
      )}

      {/* Notification de statut des services en cas d'erreur */}
      {!servicesReady && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Services en mode dégradé
            </span>
          </div>
        </motion.div>
      )}

      {/* Notification de statut du backend */}
      <BackendStatusNotification />

      {/* Notification de santé système en cas de problème */}
      {systemHealth && systemHealth.overall !== 'healthy' && !showSystemHealth && (
        <motion.button
          onClick={() => setShowSystemHealth(true)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span className="text-sm font-medium">
              Problèmes système détectés
            </span>
          </div>
        </motion.button>
      )}
    </div>
  );
}

export default App;
