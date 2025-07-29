const { DataTypes } = require('sequelize');
const sequelize = require('./config');
const fs = require('fs');
const path = require('path');

// Modèle User simplifié pour stocker les informations de profil
const User = sequelize.define('User', {
  uid: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true, // Permettre null pour éviter les erreurs de contrainte
    unique: true,
    validate: {
      isEmail: {
        msg: "L'email doit être valide"
      }
    }
  },
  nom: DataTypes.STRING,
  prenom: DataTypes.STRING,
  telephone: DataTypes.STRING,
  niche: DataTypes.STRING
});

// Modèle amélioré pour les numéros de téléphone avec statistiques
const PhoneNumber = sequelize.define('PhoneNumber', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  niche: {
    type: DataTypes.STRING,
    defaultValue: "default"
  },
  lastUsed: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  messagesSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successfulDeliveries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failedDeliveries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastMessageStatus: {
    type: DataTypes.STRING
  }
});

// Nouveau modèle pour les campagnes d'envoi (remplace MessageSend)
const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalRecipients: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successfulDeliveries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failedDeliveries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  messageType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'text'
  },
  startDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true // Explicitement autorisé à être null
  },
  niche: {
    type: DataTypes.STRING
  }
});

// Relations avec constraints: false pour éviter les erreurs de clé étrangère
User.hasMany(Campaign, { 
  foreignKey: 'userId', 
  constraints: false, // Désactivation des contraintes de clé étrangère
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

Campaign.belongsTo(User, { 
  foreignKey: 'userId', 
  constraints: false, // Désactivation des contraintes de clé étrangère
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Synchroniser la base de données
async function syncDatabase() {
  try {
    console.log('Contraintes de clé étrangère désactivées manuellement');
    
    // Nettoyer les doublons d'email avant la synchronisation
    try {
      await sequelize.query(`
        DELETE FROM Users 
        WHERE rowid NOT IN (
          SELECT MIN(rowid) 
          FROM Users 
          GROUP BY COALESCE(email, 'NULL_EMAIL_' || uid)
        );
      `);
      console.log('Doublons d\'email nettoyés');
    } catch (cleanupError) {
      console.log('Nettoyage des doublons ignoré:', cleanupError.message);
    }
    
    // Synchroniser avec gestion d'erreurs améliorée
    await sequelize.sync({ 
      alter: true,
      logging: false // Réduire les logs verbeux
    });
    console.log('Base de données synchronisée avec succès (tables conservées)');
  } catch (error) {
    console.error('Erreur lors de la synchronisation de la base de données:', error.message);
    
    // Essayer une synchronisation plus douce en cas d'erreur
    try {
      console.log('🔄 Tentative de synchronisation alternative...');
      await sequelize.sync({ 
        force: false, 
        alter: false,
        logging: false 
      });
      console.log('✅ Synchronisation alternative réussie');
    } catch (fallbackError) {
      console.error('❌ Échec de la synchronisation alternative:', fallbackError.message);
      // En cas d'échec total, continuer sans synchronisation
      console.log('⚠️  Continuant sans synchronisation de base de données');
    }
  }
}

module.exports = {
  User,
  PhoneNumber,
  Campaign,
  syncDatabase
}; 