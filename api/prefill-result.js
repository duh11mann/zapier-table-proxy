// api/prefill-result.js
function allowCORS(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  
  const store = global.__PREFILL_STORE__ || (global.__PREFILL_STORE__ = {});
  
  export default async function handler(req, res) {
    if (req.method === "OPTIONS") { allowCORS(res); return res.status(200).end(); }
    if (req.method !== "POST")    { allowCORS(res); return res.status(405).end(); }
  
    const { request_id } = req.body ?? {};
    if (!request_id) { allowCORS(res); return res.status(400).json({ error: "missing request_id" }); }
  
    const row = store[request_id];
  
    allowCORS(res);
    if (!row) return res.status(202).json({ status: "pending" }); // Zap hasn’t posted yet
  
    delete store[request_id];          // one-time read
    res.status(200).json(row);         // exactly what the frontend expects
  }
  