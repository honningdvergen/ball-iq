// Shareable profile landing page. Serves real HTML with Open Graph tags so a
// balliq.app/p?... link renders the player's card (via /api/og) as a rich,
// tappable preview in iMessage / WhatsApp / Twitter / etc. Human visitors are
// redirected into the web app; OG crawlers read the <head> meta and never run
// the JS redirect, so they still get the card preview.

export const config = { runtime: 'edge' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function handler(req) {
  const url = new URL(req.url);
  const origin = url.origin;
  const sp = url.searchParams;

  const name = (sp.get('n') || 'A Ball IQ player').slice(0, 24);
  const league = (sp.get('l') || '').slice(0, 28);
  const xp = sp.get('x') || '0';
  const games = sp.get('g') || '0';
  const streak = sp.get('s') || '0';
  const accuracy = sp.get('a') || '—';

  const ogImage = `${origin}/api/og?${sp.toString()}`;
  const title = `${name} on Ball IQ`;
  const descParts = [];
  if (league) descParts.push(league);
  descParts.push(`${Number(xp).toLocaleString()} XP`);
  descParts.push(`${games} games · ${streak}-day streak · ${accuracy}`);
  const description = `${descParts.join(' · ')} — can you beat me? ⚽`;
  const appUrl = `${origin}/`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<style>body{margin:0;background:#0A0A0A;color:#fff;font-family:-apple-system,system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}a{color:#22c55e}</style>
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
