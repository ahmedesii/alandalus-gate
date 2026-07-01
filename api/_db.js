// /api/_db.js
// Shared helper to connect to Vercel Postgres and ensure the users table exists.
const { sql } = require('@vercel/postgres');

let initialized = false;

async function ensureTable() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  initialized = true;
}

module.exports = { sql, ensureTable };
