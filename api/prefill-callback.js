// api/prefill-callback.js
function cors(res){
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
  }
  export default async function handler(req,res){
    if (req.method === 'OPTIONS'){ cors(res); return res.status(200).end(); }
    if (req.method !== 'POST'){     cors(res); return res.status(405).end(); }
  
    const body   = req.body || {};
    const inputs = Object.entries(body)
      .map(([k,v]) =>
        `<input type="hidden" name="${k}" value="${String(v).replace(/"/g,'&quot;')}">`
      ).join('');
  
    const html = `
      <!doctype html><html><body>
        <form id="f" method="POST"
              action="/tax-planning-information-review?prefill=true">
          ${inputs}
        </form>
        <script>document.getElementById('f').submit();</script>
      </body></html>
    `;
  
    cors(res);
    res.setHeader('Content-Type','text/html');
    res.status(200).send(html);
  }
  