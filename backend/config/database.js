const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'iem_admission.sqlite');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[SQL DB] Connection error:', err.message);
  } else {
    console.log('[SQL DB] Connected successfully to SQLite database at:', DB_PATH);
  }
});

// Enable Foreign Key constraints in SQLite
db.run('PRAGMA foreign_keys = ON;');

// Helper to execute query with Promise
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Helper to execute single row query with Promise
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Helper to execute run (INSERT, UPDATE, DELETE) with Promise returning lastID and changes
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Execute multiple statements (e.g., schema creation)
function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Initialize tables from schema.sql
async function initSchema() {
  try {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await exec(schemaSql);
    console.log('[SQL DB] Relational schema verified & tables initialized.');
  } catch (err) {
    console.error('[SQL DB] Schema initialization error:', err.message);
  }
}

module.exports = {
  db,
  query,
  get,
  run,
  exec,
  initSchema
};
