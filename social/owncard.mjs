// Our OWN text post as a 4:5 image card, in the clean screenshot look the reference
// accounts use — but the words are ours, posted under our own name.
//
//   node social/owncard.mjs --text "🚨 Mathematically, if…" --out card.png [--stats "2.2M views"]
//
// Why this exists (root-cause critique, 2026-09-22): Instagram stopped recommending
// reposted content to non-followers on 2026-04-30 — a screenshot of someone else's
// tweet does not count as original even with their name on it. Our one format that
// went big (the 🚨 "if Tottenham win all 33…" Threads post, 2.26M views) is our own
// words. This card carries those words to Instagram and Facebook.
//
// Guard: only the Shithousery HQ identity is ever drawn. There is no --name/--handle
// flag on purpose — putting words in someone else's mouth is the one thing this must
// never do.

import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs';

const arg = n => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const TEXT = arg('text'), OUT = arg('out'), STATS = arg('stats');
const AVATAR = arg('avatar') || '/private/tmp/tt/own/shq_avatar.jpg';
if (!TEXT || !OUT) { console.error('usage: owncard.mjs --text "…" --out card.png [--stats "…"]'); process.exit(1); }

const W = 1080, H = 1350;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const av = `data:image/jpeg;base64,${fs.readFileSync(AVATAR).toString('base64')}`;
const BADGE = `<svg viewBox="0 0 22 22" width="40" height="40"><path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>`;
const size = TEXT.length > 170 ? 48 : TEXT.length > 110 ? 54 : 60;

const html = `<!DOCTYPE html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;background:#fff;overflow:hidden}
  body{font-family:-apple-system,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;
       display:flex;align-items:center;padding:0 64px}
  .top{display:flex;align-items:center;gap:26px;margin-bottom:44px}
  .av{width:128px;height:128px;border-radius:50%;object-fit:cover}
  .nm{display:flex;align-items:center;gap:10px;font-size:48px;font-weight:800;color:#0f1419}
  .hd{font-size:40px;color:#536471}
  .tx{font-size:${size}px;line-height:1.28;color:#0f1419;white-space:pre-wrap;letter-spacing:-.01em}
  .st{margin-top:44px;font-size:34px;color:#536471}
</style><div><div class="top"><img class="av" src="${av}">
  <div><div class="nm">Shithousery HQ ${BADGE}</div><div class="hd">@shithouseryhq</div></div></div>
  <div class="tx">${esc(TEXT)}</div>${STATS ? `<div class="st">${esc(STATS)}</div>` : ''}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html);
const h = await page.evaluate(() => document.body.firstElementChild.getBoundingClientRect().height);
if (h > H - 60) { console.error(`overflows (${Math.round(h)}px) — shorten the text`); process.exit(1); }
await page.screenshot({ path: OUT });
await browser.close();
console.log(`✅ ${OUT}`);
