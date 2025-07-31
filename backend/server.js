require('dotenv').config();

// Optimisation des performances Node.js
process.env.NODE_ENV = 'production';
process.env.UV_THREADPOOL_SIZE = '1'; // Réduire la taille du pool de threads

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { User, PhoneNumber, Campaign, syncDatabase } = require('./database/models');
const sequelize = require('./database/config');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

// Configuration Firebase Admin
const { admin, db, auth: firebaseAuth, realtimeDb } = require('./firebase-admin-config');

// Optimisation de la gestion de la mémoire
global.gc && global.gc(); // Forcer le garbage collector si disponible

// Système de logging optimisé pour réduire l'utilisation CPU
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Niveau de log par défaut en production (0=ERROR, 1=WARN, 2=INFO, 3=DEBUG)
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;

// Système de logging optimisé qui remplace console.log/error
const logger = {
  error: (message, ...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  info: (message, ...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  debug: (message, ...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};

// Synchroniser la base de données au démarrage
syncDatabase();

// Désactiver manuellement les contraintes de clé étrangère au démarrage du serveur
sequelize.query('PRAGMA foreign_keys = OFF;')
  .then(() => logger.info('Contraintes de clé étrangère désactivées manuellement'))
.catch(err => logger.error('Erreur lors de la désactivation des contraintes:', err));

const app = express();

// ==================== SÉCURITÉ ====================

// Headers de sécurité avec Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting pour les APIs
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite de 100 requêtes par IP
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting spécial pour Firebase APIs
const firebaseLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limite de 20 requêtes par IP
  message: {
    error: 'Limite de sessions WhatsApp atteinte, veuillez réessayer plus tard.',
    retryAfter: '5 minutes'
  }
});

// CORS sécurisé pour whatsland.click
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://whatsland.click', 'http://whatsland.click', 'http://92.113.31.157:3000']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Appliquer rate limiting aux APIs
app.use('/api', apiLimiter);
app.use('/api/firebase', firebaseLimiter);

// ==================== ENDPOINTS DE MONITORING ====================

// Health check endpoint (sans rate limiting)
app.get('/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    activeUsers: firebaseUserClients.size,
    whatsappSessions: Array.from(firebaseUserClients.values()).reduce((acc, session) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {}),
    version: require('./package.json').version
  };
  
  res.json(healthInfo);
});

// Endpoint de statut détaillé (admin uniquement)
app.get('/api/status', verifyFirebaseToken, (req, res) => {
  // Vérifier si l'utilisateur est admin
  const adminEmails = ['houssnijob@gmail.com', 'ayman@gmail.com'];
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Accès non autorisé' 
    });
  }

  const detailedStatus = {
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    database: {
      connected: sequelize.authenticate ? true : false
    },
    firebase: {
      activeClients: firebaseUserClients.size,
      sessions: Array.from(firebaseUserClients.entries()).map(([uid, session]) => ({
        uid,
        status: session.status,
        email: session.userEmail,
        lastActivity: session.lastActivity
      }))
    }
  };
  
  res.json({ success: true, data: detailedStatus });
});

// Configuration de multer pour le stockage temporaire des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = process.env.TEMP_DIR ? path.join(__dirname, process.env.TEMP_DIR) : path.join(__dirname, 'temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Ajout de l'extension originale au fichier
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

// Fonction pour filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
  const messageType = req.body.messageType;
  
  if (messageType === 'video') {
    // Types MIME acceptés pour les vidéos (optimisé avec plus de formats)
    const allowedMimes = [
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
      'video/webm', 'video/3gpp', 'video/x-flv', 'video/mpeg'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier vidéo non supporté. Utilisez MP4, MOV, AVI, WMV, WebM, 3GP, FLV ou MPEG.'), false);
    }
  } else if (messageType === 'image') {
    // Types MIME acceptés pour les images
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier image non supporté. Utilisez JPG, PNG ou GIF.'), false);
    }
  } else if (messageType === 'document') {
    // Types MIME acceptés pour les documents
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de document non supporté. Utilisez PDF, DOC, DOCX, XLS, XLSX ou TXT.'), false);
    }
  } else if (messageType === 'audio') {
    // Types MIME acceptés pour l'audio
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier audio non supporté. Utilisez MP3, WAV ou OGG.'), false);
    }
  } else {
    cb(new Error('Type de message non supporté.'), false);
  }
};

// Configuration de multer avec limites de taille optimisées
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 32 * 1024 * 1024, // 32MB max pour les fichiers (réduit pour économiser la mémoire)
    files: 1, // Un seul fichier à la fois
    fieldSize: 10 * 1024 * 1024 // 10MB max pour les champs de formulaire
  }
});

// ==================== SYSTÈME FIREBASE MULTI-CLIENTS ====================
// Ancien système supprimé - Utilisation exclusive du système Firebase

// Système multi-clients Firebase
const firebaseUserClients = new Map(); // firebaseUid -> { client, qrCode, status, userEmail, lastActivity, sessionId }

// ==================== MIDDLEWARE & VALIDATION ====================

// Validation des entrées
const validatePhoneNumber = body('phoneNumber')
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage('Numéro de téléphone invalide');

const validateMessage = body('message')
  .isLength({ min: 1, max: 4096 })
  .withMessage('Message doit contenir entre 1 et 4096 caractères');

// Middleware de validation des erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Middleware d'authentification Firebase sécurisé
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Token manquant ou format invalide' 
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Validation du format du token
    if (!token || token.length < 100) {
      return res.status(401).json({ 
        success: false,
        error: 'Token invalide' 
      });
    }
    
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    
    // Vérifications supplémentaires
    if (!decodedToken.uid || !decodedToken.email) {
      return res.status(401).json({ 
        success: false,
        error: 'Token incomplet' 
      });
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Erreur vérification token Firebase:', error);
    res.status(401).json({ 
      success: false,
      error: 'Token invalide ou expiré' 
    });
  }
}

// Cache optimisé pour les vérifications de numéros (améliore la vitesse)
const numberVerificationCache = new Map();
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes (augmenté pour réduire les vérifications)

// Limiter l'utilisation CPU
const CPU_THROTTLE_INTERVAL = 100; // ms entre les tâches intensives
function throttleCPU(fn) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(fn());
    }, CPU_THROTTLE_INTERVAL);
  });
}

// ==================== FONCTIONS FIREBASE MULTI-CLIENTS ====================

// Créer un client WhatsApp pour un utilisateur Firebase
async function createFirebaseUserClient(firebaseUid, userEmail) {
    try {
        // Vérifier si l'utilisateur existe dans Firebase
        const userRecord = await firebaseAuth.getUser(firebaseUid);
        
        const client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: `whatsland-firebase-${firebaseUid}`,
                dataPath: path.join(__dirname, '.wwebjs_auth', 'firebase', firebaseUid)
            }),
                    puppeteer: {
            executablePath: process.platform === 'win32' ? undefined : '/usr/bin/chromium',
            headless: 'new',
            ignoreHTTPSErrors: true,
            protocolTimeout: 30000,
            defaultViewport: { width: 800, height: 600 },
            timeout: 30000,
            pipe: true,
            dumpio: false,
            handleSIGINT: true,
            handleSIGTERM: true,
            handleSIGHUP: true,
            args: process.platform === 'win32' ? [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ] : [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--disable-popup-blocking',
                    '--disable-notifications',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-site-isolation-trials',
                    '--no-experiments',
                    '--no-default-browser-check',
                    '--no-first-run',
                    '--disable-infobars',
                    '--disable-translate',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-client-side-phishing-detection',
                    '--disable-component-extensions-with-background-pages',
                    '--disable-hang-monitor',
                    '--disable-ipc-flooding-protection',
                    '--disable-prompt-on-repost',
                    '--disable-renderer-backgrounding',
                    '--force-color-profile=srgb',
                    '--metrics-recording-only',
                    '--password-store=basic',
                    '--use-mock-keychain',
                    '--js-flags="--max-old-space-size=512"'
                ]
            },
            qrMaxRetries: 3,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 10000
        });

        // Créer le répertoire d'authentification s'il n'existe pas
        const authDir = path.join(__dirname, '.wwebjs_auth', 'firebase', firebaseUid);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        // Stocker dans la Map
        firebaseUserClients.set(firebaseUid, {
            client: client,
            qrCode: null,
            status: 'initializing',
            userEmail: userEmail,
            lastActivity: Date.now(),
            sessionId: `whatsland-firebase-${firebaseUid}`
        });

        // Sauvegarder dans Firebase Realtime Database
        await realtimeDb.ref(`whatsapp_sessions/${firebaseUid}`).set({
            sessionId: `whatsland-firebase-${firebaseUid}`,
            status: 'initializing',
            userEmail: userEmail,
            lastActivity: admin.database.ServerValue.TIMESTAMP,
            createdAt: admin.database.ServerValue.TIMESTAMP,
            isActive: true
        });

        logger.info(`Client Firebase créé pour ${firebaseUid} (${userEmail})`);
        return client;
    } catch (error) {
        logger.error('Erreur création client Firebase:', error);
        throw error;
    }
}

// Configurer les événements pour un utilisateur Firebase
function setupFirebaseClientEvents(firebaseUid, client) {
    client.on('qr', async (qr) => {
        try {
            const qrCode = await qrcode.toDataURL(qr);
            const userSession = firebaseUserClients.get(firebaseUid);
            
            if (userSession) {
                userSession.qrCode = qrCode;
                userSession.status = 'waiting_qr';
                userSession.lastActivity = Date.now();
                
                // Mettre à jour Firebase
                await realtimeDb.ref(`whatsapp_sessions/${firebaseUid}`).update({
                    status: 'waiting_qr',
                    lastActivity: admin.database.ServerValue.TIMESTAMP
                });
                
                // Envoyer le QR code à l'utilisateur spécifique
                io.to(`firebase-user-${firebaseUid}`).emit('qr', qrCode);
                logger.info(`QR Code généré pour utilisateur Firebase ${firebaseUid}`);
            }
        } catch (error) {
            logger.error('Erreur QR Firebase:', error);
        }
    });

    client.on('ready', async () => {
        try {
            const userSession = firebaseUserClients.get(firebaseUid);
            if (userSession) {
                userSession.status = 'ready';
                userSession.qrCode = null;
                userSession.lastActivity = Date.now();
                
                // Obtenir le numéro de téléphone WhatsApp
                const info = client.info;
                const phoneNumber = info ? info.wid.user : null;
                
                // Mettre à jour Firebase
                await realtimeDb.ref(`whatsapp_sessions/${firebaseUid}`).update({
                    status: 'ready',
                    phoneNumber: phoneNumber,
                    lastActivity: admin.database.ServerValue.TIMESTAMP
                });
                
                io.to(`firebase-user-${firebaseUid}`).emit('ready', { phoneNumber });
                logger.info(`WhatsApp prêt pour utilisateur Firebase ${firebaseUid}`);
            }
        } catch (error) {
            logger.error('Erreur ready Firebase:', error);
        }
    });

    client.on('authenticated', async () => {
        try {
            await realtimeDb.ref(`whatsapp_sessions/${firebaseUid}`).update({
                status: 'authenticated',
                lastActivity: admin.database.ServerValue.TIMESTAMP
            });
            
            io.to(`firebase-user-${firebaseUid}`).emit('authenticated');
            logger.info(`Utilisateur Firebase ${firebaseUid} authentifié`);
        } catch (error) {
            logger.error('Erreur auth Firebase:', error);
        }
    });

    client.on('auth_failure', async (msg) => {
        try {
            await realtimeDb.ref(`whatsapp_sessions/${firebaseUid}`).update({
                status: 'auth_failure',
                lastActivity: admin.database.ServerValue.TIMESTAMP,
                authFailureReason: msg
            });
            
            io.to(`firebase-user-${firebaseUid}`).emit('auth_failure', msg);
            logger.warn(`Échec auth Firebase ${firebaseUid}:`, msg);
        } catch (error) {
            logger.error('Erreur auth_failure Firebase:', error);
        }
    });

    client.on('disconnected', async (reason) => {
        await cleanupFirebaseUserSession(firebaseUid, reason);
    });
}

// Nettoyer une session utilisateur Firebase
async function cleanupFirebaseUserSession(firebaseUid, reason = 'unknown') {
    try {
        const userSession = firebaseUserClients.get(firebaseUid);
        
        if (userSession) {
            // Détruire le client WhatsApp
            if (userSession.client) {
                await userSession.client.destroy();
            }
            
            // Supprimer les fichiers de session
            const sessionDir = path.join(__dirname, '.wwebjs_auth', 'firebase', firebaseUid);
            if (fs.existsSync(sessionDir)) {
                await fs.promises.rm(sessionDir, { recursive: true, force: true });
            }
            
            // Retirer de la Map
            firebaseUserClients.delete(firebaseUid);
            
            // Mettre à jour Firebase
            await realtimeDb.ref(`whatsapp_sessions/${firebaseUid}`).update({
                status: 'disconnected',
                isActive: false,
                disconnectedAt: admin.database.ServerValue.TIMESTAMP,
                disconnectReason: reason
            });
            
            // Informer le frontend
            io.to(`firebase-user-${firebaseUid}`).emit('session_ended', { reason });
            
            logger.info(`Session Firebase ${firebaseUid} nettoyée: ${reason}`);
        }
    } catch (error) {
        logger.error(`Erreur nettoyage session Firebase ${firebaseUid}:`, error);
    }
}

// Nettoyage automatique des sessions inactives
setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    for (const [firebaseUid, session] of firebaseUserClients.entries()) {
        if (now - session.lastActivity > TIMEOUT) {
            logger.info(`Session Firebase ${firebaseUid} expirée par timeout`);
            cleanupFirebaseUserSession(firebaseUid, 'timeout');
        }
    }
}, 5 * 60 * 1000); // Vérifier toutes les 5 minutes

// Route pour tester si le serveur est accessible et fournir l'état de WhatsApp
app.get('/api/status', (req, res) => {
    const response = { 
        status: 'ok', 
        message: 'Server is running',
        whatsappReady: whatsappReady,
        whatsappAuthenticated: whatsappAuthenticated,
        qrAvailable: !!lastQrCode
    };
    
    // Inclure le QR code si disponible
    if (lastQrCode && !whatsappReady) {
        response.qrcode = lastQrCode;
    }
    
    res.json(response);
});

// Route pour obtenir le QR code directement via HTTP (plus fiable)
app.get('/api/qrcode', async (req, res) => {
    if (whatsappReady) {
        return res.json({ 
            status: 'already_connected',
            message: 'WhatsApp is already connected'
        });
    }

    if (lastQrCode) {
        res.json({ qrcode: lastQrCode });
    } else {
        res.status(404).json({ 
            error: 'QR code not available yet',
            message: 'Waiting for QR code generation...'
        });
    }
});

// Fonction optimisée pour vérifier si un contact existe et obtenir son ID
async function getNumberId(number) {
    try {
        let cleanNumber = number.replace(/[^\d]/g, '');
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '212' + cleanNumber.substring(1);
        }
        if (!cleanNumber.startsWith('212')) {
            cleanNumber = '212' + cleanNumber;
        }
        
        // Vérifier le cache pour optimiser la vitesse
        const cacheKey = cleanNumber;
        const cached = numberVerificationCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
            return cached.result;
        }
        
        const result = await client.getNumberId(cleanNumber);
        
        // Mettre en cache le résultat
        numberVerificationCache.set(cacheKey, {
            result: result,
            timestamp: Date.now()
        });
        
        return result;
    } catch (error) {
        console.error('Erreur lors de la vérification du numéro:', error);
        return null;
    }
}

// Fonction pour envoyer un message avec retry
async function sendMessageWithRetry(chatId, messageData, retryCount = 0) {
    try {
        const maxRetries = 3;
        const { type, content, mediaPath } = messageData;
        
        // Vérifier l'état de la connexion WhatsApp
        if (!whatsappReady || !whatsappAuthenticated) {
            throw new Error('WhatsApp n\'est pas prêt ou non authentifié');
        }

        // Première tentative
        try {
      // Attendre un court instant optimisé avant d'envoyer le message
      await new Promise(resolve => setTimeout(resolve, 100));
            console.log(`Tentative d'envoi à ${chatId}`);
            
            // Vérifier si le chat existe
            const chat = await client.getChatById(chatId);
            if (!chat) {
                throw new Error('Chat non trouvé');
            }

            if (type === 'text') {
                await chat.sendMessage(content);
            } else {
                if (type === 'video') {
                    try {
                        // Vérifier si le fichier existe
                        if (!fs.existsSync(mediaPath)) {
                            throw new Error('Fichier vidéo non trouvé');
                        }

                        // Obtenir la taille du fichier
                        const stats = fs.statSync(mediaPath);
                        const fileSizeInMB = stats.size / (1024 * 1024);
                        
                        // Vérifier la taille du fichier - limite augmentée
                        if (fileSizeInMB > 64) {
                            throw new Error('La vidéo est trop grande (max 64MB)');
                        }

                        // Créer le média avec les métadonnées appropriées
                        const media = MessageMedia.fromFilePath(mediaPath);
                        
                        // Envoyer en tant que document vidéo
                        await chat.sendMessage(media, { 
                            caption: content,
                            sendMediaAsDocument: true,
                            mediaType: 'video'
                        });

                        // Supprimer le fichier temporaire après l'envoi
                        try {
                            fs.unlinkSync(mediaPath);
                        } catch (err) {
                            console.error('Erreur lors de la suppression du fichier temporaire:', err);
                        }
                    } catch (error) {
                        console.error('Erreur lors de l\'envoi de la vidéo:', error);
                        throw error;
                    }
                } else {
                    let media;
                    try {
                        if (type === 'video') {
                            media = MessageMedia.fromFilePath(mediaPath);
                            await chat.sendMessage(media, { caption: content });
                        } else {
                            media = MessageMedia.fromFilePath(mediaPath);
                            await chat.sendMessage(media, { caption: content });
                        }
                    } catch (mediaError) {
                        console.error('Erreur lors de l\'envoi du média:', mediaError);
                        throw mediaError;
                    }
                }
            }
            return { success: true, message: 'Message envoyé avec succès' };
        } catch (firstError) {
            console.log(`Première tentative échouée pour ${chatId}:`, firstError.message);
            
            if (retryCount >= maxRetries) {
                throw new Error(`Nombre maximum de tentatives atteint: ${firstError.message}`);
            }

            // Attendre avant la prochaine tentative (optimisé pour la vitesse)
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));

            // Deuxième tentative avec vérification de l'ID
            const numberDetails = await getNumberId(chatId.replace('@c.us', ''));
            if (!numberDetails) {
                throw new Error('Numéro non trouvé sur WhatsApp');
            }

            try {
                const chat = await client.getChatById(numberDetails._serialized);
                if (!chat) {
                    throw new Error('Chat non trouvé après vérification du numéro');
                }

                if (type === 'text') {
                    await chat.sendMessage(content);
                } else {
                    let media;
                    try {
                        if (type === 'video') {
                            media = MessageMedia.fromFilePath(mediaPath);
                            // Essayer une configuration différente pour les vidéos
                            await chat.sendMessage(media, { 
                                caption: content,
                                sendVideoAsGif: false,
                                sendMediaAsDocument: false
                            });
                        } else {
                            media = MessageMedia.fromFilePath(mediaPath);
                            await chat.sendMessage(media, { caption: content });
                        }
                    } catch (mediaError) {
                        console.error('Erreur lors de l\'envoi du média (2ème tentative):', mediaError);
                        throw mediaError;
                    }
                }
                return { success: true, message: 'Message envoyé avec succès (2ème tentative)' };
            } catch (secondError) {
                // Récursion avec retryCount incrémenté
                return await sendMessageWithRetry(chatId, messageData, retryCount + 1);
            }
        }
    } catch (error) {
        console.error(`Échec de l'envoi après plusieurs tentatives pour ${chatId}:`, error);
        return { 
            success: false, 
            error: error.message,
            details: `Échec après ${retryCount} tentatives`
        };
    }
}

// Fonction pour mettre à jour les statistiques des numéros
async function updateMessageStats(phoneNumber, isSuccessful, userId, niche = 'default') {
  try {
    // Vérifier si le numéro existe déjà dans les statistiques
    const existingNumber = await PhoneNumber.findOne({
      where: { number: phoneNumber }
    });
    
    if (existingNumber) {
      // Mettre à jour les statistiques existantes
      await existingNumber.update({
        messagesSent: existingNumber.messagesSent + 1,
        successfulDeliveries: existingNumber.successfulDeliveries + (isSuccessful ? 1 : 0),
        failedDeliveries: existingNumber.failedDeliveries + (isSuccessful ? 0 : 1),
        lastUsed: new Date(),
        lastMessageStatus: isSuccessful ? 'success' : 'failed',
        niche: niche // Mettre à jour la niche si elle a changé
      });
    } else {
      // Créer une nouvelle entrée statistique
      await PhoneNumber.create({
        number: phoneNumber,
        messagesSent: 1,
        successfulDeliveries: isSuccessful ? 1 : 0,
        failedDeliveries: isSuccessful ? 0 : 1,
        lastUsed: new Date(),
        lastMessageStatus: isSuccessful ? 'success' : 'failed',
        niche: niche
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
  }
}

// Route pour récupérer les statistiques globales
app.get('/api/stats', async (req, res) => {
  const userId = req.query.uid;
  
  try {
    // Construire la condition where
    const whereCondition = userId ? { userId } : {};
    
    // Statistiques des campagnes
    const campaignStats = await Campaign.findAll({
      where: whereCondition,
      attributes: [
        [sequelize.fn('sum', sequelize.col('totalRecipients')), 'total_recipients'],
        [sequelize.fn('sum', sequelize.col('successfulDeliveries')), 'successful_deliveries'],
        [sequelize.fn('sum', sequelize.col('failedDeliveries')), 'failed_deliveries'],
        [sequelize.fn('count', sequelize.col('id')), 'total_campaigns']
      ],
      raw: true
    });
    
    // Statistiques des dernières 24 heures
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentStats = await Campaign.findAll({
      where: {
        ...whereCondition,
        startDate: { [Op.gte]: yesterday }
      },
      attributes: [
        [sequelize.fn('sum', sequelize.col('totalRecipients')), 'recent_recipients'],
        [sequelize.fn('sum', sequelize.col('successfulDeliveries')), 'recent_successful'],
        [sequelize.fn('count', sequelize.col('id')), 'recent_campaigns']
      ],
      raw: true
    });
    
    // Récupérer les 5 dernières campagnes
    const recentCampaigns = await Campaign.findAll({
      where: whereCondition,
      order: [['startDate', 'DESC']],
      limit: 5,
      raw: true
    });
    
    // Traiter les valeurs nulles
    const globalStatsProcessed = {
      total_recipients: Number(campaignStats[0]?.total_recipients || 0),
      successful_deliveries: Number(campaignStats[0]?.successful_deliveries || 0),
      failed_deliveries: Number(campaignStats[0]?.failed_deliveries || 0),
      total_campaigns: Number(campaignStats[0]?.total_campaigns || 0)
    };
    
    const recentStatsProcessed = {
      recent_recipients: Number(recentStats[0]?.recent_recipients || 0),
      recent_successful: Number(recentStats[0]?.recent_successful || 0),
      recent_campaigns: Number(recentStats[0]?.recent_campaigns || 0)
    };
    
    // Combiner toutes les statistiques dans un seul objet plat
    const combinedStats = {
      ...globalStatsProcessed,
      ...recentStatsProcessed
    };
    
    res.json(combinedStats);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour récupérer les statistiques des numéros de téléphone
app.get('/api/phone-stats', async (req, res) => {
  console.log('Fetching phone stats...');
  try {
    console.log('Database connection is OK');
    
    // Récupérer le paramètre de filtre par niche
    const niche = req.query.niche;
    const whereCondition = niche ? { niche } : {};
    
    const stats = await PhoneNumber.findAll({
      where: whereCondition,
      order: [['lastUsed', 'DESC']]
    });
    
    console.log(`Found ${stats.length} phone records${niche ? ` for niche: ${niche}` : ''}`);
    
    const formattedStats = stats.map(stat => ({
      phone_number: stat.number,
      success_count: stat.successfulDeliveries || 0,
      total_count: stat.messagesSent || 0,
      niche: stat.niche || 'Non spécifié',
      lastUsed: stat.lastUsed,
      lastMessageStatus: stat.lastMessageStatus
    }));
    
    console.log(`Returning ${formattedStats.length} formatted records`);
    
    res.json(formattedStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour exporter les numéros de téléphone en Excel
app.get('/api/export-phone-numbers', async (req, res) => {
  try {
    console.log('Exporting phone numbers to Excel...');
    
    // Récupérer le paramètre de filtre par niche
    const niche = req.query.niche;
    const whereCondition = niche ? { niche } : {};
    
    // Récupérer les numéros de téléphone
    const phoneNumbers = await PhoneNumber.findAll({
      where: whereCondition,
      order: [['lastUsed', 'DESC']]
    });
    
    console.log(`Exporting ${phoneNumbers.length} phone records${niche ? ` for niche: ${niche}` : ''}`);
    
    // Créer un nouveau workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WhatsApp QR App';
    workbook.lastModifiedBy = 'WhatsApp QR App';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Ajouter une feuille
    const worksheet = workbook.addWorksheet('Numéros de téléphone');
    
    // Définir les colonnes
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Numéro', key: 'number', width: 20 },
      { header: 'Niche', key: 'niche', width: 20 },
      { header: 'Messages envoyés', key: 'messagesSent', width: 15 },
      { header: 'Succès', key: 'successfulDeliveries', width: 15 },
      { header: 'Échecs', key: 'failedDeliveries', width: 15 },
      { header: 'Taux de succès', key: 'successRate', width: 15 },
      { header: 'Dernier envoi', key: 'lastUsed', width: 25 },
      { header: 'Statut', key: 'lastMessageStatus', width: 15 }
    ];
    
    // Style pour l'en-tête
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0F0E0' }
    };
    
    // Ajouter les données
    phoneNumbers.forEach(phone => {
      const successRate = phone.messagesSent > 0 
        ? Math.round((phone.successfulDeliveries / phone.messagesSent) * 100)
        : 0;
      
      worksheet.addRow({
        id: phone.id,
        number: phone.number,
        niche: phone.niche || 'Non spécifié',
        messagesSent: phone.messagesSent,
        successfulDeliveries: phone.successfulDeliveries || 0,
        failedDeliveries: phone.failedDeliveries || 0,
        successRate: `${successRate}%`,
        lastUsed: phone.lastUsed ? new Date(phone.lastUsed).toLocaleString('fr-FR') : 'N/A',
        lastMessageStatus: phone.lastMessageStatus || 'N/A'
      });
    });
    
    // Définir le type de réponse et les headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=phone-numbers-${new Date().toISOString().slice(0, 10)}.xlsx`);
    
    // Écrire dans la réponse
    await workbook.xlsx.write(res);
    
    console.log('Excel export completed successfully');
    
    // Finaliser la réponse
    res.end();
  } catch (error) {
    console.error('Erreur lors de l\'exportation Excel:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'exportation Excel',
      error: error.message
    });
  }
});

// Route pour synchroniser le profil utilisateur
app.post('/api/sync-profile', async (req, res) => {
  try {
    const { uid, email, nom, prenom, telephone, niche } = req.body;
    
    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: 'UID et email requis'
      });
    }

    // Trouver ou créer l'utilisateur
    const [user, created] = await User.findOrCreate({
      where: { uid },
      defaults: {
        email,
        nom,
        prenom,
        telephone,
        niche
      }
    });

    // Si l'utilisateur existe déjà, mettre à jour ses informations
    if (!created) {
      await user.update({
        email,
        nom,
        prenom,
        telephone,
        niche
      });
    }

    console.log(`Profil utilisateur ${created ? 'créé' : 'mis à jour'} pour ${email}`);

    return res.json({
      success: true,
      message: `Profil ${created ? 'créé' : 'mis à jour'} avec succès`,
      user
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation du profil:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la synchronisation du profil',
      error: error.message
    });
  }
});

// Route pour envoyer des messages en masse
app.post('/api/send', upload.single('media'), async (req, res) => {
  if (!whatsappReady) {
    return res.status(400).json({ 
      success: false, 
      message: 'WhatsApp n\'est pas connecté'
    });
  }

  try {
    const { message, messageType = 'text', uid, niche = 'default' } = req.body;
    let numbers = req.body.numbers;
    
    if (!numbers) {
      return res.status(400).json({ 
        success: false, 
        message: 'Les numéros de téléphone sont requis'
      });
    }

    // Convertir en tableau si ce n'est pas déjà le cas
    if (!Array.isArray(numbers)) {
      if (typeof numbers === 'string') {
        // Si c'est une seule chaîne, la diviser par lignes ou virgules
        if (numbers.includes('\n')) {
          numbers = numbers.split('\n').filter(n => n.trim());
        } else if (numbers.includes(',')) {
          numbers = numbers.split(',').filter(n => n.trim());
        } else {
          numbers = [numbers];
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Format de numéros invalide'
        });
      }
    }

    // Récupérer les informations de l'utilisateur si l'UID est fourni
    let userNiche = niche;
    let userExists = false;
    
    if (uid) {
      try {
        const user = await User.findByPk(uid);
        if (user) {
          userExists = true;
          if (user.niche) {
            userNiche = user.niche;
          }
        }
      } catch (err) {
        console.warn(`Impossible de récupérer les informations de l'utilisateur ${uid}:`, err.message);
      }
    }

    // Vérification spécifique pour les vidéos
    if (messageType === 'video' && req.file) {
      const fileStats = fs.statSync(req.file.path);
      const fileSizeInMB = fileStats.size / (1024 * 1024);
      
      if (fileSizeInMB > 64) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'La vidéo est trop volumineuse. La taille maximale est de 64 MB.'
        });
      }
    }

    // Créer une nouvelle campagne
    const campaignName = message ? 
      (message.length > 30 ? message.substring(0, 30) + "..." : message) : 
      `Campagne du ${new Date().toLocaleDateString('fr-FR')}`;
    
    try {  
      var campaign = await Campaign.create({
        name: campaignName,
        totalRecipients: numbers.length,
        messageType,
        userId: uid || null,  // S'assurer que userId est null si UID n'est pas fourni
        niche: userNiche || 'default',
        startDate: new Date()
      });
      
      console.log(`Campagne créée avec succès: ID=${campaign.id}`);
    } catch (campaignError) {
      console.error('Erreur lors de la création de la campagne:', campaignError);
      
      // Continuer même si la création de campagne échoue
      campaign = {
        id: null,
        update: async () => console.log('Mise à jour de campagne ignorée - pas de campagne créée')
      };
    }
    
    const results = [];
    const mediaPath = req.file ? req.file.path : null;
    let successCount = 0;
    let failureCount = 0;
    
    for (const originalNumber of numbers) {
      try {
        let formattedNumber = originalNumber.trim().replace(/\s+/g, '');
        formattedNumber = formattedNumber.replace(/[^\d]/g, '');
        
        if (formattedNumber.startsWith('06') || formattedNumber.startsWith('07')) {
          formattedNumber = '212' + formattedNumber.substring(1);
        }
        
        if (formattedNumber.startsWith('00212')) {
          formattedNumber = formattedNumber.substring(2);
        }
        
        if (!formattedNumber.startsWith('212')) {
          formattedNumber = originalNumber.trim();
        } else {
          formattedNumber = '+' + formattedNumber;
        }
        
        const chatId = formattedNumber.includes('@c.us') 
          ? formattedNumber 
          : `${formattedNumber}@c.us`;

        console.log(`Tentative d'envoi à ${originalNumber} (formaté: ${chatId})`);
        
        const messageData = {
          type: messageType,
          content: message,
          mediaPath: mediaPath
        };

        const sendResult = await sendMessageWithRetry(chatId, messageData);
        
        // Mettre à jour les statistiques pour ce numéro
        await updateMessageStats(
          formattedNumber, 
          sendResult.success, 
          uid, 
          userNiche
        );
        
        // Mettre à jour les compteurs
        if (sendResult.success) {
          successCount++;
        } else {
          failureCount++;
        }

        results.push({
          originalNumber,
          formattedNumber: chatId,
          status: sendResult.success ? 'success' : 'error',
          message: sendResult.message || sendResult.error
        });
          
        // Attendre 100ms entre chaque message pour optimiser la vitesse (objectif: 1s total)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Erreur lors de l'envoi à ${originalNumber}:`, error);
        failureCount++;
        results.push({
          originalNumber,
          status: 'error',
          message: error.message || 'Erreur lors de l\'envoi du message'
        });
      }
    }
    
    // Mettre à jour la campagne avec les résultats finaux
    try {
      await campaign.update({
        successfulDeliveries: successCount,
        failedDeliveries: failureCount,
        endDate: new Date()
      });
    } catch (updateError) {
      console.error('Erreur lors de la mise à jour de la campagne:', updateError);
      // Continuer malgré l'erreur
    }

    // Nettoyage du fichier média temporaire
    if (mediaPath && fs.existsSync(mediaPath)) {
      fs.unlinkSync(mediaPath);
    }
    
    res.json({ 
      success: true, 
      message: `Messages envoyés: ${successCount} réussis, ${failureCount} échoués`,
      results,
      campaignId: campaign.id,
      note: messageType === 'video' ? 
        "Note: L'envoi de vidéos optimisé (max 64MB). Format MP4 recommandé pour une vitesse optimale." :
        "Note: Envoi optimisé à ~1s par message. Si un message échoue, le numéro est peut-être invalide."
    });
    
  } catch (error) {
    // Nettoyage en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Erreur lors de l\'envoi des messages en masse:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi des messages',
      error: error.message
    });
  }
});

// Route pour récupérer les campagnes
app.get('/api/campaigns', async (req, res) => {
  try {
    const { uid } = req.query;
    
    const whereCondition = uid ? { userId: uid } : {};
    
    const campaigns = await Campaign.findAll({
      where: whereCondition,
      order: [['startDate', 'DESC']],
      raw: true
    });
    
    res.json({ 
      success: true,
      campaigns: campaigns.map(campaign => ({
        ...campaign,
        successRate: campaign.totalRecipients > 0 
          ? Math.round((campaign.successfulDeliveries / campaign.totalRecipients) * 100) 
          : 0
      }))
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour obtenir les détails d'une campagne
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      return res.status(404).json({ 
        success: false, 
        message: 'Campagne non trouvée' 
      });
    }
    
    const successRate = campaign.totalRecipients > 0 
      ? Math.round((campaign.successfulDeliveries / campaign.totalRecipients) * 100) 
      : 0;
    
    res.json({
      success: true,
      campaign: {
        ...campaign.toJSON(),
        successRate
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la campagne:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { 
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://whatsland.click', 'http://whatsland.click', 'http://92.113.31.157:3000']
        : ['http://localhost:5173', 'http://localhost:3000'],
      methods: ["GET", "POST"],
      credentials: true 
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowUpgrades: true,
    cookie: false
});

// ==================== GESTION SOCKET.IO FIREBASE ====================

// Gestion des connexions Socket.IO avec authentification Firebase
io.on('connection', (socket) => {
    logger.info(`Nouvelle connexion Socket.IO: ${socket.id}`);
    
    // Authentification Firebase via Socket.IO
    socket.on('firebase_auth', async (token) => {
        try {
            const decodedToken = await firebaseAuth.verifyIdToken(token);
            socket.firebaseUid = decodedToken.uid;
            socket.userEmail = decodedToken.email;
            socket.join(`firebase-user-${decodedToken.uid}`);
            
            socket.emit('firebase_authenticated', { 
                uid: decodedToken.uid,
                email: decodedToken.email
            });
            
            logger.info(`Utilisateur Firebase authentifié: ${decodedToken.uid} (${decodedToken.email})`);
            
            // Envoyer le statut actuel de la session si elle existe
            const userSession = firebaseUserClients.get(decodedToken.uid);
            if (userSession) {
                socket.emit('status_update', {
                    status: userSession.status,
                    qrAvailable: !!userSession.qrCode
                });
                
                if (userSession.qrCode) {
                    socket.emit('qr', userSession.qrCode);
                }
            }
            
        } catch (error) {
            logger.error('Erreur auth Firebase Socket.IO:', error);
            socket.emit('firebase_auth_error', { message: 'Token invalide' });
        }
    });
    
    // Rejoindre une salle utilisateur (méthode alternative)
    socket.on('join_user_room', async (data) => {
        try {
            const { token } = data;
            const decodedToken = await firebaseAuth.verifyIdToken(token);
            socket.firebaseUid = decodedToken.uid;
            socket.userEmail = decodedToken.email;
            socket.join(`firebase-user-${decodedToken.uid}`);
            
            socket.emit('room_joined', { uid: decodedToken.uid });
            logger.info(`Utilisateur ${decodedToken.uid} a rejoint sa salle`);
        } catch (error) {
            logger.error('Erreur join room:', error);
            socket.emit('room_join_error', { message: 'Erreur lors de la connexion' });
        }
    });
    
    // Demander le statut de la session
    socket.on('get_session_status', () => {
        if (socket.firebaseUid) {
            const userSession = firebaseUserClients.get(socket.firebaseUid);
            if (userSession) {
                socket.emit('session_status', {
                    status: userSession.status,
                    qrAvailable: !!userSession.qrCode,
                    sessionId: userSession.sessionId
                });
            } else {
                socket.emit('session_status', {
                    status: 'not_initialized',
                    qrAvailable: false
                });
            }
        }
    });
    
    // Demander un nouveau QR code
    socket.on('request_qr', async () => {
        if (socket.firebaseUid) {
            const userSession = firebaseUserClients.get(socket.firebaseUid);
            if (userSession && userSession.qrCode) {
                socket.emit('qr', userSession.qrCode);
            } else {
                socket.emit('qr_error', { message: 'QR code non disponible' });
            }
        }
    });
    
    // Gestion de la déconnexion
    socket.on('disconnect', (reason) => {
        if (socket.firebaseUid) {
            logger.info(`Utilisateur Firebase ${socket.firebaseUid} déconnecté: ${reason}`);
            // Note: On ne nettoie pas immédiatement la session WhatsApp
            // Elle sera nettoyée par le timeout automatique si nécessaire
        } else {
            logger.info(`Socket ${socket.id} déconnecté: ${reason}`);
        }
    });
    
    // Gestion des erreurs Socket.IO
    socket.on('error', (error) => {
        logger.error('Erreur Socket.IO:', error);
        socket.emit('socket_error', { message: 'Erreur de connexion' });
    });
});

// ==================== DÉMARRAGE DU SERVEUR ====================

// Fonction pour tuer tous les processus Chrome
async function killChromiumProcesses() {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    logger.debug('🔄 Nettoyage des processus Chrome...');

    // Tuer tous les processus Chrome/Chromium
    const commands = [
      'pkill -f chrome',
      'pkill -f chromium',
      'pkill -f "Google Chrome"',
      'rm -rf /tmp/.org.chromium.Chromium*',
      'rm -rf /tmp/.com.google.Chrome*',
      'rm -rf /tmp/puppeteer_dev_chrome_profile-*'
    ];

    for (const cmd of commands) {
      try {
        await execAsync(cmd);
      } catch (err) {
        // Ignorer les erreurs car certaines commandes peuvent échouer si les processus n'existent pas
      }
    }

    logger.debug('✅ Nettoyage des processus Chrome terminé');
  } catch (error) {
    logger.error('❌ Erreur lors du nettoyage des processus Chrome:', error);
  }
}

// Fonction pour nettoyer le répertoire de session
async function cleanSessionDirectory() {
  try {
    const fs = require('fs');
    const path = require('path');
    const sessionDir = path.join(__dirname, '.wwebjs_auth');
    
    if (fs.existsSync(sessionDir)) {
      logger.debug('Suppression du répertoire de session WhatsApp');
      await fs.promises.rm(sessionDir, { recursive: true, force: true });
      logger.debug('Répertoire de session supprimé avec succès');
    }
  } catch (error) {
    logger.error('Erreur lors de la suppression du répertoire de session:', error);
  }
}

// Fonction pour réinitialiser complètement WhatsApp
async function fullWhatsAppReset() {
  try {
    whatsappReady = false;
    whatsappAuthenticated = false;
    lastQrCode = null;
    
    // Informer le frontend que la réinitialisation est en cours
    io.emit('status_update', {
      status: 'resetting',
      message: 'Réinitialisation complète de WhatsApp en cours...'
    });
    
    // Détruire l'instance client actuelle
    if (client) {
      try {
        await client.destroy();
        console.log('Client WhatsApp détruit');
      } catch (err) {
        console.log('Erreur lors de la destruction du client:', err);
      }
    }
    
    // Tuer tous les processus Chrome
    await killChromiumProcesses();
    
    // Nettoyer le répertoire de session
    await cleanSessionDirectory();
    
    // Attendre un peu avant de créer un nouveau client
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Créer un nouveau client
    client = new Client({
      authStrategy: new LocalAuth({ clientId: `whatsland-${Date.now()}` }),
      puppeteer: {
        executablePath: process.env.CHROME_PATH || undefined,
        headless: true,
        ignoreHTTPSErrors: true,
        protocolTimeout: 30000,
        defaultViewport: { width: 800, height: 600 },
        timeout: 30000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-client-side-phishing-detection',
          '--disable-default-apps',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--disable-translate',
          '--disable-features=site-per-process',
          '--js-flags="--max-old-space-size=256"'
        ]
      }
    });
    
    // Configurer les événements
    client.on('qr', async (qr) => {
      console.log('Nouveau QR Code généré!');
      lastQrCode = await qrcode.toDataURL(qr);
      io.emit('qr', lastQrCode);
    });
    
    client.on('ready', () => {
      console.log('✅ WhatsApp est prêt');
      whatsappReady = true;
      io.emit('ready');
    });
    
    client.on('authenticated', () => {
      console.log('🔐 Authentifié');
      whatsappAuthenticated = true;
      io.emit('authenticated');
    });
    
    client.on('auth_failure', (msg) => {
      console.log('❌ Auth échouée', msg);
      io.emit('auth_failure', msg);
    });
    
    client.on('disconnected', (reason) => {
      console.log('🔌 Déconnecté de WhatsApp:', reason);
      whatsappReady = false;
      whatsappAuthenticated = false;
      io.emit('disconnected', { reason });
      
      // Déclencher une réinitialisation complète après déconnexion
      setTimeout(() => {
        fullWhatsAppReset();
      }, 1000);
    });
    
    // Initialiser le nouveau client
    console.log('Initialisation d\'un nouveau client WhatsApp');
    await client.initialize();
    
    io.emit('status_update', {
      status: 'waiting_qr',
      message: 'En attente d\'un nouveau QR code...'
    });
    
  } catch (error) {
    console.error('Erreur lors de la réinitialisation complète:', error);
    io.emit('error', { message: 'Erreur lors de la réinitialisation de WhatsApp' });
  }
}

// Route API pour la reconnexion (réinitialisation légère)
app.post('/api/reconnect', async (req, res) => {
  try {
    console.log('🔄 Demande de reconnexion reçue');
    
    // Réinitialiser les variables d'état
    whatsappReady = false;
    whatsappAuthenticated = false;
    lastQrCode = null;
    
    // Informer le frontend
    io.emit('status_update', {
      status: 'reconnecting',
      message: 'Tentative de reconnexion en cours...'
    });
    
    // Essayer de réinitialiser le client
    if (client) {
      try {
        await client.initialize();
      } catch (err) {
        console.log('Erreur lors de la réinitialisation, destruction du client:', err);
        await client.destroy();
        
        // Créer un nouveau client
        client = new Client({
          authStrategy: new LocalAuth({ clientId: `whatsland-${Date.now()}` }),
          puppeteer: {
            executablePath: process.env.CHROME_PATH || undefined,
            headless: true,
            ignoreHTTPSErrors: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu'
            ]
          }
        });
        
        // Reconfigurer les événements
        client.on('qr', async (qr) => {
          console.log('QR Code reçu!');
          lastQrCode = await qrcode.toDataURL(qr);
          whatsappReady = false;
          io.emit('qr', lastQrCode);
        });
        
        client.on('ready', () => {
          console.log('✅ WhatsApp est prêt');
          whatsappReady = true;
          lastQrCode = null;
          io.emit('ready');
        });
        
        client.on('authenticated', () => {
          console.log('🔐 Authentifié');
          whatsappAuthenticated = true;
          io.emit('authenticated');
        });
        
        client.on('disconnected', handleDisconnect);
        
        await client.initialize();
      }
    }
    
    res.json({ success: true, message: 'Reconnexion démarrée' });
  } catch (error) {
    console.error('Erreur lors de la reconnexion:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route API pour la réinitialisation complète
app.post('/api/reset', async (req, res) => {
  try {
    console.log('🔄 Demande de réinitialisation complète reçue');
    fullWhatsAppReset();
    res.json({ success: true, message: 'Réinitialisation complète de WhatsApp démarrée' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ajouter une route API pour forcer la réinitialisation (compatibilité)
app.post('/api/reset-whatsapp', async (req, res) => {
  try {
    fullWhatsAppReset();
    res.json({ success: true, message: 'Réinitialisation de WhatsApp démarrée' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ROUTES API FIREBASE ====================

// Route pour initialiser une session WhatsApp avec Firebase
app.post('/api/firebase/init', verifyFirebaseToken, async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        const userEmail = req.user.email;
        
        // Vérifier si une session existe déjà
        const existingSession = firebaseUserClients.get(firebaseUid);
        if (existingSession && existingSession.status === 'ready') {
            return res.json({ 
                success: true, 
                message: 'Session déjà active',
                status: 'ready',
                sessionId: existingSession.sessionId
            });
        }
        
        // Nettoyer une session existante si elle n'est pas prête
        if (existingSession) {
            await cleanupFirebaseUserSession(firebaseUid, 'reinit');
        }
        
        // Créer un nouveau client
        const client = await createFirebaseUserClient(firebaseUid, userEmail);
        setupFirebaseClientEvents(firebaseUid, client);
        await client.initialize();
        
        res.json({ 
            success: true, 
            message: 'Session WhatsApp initialisée',
            sessionId: `whatsland-firebase-${firebaseUid}`
        });
        
    } catch (error) {
        logger.error('Erreur init Firebase:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route pour obtenir le statut WhatsApp d'un utilisateur Firebase
app.get('/api/firebase/status', verifyFirebaseToken, async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        const userSession = firebaseUserClients.get(firebaseUid);
        
        if (!userSession) {
            return res.json({
                status: 'not_initialized',
                message: 'Session WhatsApp non initialisée',
                whatsappReady: false,
                whatsappAuthenticated: false,
                qrAvailable: false
            });
        }
        
        res.json({
            status: userSession.status,
            qrAvailable: !!userSession.qrCode,
            qrcode: userSession.qrCode,
            whatsappReady: userSession.status === 'ready',
            whatsappAuthenticated: userSession.status === 'authenticated' || userSession.status === 'ready',
            sessionId: userSession.sessionId,
            lastActivity: userSession.lastActivity,
            userEmail: userSession.userEmail
        });
        
    } catch (error) {
        logger.error('Erreur status Firebase:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route pour obtenir le QR code d'un utilisateur Firebase
app.get('/api/firebase/qrcode', verifyFirebaseToken, async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        const userSession = firebaseUserClients.get(firebaseUid);
        
        if (!userSession || !userSession.qrCode) {
            return res.status(404).json({ 
                success: false, 
                message: 'QR code non disponible' 
            });
        }
        
        res.json({ 
            success: true,
            qrcode: userSession.qrCode 
        });
        
    } catch (error) {
        logger.error('Erreur QR Firebase:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route pour déconnecter WhatsApp d'un utilisateur Firebase
app.post('/api/firebase/disconnect', verifyFirebaseToken, async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        await cleanupFirebaseUserSession(firebaseUid, 'user_requested');
        
        res.json({ success: true, message: 'Session WhatsApp fermée' });
    } catch (error) {
        logger.error('Erreur disconnect Firebase:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route pour envoyer un message via Firebase (avec validation)
app.post('/api/firebase/send-message', 
  verifyFirebaseToken,
  validatePhoneNumber,
  validateMessage,
  handleValidationErrors,
  async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        const { phoneNumber, message } = req.body;
        
        const userSession = firebaseUserClients.get(firebaseUid);
        if (!userSession || userSession.status !== 'ready') {
            return res.status(400).json({ 
                success: false, 
                error: 'Session WhatsApp non prête. Veuillez d\'abord scanner le QR code.' 
            });
        }
        
        const client = userSession.client;
        const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
        
        // Vérifier si le numéro est valide
        const isValidNumber = await client.isRegisteredUser(chatId);
        if (!isValidNumber) {
            return res.status(400).json({ 
                success: false, 
                error: 'Numéro WhatsApp non valide ou non enregistré' 
            });
        }
        
        await client.sendMessage(chatId, message);
        
        // Mettre à jour l'activité et les statistiques
        userSession.lastActivity = Date.now();
        await realtimeDb.ref(`whatsapp_sessions/${firebaseUid}`).update({
            lastActivity: admin.database.ServerValue.TIMESTAMP,
            messagesSent: admin.database.ServerValue.increment(1)
        });
        
        res.json({ 
            success: true, 
            message: 'Message envoyé avec succès',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erreur envoi message Firebase:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'envoi du message',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route pour obtenir la liste des sessions actives (admin seulement)
app.get('/api/firebase/sessions', verifyFirebaseToken, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        const userEmail = req.user.email;
        const adminEmails = ['houssnijob@gmail.com', 'ayman@gmail.com'];
        
        if (!adminEmails.includes(userEmail)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès non autorisé' 
            });
        }
        
        const sessions = [];
        for (const [firebaseUid, session] of firebaseUserClients.entries()) {
            sessions.push({
                firebaseUid,
                userEmail: session.userEmail,
                status: session.status,
                sessionId: session.sessionId,
                lastActivity: session.lastActivity
            });
        }
        
        res.json({ success: true, sessions });
        
    } catch (error) {
        logger.error('Erreur sessions Firebase:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Initialisation de WhatsApp
console.log('🚀 Initialisation de WhatsApp Web...');

// Fonction pour gérer la reconnexion automatique
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Remplacez votre fonction handleDisconnect actuelle par celle-ci:
async function handleDisconnect(reason) {
  console.log('🔌 Déconnecté de WhatsApp:', reason);
  whatsappReady = false;
  whatsappAuthenticated = false;
  
  // Informer le frontend
  io.emit('disconnected', { reason });
  
  // Attendre un peu pour éviter les conflits
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Destruction propre du client
    if (client) {
      await client.destroy();
    }
    
    // Créer un nouveau client avec un ID unique
    client = new Client({
      authStrategy: new LocalAuth({ clientId: `whatsland-${Date.now()}` }),
      puppeteer: {
        // Gardez vos options puppeteer existantes
        executablePath: process.env.CHROME_PATH || undefined,
        headless: true,
        // autres options...
      }
    });
    
    // Relier les événements du client
    client.on('qr', async (qr) => {
      console.log('Nouveau QR Code généré!');
      lastQrCode = await qrcode.toDataURL(qr);
      io.emit('qr', lastQrCode);
    });
    
    client.on('ready', () => {
      whatsappReady = true;
      io.emit('ready');
    });
    
    client.on('authenticated', () => {
      whatsappAuthenticated = true;
      io.emit('authenticated');
    });
    
    client.on('auth_failure', (msg) => {
      whatsappAuthenticated = false;
      io.emit('auth_failure', msg);
    });
    
    client.on('disconnected', handleDisconnect);
    
    // Initialiser le nouveau client
    client.initialize().catch(err => {
      console.error('Erreur lors de l\'initialisation du client:', err);
      io.emit('error', { message: 'Erreur lors de l\'initialisation de WhatsApp' });
    });
    
    io.emit('status_update', {
      status: 'initializing',
      message: 'Génération d\'un nouveau QR code en cours...'
    });
    
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    io.emit('error', { message: 'Erreur lors de la réinitialisation de WhatsApp' });
  }
}

// Réinitialiser le compteur de tentatives quand WhatsApp est prêt
client.on('ready', () => {
  console.log('✅ WhatsApp est prêt');
  whatsappReady = true;
  lastQrCode = null;
  io.emit('ready');
  reconnectAttempts = 0; // Réinitialiser le compteur
});

client.initialize();


// Configurer la gestion de la reconnexion
client.on('disconnected', handleDisconnect);

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces
server.listen(PORT, HOST, () => {
    logger.info(`🚀 Backend lancé sur http://${HOST}:${PORT}`);
    logger.info(`📡 Serveur accessible depuis l'extérieur sur le port ${PORT}`);
});

// Ajout d'un gestionnaire pour les arrêts gracieux
process.on('SIGINT', async function() {
  console.log('Arrêt gracieux...');
  try {
    // Attendre un peu avant de déconnecter WhatsApp
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Déconnecter le client WhatsApp s'il est prêt
    if (whatsappReady && client) {
      console.log('Déconnexion de WhatsApp...');
      await client.destroy();
      console.log('WhatsApp déconnecté avec succès');
    }
    
    // Fermer la connexion à la base de données
    await sequelize.close();
    console.log('Connexion à la base de données fermée');
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'arrêt gracieux:', error);
    process.exit(1);
  }
});

// Gestionnaires d'erreurs globaux pour éviter les crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  console.error('Stack trace:', error.stack);
  
  // Notifier le frontend de l'erreur
  if (io) {
    io.emit('error', { 
      message: 'Une erreur inattendue s\'est produite', 
      details: error.message 
    });
  }
  
  // Essayer de relancer WhatsApp au lieu de faire crash le serveur
  setTimeout(() => {
    console.log('🔄 Tentative de redémarrage de WhatsApp...');
    if (client && client.destroy) {
      client.destroy().then(() => {
        console.log('Client détruit avec succès');
        // Réinitialiser les variables d'état
        whatsappReady = false;
        whatsappAuthenticated = false;
        lastQrCode = null;
      }).catch((err) => {
        console.error('Erreur lors de la destruction du client:', err);
      });
    }
  }, 2000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  console.error('Promesse:', promise);
  
  // Notifier le frontend de l'erreur
  if (io) {
    io.emit('error', { 
      message: 'Une erreur de promesse s\'est produite', 
      details: reason 
    });
  }
});

// Gestionnaire pour les erreurs de Socket.IO
if (io) {
  io.on('error', (error) => {
    console.error('❌ Erreur Socket.IO:', error);
  });
}

// ==================== DÉMARRAGE DU SERVEUR HTTP ====================

const PORT = process.env.PORT || 5001;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Serveur WhatsLand démarré sur le port ${PORT}`);
  logger.info(`🌐 URL: https://whatsland.click:${PORT}`);
  logger.info(`📊 Health Check: https://whatsland.click:${PORT}/health`);
  logger.info(`🔥 Firebase multi-clients activé`);
  logger.info(`🛡️ Sécurité renforcée activée`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 Arrêt gracieux du serveur...');
  
  // Fermer toutes les sessions Firebase
  for (const [firebaseUid, session] of firebaseUserClients.entries()) {
    try {
      if (session.client) {
        await session.client.destroy();
      }
    } catch (error) {
      logger.error(`Erreur fermeture session ${firebaseUid}:`, error);
    }
  }
  
  // Fermer le serveur
  server.close(() => {
    logger.info('✅ Serveur fermé proprement');
    process.exit(0);
  });
});

logger.info('🛡️ Gestionnaires d\'erreurs globaux activés');
