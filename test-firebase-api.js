// Script de test pour les APIs Firebase WhatsApp
const fetch = require('node-fetch');

// Configuration de test
const API_BASE = 'http://localhost:5001/api/firebase';
const TEST_TOKEN = 'test-token-' + Date.now(); // Token de test fictif

// Fonction utilitaire pour les requêtes
async function makeRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...options.headers
    };

    console.log(`\n🔄 ${options.method || 'GET'} ${url}`);
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(data, null, 2));
        
        return { success: response.ok, data, status: response.status };
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Tests
async function runTests() {
    console.log('🚀 Démarrage des tests Firebase WhatsApp API');
    console.log('=' .repeat(50));

    // Test 1: Vérifier le statut sans session
    console.log('\n📋 Test 1: Vérifier le statut sans session');
    await makeRequest('/status');

    // Test 2: Initialiser une session WhatsApp
    console.log('\n📋 Test 2: Initialiser une session WhatsApp');
    await makeRequest('/init', { method: 'POST' });

    // Test 3: Vérifier le statut après initialisation
    console.log('\n📋 Test 3: Vérifier le statut après initialisation');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre 3 secondes
    await makeRequest('/status');

    // Test 4: Obtenir le QR code
    console.log('\n📋 Test 4: Obtenir le QR code');
    await makeRequest('/qrcode');

    // Test 5: Tenter d'envoyer un message (devrait échouer car pas authentifié)
    console.log('\n📋 Test 5: Tenter d\'envoyer un message');
    await makeRequest('/send-message', {
        method: 'POST',
        body: JSON.stringify({
            phoneNumber: '+33123456789',
            message: 'Test message depuis API'
        })
    });

    // Test 6: Obtenir les sessions (test admin)
    console.log('\n📋 Test 6: Obtenir les sessions actives');
    await makeRequest('/sessions');

    // Test 7: Déconnecter la session
    console.log('\n📋 Test 7: Déconnecter la session');
    await makeRequest('/disconnect', { method: 'POST' });

    // Test 8: Vérifier le statut après déconnexion
    console.log('\n📋 Test 8: Vérifier le statut après déconnexion');
    await makeRequest('/status');

    console.log('\n🏁 Tests terminés');
    console.log('=' .repeat(50));
}

// Fonction pour tester sans authentification Firebase (devrait échouer)
async function testWithoutAuth() {
    console.log('\n🔒 Test sans authentification Firebase');
    
    const response = await fetch(`${API_BASE}/status`, {
        headers: { 'Content-Type': 'application/json' }
        // Pas d'Authorization header
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
}

// Exécuter les tests
async function main() {
    console.log('🧪 Tests de l\'API Firebase WhatsApp');
    console.log('Note: Ces tests utilisent un token fictif et peuvent échouer');
    console.log('Pour des tests complets, utilisez la page HTML avec une vraie authentification Firebase');
    
    // Test sans auth
    await testWithoutAuth();
    
    // Tests avec token fictif (vont probablement échouer à cause de l'auth Firebase)
    console.log('\n' + '='.repeat(50));
    console.log('Tests avec token fictif (attendu: erreurs d\'authentification)');
    await runTests();
    
    process.exit(0);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { makeRequest, runTests };