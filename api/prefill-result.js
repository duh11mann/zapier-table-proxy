// /api/prefill-result.js
// ------------------------------------------------------------------
// 1️⃣  Small in-memory KV store shared by all invocations
const store = global.__PREFILL_STORE__ ||= {};

// 2️⃣  Helper: universal CORS
function allowCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  /* ── OPTIONS pre-flight ────────────────────────────────────────── */
  if (req.method === 'OPTIONS') {
    allowCORS(res);
    return res.status(200).end();
  }

  /* ── POST only ─────────────────────────────────────────────────── */
  if (req.method !== 'POST') {
    allowCORS(res);
    return res.status(405).end();
  }

  /* ── read JSON body instead of query-string ────────────────────── */
  const { request_id } = req.body ?? {};
  if (!request_id) {
    allowCORS(res);
    return res.status(400).json({ error: 'missing request_id' });
  }

  /* ── look up the row that Zap B wrote in /api/prefill-callback ─── */
  const row = store[request_id];
  allowCORS(res);                           // <- always set before responding

  if (!row) {
    // Still waiting for Zap B? 202 = “accepted, processing”
    return res.status(202).json({ status: 'pending' });
  }

  // one-shot: remove so the same link can’t be reused indefinitely
  delete store[request_id];
  return res.status(200).json({ status: 'ready', data: row });
}
