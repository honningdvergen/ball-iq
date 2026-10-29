// Mates' league invite landing (phase 1). Mirrors api/c.js: real HTML with
// preview tags, so balliq.app/l/K7QM2XPA.The%20Lads.Alex unfurls as an invite
// card in WhatsApp / iMessage / X, and a person is sent on to
// /play?league=TOKEN, where the app's boot opens the join screen.
//
//   K7QM2XPA   the code: 8 characters, alphabet 23456789ABCDEFGHJKMNPQRSTUVWXYZ
//   The Lads   the league's name  } LABELS ONLY, from the link itself. There is
//   Alex       who sent it        } NO database read here, so nothing about the
//                                   league (no member count, no table) can reach
//                                   a stranger: Alex's ruling, never show crowd
//                                   sizes outside the league.
//
// Wired via vercel.json: /l/:token -> /api/l?t=:token (before the SPA
// catch-all). An invalid token falls back to /play. The parse is kept in step
// with src/lib/leagues.js by hand (tests/unit/league-invite-landing.test.js
// compares them): importing that file would pull the Supabase client into this
// edge bundle.
//
// ⚠️ /l/ IS NOT YET IN apple-app-site-association on purpose: an iOS install
// older than the first build with the league handler (29 Oct 2026, App.jsx
// tryCapture) would catch the link and land on Home; in the browser the web
// join works. Add /l/* there the day that build is live in the App Store. The
// Android intent filter already lists /l/ (it ships inside the build).

export const config = { runtime: 'edge' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cleanLabel = (s, max) => String(s || '').replace(/\./g, ' ').replace(/[^\p{L}\p{N} '_-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max);
const enc = (s) => encodeURIComponent(s).replace(/\./g, '%2E');

export function parseInvite(token) {
  const m = /^([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8})(?:\.([^.]*))?(?:\.([^.]*))?$/i.exec(String(token || '').trim());
  if (!m) return null;
  const dec = (s) => { try { return decodeURIComponent(s || ''); } catch { return s || ''; } };
  return { code: m[1].toUpperCase(), name: cleanLabel(dec(m[2]), 32), inviter: cleanLabel(dec(m[3]), 22) };
}

export default async function handler(req) {
  const url = new URL(req.url);
  // One line per hit (loop instrumentation, as api/c.js): bot=true is a link
  // unfurled in a chat, bot=false a person tapping through.
  const hit = {
    loop: 'l',
    bot: /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|skype/i
      .test(req.headers.get('user-agent') || ''),
    country: req.headers.get('x-vercel-ip-country') || null,
  };
  console.log(JSON.stringify({ t: 'loop-hit', ...hit }));
  // The same synthetic-traffic guard as api/c.js: never from a local run, an
  // e2e or a preview deployment.
  const host = (url.hostname || '').toLowerCase();
  const synthetic = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')
    || host.endsWith('.vercel.app');
  try {
    const base = process.env.VITE_SUPABASE_URL || 'https://blcisypmngimqkwxrrdm.supabase.co', key = process.env.VITE_SUPABASE_KEY;
    if (!synthetic && base && key) {
      await Promise.race([
        fetch(`${base}/rest/v1/rpc/record_funnel_event`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}` },
          body: JSON.stringify({ p_event: 'loop-hit', p_meta: hit, p_visitor: null }),
        }).catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
    }
  } catch {}

  const origin = url.origin;
  const inv = parseInvite(url.searchParams.get('t'));
  const who = inv?.inviter || 'A mate';
  const title = inv ? `${who} invited you to ${inv.name || 'a league'} on Ball IQ` : 'Ball IQ: play the dailies against your mates';
  const description = 'Mon to Sun · Footle, Daily 7, Transfer Trail, Top 10 · Free';
  const ogQ = new URLSearchParams({ t: 'league' });
  if (inv?.name) ogQ.set('n', inv.name);
  if (inv?.inviter) ogQ.set('w', inv.inviter);
  const ogImage = `${origin}/api/og?${ogQ.toString()}`;
  // Re-canonicalised, never the raw input: the labels ride encoded inside the
  // token, and the token rides encoded inside the query.
  const canonical = inv ? `${inv.code}.${enc(inv.name)}${inv.inviter ? '.' + enc(inv.inviter) : ''}` : '';
  const appUrl = inv ? `${origin}/play?league=${encodeURIComponent(canonical)}` : `${origin}/play`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- googlebot-only noindex, as api/c.js: card crawlers must still read the page. -->
<meta name="googlebot" content="noindex">
<title>${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ball IQ">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<meta http-equiv="refresh" content="0; url=${esc(appUrl)}">
<style>body{margin:0;background:#0B0C10;color:#fff;font-family:-apple-system,system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}a{color:#58CC02}</style>
</head>
<body>
<p>Opening <a href="${esc(appUrl)}">Ball IQ</a>…</p>
<script>location.replace(${JSON.stringify(appUrl)});</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300' },
  });
}
