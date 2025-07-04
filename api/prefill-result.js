// api/prefill-result.js   • Node 18 / Vercel (ESM)

import { randomUUID } from "crypto";

const SECRET = process.env.ZAPIER_STORE_SECRET;
const BASE   = "https://store.zapier.com/api/records";

/* ── CORS helper ───────────────────────────────────────── */
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/* ── Main handler ─────────────────────────────────────── */
export default async function handler(req, res) {
  /* CORS pre-flight */
  if (req.method === "OPTIONS") { cors(res); return res.status(200).end(); }
  if (req.method !== "POST")    { cors(res); return res.status(405).end(); }

  /* Validate body */
  const { token = "", request_id: reqIdIn } = req.body ?? {};
  if (!token) { cors(res); return res.status(400).json({ error: "missing token" }); }

  const request_id = reqIdIn || randomUUID();

  /* Fetch record from Zapier Storage */
  const zr = await fetch(`${BASE}?secret=${SECRET}&key=${encodeURIComponent(token)}`);
  if (!zr.ok) { cors(res); return res.status(401).end(); }          // 403 / 404

  const data   = await zr.json();          // { "<token>": value }
  let   record = data[token];

  /* Parse if the value is a JSON string */
  if (typeof record === "string") {
    try { record = JSON.parse(record); } catch { record = null; }
  }
  if (!record) { cors(res); return res.status(401).end(); }

  /* Still waiting for verify-pin to remove the pin? */
  if ("pin" in record) {
    cors(res);
    return res.status(202).json({ status: "pending", request_id });
  }

  /* Success – return the pre-fill fields (housekeeping removed) */
  const { created_at, expires_at, ...prefill } = record;
  cors(res);
  return res.status(200).json({ request_id, ...prefill });
}
