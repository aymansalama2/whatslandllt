#!/bin/bash

echo "🔧 Redémarrage avec les corrections WhatsApp..."

# Aller dans le bon répertoire
cd /whatslandllt/whatslandllt

# 1. Arrêter tous les services PM2
echo "🛑 Arrêt des services PM2..."
pm2 stop all
pm2 delete all

# 2. Nettoyer agressivement tous les processus Chrome
echo "🧹 Nettoyage des processus Chrome..."
pkill -9 -f chrome 2>/dev/null || true
pkill -9 -f chromium 2>/dev/null || true
pkill -9 -f "google-chrome" 2>/dev/null || true
pkill -9 -f puppeteer 2>/dev/null || true
killall -9 chrome 2>/dev/null || true
killall -9 chromium 2>/dev/null || true
killall -9 google-chrome-stable 2>/dev/null || true

# 3. Nettoyer les répertoires temporaires
echo "🗂️ Nettoyage des répertoires temporaires..."
rm -rf /tmp/.org.chromium.Chromium* 2>/dev/null || true
rm -rf /tmp/.com.google.Chrome* 2>/dev/null || true
rm -rf /tmp/puppeteer_dev_chrome_profile-* 2>/dev/null || true
rm -rf /tmp/chrome-user-data-* 2>/dev/null || true
rm -rf /tmp/chromium-* 2>/dev/null || true
rm -rf /dev/shm/.org.chromium.Chromium* 2>/dev/null || true
rm -rf /dev/shm/.com.google.Chrome* 2>/dev/null || true

# 4. Nettoyer les répertoires de session WhatsApp
echo "🧹 Nettoyage des sessions WhatsApp..."
cd backend
rm -rf .wwebjs_auth 2>/dev/null || true
rm -rf .wwebjs_cache 2>/dev/null || true
rm -rf session_data 2>/dev/null || true
rm -rf .chromium-browser-snapshots 2>/dev/null || true
rm -rf Default 2>/dev/null || true
rm -f chrome_debug.log 2>/dev/null || true

# 5. Exporter les variables d'environnement pour Chrome
echo "🌐 Configuration de l'environnement Chrome..."
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export CHROME_BIN="/usr/bin/google-chrome-stable"
export CHROME_PATH="/usr/bin/google-chrome-stable"
export NODE_OPTIONS="--expose-gc --max-old-space-size=4096"

# 6. Attendre un moment pour s'assurer que tout est nettoyé
echo "⏳ Attente de 5 secondes..."
sleep 5

# 7. Démarrer le backend avec les nouveaux paramètres optimisés
echo "🚀 Démarrage du backend optimisé..."
pm2 start server.js --name 'backend' \
  --node-args="--expose-gc --max-old-space-size=4096" \
  --max-memory-restart 2G \
  --max-restarts 10 \
  --min-uptime 30s \
  --restart-delay 10000 \
  --log-date-format="YYYY-MM-DD HH:mm:ss" \
  --merge-logs

# 8. Attendre que le backend se stabilise
echo "⏳ Attente du démarrage du backend..."
sleep 10

# 9. Démarrer le frontend
echo "🌐 Démarrage du frontend..."
cd ../frontend
pm2 start 'npm run preview -- --host 0.0.0.0 --port 4173' --name 'frontend'

# 10. Afficher le statut
echo "📊 Statut des services:"
pm2 status

echo "✅ Redémarrage terminé!"
echo "🌐 Frontend accessible sur: http://92.113.31.157:4173"
echo "🔧 Backend accessible sur: http://92.113.31.157:5001"
echo ""
echo "📜 Pour voir les logs en temps réel:"
echo "pm2 logs"
echo ""
echo "🔍 Pour voir les logs du backend uniquement:"
echo "pm2 logs backend"