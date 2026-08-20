// make-feature-graphic.mjs — the Google Play feature graphic (1024x500).
//
//   node scripts/make-feature-graphic.mjs
//
// Renders screenshots/android/feature-graphic-1024x500.png in the same design
// language as frame-store-screens.mjs (same background, same type, same
// accent trio) so the listing reads as one designed set, not a banner bolted
// onto screenshots.
//
// Composition: copy block left, Footle tile-cluster right — the tiles are the
// one visual that says "daily word-game energy" at banner scale, where a
// phone mock would shrink to a sliver. Google shows this graphic small and
// sometimes darkened behind UI, so: 48px safe margins, no fine print, and
// the headline carries everything.
//
// ⚠️ NO COUNTS IN THE COPY (binding rule — audit-no-question-count.mjs).
// Sell the ritual and the breadth, never a number that rots in public.
import { mkdirSync } from 'fs';
import { resolve } from 'path';
import { chromium } from '@playwright/test';

const W = 1024, H = 500;
const GREEN = '#58CC02', AMBER = '#FFC107', ORANGE = '#FF8A3D';
const OUT = resolve('screenshots/android');
mkdirSync(OUT, { recursive: true });

const tile = (ch, bg, fg = '#0A0A0A') => `
  <div style="width:86px;height:86px;border-radius:12px;background:${bg};
    display:flex;align-items:center;justify-content:center;
    font-size:52px;font-weight:800;color:${fg};
    box-shadow:0 10px 26px rgba(0,0,0,.45)">${ch}</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{
    background:linear-gradient(178deg,#0B0B0B 0%,#080808 60%,#050505 100%);
    font-family:-apple-system,'Inter','Helvetica Neue',sans-serif;
    position:relative;
  }
  .glow{position:absolute;right:-120px;top:-140px;width:560px;height:560px;
    background:radial-gradient(circle,rgba(88,204,2,.16) 0%,rgba(88,204,2,0) 62%);}
  .glow2{position:absolute;left:-160px;bottom:-220px;width:520px;height:520px;
    background:radial-gradient(circle,rgba(255,193,7,.10) 0%,rgba(255,193,7,0) 60%);}
  .wrap{position:absolute;inset:0;display:flex;align-items:center;
    padding:48px 56px;gap:44px}
  .copy{flex:1;min-width:0}
  .mark{font-size:34px;font-weight:800;color:#fff;letter-spacing:-.5px}
  .mark b{color:${AMBER}}
  .eyebrow{margin-top:22px;font-size:17px;font-weight:800;letter-spacing:.16em;
    color:${ORANGE}}
  .head{margin-top:12px;font-size:56px;line-height:1.05;font-weight:800;
    color:#fff;letter-spacing:-1.5px}
  .head span{color:${GREEN}}
  .sub{margin-top:16px;font-size:22px;color:#9AA0A6;font-weight:600}
  .tiles{flex:0 0 auto;display:flex;flex-direction:column;gap:14px;
    transform:rotate(-4deg)}
  .row{display:flex;gap:14px;justify-content:center}
</style></head><body>
  <div class="glow"></div><div class="glow2"></div>
  <div class="wrap">
    <div class="copy">
      <div class="mark">Ball <b>IQ</b></div>
      <div class="eyebrow">THE ULTIMATE FOOTBALL QUIZ</div>
      <div class="head">How good is your<br><span>Ball IQ</span>, really?</div>
      <div class="sub">Daily puzzles &middot; Club quizzes &middot; Live 1v1</div>
    </div>
    <div class="tiles">
      <div class="row">${tile('B', GREEN)}${tile('A', GREEN)}${tile('L', GREEN)}${tile('L', GREEN)}</div>
      <div class="row">${tile('I', AMBER)}${tile('Q', AMBER)}${tile('?', '#1F2430', '#9AA0A6')}</div>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
const out = resolve(OUT, 'feature-graphic-1024x500.png');
await page.screenshot({ path: out, type: 'png' });
await browser.close();
console.log('wrote', out);
