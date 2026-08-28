// Shareable profile landing page. Serves real HTML with Open Graph tags so a
// balliq.app/p?... link renders the player's card (via /api/og) as a rich,
// tappable preview in iMessage / WhatsApp / Twitter / etc. Human visitors are
// redirected into the web app; OG crawlers read the <head> meta and never run
// the JS redirect, so they still get the card preview.

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
    loop: 'p',
    bot: /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|skype/i
      .test(req.headers.get('user-agent') || ''),
    country: req.headers.get('x-vercel-ip-country') || null,
  }));
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
  // /play, not the marketing homepage: a shared player-card recipient should
  // land in the app one tap from playing. (opportunity-scan #1)
  const appUrl = `${origin}/play`;
  // Supabase funnel beacon — same first-party, consent-exempt channel the club
  // pages use, so p-land / p-cta sit beside clubq-* in one table. Public
  // publishable key by design; guarded on navigator.webdriver so Playwright
  // can never pollute prod again (867-robot-rows lesson).
  const SB = process.env.VITE_SUPABASE_URL || 'https://blcisypmngimqkwxrrdm.supabase.co';
  const PK = process.env.VITE_SUPABASE_KEY || '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Keep this share page out of the search index WITHOUT hiding it from card
     crawlers. Targets googlebot specifically — a blanket name="robots" noindex
     is read by other crawlers too, and this page exists to be unfurled. -->
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
<style>
  /* The receiver's first three seconds decide the loop. One card, one claim,
     one button — nothing else competes. Single dark theme on purpose: it is
     the brand ground the card was drawn for. */
  *{box-sizing:border-box}
  body{margin:0;background:#0A0E0B;color:#EDF3EE;font-family:-apple-system,system-ui,'Segoe UI',Roboto,sans-serif;
       min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
       padding:28px 16px 44px;text-align:center}
  .card{width:min(560px,94vw);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.55);display:block}
  h1{font-size:clamp(22px,5.5vw,30px);font-weight:900;letter-spacing:-.3px;margin:22px 0 6px}
  p.sub{color:#96AC9D;font-size:15px;margin:0 0 22px;max-width:34em;line-height:1.5}
  a.cta{display:inline-block;background:#58CC02;color:#08130A;font-weight:800;font-size:17px;
        padding:15px 30px;border-radius:14px;text-decoration:none;box-shadow:0 10px 26px rgba(88,204,2,.28)}
  a.cta:active{transform:translateY(1px)}
  p.fine{color:#6E8377;font-size:12.5px;margin-top:14px}
  p.fine a{color:#8FD98F}
</style>
</head>
<body>
<img class="card" src="${esc(ogImage)}" alt="${esc(name)}'s Ball IQ card" width="1200" height="630">
<h1>Can you beat ${esc(name)}?</h1>
<p class="sub">This is a real Ball IQ card — earned by playing, not filled in. Answer a few football questions and get your own.</p>
<a class="cta" id="cta" href="${esc(appUrl)}">Get your Ball IQ — play free</a>
<p class="fine">No sign-up needed · plays in your browser · <a href="${esc(origin)}/">what is Ball IQ?</a></p>
<script>
(function(){
  try{
    if (navigator.webdriver) return;                 // e2e must never pollute prod
    var PK=${JSON.stringify(PK)}, SB=${JSON.stringify(SB)};
    if(!PK) return;
    var vid;try{vid=localStorage.getItem('bq_vid');if(!vid){vid=crypto.randomUUID();localStorage.setItem('bq_vid',vid);}}catch(e){vid=null;}
    function ev(n){try{fetch(SB+'/rest/v1/rpc/record_funnel_event',{method:'POST',keepalive:true,
      headers:{'content-type':'application/json','apikey':PK,'authorization':'Bearer '+PK},
      body:JSON.stringify({p_event:n,p_meta:{surface:'p-landing'},p_visitor:vid})}).catch(function(){})}catch(e){}}
    ev('p-land');
    var c=document.getElementById('cta');
    if(c)c.addEventListener('click',function(){ev('p-cta')});
  }catch(e){}
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  });
}
