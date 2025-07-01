export default async function handler(req, res) {
    const { access } = req.query;
  
    if (!access) {
      return res.status(400).json({ error: 'Missing access token in query.' });
    }
  
    const secret = process.env.ZAPIER_STORAGE_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Missing server secret.' });
    }
  
    const zapierUrl = `https://store.zapier.com/api/records/${encodeURIComponent(access)}?secret=${secret}`;
  
    try {
      const zapierRes = await fetch(zapierUrl);
      if (!zapierRes.ok) {
        return res.status(zapierRes.status).json({ error: 'Zapier Storage request failed.' });
      }
  
      const data = await zapierRes.json();
      return res.status(200).json(data);
    } catch (err) {
      console.error('Fetch error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
  