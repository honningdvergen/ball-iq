// Club-quiz score landing. Mirrors api/q.js and api/c.js: serves real HTML with
// Open Graph tags so a balliq.app/iq/<slug>.<iq>.<sc>.<n> link unfurls as the
// sharer's score card in iMessage / WhatsApp / X. OG crawlers read the <head>;
// humans get redirected.
//
// ⚠️ HUMANS GO TO THE CLUB PAGE, NOT /play. Every other share loop here lands
// in the app, which is correct for those loops. This one is different on
// purpose: 94.6% of sessions view exactly one page, so the club page IS the
// product for almost everyone. Someone tapping a friend's Liverpool score
// wants the Liverpool quiz, not an app install prompt — and landing them on the
// club page closes the loop, because that page can produce another share.
// Sending them to /play would break the only self-sustaining cycle we have.
//
// Wired via vercel.json rewrite: /iq/:token -> /api/iq?t=:token, placed before
// the SPA catch-all. A malformed token degrades to the quiz hub rather than a
// dead screen.

export const config = { runtime: 'edge' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function handler(req) {
  const url = new URL(req.url);
  // Same loop instrumentation as api/c.js and api/q.js — bot=true means an OG
  // crawler unfurled the link somewhere, i.e. a share LANDED in a chat;
  // bot=false is a human click-through. Grep Vercel logs for t:"loop-hit".
  console.log(JSON.stringify({
    t: 'loop-hit',
    loop: 'iq',
    bot: /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|skype/i
      .test(req.headers.get('user-agent') || ''),
    country: req.headers.get('x-vercel-ip-country') || null,
  }));

  const origin = url.origin;
  const sp = url.searchParams;

  // token = slug.iq.score.total — all four positional, all validated.
  const parts = (sp.get('t') || '').trim().toLowerCase().split('.');
  const slug = /^[a-z0-9-]{2,40}$/.test(parts[0] || '') ? parts[0] : '';
  const num = (v, max) => {
    const n = parseInt(String(v || '').slice(0, 4), 10);
    return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
  };
  const iq = num(parts[1], 999);
  const sc = num(parts[2], 999);
  const tot = num(parts[3], 999);
  // Display text rides as query params for the card only; the app resolves
  // nothing from them. Clamped here and clamped again in api/og.js.
  const name = (sp.get('n') || '').slice(0, 28);
  const tier = (sp.get('r') || '').slice(0, 28);
  const badge = (sp.get('b') || '').slice(0, 4);
  const colour = (sp.get('c') || '').slice(0, 7);

  const valid = slug && iq !== null;
  // A score of "9/10" only makes sense when both halves survived validation.
  const line = sc !== null && tot ? `${sc}/${tot}` : '';

  const ogParams = new URLSearchParams({ t: 'iq', iq: String(iq ?? 0) });
  if (name) ogParams.set('n', name);
  if (tier) ogParams.set('r', tier);
  if (badge) ogParams.set('b', badge);
  if (colour) ogParams.set('c', colour);
  if (line) ogParams.set('sc', line);
  const ogImage = `${origin}/api/og?${ogParams.toString()}`;

  const who = name || 'football';
  const title = valid && tier
    ? `${who} IQ ${iq} — ${tier}`
    : `How well do you know ${who}?`;
  const description = valid
    ? `Someone scored ${line ? line + ' ' : ''}on the ${who} quiz${tier ? ` — ${tier}` : ''}. Think you can beat it? Free, no sign-up, every answer explained.`
    : `Take the ${who} quiz — free, no sign-up, every answer explained.`;
  const dest = valid ? `${origin}/quiz/${slug}/` : `${origin}/quiz/`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- googlebot-only noindex: keeps this share page out of search while leaving it
     readable to card crawlers. Same rule as api/q.js and api/c.js — see
     public/robots.txt for why this lives here rather than in robots. -->
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
<meta http-equiv="refresh" content="0; url=${esc(dest)}">
<style>body{margin:0;background:#0A0A0A;color:#fff;font-family:-apple-system,system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}a{color:#58CC02}</style>
</head>
<body>
<p>Opening the <a href="${esc(dest)}">${esc(who)} quiz</a>…</p>
<script>location.replace(${JSON.stringify(dest)});</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  });
}
