// Stitch-up landing (16 Oct 2026). Mirrors api/l.js: real HTML with preview
// tags, so balliq.app/s/1x9k2qa.3.4.0-0.Alex unfurls as a taunt card in
// WhatsApp / iMessage / X ("Alex stitched you up: whose career is this?"),
// and a person is sent on to /play?stitch=TOKEN, where the web app opens the
// board (src/screens/StitchUp.jsx).
//
// ⚠️ NO ANSWER, ANYWHERE ON THIS PAGE OR ITS CARD. The token carries a hash of
// the player's id, never his name (src/lib/stitchToken.js), and this function
// does not look him up: it knows the sender, the taunt and how many clubs show,
// and nothing else.
//
// Wired via vercel.json: /s/:token -> /api/s?t=:token (before the SPA
// catch-all). An invalid token still opens the app, which says the link is
// broken and offers to make one.
//
// ⚠️ /s/ IS NOT IN THE DEEP-LINK FILES on purpose (apple-app-site-association,
// assetlinks): Stitch-up is web only, and an installed app that caught the
// link would have nowhere to send it.

import { parseStitchToken, makeStitchToken, stitchHeadline, STITCH_TAUNTS } from '../src/lib/stitchToken.js';

export const config = { runtime: 'edge' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default async function handler(req) {
  const url = new URL(req.url);
  // One line per hit (loop instrumentation, as api/c.js and api/l.js):
  // bot=true is a link unfurled in a chat, bot=false a person tapping through.
  const hit = {
    loop: 's',
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
  const st = parseStitchToken(url.searchParams.get('t'));
  const title = st ? stitchHeadline(st.name) : 'Stitch-up: whose career is this?';
  const description = st
    ? `“${STITCH_TAUNTS[st.taunt]}” · ${st.shown} clubs to start, five guesses. Free, no sign-up.`
    : 'Name the footballer from his career. Free, no sign-up.';
  const ogQ = new URLSearchParams({ t: 'stitch' });
  if (st) { ogQ.set('k', String(st.taunt)); ogQ.set('c', String(st.shown)); if (st.name) ogQ.set('n', st.name); }
  const ogImage = `${origin}/api/og?${ogQ.toString()}`;
  // Re-canonicalised, never the raw input (the same reason as api/c.js).
  const canonical = st ? makeStitchToken(st) : '';
  const appUrl = canonical ? `${origin}/play?stitch=${encodeURIComponent(canonical)}` : `${origin}/play?stitch=new`;

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
