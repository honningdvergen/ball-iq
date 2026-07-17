// Multiplayer invite landing. Mirrors api/c.js: serves real HTML with Open
// Graph tags so a balliq.app/join/CODE link unfurls as an INVITE (host name +
// room code tiles + "Tap to join") instead of the generic app card.
//
// Why this exists: /join/CODE previously fell through the SPA catch-all rewrite
// to index.html, whose og: tags are static ("Ball IQ — The Ultimate Football
// Quiz", og:url pinned to the homepage). So an invite sent to a friend looked
// identical to a download link — the room code, the one thing the recipient
// needs, never appeared in the preview.
//
// Human visitors are redirected into the app with the code in QUERY form
// (/?join=CODE — the boot parser in App.jsx accepts BOTH /join/CODE and
// ?join=CODE), so the redirect can never re-enter this function and loop.
// OG crawlers read the <head> and never run the JS redirect.
//
// iOS is unaffected: /join/* is an Universal Link (public/.well-known/
// apple-app-site-association), so a tap with the app installed opens the app
// directly and never reaches this endpoint. This serves the no-app path and
// the chat crawler — which are exactly the cases the invite was leaking on.
//
// Wired via vercel.json rewrite: /join/:code -> /api/join?c=:code (MUST be
// placed before the SPA catch-all). Bare /join falls through to the SPA.

export const config = { runtime: 'edge' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Room codes use a deliberately reduced alphabet so they survive being read
// aloud or retyped out of a chat. Three alphabets are in play and they are NOT
// identical — check before tightening this:
//   server (prod-snapshot/functions.sql): ABCDEFGHJKMNPQRSTUVWXYZ23456789
//                                         → excludes I, L, O, 0, 1
//   client filter (App.jsx:7428):         [A-HJ-NP-Z2-9] → also permits L
// This mirrors the CLIENT filter, making it a superset of what the server can
// mint. That asymmetry is deliberate and safe in one direction only: a looser
// regex can at worst render a card for a code no room has (tap → "room not
// found"), whereas a tighter one would silently drop the card for a code that
// is actually valid. Never narrow this below the client filter.
const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;

export default function handler(req) {
  const url = new URL(req.url);
  const origin = url.origin;
  const raw = (url.searchParams.get('c') || '').trim().toUpperCase();
  const name = (url.searchParams.get('n') || '').slice(0, 22);

  const valid = CODE_RE.test(raw);
  const code = valid ? raw : '';
  const who = name || 'A mate';

  const ogParams = new URLSearchParams({ t: 'invite' });
  if (code) ogParams.set('c', code);
  if (name) ogParams.set('n', name);
  const ogImage = `${origin}/api/og?${ogParams.toString()}`;

  const title = valid
    ? `${who} wants to play you on Ball IQ ⚽`
    : 'Play football trivia head-to-head ⚽';
  const description = valid
    ? `Join room ${code} — head-to-head football trivia, best score wins. Free, no sign-up.`
    : 'Head-to-head football trivia against your mates. Free, no sign-up.';

  // An invalid/absent code degrades to the app home rather than pushing a dead
  // code into the join flow (same fresh-code rule as api/c.js).
  const appUrl = valid ? `${origin}/?join=${code}` : `${origin}/play`;

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
      // Rooms are ephemeral; keep the edge cache short so a recycled code can
      // never serve a stale host name. Crawlers refetch per-link anyway.
      'cache-control': 'public, max-age=0, s-maxage=60',
    },
  });
}
