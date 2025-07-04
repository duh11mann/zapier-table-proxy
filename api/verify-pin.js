/**
 * /api/verify-pin.js
 * Node-based Vercel Serverless Function
 *   POST   → verify 6-digit PIN stored in Zapier Storage
 *   OPTIONS → CORS pre-flight
 *
 * Env vars required:
 *   ZAPIER_STORE_SECRET   – same secret used when writing the record
 *   ALLOWED_ORIGIN        – e.g. https://synergosadvice.com  (or * for testing)
 */

export default async function handler(req, res) {
  const ORIGIN = process.env.ALLOWED_ORIGIN || "*";

  /* ──────────────────────────────────────────────
     1.  CORS pre-flight
  ────────────────────────────────────────────── */
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin",  ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();                 // no body
  }

  /* ──────────────────────────────────────────────
     2.  Guard other verbs
  ────────────────────────────────────────────── */
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).end("Method Not Allowed");
  }

  /* ──────────────────────────────────────────────
     3.  Parse JSON body
  ────────────────────────────────────────────── */
  const { token = "", pin = "" } = req.body || {};
  if (!token || !/^\d{6}$/.test(pin)) {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    return res.status(400).end("Bad Request");
  }

  /* ──────────────────────────────────────────────
     4.  Fetch stored record from Zapier Storage
  ────────────────────────────────────────────── */
  const url = `https://store.zapier.com/api/records/${encodeURIComponent(
    token
  )}?secret=${process.env.ZAPIER_STORE_SECRET}`;

  const zr = await fetch(url);
  if (!zr.ok) {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    return res.status(401).end("Unauthorized");
  }

  const { pin: storedPin, created_at } = await zr.json();

  /* ──────────────────────────────────────────────
     5.  Optional expiry (15-minute TTL)
  ────────────────────────────────────────────── */
  const ttlMs = 15 * 60 * 1000;
  if (Date.now() - Date.parse(created_at) > ttlMs) {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    return res.status(401).end("Expired");
  }

  /* ──────────────────────────────────────────────
     6.  Constant-time comparison
  ────────────────────────────────────────────── */
  const valid =
    pin.length === storedPin.length &&
    [...pin].every((c, i) => c === storedPin[i]);

  if (!valid) {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    return res.status(401).end("Unauthorized");
  }

  /* ──────────────────────────────────────────────
     7.  Success → delete record & respond
  ────────────────────────────────────────────── */
  await fetch(url, { method: "DELETE" }).catch(() => {});

  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({ ok: true });
}
