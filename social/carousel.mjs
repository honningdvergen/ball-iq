// Tweet carousel builder — Shithousery HQ format.
//
//   node social/carousel.mjs --in slides.json --out /tmp/carousel
//
// Format studied on Alex's own IG carousel (DdhJTrmjoaK, 2026-09-20), after my
// first attempt was rejected as "terrible": real avatar, real verified badge,
// the tweet's IMAGE (which is usually the joke), quote-tweets kept whole, tweet
// filling a 4:5 pure-white frame. No card border, no shadow, no watermark.
//
// ⚠️ 2026-04-30: Instagram stopped recommending "aggregator" accounts, and says a
// screenshot of someone else's post is NOT original even with the username
// visible — but a meme IS when it adds "a perspective, joke, or context that
// wasn't there before". Meta applies the same test on Facebook. So every slide
// now leads with OUR line (`take`) and the tweet sits under it as the evidence.
// The take is the content; the tweet is the receipt.
//
// HARD RULES (enforced below, not left to care):
//   · every slide needs a `take` — our own joke/context, ≤ 90 chars. No take, no slide.
//     (pass --allow-bare to build the old take-less format, e.g. for Threads)
//   · every slide needs `url` — the real post it was copied from. No url, no slide.
//     I once padded a carousel with invented "tweets" from Alex's own account.
//   · every slide needs a real `avatar` file. Initial-letter circles are banned.
//   · text is verbatim from the post. Never paraphrase, never "tidy".

import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const arg = n => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const IN = arg('in'), OUT = arg('out') || '/tmp/carousel';
if (!IN) { console.error('usage: carousel.mjs --in slides.json [--out dir]'); process.exit(1); }

const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
// Alex 2026-09-21: no carousel creator prints commentary ON the slides — slides stay
// clean tweets. `take` is still REQUIRED, but it is our CAPTION material (IG caption,
// Facebook/Threads single-slide posts, quote-tweets), written to takes.txt, not drawn.
// --takes-on-slide draws it (kept for A/B tests). --allow-bare skips the requirement.
const ALLOW_BARE = process.argv.includes('--allow-bare');
const DRAW_TAKES = process.argv.includes('--takes-on-slide');

// ---- refuse to build anything that isn't a real, sourced tweet ----
const problems = [];
data.slides.forEach((s, i) => {
  const n = `slide ${i + 1} (@${s.handle || '?'})`;
  if (!/^https:\/\/(x|twitter)\.com\/[^/]+\/status\/\d+/.test(s.url || '')) problems.push(`${n}: no source url — not a real tweet`);
  if (!s.avatar || !fs.existsSync(s.avatar)) problems.push(`${n}: no real avatar file`);
  if (!s.text && !(s.images || []).length) problems.push(`${n}: empty`);
  if (!ALLOW_BARE && !(s.take || '').trim()) problems.push(`${n}: no take — a bare tweet is a repost, not a post`);
  if ((s.take || '').length > 100) problems.push(`${n}: take is ${s.take.length} chars (max 100) — it is a punchline, not a paragraph`);
  (s.images || []).forEach(p => { if (!fs.existsSync(p)) problems.push(`${n}: missing image ${p}`); });
  if (s.quote && (!s.quote.avatar || !fs.existsSync(s.quote.avatar))) problems.push(`${n}: quote has no real avatar`);
});
if (problems.length) { console.error('REFUSING TO BUILD:\n  ' + problems.join('\n  ')); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true });
const W = 1080, H = 1350;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// setContent() runs on about:blank, which silently blocks file:// images — the
// first render shipped an empty avatar and an empty picture. Inline everything.
const uri = p => { const b = fs.readFileSync(p); const ext = path.extname(p).slice(1).toLowerCase();
  return `data:image/${ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg'};base64,${b.toString('base64')}`; };
const BADGE = `<svg viewBox="0 0 22 22" width="38" height="38" style="flex:0 0 auto"><path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>`;

const shell = body => `<!DOCTYPE html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;background:#fff;overflow:hidden}
  body{font-family:-apple-system,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif;
       -webkit-font-smoothing:antialiased;display:flex;align-items:center;padding:0 46px}
  .tw{width:100%}
  .take{font-size:60px;line-height:1.1;font-weight:800;letter-spacing:-.025em;color:#0f1419;margin-bottom:44px}
  .take.sm{font-size:50px}
  .has-take .av{width:92px;height:92px;flex:0 0 92px}
  .has-take .nm{font-size:38px} .has-take .hd{font-size:32px} .has-take .top{margin-bottom:24px;gap:18px}
  .top{display:flex;align-items:center;gap:24px;margin-bottom:34px}
  .av{width:124px;height:124px;border-radius:50%;object-fit:cover;flex:0 0 124px}
  .nm{display:flex;align-items:center;gap:10px;font-size:46px;font-weight:800;color:#0f1419;line-height:1.15}
  .hd{font-size:40px;color:#536471;font-weight:400;line-height:1.2}
  .tx{color:#0f1419;font-weight:400;line-height:1.3;white-space:pre-wrap;margin-bottom:30px}
  .imgs{display:grid;gap:6px;border-radius:32px;overflow:hidden}
  .imgs img{width:100%;height:100%;object-fit:cover;display:block}
  /* a SINGLE image is never cropped — the punchline is often at its edge
     (LiveScore's "21%" sat on the bottom and got cut off). Scale to fit instead. */
  .one{display:flex;justify-content:center}
  .one img{width:auto;height:auto;max-width:100%;border-radius:32px;display:block}
  .q{margin-top:26px;border:2px solid #cfd9de;border-radius:30px;padding:26px 30px}
  .q .qt{display:flex;align-items:center;gap:14px;font-size:36px;margin-bottom:10px}
  .q .qa{width:52px;height:52px;border-radius:50%;object-fit:cover}
  .q b{font-weight:800;color:#0f1419} .q span{color:#536471}
  .q .qx{font-size:37px;line-height:1.3;color:#0f1419;white-space:pre-wrap}
</style>${body}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const files = [];

for (const [i, s] of data.slides.entries()) {
  const imgs = s.images || [];
  const len = (s.text || '').length;
  // text is big when the tweet is text-only, like a real phone screenshot
  const take = DRAW_TAKES ? (s.take || '').trim() : '';
  let fs_ = imgs.length ? (len > 160 ? 40 : 46) : (len > 240 ? 46 : len > 120 ? 54 : 62);
  // Quote-tweets: the quoting text sits only a notch above the quoted text, like the real app
  // (Alex 09-23: ours had the outer text "way bigger" than the quoted one).
  if (s.quote) fs_ = len > 120 ? 40 : 44;
  let imgMax = s.imgMax ? s.imgMax : s.quote ? 560 : (len > 120 ? 700 : 820);
  if (take) { fs_ = Math.round(fs_ * 0.84); if (!s.imgMax) imgMax -= (take.length > 45 ? 250 : 190); }
  const cols = imgs.length >= 2 ? 2 : 1;
  const body = `<div class="tw${take ? ' has-take' : ''}">
    ${take ? `<div class="take${take.length > 55 ? ' sm' : ''}">${esc(take)}</div>` : ''}
    <div class="top">
      <img class="av" src="${uri(s.avatar)}">
      <div><div class="nm">${esc(s.name)}${s.verified ? BADGE : ''}</div><div class="hd">@${esc(s.handle)}</div></div>
    </div>
    ${s.text ? `<div class="tx" style="font-size:${fs_}px">${esc(s.text)}</div>` : ''}
    ${imgs.length === 1 ? `<div class="one"><img src="${uri(imgs[0])}" style="max-height:${imgMax}px"></div>` : imgs.length ? `<div class="imgs" style="grid-template-columns:repeat(${cols},1fr);max-height:${imgMax}px">
        ${imgs.map(p => `<img src="${uri(p)}" style="max-height:${imgMax}px">`).join('')}</div>` : ''}
    ${s.quote ? `<div class="q"><div class="qt"><img class="qa" src="${uri(s.quote.avatar)}">
        <b>${esc(s.quote.name)}</b><span>@${esc(s.quote.handle)}</span></div>
        <div class="qx">${esc(s.quote.text)}</div>
        ${(() => {
          // Quoted photos: portrait-height when the quoting tweet has no photos of its own (the
          // 300px strip cut Lisandro's face off, 09-23); framed above centre so faces survive.
          const q = s.quote.images || []; if (!q.length) return '';
          const h = imgs.length ? (q.length >= 2 ? 300 : 420) : (q.length >= 2 ? 560 : 640);
          return `<div class="imgs" style="margin-top:18px;grid-template-columns:repeat(${q.length >= 2 ? 2 : 1},1fr);height:${h}px">
          ${q.map(p => `<img src="${uri(p)}" style="height:${h}px;object-position:center 30%">`).join('')}</div>`;
        })()}</div>` : ''}
  </div>`;
  await page.setContent(shell(body));
  await page.waitForLoadState('networkidle');
  // every image must have actually decoded — an empty box is not a slide
  const dead = await page.evaluate(async () => { const im=[...document.images]; await Promise.all(im.map(i=>i.decode().catch(()=>{})));
    return im.filter(i => !i.naturalWidth).length; });
  if (dead) { console.error(`slide ${i + 1}: ${dead} image(s) failed to render`); process.exit(1); }
  // A single image FILLS the slide width (itsfootybants' look). Small sources used to sit
  // as a little square in the middle — Alex, 2026-09-21: "a bit too small". Scale up to full
  // width; only if that would overflow the slide, fit to the height that is left. Never crop.
  await page.evaluate(H => { const im = document.querySelector('.one img'); if (!im) return;
    const tw = document.querySelector('.tw');
    im.style.maxHeight = 'none'; im.style.width = '100%'; im.style.height = 'auto';
    const over = tw.getBoundingClientRect().height - (H - 70);
    if (over > 0) { const h = im.getBoundingClientRect().height - over; im.style.width = 'auto'; im.style.height = Math.max(200, h) + 'px'; }
  }, H);
  // fail loudly on overflow rather than ship a clipped slide
  const h = await page.evaluate(() => document.querySelector('.tw').getBoundingClientRect().height);
  if (h > H - 40) { console.error(`slide ${i + 1} overflows (${Math.round(h)}px) — trim or split`); process.exit(1); }
  const f = path.join(OUT, String(i + 1).padStart(2, '0') + '.png');
  await page.screenshot({ path: f });
  files.push(f);
}

if (data.cta && data.cta.image) {
  // Alex's own CTA (09-20 carousel, 10 slides): a real match PHOTO whose action points at
  // the viewer, with an Instagram-story-style sticker ("Follow us (it's free) ;)") — reads
  // as a post, not an ad. The designed "Follow for football every single day" card is the
  // ad-looking version; he asked for stronger on 09-22. Black letterbox like a phone screenshot.
  const c = data.cta;
  await page.setContent(shell(`<div style="position:absolute;inset:0;background:#000;display:flex;align-items:center;justify-content:center">
    <img src="${uri(c.image)}" style="width:100%;height:auto;max-height:100%;object-fit:contain">
    <div style="position:absolute;left:50%;top:${c.stickerY || 50}%;transform:translate(-50%,-50%) rotate(${c.tilt || -2}deg);background:#fff;color:#000;
      font-size:${c.stickerSize || 54}px;font-weight:800;padding:18px 34px;border-radius:22px;white-space:nowrap;box-shadow:0 6px 24px rgba(0,0,0,.35)">${esc(c.sticker || 'Follow us (it\'s free) ;)')}</div></div>`));
  const f = path.join(OUT, String(data.slides.length + 1).padStart(2, '0') + '.png');
  await page.screenshot({ path: f }); files.push(f);
} else if (data.cta) {
  const c = data.cta;
  await page.setContent(shell(`<div class="tw" style="text-align:center">
    ${c.avatar && fs.existsSync(c.avatar) ? `<img src="${uri(c.avatar)}" style="width:220px;height:220px;border-radius:50%;margin-bottom:44px">` : ''}
    <div style="font-size:88px;line-height:1.06;font-weight:800;color:#0f1419;letter-spacing:-.03em;white-space:pre-line">${esc(c.big || 'Follow for more')}</div>
    <div style="margin-top:34px;font-size:46px;color:#1d9bf0;font-weight:600">${esc(c.sub || '@shithouseryhq')}</div></div>`));
  const f = path.join(OUT, String(data.slides.length + 1).padStart(2, '0') + '.png');
  await page.screenshot({ path: f }); files.push(f);
}

fs.writeFileSync(path.join(OUT, 'takes.txt'), data.slides.map((s, i) => `${String(i + 1).padStart(2, '0')}  ${s.take || ''}  — ${s.url}`).join('\n') + '\n');
await browser.close();
console.log(`✅ ${files.length} slides → ${OUT}`);
