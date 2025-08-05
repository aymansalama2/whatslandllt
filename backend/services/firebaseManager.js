const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs').promises;

/**
 * Gestionnaire Firebase avec initialisation robuste et système de retry
 * Gère l'authentification via fichier service account ou variables d'environnement
 */
class FirebaseManager {
    constructor() {
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 secondes
        this.app = null;
        this.db = null;
        this.auth = null;
        this.realtimeDb = null;
        this.lastError = null;
    }

    /**
     * Vérifier si un fichier existe
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Charger les credentials depuis le fichier service account
     */
    async loadServiceAccountCredentials() {
        const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
        
        if (await this.fileExists(serviceAccountPath)) {
            try {
                const serviceAccountContent = await fs.readFile(serviceAccountPath, 'utf8');
                const serviceAccount = JSON.parse(serviceAccountContent);
                
                // Valider les champs requis
                if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
                    throw new Error('Service account incomplet: champs requis manquants');
                }
                
                console.log('🔑 Service account key trouvé et validé');
                return serviceAccount;
                
            } catch (error) {
                console.warn('⚠️ Erreur lecture service account:', error.message);
                return null;
            }
        }
        
        console.log('ℹ️ Aucun fichier service account trouvé');
        return null;
    }

    /**
     * Charger les credentials depuis les variables d'environnement
     */
    loadEnvironmentCredentials() {
        const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.log(`ℹ️ Variables d'environnement manquantes: ${missingVars.join(', ')}`);
            return null;
        }
        
        try {
            const credentials = {
                project_id: process.env.FIREBASE_PROJECT_ID,
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            };
            
            console.log('🔑 Credentials Firebase chargés depuis les variables d\'environnement');
            return credentials;
            
        } catch (error) {
            console.warn('⚠️ Erreur traitement variables d\'environnement:', error.message);
            return null;
        }
    }

    /**
     * Obtenir la configuration Firebase
     */
    getFirebaseConfig() {
        return {
            projectId: process.env.FIREBASE_PROJECT_ID || "watsland-96923",
            databaseURL: process.env.FIREBASE_DATABASE_URL || "https://watsland-96923-default-rtdb.firebaseio.com"
        };
    }

    /**
     * Initialiser Firebase avec retry automatique
     */
    async initialize() {
        if (this.initialized) {
            console.log('ℹ️ Firebase déjà initialisé');
            return this.getServices();
        }

        // Éviter les initialisations multiples simultanées
        if (admin.apps.length > 0) {
            console.log('ℹ️ Application Firebase déjà présente');
            this.app = admin.apps[0];
            return this.setupServices();
        }

        while (this.retryCount < this.maxRetries) {
            try {
                this.retryCount++;
                console.log(`🔄 Tentative d'initialisation Firebase ${this.retryCount}/${this.maxRetries}...`);
                
                await this.performInitialization();
                
                this.initialized = true;
                this.retryCount = 0;
                this.lastError = null;
                
                console.log('✅ Firebase initialisé avec succès');
                return this.getServices();
                
            } catch (error) {
                this.lastError = error;
                console.error(`❌ Tentative ${this.retryCount}/${this.maxRetries} échouée:`, error.message);
                
                if (this.retryCount < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Backoff exponentiel
                    console.log(`⏳ Attente de ${delay/1000}s avant nouvelle tentative...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('❌ Échec de l\'initialisation Firebase après toutes les tentatives');
                    return this.getFallbackServices();
                }
            }
        }
    }

    /**
     * Effectuer l'initialisation Firebase
     */
    async performInitialization() {
        const config = this.getFirebaseConfig();
        let initConfig = {
            projectId: config.projectId,
            databaseURL: config.databaseURL
        };

        // Tentative 1: Service Account File
        const serviceAccount = await this.loadServiceAccountCredentials();
        if (serviceAccount) {
            initConfig.credential = admin.credential.cert(serviceAccount);
            console.log('🔑 Utilisation du service account file');
        }
        // Tentative 2: Variables d'environnement
        else {
            const envCredentials = this.loadEnvironmentCredentials();
            if (envCredentials) {
                initConfig.credential = admin.credential.cert(envCredentials);
                console.log('🔑 Utilisation des variables d\'environnement');
            }
            // Tentative 3: Mode par défaut (peut fonctionner sur Google Cloud)
            else {
                console.log('⚠️ Tentative d\'initialisation avec credentials par défaut...');
                // Laisser Firebase utiliser les credentials par défaut (ADC)
            }
        }

        this.app = admin.initializeApp(initConfig);
        await this.setupServices();
        
        // Test de connectivité
        await this.testConnection();
    }

    /**
     * Configurer les services Firebase
     */
    async setupServices() {
        try {
            this.db = admin.firestore();
            this.auth = admin.auth();
            this.realtimeDb = admin.database();
            
            // Configuration Firestore
            this.db.settings({
                ignoreUndefinedProperties: true,
                timestampsInSnapshots: true
            });
            
            console.log('✅ Services Firebase configurés');
        } catch (error) {
            throw new Error(`Erreur configuration services: ${error.message}`);
        }
    }

    /**
     * Tester la connexion Firebase
     */
    async testConnection() {
        try {
            // Test Auth
            await this.auth.listUsers(1);
            console.log('✅ Connexion Firebase Auth testée');
            
            // Test Firestore (tentative douce)
            try {
                const testDoc = this.db.collection('_test').doc('_connection');
                await testDoc.get();
                console.log('✅ Connexion Firestore testée');
            } catch (firestoreError) {
                console.warn('⚠️ Test Firestore échoué:', firestoreError.message);
            }
            
        } catch (error) {
            throw new Error(`Test de connexion échoué: ${error.message}`);
        }
    }

    /**
     * Obtenir les services Firebase
     */
    getServices() {
        return {
            admin: this.app,
            db: this.db,
            auth: this.auth,
            realtimeDb: this.realtimeDb,
            initialized: this.initialized
        };
    }

    /**
     * Services en mode fallback (fonctionnalités limitées)
     */
    getFallbackServices() {
        console.log('⚠️ Utilisation des services Firebase en mode fallback');
        
        // Services mock pour éviter les erreurs
        const mockService = {
            // Auth mock
            verifyIdToken: async () => {
                throw new Error('Firebase Auth non disponible');
            },
            listUsers: async () => {
                throw new Error('Firebase Auth non disponible');
            }
        };

        return {
            admin: null,
            db: null,
            auth: mockService,
            realtimeDb: null,
            initialized: false,
            error: this.lastError
        };
    }

    /**
     * Vérifier un token d'authentification
     */
    async verifyToken(token) {
        if (!this.initialized || !this.auth) {
            throw new Error('Firebase Auth non initialisé');
        }
        
        try {
            const decodedToken = await this.auth.verifyIdToken(token);
            console.log(`✅ Token Firebase vérifié pour utilisateur: ${decodedToken.uid}`);
            return decodedToken;
        } catch (error) {
            console.error('❌ Erreur vérification token Firebase:', error.message);
            throw new Error(`Token invalide: ${error.message}`);
        }
    }

    /**
     * Obtenir un utilisateur par UID
     */
    async getUser(uid) {
        if (!this.initialized || !this.auth) {
            throw new Error('Firebase Auth non initialisé');
        }
        
        try {
            const userRecord = await this.auth.getUser(uid);
            return userRecord;
        } catch (error) {
            console.error(`❌ Erreur récupération utilisateur ${uid}:`, error.message);
            throw new Error(`Utilisateur non trouvé: ${error.message}`);
        }
    }

    /**
     * Obtenir le statut du gestionnaire Firebase
     */
    getStatus() {
        return {
            initialized: this.initialized,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            lastError: this.lastError ? this.lastError.message : null,
            services: {
                auth: !!this.auth,
                firestore: !!this.db,
                realtimeDb: !!this.realtimeDb
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Réinitialiser le gestionnaire Firebase
     */
    async reset() {
        console.log('🔄 Réinitialisation du gestionnaire Firebase...');
        
        this.initialized = false;
        this.retryCount = 0;
        this.lastError = null;
        
        // Nettoyer les services existants
        this.app = null;
        this.db = null;
        this.auth = null;
        this.realtimeDb = null;
        
        // Supprimer les apps existantes
        const apps = admin.apps.slice();
        for (const app of apps) {
            try {
                await app.delete();
            } catch (error) {
                console.warn('⚠️ Erreur suppression app Firebase:', error.message);
            }
        }
        
        console.log('✅ Gestionnaire Firebase réinitialisé');
    }
}

// Instance singleton
const firebaseManager = new FirebaseManager();

module.exports = firebaseManager;