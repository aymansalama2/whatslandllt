#!/bin/bash

# Script pour corriger les problèmes WhatsApp et redémarrer le service
echo "🔧 Application des correctifs WhatsApp..."

# Arrêter le service actuel
echo "🛑 Arrêt du service WhatsApp..."
pm2 stop whatsland 2>/dev/null || true
pm2 delete whatsland 2>/dev/null || true

# Nettoyer les processus Chrome orphelins
echo "🧹 Nettoyage des processus Chrome..."
pkill -f "google-chrome" 2>/dev/null || true
pkill -f "chromium" 2>/dev/null || true
pkill -f "puppeteer" 2>/dev/null || true

# Nettoyer les répertoires temporaires
echo "🧹 Nettoyage des répertoires temporaires..."
rm -rf /tmp/whatsapp-profile-* 2>/dev/null || true
rm -rf /tmp/puppeteer-chrome-userdata-* 2>/dev/null || true
rm -rf /tmp/chrome-* 2>/dev/null || true

# Attendre un peu
sleep 3

# Redémarrer le service
echo "🚀 Redémarrage du service WhatsApp..."
cd /var/www/whatslandllt/backend
pm2 start ecosystem.config.js --name whatsland

# Vérifier le statut
echo "📊 Vérification du statut..."
sleep 5
pm2 status whatsland

echo "✅ Correctifs appliqués et service redémarré"
echo "📝 Logs disponibles avec: pm2 logs whatsland"