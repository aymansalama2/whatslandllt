import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_CONFIG } from '../config/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import frontendMonitoringService from '../services/monitoringService';

/**
 * Hook personnalisé pour gestion WebSocket optimisée avec Socket.IO
 * Intégration Firebase Auth et gestion robuste des reconnexions
 */
export function useWebSocket(options = {}) {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastPongRef = useRef(Date.now());

  const {
    autoConnect = true,
    namespace = '',
    maxReconnectAttempts = 10,
    reconnectDelay = 1000,
    heartbeatInterval = 30000,
    debug = false
  } = options;

  /**
   * Logger pour debug
   */
  const log = useCallback((message, data = null) => {
    if (debug) {
      console.log(`🔌 WebSocket: ${message}`, data || '');
    }
  }, [debug]);

  /**
   * Créer une nouvelle connexion Socket.IO
   */
  const createConnection = useCallback(async () => {
    if (socketRef.current?.connected) {
      log('Connexion déjà active');
      return socketRef.current;
    }

    try {
      setConnecting(true);
      setError(null);
      
      log('Création de la connexion Socket.IO...');

      // Configuration Socket.IO avec authentification Firebase
      const socketConfig = {
        ...SOCKET_CONFIG,
        forceNew: true,
        auth: currentUser ? {
          token: await currentUser.getIdToken(),
          uid: currentUser.uid,
          email: currentUser.email
        } : undefined
      };

      // Créer la connexion
      const newSocket = io(`${API_URL}${namespace}`, socketConfig);
      socketRef.current = newSocket;

      // Configuration des événements
      setupEventListeners(newSocket);
      
      // Démarrer le heartbeat
      startHeartbeat();

      setSocket(newSocket);
      log('Socket créé avec succès');
      
      return newSocket;

    } catch (err) {
      log('Erreur création socket:', err);
      setError(err.message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [currentUser, namespace, debug]);

  /**
   * Configurer les écouteurs d'événements Socket.IO
   */
  const setupEventListeners = useCallback((socket) => {
    // Connexion réussie
    socket.on('connect', () => {
      log('Connexion établie', { id: socket.id });
      setConnected(true);
      setConnecting(false);
      setError(null);
      setReconnectAttempts(0);
      
      frontendMonitoringService.trackEvent('websocket_connected', {
        socketId: socket.id,
        attempts: reconnectAttempts
      });
    });

    // Déconnexion
    socket.on('disconnect', (reason) => {
      log('Déconnexion', { reason });
      setConnected(false);
      
      frontendMonitoringService.trackEvent('websocket_disconnected', {
        reason,
        attempts: reconnectAttempts
      });

      // Reconnecter si nécessaire
      if (reason !== 'io client disconnect' && autoConnect) {
        handleReconnection();
      }
    });

    // Erreur de connexion
    socket.on('connect_error', (err) => {
      log('Erreur de connexion', err);
      setError(err.message);
      setConnecting(false);
      
      frontendMonitoringService.trackError('websocket', err, {
        action: 'connect_error',
        attempts: reconnectAttempts
      });

      if (autoConnect && reconnectAttempts < maxReconnectAttempts) {
        handleReconnection();
      }
    });

    // Authentification Firebase
    socket.on('firebase_authenticated', (data) => {
      log('Authentification Firebase réussie', data);
      frontendMonitoringService.trackEvent('firebase_websocket_auth', data);
    });

    socket.on('firebase_auth_error', (error) => {
      log('Erreur authentification Firebase', error);
      setError('Erreur d\'authentification Firebase');
      
      frontendMonitoringService.trackError('firebase', new Error(error), {
        action: 'websocket_auth'
      });
    });

    // Heartbeat/Pong
    socket.on('pong', () => {
      lastPongRef.current = Date.now();
      log('Pong reçu');
    });

    // Erreurs générales
    socket.on('error', (error) => {
      log('Erreur Socket.IO', error);
      setError(error.message || 'Erreur Socket.IO');
      
      frontendMonitoringService.trackError('websocket', new Error(error), {
        action: 'socket_error'
      });
    });

  }, [autoConnect, maxReconnectAttempts, reconnectAttempts, debug]);

  /**
   * Gérer la reconnexion avec backoff exponentiel
   */
  const handleReconnection = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      log('Nombre maximum de tentatives de reconnexion atteint');
      setError('Impossible de se reconnecter au serveur');
      return;
    }

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(
      reconnectDelay * Math.pow(2, reconnectAttempts),
      30000 // Max 30 secondes
    );

    log(`Reconnexion dans ${delay}ms (tentative ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      createConnection();
    }, delay);

  }, [reconnectAttempts, maxReconnectAttempts, reconnectDelay, createConnection, debug]);

  /**
   * Démarrer le heartbeat pour vérifier la connexion
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      const socket = socketRef.current;
      
      if (socket?.connected) {
        // Envoyer ping
        socket.emit('ping');
        
        // Vérifier si on a reçu un pong récemment
        const timeSinceLastPong = Date.now() - lastPongRef.current;
        
        if (timeSinceLastPong > heartbeatInterval * 2) {
          log('Heartbeat timeout, reconnexion...');
          socket.disconnect();
          if (autoConnect) {
            handleReconnection();
          }
        }
      }
    }, heartbeatInterval);

  }, [heartbeatInterval, autoConnect, handleReconnection, debug]);

  /**
   * Se connecter manuellement
   */
  const connect = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      createConnection();
    }
  }, [createConnection]);

  /**
   * Se déconnecter manuellement
   */
  const disconnect = useCallback(() => {
    log('Déconnexion manuelle');
    
    // Clear timeouts and intervals
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSocket(null);
    setConnected(false);
    setConnecting(false);
    setReconnectAttempts(0);
    
  }, [debug]);

  /**
   * Écouter un événement
   */
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      log(`Écouteur ajouté pour: ${event}`);
    }
  }, [debug]);

  /**
   * Arrêter d'écouter un événement
   */
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
      log(`Écouteur supprimé pour: ${event}`);
    }
  }, [debug]);

  /**
   * Émettre un événement
   */
  const emit = useCallback((event, data, callback) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data, callback);
      log(`Événement émis: ${event}`, data);
      return true;
    } else {
      log(`Impossible d'émettre ${event}: socket non connecté`);
      return false;
    }
  }, [debug]);

  /**
   * Obtenir des informations sur la connexion
   */
  const getConnectionInfo = useCallback(() => {
    const socket = socketRef.current;
    
    return {
      connected: socket?.connected || false,
      id: socket?.id || null,
      transport: socket?.io?.engine?.transport?.name || null,
      reconnectAttempts,
      lastPong: lastPongRef.current,
      error: error
    };
  }, [reconnectAttempts, error]);

  // Auto-connect au montage si currentUser disponible et autoConnect activé
  useEffect(() => {
    if (autoConnect && currentUser && !socketRef.current) {
      createConnection();
    }

    return () => {
      // Cleanup au démontage
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [autoConnect, currentUser, createConnection]);

  // Reconnecter si l'utilisateur change
  useEffect(() => {
    if (currentUser && socketRef.current && !socketRef.current.connected) {
      log('Utilisateur connecté, reconnexion du socket...');
      createConnection();
    } else if (!currentUser && socketRef.current) {
      log('Utilisateur déconnecté, fermeture du socket...');
      disconnect();
    }
  }, [currentUser, createConnection, disconnect, debug]);

  return {
    socket,
    connected,
    connecting,
    error,
    reconnectAttempts,
    
    // Actions
    connect,
    disconnect,
    on,
    off,
    emit,
    
    // Info
    getConnectionInfo
  };
}

export default useWebSocket;