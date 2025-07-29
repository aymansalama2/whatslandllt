#!/bin/bash

# Script de déploiement WhatsLandLLT
# Usage: ./deploy-script.sh [SERVER_IP]

set -e

SERVER_IP=${1}
if [ -z "$SERVER_IP" ]; then
    echo "❌ Erreur: Veuillez fournir l'adresse IP du serveur"
    echo "Usage: ./deploy-script.sh [SERVER_IP]"
    exit 1
fi

echo "🚀 Déploiement de WhatsLandLLT sur ${SERVER_IP}"

# 1. Mettre à jour la configuration frontend
echo "📝 Configuration du frontend..."
sed -i "s/YOUR_SERVER_IP/${SERVER_IP}/g" frontend/.env.production

# 2. Build du frontend
echo "🔨 Build du frontend..."
cd frontend
npm install
npm run build
cd ..

# 3. Restart des services PM2
echo "🔄 Redémarrage des services..."
echo "Executez ces commandes sur votre VPS :"
echo ""
echo "# 1. Arrêter les anciens processus"
echo "pm2 stop all"
echo "pm2 delete all"
echo ""
echo "# 2. Démarrer avec la nouvelle configuration"
echo "pm2 start ecosystem.config.js"
echo ""
echo "# 3. Sauvegarder la configuration PM2"
echo "pm2 save"
echo "pm2 startup"
echo ""
echo "# 4. Vérifier le statut"
echo "pm2 status"
echo "pm2 logs --lines 50"

echo "✅ Configuration terminée !"
echo ""
echo "🔧 Configuration réseau requise sur le VPS :"
echo "1. Ouvrir le port 5001 : sudo ufw allow 5001"
echo "2. Ouvrir le port 3000 : sudo ufw allow 3000"
echo "3. Redémarrer le firewall : sudo ufw reload"
echo ""
echo "🌐 Accès à l'application :"
echo "Frontend: http://${SERVER_IP}:3000"
echo "Backend API: http://${SERVER_IP}:5001" 