// api/prefill-request.js

import crypto from "crypto";

const store = global.__PREFILL_STORE__ || {};
global.__PREFILL_STORE__ = store;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Allow the preflight
  }

  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  const request_id = crypto.randomUUID();
  store[request_id] = null; // Track the request

  const zapHookUrl = "https://hooks.zapier.com/hooks/catch/7685031/ubk1cw4/";
  const callback_url = `https://${req.headers.host}/api/prefill-callback`;

  try {
    await fetch(zapHookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, callback_url, request_id }),
    });
    res.status(202).json({ request_id });
  } catch (err) {
    console.error("Error posting to Zapier:", err);
    res.status(500).json({ error: "Failed to trigger Zap" });
  }
}
