#!/bin/bash

# Script pour corriger les problèmes CORS sur le VPS
echo "🔧 Correction des problèmes CORS..."

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "nginx-whatsland-corrected.conf" ]; then
    echo_error "Ce script doit être exécuté depuis le répertoire racine du projet (/var/www/whatslandllt)"
    exit 1
fi

# 1. Arrêter les services
echo "🛑 Arrêt des services..."
pm2 stop all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# 2. Sauvegarder la configuration nginx actuelle
echo "💾 Sauvegarde de la configuration nginx actuelle..."
sudo cp /etc/nginx/sites-available/whatsland /etc/nginx/sites-available/whatsland.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# 3. Copier la nouvelle configuration nginx
echo "📝 Mise à jour de la configuration nginx..."
sudo cp nginx-whatsland-corrected.conf /etc/nginx/sites-available/whatsland

# 4. Tester la configuration nginx
echo "🧪 Test de la configuration nginx..."
if sudo nginx -t; then
    echo_success "Configuration nginx valide"
else
    echo_error "Configuration nginx invalide, restauration de la sauvegarde..."
    sudo cp /etc/nginx/sites-available/whatsland.backup.* /etc/nginx/sites-available/whatsland 2>/dev/null || true
    exit 1
fi

# 5. Redémarrer nginx
echo "🔄 Redémarrage de nginx..."
sudo systemctl start nginx
sudo systemctl reload nginx

if sudo systemctl is-active --quiet nginx; then
    echo_success "Nginx redémarré avec succès"
else
    echo_error "Erreur lors du redémarrage de nginx"
    sudo systemctl status nginx
    exit 1
fi

# 6. Redémarrer les services PM2
echo "🚀 Redémarrage des services PM2..."
pm2 start ecosystem.config.js

# Attendre que les services démarrent
sleep 5

# 7. Vérification finale
echo "🔍 Vérification des services..."
pm2 status

if pm2 list | grep -q "online"; then
    echo_success "Services redémarrés avec succès"
    
    echo ""
    echo "🎉 Correction CORS terminée!"
    echo ""
    echo "📡 Tests à effectuer:"
    echo "   curl -I http://whatsland.click/test"
    echo "   curl -I http://whatsland.click/api/status"
    echo ""
    echo "🔧 Si les problèmes persistent:"
    echo "   1. Vérifiez les logs nginx: sudo tail -f /var/log/nginx/whatsland.error.log"
    echo "   2. Vérifiez les logs PM2: pm2 logs"
    echo "   3. Testez directement le backend: curl http://127.0.0.1:5001/test"
    
else
    echo_error "Certains services ont échoué au démarrage"
    pm2 logs --lines 20
    exit 1
fi