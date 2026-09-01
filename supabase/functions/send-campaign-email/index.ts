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

// ── Creatives ───────────────────────────────────────────────────────────────
// Alex, 2026-09-01, delegating the choice: "i trust you with the email
// creative". The first drafts were rejected as "boring" and, on re-reading,
// as faintly passive-aggressive — every headline led with the reader's
// FAILURE ("you have never answered one of these", "four days, then
// nothing"). That is a telling-off, not an invitation, and these go to people
// who already stopped playing once. Football's register is anticipation and
// matchday, so both creatives now lead with the FOOTBALL and let the reader
// be the one who knows things.
//
// ACTIVATE → THE MOMENT. 94 accounts have never answered a single question,
// so the barrier is "what even is this". Putting a real question IN the inbox
// removes that step entirely — they are playing before they have decided to.
// The options are links that actually resolve now (/play?eq=&ea=), so the tap
// is answered with a verdict instead of dumping them into a quiz.
// WIN-BACK → MATCHDAY. They already know what the app is, so the pull is the
// fixture list plus their OWN record as a thing to beat.

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const GREEN = "#58CC02";
const INK = "#06230C";

// ⚠️ The question is PINNED, not drawn from the daily. An email is rendered
// once and read whenever — a rotating question would make the verdict link
// wrong for anyone who opens it tomorrow. `ea` indexes the AUTHORED option
// order (the app shuffles per player; an email cannot), which is why the
// answer index below is the bank's own. Pinned by
// tests/unit/email-answer-link.test.js so a bank edit cannot silently rot it.
const Q = {
  id: "q_e15d6b",
  text: "Who scored the stoppage-time goal that won Man City the 2012 Premier League title against QPR?",
  options: ["Tevez", "Dzeko", "Balotelli", "Agüero"],
};

function shell(inner: string, unsubUrl: string, preheader: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0d0e12;padding:32px 16px;font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<div style="max-width:440px;margin:0 auto;background:#15171c;border:1px solid #262933;border-radius:16px;padding:26px 24px;color:#e8e6e2">
<div style="font-size:20px;font-weight:800;margin-bottom:2px">Ball <span style="color:${GREEN}">IQ</span></div>
${inner}
<p style="font-size:11.5px;color:#7c7a75;margin:24px 0 0;line-height:1.5">You created a Ball IQ account. One nudge, not a newsletter.<br><a href="${unsubUrl}" style="color:#7c7a75">Unsubscribe from all Ball IQ emails</a></p>
</div></body></html>`;
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px"><tr>
<td align="center" bgcolor="${GREEN}" style="border-radius:999px">
<a href="${href}" style="display:block;padding:15px 20px;font-size:16px;font-weight:800;color:${INK};text-decoration:none">${label}</a>
</td></tr></table>`;
}

// Copy leads with something true about THIS person, not about the product.
function build(campaign: Campaign, row: Record<string, unknown>, unsubUrl: string) {
  if (campaign === "winback") {
    const best = Number(row.best_streak ?? 0);
    const recordBadge = best >= 2
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px"><tr><td style="padding:9px 15px;background:rgba(88,204,2,0.10);border:1px solid rgba(88,204,2,0.28);border-radius:999px;font-size:13.5px;font-weight:700;color:${GREEN}">Your best run &middot; ${best} days</td></tr></table>`
      : "";
    const fixture = (name: string, meta: string, last = false) =>
      `<tr><td style="padding:13px 16px;font-size:15.5px;font-weight:700;color:#e8e6e2${last ? "" : ";border-bottom:1px solid #22262b"}">${name}</td>
       <td align="right" style="padding:13px 16px;font-size:12.5px;color:#9aa0a6${last ? "" : ";border-bottom:1px solid #22262b"}">${meta}</td></tr>`;
    const body =
      `<div style="font-size:11px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:${GREEN};margin-top:18px">Today's fixtures</div>
       <p style="font-size:23px;line-height:1.25;font-weight:800;margin:8px 0 0;letter-spacing:-0.5px">The team sheet is up.</p>
       <p style="font-size:14.5px;line-height:1.6;color:#b3b0aa;margin:12px 0 0">All three are live and everybody gets the same ones today.${best >= 2 ? " Your record is still on your profile, waiting to be beaten." : ""}</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;background:#101418;border:1px solid #262933;border-radius:12px">
       ${fixture("Footle", "six guesses")}${fixture("Daily 7", "about three minutes")}${fixture("Mystery Player", "one career, no name", true)}
       </table>
       ${recordBadge}
       ${ctaButton("Kick off", "https://balliq.app/play?game=footle&utm_source=winback")}`;
    return {
      subject: best >= 2 ? `Your ${best}-day run is still the one to beat` : "Today's team sheet is up",
      html: shell(body, unsubUrl, "Three puzzles, everyone gets the same ones."),
    };
  }

  // ACTIVATE — the moment, then the question, with tappable answers.
  const opts = Q.options.map((o, i) =>
    `<tr><td style="padding:0 0 8px">
     <a href="https://balliq.app/play?eq=${Q.id}&amp;ea=${i}&amp;utm_source=activate" style="display:block;padding:14px 17px;border:1px solid #33383f;border-radius:10px;font-size:15.5px;font-weight:600;color:#e8e6e2;text-decoration:none;background:#1b1f24">${o}</a>
     </td></tr>`).join("");
  const body =
    `<div style="font-size:11px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:${GREEN};margin-top:18px">Manchester &middot; 13 May 2012</div>
     <div style="font-size:56px;line-height:1;font-weight:800;color:${GREEN};letter-spacing:-2.5px;margin-top:6px">93:20</div>
     <p style="font-size:14.5px;line-height:1.6;color:#b3b0aa;margin:14px 0 0">The most famous ten seconds in Premier League history. You already know how it ends.</p>
     <div style="border-left:3px solid ${GREEN};padding:2px 0 2px 13px;margin:18px 0 0;font-size:16px;line-height:1.5;font-weight:600">${Q.text}</div>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px">${opts}</table>
     <p style="font-size:14px;line-height:1.6;color:#b3b0aa;margin:10px 0 0">Tap your answer. It opens today's Daily 7 and tells you straight away whether you were right.</p>`;
  return {
    subject: "You know this one. 93:20, Manchester, 2012",
    html: shell(body, unsubUrl, "One question. You already know it or you don't."),
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
