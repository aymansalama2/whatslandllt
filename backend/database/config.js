const { Sequelize } = require('sequelize');
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

module.exports = sequelize;