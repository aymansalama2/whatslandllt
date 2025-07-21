# WhatsLand - Application de messagerie automatisée

WhatsLand est une plateforme moderne de messagerie WhatsApp qui permet d'envoyer des messages à grande échelle tout en suivant des statistiques détaillées des envois. L'application propose une interface utilisateur intuitive, un système d'authentification sécurisé et des outils de statistiques avancés.

## 🌟 Fonctionnalités

- **Authentification utilisateur** avec Firebase
- **Envoi en masse de messages** texte, images, vidéos et documents
- **Statistiques détaillées** sur les envois et les taux de réussite
- **Gestion de campagnes** pour organiser vos envois
- **Interface moderne et responsive** avec animations fluides
- **Stockage optimisé** qui conserve uniquement les statistiques et non le contenu des messages

## 🚀 Démarrage rapide

### Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/votre-compte/whatsland.git
cd whatsland

# Installer les dépendances
npm install

# Démarrer l'application en mode développement
npm start
```

Le frontend sera accessible à `http://localhost:5173` et l'API backend à `http://localhost:5001`.

### Connexion WhatsApp

Lors du premier démarrage, vous devrez scanner un code QR pour connecter WhatsApp à l'application. Ce code QR apparaîtra dans l'interface utilisateur.

## 🔧 Résolution des problèmes courants

### Problèmes de base de données

Si vous rencontrez des erreurs `SequelizeForeignKeyConstraintError`, exécutez le script de correction :

```bash
# Windows
run_all_fixes.bat

# Linux/Mac
./run_all_fixes.sh
```

### Erreurs WhatsApp

Si vous voyez des erreurs comme `Evaluation failed: b` lors de l'envoi de messages, essayez :

1. **Nettoyer le cache WhatsApp** : Supprimez les dossiers `.wwebjs_auth` et `.wwebjs_cache` dans le répertoire backend
2. **Vérifier Chrome** : Assurez-vous que Chrome est installé et correctement configuré
3. **Redémarrer l'application** : Arrêtez complètement l'application et redémarrez-la
4. **Exécuter le script de correction** : `node fix_whatsapp_errors.js`

## 📊 Structure du projet

- `/frontend` - Application React/Vite avec Tailwind CSS
  - `/src/components` - Composants UI réutilisables
  - `/src/pages` - Pages principales
  - `/src/contexts` - Contexts React pour la gestion de l'état global
  
- `/backend` - Serveur Node.js/Express
  - `/database` - Configuration et modèles Sequelize
  - `/temp` - Stockage temporaire des fichiers média

## 🌐 Déploiement en production

Pour déployer WhatsLand sur un VPS, suivez les étapes du fichier `deployment_checklist.md`. Le processus comprend :

1. Configuration du serveur Linux (Ubuntu recommandé)
2. Installation de Node.js, PM2, Nginx et MySQL
3. Configuration des variables d'environnement
4. Mise en place de SSL avec Certbot

## 🛠️ Scripts utiles

- `prepare_deployment.js` - Prépare l'application pour le déploiement en configurant les variables d'environnement
- `fix_database.js` - Corrige les problèmes de contrainte de clé étrangère dans la base de données
- `fix_whatsapp_errors.js` - Résout les problèmes courants de connexion WhatsApp
- `fix_puppeteer.js` - Corrige les problèmes liés à Puppeteer et Chrome

## ⚠️ Limitations

- L'application utilise l'API non officielle de WhatsApp via whatsapp-web.js et Puppeteer
- WhatsApp limite le nombre de messages que vous pouvez envoyer en masse
- La connexion à WhatsApp peut nécessiter une reconnexion régulière
- Une instance de Chrome est nécessaire pour le fonctionnement de l'API WhatsApp

## 🔄 Synchronisation avec les changements de WhatsApp

WhatsApp met régulièrement à jour son interface web, ce qui peut affecter la fonctionnalité de cette application. En cas de problème :

1. Mettez à jour whatsapp-web.js vers la dernière version : `npm install whatsapp-web.js@latest --save`
2. Exécutez le script de correction : `node fix_whatsapp_errors.js`
3. Redémarrez l'application

## 📜 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request pour suggérer des améliorations.

---

Développé avec ❤️ pour simplifier l'envoi de messages WhatsApp à grande échelle. 