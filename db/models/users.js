

module.exports = function(db) {
  db.define('Users', {
    nonce: {
      type: db.DataTypes.INTEGER,
      allowNull: false, 
      defaultValue: () => Math.floor(Math.random() * 10000),
    },
    publicAddress: {
      type: db.DataTypes.STRING,
      allowNull: false
    },
  }, {
    schema: 'polling_schema', // Define schema name for the table
    tableName: 'users', // Define table name explicitly
  });
}