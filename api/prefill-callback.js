// api/prefill‑callback.js   (CommonJS)

const { kv } = require('@vercel/kv');

function allow(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') { allow(res); return res.status(200).end(); }
  if (req.method !== 'POST')    { allow(res); return res.status(405).end(); }

  const row = req.body ?? {};
  const { token, request_id } = row;
  if (!token || !request_id) {
    allow(res);
    return res.status(400).json({ error: 'missing‑token‑or‑request_id' });
  }

  try {
    const key = `${token}:${request_id}`;         // ←–––– use same key
    await kv.set(key, row, { ex: 900 });          // 15‑minute TTL
    allow(res);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[prefill‑callback] fatal:', err);
    allow(res);
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
};
