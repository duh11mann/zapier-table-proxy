/**
 * /api/prefill‑callback.js
 * ---------------------------------------------------------------------
 * Receives a JSON payload from Zapier, stores it in Vercel KV for up to
 * 48 h, and replies with CORS‑friendly JSON.
 *
 *   POST  https://<your‑domain>/api/prefill‑callback
 * ---------------------------------------------------------------------
 * ENVIRONMENT
 *   • KV_REST_API_URL
 *   • KV_REST_API_TOKEN
 *   • (optional) KV_REST_API_READ_ONLY_TOKEN
 * ---------------------------------------------------------------------
 */

const { kv } = require('@vercel/kv');

/* ------------------------------------------------------------------ */
/* Helper: add the minimum CORS headers we need for the browser fetch */
/* ------------------------------------------------------------------ */
function allowCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ------------------------------------------------------------------ */
/* Main handler                                                        */
/* ------------------------------------------------------------------ */
module.exports = async function handler(req, res) {
  /* 1 ─ OPTIONS pre‑flight  ---------------------------------------- */
  if (req.method === 'OPTIONS') {
    allowCORS(res);
    return res.status(200).end();              // empty OK
  }

  /* 2 ─ Guard: only POST is supported ------------------------------ */
  if (req.method !== 'POST') {
    allowCORS(res);
    return res.status(405).json({ error: 'method‑not‑allowed' });
  }

  /* 3 ─ Parse & validate body -------------------------------------- */
  let body = {};
  try {
    /* In Vercel Functions, body is already parsed for JSON requests.
       If that ever changes, fall back to manual parsing. */
    body = req.body ?? {};
    if (typeof body === 'string') body = JSON.parse(body);
  } catch (err) {
    allowCORS(res);
    return res.status(400).json({ error: 'invalid‑json', detail: String(err) });
  }

  const token       = String(body.token       ?? '').trim();   // a.k.a. “access”
  const requestId   = String(body.request_id  ?? '').trim();
  if (!token || !requestId) {
    allowCORS(res);
    return res.status(400).json({ error: 'missing‑token‑or‑request_id' });
  }

  /* 4 ─ Persist row in KV  ----------------------------------------- */
  const key = `${token}:${requestId}`;        // ▶ 3061964140:80dfe821‑…
  try {
    await kv.set(key, JSON.stringify(body), {        // value as JSON string
      ex: 60 * 60 * 24 * 2                           // 48‑hour TTL
    });
    console.log('[prefill‑callback] saved →', key);
  } catch (err) {
    console.error('[prefill‑callback] KV error:', err);
    allowCORS(res);
    return res.status(500).json({ error: 'kv‑write‑failed', detail: String(err) });
  }

  /* 5 ─ Reply  ------------------------------------------------------ */
  allowCORS(res);
  return res.status(200).json({ status: 'ok' });
};
