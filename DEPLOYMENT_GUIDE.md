# 🚀 Guide de Déploiement WhatsLandLLT sur VPS

## 🔥 Problèmes identifiés et solutions

### 1. ❌ Erreur de contrainte de base de données
**Erreur:** `SQLITE_CONSTRAINT: UNIQUE constraint failed`

**✅ Solution appliquée:**
- Modification du modèle User pour permettre les emails null
- Amélioration de la fonction de synchronisation avec nettoyage des doublons

### 2. ❌ Frontend ne peut pas se connecter au backend
**Erreur:** `net::ERR_CONNECTION_REFUSED`

**✅ Solutions appliquées:**
- Configuration du serveur pour écouter sur `0.0.0.0` au lieu de `localhost`
- Configuration PM2 optimisée avec `ecosystem.config.js`

## 📋 Instructions de déploiement

### Étape 1: Configuration réseau sur le VPS

```bash
# Ouvrir les ports nécessaires
sudo ufw allow 5001  # Backend
sudo ufw allow 3000  # Frontend
sudo ufw reload

# Vérifier les ports ouverts
sudo ufw status
```

### Étape 2: Configuration du frontend

```bash
# Sur votre VPS, créer le fichier d'environnement
cd /var/www/whatslandllt/frontend
cp env.production.example .env.production

# Remplacer YOUR_SERVER_IP par l'IP de votre serveur
# Exemple: si votre IP est 192.168.1.100
sed -i 's/YOUR_SERVER_IP/192.168.1.100/g' .env.production

# Ou éditez manuellement
nano .env.production
```

### Étape 3: Build du frontend

```bash
cd /var/www/whatslandllt/frontend
npm install
npm run build
```

### Étape 4: Redémarrage des services avec PM2

```bash
cd /var/www/whatslandllt

# Arrêter tous les processus existants
pm2 stop all
pm2 delete all

# Démarrer avec la nouvelle configuration
pm2 start ecosystem.config.js

# Sauvegarder la configuration
pm2 save
pm2 startup
```

### Étape 5: Vérification

```bash
# Vérifier le statut des processus
pm2 status

# Vérifier les logs
pm2 logs whatslandllt-backend --lines 20
pm2 logs whatslandllt-frontend --lines 20

# Tester la connectivité
curl http://localhost:5001/api/status
```

## 🌐 Accès à l'application

Une fois déployé:
- **Frontend:** `http://[IP_DU_SERVEUR]:3000`
- **Backend API:** `http://[IP_DU_SERVEUR]:5001`

## 🔧 Résolution des problèmes courants

### Problème: Port déjà utilisé
```bash
# Trouver le processus utilisant le port
sudo lsof -i :5001
sudo lsof -i :3000

# Tuer le processus si nécessaire
sudo kill -9 [PID]
```

### Problème: Permissions de fichiers
```bash
# Corriger les permissions
sudo chown -R www-data:www-data /var/www/whatslandllt
sudo chmod -R 755 /var/www/whatslandllt
```

### Problème: WhatsApp Web ne se connecte pas
```bash
# Nettoyer les données de session
cd /var/www/whatslandllt/backend
rm -rf session_data/*
pm2 restart whatslandllt-backend
```

## 📱 Configuration WhatsApp

1. Une fois le backend démarré, consultez les logs pour obtenir le QR code:
   ```bash
   pm2 logs whatslandllt-backend
   ```

2. Ou accédez à l'interface web: `http://[IP_DU_SERVEUR]:3000`

3. Scannez le QR code avec WhatsApp sur votre téléphone

## 🚨 Messages d'erreur et solutions

### `Navigation failed because browser has disconnected`
- **Cause:** Problème avec Puppeteer sur le VPS
- **Solution:** Redémarrer le service backend
  ```bash
  pm2 restart whatslandllt-backend
  ```

### `EADDRINUSE: address already in use`
- **Cause:** Port occupé par un autre processus
- **Solution:** Arrêter l'ancien processus
  ```bash
  pm2 stop all
  pm2 delete all
  pm2 start ecosystem.config.js
  ```

## 📞 Support

En cas de problème persistant:
1. Vérifiez les logs: `pm2 logs --lines 50`
2. Redémarrez les services: `pm2 restart all`
3. Vérifiez la connectivité réseau
4. Assurez-vous que les ports sont ouverts dans le firewall 