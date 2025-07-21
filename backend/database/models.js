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
    allowNull: false,
    unique: true
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
    // Ne pas utiliser force: true pour éviter de supprimer les données
    // Utiliser alter: true pour mettre à jour la structure si nécessaire
    await sequelize.sync({ alter: true });
    console.log('Base de données synchronisée avec succès (tables conservées)');
  } catch (error) {
    console.error('Erreur lors de la synchronisation de la base de données:', error);
  }
}

module.exports = {
  User,
  PhoneNumber,
  Campaign,
  syncDatabase
}; 