import { getDb } from "../lib/db.js";
import { getUserFromRequest } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Non autorisé" });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, email, firstname, lastname, phone, photo, language, role, created_at
      FROM users WHERE id = ${user.id} LIMIT 1
    `;

    if (!rows[0]) return res.status(404).json({ error: "Utilisateur non trouvé" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}