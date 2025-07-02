function allowCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  export default async function handler(req, res) {
    // 0️⃣  pre-flight
    if (req.method === 'OPTIONS') {
      allowCORS(res);
      return res.status(200).end();
    }
  
    // 1️⃣  POST only
    if (req.method !== 'POST') {
      allowCORS(res);
      res.setHeader('Allow', 'POST, OPTIONS');
      return res.status(405).end();
    }
  
    const { token } = req.body ?? {};
    if (!token) {
      allowCORS(res);
      return res.status(400).json({ error: 'missing token' });
    }
  
    // 2️⃣  generate request_id (your existing logic)
    const request_id = crypto.randomUUID();
    // … store / lookup row etc …
  
    allowCORS(res);
    return res.status(200).json({ request_id });
  }
  