#!/bin/bash

# Script de déploiement sécurisé WhatsLand pour whatsland.click

echo "🚀 Démarrage du déploiement sécurisé WhatsLand..."

# Aller dans le répertoire du projet
cd /var/www/whatslandllt

# Sauvegarder les changements locaux
echo "💾 Sauvegarde des changements locaux..."
git stash push -m "Local changes before security deployment $(date)"

# Récupérer les derniers changements
echo "⬇️ Récupération des changements sécurisés depuis GitHub..."
git fetch origin main
git reset --hard origin/main

# Installer toutes les dépendances de sécurité
echo "🛡️ Installation des dépendances de sécurité..."
cd backend
npm install helmet express-rate-limit express-validator firebase-admin
cd ..

# Créer les répertoires nécessaires
echo "📁 Création des répertoires sécurisés..."
mkdir -p backend/.wwebjs_auth/firebase
mkdir -p logs
chmod 750 backend/.wwebjs_auth/firebase
chmod 750 logs

# Nettoyer les anciennes sessions et fichiers de test
echo "🧹 Nettoyage complet des sessions et fichiers de test..."
rm -rf backend/.wwebjs_auth/session-whatsland-*
rm -rf backend/.wwebjs_cache
rm -rf test-*
rm -rf .wwebjs_auth_test

# Configurer les variables d'environnement pour production
echo "🔐 Configuration des variables d'environnement..."
cd backend
if [ ! -f .env ]; then
  echo "NODE_ENV=production" > .env
  echo "DOMAIN=whatsland.click" >> .env
  echo "FRONTEND_URL=https://whatsland.click" >> .env
  echo "BACKEND_URL=https://whatsland.click:5001" >> .env
  echo "LOG_LEVEL=ERROR" >> .env
  echo "RATE_LIMIT_MAX=100" >> .env
  echo "ADMIN_EMAILS=houssnijob@gmail.com,ayman@gmail.com" >> .env
  echo "✅ Fichier .env créé"
else
  echo "ℹ️ Fichier .env existant conservé"
fi
cd ..

# Arrêter les services PM2
echo "⏹️ Arrêt des services PM2..."
pm2 stop all

# Redémarrer avec la nouvelle configuration sécurisée
echo "🔄 Redémarrage avec sécurité renforcée..."
pm2 start ecosystem.config.js --env production

# Attendre que les services démarrent
echo "⏳ Attente du démarrage sécurisé..."
sleep 15

# Vérifier le statut
echo "✅ Vérification du statut des services..."
pm2 status

# Test de santé
echo "🏥 Test de santé du serveur..."
curl -s https://whatsland.click:5001/health | head -5

# Afficher les logs récents
echo "📋 Logs récents du backend sécurisé..."
pm2 logs --lines 10

echo ""
echo "🎉 Déploiement sécurisé terminé !"
echo ""
echo "🌐 WhatsLand disponible sur: https://whatsland.click"
echo "🔗 APIs Firebase sécurisées:"
echo "   POST https://whatsland.click:5001/api/firebase/init"
echo "   GET  https://whatsland.click:5001/api/firebase/status"
echo "   GET  https://whatsland.click:5001/api/firebase/qrcode"
echo "   POST https://whatsland.click:5001/api/firebase/send-message"
echo "   POST https://whatsland.click:5001/api/firebase/disconnect"
echo "   GET  https://whatsland.click:5001/api/firebase/sessions"
echo ""
echo "🛡️ Sécurité activée:"
echo "   ✅ CORS restreint à whatsland.click"
echo "   ✅ Rate limiting activé"
echo "   ✅ Headers de sécurité Helmet"
echo "   ✅ Validation des entrées"
echo "   ✅ Tokens de test supprimés"
echo "   ✅ Logs de production optimisés"
echo ""
echo "📊 Monitoring: https://whatsland.click:5001/health"