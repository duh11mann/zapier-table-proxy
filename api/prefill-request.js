// api/prefill-request.js   (Node 18 on Vercel)
const { randomUUID } = require("crypto");

const SECRET = process.env.ZAPIER_STORE_SECRET;
const BASE   = "https://store.zapier.com/api/records";

function cors (res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler (req, res) {
  /* ── CORS pre-flight ── */
  if (req.method === "OPTIONS") { cors(res); return res.status(200).end(); }

  if (req.method !== "POST") { cors(res); return res.status(405).end(); }

  const { token = "", request_id: reqIdIn } = req.body ?? {};
  if (!token) { cors(res); return res.status(400).json({ error: "missing token" }); }

  /* ── Reuse or create request_id ── */
  const request_id = reqIdIn || randomUUID();

  /* ── Fetch Storage record ── */
  const zr = await fetch(
    `${BASE}?secret=${SECRET}&key=${encodeURIComponent(token)}`
  );
  if (!zr.ok) { cors(res); return res.status(401).end(); }          // 403/404 → not verified
  const data   = await zr.json();                                   // { "<token>": value }
  let   record = data[token];

  /* Storage may return a JSON string – parse if so */
  if (typeof record === "string") {
    try { record = JSON.parse(record); } catch { record = null; }
  }
  if (!record) { cors(res); return res.status(401).end(); }

  /* If pin still present ⇒ verification not complete */
  if ("pin" in record) {
    cors(res);
    return res.status(202).json({ status: "pending", request_id });
  }

  /* Success: strip housekeeping fields & return prefills */
  const { created_at, expires_at, ...prefill } = record;

  cors(res);
  return res.status(200).json({ request_id, ...prefill });
};
