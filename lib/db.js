// lib/db.js — Neon serverless PostgreSQL client
import { neon } from "@neondatabase/serverless";

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}

// Initialize tables (call once on first deploy via /api/init)
export async function initDb() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      email     TEXT UNIQUE NOT NULL,
      password  TEXT NOT NULL,
      firstname TEXT,
      lastname  TEXT,
      phone     TEXT,
      photo     TEXT    DEFAULT 'default.png',
      language  TEXT    DEFAULT 'fr',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  return { ok: true };
}
