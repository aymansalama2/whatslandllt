#!/bin/bash

# Script de déploiement pour WhatsLandLLT
echo "🚀 Démarrage du déploiement WhatsLandLLT..."

# Configuration des variables
SERVER_IP="92.113.31.157"
BACKEND_PORT="5001"
FRONTEND_PORT="3000"

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
if [ ! -f "ecosystem.config.js" ]; then
    echo_error "Ce script doit être exécuté depuis le répertoire racine du projet (/var/www/whatslandllt)"
    exit 1
fi

# 1. Nettoyer les anciens processus PM2
echo "🧹 Nettoyage des anciens processus PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo_success "Processus PM2 nettoyés"

# 2. Configuration du firewall (si disponible)
echo "🔥 Configuration du firewall..."
if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow $BACKEND_PORT
    sudo ufw allow $FRONTEND_PORT
    sudo ufw reload
    echo_success "Firewall UFW configuré"
elif command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --permanent --add-port=$BACKEND_PORT/tcp
    sudo firewall-cmd --permanent --add-port=$FRONTEND_PORT/tcp
    sudo firewall-cmd --reload
    echo_success "Firewall firewalld configuré"
else
    echo_warning "Aucun firewall détecté (ufw/firewalld). Configurez manuellement les ports $BACKEND_PORT et $FRONTEND_PORT"
fi

# 3. Configuration du backend
echo "⚙️ Configuration du backend..."
cd backend
if [ ! -f "node_modules/.installed" ]; then
    echo "📦 Installation des dépendances backend..."
    npm install
    touch node_modules/.installed
    echo_success "Dépendances backend installées"
else
    echo_success "Dépendances backend déjà installées"
fi
cd ..

# 4. Configuration du frontend
echo "🎨 Configuration du frontend..."
cd frontend

# Créer le fichier .env.production s'il n'existe pas
if [ ! -f ".env.production" ]; then
    echo "📝 Création du fichier .env.production..."
    cat > .env.production << EOF
VITE_API_URL=http://$SERVER_IP:$BACKEND_PORT
EOF
    echo_success "Fichier .env.production créé"
fi

# Vérifier/installer serve globalement
if ! command -v serve >/dev/null 2>&1; then
    echo "📦 Installation de serve..."
    npm install -g serve
    echo_success "Serve installé globalement"
fi

# Installation des dépendances frontend
if [ ! -f "node_modules/.installed" ]; then
    echo "📦 Installation des dépendances frontend..."
    rm -rf node_modules package-lock.json
    npm cache clean --force
    npm install --legacy-peer-deps
    touch node_modules/.installed
    echo_success "Dépendances frontend installées"
else
    echo_success "Dépendances frontend déjà installées"
fi

# Build du frontend avec les variables d'environnement
echo "🔨 Construction du frontend..."
export VITE_API_URL=http://$SERVER_IP:$BACKEND_PORT
npm run build

# Vérifier que le build contient la bonne URL
if grep -q "$SERVER_IP" dist/assets/*.js 2>/dev/null; then
    echo_success "Build réussi avec la bonne configuration"
else
    echo_warning "L'URL serveur pourrait ne pas être correctement intégrée dans le build"
fi

cd ..

# 5. Démarrage des services avec PM2
echo "🚀 Démarrage des services..."
pm2 start ecosystem.config.js

# Attendre que les services démarrent
sleep 5

# 6. Vérification du statut
echo "📊 Vérification du statut des services..."
pm2 status

# Vérifier que les services sont en ligne
if pm2 list | grep -q "online"; then
    echo_success "Services démarrés avec succès"
    
    # Sauvegarder la configuration PM2
    pm2 save
    pm2 startup
    
    echo ""
    echo "🎉 Déploiement terminé avec succès!"
    echo ""
    echo "📡 URLs d'accès:"
    echo "   Backend:  http://$SERVER_IP:$BACKEND_PORT"
    echo "   Frontend: http://$SERVER_IP:$FRONTEND_PORT"
    echo "   Dashboard: http://$SERVER_IP:$FRONTEND_PORT/dashboard"
    echo ""
    echo "🔧 Commandes utiles:"
    echo "   pm2 status              - Voir le statut des services"
    echo "   pm2 logs                - Voir tous les logs"
    echo "   pm2 logs whatslandllt-backend  - Logs du backend uniquement"
    echo "   pm2 logs whatslandllt-frontend - Logs du frontend uniquement"
    echo "   pm2 restart all         - Redémarrer tous les services"
    
else
    echo_error "Certains services ont échoué au démarrage"
    pm2 logs --lines 20
    exit 1
fi 