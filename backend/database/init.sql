
-- Script d'initialisation de la base de données WhatsLand
-- Ce script crée les tables nécessaires avec les bonnes relations

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS "Users" (
  "uid" VARCHAR(255) PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL,
  "nom" VARCHAR(255),
  "prenom" VARCHAR(255),
  "telephone" VARCHAR(255),
  "niche" VARCHAR(255),
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL
);

-- Table des numéros de téléphone
CREATE TABLE IF NOT EXISTS "PhoneNumbers" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "number" VARCHAR(255) UNIQUE,
  "messagesSent" INTEGER DEFAULT 0,
  "successfulDeliveries" INTEGER DEFAULT 0,
  "failedDeliveries" INTEGER DEFAULT 0,
  "lastUsed" DATETIME,
  "lastMessageStatus" VARCHAR(255),
  "niche" VARCHAR(255),
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL
);

-- Table des campagnes (sans contrainte de clé étrangère)
CREATE TABLE IF NOT EXISTS "Campaigns" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" VARCHAR(255) NOT NULL,
  "totalRecipients" INTEGER DEFAULT 0,
  "successfulDeliveries" INTEGER DEFAULT 0,
  "failedDeliveries" INTEGER DEFAULT 0,
  "messageType" VARCHAR(255) DEFAULT 'text',
  "startDate" DATETIME,
  "endDate" DATETIME,
  "userId" VARCHAR(255),
  "niche" VARCHAR(255),
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL
);

-- Insérer un utilisateur par défaut pour les tests
INSERT INTO "Users" ("uid", "email", "nom", "prenom", "telephone", "niche", "createdAt", "updatedAt")
VALUES ('default_user', 'default@whatsland.com', 'Utilisateur', 'Défaut', '', 'default', DATETIME('now'), DATETIME('now'));
  