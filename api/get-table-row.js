export default async function handler(req, res) {
    const { token } = req.query;
  
    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }
  
    const tableId = "01JYW4BEJ0XTK9CYY469YP3PJ4"; // ← your actual table ID
    const zapierToken = process.env.ZAPIER_TABLES_TOKEN;
  
    const url = `https://tables.zapier.com/api/v1/records?table_id=${tableId}&filter=token=${encodeURIComponent(token)}`;
  
    try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${zapierToken}`,
            "Content-Type": "application/json",
          },
        });
      
        // 🛡 Check for bad response before attempting to parse JSON
        if (!response.ok) {
          const errorText = await response.text();
          return res.status(response.status).json({ error: `Zapier error ${response.status}: ${errorText}` });
        }
      
        const result = await response.json();
      
        if (!result.data || result.data.length === 0) {
          return res.status(404).json({ error: "No matching record found" });
        }
      
        return res.status(200).json(result.data[0]);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }     
  