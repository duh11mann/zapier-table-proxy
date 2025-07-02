/*  Zap B calls this AFTER it has fetched the Google Sheet row.       */
/*  It stores the row under the same request_id so the browser can
    retrieve it with /api/prefill-result.                             */

    const store = global.__PREFILL_STORE__ ||= {};

    function allowCORS(res) {
      res.setHeader('Access-Control-Allow-Origin',  '*');
      res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers','Content-Type');
    }
    
    export default async function handler(req, res) {
      if (req.method === 'OPTIONS') { allowCORS(res); return res.status(200).end(); }
      if (req.method !== 'POST')    { allowCORS(res); return res.status(405).end(); }
    
      const { request_id, ...row } = req.body ?? {};
      if (!request_id) { allowCORS(res); return res.status(400).json({ error:'missing request_id' }); }
    
      store[request_id] = row;                // ← now ready for the browser
    
      allowCORS(res);
      return res.status(200).json({ status:'stored' });
    }
    