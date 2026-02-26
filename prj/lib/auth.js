// lib/auth.js — JWT helpers
import jwt from "jsonwebtoken";
import cookie from "cookie";

const SECRET = process.env.JWT_SECRET || "change-me-in-production";
const COOKIE_NAME = "student_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  return cookies[COOKIE_NAME] || null;
}

export function getUserFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function setCookieHeader(token) {
  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export function clearCookieHeader() {
  return cookie.serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
