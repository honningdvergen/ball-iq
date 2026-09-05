// Chrome for the pages that are SERVED, not generated: the Footle answer
// pages (api/footle.js) and the Daily 7 answer pages (api/daily-answers.js).
//
// They render on request so "today" is always today without a deploy, and
// until 2026-09-04 that made them the one page type wearing a third look —
// their own brand mark, their own two-link nav, their own palette. Alex's
// complaint about the site was exactly that ("it feels like a different
// website when I navigate"). So they now take the same header, finder and
// sitemap footer as every generated page and the front door, from the same
// module, on the same tokens. The page styles below are the generated
// pages' own selectors (crumbs, kicker, eyebrow, hero h1, sec, prose) with
// the same values, so a person moving between /football-wordle/ and
// /football-wordle/answer/ sees one site.
//
// Kept small on purpose: api/footle.js runs on the edge runtime, and every
// byte imported here ships in that bundle.
import { rootCss } from '../../src/design/tokens.js';
import { SITE } from './content.mjs';
import { shellHeader, shellFooter, SHELL_CSS } from './shell.mjs';

export { SITE };

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PAGE_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  html{background:var(--bg);-webkit-text-size-adjust:100%}
  body{font-family:var(--font);background:var(--bg);color:var(--tx2);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  a{color:var(--grn-soft);text-decoration:none}
  .prose a,.sec>p a,.qw a{text-decoration:underline;text-underline-offset:2px;text-decoration-thickness:1px}
  main{max-width:1200px;margin:0 auto;padding:0 clamp(20px,4vw,44px)}
  .narrow{max-width:760px}
  .hero{padding:34px 0 6px}
  .crumbs{font-size:13px;color:var(--tx4);margin-bottom:22px}
  .crumbs a{color:var(--tx4)}
  .crumbs .sep{margin:0 8px}
  .kicker{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  .eyebrow{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3)}
  h1{font-weight:800;font-size:clamp(30px,4.4vw,46px);line-height:1.05;letter-spacing:-.02em;color:var(--tx);margin-bottom:14px}
  .lead{font-size:clamp(16px,2vw,19px);line-height:1.55;color:var(--tx3);max-width:52ch;margin-bottom:22px}
  h2{font-size:clamp(22px,3.2vw,32px);font-weight:800;letter-spacing:-.02em;color:var(--tx);line-height:1.12;margin:0 0 16px}
  .sec{padding:30px 0}
  .prose p{margin:0 0 14px;font-size:16px}
  .card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px 18px}
  .btn-green{display:inline-flex;align-items:center;min-height:44px;gap:8px;padding:12px 22px;background:var(--grn);color:var(--grn-ink);font-weight:800;font-size:15px;border-radius:999px}
  .btn-ghost{display:inline-flex;align-items:center;min-height:44px;padding:12px 20px;border:1px solid var(--bd2);border-radius:999px;color:var(--tx);font-weight:700;font-size:15px}
  .cta-row{display:flex;flex-wrap:wrap;gap:12px;margin:18px 0 6px}
  .hints{list-style:none}
  .hints li{display:flex;gap:14px;align-items:baseline;padding:13px 0;border-bottom:1px solid var(--bd)}
  .hints li:last-child{border-bottom:0}
  .hn{flex:0 0 52px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--grn)}
  .ht{font-size:16px}
  .ht strong{color:var(--tx)}
  details.reveal{margin-top:16px;background:var(--card2);border:1px solid var(--bd);border-radius:12px;overflow:hidden}
  details.reveal summary{list-style:none;cursor:pointer;padding:16px 18px;font-weight:700;color:var(--tx);display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:44px}
  details.reveal summary::-webkit-details-marker{display:none}
  details.reveal summary .chev{color:var(--grn);font-size:20px;transition:transform .2s}
  details.reveal[open] summary .chev{transform:rotate(45deg)}
  .answer{padding:0 18px 18px}
  .answer .big{font-size:34px;font-weight:800;letter-spacing:.08em;color:var(--grn);margin:2px 0;text-transform:uppercase}
  .answer .who{font-size:16px}
  .answer .who strong{color:var(--tx)}
  table{width:100%;border-collapse:collapse;font-size:15px}
  td{padding:10px 6px;border-bottom:1px solid var(--bd);vertical-align:top}
  tr:last-child td{border-bottom:0}
  .an{width:72px;white-space:nowrap}
  .an a{color:var(--grn);font-weight:700}
  .ad{color:var(--tx4);width:84px;white-space:nowrap}
  .aa{color:var(--tx)}
  .asr{color:var(--tx4)}
  .pn{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px}
  .pn a{font-weight:600;color:var(--tx3)}
  .pn a:hover{color:var(--tx)}
  .qa{list-style:none;display:grid;gap:12px}
  .qa li{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px 18px}
  .qa .qn{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--tx4);margin-bottom:6px}
  .qa .qq{font-size:16px;font-weight:600;color:var(--tx);margin-bottom:10px}
  .qa .qo{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
  .qa .qo span{font-size:13.5px;color:var(--tx3);border:1px solid var(--bd);border-radius:999px;padding:3px 10px}
  .qa .qo span.ok{color:var(--grn);border-color:var(--grn);font-weight:700}
  .qw{font-size:14px;color:var(--tx3);border-left:2px solid var(--bd2);padding-left:10px}
  .days{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px 14px}
  .days a{display:block;min-height:36px;line-height:36px;font-size:14px;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .days a:hover{color:var(--tx)}
  .days a b{color:var(--tx);font-weight:600}
  @media(max-width:720px){.hero{padding-top:22px}}
`;

/**
 * A complete HTML document in the site's chrome.
 * @param {{title:string, description:string, canonical:string, body:string,
 *          robots?:string, ogTitle?:string, ld?:object|null, active?:string}} p
 */
export function answerDocument({ title, description, canonical, body, robots = 'index, follow, max-image-preview:large', ogTitle = title, ld = null, active = '' }) {
  const ldTag = ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Ball IQ">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE.ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE.ogImage}">
<link rel="icon" type="image/png" href="/icon-192.png" sizes="192x192">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=optional">
${ldTag}
<style>
  ${rootCss()}
  ${SHELL_CSS}
  ${PAGE_CSS}
</style>
</head>
<body>
${shellHeader(SITE, active)}
<main id="main">
${body}
</main>
${shellFooter(SITE)}
</body>
</html>`;
}

/** Seconds until the next UTC midnight, floored at 60 — the puzzle roll. */
export function secondsToUtcMidnight(now = new Date()) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const next = (Math.floor(now.getTime() / DAY_MS) + 1) * DAY_MS;
  return Math.max(60, Math.floor((next - now.getTime()) / 1000));
}

export const MONTH_LONG = { day: 'numeric', month: 'long', year: 'numeric' };
export const MONTH_SHORT = { day: 'numeric', month: 'short' };
export const MONTH_SHORT_Y = { day: 'numeric', month: 'short', year: 'numeric' };
export const fmtUtc = (d, opts) => d.toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });
