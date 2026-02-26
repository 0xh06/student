// api/make-admin.js — Route TEMPORAIRE pour se passer en admin
// ⚠️ SUPPRIME CE FICHIER après usage !
import { getDb } from "../lib/db.js";
import { getUserFromRequest, signToken, setCookieHeader } from "../lib/auth.js";

const MAKE_ADMIN_SECRET = process.env.MAKE_ADMIN_SECRET || "nexus-admin-secret";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  // Vérification du secret dans l'URL: /api/make-admin?secret=nexus-admin-secret
  const secret = req.query?.secret || new URL(req.url, "http://x").searchParams.get("secret");
  if (secret !== MAKE_ADMIN_SECRET) {
    return res.status(403).json({ error: "Secret incorrect" });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Connecte-toi d'abord avant d'appeler cette route" });
  }

  try {
    const sql = getDb();
    await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id}`;

    // Renouvelle le token JWT avec le nouveau rôle admin
    const newToken = signToken({ id: user.id, email: user.email, role: "admin" });

    res.writeHead(302, {
      "Set-Cookie": setCookieHeader(newToken),
      Location: "/dashboard.html?upgraded=1",
    });
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}