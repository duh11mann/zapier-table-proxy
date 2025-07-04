// /api/verify-pin.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const allowed = process.env.ALLOWED_ORIGIN || "";
  if (req.headers.origin !== allowed) return res.status(403).end("Forbidden");

  const { token = "", pin = "" } = req.body || {};
  if (!token || !/^\d{6}$/.test(pin)) return res.status(400).end("Bad Request");

  const url = `https://store.zapier.com/api/records/${encodeURIComponent(
    token
  )}?secret=${process.env.ZAPIER_STORE_SECRET}`;

  const z = await fetch(url);
  if (!z.ok) return res.status(401).end("Unauthorized");

  const { pin: storedPin, created_at } = await z.json();
  if (Date.now() - Date.parse(created_at) > 15 * 60 * 1e3)
    return res.status(401).end("Expired");
  if (pin !== storedPin) return res.status(401).end("Unauthorized");

  await fetch(url, { method: "DELETE" }).catch(() => {});
  res.setHeader("Access-Control-Allow-Origin", allowed);
  return res.json({ ok: true });
}
