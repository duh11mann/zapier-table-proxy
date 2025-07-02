// api/prefill-callback.js
function allowCORS(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  
  const store = global.__PREFILL_STORE__ || (global.__PREFILL_STORE__ = {});
  
  export default async function handler(req, res) {
    if (req.method === "OPTIONS") { allowCORS(res); return res.status(200).end(); }
    if (req.method !== "POST")    { allowCORS(res); return res.status(405).end(); }
  
    const { request_id, ...row } = req.body ?? {};
    if (!request_id) { allowCORS(res); return res.status(400).json({ error: "missing request_id" }); }
  
    store[request_id] = row;             // save the whole row for the review page
  
    allowCORS(res);
    res.status(200).json({ status: "ok" });
  }
  