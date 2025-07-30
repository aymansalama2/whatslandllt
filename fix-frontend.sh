#!/bin/bash

# Script pour corriger le problème localhost du frontend
echo "🔧 Correction du problème localhost frontend..."

# Configuration
SERVER_IP="92.113.31.157"
BACKEND_PORT="5001"

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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
    echo_error "Ce script doit être exécuté depuis /var/www/whatslandllt"
    exit 1
fi

echo "🎯 Correction du frontend pour utiliser ${SERVER_IP}:${BACKEND_PORT}"

# 1. Aller dans le répertoire frontend
cd frontend

# 2. Créer/Recréer le fichier .env.production
echo "📝 Création du fichier .env.production..."
cat > .env.production << EOF
VITE_API_URL=http://${SERVER_IP}:${BACKEND_PORT}
EOF

# 3. Créer aussi un .env.local pour être sûr
cat > .env.local << EOF
VITE_API_URL=http://${SERVER_IP}:${BACKEND_PORT}
EOF

echo_success "Fichiers d'environnement créés"

# 4. Vérifier le contenu
echo "📋 Contenu des fichiers d'environnement:"
echo "=== .env.production ==="
cat .env.production
echo ""
echo "=== .env.local ==="
cat .env.local
echo ""

# 5. Supprimer l'ancien build
echo "🗑️ Suppression de l'ancien build..."
rm -rf dist/

# 6. Export des variables d'environnement de manière explicite
echo "🔧 Configuration des variables d'environnement..."
export NODE_ENV=production
export VITE_API_URL=http://${SERVER_IP}:${BACKEND_PORT}

echo "Variables définies:"
echo "NODE_ENV=$NODE_ENV"
echo "VITE_API_URL=$VITE_API_URL"

# 7. Build avec toutes les variables définies
echo "🔨 Reconstruction du frontend..."
VITE_API_URL=http://${SERVER_IP}:${BACKEND_PORT} npm run build

# 8. Vérifier que le build contient la bonne URL
echo "🔍 Vérification du build..."
if grep -r "$SERVER_IP" dist/ >/dev/null 2>&1; then
    echo_success "✅ Le build contient maintenant l'IP du serveur!"
    echo "Fichiers contenant l'IP du serveur:"
    grep -r "$SERVER_IP" dist/ | head -5
else
    echo_warning "⚠️ Le build ne semble pas contenir l'IP du serveur"
    echo "Recherche de 'localhost' dans le build:"
    grep -r "localhost" dist/ | head -5
fi

# 9. Retourner au répertoire racine
cd ..

# 10. Redémarrer les services PM2
echo "🔄 Redémarrage des services PM2..."
pm2 restart whatslandllt-frontend

# 11. Afficher le statut
echo "📊 Statut des services:"
pm2 status

echo ""
echo "🎉 Correction terminée!"
echo ""
echo "🌐 Testez maintenant:"
echo "   Frontend: http://${SERVER_IP}:3000"
echo "   Dashboard: http://${SERVER_IP}:3000/dashboard"
echo ""
echo "💡 Si le problème persiste, vérifiez les logs du navigateur."
echo "   Les requêtes doivent maintenant aller vers ${SERVER_IP}:${BACKEND_PORT}" 