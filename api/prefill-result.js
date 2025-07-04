// api/prefill-result.js   • Node 18 on Vercel
import { randomUUID } from "crypto";

const SECRET = process.env.ZAPIER_STORE_SECRET;             // same secret
const BASE   = "https://store.zapier.com/api/records";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  /* CORS pre-flight */
  if (req.method === "OPTIONS") { cors(res); return res.status(200).end(); }
  if (req.method !== "POST")    { cors(res); return res.status(405).end(); }

  /* Validate body */
  const { token = "", request_id: reqIdIn } = req.body ?? {};
  if (!token) { cors(res); return res.status(400).json({ error: "missing token" }); }

  const request_id = reqIdIn || randomUUID();

  /* Fetch record */
  const zr = await fetch(`${BASE}?secret=${SECRET}&key=${encodeURIComponent(token)}`);
  if (!zr.ok) { cors(res); return res.status(401).end(); }          // 403 / 404

  const data   = await zr.json();
  let   record = data[token];

  if (typeof record === "string") {
    try { record = JSON.parse(record); } catch { record = null; }
  }
  if (!record) { cors(res); return res.status(401).end(); }

  /* Keep polling until verify-pin removes pin */
  if ("pin" in record) {
    cors(res);
    return res.status(202).json({ status: "pending", request_id });
  }

  /* Success: send pre-fill data */
  const { created_at, expires_at, ...prefill } = record;
  cors(res);
  return res.status(200).json({ request_id, ...prefill });
}
