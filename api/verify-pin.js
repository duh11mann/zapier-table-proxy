// api/verify-pin.js
export default async function handler(req, res) {
    /* --- 0. CORS pre-flight ------------------------------------------ */
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();           //  ← OK for pre-flight
    }
  
    /* --- 1. Only allow POST ------------------------------------------ */
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      return res.status(405).end();
    }
  
    const { token, pin, request_id } = req.body ?? {};
    if (!token || !pin || !request_id) {
      return res.status(400).json({ error: 'missing fields' });
    }
  
    /* --- 2. Relay to Zapier ------------------------------------------ */
    const zapResp = await fetch(
      'https://hooks.zapier.com/hooks/catch/7685031/ub8z6ab/',
      {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ access: token, pin, request_id })
      }
    );
  
    if (!zapResp.ok) {
      return res.status(502).json({ error: 'Zapier rejected PIN' });
    }
  
    /* --- 3. Optional JSON parse -------------------------------------- */
    let zapData = {};
    try {
      if (zapResp.headers.get('content-type')?.includes('json')) {
        zapData = await zapResp.json();
      }
    } catch { /* ignore */ }
  
    /* --- 4. CORS header for actual POST response --------------------- */
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ status: 'ok', data: zapData });
  }
  