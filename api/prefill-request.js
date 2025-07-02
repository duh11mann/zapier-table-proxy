// api/prefill-request.js
import crypto from "crypto";

function allowCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const store = global.__PREFILL_STORE__ || (global.__PREFILL_STORE__ = {});

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { allowCORS(res); return res.status(200).end(); }
  if (req.method !== "POST")    { allowCORS(res); return res.status(405).end(); }

  const { token } = req.body ?? {};
  if (!token) { allowCORS(res); return res.status(400).json({ error: "missing token" }); }

  const request_id = crypto.randomUUID();

  /* create an empty placeholder row so prefill-result can return 202
     until Zap B fills it in */
  store[request_id] = null;

  allowCORS(res);
  res.status(200).json({ request_id });
}
