const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbType = process.env.DB_TYPE || 'sqlite';
let sequelize;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 secondes

// Configuration optimisée pour SQLite avec gestion robuste
const sqliteConfig = {
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Configuration de retry améliorée
  retry: {
    max: 5,
    match: [
      /SQLITE_BUSY/,
      /SQLITE_LOCKED/,
      /SQLITE_CONSTRAINT/,
      /database is locked/,
      /database disk image is malformed/
    ],
    backoffBase: 1000,
    backoffExponent: 1.5
  },
  
  // Pool de connexions optimisé
  pool: {
    max: 10,
    min: 0,
    acquire: 60000,
    idle: 20000,
    evict: 30000,
    handleDisconnects: true
  },
  
  // Configuration transactionnelle
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  transactionType: 'IMMEDIATE',
  
  // Pragmas SQLite pour optimiser les performances
  dialectOptions: {
    busy_timeout: 30000,
    journal_mode: 'WAL',
    synchronous: 'NORMAL',
    temp_store: 'memory',
    mmap_size: 268435456, // 256MB
    cache_size: 10000,
    foreign_keys: 'OFF' // Désactivé pour éviter les conflits
  },
  
  // Hooks pour optimiser SQLite
  hooks: {
    afterConnect: async (connection) => {
      // Pragmas d'optimisation appliqués après connexion
      await connection.query('PRAGMA journal_mode = WAL;');
      await connection.query('PRAGMA synchronous = NORMAL;');
      await connection.query('PRAGMA cache_size = 10000;');
      await connection.query('PRAGMA temp_store = memory;');
      await connection.query('PRAGMA mmap_size = 268435456;');
      await connection.query('PRAGMA optimize;');
      console.log('✅ Pragmas SQLite optimisés appliqués');
    }
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

// Fonction pour créer une nouvelle connexion avec gestion robuste
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

    // Tester la connexion avec timeout
    const connectionPromise = sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 30000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Connexion à la base de données établie avec succès');
    
    // Réinitialiser le compteur de tentatives
    retryCount = 0;
    
    // Gérer la déconnexion avec retry intelligent
    sequelize.addHook('afterDisconnect', async () => {
      console.log('⚠️ Déconnexion de la base de données détectée');
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = RETRY_DELAY * Math.pow(2, retryCount - 1); // Backoff exponentiel
        console.log(`🔄 Tentative de reconnexion ${retryCount}/${MAX_RETRIES} dans ${delay/1000}s...`);
        setTimeout(createConnection, delay);
      } else {
        console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
        // Notifier les autres services de l'échec de connexion
        process.emit('databaseConnectionFailed', new Error('Max retries reached'));
      }
    });

    // Optimisations post-connexion pour SQLite
    if (dbType === 'sqlite') {
      // Vérifier l'intégrité de la base
      try {
        await sequelize.query('PRAGMA integrity_check;');
        console.log('✅ Intégrité de la base de données SQLite vérifiée');
      } catch (integrityError) {
        console.warn('⚠️ Problème d\'intégrité détecté:', integrityError.message);
      }

      // Configurer le nettoyage automatique
      setInterval(async () => {
        try {
          await sequelize.query('PRAGMA optimize;');
          await sequelize.query('PRAGMA wal_checkpoint(TRUNCATE);');
        } catch (optimizeError) {
          console.warn('⚠️ Erreur lors de l\'optimisation automatique:', optimizeError.message);
        }
      }, 300000); // Toutes les 5 minutes
    }

    return sequelize;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = RETRY_DELAY * Math.pow(2, retryCount - 1); // Backoff exponentiel
      console.log(`🔄 Tentative de reconnexion ${retryCount}/${MAX_RETRIES} dans ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
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