const { kv } = require('@vercel/kv');

function allow(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') { allow(res); return res.status(200).end(); }
  if (req.method !== 'POST')    { allow(res); return res.status(405).end(); }

  const { token = '', request_id = '' } = req.body ?? {};
  if (!token || !request_id) {
    allow(res);
    return res.status(400).json({ error: 'missing-token-or-request_id' });
  }

  const key = `${token}:${request_id}`;            // 🔑 composite
  const row = await kv.get(key);

  allow(res);
  if (!row) return res.status(202).json({ status: 'pending' });
  return res.status(200).json(row);
};
