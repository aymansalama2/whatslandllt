# Checklist de déploiement pour WhatsLand

Ce document fournit une liste complète des étapes nécessaires pour déployer l'application WhatsLand sur un VPS.

## 1. Préparation de l'environnement de production

### Configuration du VPS
- [ ] Installer une distribution Linux (Ubuntu 22.04 LTS recommandé)
- [ ] Mettre à jour le système : `sudo apt update && sudo apt upgrade -y`
- [ ] Configurer le pare-feu : `sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable`
- [ ] Installer NVM : `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
- [ ] Installer Node.js v20 : `nvm install 20 && nvm use 20`
- [ ] Installer PM2 : `npm install -g pm2`
- [ ] Installer Nginx : `sudo apt install -y nginx`
- [ ] Installer Certbot : `sudo apt install -y certbot python3-certbot-nginx`

### Installation de Google Chrome (Headless)
```bash
# Installation des dépendances
sudo apt install -y wget curl unzip fontconfig fonts-liberation gconf-service libatk1.0-0 libgtk-3-0 libx11-xcb1 libdrm2 libgbm1 libu2f-udev libvulkan1 libxkbcommon0 xdg-utils libdrm2 libgbm1 xvfb

# Téléchargement et installation de Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y ./google-chrome-stable_current_amd64.deb
rm google-chrome-stable_current_amd64.deb

# Vérifier l'installation
google-chrome --version
```

## 2. Installation de l'application

### Préparation des fichiers
- [ ] Cloner le projet sur le VPS ou transférer les fichiers via SCP/SFTP
- [ ] Installer les dépendances :
```bash
cd whatsapp-qr-app
npm install
cd frontend && npm install
cd ../backend && npm install
```

### Configuration des variables d'environnement

#### Pour le backend (.env)
```
PORT=5001
NODE_ENV=production
DB_TYPE=mysql
DB_NAME=whatsland
DB_USER=votre_utilisateur_mysql
DB_PASSWORD=votre_mot_de_passe_mysql
DB_HOST=localhost
CORS_ORIGIN=https://votre-domaine.com
CHROME_PATH=/usr/bin/google-chrome
TEMP_DIR=temp
PUPPETEER_SKIP_DOWNLOAD=true
```

#### Pour le frontend (.env.production)
```
VITE_API_URL=https://api.votre-domaine.com
```

## 3. Installation et configuration de la base de données MySQL

```bash
# Installation
sudo apt install -y mysql-server

# Sécurisation
sudo mysql_secure_installation

# Connexion
sudo mysql

# Création de la base de données et de l'utilisateur
CREATE DATABASE whatsland;
CREATE USER 'whatsland_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe_mysql';
GRANT ALL PRIVILEGES ON whatsland.* TO 'whatsland_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Build et déploiement

### Build du frontend
```bash
cd frontend
npm run build
```

### Configuration de Nginx

```bash
# Configuration pour le frontend
sudo nano /etc/nginx/sites-available/whatsland-frontend

# Ajouter la configuration suivante
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    location / {
        root /chemin/vers/whatsapp-qr-app/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

# Configuration pour l'API backend
sudo nano /etc/nginx/sites-available/whatsland-api

# Ajouter la configuration suivante
server {
    listen 80;
    server_name api.votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Activer les configurations
sudo ln -s /etc/nginx/sites-available/whatsland-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/whatsland-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Supprimer la configuration par défaut

# Vérifier la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### Configuration de PM2 pour le backend

```bash
cd backend
pm2 start server.js --name "whatsland-api"
pm2 startup
pm2 save
```

### Configuration SSL avec Certbot

```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
sudo certbot --nginx -d api.votre-domaine.com
```

## 5. Tests et vérifications

- [ ] Vérifier que le frontend est accessible à https://votre-domaine.com
- [ ] Vérifier que l'API est accessible à https://api.votre-domaine.com/api/status
- [ ] Vérifier que WhatsApp Web peut se connecter correctement
- [ ] Tester l'envoi de messages
- [ ] Vérifier les statistiques et la création de campagnes

## 6. Maintenance et monitoring

### Configuration des logs
```bash
# Créer un répertoire pour les logs
mkdir -p /var/log/whatsland

# Configurer la rotation des logs
sudo nano /etc/logrotate.d/whatsland

# Ajouter la configuration suivante
/var/log/whatsland/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 640 root root
}
```

### Monitoring avec PM2
```bash
# Vérifier les logs en temps réel
pm2 logs whatsland-api

# Moniteur interactif
pm2 monit

# Redémarrer automatiquement l'application en cas de crash
pm2 startup
pm2 save
```

### Backup automatique de la base de données
```bash
# Créer un script de backup
sudo nano /usr/local/bin/backup-whatsland.sh

# Ajouter le contenu suivant
#!/bin/bash
BACKUP_DIR="/var/backups/whatsland"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR
mysqldump -u whatsland_user -p'votre_mot_de_passe_mysql' whatsland > $BACKUP_DIR/whatsland_$TIMESTAMP.sql
find $BACKUP_DIR -type f -name "whatsland_*.sql" -mtime +7 -delete

# Rendre le script exécutable
sudo chmod +x /usr/local/bin/backup-whatsland.sh

# Ajouter à crontab pour exécution quotidienne
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-whatsland.sh") | crontab -
```

## 7. Solutions aux problèmes courants

### Problèmes avec Puppeteer/Chrome
- Vérifier que toutes les dépendances système sont installées
- Exécuter Chrome avec `--no-sandbox` (déjà configuré dans le code)
- Utiliser Xvfb si nécessaire : `xvfb-run -a google-chrome --version`

### Problèmes de connexion WhatsApp
- Vérifier les logs : `pm2 logs whatsland-api`
- Nettoyer le cache WhatsApp :
```bash
cd backend
rm -rf .wwebjs_auth .wwebjs_cache
pm2 restart whatsland-api
```

### Problèmes de base de données
- Vérifier la connexion : `mysql -u whatsland_user -p'votre_mot_de_passe_mysql' whatsland -e "SHOW TABLES;"`
- Vérifier les journaux d'erreurs MySQL : `sudo tail -f /var/log/mysql/error.log`

## 8. Mises à jour futures de l'application

Pour mettre à jour l'application en production :

```bash
# Arrêter l'API
pm2 stop whatsland-api

# Pull les changements (si Git est utilisé)
git pull

# Ou, transférer les nouveaux fichiers via SCP/SFTP

# Installer les nouvelles dépendances
npm install
cd frontend && npm install
cd ../backend && npm install

# Build du frontend
cd frontend && npm run build

# Redémarrer l'API
pm2 restart whatsland-api
```

## Notes importantes

1. **Sécurité** : L'application utilise WhatsApp Web, qui nécessite un navigateur. Assurez-vous que le VPS est sécurisé car Chrome sera exécuté en arrière-plan.

2. **Ressources système** : WhatsApp Web via Puppeteer consomme beaucoup de ressources. Prévoyez au moins 2 Go de RAM pour le VPS.

3. **Session WhatsApp** : La session WhatsApp peut expirer. Configurez des alertes et un processus de reconnexion si nécessaire.

4. **Conformité** : Assurez-vous que votre utilisation de WhatsApp est conforme aux conditions de service de WhatsApp Business API. 