#!/bin/bash

# Script pour corriger le déploiement sur le domaine whatsland.click
# Ce script doit être exécuté sur votre serveur VPS Linux

echo "🔧 Correction du déploiement pour whatsland.click..."

# Variables
DOMAIN="whatsland.click"
SERVER_IP="92.113.31.157"
PROJECT_DIR="/var/www/whatslandllt"

echo "📍 Étape 1: Vérification des services actuels..."
pm2 status

echo "📍 Étape 2: Arrêt des anciens services..."
pm2 stop all
pm2 delete all

echo "📍 Étape 3: Configuration du frontend pour le domaine..."
cd $PROJECT_DIR/frontend

# Créer le fichier .env.production avec la bonne configuration
cat > .env.production << EOF
VITE_API_URL=http://$DOMAIN
NODE_ENV=production
EOF

echo "📍 Étape 4: Reconstruction du frontend avec la bonne URL..."
# Exporter la variable d'environnement pour le build
export VITE_API_URL=http://$DOMAIN
export NODE_ENV=production

# Clean install
rm -rf node_modules package-lock.json dist
npm cache clean --force
npm install --legacy-peer-deps

# Build avec la variable d'environnement
npm run build

echo "📍 Étape 5: Vérification du build..."
if [ -d "dist" ]; then
    echo "✅ Build frontend créé avec succès"
    # Vérifier que la bonne URL est dans le build
    if grep -r "$DOMAIN" dist/; then
        echo "✅ Configuration domaine trouvée dans le build"
    else
        echo "⚠️  Configuration domaine non trouvée, tentative de correction..."
        # Réessayer le build avec export explicite
        VITE_API_URL=http://$DOMAIN npm run build
    fi
else
    echo "❌ Erreur lors du build frontend"
    exit 1
fi

echo "📍 Étape 6: Configuration nginx..."
# Vérifier que nginx pointe vers le bon répertoire
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Configuration nginx invalide"
    exit 1
fi

# Redémarrer nginx pour s'assurer qu'il charge la nouvelle config
sudo systemctl reload nginx

echo "📍 Étape 7: Installation des dépendances backend..."
cd $PROJECT_DIR/backend
npm install

echo "📍 Étape 8: Mise à jour de la configuration PM2..."
cd $PROJECT_DIR

# Créer une nouvelle configuration PM2 pour le domaine
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'whatslandllt-backend',
      script: './backend/server.js',
      cwd: '/var/www/whatslandllt',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        HOST: '127.0.0.1'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512'
    }
  ]
};
EOF

echo "📍 Étape 9: Démarrage des services..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "📍 Étape 10: Vérifications finales..."
sleep 5

# Vérifier que le backend répond
echo "🔍 Test backend sur localhost:5001..."
curl -s http://localhost:5001/api/status | head -n 5

# Vérifier que nginx sert le frontend
echo "🔍 Test frontend via nginx..."
curl -s -I http://localhost/ | head -n 5

echo "📍 Étape 11: Vérification DNS..."
echo "🔍 Résolution DNS pour $DOMAIN:"
nslookup $DOMAIN

echo "🔍 Test ping vers le domaine:"
ping -c 3 $DOMAIN

echo "📍 Étape 12: Statut final..."
pm2 status
sudo systemctl status nginx --no-pager -l

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📝 URLs de test:"
echo "  - Frontend (domaine): http://$DOMAIN"
echo "  - Frontend (IP):      http://$SERVER_IP:3000"
echo "  - Backend API:        http://$DOMAIN/api/status"
echo ""
echo "🔧 Vérifications à faire:"
echo "  1. Vérifiez que le domaine $DOMAIN pointe vers $SERVER_IP"
echo "  2. Testez l'accès depuis un navigateur externe"
echo "  3. Vérifiez les logs: pm2 logs"
echo ""
echo "📋 Si le domaine ne fonctionne toujours pas:"
echo "  1. Vérifiez la configuration DNS chez votre provider"
echo "  2. Attendez la propagation DNS (peut prendre jusqu'à 24h)"
echo "  3. Vérifiez que les ports 80 et 443 sont ouverts sur le firewall"