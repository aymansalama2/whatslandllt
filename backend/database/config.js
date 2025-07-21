const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbType = process.env.DB_TYPE || 'sqlite';
let sequelize;

if (dbType === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false,
    dialectOptions: {
      // Désactiver explicitement les contraintes de clé étrangère dans SQLite
      pragmas: {
        'foreign_keys': 'OFF'  // Désactiver les contraintes de clé étrangère
      }
    }
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

// Désactiver explicitement les contraintes de clé étrangère après la connexion
sequelize.afterConnect((connection) => {
  if (dbType === 'sqlite') {
    return new Promise((resolve, reject) => {
      connection.run('PRAGMA foreign_keys = OFF;', (err) => {
        if (err) {
          console.error('Erreur lors de la désactivation des contraintes de clé étrangère:', err);
          return reject(err);
        }
        console.log('Contraintes de clé étrangère désactivées avec succès');
        resolve();
      });
    });
  }
});

module.exports = sequelize;