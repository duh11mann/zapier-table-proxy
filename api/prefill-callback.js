// api/prefill-callback.js

const store = global.__PREFILL_STORE__ || {};
global.__PREFILL_STORE__ = store;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { request_id, ...fields } = req.body;
  if (!request_id) return res.status(400).json({ error: "Missing request_id" });

  store[request_id] = fields;
  console.log("📥 Stored prefill:", request_id, fields);

  res.status(200).json({ status: "ok" });
}
