// Daily-7 challenge landing (opportunity-scan #2). Mirrors api/q.js: serves
// real HTML with Open Graph tags so a balliq.app/c/SCORE.YYYYMMDD[.Name] link
// unfurls as a taunt card (challenger name + score dots) in iMessage /
// WhatsApp / X. Human visitors are redirected into the app with the token in
// QUERY form (/play?c=TOKEN — the boot parser accepts both forms), so the
// redirect can never re-enter this function. OG crawlers read the <head> and
// never run the JS redirect.
//
// Wired via vercel.json rewrite: /c/:token -> /api/c?t=:token (placed before
// the SPA catch-all). Bare /c falls through to the SPA and degrades to home.

export const config = { runtime: 'edge' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function handler(req) {
  const url = new URL(req.url);
  // Loop instrumentation (opportunity scan 2026-08-10 P0): one line per hit,
  // same shape as api/get.js's get-click. bot=true means an OG crawler
  // unfurled the link somewhere — i.e. a share LANDED in a chat; bot=false is
  // a human click-through. Grep Vercel logs for t:"loop-hit".
  console.log(JSON.stringify({
    t: 'loop-hit',
    loop: 'c',
    bot: /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|skype/i
      .test(req.headers.get('user-agent') || ''),
    country: req.headers.get('x-vercel-ip-country') || null,
  }));
  const origin = url.origin;
  const token = (url.searchParams.get('t') || '').trim();

  // SCORE.YYYYMMDD[.Name] — score 0-7, name optional (URI-encoded by the
  // sharer; literal dots ride as %2E). The DATE range check is part of token
  // VALIDITY (fresh-code audit): an absurd date like 99999999 must degrade to
  // the generic card + bare /play, not ship a personalized card + raw token.
  const m = token.match(/^([0-7])\.(\d{8})(?:\.(.+))?$/);
  let valid = false, score = 0, name = '', dateLabel = '';
  if (m) {
    const y = +m[2].slice(0, 4), mo = +m[2].slice(4, 6), d = +m[2].slice(6, 8);
    if (y > 2020 && y < 2100 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      valid = true;
      score = parseInt(m[1], 10);
      try { name = decodeURIComponent(m[3] || '').slice(0, 22); } catch { name = ''; }
      const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dateLabel = `${d} ${MONTHS[mo - 1]}`;
    }
  }

  const who = name || 'A mate';
  const ogParams = new URLSearchParams({ t: 'challenge', s: String(score) });
  if (name) ogParams.set('n', name);
  if (dateLabel) ogParams.set('d', dateLabel);
  const ogImage = `${origin}/api/og?${ogParams.toString()}`;

  const title = valid ? `${who} scored ${score}/7 on the Daily 7 ⚽` : 'Daily 7 challenge ⚽';
  const description = valid
    ? `Same 7 questions, one try — beat ${name ? 'them' : 'it'} before midnight. Free, no sign-up.`
    : "Today's 7 football questions are waiting. Free, no sign-up.";
  // Invalid/missing token falls back to the app home rather than a dead screen.
  // Re-canonicalize rather than pass the raw token through: searchParams.get
  // percent-DECODED it (%2E -> "."), and encodeURIComponent won't re-encode
  // dots (unreserved) — so a dotted name like "J.Doe" would reach the app's
  // dot-splitting parser corrupted. Rebuild with the sharer's own encoding
  // (dots in names ride as %2E), keeping even old cached clients correct.
  // ?f=<uuid> is the challenger's id (2026-08-29) — it closes the loop by
  // letting the friend's play notify the challenger. Forwarded only if it
  // looks like a uuid; anything else is dropped rather than reflected.
  const fRaw = (url.searchParams.get('f') || '').trim();
  const fQ = /^[0-9a-f-]{36}$/i.test(fRaw) ? `&f=${fRaw}` : '';
  const appUrl = valid
    ? `${origin}/play?c=${m[1]}.${m[2]}${name ? '.' + encodeURIComponent(name).replace(/\./g, '%2E') : ''}${fQ}`
    : `${origin}/play`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- googlebot-only noindex: keeps this share page out of search while leaving it
     readable to card crawlers. See public/robots.txt for why this lives here. -->
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
<style>body{margin:0;background:#0A0A0A;color:#fff;font-family:-apple-system,system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}a{color:#58CC02}</style>
</head>
<body>
<p>Opening <a href="${esc(appUrl)}">Ball IQ</a>…</p>
<script>location.replace(${JSON.stringify(appUrl)});</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  });
}
