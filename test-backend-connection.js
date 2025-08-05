#!/usr/bin/env node

/**
 * Script de test pour vérifier la connectivité du backend WhatsLand
 * Usage: node test-backend-connection.js
 */

const http = require('http');
const https = require('https');

// URLs à tester
const testUrls = [
  { name: 'Backend Local', url: 'http://localhost:5001/test' },
  { name: 'Backend via Nginx', url: 'http://whatsland.click/api/test' },
  { name: 'Health Check', url: 'http://whatsland.click/api/health' },
  { name: 'Status Check', url: 'http://whatsland.click/api/status' }
];

console.log('🔍 Test de connectivité backend WhatsLand\n');

function testUrl(testConfig) {
  return new Promise((resolve) => {
    const { name, url } = testConfig;
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    console.log(`Testing ${name}: ${url}`);
    
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${name}: Status ${res.statusCode} (${duration}ms)`);
        
        try {
          const json = JSON.parse(data);
          if (json.status === 'ok' || json.status === 'healthy') {
            console.log(`   ➜ Response: ${json.message || json.status}`);
          }
        } catch (e) {
          console.log(`   ➜ Response: ${data.substring(0, 100)}...`);
        }
        
        resolve({ success: true, status: res.statusCode, duration, name });
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ ${name}: Error - ${error.message} (${duration}ms)`);
      resolve({ success: false, error: error.message, duration, name });
    });
    
    req.setTimeout(10000, () => {
      const duration = Date.now() - startTime;
      console.log(`⏰ ${name}: Timeout (${duration}ms)`);
      req.destroy();
      resolve({ success: false, error: 'Timeout', duration, name });
    });
  });
}

async function runTests() {
  const results = [];
  
  for (const testConfig of testUrls) {
    const result = await testUrl(testConfig);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  // Résumé
  console.log('📊 Résumé des tests:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Succès: ${successful.length}/${results.length}`);
  console.log(`❌ Échecs: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Tests échoués:');
    failed.forEach(f => {
      console.log(`   • ${f.name}: ${f.error}`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Tests réussis:');
    successful.forEach(s => {
      console.log(`   • ${s.name}: ${s.status} (${s.duration}ms)`);
    });
  }
  
  // Recommandations
  console.log('\n💡 Recommandations:');
  if (failed.some(f => f.name.includes('Local'))) {
    console.log('   • Vérifiez que le backend est démarré: npm start dans /backend');
  }
  if (failed.some(f => f.name.includes('Nginx'))) {
    console.log('   • Vérifiez que nginx est démarré et la configuration est correcte');
  }
  if (failed.length === 0) {
    console.log('   • Tout semble fonctionner correctement ! 🎉');
  }
  
  process.exit(failed.length > 0 ? 1 : 0);
}

runTests().catch(console.error);