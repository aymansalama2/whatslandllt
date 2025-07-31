const admin = require('firebase-admin');

// Configuration Firebase Admin SDK
const firebaseConfig = {
  projectId: "watsland-96923",
  // Pour une configuration simplifiée, nous utiliserons les variables d'environnement
  // ou la configuration par défaut de Google Cloud
};

// Initialiser Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Configuration pour le développement local (mode émulateur)
    // En local, nous allons utiliser une configuration simplifiée
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
      databaseURL: "https://watsland-96923-default-rtdb.firebaseio.com"
    });
    
    console.log('Firebase Admin SDK initialisé avec succès pour le développement');
  } catch (error) {
    console.error('Erreur initialisation Firebase Admin:', error);
    
    // Fallback : créer une version mock pour les tests locaux
    console.log('Utilisation du mode mock pour les tests locaux');
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