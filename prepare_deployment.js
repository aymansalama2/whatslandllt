const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Préparation du déploiement de WhatsLand...');

// Chemins des répertoires
const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

// 1. Renommer et configurer les fichiers d'environnement
console.log('\n📝 Configuration des fichiers d\'environnement...');

try {
  // Vérifier si le fichier env.production existe dans le frontend
  if (fs.existsSync(path.join(FRONTEND_DIR, 'env.production'))) {
    // Renommer en .env.production
    fs.renameSync(
      path.join(FRONTEND_DIR, 'env.production'),
      path.join(FRONTEND_DIR, '.env.production')
    );
    console.log('✅ Frontend: env.production renommé en .env.production');
  } else {
    // Créer le fichier .env.production
    fs.writeFileSync(
      path.join(FRONTEND_DIR, '.env.production'),
      'VITE_API_URL=https://votre-domaine.com'
    );
    console.log('✅ Frontend: .env.production créé');
  }

  // Vérifier si le fichier env existe dans le backend
  if (fs.existsSync(path.join(BACKEND_DIR, 'env'))) {
    // Renommer en .env
    fs.renameSync(
      path.join(BACKEND_DIR, 'env'),
      path.join(BACKEND_DIR, '.env')
    );
    console.log('✅ Backend: env renommé en .env');
  } else {
    // Créer le fichier .env
    fs.writeFileSync(
      path.join(BACKEND_DIR, '.env'),
      `PORT=5001
NODE_ENV=production
DB_TYPE=sqlite      # Changer en 'mysql' pour production
DB_NAME=whatsland
DB_USER=whatsland_user
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
CORS_ORIGIN=*       # Restreindre en production
CHROME_PATH=        # Laisser vide pour utiliser la détection automatique
TEMP_DIR=temp       # Dossier temporaire pour les uploads`
    );
    console.log('✅ Backend: .env créé');
  }
} catch (err) {
  console.error('❌ Erreur lors de la configuration des fichiers d\'environnement:', err);
}

// 2. Installer dotenv dans le backend
console.log('\n📦 Installation de dotenv dans le backend...');
try {
  process.chdir(BACKEND_DIR);
  execSync('npm install dotenv --save', { stdio: 'inherit' });
  console.log('✅ dotenv installé avec succès');
} catch (err) {
  console.error('❌ Erreur lors de l\'installation de dotenv:', err);
}

// 3. Mettre à jour le fichier config.js dans le backend
console.log('\n🔄 Mise à jour du fichier de configuration de la base de données...');
try {
  const configPath = path.join(BACKEND_DIR, 'database', 'config.js');
  const configContent = `const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbType = process.env.DB_TYPE || 'sqlite';
let sequelize;

if (dbType === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        dateStrings: true,
        typeCast: true
      },
      timezone: '+01:00'
    }
  );
}

module.exports = sequelize;`;

  fs.writeFileSync(configPath, configContent);
  console.log('✅ database/config.js mis à jour');
} catch (err) {
  console.error('❌ Erreur lors de la mise à jour du fichier de configuration:', err);
}

// 4. Scanner les fichiers pour trouver et remplacer les URLs codées en dur
console.log('\n🔍 Recherche et remplacement des URLs codées en dur...');

// Liste des répertoires à analyser dans le frontend
const frontendDirs = [
  path.join(FRONTEND_DIR, 'src'),
  path.join(FRONTEND_DIR, 'src', 'components'),
  path.join(FRONTEND_DIR, 'src', 'pages'),
  path.join(FRONTEND_DIR, 'src', 'contexts')
];

// Liste des répertoires à analyser dans le backend
const backendDirs = [
  BACKEND_DIR,
  path.join(BACKEND_DIR, 'database')
];

// Fonction pour parcourir les fichiers et remplacer les URLs
function processDirectory(dir, isBackend) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorer les dossiers node_modules, dist, et autres
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        processDirectory(filePath, isBackend);
      }
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Remplacer les URLs codées en dur dans le frontend
        if (!isBackend) {
          content = content.replace(
            /(['"])http:\/\/localhost:5001(\/api\/?[^'"]*)?(['"])/g, 
            '`${import.meta.env.VITE_API_URL || \'http://localhost:5001\'}$2`'
          );
          
          content = content.replace(
            /const BACKEND_URL\s*=\s*(['"])http:\/\/localhost:5001(['"])/g,
            'const BACKEND_URL = import.meta.env.VITE_API_URL || $1http://localhost:5001$2'
          );
        }
        
        // Remplacer dans le backend
        if (isBackend) {
          content = content.replace(
            /app\.use\(cors\(\{\s*origin:\s*['"]\*['"]/g,
            'app.use(cors({ origin: process.env.CORS_ORIGIN || "*"'
          );
          
          // Remplacer le chemin de Chrome codé en dur
          content = content.replace(
            /executablePath:\s*['"]C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome\.exe['"]/g,
            'executablePath: process.env.CHROME_PATH || undefined'
          );
          
          // Remplacer la destination des fichiers temporaires
          content = content.replace(
            /const dir = path\.join\(__dirname, ['"]temp['"]\)/g,
            'const dir = process.env.TEMP_DIR ? path.join(__dirname, process.env.TEMP_DIR) : path.join(__dirname, \'temp\')'
          );
        }
        
        // Écrire le fichier seulement s'il y a des changements
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ URLs remplacées dans ${filePath}`);
        }
      } catch (err) {
        console.error(`❌ Erreur lors du traitement de ${filePath}:`, err);
      }
    }
  }
}

// Traiter tous les répertoires
try {
  for (const dir of frontendDirs) {
    if (fs.existsSync(dir)) {
      processDirectory(dir, false);
    }
  }
  
  for (const dir of backendDirs) {
    if (fs.existsSync(dir)) {
      processDirectory(dir, true);
    }
  }
} catch (err) {
  console.error('❌ Erreur lors du traitement des fichiers:', err);
}

// 5. Mettre à jour le server.js du backend pour charger dotenv
console.log('\n🔄 Mise à jour du serveur backend...');
try {
  const serverPath = path.join(BACKEND_DIR, 'server.js');
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Ajouter l'import de dotenv s'il n'existe pas déjà
  if (!serverContent.includes('require(\'dotenv\').config()') && 
      !serverContent.includes('require("dotenv").config()')) {
    serverContent = 'require(\'dotenv\').config();\n' + serverContent;
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ server.js mis à jour avec require dotenv');
  }
} catch (err) {
  console.error('❌ Erreur lors de la mise à jour du serveur backend:', err);
}

// 6. Créer un script de build frontend et de démarrage global
console.log('\n📝 Création des scripts de déploiement...');

try {
  // Créer un script de démarrage pour le déploiement
  const startScript = `#!/bin/bash
# Script de démarrage pour WhatsLand en production

# Build du frontend
echo "📦 Build du frontend..."
cd frontend
npm run build

# Démarrage du backend
echo "🚀 Démarrage du backend..."
cd ../backend
node server.js
`;

  fs.writeFileSync(path.join(ROOT_DIR, 'start_production.sh'), startScript);
  console.log('✅ Script de démarrage start_production.sh créé');
  
  // Ajouter les permissions d'exécution sous Linux/Mac
  try {
    execSync('chmod +x start_production.sh', { stdio: 'inherit' });
  } catch (err) {
    // Ignorer les erreurs sous Windows
  }
  
  // Script PowerShell pour Windows
  const startScriptWindows = `# Script de démarrage pour WhatsLand en production

# Build du frontend
Write-Host "📦 Build du frontend..."
cd frontend
npm run build

# Démarrage du backend
Write-Host "🚀 Démarrage du backend..."
cd ../backend
node server.js
`;

  fs.writeFileSync(path.join(ROOT_DIR, 'start_production.ps1'), startScriptWindows);
  console.log('✅ Script de démarrage start_production.ps1 créé pour Windows');
} catch (err) {
  console.error('❌ Erreur lors de la création des scripts de démarrage:', err);
}

// Conclusion
console.log('\n✨ Préparation pour le déploiement terminée!');
console.log('📋 Prochaines étapes:');
console.log('1. Vérifiez les fichiers .env et .env.production et ajustez les valeurs selon votre environnement de production');
console.log('2. Pour un déploiement sur MySQL, modifiez DB_TYPE=mysql dans le fichier .env du backend');
console.log('3. Pour démarrer en production:');
console.log('   - Linux/Mac: ./start_production.sh');
console.log('   - Windows: .\\start_production.ps1');
console.log('\n🚀 Bonne chance pour votre déploiement!'); 