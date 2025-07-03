// api/prefill-request.js
const { randomUUID } = require('crypto');   // CommonJS‑style import

function allow (res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler (req, res) {
  /* ----- 1. CORS pre‑flight ----- */
  if (req.method === 'OPTIONS') { allow(res); return res.status(200).end(); }

  /* ----- 2. POST only ----------- */
  if (req.method !== 'POST')    { allow(res); return res.status(405).end(); }

  /* ----- 3. Validate body ------- */
  const { token } = req.body ?? {};
  if (!token) {
    allow(res);
    return res.status(400).json({ error: 'missing token' });
  }

  /* ----- 4. Generate request_id -*/
  const request_id = randomUUID();          // native in Node 18+

  /* ----- 5. Respond ------------- */
  allow(res);
  return res.status(200).json({ request_id });
};
