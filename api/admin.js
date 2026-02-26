// api/admin.js — Route TEMPORAIRE pour se passer en admin
// ⚠️ SUPPRIME CE FICHIER après usage !
import { getDb } from "../lib/db.js";
import { getUserFromRequest, signToken, setCookieHeader } from "../lib/auth.js";

const MAKE_ADMIN_SECRET = "nexus-admin-secret";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  // Lecture du secret depuis l'URL
  const secret = req.query && req.query.secret;

  if (!secret || secret !== MAKE_ADMIN_SECRET) {
    return res.status(403).json({ error: "Secret incorrect", recu: secret });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Connecte-toi d'abord sur le site, puis reviens sur cette URL" });
  }

  try {
    const sql = getDb();
    await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id}`;

    const newToken = signToken({ id: user.id, email: user.email, role: "admin" });

    res.writeHead(302, {
      "Set-Cookie": setCookieHeader(newToken),
      Location: "/dashboard.html",
    });
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}