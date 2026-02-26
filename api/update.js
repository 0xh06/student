// api/update.js — Update profile with optional photo upload via Vercel Blob
import { getDb } from "../lib/db.js";
import { getUserFromRequest } from "../lib/auth.js";
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: false } };

async function parseMultipart(req) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) throw new Error("No boundary found");

  const boundary = "--" + boundaryMatch[1];
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const fields = {};
  let fileBuffer = null, fileName = null, fileMime = null;

  const boundaryBuf = Buffer.from(boundary);
  const parts = splitBuffer(body, boundaryBuf);

  for (const part of parts) {
    if (!part.length) continue;
    const sep = part.indexOf("\r\n\r\n");
    if (sep === -1) continue;
    const headerStr = part.slice(0, sep).toString("utf8");
    const content = part.slice(sep + 4);
    const value = content.slice(0, content.length - 2);
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const mimeMatch = headerStr.match(/Content-Type:\s*(.+)/i);
    if (!nameMatch) continue;
    if (filenameMatch) {
      fileName = filenameMatch[1];
      fileMime = mimeMatch ? mimeMatch[1].trim() : "application/octet-stream";
      fileBuffer = value;
    } else {
      fields[nameMatch[1]] = value.toString("utf8");
    }
  }
  return { fields, file: fileBuffer ? { buffer: fileBuffer, name: fileName, mime: fileMime } : null };
}

function splitBuffer(buf, separator) {
  const parts = [];
  let start = 0, idx = buf.indexOf(separator);
  while (idx !== -1) { parts.push(buf.slice(start, idx)); start = idx + separator.length; idx = buf.indexOf(separator, start); }
  parts.push(buf.slice(start));
  return parts;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = getUserFromRequest(req);
  if (!user) { res.writeHead(302, { Location: "/login.html" }); return res.end(); }

  try {
    const { fields, file } = await parseMultipart(req);
    const { firstname, lastname, phone, language, birthdate, city, nationality, bio, linkedin, github } = fields;

    let photoUrl = null;
    if (file && file.buffer && file.buffer.length > 0) {
      const ext = file.name.split(".").pop();
      const blob = await put(`photos/${user.id}-${Date.now()}.${ext}`, file.buffer, {
        access: "public", contentType: file.mime,
      });
      photoUrl = blob.url;
    }

    const sql = getDb();
    if (photoUrl) {
      await sql`
        UPDATE users SET
          firstname=${firstname}, lastname=${lastname}, phone=${phone},
          language=${language}, birthdate=${birthdate||null}, city=${city||null},
          nationality=${nationality||null}, bio=${bio||null},
          linkedin=${linkedin||null}, github=${github||null}, photo=${photoUrl}
        WHERE id = ${user.id}
      `;
    } else {
      await sql`
        UPDATE users SET
          firstname=${firstname}, lastname=${lastname}, phone=${phone},
          language=${language}, birthdate=${birthdate||null}, city=${city||null},
          nationality=${nationality||null}, bio=${bio||null},
          linkedin=${linkedin||null}, github=${github||null}
        WHERE id = ${user.id}
      `;
    }

    res.writeHead(302, { Location: "/dashboard.html?updated=1" });
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
}