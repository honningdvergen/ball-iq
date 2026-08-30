// send-day2-email — the win-back channel push can't reach.
//
// The measured leak (retention critique 2026-08-29): 29% of new players never
// play a second day, and push reaches single digits of them. Every signup
// hands over a working email. This function emails EXACTLY the unreachable
// slice: signed up yesterday, actually played, no push subscription on any
// platform, hasn't played today, never emailed before, hasn't opted out.
//
// Invoked hourly (pg_cron → net.http_post with the service-role bearer,
// v1_10b). Sends via Resend. Hard caps: 40 sends per invocation; every send
// recorded in email_events BEFORE the API call is confirmed (at-most-once).
//
// AUTH: verify_jwt admits any project JWT — including the PUBLIC anon key —
// so the function additionally requires role=service_role in the token.
// {"test_to": "addr"} sends ONE sample email and touches nothing else.
//
// Secrets: RESEND_API_KEY, EMAIL_UNSUB_SECRET. ⚠️ .trim() on every env —
// dashboard-pasted secrets routinely carry trailing newlines (the send-push
// postmortem found FIVE of five affected).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_KEY = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
const UNSUB_SECRET = (Deno.env.get("EMAIL_UNSUB_SECRET") ?? "").trim();
const FROM = "Ball IQ <nudge@balliq.app>";

function callerIsServiceRole(req: Request): boolean {
  try {
    const auth = req.headers.get("authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function hmac(input: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(UNSUB_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function emailHtml(unsubUrl: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0d0e12;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
<div style="max-width:440px;margin:0 auto;background:#15171c;border:1px solid #262933;border-radius:16px;padding:28px 24px;color:#e8e6e2">
<div style="font-size:20px;font-weight:800;margin-bottom:4px">Ball <span style="color:#58CC02">IQ</span></div>
<p style="font-size:16px;line-height:1.6;color:#e8e6e2;margin:16px 0 6px"><strong>You lit a streak yesterday 🔥</strong></p>
<p style="font-size:14.5px;line-height:1.6;color:#b3b0aa;margin:6px 0 20px">Today's puzzles are live — one quick game keeps it alive. Two minutes, no hoops.</p>
<a href="https://balliq.app/play?game=daily&utm_source=day2email" style="display:block;text-align:center;background:#58CC02;color:#06230C;text-decoration:none;font-weight:800;font-size:15px;padding:13px 20px;border-radius:999px">Play today's Daily 7</a>
<p style="font-size:11.5px;color:#7c7a75;margin:24px 0 0;line-height:1.5">You're getting this one-time nudge because you created a Ball IQ account. No streak emails again unless you ask.<br><a href="${unsubUrl}" style="color:#7c7a75">Unsubscribe from all Ball IQ emails</a></p>
</div></body></html>`;
}

async function sendOne(to: string, unsubUrl: string): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "authorization": `Bearer ${RESEND_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: "Your streak is one puzzle from day 2 🔥",
      html: emailHtml(unsubUrl),
    }),
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("ok", { status: 200 });
    if (!callerIsServiceRole(req)) {
      return new Response("unauthorized", { status: 401 });
    }
    if (!RESEND_KEY || !UNSUB_SECRET) {
      return new Response("email channel not configured", { status: 200 });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.test_to && typeof body.test_to === "string") {
      const res = await sendOne(body.test_to, "https://balliq.app");
      const detail = res.ok ? "" : (await res.text()).slice(0, 300);
      return new Response(JSON.stringify({ test: true, status: res.status, detail }), {
        status: 200, headers: { "content-type": "application/json" },
      });
    }

    // The unreachable day-2 slice. auth.admin listUsers is paginated and
    // heavy; instead one SQL round-trip via rpc-less raw select through
    // PostgREST is impossible for auth schema — so use the admin API for
    // emails only AFTER selecting candidate ids from public tables.
    const { data: cands, error: selErr } = await admin.rpc("select_day2_email_candidates");
    if (selErr) return new Response(`select failed: ${selErr.message}`, { status: 500 });
    const list = (cands ?? []).slice(0, 40);
    let sent = 0;
    for (const row of list) {
      const uid = row.user_id as string;
      const email = row.email as string;
      if (!email) continue;
      // record-first: at-most-once beats at-least-once for email
      const { error: insErr } = await admin.from("email_events").insert({ user_id: uid, kind: "day2" });
      if (insErr) continue; // unique violation = already handled
      const token = await hmac(uid);
      const unsubUrl = `https://blcisypmngimqkwxrrdm.supabase.co/functions/v1/email-unsub?u=${uid}&t=${token}`;
      const res = await sendOne(email, unsubUrl);
      if (res.ok) sent++;
      else console.warn("[day2] resend", res.status, (await res.text()).slice(0, 200));
    }
    return new Response(JSON.stringify({ candidates: list.length, sent }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(`error: ${e}`, { status: 500 });
  }
});
