// email-unsub — one-click opt-out for every Ball IQ email, ever.
//
// The link in each email carries ?u=<user_id>&t=<hmac(user_id)>. The HMAC
// (EMAIL_UNSUB_SECRET) stops anyone unsubscribing other people by guessing
// ids. Opt-out is recorded as email_events kind='unsub'; every sender
// selection excludes users with such a row. GET so it works from any mail
// client; idempotent; always answers with a human page, never an error, to
// the person clicking.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const UNSUB_SECRET = (Deno.env.get("EMAIL_UNSUB_SECRET") ?? "").trim();

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

const page = (msg: string) =>
  new Response(
    `<!doctype html><html><body style="margin:0;background:#0d0e12;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,Segoe UI,Roboto,sans-serif"><div style="text-align:center;color:#e8e6e2;padding:24px"><div style="font-size:22px;font-weight:800">Ball <span style="color:#58CC02">IQ</span></div><p style="color:#b3b0aa;font-size:15px;max-width:320px">${msg}</p></div></body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const u = (url.searchParams.get("u") ?? "").trim();
    const t = (url.searchParams.get("t") ?? "").trim();
    if (!UNSUB_SECRET || !/^[0-9a-f-]{36}$/i.test(u) || !t) {
      return page("That unsubscribe link doesn't look right. Nothing has changed.");
    }
    const expect = await hmac(u);
    if (t !== expect) {
      return page("That unsubscribe link doesn't look right. Nothing has changed.");
    }
    const { error } = await admin.from("email_events").insert({ user_id: u, kind: "unsub" });
    // unique violation = already unsubscribed; both outcomes read the same
    if (error && !/duplicate|unique/i.test(error.message)) {
      console.warn("[unsub]", error.message);
    }
    return page("You're unsubscribed — no more emails from us. Your account and streaks are untouched.");
  } catch (e) {
    console.warn("[unsub]", e);
    return page("Something hiccuped, but you can just close this page — we've noted it.");
  }
});
