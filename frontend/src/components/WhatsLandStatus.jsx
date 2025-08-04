import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function WhatsLandStatus() {
  const [status, setStatus] = useState('loading');
  const [statusMessage, setStatusMessage] = useState('Vérification du statut...');
  const [qrCode, setQrCode] = useState('');
  const [connectionTime, setConnectionTime] = useState(null);

  useEffect(() => {
    checkStatus();
    
    // Configuration Socket.IO
    const socket = io(API_URL, {
      transports: ['polling'],
      withCredentials: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    // Listeners Socket.IO pour la réactivité en temps réel
    socket.on('qr', (qrCode) => {
      console.log('✅ Nouveau QR Code reçu via Socket.IO');
      setQrCode(qrCode);
      setStatus('qr');
      setStatusMessage('Nouveau QR code disponible. Scannez-le avec WhatsApp sur votre téléphone');
    });

    socket.on('ready', () => {
      console.log('✅ WhatsApp connecté via Socket.IO');
      setStatus('connected');
      setStatusMessage('WhatsApp Web est connecté et opérationnel');
      setConnectionTime(new Date().toLocaleTimeString());
      setQrCode('');
    });

    socket.on('authenticated', () => {
      console.log('✅ WhatsApp authentifié via Socket.IO');
      setStatus('connected');
      setStatusMessage('WhatsApp Web est authentifié et prêt');
    });

    socket.on('disconnected', (data) => {
      console.log('❌ WhatsApp déconnecté via Socket.IO:', data);
      setStatus('disconnected');
      setStatusMessage('Connexion perdue avec WhatsApp Web');
      setQrCode('');
    });

    socket.on('error', (error) => {
      console.error('❌ Erreur Socket.IO:', error);
      setStatus('error');
      setStatusMessage(error.message || 'Erreur de connexion');
    });

    socket.on('status_update', (data) => {
      console.log('📡 Mise à jour du statut:', data);
      if (data.status === 'initializing') {
        setStatus('initializing');
        setStatusMessage(data.message || 'Initialisation en cours...');
      } else if (data.status === 'resetting') {
        setStatus('initializing');
        setStatusMessage(data.message || 'Réinitialisation en cours...');
      } else if (data.status === 'reconnecting') {
        setStatus('connecting');
        setStatusMessage(data.message || 'Reconnexion en cours...');
      }
    });

    // Fallback avec polling HTTP (au cas où Socket.IO échoue)
    const interval = setInterval(checkStatus, 30000); // Augmenté à 30 secondes pour éviter le rate limiting

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`);
      
      // Vérifier si on a une erreur de rate limiting
      if (response.status === 429) {
        const errorData = await response.json();
        console.warn('⚠️ Rate limiting détecté:', errorData);
        setStatus('error');
        setStatusMessage(`Trop de requêtes: ${errorData.error}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.whatsappReady) {
        setStatus('connected');
        setStatusMessage('WhatsApp Web est connecté et opérationnel');
        setConnectionTime(new Date().toLocaleTimeString());
        setQrCode('');
      } else if (data.qrcode) {
        setStatus('qr');
        setStatusMessage('Scannez le QR code avec votre téléphone WhatsApp');
        setQrCode(data.qrcode);
      } else if (data.error) {
        setStatus('error');
        setStatusMessage(data.error);
        setQrCode('');
      } else {
        setStatus('disconnected');
        setStatusMessage('WhatsApp Web n\'est pas connecté');
        setQrCode('');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      setStatus('error');
      setStatusMessage('Erreur de connexion au serveur');
      setQrCode('');
    }
  };

  const handleReconnect = async () => {
    setStatus('connecting');
    setStatusMessage('Reconnexion en cours...');
    try {
      const response = await fetch(`${API_URL}/api/reconnect`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Reconnexion démarrée:', result.message);
        setStatusMessage('Reconnexion démarrée avec succès...');
        setTimeout(checkStatus, 3000);
      } else {
        throw new Error(result.message || 'Erreur lors de la reconnexion');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la reconnexion:', error);
      setStatus('error');
      setStatusMessage(`Erreur lors de la reconnexion: ${error.message}`);
    }
  };

  const handleReset = async () => {
    setStatus('initializing');
    setStatusMessage('Réinitialisation complète en cours...');
    try {
      const response = await fetch(`${API_URL}/api/reset`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Réinitialisation démarrée:', result.message);
        setStatusMessage('Réinitialisation complète démarrée...');
        setTimeout(checkStatus, 5000); // Plus de temps pour la réinitialisation complète
      } else {
        throw new Error(result.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
      setStatus('error');
      setStatusMessage(`Erreur lors de la réinitialisation: ${error.message}`);
    }
  };

  // Attendre automatiquement un nouveau QR code
  useEffect(() => {
    let checkInterval;
    
    if (status === 'qr' && !qrCode) {
      setStatus('loading');
      setStatusMessage('Génération du QR code en cours...');
      
      checkInterval = setInterval(() => {
        fetch(`${API_URL}/api/status`)
          .then(res => res.json())
          .then(data => {
            if (data.qrcode) {
              setQrCode(data.qrcode);
              setStatus('qr');
              setStatusMessage('Nouveau QR code disponible. Scannez-le avec WhatsApp sur votre téléphone');
              clearInterval(checkInterval);
            } else if (data.whatsappReady) {
              setStatus('connected');
              setStatusMessage('WhatsApp Web est connecté et opérationnel');
              clearInterval(checkInterval);
            }
          })
          .catch((error) => {
            console.error('Erreur lors de la vérification du statut:', error);
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
        return FiLoader;
      default:
        return FiClock;
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return {
          color: 'green',
          bgGradient: 'from-green-500 via-green-600 to-emerald-700',
          cardBg: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          pulseColor: 'bg-green-400'
        };
      case 'error':
      case 'disconnected':
        return {
          color: 'red',
          bgGradient: 'from-red-500 via-red-600 to-rose-700',
          cardBg: 'from-red-50 to-rose-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          pulseColor: 'bg-red-400'
        };
      case 'qr':
        return {
          color: 'blue',
          bgGradient: 'from-blue-500 via-blue-600 to-indigo-700',
          cardBg: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          pulseColor: 'bg-blue-400'
        };
      default:
        return {
          color: 'yellow',
          bgGradient: 'from-yellow-500 via-yellow-600 to-orange-700',
          cardBg: 'from-yellow-50 to-orange-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          pulseColor: 'bg-yellow-400'
        };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = getStatusIcon();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6 lg:space-y-8"
    >
      {/* Header Card - Responsive */}
      <motion.div
        variants={itemVariants}
        className={`relative bg-gradient-to-br ${statusConfig.bgGradient} rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 overflow-hidden shadow-2xl`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white rounded-full transform translate-x-16 sm:translate-x-24 lg:translate-x-32 -translate-y-16 sm:-translate-y-24 lg:-translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-white rounded-full transform -translate-x-12 sm:-translate-x-18 lg:-translate-x-24 translate-y-12 sm:translate-y-18 lg:translate-y-24"></div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
                <StatusIcon className="text-white" size={window.innerWidth < 640 ? 28 : window.innerWidth < 1024 ? 32 : 36} />
              </div>
              {/* Status indicator pulse */}
              <div className={`absolute -top-1 -right-1 w-6 h-6 ${statusConfig.pulseColor} rounded-full animate-pulse`}></div>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Statut WhatsLand</h1>
              <p className="text-sm sm:text-base lg:text-lg text-white/90 max-w-md">
                {statusMessage}
              </p>
              {connectionTime && (
                <p className="text-xs sm:text-sm text-white/70">
                  Connecté à {connectionTime}
                </p>
              )}
            </div>
          </div>

          {/* Status indicator - Hidden on mobile to save space */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className={`w-3 h-3 lg:w-4 lg:h-4 ${statusConfig.pulseColor} rounded-full animate-pulse`}></div>
            <span className="text-white/90 text-sm lg:text-base font-medium">
              {status === 'connected' ? 'En ligne' : 
               status === 'qr' ? 'QR Code' : 
               status === 'error' ? 'Erreur' : 'Hors ligne'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Status Details Card - Responsive */}
      <motion.div
        variants={itemVariants}
        className={`bg-gradient-to-br ${statusConfig.cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border ${statusConfig.borderColor} shadow-xl`}
      >
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-2 ${statusConfig.borderColor}`}>
            <StatusIcon className={statusConfig.iconColor} size={window.innerWidth < 640 ? 24 : 28} />
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold ${statusConfig.textColor} mb-1 sm:mb-2`}>
              État de la connexion
            </h3>
            <p className={`${statusConfig.textColor} opacity-80 text-sm sm:text-base`}>
              {statusMessage}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Instructions Section - Responsive */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/30"
        >
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <FiInfo className="mr-2 sm:mr-3 text-blue-600" size={window.innerWidth < 640 ? 20 : 24} />
            Instructions
          </h3>

          {status === 'connected' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FiCheck className="text-green-600" size={window.innerWidth < 640 ? 14 : 16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">WhatsApp connecté</h4>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    Vous pouvez maintenant envoyer des messages via l'onglet "Envoi de messages".
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FiZap className="text-blue-600" size={window.innerWidth < 640 ? 14 : 16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Prêt à l'emploi</h4>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    Toutes les fonctionnalités sont disponibles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'qr' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-bold text-xs sm:text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Ouvrez WhatsApp sur votre téléphone</h4>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    Lancez l'application WhatsApp sur votre smartphone.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-bold text-xs sm:text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Accédez aux appareils liés</h4>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    Tapez sur Menu (⋮) puis "Appareils liés".
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-bold text-xs sm:text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Scannez le QR code</h4>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    Tapez sur "Lier un appareil" et scannez le QR code ci-dessous.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(status === 'disconnected' || status === 'error') && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FiAlertCircle className="text-red-600" size={window.innerWidth < 640 ? 14 : 16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Connexion perdue</h4>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    La connexion avec WhatsApp Web a été interrompue.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FiRefreshCw className="text-yellow-600" size={window.innerWidth < 640 ? 14 : 16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Action requise</h4>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    Cliquez sur "Réessayer" ou "Réinitialiser" pour rétablir la connexion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FiLoader className="text-yellow-600 animate-spin" size={window.innerWidth < 640 ? 14 : 16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Vérification en cours</h4>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    Nous vérifions l'état de la connexion WhatsApp...
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* QR Code Section - Responsive */}
      {qrCode && (
        <motion.div
          variants={itemVariants}
          className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/30"
        >
          <div className="text-center">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 flex items-center justify-center">
              <FiSquare className="mr-2 sm:mr-3 text-blue-600" size={window.innerWidth < 640 ? 20 : 24} />
              QR Code WhatsApp
            </h3>
            
            <div className="relative inline-block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200"
              >
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 mx-auto"
                />
                
                {/* Small zap icon */}
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <FiZap className="text-white" size={window.innerWidth < 640 ? 12 : 16} />
                </div>
              </motion.div>
            </div>
            
            <p className="text-gray-600 text-xs sm:text-sm mt-3 sm:mt-4 max-w-md mx-auto">
              ⚠️ Ce QR code expire après quelques minutes. Si la connexion échoue, actualisez la page.
            </p>
          </div>
        </motion.div>
      )}

      {/* Loading state for QR generation - Responsive */}
      {(status === 'qr' && !qrCode) || status === 'loading' || status === 'initializing' || status === 'connecting' ? (
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl border border-white/30"
        >
          <div className="text-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6">
              {/* Cercle de chargement principal */}
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FiLoader className="text-blue-600 animate-spin" size={window.innerWidth < 640 ? 28 : window.innerWidth < 1024 ? 32 : 36} />
              </div>
              {/* Cercles animés */}
              <motion.div 
                className="absolute w-4 h-4 bg-blue-500 rounded-full"
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
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
                className="absolute w-3 h-3 bg-blue-400 rounded-full"
                animate={{
                  rotate: -360,
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  bottom: "10%",
                  right: "0%"
                }}
              />
            </div>
            
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
              {status === 'qr' ? 'Génération du QR Code' :
               status === 'initializing' ? 'Initialisation de WhatsApp' :
               status === 'connecting' ? 'Connexion en cours' :
               'Chargement en cours'}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
              {statusMessage}
            </p>
            
            {/* Progress bar améliorée */}
            <div className="w-full max-w-xs sm:max-w-sm mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div 
                className="bg-blue-500 h-full rounded-full"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
            
            {/* Message d'aide */}
            <p className="text-gray-500 text-xs sm:text-sm mt-4">
              Cette opération peut prendre quelques instants...
            </p>
          </div>
        </motion.div>
      ) : null}

      {/* Action Buttons - Responsive */}
      {(status === 'error' || status === 'disconnected') && (
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <motion.button
            onClick={handleReconnect}
            disabled={status === 'connecting'}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3"
            whileHover={{ scale: status !== 'connecting' ? 1.02 : 1 }}
            whileTap={{ scale: status !== 'connecting' ? 0.98 : 1 }}
          >
            <FiRefreshCw className={status === 'connecting' ? 'animate-spin' : ''} size={window.innerWidth < 640 ? 16 : 20} />
            <span className="text-sm sm:text-base">
              {status === 'connecting' ? 'Reconnexion...' : 'Réessayer'}
            </span>
          </motion.button>
          
          <motion.button
            onClick={handleReset}
            disabled={status === 'initializing'}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3"
            whileHover={{ scale: status !== 'initializing' ? 1.02 : 1 }}
            whileTap={{ scale: status !== 'initializing' ? 0.98 : 1 }}
          >
            <FiSettings className={status === 'initializing' ? 'animate-spin' : ''} size={window.innerWidth < 640 ? 16 : 20} />
            <span className="text-sm sm:text-base">
              {status === 'initializing' ? 'Réinitialisation...' : 'Réinitialiser'}
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* Bouton Vérifier la connexion pour les autres états */}
      {(status === 'loading' || (status !== 'connected' && status !== 'qr' && status !== 'error' && status !== 'disconnected' && status !== 'connecting' && status !== 'initializing')) && (
        <motion.div
          variants={itemVariants}
          className="flex justify-center"
        >
          <motion.button
            onClick={checkStatus}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiRefreshCw size={window.innerWidth < 640 ? 16 : 20} />
            <span className="text-sm sm:text-base">
              Vérifier la connexion
            </span>
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
} 