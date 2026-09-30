// 🚨 THE DAILY NUMBER — card template for the numbered daily series (Exp 1, 2026-09-29).
// One deadpan absurd-but-true maths post per day, same look, same slot (13:30 Oslo), X + Threads + IG feed.
// Look = social/owncard.mjs (white 4:5 tweet-style card, our own account only). There is NO --name/--handle
// flag on purpose: only the Shithousery HQ identity is ever drawn.
//
//   node social/dailynumber.mjs --n 1 --text "Mathematically, if …" --image proof.png --out social/state/media/dailynumber/n01
//        [--credit "Photo: Author / CC BY-SA 4.0"] [--fit cover|contain] [--avatar path.jpg]
//
// --n      series number (the header line "🚨 THE DAILY NUMBER #N" is added for you, do not put it in --text)
// --text   the body, as it will be posted (blank lines = paragraph breaks). ≤ ~230 chars or the card refuses.
// --image  the picture that PROVES it (photo, table, receipt). Slide 2 + the image attached on X/Threads.
// --out    output prefix. Writes:
//            <out>_1_card.png   IG slide 1: our own fake-official text card (1080x1350)
//            <out>_2_proof.png  IG slide 2 = the image attached on X and Threads (1080x1350)
//            <out>_3_cta.png    IG slide 3: "Following us takes one second."
//            <out>_text.txt     the exact X/Threads post text (header + body) — feed this to review.mjs --text-file
//
// Slide order for IG is 1 → 2 → 3. On X/Threads attach only <out>_2_proof.png and paste <out>_text.txt.

import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const N = arg('n'), BODY = arg('text'), IMAGE = arg('image'), OUT = arg('out'), CREDIT = arg('credit');
const FIT = arg('fit') || 'cover';
const AVATAR = arg('avatar') || [path.join(HERE, 'state/media/own/shq_avatar.jpg'), '/private/tmp/tt/own/shq_avatar.jpg'].find((f) => fs.existsSync(f));
if (!N || !BODY || !IMAGE || !OUT || !AVATAR) {
  console.error('usage: dailynumber.mjs --n 1 --text "body" --image proof.png --out prefix [--credit "…"] [--fit cover|contain]');
  process.exit(1);
}
if (!/^\d+$/.test(N)) { console.error('--n must be a whole number'); process.exit(1); }
if (!fs.existsSync(IMAGE)) { console.error('image not found: ' + IMAGE); process.exit(1); }
if (BODY.length > 230) { console.error(`body is ${BODY.length} chars — a Daily Number is deadpan and short (≤230)`); process.exit(1); }

const W = 1080, H = 1350;
const HEADER = `🚨 THE DAILY NUMBER #${N}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uri = (f) => `data:image/${/png$/i.test(f) ? 'png' : 'jpeg'};base64,${fs.readFileSync(f).toString('base64')}`;
const av = uri(AVATAR);
const BADGE = `<svg viewBox="0 0 22 22" width="40" height="40"><path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>`;
const BASE_CSS = `*{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;background:#fff;overflow:hidden}
  body{font-family:-apple-system,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}`;
const IDENT = (extra = '') => `<div class="top"><img class="av" src="${av}">
  <div class="who"><div class="nm">Shithousery HQ ${BADGE}</div><div class="hd">@shithouseryhq</div></div>${extra}</div>`;

const size = BODY.length > 190 ? 48 : BODY.length > 130 ? 54 : 60;
const cardHtml = `<!DOCTYPE html><meta charset="utf-8"><style>${BASE_CSS}
  body{display:flex;align-items:center;padding:0 64px}
  .top{display:flex;align-items:center;gap:26px;margin-bottom:44px}
  .av{width:128px;height:128px;border-radius:50%;object-fit:cover}
  .nm{display:flex;align-items:center;gap:10px;font-size:48px;font-weight:800;color:#0f1419}
  .hd{font-size:40px;color:#536471}
  .h{font-size:${size + 4}px;font-weight:800;line-height:1.2;color:#0f1419;letter-spacing:-.01em;margin-bottom:30px}
  .tx{font-size:${size}px;line-height:1.28;color:#0f1419;white-space:pre-wrap;letter-spacing:-.01em}
</style><div>${IDENT()}<div class="h">${esc(HEADER)}</div><div class="tx">${esc(BODY)}</div></div>`;

const ctaHtml = `<!DOCTYPE html><meta charset="utf-8"><style>${BASE_CSS}
  body{display:flex;align-items:center;padding:0 64px}
  .top{display:flex;align-items:center;gap:26px;margin-bottom:56px;width:100%}
  .who{flex:1}
  .av{width:128px;height:128px;border-radius:50%;object-fit:cover}
  .nm{display:flex;align-items:center;gap:10px;font-size:48px;font-weight:800;color:#0f1419}
  .hd{font-size:40px;color:#536471}
  .fb{background:#0f1419;color:#fff;font-size:40px;font-weight:800;padding:18px 44px;border-radius:999px}
  .h{font-size:84px;font-weight:800;line-height:1.1;color:#0f1419;letter-spacing:-.02em}
  .s{margin-top:36px;font-size:44px;line-height:1.3;color:#536471}
</style><div style="width:100%">${IDENT('<div class="fb">Follow</div>')}<div class="h">Following us takes one second.</div><div class="s">A new number, every day.</div></div>`;

const proofHtml = `<!DOCTYPE html><meta charset="utf-8"><style>${BASE_CSS}
  body{background:${FIT === 'contain' ? '#fff' : '#000'};position:relative}
  img.p{position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:${FIT}}
  .cr{position:absolute;left:24px;bottom:16px;font-size:22px;color:rgba(255,255,255,.85);text-shadow:0 1px 3px rgba(0,0,0,.8)}
</style><img class="p" src="${uri(IMAGE)}">${CREDIT ? `<div class="cr">${esc(CREDIT)}</div>` : ''}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const shot = async (html, file, checkOverflow) => {
  await page.setContent(html);
  await page.waitForLoadState('load');
  if (checkOverflow) {
    const h = await page.evaluate(() => document.body.firstElementChild.getBoundingClientRect().height);
    if (h > H - 60) { console.error(`${file}: overflows (${Math.round(h)}px) — shorten the text`); await browser.close(); process.exit(1); }
  }
  await page.screenshot({ path: file });
  console.log(`✅ ${file}`);
};
fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
await shot(cardHtml, `${OUT}_1_card.png`, true);
await shot(proofHtml, `${OUT}_2_proof.png`, false);
await shot(ctaHtml, `${OUT}_3_cta.png`, true);
await browser.close();
fs.writeFileSync(`${OUT}_text.txt`, `${HEADER}\n\n${BODY}\n`);
console.log(`✅ ${OUT}_text.txt`);
