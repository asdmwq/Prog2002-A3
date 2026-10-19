/**
 * event_db.js
 * MySQL connection pool for the charityevents_db database.
 * Uses the mysql2 promise API so routes can be written with async/await.
 * Credentials come from environment variables when present, otherwise they
 * fall back to the local development defaults.
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'event_user',
  password: process.env.DB_PASSWORD || 'event_pass_2026',
  database: process.env.DB_NAME || 'charityevents_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

module.exports = pool;
