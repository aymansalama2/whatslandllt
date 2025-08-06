import React, { useState, useEffect } from 'react';
import { FiWifi, FiWifiOff, FiAlertTriangle, FiX } from 'react-icons/fi';
import backendStatusService from '../services/backendStatusService';

export default function BackendStatusNotification() {
  const [status, setStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Écouter les changements de statut
    const removeListener = backendStatusService.addStatusListener((statusInfo) => {
      setStatus(statusInfo);
      
      // Afficher la notification seulement si le backend devient indisponible
      if (statusInfo.status === 'backend-unavailable' || statusInfo.status === 'backend-failed') {
        setIsVisible(true);
        setIsDismissed(false);
      } else if (statusInfo.status === 'backend-available') {
        // Masquer la notification quand le backend redevient disponible
        setIsVisible(false);
        setIsDismissed(false);
      }
    });

    // Vérifier le statut initial
    const initialStatus = backendStatusService.getStatus();
    if (!initialStatus.isAvailable) {
      setStatus({
        status: 'backend-unavailable',
        isAvailable: false,
        retryCount: initialStatus.retryCount
      });
      setIsVisible(true);
    }

    return removeListener;
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleRetry = async () => {
    await backendStatusService.forceCheck();
  };

  if (!isVisible || isDismissed || !status || status.isAvailable) {
    return null;
  }

  const getNotificationConfig = () => {
    switch (status.status) {
      case 'backend-unavailable':
        return {
          icon: FiWifiOff,
          title: 'Connexion limitée',
          message: 'Le serveur est temporairement indisponible. Certaines fonctionnalités peuvent être limitées.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800'
        };
      case 'backend-failed':
        return {
          icon: FiAlertTriangle,
          title: 'Serveur indisponible',
          message: 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        };
      default:
        return null;
    }
  };

  const config = getNotificationConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`fixed top-20 right-4 max-w-md ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg z-40 animate-in slide-in-from-right-full duration-300`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${config.textColor}`}>
              {config.title}
            </h3>
            <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
              {config.message}
            </p>
            {status.retryCount > 0 && (
              <p className={`mt-1 text-xs ${config.textColor} opacity-75`}>
                Tentative {status.retryCount}/3
              </p>
            )}
          </div>
          <div className="ml-4 flex space-x-2">
            <button
              onClick={handleRetry}
              className={`text-sm ${config.textColor} hover:opacity-75 font-medium`}
            >
              Réessayer
            </button>
            <button
              onClick={handleDismiss}
              className={`${config.iconColor} hover:opacity-75`}
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}