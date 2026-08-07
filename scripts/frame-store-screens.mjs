// frame-store-screens.mjs — wrap the raw captures in an iPhone, zoomed out.
//
//   node scripts/frame-store-screens.mjs
//
// Takes screenshots/raw/*.png (1320x2868 bare app renders) and composites each
// into a device frame on a branded background, output at exactly 1320x2868 —
// the 6.9" App Store size. Alex, 2026-08-07: "made so they look like an iphone
// but zoomed out a bit".
//
// Done in HTML + Playwright rather than an image library because the frame is a
// design object (bezel radius, glow, background ramp) and CSS is the right tool
// for it — and because it keeps the output size exact by construction rather
// than by resampling arithmetic.
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, basename } from 'path';
import { chromium } from '@playwright/test';

const RAW = resolve('screenshots/raw');
const OUT = resolve('screenshots/framed');
mkdirSync(OUT, { recursive: true });

const W = 1320, H = 2868;
// The phone occupies ~76% of the width, which reads as "zoomed out" without
// making the UI illegible in the store's own thumbnail scaling.
const PHONE_W = Math.round(W * 0.76);
const PHONE_H = Math.round(PHONE_W * (H / W));

const page = (dataUri) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{
    background:
      radial-gradient(120% 80% at 50% -10%, rgba(88,204,2,.16) 0%, transparent 60%),
      linear-gradient(178deg, #0C1410 0%, #070A08 45%, #050607 100%);
    display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,'Inter',sans-serif;
  }
  /* The device. A real iPhone silhouette: thin bright edge, dark bezel, deep
     corner radius, and a shadow that grounds it instead of floating it. */
  .phone{
    position:relative;width:${PHONE_W}px;height:${PHONE_H}px;
    border-radius:${Math.round(PHONE_W * 0.115)}px;
    padding:${Math.round(PHONE_W * 0.012)}px;
    background:linear-gradient(150deg,#4a4f4c 0%,#15181a 22%,#0d0f10 60%,#3a403d 100%);
    box-shadow:
      0 ${Math.round(PHONE_W*0.06)}px ${Math.round(PHONE_W*0.13)}px rgba(0,0,0,.62),
      0 0 ${Math.round(PHONE_W*0.20)}px rgba(88,204,2,.10);
  }
  .screen{
    width:100%;height:100%;overflow:hidden;display:flex;flex-direction:column;
    border-radius:${Math.round(PHONE_W * 0.104)}px;
    background:#0A0A0A;
  }
  .screen img{display:block;width:100%;flex:1 1 auto;min-height:0;object-fit:cover;object-position:top center}
  /* ⚠️ A STATUS BAR, NOT A FLOATING ISLAND.
     The first version drew a Dynamic Island straight on top of the app image —
     but a browser render has no status-bar safe area, so the island sat over
     real content and swallowed the greeting. Reserving a real band and pushing
     the app image below it is both truthful (that is what a device shows) and
     removes the overlap. */
  .statusbar{
    /* ⚠️ #0A0A0A, NOT #000. The app body is rgb(10,10,10); a pure-black
       status bar drew a visible horizontal seam across the screen — the
       first framed set had two tones with a line between them. */
    position:relative;flex:0 0 auto;height:${Math.round(PHONE_W*0.115)}px;background:#0A0A0A;
    display:flex;align-items:center;justify-content:space-between;
    padding:0 ${Math.round(PHONE_W*0.075)}px ${Math.round(PHONE_W*0.02)}px;
    color:#fff;font-size:${Math.round(PHONE_W*0.042)}px;font-weight:600;letter-spacing:.2px;
  }
  .statusbar .ic{font-size:${Math.round(PHONE_W*0.034)}px;letter-spacing:2px;opacity:.95}
  .island{
    position:absolute;top:${Math.round(PHONE_W*0.022)}px;left:50%;transform:translateX(-50%);
    width:${Math.round(PHONE_W*0.30)}px;height:${Math.round(PHONE_W*0.082)}px;
    background:#000;border-radius:999px;
  }
</style></head><body>
  <div class="phone"><div class="screen">
    <div class="statusbar"><span class="t">9:41</span><span class="island"></span><span class="ic">▮▮▮ ᯤ ▰</span></div>
    <img src="${dataUri}">
  </div></div>
</body></html>`;

const files = readdirSync(RAW).filter((f) => f.endsWith('.png')).sort();
if (!files.length) { console.error('no raw frames — run scripts/shoot-store-screens.mjs first'); process.exit(1); }

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
for (const f of files) {
  const uri = 'data:image/png;base64,' + readFileSync(resolve(RAW, f)).toString('base64');
  const html = resolve(OUT, `.tmp-${f}.html`);
  writeFileSync(html, page(uri), 'utf8');
  await p.goto('file://' + html, { waitUntil: 'load' });
  await p.waitForTimeout(350);
  await p.screenshot({ path: resolve(OUT, f) });
  console.log(`  framed  ${basename(f)}`);
}
await b.close();
// tidy the scratch html
for (const f of readdirSync(OUT)) if (f.startsWith('.tmp-')) writeFileSync(resolve(OUT, f), '');
console.log(`\nframed -> ${OUT}  (${W}x${H})`);
