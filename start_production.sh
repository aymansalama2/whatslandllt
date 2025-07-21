#!/bin/bash
# Script de démarrage pour WhatsLand en production

# Build du frontend
echo "📦 Build du frontend..."
cd frontend
npm run build

# Démarrage du backend
echo "🚀 Démarrage du backend..."
cd ../backend
node server.js
