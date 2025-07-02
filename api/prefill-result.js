/*  Browser polls this endpoint until the row is ready                */

const store = global.__PREFILL_STORE__ ||= {};

function allowCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { allowCORS(res); return res.status(200).end(); }
  if (req.method !== 'POST')    { allowCORS(res); return res.status(405).end(); }

  const { request_id } = req.body ?? {};
  if (!request_id) { allowCORS(res); return res.status(400).json({ error:'missing request_id' }); }

  const row = store[request_id];

  allowCORS(res);
  if (!row) {
    return res.status(202).json({ status:'pending' });   // Zap not finished yet
  }

  delete store[request_id];                              // one-time use
  return res.status(200).json({ status:'ready', data:row });
}
