// /api/verify-pin.js
function allowCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ─────────────────────────────────────────────────────────────── */

export default async function handler(req, res) {
  /* --- CORS pre-flight ---------------------------------------- */
  if (req.method === 'OPTIONS') {
    allowCORS(res);
    return res.status(200).end();
  }

  /* --- POST only --------------------------------------------- */
  if (req.method !== 'POST') {
    allowCORS(res);
    return res.status(405).end();
  }

  /* --- validate body ----------------------------------------- */
  const { token, pin, request_id } = req.body ?? {};
  if (!token || !pin || !request_id) {
    allowCORS(res);
    return res.status(400).json({ error: 'missing fields' });
  }

  /* ════════════ NEW – fetch record from Zapier Storage ════════ */
  try {
    const storePath = process.env.ZAPIER_STORE_ID
      ? `stores/${process.env.ZAPIER_STORE_ID}`
      : 'records';                                // default store

    const url =
      `https://store.zapier.com/api/${storePath}/${encodeURIComponent(request_id)}` +
      `?secret=${process.env.ZAPIER_STORE_SECRET}`;

    const zapResp = await fetch(url);
    if (!zapResp.ok) throw new Error(`Storage lookup ${zapResp.status}`);

    const stored = await zapResp.json();          // { pin: '123456', ... }
    const storedPin = stored.pin ?? '';

    /* --- compare pins ---------------------------------------- */
    allowCORS(res);                               // always set CORS
    if (pin === storedPin) {
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ ok: false, reason: 'invalid_pin' });

  } catch (err) {
    console.error('verify-pin lookup failed:', err);
    allowCORS(res);
    return res.status(502).json({ error: 'lookup_failed' });
  }
}
