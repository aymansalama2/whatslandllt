#!/bin/bash

# Script pour résoudre les problèmes de connexion WhatsApp
# À exécuter sur le serveur VPS

echo "🔧 Début du processus de réparation WhatsApp..."

# 1. Arrêter les services PM2
echo "⏹️ Arrêt des services PM2..."
pm2 stop all

# 2. Tuer tous les processus Chrome/Chromium
echo "🔄 Nettoyage des processus Chrome..."
pkill -f chrome
pkill -f chromium
pkill -f "Google Chrome"
rm -rf /tmp/.org.chromium.Chromium*
rm -rf /tmp/.com.google.Chrome*
rm -rf /tmp/puppeteer_dev_chrome_profile-*

# 3. Créer les répertoires nécessaires
echo "📁 Création des répertoires d'authentification..."
mkdir -p /var/www/whatslandllt/backend/.wwebjs_auth
mkdir -p /var/www/whatslandllt/backend/.wwebjs_cache
chmod -R 777 /var/www/whatslandllt/backend/.wwebjs_auth
chmod -R 777 /var/www/whatslandllt/backend/.wwebjs_cache

# 4. Mettre à jour la configuration Puppeteer dans server.js
echo "🔧 Mise à jour de la configuration Puppeteer..."
sed -i 's|executablePath: .*/usr/bin/chromium-browser.*|executablePath: "/usr/bin/chromium",|g' /var/www/whatslandllt/backend/server.js

# 5. Vérifier les dépendances Chromium
echo "🔍 Vérification des dépendances Chromium..."
yum install -y nss freetype freetype-devel fontconfig fontconfig-devel libstdc++ dbus-glib libXt

# 6. Redémarrer les services
echo "▶️ Redémarrage des services PM2..."
pm2 restart all

echo "✅ Processus de réparation terminé!"
echo "📱 Essayez maintenant de vous connecter à WhatsApp depuis l'interface."