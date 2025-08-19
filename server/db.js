const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./spectator.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS computers (
      hostname TEXT PRIMARY KEY,
      group_name TEXT
    )
  `);
});

module.exports = db;