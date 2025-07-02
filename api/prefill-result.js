/**
 * /api/prefill-result
 * -------------------
 * Looks up the pre-fill row for {token, request_id}.
 * If the row hasn’t arrived yet we return 202 so the browser can poll again.
 */

/* ─── in-memory store (demo only) ─── */
const store = global.__PREFILL_STORE__ || (global.__PREFILL_STORE__ = {});

/* ----------  CORS helper ---------- */
function allowCORS(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  /* 0️⃣  Pre-flight */
  if (req.method === "OPTIONS") {
    allowCORS(res);
    return res.status(200).end();
  }

  /* 1️⃣  POST only */
  if (req.method !== "POST") {
    allowCORS(res);
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).end();
  }

  /* 2️⃣  Validate body */
  const { token, request_id } = req.body ?? {};
  if (!token || !request_id) {
    allowCORS(res);
    return res.status(400).json({ error: "missing token or request_id" });
  }

  /* 3️⃣  Look-up */
  const row = store[request_id];

  /* 4️⃣  Reply */
  allowCORS(res);

  if (!row) {
    return res.status(202).json({ status: "pending" });
  }

  // Optional: one-time use
  delete store[request_id];

  return res.status(200).json(row);
}
