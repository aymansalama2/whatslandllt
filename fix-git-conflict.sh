#!/bin/bash

echo "🔧 Résolution des conflits git..."

# Sauvegarder les logs actuels
echo "💾 Sauvegarde des logs actuels..."
mkdir -p logs_backup
cp logs/err.log logs_backup/err.log.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp logs/out.log logs_backup/out.log.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Supprimer les fichiers de logs en conflit
echo "🗑️ Suppression des logs en conflit..."
rm -f logs/err.log logs/out.log

# Récupérer les changements
echo "🔄 Pull des changements..."
git pull origin main

# Restaurer les logs sauvegardés
echo "📝 Restauration des logs..."
cp logs_backup/err.log.* logs/err.log 2>/dev/null || true
cp logs_backup/out.log.* logs/out.log 2>/dev/null || true

echo "✅ Conflits résolus!"