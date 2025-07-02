// /api/verify-pin.js
function allowCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  /* --- CORS pre-flight ------------------------------------------------ */
  if (req.method === 'OPTIONS') {
    allowCORS(res);
    return res.status(200).end();
  }

  /* --- POST only ------------------------------------------------------ */
  if (req.method !== 'POST') {
    allowCORS(res);
    return res.status(405).end();
  }

  /* --- validate body -------------------------------------------------- */
  const { token, pin, request_id } = req.body ?? {};
  if (!token || !pin || !request_id) {
    allowCORS(res);
    return res.status(400).json({ error: 'missing fields' });
  }

  /* --- relay to Zapier ----------------------------------------------- */
  const resp = await fetch(
    'https://hooks.zapier.com/hooks/catch/7685031/ub8z6ab/',
    {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ access: token, pin, request_id })
    }
  );

  allowCORS(res);                            // <- IMPORTANT: always set
  if (!resp.ok) {
    return res.status(502).json({ error: 'Zapier error', status: resp.status });
  }

  const data = resp.headers.get('content-type')?.includes('json')
             ? await resp.json()
             : {};
  return res.status(200).json({ status: 'ok', data });
}
