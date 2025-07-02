// /api/verify-pin.ts   (JS works too)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  /* --- 1. Reject anything that isn’t POST ---------------------------- */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { token, pin, request_id } = req.body ?? {};
  if (!token || !pin || !request_id) {
    return res.status(400).json({ error: 'missing fields' });
  }

  /* --- 2. Forward the payload to Zapier ------------------------------ */
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

  /* --- 3. Optional: parse Zapier’s response if you configured "Return Data" */
  let zapData: any = {};
  try {
    if (zapResp.headers.get('content-type')?.includes('json')) {
      zapData = await zapResp.json();
    }
  } catch { /* ignore empty body */ }

  /* --- 4. CORS header so the browser can read our JSON ---------------- */
  res.setHeader('Access-Control-Allow-Origin', '*');           //  ← key line
  res.status(200).json({ status: 'ok', data: zapData });
}
