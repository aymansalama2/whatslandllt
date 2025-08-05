/**
 * Configuration Firebase Admin SDK optimisée
 * Utilise le nouveau FirebaseManager pour une gestion robuste
 */

const firebaseManager = require('./services/firebaseManager');

// Initialiser Firebase de manière asynchrone
let firebaseServices = null;
let initializationPromise = null;

/**
 * Obtenir les services Firebase (lazy loading)
 */
async function getFirebaseServices() {
  if (firebaseServices) {
    return firebaseServices;
  }

  if (!initializationPromise) {
    initializationPromise = firebaseManager.initialize();
  }

  try {
    firebaseServices = await initializationPromise;
    return firebaseServices;
  } catch (error) {
    console.error('❌ Erreur récupération services Firebase:', error.message);
    // Retourner les services en mode fallback
    return firebaseManager.getFallbackServices();
  }
}

/**
 * Services Firebase avec gestion d'erreur
 */
const firebaseProxy = {
  // Admin SDK
  get admin() {
    return getFirebaseServices().then(services => services.admin);
  },

  // Firestore
  get db() {
    return getFirebaseServices().then(services => services.db);
  },

  // Authentication
  get auth() {
    return getFirebaseServices().then(services => services.auth);
  },

  // Realtime Database
  get realtimeDb() {
    return getFirebaseServices().then(services => services.realtimeDb);
  },

  // Méthodes utilitaires
  async verifyToken(token) {
    const services = await getFirebaseServices();
    if (!services.auth) {
      throw new Error('Firebase Auth non disponible');
    }
    return firebaseManager.verifyToken(token);
  },

  async getUser(uid) {
    const services = await getFirebaseServices();
    if (!services.auth) {
      throw new Error('Firebase Auth non disponible');
    }
    return firebaseManager.getUser(uid);
  },

  // Statut Firebase
  getStatus() {
    return firebaseManager.getStatus();
  },

  // Réinitialisation
  async reset() {
    firebaseServices = null;
    initializationPromise = null;
    return firebaseManager.reset();
  }
};

// Export des services avec compatibilité ascendante
module.exports = firebaseProxy;

// Export direct du manager pour usage avancé
module.exports.firebaseManager = firebaseManager;

// Initialisation automatique en arrière-plan
getFirebaseServices().catch(error => {
  console.warn('⚠️ Initialisation Firebase en arrière-plan échouée:', error.message);
});