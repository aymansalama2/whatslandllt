// Serveur de test local simplifié pour Firebase WhatsApp
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: false }));
app.use(express.json());

// Système de logging simplifié
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.log(`[DEBUG] ${msg}`, ...args)
};

// Mock Firebase Auth pour les tests locaux
const mockFirebaseAuth = {
  verifyIdToken: async (token) => {
    // Pour les tests, accepter n'importe quel token qui commence par "test-token"
    if (token && token.startsWith('test-token')) {
      return {
        uid: 'test-uid-' + Date.now(),
        email: 'test@example.com',
        name: 'Test User'
      };
    }
    throw new Error('Token invalide');
  }
};

// Mock Firebase Realtime Database
const mockRealtimeDb = {
  ref: (path) => ({
    set: async (data) => {
      logger.info(`Mock DB SET ${path}:`, data);
      return Promise.resolve();
    },
    update: async (data) => {
      logger.info(`Mock DB UPDATE ${path}:`, data);
      return Promise.resolve();
    }
  })
};

// Système multi-clients Firebase (version test)
const firebaseUserClients = new Map();

// Middleware d'authentification Firebase (version test)
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou format invalide' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await mockFirebaseAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Erreur vérification token:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
}

// Créer un client WhatsApp pour un utilisateur (version test)
async function createFirebaseUserClient(firebaseUid, userEmail) {
    try {
        const client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: `whatsland-test-${firebaseUid}`,
                dataPath: path.join(__dirname, '.wwebjs_auth_test', firebaseUid)
            }),
            puppeteer: {
                headless: true,
                args: process.platform === 'win32' ? [
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ] : [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            }
        });

        // Créer le répertoire d'authentification s'il n'existe pas
        const authDir = path.join(__dirname, '.wwebjs_auth_test', firebaseUid);
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
            sessionId: `whatsland-test-${firebaseUid}`
        });

        logger.info(`Client test créé pour ${firebaseUid} (${userEmail})`);
        return client;
    } catch (error) {
        logger.error('Erreur création client test:', error);
        throw error;
    }
}

// Configurer les événements pour un utilisateur (version test)
function setupFirebaseClientEvents(firebaseUid, client) {
    client.on('qr', async (qr) => {
        try {
            const qrCode = await qrcode.toDataURL(qr);
            const userSession = firebaseUserClients.get(firebaseUid);
            
            if (userSession) {
                userSession.qrCode = qrCode;
                userSession.status = 'waiting_qr';
                userSession.lastActivity = Date.now();
                
                logger.info(`QR Code généré pour utilisateur test ${firebaseUid}`);
                io.to(`firebase-user-${firebaseUid}`).emit('qr', qrCode);
            }
        } catch (error) {
            logger.error('Erreur QR test:', error);
        }
    });

    client.on('ready', async () => {
        try {
            const userSession = firebaseUserClients.get(firebaseUid);
            if (userSession) {
                userSession.status = 'ready';
                userSession.qrCode = null;
                userSession.lastActivity = Date.now();
                
                logger.info(`WhatsApp prêt pour utilisateur test ${firebaseUid}`);
                io.to(`firebase-user-${firebaseUid}`).emit('ready');
            }
        } catch (error) {
            logger.error('Erreur ready test:', error);
        }
    });

    client.on('authenticated', async () => {
        logger.info(`Utilisateur test ${firebaseUid} authentifié`);
        io.to(`firebase-user-${firebaseUid}`).emit('authenticated');
    });

    client.on('auth_failure', async (msg) => {
        logger.warn(`Échec auth test ${firebaseUid}:`, msg);
        io.to(`firebase-user-${firebaseUid}`).emit('auth_failure', msg);
    });

    client.on('disconnected', async (reason) => {
        logger.info(`Client test ${firebaseUid} déconnecté: ${reason}`);
        await cleanupFirebaseUserSession(firebaseUid, reason);
    });
}

// Nettoyer une session utilisateur (version test)
async function cleanupFirebaseUserSession(firebaseUid, reason = 'unknown') {
    try {
        const userSession = firebaseUserClients.get(firebaseUid);
        
        if (userSession) {
            if (userSession.client) {
                await userSession.client.destroy();
            }
            
            const sessionDir = path.join(__dirname, '.wwebjs_auth_test', firebaseUid);
            if (fs.existsSync(sessionDir)) {
                await fs.promises.rm(sessionDir, { recursive: true, force: true });
            }
            
            firebaseUserClients.delete(firebaseUid);
            io.to(`firebase-user-${firebaseUid}`).emit('session_ended', { reason });
            
            logger.info(`Session test ${firebaseUid} nettoyée: ${reason}`);
        }
    } catch (error) {
        logger.error(`Erreur nettoyage session test ${firebaseUid}:`, error);
    }
}

// Routes API Firebase (version test)
app.post('/api/firebase/init', verifyFirebaseToken, async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        const userEmail = req.user.email;
        
        const existingSession = firebaseUserClients.get(firebaseUid);
        if (existingSession && existingSession.status === 'ready') {
            return res.json({ 
                success: true, 
                message: 'Session déjà active',
                status: 'ready',
                sessionId: existingSession.sessionId
            });
        }
        
        if (existingSession) {
            await cleanupFirebaseUserSession(firebaseUid, 'reinit');
        }
        
        const client = await createFirebaseUserClient(firebaseUid, userEmail);
        setupFirebaseClientEvents(firebaseUid, client);
        await client.initialize();
        
        res.json({ 
            success: true, 
            message: 'Session WhatsApp initialisée',
            sessionId: `whatsland-test-${firebaseUid}`
        });
        
    } catch (error) {
        logger.error('Erreur init test:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

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
        logger.error('Erreur status test:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

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
        logger.error('Erreur QR test:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/firebase/disconnect', verifyFirebaseToken, async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        await cleanupFirebaseUserSession(firebaseUid, 'user_requested');
        
        res.json({ success: true, message: 'Session WhatsApp fermée' });
    } catch (error) {
        logger.error('Erreur disconnect test:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/firebase/send-message', verifyFirebaseToken, async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        const { phoneNumber, message } = req.body;
        
        const userSession = firebaseUserClients.get(firebaseUid);
        if (!userSession || userSession.status !== 'ready') {
            return res.status(400).json({ 
                success: false, 
                message: 'Session WhatsApp non prête' 
            });
        }
        
        const client = userSession.client;
        const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
        
        await client.sendMessage(chatId, message);
        userSession.lastActivity = Date.now();
        
        res.json({ success: true, message: 'Message envoyé' });
        
    } catch (error) {
        logger.error('Erreur envoi message test:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/firebase/sessions', verifyFirebaseToken, async (req, res) => {
    try {
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
        logger.error('Erreur sessions test:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"], credentials: false }
});

io.on('connection', (socket) => {
    logger.info(`Nouvelle connexion Socket.IO: ${socket.id}`);
    
    socket.on('firebase_auth', async (token) => {
        try {
            const decodedToken = await mockFirebaseAuth.verifyIdToken(token);
            socket.firebaseUid = decodedToken.uid;
            socket.userEmail = decodedToken.email;
            socket.join(`firebase-user-${decodedToken.uid}`);
            
            socket.emit('firebase_authenticated', { 
                uid: decodedToken.uid,
                email: decodedToken.email
            });
            
            logger.info(`Utilisateur test authentifié: ${decodedToken.uid}`);
        } catch (error) {
            logger.error('Erreur auth Socket.IO test:', error);
            socket.emit('firebase_auth_error', { message: 'Token invalide' });
        }
    });
    
    socket.on('disconnect', (reason) => {
        if (socket.firebaseUid) {
            logger.info(`Utilisateur test ${socket.firebaseUid} déconnecté: ${reason}`);
        }
    });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    logger.info(`🚀 Serveur de test Firebase WhatsApp lancé sur http://${HOST}:${PORT}`);
    logger.info(`📱 Utilisez un token commençant par "test-token" pour l'authentification`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
    logger.info('Arrêt du serveur de test...');
    
    // Nettoyer toutes les sessions
    for (const [firebaseUid] of firebaseUserClients.entries()) {
        await cleanupFirebaseUserSession(firebaseUid, 'server_shutdown');
    }
    
    process.exit(0);
});