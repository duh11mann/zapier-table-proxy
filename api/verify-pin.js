// /api/verify-pin.js   (Vercel)

function allowCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  /* CORS pre-flight */
  if (req.method === 'OPTIONS') {
    allowCORS(res);
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    allowCORS(res);
    return res.status(405).end();
  }

  const { token, pin, request_id } = req.body ?? {};
  if (!token || !pin || !request_id) {
    allowCORS(res);
    return res.status(400).json({ error: 'missing fields' });
  }

  /* ── relay to your Verify-PIN Zap ─────────────────────────── */
  const zapHook = 'https://hooks.zapier.com/hooks/catch/7685031/ub8z6ab/';

  let ok = false;
  try {
    const zap = await fetch(zapHook, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ token, pin, request_id })
    });

    const body = await zap.json().catch(() => ({}));
    ok = body.ok === true;         // Zap says match?

    allowCORS(res);
    if (ok) {
      return res.status(200).json({ ok:true });
    }
    return res.status(401).json({ ok:false, reason:'invalid_pin' });

  } catch (err) {
    console.error('verify-pin relay failed:', err);
    allowCORS(res);
    return res.status(502).json({ ok:false, reason:'zap_failed' });
  }
}
