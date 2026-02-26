// api/register.js — Admin-only account creation
import bcrypt from "bcryptjs";
import { getDb } from "../lib/db.js";
import { getUserFromRequest } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Only admins can create accounts
  const creator = getUserFromRequest(req);
  if (!creator || creator.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }

  const { email, password, firstname, lastname, role, class: userClass, group } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Mot de passe trop court (min. 6 caractères)" });
  }

  try {
    const sql = getDb();
    const hash = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (email, password, firstname, lastname, role, class, "group")
      VALUES (${email}, ${hash}, ${firstname || null}, ${lastname || null},
              ${role || "student"}, ${userClass || null}, ${group || null})
    `;

    res.writeHead(302, { Location: "/dashboard.html?created=1" });
    res.end();
  } catch (err) {
    if (err.message?.includes("unique") || err.message?.includes("duplicate")) {
      res.writeHead(302, { Location: "/dashboard.html?error=exists" });
      res.end();
    } else {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
}