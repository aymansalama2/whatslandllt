#!/bin/bash

echo "🔍 Recherche du processus utilisant le port 5001..."

# Trouver le PID utilisant le port 5001
PID=$(lsof -t -i:5001)

if [ ! -z "$PID" ]; then
    echo "✅ Processus trouvé: PID $PID"
    
    # Obtenir le nom du processus
    PROCESS_NAME=$(ps -p $PID -o comm=)
    echo "📝 Nom du processus: $PROCESS_NAME"
    
    # Arrêter proprement le processus
    echo "🛑 Arrêt du processus..."
    kill $PID
    sleep 2
    
    # Vérifier si le processus est toujours en vie
    if ps -p $PID > /dev/null; then
        echo "⚠️ Le processus résiste, utilisation de kill -9..."
        kill -9 $PID
        sleep 1
    fi
    
    # Vérifier que le port est libre
    if lsof -i:5001; then
        echo "❌ Échec de la libération du port 5001"
        exit 1
    else
        echo "✅ Port 5001 libéré avec succès"
    fi
else
    echo "✅ Le port 5001 est déjà libre"
fi

# Redémarrer le service backend
echo "🔄 Redémarrage du backend..."
pm2 restart whatslandllt-backend

echo "✅ Terminé!"