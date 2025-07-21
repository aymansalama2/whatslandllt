import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

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
    <Router>
      <AuthProvider>
        <UserProvider>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                className="fixed inset-0 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center z-50"
                exit={{ 
                  opacity: 0,
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
              >
                <div className="relative">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut" 
                    }}
                    className="absolute inset-0 bg-white rounded-full blur-xl opacity-30"
                  />
                  <motion.div
                    animate={{ 
                      scale: [1, 1.15, 1],
                      rotate: [0, 360]
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut" 
                    }}
                    className="w-20 h-20 relative z-10"
                  >
                    <img 
                      src="/WhatsApp Image 2025-07-10 à 16.19.00_31d3e4f3.jpg" 
                      alt="Logo" 
                      className="w-full h-full rounded-full border-4 border-white shadow-lg"
                    />
                  </motion.div>
                </div>
                <motion.div
                  className="absolute bottom-12 left-0 w-full flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-white font-medium text-lg tracking-wide">
                    <div className="flex items-center">
                      <span>WhatsLand</span>
                      <motion.div
                        className="ml-2 flex space-x-1"
                        animate={{
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                        <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                        <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
              >
                <div className="fixed inset-0 bg-pattern opacity-5 pointer-events-none" 
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: "60px 60px"
                  }} 
                />
                <Navbar />
                <motion.main 
                  className="pt-4 pb-10 relative z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
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
                </motion.main>
              </motion.div>
            )}
          </AnimatePresence>
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
