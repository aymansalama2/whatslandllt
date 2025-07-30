# Guide de Déploiement WhatsLandLLT

## Problèmes Résolus ✅

Les problèmes suivants ont été identifiés et corrigés :

### 1. Problème de Port (EADDRINUSE)
- **Cause** : Multiples processus PM2 utilisant le même port
- **Solution** : Nettoyage propre des processus PM2 avant redémarrage

### 2. Erreurs de Base de Données (SQLite Constraint)
- **Cause** : Doublons d'emails lors de synchronisation
- **Solution** : Nettoyage automatique des doublons avant sync

### 3. Frontend utilisant localhost
- **Cause** : Variable d'environnement pas correctement passée au build
- **Solution** : Export explicite de `VITE_API_URL` avant build

### 4. Frontend non accessible de l'extérieur
- **Cause** : serve ne lie pas sur toutes les interfaces
- **Solution** : Ajout de `-H 0.0.0.0` dans la config PM2

## Déploiement Rapide

### Option 1: Script Automatique (Recommandé)

```bash
cd /var/www/whatslandllt
chmod +x deploy-script.sh
./deploy-script.sh
```

### Option 2: Déploiement Manuel

#### Étape 1: Nettoyage des anciens processus
```bash
cd /var/www/whatslandllt
pm2 stop all
pm2 delete all
```

#### Étape 2: Configuration du firewall
```bash
# Pour UFW (Ubuntu/Debian)
sudo ufw allow 5001
sudo ufw allow 3000
sudo ufw reload

# Pour firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=5001/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Pour iptables (alternatif)
sudo iptables -A INPUT -p tcp --dport 5001 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

#### Étape 3: Installation des dépendances backend
```bash
cd backend
npm install
cd ..
```

#### Étape 4: Configuration et build du frontend
```bash
cd frontend

# Créer le fichier .env.production
cat > .env.production << 'EOF'
VITE_API_URL=http://92.113.31.157:5001
EOF

# Installer les dépendances
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# Installer serve globalement
npm install -g serve

# Build avec la variable d'environnement
export VITE_API_URL=http://92.113.31.157:5001
npm run build

# Vérifier que le build contient la bonne URL
grep -r "92.113.31.157" dist/

cd ..
```

#### Étape 5: Démarrage des services
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Vérification du Déploiement

### 1. Statut des Services
```bash
pm2 status
```
**Résultat attendu** : Les deux services (backend et frontend) doivent être "online"

### 2. Logs des Services
```bash
# Tous les logs
pm2 logs

# Backend uniquement
pm2 logs whatslandllt-backend

# Frontend uniquement
pm2 logs whatslandllt-frontend
```

### 3. Test de Connectivité

#### Backend (Port 5001)
```bash
curl http://92.113.31.157:5001/api/status
```
**Résultat attendu** : Réponse JSON du statut

#### Frontend (Port 3000)
```bash
curl -I http://92.113.31.157:3000
```
**Résultat attendu** : `HTTP/1.1 200 OK`

### 4. Test d'Accès Web
- **Frontend** : http://92.113.31.157:3000
- **Dashboard** : http://92.113.31.157:3000/dashboard
- **API** : http://92.113.31.157:5001/api/status

## Dépannage

### Problème : Services en erreur
```bash
pm2 restart all
pm2 logs --lines 50
```

### Problème : Port déjà utilisé
```bash
# Trouver le processus utilisant le port
sudo netstat -tulpn | grep :5001
sudo lsof -i :5001

# Tuer le processus si nécessaire
sudo kill -9 [PID]
```

### Problème : Frontend affiche encore localhost
```bash
cd frontend
# Reconstruire avec variable explicite
export VITE_API_URL=http://92.113.31.157:5001
npm run build
pm2 restart whatslandllt-frontend
```

### Problème : Cannot find module 'dotenv'
```bash
cd backend
npm install
pm2 restart whatslandllt-backend
```

### Problème : Git index corrompu
```bash
rm -f .git/index
git reset
git status
# ou en dernier recours
git reset --hard HEAD
```

## Structure des Fichiers

```
/var/www/whatslandllt/
├── backend/
│   ├── server.js              # Serveur principal (écoute sur 0.0.0.0:5001)
│   ├── database/models.js     # Modèles DB avec gestion des doublons
│   └── package.json           # Dépendances backend
├── frontend/
│   ├── dist/                  # Build de production
│   ├── .env.production        # Variables d'environnement
│   ├── vite.config.js         # Configuration Vite
│   └── package.json           # Dépendances frontend
├── ecosystem.config.js        # Configuration PM2
├── deploy-script.sh           # Script de déploiement automatique
└── DEPLOYMENT_GUIDE.md        # Ce guide
```

## Commandes Utiles

### PM2
```bash
pm2 status                     # Statut des services
pm2 restart all               # Redémarrer tous les services
pm2 stop whatslandllt-backend # Arrêter le backend
pm2 logs --lines 100          # Voir les derniers logs
pm2 monit                     # Monitoring en temps réel
```

### Maintenance
```bash
# Nettoyer les logs PM2
pm2 flush

# Redémarrer proprement
pm2 stop all && pm2 delete all
pm2 start ecosystem.config.js

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h
```

## URLs de Production

- **Application** : http://92.113.31.157:3000
- **Dashboard** : http://92.113.31.157:3000/dashboard  
- **API Backend** : http://92.113.31.157:5001
- **Statut API** : http://92.113.31.157:5001/api/status

## Support

En cas de problème persistant :

1. Vérifiez les logs : `pm2 logs`
2. Vérifiez le statut : `pm2 status`
3. Testez la connectivité réseau
4. Consultez ce guide de dépannage

**Note** : Ce déploiement est optimisé pour l'IP `92.113.31.157`. Pour un autre serveur, modifiez la variable `SERVER_IP` dans `deploy-script.sh`. 