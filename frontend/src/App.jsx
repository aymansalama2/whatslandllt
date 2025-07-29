import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [loading, setLoading] = useState(true);

  // Simulate loading state to show animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
          <UserProvider>
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
          </UserProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
