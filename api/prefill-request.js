// api/prefill-request.js  –  Node 18 on Vercel

const { randomUUID } = require("crypto");

const SECRET = process.env.ZAPIER_STORE_SECRET;
const BASE   = "https://store.zapier.com/api/records";

/* CORS helper */
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  /* ── CORS pre-flight ─────────────────────── */
  if (req.method === "OPTIONS") { cors(res); return res.status(200).end(); }
  if (req.method !== "POST")    { cors(res); return res.status(405).end(); }

  /* ── Validate body ───────────────────────── */
  const { token = "", request_id: reqIdIn } = req.body ?? {};
  if (!token) { cors(res); return res.status(400).json({ error: "missing token" }); }

  /* ── Re-use or mint request_id ───────────── */
  const request_id = reqIdIn || randomUUID();

  /* ── Fetch record from Storage ───────────── */
  const zr = await fetch(`${BASE}?secret=${SECRET}&key=${encodeURIComponent(token)}`);
  if (!zr.ok) { cors(res); return res.status(401).end(); }        // 403 / 404

  const data   = await zr.json();        // { "<token>": value }
  let   record = data[token];

  /* May be stringified – parse if so */
  if (typeof record === "string") {
    try { record = JSON.parse(record); } catch { record = null; }
  }
  if (!record) { cors(res); return res.status(401).end(); }

  /* ── Still waiting for PIN removal? ──────── */
  if ("pin" in record) {
    cors(res);
    return res.status(202).json({ status: "pending", request_id });
  }

  /* ── Success: return pre-fill data ───────── */
  const { created_at, expires_at, ...prefill } = record;   // drop housekeeping
  cors(res);
  return res.status(200).json({ request_id, ...prefill });
};
