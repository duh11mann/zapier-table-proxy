const SECRET = process.env.ZAPIER_STORE_SECRET;
const BASE   = "https://store.zapier.com/api/records";

export default async function handler(req, res) {
  const ORIGIN = process.env.ALLOWED_ORIGIN || "*";

  /* ───────── CORS pre-flight ───────── */
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin",  ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).end("Method Not Allowed");
  }

  /* ───────── Validate body ───────── */
  const { token = "", pin = "" } = req.body || {};
  if (!token || !/^\d{6}$/.test(pin)) {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    return res.status(400).end("Bad Request");
  }

  /* ───────── Fetch record ───────── */
  const r = await fetch(
    `${BASE}?secret=${SECRET}&key=${encodeURIComponent(token)}`
  );
  if (!r.ok) {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    return res.status(401).end("Unauthorized");
  }

  const data   = await r.json();          // { "<token>": value }
  let   record = data[token];

  /* 🔑  NEW: handle stringified JSON from Storage */
  if (typeof record === "string") {
    try { record = JSON.parse(record); }  // { pin, created_at, … }
    catch { /* malformed */ record = null; }
  }

  if (!record) {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    return res.status(401).end("Unauthorized");
  }

  /* ───────── TTL + PIN checks ───────── */
  const expired =
    Date.now() - Date.parse(record.created_at || 0) > 15 * 60 * 1000;
  const pinMatches = String(pin) === String(record.pin);

  if (expired || !pinMatches) {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    return res.status(401).end("Unauthorized");
  }

  /* ───────── Delete key so it can’t be reused ───────── */
  await fetch(`${BASE}?secret=${SECRET}`, {
    method : "PATCH",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ [token]: null })
  }).catch(() => {});

  /* ───────── Success ───────── */
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({ ok: true });
}
