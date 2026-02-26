// api/init.js — Run once to create the DB table
// Visit: https://your-app.vercel.app/api/init
import { initDb } from "../lib/db.js";

export default async function handler(req, res) {
  try {
    await initDb();
    res.status(200).json({ message: "✅ Database initialized successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
