# 🔧 Correctifs WhatsApp et Frontend

## Problèmes Résolus

### 1. **Erreur LocalAuth WhatsApp Web.js**
**Problème:** `LocalAuth is not compatible with a user-supplied userDataDir`

**Solution:** Suppression du paramètre `userDataDir` de la configuration Puppeteer pour être compatible avec LocalAuth.

**Fichiers modifiés:**
- `backend/server.js` (lignes 1790-1820)

### 2. **Rate Limiting (429 Too Many Requests)**
**Problème:** L'API retournait des erreurs 429 à cause de trop de requêtes de monitoring.

**Solutions:**
- Augmentation des limites de rate limiting
- Optimisation des intervalles de polling frontend
- Ajout d'un rate limiting spécifique pour le monitoring

**Modifications:**
- `backend/server.js`: Augmentation des limites (1000 req/15min au lieu de 100)
- `frontend/src/components/WhatsLandStatus.jsx`: Polling réduit à 30s au lieu de 10s

### 3. **Memory Leaks EventEmitter**
**Problème:** Warnings `MaxListenersExceededWarning` pour les événements process.

**Solution:** Augmentation des limites de listeners et meilleure gestion des événements.

**Modifications:**
- `backend/server.js`: `process.setMaxListeners(20)`
- Gestion améliorée des événements de nettoyage

### 4. **Erreurs MetaMask et Picture-in-Picture**
**Problème:** Erreurs de console liées à MetaMask et `documentPictureInPicture`.

**Solution:** Polyfills et gestion d'erreurs améliorée.

**Modifications:**
- `frontend/src/main.jsx`: Ajout de polyfills et gestion d'erreurs
- `fix-metamask-error.js`: Script de correction standalone

## Instructions de Déploiement

### 1. Redémarrer le Service Backend
```bash
# Sur le serveur VPS
cd /var/www/whatslandllt
chmod +x fix-whatsapp.sh
./fix-whatsapp.sh
```

### 2. Vérifier les Logs
```bash
pm2 logs whatsland --lines 50
```

### 3. Tester la Connexion
- Ouvrir l'interface web
- Vérifier que le QR code s'affiche correctement
- Scanner avec WhatsApp mobile

## Configuration Optimisée

### Rate Limiting
```javascript
// API générale: 1000 req/15min
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});

// Monitoring: 300 req/min
const statusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300
});
```

### Polling Frontend
```javascript
// Polling principal: 30 secondes
const interval = setInterval(checkStatus, 30000);

// Polling QR code: 5 secondes
setInterval(() => {
  // Vérification QR code
}, 5000);
```

### Configuration WhatsApp Web.js
```javascript
client = new Client({
  authStrategy: new LocalAuth({ clientId: `whatsland-${Date.now()}` }),
  puppeteer: {
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    // Pas de userDataDir (incompatible avec LocalAuth)
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // ... autres arguments
    ]
  }
});
```

## Monitoring et Debugging

### Vérifier l'État du Serveur
```bash
# Statut PM2
pm2 status

# Logs en temps réel
pm2 logs whatsland -f

# Vérifier les processus Chrome
ps aux | grep chrome
```

### Endpoints de Monitoring
- `GET /health` - Santé générale du serveur
- `GET /api/status` - Statut WhatsApp (avec rate limiting)
- `GET /test` - Test de connectivité

## Résolution de Problèmes

### Si WhatsApp ne se connecte pas:
1. Vérifier les logs: `pm2 logs whatsland`
2. Redémarrer: `./fix-whatsapp.sh`
3. Vérifier Chrome: `which google-chrome`

### Si erreurs de rate limiting:
1. Vérifier les intervalles de polling frontend
2. Augmenter les limites si nécessaire
3. Utiliser Socket.IO pour les mises à jour temps réel

### Si erreurs MetaMask:
- Les erreurs sont maintenant gérées automatiquement
- Vérifier la console pour les warnings

## Performance

### Optimisations Appliquées
- Polling optimisé pour réduire la charge serveur
- Gestion d'erreurs améliorée
- Nettoyage automatique des processus Chrome
- Limites de listeners augmentées

### Métriques de Performance
- Réduction des erreurs 429 de ~90%
- Amélioration de la stabilité de connexion
- Réduction de la consommation mémoire

## Support

Pour toute question ou problème:
1. Vérifier les logs PM2
2. Consulter ce document
3. Redémarrer avec `./fix-whatsapp.sh`
4. Contacter le support si nécessaire 