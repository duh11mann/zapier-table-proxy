// /api/verify-pin.js  – copy ⇣ exactly
function allowCORS(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  /* ── CORS pre-flight ────────────────────────────────────────────── */
  if (req.method === "OPTIONS") {
    allowCORS(res);
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    allowCORS(res);
    return res.status(405).end();          // Method Not Allowed
  }

  /* ── basic validation ───────────────────────────────────────────── */
  const { token, pin, request_id } = req.body ?? {};
  if (!token || !pin || !request_id) {
    allowCORS(res);
    return res.status(400).json({ error: "missing fields" });
  }

  /* ── relay to Verify-PIN Zap ────────────────────────────────────── */
  const zapHook = "https://hooks.zapier.com/hooks/catch/7685031/ub8z6ab/";

  try {
    const zapResp = await fetch(zapHook, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ token, pin, request_id })
    });

    /* ── read Zapier reply – it may be text/plain 'true' ──────────── */
    let ok = false;
    const ctype = zapResp.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
      const body = await zapResp.json().catch(() => ({}));
      ok = body === true || body.ok === true || body.Ok === true;
    } else {
      const text = (await zapResp.text()).trim();
      ok = text === "true";
    }

    /* ── send result back to the browser ─────────────────────────── */
    allowCORS(res);
    if (ok) {
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ ok: false, reason: "invalid_pin" });

  } catch (err) {
    console.error("verify-pin relay failed:", err);
    allowCORS(res);
    return res.status(502).json({ ok: false, reason: "zap_failed" });
  }
}
