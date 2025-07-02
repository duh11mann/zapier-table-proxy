// api/prefill-request.js

const store = global.__PREFILL_STORE__ || {};
global.__PREFILL_STORE__ = store;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Missing token" });

  const request_id = crypto.randomUUID();
  store[request_id] = null; // Reserve a placeholder

  const zapHookUrl = "https://hooks.zapier.com/hooks/catch/7685031/ubk1cw4/"; // Your Zap URL
  const callback_url = `https://${req.headers.host}/api/prefill-callback`;

  await fetch(zapHookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, callback_url, request_id })
  });

  res.status(202).json({ request_id });
}
