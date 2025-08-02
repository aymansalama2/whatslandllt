const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbType = process.env.DB_TYPE || 'sqlite';
let sequelize;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 secondes

// Configuration de base pour SQLite
const sqliteConfig = {
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false,
  retry: {
    max: 3,
    match: [
      /SQLITE_BUSY/,
      /SQLITE_LOCKED/,
      /SQLITE_CONSTRAINT/
    ]
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Configuration de base pour MySQL
const mysqlConfig = {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
    connectTimeout: 30000
  },
  timezone: '+01:00',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3,
    match: [
      /Deadlock/i,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeConnectionTimedOutError/,
      /SequelizeConnectionAcquireTimeoutError/
    ]
  }
};

// Fonction pour créer une nouvelle connexion
async function createConnection() {
  try {
    if (dbType === 'sqlite') {
      sequelize = new Sequelize(sqliteConfig);
    } else {
      sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        mysqlConfig
      );
    }

    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie avec succès');
    
    // Réinitialiser le compteur de tentatives
    retryCount = 0;
    
    // Gérer la déconnexion
    sequelize.addHook('afterDisconnect', async () => {
      console.log('⚠️ Déconnexion de la base de données détectée');
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`🔄 Tentative de reconnexion ${retryCount}/${MAX_RETRIES} dans ${RETRY_DELAY/1000}s...`);
        setTimeout(createConnection, RETRY_DELAY);
      } else {
        console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
      }
    });

    return sequelize;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`🔄 Tentative de reconnexion ${retryCount}/${MAX_RETRIES} dans ${RETRY_DELAY/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createConnection();
    } else {
      console.error('❌ Nombre maximum de tentatives de connexion atteint');
      throw error;
    }
  }
}

// Créer la connexion initiale
createConnection().catch(error => {
  console.error('❌ Erreur fatale de connexion à la base de données:', error);
  process.exit(1);
});

module.exports = sequelize;