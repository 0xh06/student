// api/users.js — Admin: list, update, delete users
import { getDb } from "../lib/db.js";
import { getUserFromRequest } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const caller = getUserFromRequest(req);
  if (!caller || caller.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }

  const sql = getDb();

  // ── GET /api/users — List all users
  if (req.method === "GET") {
    try {
      const rows = await sql`
        SELECT id, email, firstname, lastname, phone, role, class, "group", created_at
        FROM users
        ORDER BY created_at DESC
      `;
      return res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PUT /api/users — Update a user
  if (req.method === "PUT") {
    const { id, firstname, lastname, email, phone, role, class: userClass, group } = req.body;
    if (!id) return res.status(400).json({ error: "ID requis" });
    try {
      await sql`
        UPDATE users SET
          firstname = ${firstname || null},
          lastname  = ${lastname  || null},
          email     = ${email},
          phone     = ${phone     || null},
          role      = ${role      || "student"},
          class     = ${userClass || null},
          "group"   = ${group     || null}
        WHERE id = ${id}
      `;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE /api/users?id=XX — Delete a user
  if (req.method === "DELETE") {
    const id = req.query?.id;
    if (!id) return res.status(400).json({ error: "ID requis" });
    // Prevent self-deletion
    if (parseInt(id) === caller.id) {
      return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
    }
    try {
      await sql`DELETE FROM users WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}