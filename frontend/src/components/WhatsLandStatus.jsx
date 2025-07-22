import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { API_URL, SOCKET_CONFIG } from '../config/apiConfig';

export default function WhatsLandStatus() {
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('loading');
  const [statusMessage, setStatusMessage] = useState('Connexion en cours...');
  const [socket, setSocket] = useState(null);
  const [reconnectCounter, setReconnectCounter] = useState(0);

  useEffect(() => {
    // Fonction pour créer une nouvelle connexion socket
    const createSocket = () => {
      // Updated socket configuration with proper options
      const newSocket = io(API_URL, SOCKET_CONFIG);
      
      setSocket(newSocket);
      return newSocket;
    };

    // Initialiser le socket
    const socket = createSocket();
    
    // Gérer les événements socket
    socket.on('connect', () => {
      setStatus('connecting');
      setStatusMessage('Connexion à WhatsLand en cours...');
      
      // Vérifier l'état actuel du serveur
      fetch(`${API_URL}/api/status`)
        .then(response => response.json())
        .then(data => {
          if (data.whatsappReady) {
            setStatus('connected');
            setStatusMessage('WhatsLand est connecté et prêt!');
          } else if (data.qrAvailable) {
            // Si le QR code est déjà disponible, le récupérer
            fetch(`${API_URL}/api/qrcode`)
              .then(res => res.json())
              .then(qrData => {
                if (qrData.qrcode) {
                  setQrCode(qrData.qrcode);
                  setStatus('qr');
                  setStatusMessage('Scannez ce QR code avec WhatsApp sur votre téléphone');
                }
              })
              .catch(() => {
                setStatus('waiting');
                setStatusMessage('En attente du QR code...');
              });
          }
        })
        .catch(() => {
          setStatus('error');
          setStatusMessage('Impossible de se connecter au serveur');
        });
    });

    socket.on('qr', (qr) => {
      setQrCode(qr);
      setStatus('qr');
      setStatusMessage('Scannez ce QR code avec WhatsApp sur votre téléphone');
    });

    socket.on('ready', () => {
      setQrCode('');
      setStatus('connected');
      setStatusMessage('WhatsLand est connecté et prêt!');
    });

    socket.on('authenticated', () => {
      setStatus('authenticated');
      setStatusMessage('Authentification réussie. Chargement de vos données...');
    });

    socket.on('auth_failure', (msg) => {
      setStatus('error');
      setStatusMessage(`Erreur d'authentification: ${msg?.error || 'Impossible de se connecter'}`);
    });

    socket.on('disconnected', (data) => {
      setStatus('disconnected');
      setStatusMessage(`WhatsLand a été déconnecté${data?.reason ? ` (${data.reason})` : ''}. En attente d'un nouveau QR code...`);
      setQrCode(''); // Effacer l'ancien QR code
      
      // Incrémenter le compteur de reconnexion pour déclencher une vérification
      setReconnectCounter(prev => prev + 1);
    });

    socket.on('status_update', (data) => {
      if (data.status === 'initializing') {
        setStatus('initializing');
        setStatusMessage(data.message || 'WhatsLand se réinitialise...');
      }
    });

    socket.on('error', (data) => {
      setStatus('error');
      setStatusMessage(data.message || 'Une erreur est survenue');
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
      setStatusMessage('Connexion au serveur perdue. Tentative de reconnexion...');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setStatus('error');
      setStatusMessage(`Erreur de connexion: ${error.message}`);
    });

    // Nettoyage à la destruction du composant
    return () => {
      socket.disconnect();
    };
  }, [reconnectCounter]); // Recréer la connexion si reconnectCounter change

  // Effet pour vérifier périodiquement si un nouveau QR code est disponible après déconnexion
  useEffect(() => {
    let checkInterval;

    if (status === 'disconnected' || status === 'initializing') {
      checkInterval = setInterval(() => {
        fetch(`${API_URL}/api/qrcode`)
          .then(res => res.json())
          .then(data => {
            if (data.qrcode) {
              setQrCode(data.qrcode);
              setStatus('qr');
              setStatusMessage('Nouveau QR code disponible. Scannez-le avec WhatsApp sur votre téléphone');
              clearInterval(checkInterval);
            }
          })
          .catch(() => {
            // Continuer d'attendre
          });
      }, 3000);
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
        return (
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
      case 'disconnected':
        return (
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'qr':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusColors = () => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800';
      case 'error':
      case 'disconnected':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-800';
      case 'qr':
        return 'bg-gradient-to-r from-blue-50 to-sky-50 border-l-4 border-blue-500 text-blue-800';
      default:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 text-yellow-800';
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Statut de WhatsLand</h2>
          <div className={`h-3 w-3 rounded-full ${
            status === 'connected' || status === 'authenticated' 
              ? 'bg-green-300 animate-pulse' 
              : status === 'error' || status === 'disconnected'
                ? 'bg-red-300'
                : 'bg-yellow-300 animate-pulse'
          }`}></div>
        </div>
      </div>
      
      <div className="p-6">
        <div className={`mb-6 p-4 rounded-lg flex items-start ${getStatusColors()}`}>
          <div className="mr-3 mt-0.5">
            {getStatusIcon()}
          </div>
          <div>
            <p className="font-medium">{statusMessage}</p>
          </div>
        </div>

        {qrCode && (
          <div className="mb-6 flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative p-1 bg-white rounded-lg flex">
                <img src={qrCode} alt="QR Code WhatsLand" className="w-64 h-64" />
              </div>
            </div>
          </div>
        )}

        {(status === 'disconnected' || status === 'initializing') && !qrCode && (
          <div className="flex justify-center items-center mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
            <span className="ml-3 text-gray-600 font-medium">Génération d'un nouveau QR code en cours...</span>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Instructions</h3>
          {status === 'connected' ? (
            <div className="flex items-center text-green-600">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Vous pouvez maintenant envoyer des messages.</p>
            </div>
          ) : status === 'qr' ? (
            <div className="space-y-2">
              <div className="flex items-start">
                <div className="bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</div>
                <p>Ouvrez WhatsApp sur votre téléphone</p>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</div>
                <p>Appuyez sur Menu ou Paramètres et sélectionnez WhatsApp Web</p>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</div>
                <p>Pointez votre téléphone vers cet écran pour scanner le QR code</p>
              </div>
            </div>
          ) : status === 'disconnected' ? (
            <div className="flex items-center text-orange-600">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>L'application a été déconnectée. Un nouveau QR code sera bientôt généré.</p>
            </div>
          ) : null}
        </div>

        {status === 'error' && (
          <button 
            onClick={() => setReconnectCounter(prev => prev + 1)}
            className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
} 