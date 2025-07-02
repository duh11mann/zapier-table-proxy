/**
 * /api/prefill-request
 * --------------------
 * 1.  Creates (or fetches) a request-id for the given token.
 * 2.  Always answers CORS pre-flights so the browser can call it directly.
 */

const crypto = require("crypto");

/* ----------  CORS helper  ---------- */
function allowCORS(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  /* 0️⃣  Handle the browser’s OPTIONS pre-flight */
  if (req.method === "OPTIONS") {
    allowCORS(res);
    return res.status(200).end();
  }

  /* 1️⃣  Only POST is allowed */
  if (req.method !== "POST") {
    allowCORS(res);
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).end();
  }

  /* 2️⃣  Validate body */
  const { token } = req.body ?? {};
  if (!token) {
    allowCORS(res);
    return res.status(400).json({ error: "missing token" });
  }

  /* 3️⃣  Create (or look-up) a request-id */
  // 👉  Replace this with your real persistence (Sheet, DB, etc.)
  const request_id = crypto.randomUUID();

  // Example: store an empty row keyed by request_id so /prefill-result
  // can fill it later.  Skip or replace with real storage as needed.
  //
  // await saveRow({ request_id, token, created_at: Date.now() });

  /* 4️⃣  Success */
  allowCORS(res);
  return res.status(200).json({ request_id });
}
