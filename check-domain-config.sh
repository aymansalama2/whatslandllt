#!/bin/bash

# Script de diagnostic pour vérifier la configuration du domaine whatsland.click

echo "🔍 Diagnostic de configuration pour whatsland.click"
echo "================================================="

DOMAIN="whatsland.click"
SERVER_IP="92.113.31.157"

echo ""
echo "📍 1. Vérification DNS..."
echo "Resolution DNS pour $DOMAIN:"
nslookup $DOMAIN

echo ""
echo "Resolution DNS pour www.$DOMAIN:"
nslookup www.$DOMAIN

echo ""
echo "📍 2. Test de connectivité..."
echo "Ping vers $DOMAIN:"
ping -c 3 $DOMAIN 2>/dev/null || echo "❌ Ping échoué"

echo ""
echo "📍 3. Vérification Nginx..."
echo "Status Nginx:"
sudo systemctl status nginx --no-pager -l | head -n 10

echo ""
echo "Test configuration Nginx:"
sudo nginx -t

echo ""
echo "📍 4. Vérification des ports..."
echo "Port 80 (HTTP):"
sudo netstat -tulpn | grep :80

echo ""
echo "Port 443 (HTTPS):"
sudo netstat -tulpn | grep :443

echo ""
echo "Port 5001 (Backend):"
sudo netstat -tulpn | grep :5001

echo ""
echo "📍 5. Vérification du frontend build..."
echo "Répertoire frontend dist:"
ls -la /var/www/whatslandllt/frontend/dist/ | head -n 10

echo ""
echo "Recherche de la configuration API dans le build:"
if [ -d "/var/www/whatslandllt/frontend/dist" ]; then
    grep -r "whatsland.click\|92.113.31.157\|localhost" /var/www/whatslandllt/frontend/dist/ | head -n 5
else
    echo "❌ Répertoire dist non trouvé"
fi

echo ""
echo "📍 6. Test des services..."
echo "Status PM2:"
pm2 status

echo ""
echo "Test backend local:"
curl -s http://localhost:5001/api/status | head -n 3 2>/dev/null || echo "❌ Backend non accessible"

echo ""
echo "Test frontend via nginx (localhost):"
curl -s -I http://localhost/ | head -n 3 2>/dev/null || echo "❌ Frontend non accessible via nginx"

echo ""
echo "📍 7. Vérification des logs récents..."
echo "Logs Nginx (erreurs):"
sudo tail -n 5 /var/log/nginx/whatsland.error.log 2>/dev/null || echo "Pas de logs d'erreur nginx récents"

echo ""
echo "Logs PM2 récents:"
pm2 logs --lines 3 2>/dev/null || echo "Pas de logs PM2"

echo ""
echo "📍 8. Test externe du domaine..."
echo "Test HTTP vers $DOMAIN:"
curl -s -I http://$DOMAIN/ --connect-timeout 10 | head -n 3 2>/dev/null || echo "❌ Domaine non accessible de l'extérieur"

echo ""
echo "Test API via domaine:"
curl -s http://$DOMAIN/api/status --connect-timeout 10 | head -n 3 2>/dev/null || echo "❌ API non accessible via domaine"

echo ""
echo "================================================="
echo "🎯 RÉSUMÉ DU DIAGNOSTIC:"
echo ""

# Vérifications finales
if nslookup $DOMAIN | grep -q $SERVER_IP; then
    echo "✅ DNS: Le domaine pointe vers le bon serveur"
else
    echo "❌ DNS: Le domaine ne pointe PAS vers le serveur $SERVER_IP"
fi

if sudo nginx -t &>/dev/null; then
    echo "✅ NGINX: Configuration valide"
else
    echo "❌ NGINX: Configuration invalide"
fi

if [ -d "/var/www/whatslandllt/frontend/dist" ]; then
    echo "✅ FRONTEND: Build présent"
else
    echo "❌ FRONTEND: Build manquant"
fi

if curl -s http://localhost:5001/api/status &>/dev/null; then
    echo "✅ BACKEND: Fonctionne localement"
else
    echo "❌ BACKEND: Ne répond pas localement"
fi

if curl -s -I http://localhost/ &>/dev/null; then
    echo "✅ NGINX->FRONTEND: Fonctionne localement"
else
    echo "❌ NGINX->FRONTEND: Ne fonctionne pas localement"
fi

echo ""
echo "📋 Actions recommandées si des problèmes sont détectés:"
echo "  1. Si DNS incorrect: Configurez les enregistrements A et CNAME chez votre provider"
echo "  2. Si build manquant: Exécutez fix-domain-deployment.sh"
echo "  3. Si backend ne répond pas: pm2 restart all"
echo "  4. Si nginx invalide: Vérifiez nginx-whatsland-corrected.conf"