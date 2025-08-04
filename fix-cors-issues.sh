#!/bin/bash

echo "🔧 Application des correctifs CORS et Socket.IO pour WhatsLand..."

# 1. Redémarrer le backend pour appliquer les correctifs CORS
echo "📡 Redémarrage du backend Node.js..."
pm2 restart whatsland-backend 2>/dev/null || node backend/server.js &

# 2. Appliquer la nouvelle configuration nginx
echo "🌐 Application de la nouvelle configuration nginx..."
sudo cp nginx-whatsland-corrected.conf /etc/nginx/conf.d/whatsland.conf

# 3. Tester la configuration nginx
echo "✅ Test de la configuration nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration nginx valide"
    
    # 4. Redémarrer nginx
    echo "🔄 Redémarrage de nginx..."
    sudo systemctl reload nginx
    
    # 5. Rebuilder le frontend avec les corrections
    echo "🏗️ Reconstruction du frontend..."
    cd frontend
    npm run build
    cd ..
    
    # 6. Tests de connectivité
    echo "🧪 Tests des correctifs..."
    
    echo "=== Test API Status ==="
    curl -s -I http://whatsland.click/api/status | grep -E "(HTTP|Access-Control)"
    
    echo -e "\n=== Test Socket.IO ==="
    curl -s -I http://whatsland.click/socket.io/ | grep -E "(HTTP|Access-Control)"
    
    echo -e "\n=== Test Frontend ==="
    curl -s -I http://whatsland.click/ | grep -E "(HTTP|Content-Type)"
    
    echo -e "\n✅ Correctifs appliqués avec succès!"
    echo "📝 Vérifiez les logs de votre navigateur pour confirmer que les erreurs CORS ont disparu."
    echo "🔗 Testez votre application sur http://whatsland.click"
    
else
    echo "❌ Erreur dans la configuration nginx. Vérifiez le fichier nginx-whatsland-corrected.conf"
    exit 1
fi

echo -e "\n🎉 Déploiement terminé!"