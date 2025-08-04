#!/usr/bin/env node

/**
 * Script de test pour vérifier les numéros de téléphone WhatsApp
 * Usage: node test-phone-numbers.js
 */

console.log('📱 Test de validation des numéros de téléphone WhatsApp');
console.log('==================================================');

// Fonction de formatage des numéros (copiée du backend)
function formatPhoneNumber(originalNumber) {
  let formattedNumber = originalNumber.trim().replace(/\s+/g, '');
  
  // Nettoyer le numéro (garder seulement les chiffres)
  let cleanNumber = formattedNumber.replace(/[^\d]/g, '');
  
  // Formatage pour le Maroc
  if (cleanNumber.startsWith('06') || cleanNumber.startsWith('07')) {
    cleanNumber = '212' + cleanNumber.substring(1);
  }
  
  // Supprimer les préfixes internationaux
  if (cleanNumber.startsWith('00212')) {
    cleanNumber = cleanNumber.substring(2);
  }
  
  // Ajouter le préfixe international si nécessaire
  if (!cleanNumber.startsWith('212')) {
    // Si ce n'est pas un numéro marocain, utiliser tel quel
    return originalNumber.trim();
  } else {
    // Format international pour WhatsApp
    return '+' + cleanNumber;
  }
}

// Numéros de test
const testNumbers = [
  '0657104984',
  '06 57 10 49 84',
  '+212657104984',
  '212657104984',
  '00212657104984',
  '657104984',
  '1234567890', // Numéro invalide
  '+1234567890' // Numéro international
];

console.log('\n🧪 Tests de formatage :');
console.log('=====================');

testNumbers.forEach((number, index) => {
  const formatted = formatPhoneNumber(number);
  const chatId = formatted.includes('@c.us') ? formatted : `${formatted}@c.us`;
  
  console.log(`${index + 1}. Original: "${number}"`);
  console.log(`   Formaté: "${formatted}"`);
  console.log(`   Chat ID: "${chatId}"`);
  console.log('');
});

console.log('\n📋 Recommandations :');
console.log('==================');
console.log('✅ Formats acceptés :');
console.log('   - 0657104984 (format local)');
console.log('   - +212657104984 (format international)');
console.log('   - 06 57 10 49 84 (avec espaces)');
console.log('');
console.log('❌ Problèmes courants :');
console.log('   - Numéros non enregistrés sur WhatsApp');
console.log('   - Numéros de test/fictifs');
console.log('   - Numéros de services (pas de WhatsApp)');
console.log('');
console.log('🔧 Solutions :');
console.log('   - Utilisez des numéros réels avec WhatsApp');
console.log('   - Vérifiez le format international (+212XXXXXXXXX)');
console.log('   - Testez avec votre propre numéro d\'abord');

console.log('\n🎯 Pour tester avec un vrai numéro :');
console.log('1. Utilisez votre propre numéro WhatsApp');
console.log('2. Vérifiez qu\'il est bien formaté : +212XXXXXXXXX');
console.log('3. Assurez-vous qu\'il est actif sur WhatsApp'); 