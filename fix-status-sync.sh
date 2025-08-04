#!/bin/bash

# 🔧 Script de correction de la synchronisation du statut
# Usage: ./fix-status-sync.sh

echo "🔧 Correction de la synchronisation du statut..."
echo "=============================================="

# Variables
PROJECT_DIR="/var/www/whatslandllt"
BACKEND_PROCESS="whatsland-backend"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Aller dans le répertoire du projet
cd "$PROJECT_DIR"
print_status "Répertoire de travail: $(pwd)"

# Pull des dernières modifications
print_status "Récupération des corrections..."
git pull origin main

# Rebuilder le frontend
print_status "Rebuild du frontend avec les corrections..."
cd frontend
npm run build
cd ..

# Redémarrer le backend
print_status "Redémarrage du backend..."
pm2 restart $BACKEND_PROCESS

# Vérifier le statut
print_status "Vérification du statut..."
pm2 list

print_success "✅ Corrections de synchronisation déployées!"
echo ""
echo "🎯 Corrections appliquées:"
echo "   - Synchronisation Socket.IO/Frontend corrigée"
echo "   - Messages de statut mis à jour"
echo "   - Gestion du statut 'ready' améliorée"
echo ""
echo "📱 L'interface devrait maintenant afficher:"
echo "   ✅ 'WhatsLand est connecté et prêt!'"
echo "   ✅ Statut vert au lieu d'erreur"
echo ""
echo "🔄 Rechargez la page pour voir les changements" 