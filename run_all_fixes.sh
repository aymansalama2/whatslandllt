#!/bin/bash

echo "📋 WhatsLand - Script de correction complète"
echo "----------------------------------------"

# Arrêt des processus Node.js en cours (serveur backend)
echo "🛑 Arrêt des processus Node.js en cours..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  taskkill //F //IM node.exe 2>/dev/null || true
else
  # Linux/Mac
  pkill -f "node" 2>/dev/null || true
fi

# Attendre que les processus soient arrêtés
echo "⏳ Attente de l'arrêt complet des processus..."
sleep 2

# Exécuter la correction de la base de données
echo "🔧 Lancement de la correction de la base de données..."
node fix_database.js

# Vérifier si la correction s'est bien terminée
if [ $? -eq 0 ]; then
  echo "✅ Correction de la base de données terminée"
  echo ""
  echo "🚀 Vous pouvez maintenant redémarrer l'application avec 'npm start'"
else
  echo "❌ Échec de la correction de la base de données"
  exit 1
fi 