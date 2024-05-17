const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_USER_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, 
  dialect: process.env.DB_DIALECT,
  default: console.log
});

db.DataTypes = DataTypes;
db.Op = Sequelize.Op;

// require('./models/balances')(db);
const models = fs.readdirSync(path.join(__dirname + '/models'));
for(const model of models){
  require('./models/' + model)(db);
}
module.exports = {
  db
}