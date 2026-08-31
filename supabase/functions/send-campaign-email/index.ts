// send-campaign-email — the two win-back channels push cannot reach.
//
// Measured 2026-09-01: 201 accounts are reachable ONLY by email (no web push
// subscription, no device token). 94 of them signed up and never played; 40
// played and have been gone 8-30 days. The Resend path has worked since
// 2026-08-30 and has sent 4 messages, ever.
//
// ONE function, two campaigns, because the only differences are the selector
// and the copy — duplicating the auth, the at-most-once ledger, the unsub HMAC
// and the send loop would be four things to keep in sync instead of one.
//
// AUTH: verify_jwt admits ANY project JWT including the PUBLIC anon key, so
// this additionally requires role=service_role in the token. Same hole, same
// plug, as send-day2-email.
//
// ⚠️ .trim() EVERY SECRET — dashboard-pasted values routinely carry a trailing
// newline; the send-push postmortem found five of five affected.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_KEY = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
const UNSUB_SECRET = (Deno.env.get("EMAIL_UNSUB_SECRET") ?? "").trim();
const FROM = "Ball IQ <nudge@balliq.app>";
const PROJECT = "https://blcisypmngimqkwxrrdm.supabase.co";

type Campaign = "winback" | "activate";

function callerIsServiceRole(req: Request): boolean {
  try {
    const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
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

function shell(bodyHtml: string, cta: string, ctaHref: string, unsubUrl: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0d0e12;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
<div style="max-width:440px;margin:0 auto;background:#15171c;border:1px solid #262933;border-radius:16px;padding:28px 24px;color:#e8e6e2">
<div style="font-size:20px;font-weight:800;margin-bottom:4px">Ball <span style="color:#58CC02">IQ</span></div>
${bodyHtml}
<a href="${ctaHref}" style="display:block;text-align:center;background:#58CC02;color:#06230C;text-decoration:none;font-weight:800;font-size:15px;padding:13px 20px;border-radius:999px">${cta}</a>
<p style="font-size:11.5px;color:#7c7a75;margin:24px 0 0;line-height:1.5">You're getting this because you created a Ball IQ account. One nudge, not a newsletter.<br><a href="${unsubUrl}" style="color:#7c7a75">Unsubscribe from all Ball IQ emails</a></p>
</div></body></html>`;
}

// Copy leads with something true about THIS person, not about the product.
function build(campaign: Campaign, row: Record<string, unknown>, unsubUrl: string) {
  if (campaign === "winback") {
    const best = Number(row.best_streak ?? 0);
    const streakLine = best >= 2
      ? `<p style="font-size:16px;line-height:1.6;margin:16px 0 6px"><strong>Your best run was ${best} days in a row.</strong></p>
         <p style="font-size:14.5px;line-height:1.6;color:#b3b0aa;margin:6px 0 20px">Today's puzzles are live. One game and you're building again — two minutes, no hoops.</p>`
      : `<p style="font-size:16px;line-height:1.6;margin:16px 0 6px"><strong>Today's football puzzles are live.</strong></p>
         <p style="font-size:14.5px;line-height:1.6;color:#b3b0aa;margin:6px 0 20px">You played once and drifted off — fair enough. There's a fresh one waiting, and it takes two minutes.</p>`;
    return {
      subject: best >= 2 ? `Your ${best}-day streak is still yours to beat` : "Today's football puzzles are live",
      html: shell(streakLine, "Play today's Footle", "https://balliq.app/footle?utm_source=winback", unsubUrl),
    };
  }
  return {
    subject: "You made an account and never got to the good bit",
    html: shell(
      `<p style="font-size:16px;line-height:1.6;margin:16px 0 6px"><strong>You signed up, then never played a game.</strong></p>
       <p style="font-size:14.5px;line-height:1.6;color:#b3b0aa;margin:6px 0 20px">Which means you've seen none of it. The Daily 7 takes about three minutes, every answer explains itself, and it's the same set everyone else gets today.</p>`,
      "Play today's Daily 7", "https://balliq.app/play?game=daily&utm_source=activate", unsubUrl,
    ),
  };
}

async function sendOne(to: string, subject: string, html: string): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "authorization": `Bearer ${RESEND_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("ok", { status: 200 });
    if (!callerIsServiceRole(req)) return new Response("unauthorized", { status: 401 });
    if (!RESEND_KEY || !UNSUB_SECRET) return new Response("email channel not configured", { status: 200 });

    const body = await req.json().catch(() => ({}));
    const campaign: Campaign = body?.campaign === "activate" ? "activate" : "winback";

    // {"test_to":"addr"} sends ONE sample and touches no ledger, so the copy can
    // be eyeballed in a real inbox before anyone else receives it.
    if (body?.test_to && typeof body.test_to === "string") {
      const { subject, html } = build(campaign, { best_streak: 4 }, "https://balliq.app");
      const res = await sendOne(body.test_to, subject, html);
      const detail = res.ok ? "" : (await res.text()).slice(0, 300);
      return new Response(JSON.stringify({ test: true, campaign, status: res.status, detail }), {
        status: 200, headers: { "content-type": "application/json" },
      });
    }

    const rpc = campaign === "activate" ? "select_activate_candidates" : "select_winback_candidates";
    const { data: cands, error: selErr } = await admin.rpc(rpc);
    if (selErr) return new Response(`select failed: ${selErr.message}`, { status: 500 });

    const list = (cands ?? []).slice(0, 40);
    let sent = 0;
    for (const row of list) {
      const uid = row.user_id as string;
      const email = row.email as string;
      if (!email) continue;
      // record-first: at-most-once beats at-least-once for email. A unique
      // violation means another invocation already claimed this person.
      const { error: insErr } = await admin.from("email_events").insert({ user_id: uid, kind: campaign });
      if (insErr) continue;
      const token = await hmac(uid);
      const unsubUrl = `${PROJECT}/functions/v1/email-unsub?u=${uid}&t=${token}`;
      const { subject, html } = build(campaign, row, unsubUrl);
      const res = await sendOne(email, subject, html);
      if (res.ok) sent++;
      else console.warn(`[${campaign}] resend`, res.status, (await res.text()).slice(0, 200));
    }
    return new Response(JSON.stringify({ campaign, candidates: list.length, sent }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(`error: ${e}`, { status: 500 });
  }
});
