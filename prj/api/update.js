// api/update.js — Update profile with optional photo upload via Vercel Blob
import { getDb } from "../lib/db.js";
import { getUserFromRequest } from "../lib/auth.js";
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false, // We handle multipart manually
  },
};

// Parse multipart form data manually using the Web Streams API
async function parseMultipart(req) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) throw new Error("No boundary found");

  const boundary = "--" + boundaryMatch[1];

  // Read raw body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const fields = {};
  let fileBuffer = null;
  let fileName = null;
  let fileMime = null;

  // Split by boundary
  const boundaryBuf = Buffer.from(boundary);
  const parts = splitBuffer(body, boundaryBuf);

  for (const part of parts) {
    if (!part.length) continue;

    // Find header/body separator (\r\n\r\n)
    const sep = part.indexOf("\r\n\r\n");
    if (sep === -1) continue;

    const headerStr = part.slice(0, sep).toString("utf8");
    const content = part.slice(sep + 4);
    // Remove trailing \r\n
    const value = content.slice(0, content.length - 2);

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const mimeMatch = headerStr.match(/Content-Type:\s*(.+)/i);

    if (!nameMatch) continue;
    const fieldName = nameMatch[1];

    if (filenameMatch) {
      // It's a file
      fileName = filenameMatch[1];
      fileMime = mimeMatch ? mimeMatch[1].trim() : "application/octet-stream";
      fileBuffer = value;
    } else {
      // It's a text field
      fields[fieldName] = value.toString("utf8");
    }
  }

  return { fields, file: fileBuffer ? { buffer: fileBuffer, name: fileName, mime: fileMime } : null };
}

function splitBuffer(buf, separator) {
  const parts = [];
  let start = 0;
  let idx = buf.indexOf(separator);
  while (idx !== -1) {
    parts.push(buf.slice(start, idx));
    start = idx + separator.length;
    idx = buf.indexOf(separator, start);
  }
  parts.push(buf.slice(start));
  return parts;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = getUserFromRequest(req);
  if (!user) {
    res.writeHead(302, { Location: "/login.html" });
    return res.end();
  }

  try {
    const { fields, file } = await parseMultipart(req);
    const { firstname, lastname, phone, language } = fields;

    let photoName = null;

    // Upload photo to Vercel Blob if provided
    if (file && file.buffer && file.buffer.length > 0) {
      const ext = file.name.split(".").pop();
      const blobName = `photos/${user.id}-${Date.now()}.${ext}`;
      const blob = await put(blobName, file.buffer, {
        access: "public",
        contentType: file.mime,
      });
      photoName = blob.url; // Full URL from Vercel Blob
    }

    const sql = getDb();

    if (photoName) {
      await sql`
        UPDATE users
        SET firstname = ${firstname}, lastname = ${lastname},
            phone = ${phone}, language = ${language}, photo = ${photoName}
        WHERE id = ${user.id}
      `;
    } else {
      await sql`
        UPDATE users
        SET firstname = ${firstname}, lastname = ${lastname},
            phone = ${phone}, language = ${language}
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
