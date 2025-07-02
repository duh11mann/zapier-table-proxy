// api/prefill-callback.js
function allowCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  export default async function handler(req, res) {
    if (req.method === 'OPTIONS') { allowCORS(res); return res.status(200).end(); }
    if (req.method !== 'POST')    { allowCORS(res); return res.status(405).end(); }
  
    const body = req.body || {};                      // Zap posts JSON
  
    // build hidden inputs for every key
    const inputs = Object.entries(body)
      .map(([k, v]) =>
        `<input type="hidden" name="${k}" value="${String(v).replace(/"/g,'&quot;')}">`
      ).join('');
  
    // immediately re-POST the same payload back to the page
    const html = `
      <!doctype html><html><body>
        <form id="f" method="POST"
              action="/tax-planning-information-review?prefill=true">
          ${inputs}
        </form>
        <script>document.getElementById('f').submit();</script>
      </body></html>
    `;
  
    allowCORS(res);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  }
  