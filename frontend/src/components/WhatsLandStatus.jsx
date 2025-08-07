import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, SOCKET_CONFIG } from '../config/apiConfig';
import { 
  FiCheck, 
  FiX, 
  FiWifi, 
  FiWifiOff, 
  FiRefreshCw, 
  FiSmartphone, 
  FiSquare, 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiLoader, 
  FiZap, 
  FiSettings,
  FiInfo
} from 'react-icons/fi';

export default function WhatsLandStatus() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('loading');
  const [statusMessage, setStatusMessage] = useState('Initialisation de WhatsApp...');
  const [qrCode, setQrCode] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setStatus('error');
      setStatusMessage('Utilisateur non authentifié');
      return;
    }

    // Configuration Socket.IO avec authentification Firebase
    const newSocket = io(API_URL, {
      ...SOCKET_CONFIG,
      transports: ['websocket', 'polling'],
      withCredentials: false
    });

    // Authentification Firebase via Socket.IO
    currentUser.getIdToken().then(token => {
      newSocket.emit('firebase_auth', token);
      initializeWhatsAppSession();
    });

    // Listeners Socket.IO simplifiés
    newSocket.on('qr', (qrCode) => {
      console.log('📱 QR Code reçu via Socket.IO:', qrCode ? 'Oui' : 'Non');
      setQrCode(qrCode);
      setStatus('qr');
      setStatusMessage('Scannez le QR code avec WhatsApp');
    });

    newSocket.on('ready', () => {
      setStatus('connected');
      setStatusMessage('WhatsApp connecté');
      setQrCode('');
    });

    newSocket.on('authenticated', () => {
      setStatus('connected');
      setStatusMessage('WhatsApp connecté');
      setQrCode('');
    });

    newSocket.on('disconnected', () => {
      if (status === 'connected') {
        setStatus('loading');
        setStatusMessage('Reconnexion en cours...');
        initializeWhatsAppSession();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Vérifier s'il existe une session existante
  const checkExistingSession = async () => {
    if (!currentUser) return null;
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/api/firebase/check-session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ Erreur vérification session:', error);
      return null;
    }
  };

  // Initialiser la session WhatsApp Firebase
  const initializeWhatsAppSession = async () => {
    if (!currentUser) return;
    
    try {
      setStatus('checking');
      setStatusMessage('Vérification de votre session existante...');
      
      // D'abord, vérifier s'il existe une session
      const existingSession = await checkExistingSession();
      
      if (existingSession && existingSession.hasSession) {
        console.log('🔍 Session existante trouvée:', existingSession);
        
        // Si la session est valide et prête, la réutiliser
        if (existingSession.isValid && (existingSession.status === 'ready' || existingSession.status === 'authenticated')) {
          console.log('✅ Réutilisation de la session existante');
          setStatus(existingSession.status);
          setStatusMessage('Session WhatsApp active réutilisée');
          if (existingSession.qrcode) {
            setQrCode(existingSession.qrcode);
          }
          checkFirebaseStatus();
          return;
        }
        
        // Si la session existe mais n'est pas valide, informer l'utilisateur
        if (!existingSession.isValid && existingSession.status !== 'ready') {
          console.log('⚠️ Session existante mais non active, nouvelle initialisation...');
          setStatusMessage('Session trouvée mais inactive, reconnexion...');
        }
      } else {
        console.log('🆕 Aucune session existante, création d\'une nouvelle...');
        setStatusMessage('Création d\'une nouvelle session WhatsApp...');
      }
      
      setStatus('initializing');
      setStatusMessage('Initialisation de votre session WhatsApp...');
      
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/api/firebase/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Session WhatsApp Firebase initialisée:', data);
        if (data.status === 'ready' || data.status === 'authenticated') {
          setStatusMessage('Session WhatsApp prête');
        } else {
          setStatusMessage('Session en cours d\'initialisation');
        }
        checkFirebaseStatus();
      } else {
        setStatus('error');
        setStatusMessage(data.message || 'Erreur lors de l\'initialisation');
      }
      
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase:', error);
      setStatus('error');
      setStatusMessage('Erreur lors de l\'initialisation de votre session');
    }
  };

  // Déconnecter explicitement la session WhatsApp
  const disconnectWhatsAppSession = async () => {
    if (!currentUser) return;
    
    try {
      setStatus('disconnecting');
      setStatusMessage('Déconnexion de votre session WhatsApp...');
      
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/api/firebase/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Session WhatsApp déconnectée:', data);
        setStatus('disconnected');
        setStatusMessage('Session WhatsApp déconnectée');
        setQrCode(null);
      } else {
        setStatus('error');
        setStatusMessage(data.message || 'Erreur lors de la déconnexion');
      }
      
    } catch (error) {
      console.error('❌ Erreur déconnexion Firebase:', error);
      setStatus('error');
      setStatusMessage('Erreur lors de la déconnexion');
    }
  };

  // Vérifier le statut Firebase spécifique à l'utilisateur
  const checkFirebaseStatus = async () => {
    if (!currentUser) return;
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/api/firebase/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 429) {
        const errorData = await response.json();
        console.warn('⚠️ Rate limiting détecté:', errorData);
        setStatus('error');
        setStatusMessage(`Trop de requêtes: ${errorData.error}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        const session = data.session;
        if (session.status === 'ready') {
          setStatus('connected');
          setStatusMessage('WhatsLand est connecté et prêt!');
          setConnectionTime(new Date().toLocaleTimeString());
          setQrCode('');
        } else if (session.qrCode) {
          setStatus('qr');
          setStatusMessage('Scannez le QR code avec votre téléphone WhatsApp');
          setQrCode(session.qrCode);
        } else if (session.status === 'initializing') {
          setStatus('initializing');
          setStatusMessage('Initialisation en cours...');
        } else {
          setStatus('disconnected');
          setStatusMessage('WhatsApp Web n\'est pas connecté');
          setQrCode('');
        }
      } else {
        setStatus('error');
        setStatusMessage(data.message || 'Erreur lors de la vérification du statut');
      }
      
    } catch (error) {
      console.error('❌ Erreur vérification statut Firebase:', error);
      setStatus('error');
      setStatusMessage('Erreur de connexion au serveur');
    }
  };



  const handleReconnect = async () => {
    if (!currentUser) {
      setStatus('error');
      setStatusMessage('Utilisateur non authentifié');
      return;
    }

    setStatus('connecting');
    setStatusMessage('Réinitialisation de votre session en cours...');
    
    try {
      // Réinitialiser la session WhatsApp de l'utilisateur
      await initializeWhatsAppSession();
      
    } catch (error) {
      console.log('❌ Erreur lors de la reconnexion Firebase:', error);
      setStatus('error');
      setStatusMessage('Erreur lors de la réinitialisation de votre session');
    }
  };

  const handleReset = async () => {
    if (!currentUser) {
      setStatus('error');
      setStatusMessage('Utilisateur non authentifié');
      return;
    }

    setStatus('initializing');
    setStatusMessage('Réinitialisation complète de votre session en cours...');
    
    try {
      // Réinitialiser complètement la session de l'utilisateur
      await initializeWhatsAppSession();
      
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation Firebase:', error);
      setStatus('error');
      setStatusMessage('Erreur lors de la réinitialisation complète');
    }
  };

  // Attendre automatiquement un nouveau QR code
  useEffect(() => {
    let checkInterval;
    
    if (status === 'qr' && !qrCode) {
      setStatus('loading');
      setStatusMessage('Génération du QR code en cours...');
      
      checkInterval = setInterval(() => {
        checkFirebaseStatus()
          .then(() => {
            if (status === 'qr' && qrCode) {
              clearInterval(checkInterval);
            } else if (status === 'connected') {
              clearInterval(checkInterval);
            }
          })
          .catch((error) => {
            console.error('Erreur lors de la vérification du statut Firebase:', error);
            setStatus('error');
            setStatusMessage('Erreur de connexion au serveur');
            clearInterval(checkInterval);
          });
      }, 5000); // Augmenté à 5 secondes pour éviter le rate limiting
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [status]);

  // Fonction pour obtenir l'icône en fonction du statut
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return FiCheckCircle;
      case 'error':
      case 'disconnected':
        return FiWifiOff;
      case 'qr':
        return FiSquare;
      case 'connecting':
      case 'initializing':
      case 'checking':
        return FiLoader;
      case 'disconnecting':
        return FiWifiOff;
      default:
        return FiClock;
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return {
          color: 'teal',
          bgGradient: 'from-teal-400/90 to-emerald-500/90',
          cardBg: 'from-teal-50/80 to-emerald-50/80',
          borderColor: 'border-teal-100',
          textColor: 'text-teal-900',
          iconColor: 'text-teal-600',
          pulseColor: 'bg-teal-300/70'
        };
      case 'error':
      case 'disconnected':
        return {
          color: 'rose',
          bgGradient: 'from-rose-400/90 to-red-500/90',
          cardBg: 'from-rose-50/80 to-red-50/80',
          borderColor: 'border-rose-100',
          textColor: 'text-rose-900',
          iconColor: 'text-rose-600',
          pulseColor: 'bg-rose-300/70'
        };
      case 'qr':
        return {
          color: 'sky',
          bgGradient: 'from-sky-400/90 to-blue-500/90',
          cardBg: 'from-sky-50/80 to-blue-50/80',
          borderColor: 'border-sky-100',
          textColor: 'text-sky-900',
          iconColor: 'text-sky-600',
          pulseColor: 'bg-sky-300/70'
        };
      case 'checking':
      case 'disconnecting':
        return {
          color: 'violet',
          bgGradient: 'from-violet-400/90 to-purple-500/90',
          cardBg: 'from-violet-50/80 to-purple-50/80',
          borderColor: 'border-violet-100',
          textColor: 'text-violet-900',
          iconColor: 'text-violet-600',
          pulseColor: 'bg-violet-300/70'
        };
      default:
        return {
          color: 'amber',
          bgGradient: 'from-amber-400/90 to-orange-500/90',
          cardBg: 'from-amber-50/80 to-orange-50/80',
          borderColor: 'border-amber-100',
          textColor: 'text-amber-900',
          iconColor: 'text-amber-600',
          pulseColor: 'bg-amber-300/70'
        };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const loadingCircleVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const successVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = getStatusIcon();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex flex-col items-center justify-center min-h-[400px] p-4 relative"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-sky-50 opacity-50" />

        {/* Loading Animation */}
        {(!qrCode && status !== 'connected') && (
          <motion.div
            variants={itemVariants}
            className="text-center relative backdrop-blur-sm bg-white/30 p-8 rounded-3xl shadow-xl border border-white/50"
          >
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Outer rotating circle */}
              <motion.div 
                className="absolute inset-0 border-4 border-blue-200 rounded-full"
                variants={loadingCircleVariants}
                animate="animate"
              />
              
              {/* Inner pulse circle */}
              <motion.div 
                className="absolute inset-2 bg-blue-100 rounded-full"
                variants={pulseVariants}
                animate="animate"
              />
              
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <FiLoader className="text-blue-600 animate-spin" size={40} />
              </div>
              
              {/* Orbiting dots */}
              <motion.div 
                className="absolute w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg"
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  top: "0%",
                  left: "50%",
                  transform: "translateX(-50%)"
                }}
              />
              <motion.div 
                className="absolute w-3 h-3 bg-gradient-to-r from-sky-400 to-blue-400 rounded-full shadow-lg"
                animate={{
                  rotate: -360,
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  bottom: "10%",
                  right: "0%"
                }}
              />
            </div>
            
            <motion.h3 
              className="text-2xl font-bold text-gray-800 mb-3"
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {statusMessage}
            </motion.h3>
            
            <div className="w-72 mx-auto bg-white/50 rounded-full h-2 overflow-hidden p-[1px]">
              <motion.div 
                className="h-full w-full bg-gradient-to-r from-blue-400 to-sky-500 rounded-full"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </motion.div>
        )}

        {/* QR Code */}
        {qrCode && status !== 'connected' && (
          <motion.div
            variants={itemVariants}
            className="relative backdrop-blur-sm bg-white/80 p-8 rounded-3xl shadow-xl border border-white/50"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-sky-400/5 to-blue-400/5 rounded-3xl"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl"
              >
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-72 h-72 mx-auto filter contrast-125"
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-transparent to-blue-500/10"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
              
              <motion.div 
                className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <FiZap className="text-white drop-shadow-lg" size={20} />
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Scannez le QR code avec WhatsApp
              </h3>
              <p className="text-sm text-gray-600">
                Ouvrez WhatsApp sur votre téléphone et scannez ce code
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Connected State */}
        {status === 'connected' && (
          <motion.div
            variants={itemVariants}
            className="text-center backdrop-blur-sm bg-white/30 p-8 rounded-3xl shadow-xl border border-white/50"
          >
            <motion.div
              variants={successVariants}
              className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <FiCheck className="text-white drop-shadow" size={48} />
            </motion.div>
            
            <motion.h3 
              className="text-2xl font-bold text-gray-800 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              WhatsApp connecté
            </motion.h3>
            
            <motion.p
              className="text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Vous pouvez maintenant envoyer des messages
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
} 