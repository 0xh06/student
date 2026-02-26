// lib/db.js — Neon serverless PostgreSQL client
import { neon } from "@neondatabase/serverless";

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}

export async function initDb() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id           SERIAL PRIMARY KEY,
      email        TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      firstname    TEXT,
      lastname     TEXT,
      phone        TEXT,
      birthdate    DATE,
      city         TEXT,
      nationality  TEXT,
      bio          TEXT,
      linkedin     TEXT,
      github       TEXT,
      photo        TEXT    DEFAULT 'default.png',
      language     TEXT    DEFAULT 'fr',
      role         TEXT    DEFAULT 'student',
      class        TEXT,
      "group"      TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  return { ok: true };
}