// File: /api/verify-pin.js
import { NextResponse } from "next/server";

/**
 * Vercel edge-runtime route – confirms a 6-digit PIN stored in Zapier Storage.
 * Expects POST  { token: "abc123", pin: "987654" }
 */
export const config = {
  runtime: "edge",                  // super-fast cold starts
  regions: ["iad1", "pdx1"]         // pick a couple close to your users
};

export async function POST(request) {
  try {
    // ----- 1. CORS -----
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    const origin = request.headers.get("origin") ?? "";
    if (origin !== allowedOrigin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // ----- 2. Parse body -----
    const { token = "", pin = "" } = await request.json();
    if (!token || !/^\d{6}$/.test(pin)) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // ----- 3. Pull record from Zapier Storage -----
    const url = `https://store.zapier.com/api/records/${encodeURIComponent(
      token
    )}?secret=${process.env.ZAPIER_STORE_SECRET}`;

    const res = await fetch(url);
    if (!res.ok) {
      // No record, expired, or wrong secret.
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { pin: storedPin, created_at } = await res.json();

    // ----- 4. Optional: Expire after 15 minutes -----
    const ageMs = Date.now() - Date.parse(created_at);
    const fifteenMinutes = 15 * 60 * 1000;
    if (ageMs > fifteenMinutes) {
      return new NextResponse("Expired", { status: 401 });
    }

    // ----- 5. Compare pins (constant-time) -----
    const isValid =
      pin.length === storedPin.length &&
      [...pin].every((c, i) => c === storedPin[i]);

    if (!isValid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // ----- 6. Success → delete the record to prevent reuse -----
    await fetch(url, { method: "DELETE" }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("verify-pin error:", err);
    return new NextResponse("Server Error", { status: 500 });
  }
}
