import bcrypt from "bcryptjs";
import { getDb } from "../lib/db.js";
import { signToken, setCookieHeader } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body;

  if (!email || !password) {
    res.writeHead(302, { Location: "/login.html?error=missing" });
    return res.end();
  }

  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    const user = rows[0];

    if (!user) {
      res.writeHead(302, { Location: "/login.html?error=notfound" });
      return res.end();
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.writeHead(302, { Location: "/login.html?error=password" });
      return res.end();
    }

    // ✅ On inclut le role dans le token
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.writeHead(302, {
      "Set-Cookie": setCookieHeader(token),
      Location: "/dashboard.html",
    });
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}