import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiLock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiEye, 
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiZap,
  FiGlobe,
  FiRefreshCw,
  FiStar
} from 'react-icons/fi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear messages after delay
  useEffect(() => {
    if (error || message) {
      const timer = setTimeout(() => {
        setError('');
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, message]);

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

  const handleInputFocus = () => {
    setIsTyping(true);
  };

  const handleInputBlur = () => {
    setIsTyping(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren", 
        staggerChildren: 0.15,
        duration: 0.8
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 12,
        duration: 0.6 
      } 
    }
  };
  
  const logoVariants = {
    hidden: { scale: 0.5, opacity: 0, rotateY: 180 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      rotateY: 0,
      transition: { 
        type: "spring", 
        stiffness: 80, 
        duration: 1.2,
        delay: 0.3
      } 
    }
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0, y: 50 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8,
        delay: 0.2
      } 
    }
  };

  const backgroundParticles = Array.from({ length: 15 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 bg-white/15 rounded-full"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -30, 0],
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: 4 + Math.random() * 2,
        repeat: Infinity,
        delay: Math.random() * 3,
        ease: "easeInOut",
      }}
    />
  ));

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-emerald-800">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-emerald-600/25 to-teal-600/20" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"
            animate={{
              background: [
                "linear-gradient(45deg, #10b981, #059669, #0d9488)",
                "linear-gradient(90deg, #059669, #0d9488, #10b981)",
                "linear-gradient(135deg, #0d9488, #10b981, #059669)",
                "linear-gradient(45deg, #10b981, #059669, #0d9488)",
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {backgroundParticles}
        </div>

        {/* Geometric Shapes */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 border border-white/15 rounded-full"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        
        <motion.div
          className="absolute bottom-20 right-20 w-24 h-24 border border-white/15 rounded-lg"
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
          }}
        />

        <motion.div
          className="absolute top-1/2 left-10 w-16 h-16 bg-white/8 rounded-full backdrop-blur-sm"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Additional decorative elements */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-20 h-20 border border-emerald-400/20 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-md w-full space-y-8">
          {/* Header Section */}
          <motion.div 
            className="text-center"
            variants={itemVariants}
          >
            {/* Logo */}
            <motion.div 
              className="flex justify-center mb-8"
              variants={logoVariants}
            >
              <div className="relative">
                <motion.div 
                  className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex items-center justify-center"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.25)"
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(16, 185, 129, 0.3)",
                      "0 0 30px rgba(16, 185, 129, 0.5)",
                      "0 0 20px rgba(16, 185, 129, 0.3)",
                    ],
                  }}
                  transition={{
                    boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  <motion.img 
                    src="/WhatsApp Image 2025-07-10 à 16.19.00_31d3e4f3.jpg" 
                    alt="WhatsLand Logo" 
                    className="w-16 h-16 object-contain rounded-2xl"
                    animate={{ 
                      rotate: [0, 5, 0, -5, 0],
                    }}
                    transition={{ 
                      duration: 8, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                </motion.div>
                
                {/* Floating Icons */}
                <motion.div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                  animate={{
                    y: [0, -5, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 5, repeat: Infinity, ease: "linear" },
                  }}
                >
                  <FiZap className="text-white" size={14} />
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, -180, -360],
                  }}
                  transition={{
                    scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 },
                    rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                  }}
                >
                  <FiStar className="text-white" size={10} />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-white via-green-100 to-emerald-100 bg-clip-text text-transparent">
                WhatsLand
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg text-white/80 mb-2"
              variants={itemVariants}
            >
              Connectivité sans frontières
            </motion.p>

           
          </motion.div>

          {/* Login Card */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8"
            variants={cardVariants}
            whileHover={{ 
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              borderColor: "rgba(255, 255, 255, 0.3)"
            }}
          >
            {/* Status Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="mb-6"
                >
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiAlertCircle className="h-5 w-5 text-red-300" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-100">{error}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="mb-6"
                >
                  <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiCheckCircle className="h-5 w-5 text-green-300" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-100">{message}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Input */}
              <motion.div
                variants={itemVariants}
              >
                <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className={`h-5 w-5 transition-colors duration-200 ${
                      isTyping ? 'text-green-400' : 'text-white/50'
                    }`} />
                  </div>
                  <motion.input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-200"
                    placeholder="exemple@email.com"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)"
                    }}
                  />
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div
                variants={itemVariants}
              >
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-white/90">
                    Mot de passe
                  </label>
                  <motion.button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-sm font-medium text-green-300 hover:text-green-200 focus:outline-none transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {resetLoading ? (
                      <div className="flex items-center space-x-2">
                        <FiRefreshCw className="animate-spin" size={14} />
                        <span>Envoi...</span>
                      </div>
                    ) : (
                      'Mot de passe oublié?'
                    )}
                  </motion.button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className={`h-5 w-5 transition-colors duration-200 ${
                      isTyping ? 'text-green-400' : 'text-white/50'
                    }`} />
                  </div>
                  <motion.input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-200"
                    placeholder="••••••••"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white/80 transition-colors duration-200"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </motion.div>

              {/* Login Button */}
              <motion.div
                variants={itemVariants}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-semibold py-4 px-6 rounded-2xl shadow-xl disabled:opacity-50 transition-all duration-200"
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 20px 40px -12px rgba(16, 185, 129, 0.4)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  animate={loading ? {
                    background: [
                      "linear-gradient(45deg, #10b981, #059669, #0d9488)",
                      "linear-gradient(90deg, #059669, #0d9488, #10b981)",
                      "linear-gradient(135deg, #0d9488, #10b981, #059669)",
                      "linear-gradient(45deg, #10b981, #059669, #0d9488)",
                    ],
                  } : {}}
                  transition={loading ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  } : {}}
                >
                  <div className="flex items-center justify-center space-x-3">
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <FiRefreshCw size={20} />
                        </motion.div>
                        <span>Connexion en cours...</span>
                      </>
                    ) : (
                      <>
                        <FiShield size={20} />
                        <span>Se connecter</span>
                        <FiArrowRight size={20} />
                      </>
                    )}
                  </div>
                  
                  {/* Animated Background Overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.button>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div 
              className="mt-8 text-center"
              variants={itemVariants}
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/5 backdrop-blur-sm text-white/60 rounded-full">
                    Bienvenue dans notre espace connecté
                  </span>
                </div>
              </div>
              
              {/* Feature Icons */}
              <motion.div 
                className="flex justify-center space-x-6 mt-6"
                variants={itemVariants}
              >
                {[
                  { icon: FiShield, label: "Sécurisé" },
                  { icon: FiZap, label: "Rapide" },
                  { icon: FiGlobe, label: "Global" }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    className="flex flex-col items-center space-y-2"
                    whileHover={{ scale: 1.1, y: -2 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                      <feature.icon className="text-white/70" size={16} />
                    </div>
                    <span className="text-xs text-white/50">{feature.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 