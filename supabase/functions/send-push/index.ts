// send-push — deliver an APNs remote push when a notifications row is inserted.
//
// Wiring: a Supabase Database Webhook on public.notifications (INSERT) POSTs the
// new row here. We look up the recipient's device tokens and send an APNs alert
// via token-based auth (an ES256 JWT signed with the .p8 key). Dead tokens
// (HTTP 410 / BadDeviceToken) are pruned.
//
// Secrets (set via `supabase secrets set`):
//   APNS_KEY_P8   — contents of the AuthKey_XXXX.p8 (the PEM, incl. BEGIN/END lines)
//   APNS_KEY_ID   — 83D74N8R2J
//   APNS_TEAM_ID  — A99W5L256P
//   APNS_BUNDLE_ID— app.balliq
//   APNS_HOST     — api.push.apple.com (production) | api.sandbox.push.apple.com (dev/TestFlight)
// Auto-provided by the platform: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// The .p8 covers both Sandbox & Production (Team-Scoped key), so APNS_HOST is the
// only thing that differs between a dev build and the live App Store app.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KEY_P8 = Deno.env.get("APNS_KEY_P8") ?? "";
const KEY_ID = Deno.env.get("APNS_KEY_ID") ?? "";
const TEAM_ID = Deno.env.get("APNS_TEAM_ID") ?? "";
const BUNDLE_ID = Deno.env.get("APNS_BUNDLE_ID") ?? "app.balliq";
const APNS_HOST = Deno.env.get("APNS_HOST") ?? "api.push.apple.com";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ── ES256 JWT for APNs (cached ~50 min; APNs accepts a token for 20–60 min) ──
let _jwt = "";
let _jwtAt = 0;
function b64url(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlStr(str: string): string {
  return b64url(new TextEncoder().encode(str));
}
async function importKey(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
}
async function apnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (_jwt && now - _jwtAt < 3000) return _jwt; // reuse for 50 min
  const header = b64urlStr(JSON.stringify({ alg: "ES256", kid: KEY_ID }));
  const claims = b64urlStr(JSON.stringify({ iss: TEAM_ID, iat: now }));
  const input = `${header}.${claims}`;
  const key = await importKey(KEY_P8);
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(input),
  );
  _jwt = `${input}.${b64url(new Uint8Array(sig))}`;
  _jwtAt = now;
  return _jwt;
}

// ── alert copy per notification type ─────────────────────────────────────────
function buildAlert(rec: any): { title: string; body: string; data: Record<string, unknown> } {
  const actor = rec.actor_name || "Someone";
  const p = rec.payload || {};
  switch (rec.type) {
    case "play_invite":
      return { title: "⚽ Ball IQ", body: `${actor} invited you to a game`, data: { type: "play_invite", code: p.code || "" } };
    case "friend_request":
      return { title: "⚽ Ball IQ", body: `${actor} sent you a friend request`, data: { type: "friend_request" } };
    case "friend_accept":
      return { title: "⚽ Ball IQ", body: `${actor} accepted your friend request`, data: { type: "friend_accept" } };
    default:
      return { title: "⚽ Ball IQ", body: p.body || "You have a new notification", data: { type: rec.type || "generic" } };
  }
}

async function sendOne(token: string, jwt: string, alert: ReturnType<typeof buildAlert>): Promise<number> {
  const payload = {
    aps: { alert: { title: alert.title, body: alert.body }, sound: "default", badge: 1 },
    ...alert.data,
  };
  const res = await fetch(`https://${APNS_HOST}/3/device/${token}`, {
    method: "POST",
    headers: {
      "authorization": `bearer ${jwt}`,
      "apns-topic": BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 410 || res.status === 400) {
    // BadDeviceToken / Unregistered → prune it.
    await admin.from("device_tokens").delete().eq("token", token);
  }
  return res.status;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("ok", { status: 200 });
    if (!KEY_P8 || !KEY_ID || !TEAM_ID) {
      return new Response("APNs secrets not configured", { status: 500 });
    }
    const body = await req.json().catch(() => ({}));
    const rec = body?.record ?? body; // Supabase webhook wraps the row in `record`
    if (!rec?.user_id) return new Response("no recipient", { status: 200 });

    const { data: tokens } = await admin
      .from("device_tokens").select("token").eq("user_id", rec.user_id);
    if (!tokens?.length) return new Response("no devices", { status: 200 });

    const jwt = await apnsJwt();
    const alert = buildAlert(rec);
    const results = await Promise.all(tokens.map((t) => sendOne(t.token, jwt, alert).catch(() => 0)));
    const ok = results.filter((s) => s === 200).length;
    return new Response(JSON.stringify({ sent: ok, of: results.length }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(`error: ${e}`, { status: 500 });
  }
});
