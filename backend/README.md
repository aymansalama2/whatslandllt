# Backend WhatsApp

## Scripts disponibles

### Mode Production
```bash
npm start          # Démarre le serveur avec Node.js (pas de redémarrage automatique)
npm run start:clean # Nettoie les données de session et démarre le serveur
```

### Mode Développement (Recommandé)
```bash
npm run dev        # Démarre le serveur avec nodemon (redémarrage automatique)
npm run dev:clean  # Nettoie les données de session et démarre avec nodemon
```

### Autres commandes
```bash
npm run clean      # Nettoie les fichiers de session et cache
npm run debug      # Démarre en mode debug
```

## Fonctionnalités du mode développement

- ✅ **Redémarrage automatique** : Le serveur redémarre automatiquement lorsque vous modifiez le code
- ✅ **Gestion d'erreurs améliorée** : Les erreurs ne font plus planter le serveur complètement
- ✅ **Surveillance intelligente** : Ignore les dossiers de cache et session pour éviter les redémarrages inutiles
- ✅ **Logs verbeux** : Messages détaillés pour le débogage

## Résolution du problème "Assignment to constant variable"

Le problème qui causait le crash du serveur lors de la déconnexion WhatsApp a été corrigé :
- Changement de `const client` en `let client` pour permettre la réassignation
- Ajout de gestionnaires d'erreurs globaux pour éviter les crashes
- Amélioration de la fonction `handleDisconnect` pour une meilleure robustesse

## Configuration nodemon

Le fichier `nodemon.json` configure :
- Surveillance des fichiers `.js` et `.json`
- Ignore des dossiers de cache et session
- Délai de 1 seconde avant redémarrage
- Variables d'environnement automatiques pour le développement 