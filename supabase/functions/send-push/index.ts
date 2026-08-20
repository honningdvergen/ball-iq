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

// ── FCM v1 (Android, 1.6.2) ──────────────────────────────────────────────────
// Tokens are routed by device_tokens.platform: ios -> APNs (unchanged),
// android -> FCM HTTP v1. Auth is a service-account JWT grant (RS256) traded
// for an OAuth token, cached ~50 min like the APNs JWT. Secret:
//   FCM_SERVICE_ACCOUNT — the FULL service-account key JSON from Firebase
//   console > ball-iq-499016 > Project settings > Service accounts.
// Fail-safe per platform: a missing secret skips that platform's tokens and
// never blocks the other's sends.

// ⚠️ .trim() ON EVERY ONE. This file already documented the hazard for
// PUSH_WEBHOOK_SECRET ("dashboard-pasted secrets routinely carry a trailing
// newline") and then applied it to that ONE variable. On 2026-08-14 a probe
// found ALL FIVE carrying "\n": bundle_id was "app.balliq\n", apns_host was
// "api.push.apple.com\n", and KEY_ID/TEAM_ID were 11 chars where the real
// values are 10. A newline in the JWT `kid`/`iss` or in the apns-topic header
// is rejected by Apple, so this would have kept push dead even once the key
// itself was correct. Knowing the trap and guarding one variable against it is
// how you get a bug that looks impossible. VERIFIED: with these trims, APNs returns 200.
const KEY_P8 = (Deno.env.get("APNS_KEY_P8") ?? "").trim();
const KEY_ID = (Deno.env.get("APNS_KEY_ID") ?? "").trim();
const TEAM_ID = (Deno.env.get("APNS_TEAM_ID") ?? "").trim();
const BUNDLE_ID = (Deno.env.get("APNS_BUNDLE_ID") ?? "app.balliq").trim();
const APNS_HOST = (Deno.env.get("APNS_HOST") ?? "api.push.apple.com").trim();
// Shared secret proving a POST really came from our DB webhook, not an
// internet caller crafting {user_id, actor_name, payload} to push arbitrary
// text to any user (medical security-backend finding). ROLLOUT ORDER: first add
//   headers => { 'x-webhook-secret': '<secret>' }
// to the notifications DB webhook, THEN set PUSH_WEBHOOK_SECRET here — the check
// only enforces when the env var is present, so it fails safe either way.
// .trim(): dashboard-pasted secrets routinely carry a trailing newline (bit us
// on first rollout — digest proved the stored value was "<secret>\n"), which
// would fail the exact-match against the clean header value forever.
const WEBHOOK_SECRET = (Deno.env.get("PUSH_WEBHOOK_SECRET") ?? "").trim();
const FCM_SA_RAW = (Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "").trim();
let FCM_SA: { project_id?: string; client_email?: string; private_key?: string } = {};
try { FCM_SA = FCM_SA_RAW ? JSON.parse(FCM_SA_RAW) : {}; } catch { FCM_SA = {}; }
const FCM_READY = !!(FCM_SA.project_id && FCM_SA.client_email && FCM_SA.private_key);

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

// ── FCM OAuth token (RS256 service-account grant, cached ~50 min) ────────────
let _fcmTok = "";
let _fcmAt = 0;
async function importRsaKey(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "").replace(/\\n/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
}
async function fcmAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (_fcmTok && now - _fcmAt < 3000) return _fcmTok;
  // Dashboard-pasted keys carry literal \n sequences inside private_key —
  // JSON.parse already turns the intended ones into newlines, but keys pasted
  // through shells sometimes arrive double-escaped; importRsaKey strips both.
  const header = b64urlStr(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64urlStr(JSON.stringify({
    iss: FCM_SA.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const input = `${header}.${claims}`;
  const key = await importRsaKey(FCM_SA.private_key!);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  const assertion = `${input}.${b64url(new Uint8Array(sig))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${assertion}`,
  });
  const j = await res.json();
  if (!j.access_token) throw new Error(`fcm oauth: ${JSON.stringify(j).slice(0, 200)}`);
  _fcmTok = j.access_token;
  _fcmAt = now;
  return _fcmTok;
}

async function sendOneFcm(token: string, accessToken: string, alert: ReturnType<typeof buildAlert>): Promise<number> {
  // FCM v1 data values MUST be strings.
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(alert.data)) data[k] = String(v ?? "");
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_SA.project_id}/messages:send`, {
    method: "POST",
    headers: { "authorization": `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: alert.title, body: alert.body },
        data,
        android: { priority: "HIGH" },
      },
    }),
  });
  // UNREGISTERED (404) is FCM's dead-token signal — mirror the APNs pruning
  // discipline: prune ONLY on that, never on generic 400s.
  if (res.status === 404) {
    let code = "";
    try { code = ((await res.clone().json())?.error?.details?.[0]?.errorCode) || ""; } catch { /* no body */ }
    if (code === "UNREGISTERED" || code === "") {
      await admin.from("device_tokens").delete().eq("token", token);
    }
  }
  return res.status;
}

// ── alert copy per notification type ─────────────────────────────────────────
function buildAlert(rec: any): { title: string; body: string; data: Record<string, unknown> } {
  const actor = rec.actor_name || "Someone";
  const p = rec.payload || {};
  switch (rec.type) {
    case "play_invite":
      return { title: "Ball IQ", body: `${actor} invited you to a game`, data: { type: "play_invite", code: p.code || "" } };
    case "friend_request":
      return { title: "Ball IQ", body: `${actor} sent you a friend request`, data: { type: "friend_request" } };
    case "friend_accept":
      return { title: "Ball IQ", body: `${actor} accepted your friend request`, data: { type: "friend_accept" } };
    case "daily_reminder":
      // Added with the web daily-reminder cron. Kept in step with
      // send-web-push's buildAlert so the same event never reads differently
      // on iOS and on web. (This case was live-only drift until 1.6.2 —
      // the repo copy was missing it; merged back before the FCM deploy.)
      return { title: "Ball IQ", body: p.body || "Today's puzzles are still open — keep your streak going 🔥", data: { type: "daily_reminder" } };
    default:
      return { title: "Ball IQ", body: p.body || "You have a new notification", data: { type: rec.type || "generic" } };
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
  // Only prune on a genuine dead-token signal. 410 = Unregistered (always dead).
  // 400 covers MANY reasons (BadTopic, PayloadTooLarge, BadMessageId, …) — pruning
  // on any 400 would delete perfectly valid tokens whenever the payload/config is
  // off, so we prune on 400 only when APNs' reason is a dead-token reason.
  if (res.status === 410) {
    await admin.from("device_tokens").delete().eq("token", token);
  } else if (res.status === 400) {
    let reason = "";
    try { reason = ((await res.clone().json())?.reason) || ""; } catch { /* no body */ }
    if (reason === "BadDeviceToken" || reason === "Unregistered" || reason === "DeviceTokenNotForTopic") {
      await admin.from("device_tokens").delete().eq("token", token);
    }
  }
  return res.status;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("ok", { status: 200 });
    // Reject forged calls once the shared secret is configured (fail-safe: no
    // secret set => no enforcement, preserving current behaviour during rollout).
    if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    const APNS_READY = !!(KEY_P8 && KEY_ID && TEAM_ID);
    if (!APNS_READY && !FCM_READY) {
      return new Response("no push transport configured", { status: 500 });
    }
    const body = await req.json().catch(() => ({}));
    const rec = body?.record ?? body; // Supabase webhook wraps the row in `record`
    if (!rec?.user_id) return new Response("no recipient", { status: 200 });

    const { data: tokens } = await admin
      .from("device_tokens").select("token, platform").eq("user_id", rec.user_id);
    if (!tokens?.length) return new Response("no devices", { status: 200 });

    const alert = buildAlert(rec);
    const iosTokens = tokens.filter((t) => t.platform !== "android");
    const androidTokens = tokens.filter((t) => t.platform === "android");

    const sends: Promise<number>[] = [];
    if (iosTokens.length && APNS_READY) {
      const jwt = await apnsJwt();
      sends.push(...iosTokens.map((t) => sendOne(t.token, jwt, alert).catch(() => 0)));
    }
    if (androidTokens.length && FCM_READY) {
      const at = await fcmAccessToken().catch(() => "");
      if (at) sends.push(...androidTokens.map((t) => sendOneFcm(t.token, at, alert).catch(() => 0)));
    }
    const results = await Promise.all(sends);
    const ok = results.filter((s) => s === 200).length;
    return new Response(JSON.stringify({ sent: ok, of: results.length }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(`error: ${e}`, { status: 500 });
  }
});
