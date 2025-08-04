const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Configuration Firebase Admin SDK avec gestion robuste des credentials
const firebaseConfig = {
  projectId: "watsland-96923",
  databaseURL: "https://watsland-96923-default-rtdb.firebaseio.com"
};

// Initialiser Firebase Admin SDK avec plusieurs méthodes d'authentification
if (!admin.apps.length) {
  try {
    let initConfig = {
      projectId: firebaseConfig.projectId,
      databaseURL: firebaseConfig.databaseURL
    };

    // Méthode 1: Service Account Key file
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      console.log('🔑 Utilisation du service account key file');
      const serviceAccount = require(serviceAccountPath);
      initConfig.credential = admin.credential.cert(serviceAccount);
    }
    
    // Méthode 2: Variables d'environnement
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔑 Utilisation des variables d\'environnement Firebase');
      initConfig.credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      });
    }
    
    // Méthode 3: Mode développement/test sans authentification
    else {
      console.log('⚠️ Mode développement - Firebase Admin SDK sans credentials');
      console.log('⚠️ Certaines fonctionnalités Firebase ne seront pas disponibles');
      // On continue sans credentials pour le développement
    }

    admin.initializeApp(initConfig);
    console.log('✅ Firebase Admin SDK initialisé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin:', error.message);
    
    // Fallback : Mode mock/développement
    console.log('🔧 Basculement en mode fallback...');
    try {
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
        databaseURL: firebaseConfig.databaseURL
      });
      console.log('⚠️ Firebase initialisé en mode fallback (fonctionnalités limitées)');
    } catch (fallbackError) {
      console.error('❌ Échec total d\'initialisation Firebase:', fallbackError.message);
    }
  }
}

const db = admin.firestore();
const auth = admin.auth();
const realtimeDb = admin.database();

module.exports = {
  admin,
  db,
  auth,
  realtimeDb
};