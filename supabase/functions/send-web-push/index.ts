// send-web-push — deliver a Web Push when a notifications row is inserted.
//
// Sibling of send-push (APNs). Same trigger, same shared secret, different
// transport: this one reaches BROWSERS. The native builds never come through
// here — they use local notifications on-device — so this exists purely for the
// web players the native reminder engine cannot touch, which is most of the
// people arriving from the ~302 SEO pages.
//
// ⚠️ LIBRARY CHOICE IS LOAD-BEARING. Use jsr:@negrel/webpush, NOT npm:web-push.
// npm:web-push calls node crypto Sign/ECDH and require('https'), both broken on
// Deno Deploy (denoland/deno#17257), and its aes128gcm output fails Chrome's
// AES-GCM decrypt (denoland/deno#23693) — i.e. it appears to send fine and the
// notification silently never arrives. @negrel/webpush is pure crypto.subtle
// (RFC 8291/8292), the same surface send-push already proves works here.
//
// Secrets (Alex-set, dashboard):
//   VAPID_KEYS    — {"publicKey":<JWK>,"privateKey":<JWK>} from scripts/gen-vapid-keys.mjs
//   VAPID_SUBJECT — mailto:support@balliq.app
//   PUSH_WEBHOOK_SECRET — shared with the DB webhook, same value send-push uses
// Auto-provided: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@^0.3.0";

// .trim() on every one: a secret pasted into the dashboard routinely carries a
// trailing newline. That already cost a rollout on send-push — the stored value
// was provably "<secret>\n" and the exact-match check failed forever.
const VAPID_KEYS_RAW = (Deno.env.get("VAPID_KEYS") ?? "").trim();
const VAPID_SUBJECT = (Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@balliq.app").trim();
const WEBHOOK_SECRET = (Deno.env.get("PUSH_WEBHOOK_SECRET") ?? "").trim();

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ONE ApplicationServer for the whole isolate. Importing the VAPID keys runs
// crypto.subtle.importKey, which is not free; rebuilding it per request would
// pay that on every single notification for no reason.
let _server: webpush.ApplicationServer | null = null;
async function server(): Promise<webpush.ApplicationServer> {
  if (_server) return _server;
  if (!VAPID_KEYS_RAW) throw new Error("VAPID_KEYS is not set");
  const keys = await webpush.importVapidKeys(JSON.parse(VAPID_KEYS_RAW), { extractable: false });
  _server = await webpush.ApplicationServer.new({
    contactInformation: VAPID_SUBJECT,
    vapidKeys: keys,
  });
  return _server;
}

// ⚠️ MIRRORS send-push's buildAlert(). The notifications row has NO title/body
// column — copy is derived from `type`, with payload.body as the generic
// fallback. Reading row.title would silently yield the default text for every
// notification, so a friend request would say one thing on iOS and something
// else entirely on web. If the APNs copy changes, change it here too; the two
// senders describing the same event differently is worse than either wording.
function buildAlert(rec: Record<string, unknown>) {
  const p = (rec?.payload ?? {}) as Record<string, unknown>;
  const actor = (rec?.actor_name as string) || "Someone";
  const base = { title: "Ball IQ", tag: `balliq-${(rec?.type as string) ?? "generic"}` };
  switch (rec?.type) {
    case "play_invite":
      return { ...base, body: `${actor} invited you to a game`, url: p.code ? `/join/${p.code}` : "/play" };
    case "friend_request":
      return { ...base, body: `${actor} sent you a friend request`, url: "/play?tab=profile" };
    case "friend_accept":
      return { ...base, body: `${actor} accepted your friend request`, url: "/play?tab=profile" };
    case "daily_reminder":
      // Collapses onto one tag so a second night's reminder REPLACES an unread
      // first rather than stacking two nags in the tray.
      return { title: "Ball IQ", tag: "balliq-daily",
               body: (p.body as string) || "Today's puzzles are still open — keep your streak going 🔥",
               url: "/play?tab=daily" };
    default:
      return { ...base, body: (p.body as string) || "You have a new notification", url: "/play" };
  }
}

Deno.serve(async (req) => {
  // Fails safe: the check only enforces once the secret is set, so the webhook
  // header can be added before or after this deploys without a dead window.
  if (WEBHOOK_SECRET) {
    const got = (req.headers.get("x-webhook-secret") ?? "").trim();
    if (got !== WEBHOOK_SECRET) return new Response("forbidden", { status: 403 });
  }

  let row: Record<string, unknown>;
  try {
    const body = await req.json();
    row = body?.record ?? body;
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const userId = row?.user_id as string | undefined;
  if (!userId) return new Response("no user_id", { status: 400 });

  const { data: subs, error } = await admin
    .from("web_push_subscriptions")
    .select("endpoint, subscription")
    .eq("user_id", userId);
  if (error) {
    console.error("[send-web-push] lookup failed:", error.message);
    return new Response("lookup failed", { status: 500 });
  }
  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  const payload = JSON.stringify(buildAlert(row));

  const app = await server();
  const dead: string[] = [];
  let sent = 0;

  await Promise.all(subs.map(async (r) => {
    try {
      const subscriber = app.subscribe(r.subscription as webpush.PushSubscription);
      // TTL kept short: a daily reminder that surfaces two days late is worse
      // than one that never arrives — it advertises a puzzle that has expired.
      await subscriber.pushTextMessage(payload, { ttl: 6 * 60 * 60 });
      sent++;
    } catch (e) {
      // ⚠️ PRUNE ON 404 AND 410. isGone() only catches 410; a 404 endpoint is
      // equally dead and pruning only 410 leaks rows forever, so every future
      // send pays for subscriptions that can never succeed.
      //
      // Deliberately NOT pruning 400/401/403 — those mean OUR payload or OUR
      // VAPID config is wrong, and deleting the user's subscription because we
      // sent a malformed request would turn a bug into permanent data loss.
      const status = (e as { response?: { status?: number } })?.response?.status;
      const gone = (e instanceof webpush.PushMessageError && e.isGone()) || status === 404 || status === 410;
      if (gone) dead.push(r.endpoint as string);
      else console.error("[send-web-push] send failed:", status ?? (e as Error)?.message);
    }
  }));

  if (dead.length) {
    const { error: delErr } = await admin
      .from("web_push_subscriptions").delete().in("endpoint", dead);
    if (delErr) console.error("[send-web-push] prune failed:", delErr.message);
  }

  return new Response(JSON.stringify({ sent, pruned: dead.length }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
