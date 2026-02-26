// api/logout.js
import { clearCookieHeader } from "../lib/auth.js";

export default function handler(req, res) {
  res.writeHead(302, {
    "Set-Cookie": clearCookieHeader(),
    Location: "/login.html",
  });
  res.end();
}
