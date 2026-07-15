// Stump-a-mate landing page. Mirrors api/p.js: serves real HTML with Open
// Graph tags so a balliq.app/q?id=… link unfurls as a card showing the
// QUESTION (answer redacted — the mystery IS the hook) in iMessage /
// WhatsApp / X / etc. Human visitors are redirected into the app's
// one-question stump screen; OG crawlers read the <head> and never run
// the JS redirect.
//
// The question TEXT rides in the URL (?qt=) purely for the preview card —
// the app resolves the real question (options, answer, hint) from its own
// bank by ?id=, so this edge function never needs the 1.3MB bank.

export const config = { runtime: 'edge' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function handler(req) {
  const url = new URL(req.url);
  const origin = url.origin;
  const sp = url.searchParams;

  const id = (sp.get('id') || '').trim().toLowerCase();
  const validId = /^q_[a-z0-9]+$/.test(id);
  const qt = (sp.get('qt') || '').slice(0, 160);
  const cat = (sp.get('c') || '').slice(0, 24);

  const ogParams = new URLSearchParams({ t: 'stump' });
  if (qt) ogParams.set('qt', qt);
  if (cat) ogParams.set('c', cat);
  const ogImage = `${origin}/api/og?${ogParams.toString()}`;

  const title = 'Can you get this one? ⚽';
  const description = qt
    ? `“${qt}” — tap to answer. Free, no sign-up.`
    : 'A football question is doing the rounds — tap to answer. Free, no sign-up.';
  // Invalid/missing id falls back to the app home rather than a dead screen.
  const appUrl = validId ? `${origin}/play?stump=${id}` : `${origin}/play`;

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
