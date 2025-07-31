#!/bin/bash

# Script de déploiement du système Firebase multi-utilisateurs sur le VPS

echo "🚀 Démarrage du déploiement du système Firebase multi-utilisateurs..."

# Aller dans le répertoire du projet
cd /var/www/whatslandllt

# Sauvegarder les changements locaux
echo "💾 Sauvegarde des changements locaux..."
git stash push -m "Local changes before Firebase deployment $(date)"

# Récupérer les derniers changements
echo "⬇️ Récupération des changements depuis GitHub..."
git fetch origin main
git reset --hard origin/main

# Installer firebase-admin si nécessaire
echo "📦 Installation des dépendances Firebase..."
cd backend
npm install firebase-admin
cd ..

# Créer le répertoire pour les sessions Firebase s'il n'existe pas
echo "📁 Création des répertoires de sessions Firebase..."
mkdir -p backend/.wwebjs_auth/firebase
chmod 755 backend/.wwebjs_auth/firebase

# Nettoyer les anciennes sessions de test
echo "🧹 Nettoyage des anciennes sessions..."
rm -rf backend/.wwebjs_auth/session-whatsland-*
rm -rf backend/.wwebjs_cache

# Arrêter les services PM2
echo "⏹️ Arrêt des services PM2..."
pm2 stop all

# Redémarrer les services
echo "🔄 Redémarrage des services..."
pm2 start ecosystem.config.js --env production

# Attendre que les services démarrent
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier le statut
echo "✅ Vérification du statut des services..."
pm2 status

# Afficher les logs récents
echo "📋 Logs récents du backend..."
pm2 logs backend --lines 20

echo "🎉 Déploiement terminé !"
echo "🔗 APIs Firebase disponibles:"
echo "   POST http://92.113.31.157:5001/api/firebase/init"
echo "   GET  http://92.113.31.157:5001/api/firebase/status"
echo "   GET  http://92.113.31.157:5001/api/firebase/qrcode"
echo "   POST http://92.113.31.157:5001/api/firebase/send-message"
echo "   POST http://92.113.31.157:5001/api/firebase/disconnect"
echo "   GET  http://92.113.31.157:5001/api/firebase/sessions"