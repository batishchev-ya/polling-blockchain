const {db} = require('./db.js');

(async () => {
  await db.sync({ force: true });
})()