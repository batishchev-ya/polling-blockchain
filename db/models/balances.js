

module.exports = function(db) {
  db.define('Balances', {
    tokenAddress: {
        type: db.DataTypes.STRING,
        allowNull: false
    },
    accountAddress: {
        type: db.DataTypes.STRING,
        allowNull: false
    },
    balance: {
      type: db.DataTypes.DOUBLE,
      allowNull: true,
    },
    tokenName: {
        type: db.DataTypes.STRING,
        allowNull: true
    },
  }, {
    schema: 'polling_schema', // Define schema name for the table
    tableName: 'balances', // Define table name explicitly
  });
}