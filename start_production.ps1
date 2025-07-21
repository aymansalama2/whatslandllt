# Script de démarrage pour WhatsLand en production

# Build du frontend
Write-Host "📦 Build du frontend..."
cd frontend
npm run build

# Démarrage du backend
Write-Host "🚀 Démarrage du backend..."
cd ../backend
node server.js
