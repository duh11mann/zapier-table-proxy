// api/verify-pin.js
const ZAP_HOOK = 'https://hooks.zapier.com/hooks/catch/7685031/ub8z6ab/';

function allowCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  /* 0️⃣  Pre-flight */
  if (req.method === 'OPTIONS') {
    allowCORS(res);
    return res.status(200).end();
  }

  /* 1️⃣  POST only */
  if (req.method !== 'POST') {
    allowCORS(res);
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).end();
  }

  const { token, pin, request_id } = req.body ?? {};

  /* 🟡 FIRST LOG — see what reached the server */
  console.log('[verify-pin] body →', { token, pin, request_id });

  if (!token || !pin || !request_id) {
    allowCORS(res);
    return res.status(400).json({ error: 'missing fields' });
  }

  /* 2️⃣  Relay to Zapier */
  const zapResp = await fetch(ZAP_HOOK, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ access: token, pin, request_id })
  });

  /* 🟡 SECOND LOG — Zapier’s reply */
  console.log('[verify-pin] Zapier status →', zapResp.status);
  const zapText = await zapResp.text();
  console.log('[verify-pin] Zapier body →', zapText);

  if (!zapResp.ok) {
    allowCORS(res);
    return res.status(502).json({ error: 'Zapier rejected PIN' });
  }

  /* 3️⃣  Optional JSON from Zapier */
  let zapData = {};
  try {
    if (zapResp.headers.get('content-type')?.includes('json')) {
      zapData = JSON.parse(zapText);
    }
  } catch {/* ignore */}

  /* 4️⃣  Success */
  allowCORS(res);
  return res.status(200).json({ status: 'ok', data: zapData });
}
