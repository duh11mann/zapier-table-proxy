// api/prefill-result.js  (CommonJS + CORS)

const { kv } = require('@vercel/kv');       // ← CJS import

function allow(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  /* CORS pre‑flight */
  if (req.method === 'OPTIONS') { allow(res); return res.status(200).end(); }
  if (req.method !== 'POST')    { allow(res); return res.status(405).end(); }

  const { request_id } = req.body ?? {};
  if (!request_id) {
    allow(res);
    return res.status(400).json({ error: 'missing request_id' });
  }

  try {
    const row = await kv.get(request_id);      // null if not ready
    allow(res);

    if (!row) {
      return res.status(202).json({ status: 'pending' });
    }

    /* one‑time read */
    await kv.del(request_id);
    return res.status(200).json(row);          // { base_salary_estimate: … }
  } catch (err) {
    console.error('[prefill-result] fatal:', err);
    allow(res);
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
};
