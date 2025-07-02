// api/verify-pin.js
export default async function handler(req, res) {
    /* --- 1. Only allow POST ------------------------------------------- */
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end();
    }
  
    const { token, pin, request_id } = req.body ?? {};
    if (!token || !pin || !request_id) {
      return res.status(400).json({ error: 'missing fields' });
    }
  
    /* --- 2. Forward to Zapier ----------------------------------------- */
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
  
    /* --- 3. Parse Zapier response if it sends JSON -------------------- */
    let zapData = {};
    try {
      if (zapResp.headers.get('content-type')?.includes('json')) {
        zapData = await zapResp.json();
      }
    } catch { /* ignore */ }
  
    /* --- 4. Allow browser to read our JSON (CORS) --------------------- */
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ status: 'ok', data: zapData });
  }
  