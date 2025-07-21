import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();

  // Show logo with delay for initial animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setMessage('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Échec de la connexion - ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      return setError('Veuillez saisir votre adresse email pour réinitialiser votre mot de passe');
    }

    try {
      setError('');
      setMessage('');
      setResetLoading(true);
      await resetPassword(email);
      setMessage('Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.');
    } catch (err) {
      setError('Échec de la réinitialisation - ' + err.message);
    } finally {
      setResetLoading(false);
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren", 
        staggerChildren: 0.2,
        duration: 0.6
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };
  
  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0, rotateY: 90 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      rotateY: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        duration: 0.8 
      } 
    }
  };
  
  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
    tap: { scale: 0.95 },
    loading: { 
      scale: [1, 1.02, 1],
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse", 
        duration: 0.8 
      } 
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div
          className="absolute w-40 h-40 bg-green-400 rounded-full opacity-20 top-20 left-20 animate-float"
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, 50, 20, -30, 0],
          }}
          transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-60 h-60 bg-blue-400 rounded-full opacity-20 bottom-10 right-10 animate-float"
          animate={{
            x: [0, -40, 30, -10, 0],
            y: [0, -30, -50, 30, 0],
          }}
          transition={{ repeat: Infinity, duration: 25, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute w-32 h-32 bg-yellow-400 rounded-full opacity-20 top-1/2 right-1/3 animate-float"
          animate={{
            x: [0, 50, -30, 20, 0],
            y: [0, -20, 40, -10, 0],
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Content */}
      <motion.div 
        className="z-10 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo and title */}
        <motion.div 
          className="sm:mx-auto sm:w-full sm:max-w-md"
          variants={itemVariants}
        >
          <motion.div 
            className="flex justify-center"
            variants={logoVariants}
            animate={showLogo ? "visible" : "hidden"}
            initial="hidden"
          >
            <div className="w-40 h-40 flex items-center justify-center p-2 bg-white rounded-full shadow-xl animate-pulse-glow">
              <motion.img 
                src="/WhatsApp Image 2025-07-10 à 16.19.00_31d3e4f3.jpg" 
                alt="Logo" 
                className="w-full h-full object-contain rounded-full"
                animate={{ 
                  rotateZ: [0, 5, 0, -5, 0],
                }}
                transition={{ 
                  duration: 10, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </div>
          </motion.div>

          <motion.h2 
            className="mt-6 text-center text-4xl font-extrabold text-gray-800 slide-in-up-delay-1"
            variants={itemVariants}
          >
            Connexion à WhatsLand
          </motion.h2>
          
          <motion.p 
            className="mt-2 text-center text-lg text-green-400 font-medium slide-in-up-delay-2"
            variants={itemVariants}
          >
            Connectivité sans frontières
          </motion.p>
        </motion.div>

        <motion.div 
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
          variants={itemVariants}
        >
          <motion.div 
            className="bg-white py-8 px-6 shadow-2xl sm:rounded-lg sm:px-10 backdrop-blur-sm bg-opacity-95 border border-white border-opacity-20 slide-in-up-delay-3"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)" }}
            transition={{ duration: 0.3 }}
          >
            {/* Alert messages */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: error ? "auto" : 0, 
                opacity: error ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-md" role="alert">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: message ? "auto" : 0, 
                opacity: message ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              {message && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-md" role="alert">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiCheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{message}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            
            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email input */}
              <motion.div
                variants={itemVariants}
                className="slide-in-up"
              >
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm input-focus-effect"
                    placeholder="exemple@email.com"
                  />
                </div>
              </motion.div>

              {/* Password input */}
              <motion.div
                variants={itemVariants}
                className="slide-in-up-delay-1"
              >
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <motion.button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-sm font-medium text-green-600 hover:text-green-500 focus:outline-none"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {resetLoading ? 'Envoi en cours...' : 'Mot de passe oublié?'}
                  </motion.button>
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm input-focus-effect"
                    placeholder="••••••••"
                  />
                </div>
              </motion.div>

              {/* Login button */}
              <motion.div
                variants={itemVariants}
                className="slide-in-up-delay-2"
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-xl text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 btn-hover-effect"
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  animate={loading ? "loading" : "idle"}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connexion...
                    </>
                  ) : "Se connecter"}
                </motion.button>
              </motion.div>
            </form>

            {/* Footer with glowing accent */}
            <motion.div 
              className="mt-6 text-center slide-in-up-delay-3"
              variants={itemVariants}
            >
              <div className="relative h-px bg-gradient-to-r from-transparent via-green-300 to-transparent my-8">
                <motion.div 
                  className="absolute w-12 h-1 bg-green-400 rounded-full top-1/2 -translate-y-1/2 blur-sm"
                  animate={{ 
                    x: ["0%", "100%", "0%"],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 4,
                    ease: "easeInOut" 
                  }}
                />
              </div>
              <p className="text-sm text-gray-600">
                Bienvenue dans notre espace connecté
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
} 