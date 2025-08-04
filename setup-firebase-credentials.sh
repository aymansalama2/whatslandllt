#!/bin/bash

echo "🔥 Configuration des credentials Firebase pour WhatsLand"
echo "=============================================="

# Vérifier si on est sur le serveur
if [ ! -d "/var/www/whatslandllt" ]; then
    echo "❌ Ce script doit être exécuté sur le serveur de production"
    echo "📁 Répertoire attendu: /var/www/whatslandllt"
    exit 1
fi

cd /var/www/whatslandllt/backend

echo "🔧 Méthodes de configuration disponibles:"
echo "1. Service Account Key File (Recommandé pour production)"
echo "2. Variables d'environnement"
echo "3. Test sans credentials (Mode développement)"
echo ""

read -p "Choisissez une méthode (1-3): " choice

case $choice in
    1)
        echo "📄 Configuration avec Service Account Key File"
        echo ""
        echo "📋 ÉTAPES À SUIVRE:"
        echo "1. Allez sur https://console.firebase.google.com/"
        echo "2. Sélectionnez votre projet 'watsland-96923'"
        echo "3. Allez dans Project Settings > Service Accounts"
        echo "4. Cliquez sur 'Generate new private key'"
        echo "5. Téléchargez le fichier JSON"
        echo "6. Uploadez le fichier sur votre serveur dans /var/www/whatslandllt/backend/"
        echo "7. Renommez le fichier en 'firebase-service-account.json'"
        echo ""
        echo "📝 Commandes à exécuter après upload:"
        echo "scp votre-service-account.json root@srv919743:/var/www/whatslandllt/backend/firebase-service-account.json"
        echo "chmod 600 /var/www/whatslandllt/backend/firebase-service-account.json"
        echo "chown root:root /var/www/whatslandllt/backend/firebase-service-account.json"
        echo ""
        echo "🔐 SÉCURITÉ: Ce fichier contient des clés privées, gardez-le secret!"
        ;;
        
    2)
        echo "🌍 Configuration avec Variables d'environnement"
        echo ""
        echo "📋 ÉTAPES À SUIVRE:"
        echo "1. Obtenez votre Service Account key depuis Firebase Console"
        echo "2. Extraez les valeurs suivantes du fichier JSON:"
        echo "   - private_key"
        echo "   - client_email"
        echo "   - project_id"
        echo ""
        echo "3. Ajoutez ces variables à votre .env ou système:"
        
        cat > .env.firebase << 'EOF'
# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=watsland-96923
FIREBASE_CLIENT_EMAIL=votre-service-account@watsland-96923.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_PRIVATE_KEY_ICI\n-----END PRIVATE KEY-----"
EOF
        
        echo "📄 Fichier .env.firebase créé, éditez-le avec vos vraies valeurs"
        echo "📝 Puis chargez les variables: source .env.firebase"
        echo "🔐 N'oubliez pas d'ajouter .env.firebase au .gitignore!"
        ;;
        
    3)
        echo "🧪 Mode test/développement (sans credentials)"
        echo ""
        echo "⚠️ ATTENTION: Certaines fonctionnalités Firebase ne marcheront pas"
        echo "⚠️ Utilisez cette option uniquement pour tester"
        echo ""
        echo "Le code a été modifié pour gérer ce cas automatiquement."
        ;;
        
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

echo ""
echo "📁 Après configuration, redémarrez votre application:"
echo "pm2 restart whatsland-backend"
echo ""
echo "🧪 Testez avec:"
echo "curl -X POST http://whatsland.click/api/firebase/init \\"
echo "  -H 'Authorization: Bearer VOTRE_FIREBASE_TOKEN' \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo "✅ Configuration terminée!"