function allowCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  export default async function handler(req, res) {
    if (req.method === 'OPTIONS') { allowCORS(res); return res.status(200).end(); }
  
    if (req.method !== 'POST')    { allowCORS(res); return res.status(405).end(); }
  
    const { token } = req.body ?? {};
    if (!token) { allowCORS(res); return res.status(400).json({ error: 'missing token' }); }
  
    const request_id = crypto.randomUUID();   // or whatever logic you use
    /*  … store / fetch row, etc. …  */
  
    allowCORS(res);
    return res.status(200).json({ request_id });
  }
  