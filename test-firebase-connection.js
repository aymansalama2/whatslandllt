#!/usr/bin/env node

/**
 * Script de test pour vérifier la connexion Firebase Admin SDK
 * Usage: node test-firebase-connection.js
 */

console.log('🔥 Test de connexion Firebase Admin SDK');
console.log('========================================');

try {
    // Charger la configuration Firebase
    const { admin, auth, db, realtimeDb } = require('./backend/firebase-admin-config');
    
    console.log('✅ Firebase Admin SDK chargé avec succès');
    
    // Test 1: Vérifier l'initialisation
    const app = admin.app();
    console.log(`✅ App Firebase initialisée: ${app.name}`);
    console.log(`📁 Project ID: ${app.options.projectId}`);
    console.log(`🗄️ Database URL: ${app.options.databaseURL}`);
    
    // Test 2: Test Auth (si credentials disponibles)
    console.log('\n🔐 Test Firebase Auth...');
    auth.listUsers(1)
        .then((userRecord) => {
            console.log('✅ Firebase Auth fonctionne correctement');
            console.log(`👥 Utilisateurs trouvés: ${userRecord.users.length}`);
        })
        .catch((error) => {
            console.log('⚠️ Firebase Auth limité (credentials manquants)');
            console.log(`   Erreur: ${error.message}`);
        });
    
    // Test 3: Test Firestore (si credentials disponibles)
    console.log('\n🗃️ Test Firestore...');
    db.collection('test').limit(1).get()
        .then((snapshot) => {
            console.log('✅ Firestore fonctionne correctement');
            console.log(`📄 Documents de test: ${snapshot.size}`);
        })
        .catch((error) => {
            console.log('⚠️ Firestore limité (credentials manquants)');
            console.log(`   Erreur: ${error.message}`);
        });
    
    // Test 4: Test Realtime Database
    console.log('\n⚡ Test Realtime Database...');
    realtimeDb.ref('test').once('value')
        .then((snapshot) => {
            console.log('✅ Realtime Database fonctionne correctement');
            console.log(`🔍 Valeur test: ${snapshot.val()}`);
        })
        .catch((error) => {
            console.log('⚠️ Realtime Database limité (credentials manquants)');
            console.log(`   Erreur: ${error.message}`);
        });
    
    console.log('\n🧪 Tests lancés. Résultats ci-dessus.');
    console.log('\n📋 RECOMMANDATIONS:');
    console.log('- Si vous voyez des erreurs de credentials, configurez votre service account key');
    console.log('- Utilisez ./setup-firebase-credentials.sh pour la configuration');
    console.log('- Pour production, utilisez un service account key file');
    
} catch (error) {
    console.error('❌ Erreur lors du test Firebase:', error.message);
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. Vérifiez que firebase-admin est installé: npm install firebase-admin');
    console.log('2. Configurez vos credentials Firebase avec ./setup-firebase-credentials.sh');
    console.log('3. Vérifiez votre configuration dans backend/firebase-admin-config.js');
    
    process.exit(1);
}