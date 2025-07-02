// api/prefill-result.js

const store = global.__PREFILL_STORE__ || {};
global.__PREFILL_STORE__ = store;

export default async function handler(req, res) {
  const { request_id } = req.query;

  if (!request_id) {
    return res.status(400).json({ error: "Missing request_id" });
  }

  const result = store[request_id];

  if (!result) {
    return res.status(202).json({ status: "pending" });
  }

  // Optionally: delete it to make one-time use
  delete store[request_id];

  res.status(200).json({ status: "ready", data: result });
}
