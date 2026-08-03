// /footle — the share-link entry point, with head tags that do not throw away
// every backlink it earns.
//
// THE PROBLEM THIS SOLVES
// Every Footle link that exists points here: the in-app share text
// (App.jsx:3954, :5031, :7546 all end "balliq.app/footle"), the /t /ig /tt /x
// social redirects in vercel.json, every outreach template in
// docs/growth/authority-kit.md, and the AlternativeTo listing. /footle was
// rewritten straight to /index.html, which carries a hardcoded
// `<title>Ball IQ — The Ultimate Football Quiz</title>` and
// `<link rel="canonical" href="https://balliq.app/">`, and nothing in src/
// ever updates either one client-side.
//
// So the one URL on the domain containing the word "footle" was indexed under
// a title that never says Footle, and its canonical donated the accumulated
// equity to "/" — a page that does not target the term either. Meanwhile
// /football-wordle/, which says "footle" 29 times and carries the Game schema,
// received none of it. Verified live: site:balliq.app footle returns
// balliq.app/footle first, titled with the generic homepage title, and
// /football-wordle/ does not appear at all.
//
// WHY NOT JUST SERVE THE STATIC LANDING PAGE HERE
// Because /footle has to keep booting the app straight into the game.
// App.jsx:9085 reads location.pathname and calls setScreen("wordle"), so
// someone clicking a friend's shared grid lands *in* today's puzzle rather
// than on a page about it. A rewrite preserves the URL, so that still works;
// only the head changes.
//
// WHAT IT DOES
// Serves the real app shell with three tags swapped: a title that names Footle,
// a canonical pointing at /football-wordle/ so the equity consolidates on the
// page that actually targets the term, and social tags that describe the game
// instead of the site. The shell is fetched from the deployment's own
// /index.html rather than inlined, because Vite rewrites the asset hashes on
// every build and a hardcoded copy would silently serve a stale bundle.

export const config = { runtime: 'edge' };

const CANONICAL = 'https://balliq.app/football-wordle/';
const TITLE = 'Footle — the daily football Wordle | Ball IQ';
const DESC =
  'Guess the footballer’s surname in six. A new one every midnight, the same for everybody. Free, no account, nothing to install.';

// Replace only the FIRST match of each: the shell has one of each in <head>,
// and a global replace would also rewrite whatever the app renders later.
function swapOnce(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

export default async function handler(request) {
  const origin = new URL(request.url).origin;

  let html;
  try {
    // /index.html is a plain static file (vercel.json rewrites never target
    // it), so this cannot recurse back into this function.
    const res = await fetch(`${origin}/index.html`, {
      headers: { 'x-footle-boot': '1' },
    });
    if (!res.ok) throw new Error(`shell ${res.status}`);
    html = await res.text();
  } catch {
    // If the shell cannot be fetched, fall through to the normal SPA rather
    // than serving an error page to someone who just clicked a friend's score.
    return Response.redirect(`${origin}/?game=footle`, 302);
  }

  html = swapOnce(html, /<title>[^<]*<\/title>/, `<title>${TITLE}</title>`);
  html = swapOnce(
    html,
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${CANONICAL}" />`
  );
  html = swapOnce(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${DESC}" />`);
  html = swapOnce(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${TITLE}" />`);
  html = swapOnce(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${DESC}" />`);
  html = swapOnce(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="https://balliq.app/footle" />`);
  html = swapOnce(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${TITLE}" />`);
  html = swapOnce(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${DESC}" />`);

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Same posture as / and /index.html: never cache the shell in the
      // browser, so a new deploy's asset hashes are picked up immediately.
      // The CDN may hold it briefly.
      'cache-control': 'no-cache, no-store, must-revalidate',
      'x-robots-tag': 'index, follow',
    },
  });
}
