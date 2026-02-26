// api/profile.js — GET current user profile
import { getDb } from "../lib/db.js";
import { getUserFromRequest } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, email, firstname, lastname, phone, birthdate, city,
             nationality, bio, linkedin, github, photo, language,
             role, class, "group", created_at
      FROM users WHERE id = ${user.id} LIMIT 1
    `;

    if (!rows[0]) return res.status(404).json({ error: "Utilisateur introuvable" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}