// frame-store-screens.mjs — marketing App Store screenshots.
//
//   node scripts/frame-store-screens.mjs
//
// Takes screenshots/raw/*.png (bare 1320x2868 app renders) and composites each
// into a marketing frame at exactly 1320x2868 — the 6.9" store size:
//
//     Ball IQ wordmark
//     COLOURED EYEBROW
//     Big headline with one highlighted phrase
//     Quiet subline
//     iPhone, bleeding off the bottom edge
//
// This layout matches the set already live on the App Store. Alex, 2026-08-07:
// "we had those cool explainers over the screenshot, that works as a nice
// marketing tool for us too, makes people more tempted to download." A bare
// device frame shows the app; this one SELLS it — the headline does the work
// while the phone proves it is real.
//
// ⚠️ NO COUNTS IN THE COPY. The live set says "4,000+ questions across 10 game
// modes". Both numbers are now wrong (the bank is far past 4,000, and pulling
// Mystery Player leaves nine modes), and a question count in store copy is the
// binding no-counts rule anyway — see scripts/audit-no-question-count.mjs.
// Screenshots are the worst place to put a number: they cannot be edited
// without a new upload, so they rot in public. Sell breadth instead
// ("Real Madrid to Hajduk Split") — it never goes stale.
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { chromium } from '@playwright/test';

const RAW = resolve('screenshots/raw');
const OUT = resolve('screenshots/framed');
mkdirSync(OUT, { recursive: true });

// ⚠️ 1284x2778, NOT 1320x2868 — VERIFIED AGAINST THE LIVE LISTING.
// 1320x2868 is the 6.9" size, and this app HAS NO 6.9" SLOT: App Store Connect
// Media Manager offers 6.5" / 6.3" / 6.1" / 5.5" / 4.7" / 4" / 3.5", and the
// five live screenshots are all named *-1284x2778.png. Uploading 6.9" assets
// would have been rejected at the picker. Read the size off the listing before
// rendering — do not assume the current largest size Apple documents.
const W = 1284, H = 2778;
const S = W / 1320;              // everything below was authored at 1320 wide
// ⚠️ GEOMETRY IS EXACT, NOT APPROXIMATE — the tab bar was getting sliced.
// The phone used to be taller than the canvas and object-fit:cover ate the
// bottom of the app, which meant the nav bar (the thing that shows the app has
// four sections) was always half-cut. Now the phone fits entirely, and the
// capture viewport is DERIVED from this geometry so the app image lands at the
// image area's exact aspect and nothing is cropped at either edge.
//   phone 899x1845 · pad 12 · status band 106 · image area 875x1739
//   -> capture at 440 x 874 (see CAPTURE_H in shoot-store-screens.mjs)
const PHONE_W = Math.round(924 * S), PAD = 12, BAND = Math.round(109 * S);
const TOP_BLOCK = Math.round(900 * S), BOTTOM = Math.round(60 * S);
const PHONE_H = H - TOP_BLOCK - BOTTOM;
// The capture viewport must match the image area's aspect exactly or the framer
// crops, and it crops the bottom — where the tab bar lives.
const IMG_W = PHONE_W - PAD * 2, IMG_H = PHONE_H - BAND;
console.log(`  frame ${W}x${H} · phone ${PHONE_W}x${PHONE_H} · image ${IMG_W}x${IMG_H}`
  + `  ->  capture 440 x ${Math.round(440 * IMG_H / IMG_W)}`);
const GREEN = '#58CC02', AMBER = '#FFC107', ORANGE = '#FF8A3D';

// One entry per raw frame. `hi` is the phrase pulled out of the headline in the
// accent colour — keep it SHORT so the line still reads as a sentence.
const COPY = {
  '01-home': {
    eyebrow: 'THE ULTIMATE FOOTBALL QUIZ', accent: ORANGE,
    head: ['How good is your', '{Ball IQ}, really?'],
    sub: 'Daily puzzles, club quizzes and live 1v1.',
  },
  '02-footle': {
    eyebrow: 'DAILY · FOOTLE', accent: GREEN,
    head: ['A new {Footle}', 'every day'],
    sub: 'Guess the footballer in six tries.',
  },
  '03-club-picker': {
    eyebrow: 'CLUB QUIZZES', accent: GREEN,
    head: ['Your club,', '{your quiz}'],
    sub: 'From Real Madrid to Hajduk Split.',
  },
  '04-transfer-trail': {
    eyebrow: 'DAILY · TRANSFER TRAIL', accent: GREEN,
    head: ['Name him from', '{his career}'],
    sub: 'One club at a time. Fewer clubs, more points.',
  },
  '07-mystery-player': {
    eyebrow: 'DAILY · MYSTERY PLAYER', accent: AMBER,
    head: ['Every guess gets you', '{closer}'],
    sub: 'Rank 1 is the player. Nothing else is.',
  },
  '05-quiz-explanation': {
    eyebrow: 'EVERY ANSWER EXPLAINED', accent: AMBER,
    head: ['Learn something,', 'not just {score}'],
    sub: 'The story behind the answer, every time.',
  },
  '06-profile': {
    eyebrow: 'YOUR PROFILE', accent: AMBER,
    head: ["What's your {Ball IQ}?"],
    sub: 'Every answer builds your rating.',
  },
};

const hl = (line, accent) =>
  line.replace(/\{([^}]+)\}/g, `<span style="color:${accent}">$1</span>`);

const page = (dataUri, c) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{
    background:linear-gradient(178deg,#0B0B0B 0%,#080808 60%,#050505 100%);
    font-family:-apple-system,'Inter','Helvetica Neue',sans-serif;
    display:flex;flex-direction:column;align-items:center;
  }
  /* The copy block owns the whole top area and centres inside it, so the void
     left over by a one-line headline is split above and below instead of
     dumping ~300px of dead space between the subline and the phone. */
  .top{
    flex:0 0 ${TOP_BLOCK}px;height:${TOP_BLOCK}px;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding-bottom:40px;
  }
  .mark{display:flex;align-items:center;gap:18px}
  .mark img{width:64px;height:64px;border-radius:16px}
  .mark span{font-size:52px;font-weight:800;color:#fff;letter-spacing:-.5px}
  .mark b{color:${AMBER};font-weight:800}
  .eyebrow{
    margin-top:78px;font-size:31px;font-weight:800;letter-spacing:.16em;
    color:${c.accent};text-transform:uppercase;text-align:center;
  }
  h1{
    margin-top:26px;font-size:86px;line-height:1.06;font-weight:800;
    color:#fff;letter-spacing:-2px;text-align:center;text-wrap:balance;
  }
  .sub{margin-top:30px;font-size:38px;color:#9AA0A6;text-align:center;max-width:${W-180}px}
  /* The phone bleeds off the bottom: it is a window into the app, not an object
     sitting on a shelf. Matches the live set. */
  .phone{
    position:relative;margin-top:auto;margin-bottom:${BOTTOM}px;flex:0 0 auto;
    width:${PHONE_W}px;height:${PHONE_H}px;
    border-radius:${Math.round(PHONE_W*0.098)}px;
    padding:${PAD}px;
    background:linear-gradient(150deg,#5a5f5c 0%,#15181a 20%,#0d0f10 62%,#42423f 100%);
    box-shadow:0 34px 90px rgba(0,0,0,.75);
  }
  .screen{
    width:100%;height:100%;overflow:hidden;display:flex;flex-direction:column;
    border-radius:${Math.round(PHONE_W*0.088)}px;background:#0A0A0A;
  }
  /* #0A0A0A, matching the app body — a pure-black bar drew a visible seam. */
  /* ⚠️ DRAWN, NOT TYPED. The first version spelled the status icons with
     characters ("▮▮▮ ᯤ ▰"), which sat at the wrong baseline and read as
     obviously fake. Real bars, arc and battery, on iOS's own metrics. */
  .statusbar{
    position:relative;flex:0 0 auto;height:${BAND}px;background:#0A0A0A;
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 46px 0;
    color:#fff;font-size:40px;font-weight:600;letter-spacing:-.3px;
  }
  .statusbar .t{font-variant-numeric:tabular-nums;padding-left:10px}
  .statusbar .ic{display:flex;align-items:center;gap:14px;padding-right:6px}
  .bars{display:flex;align-items:flex-end;gap:4px;height:26px}
  .bars i{width:7px;background:#fff;border-radius:2px}
  .bars i:nth-child(1){height:9px}.bars i:nth-child(2){height:14px}
  .bars i:nth-child(3){height:20px}.bars i:nth-child(4){height:26px}
  .batt{width:48px;height:25px;border:3px solid rgba(255,255,255,.55);border-radius:8px;padding:2.5px;position:relative}
  .batt i{display:block;height:100%;width:82%;background:#fff;border-radius:4px}
  .batt:after{content:'';position:absolute;right:-7px;top:8px;width:4px;height:9px;background:rgba(255,255,255,.55);border-radius:0 2px 2px 0}
  /* ⚠️ THE ISLAND NEEDS AN EDGE TO EXIST AT ALL.
     It was drawn as pure #000 on a #0A0A0A status bar — a 4/255 difference, so
     it rendered as "no island". A real device reads because the cutout catches
     a rim of light and the front camera sits just inside it. Both are drawn
     here; without them a dark app makes the island invisible. */
  .island{
    position:absolute;top:${Math.round(PHONE_W*0.020)}px;left:50%;transform:translateX(-50%);
    width:${Math.round(PHONE_W*0.31)}px;height:${Math.round(PHONE_W*0.084)}px;
    background:#000;border-radius:999px;
    box-shadow:0 0 0 1.5px rgba(255,255,255,.10), inset 0 3px 8px rgba(0,0,0,.9);
  }
  .island:after{
    content:'';position:absolute;top:50%;right:${Math.round(PHONE_W*0.020)}px;
    transform:translateY(-50%);
    width:${Math.round(PHONE_W*0.036)}px;height:${Math.round(PHONE_W*0.036)}px;
    border-radius:50%;
    background:radial-gradient(circle at 35% 30%, #23262b 0%, #0d0f12 60%, #050506 100%);
    box-shadow:0 0 0 1px rgba(255,255,255,.06);
  }
  .screen img{display:block;width:100%;flex:1 1 auto;min-height:0;object-fit:cover;object-position:top center}
</style></head><body>
  <div class="top">
    <div class="mark">${c.logo ? `<img src="${c.logo}">` : ''}<span>Ball <b>IQ</b></span></div>
    <div class="eyebrow">${c.eyebrow}</div>
    <h1>${c.head.map((l) => hl(l, c.accent)).join('<br>')}</h1>
    <div class="sub">${c.sub}</div>
  </div>
  <div class="phone"><div class="screen">
    <div class="statusbar">
      <span class="t">9:41</span><span class="island"></span>
      <span class="ic">
        <span class="bars"><i></i><i></i><i></i><i></i></span>
        <svg width="34" height="25" viewBox="0 0 34 25" fill="none"><path d="M17 21.5l3.6-4.3a5.6 5.6 0 00-7.2 0L17 21.5z" fill="#fff"/><path d="M9.2 12.6a12 12 0 0115.6 0" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M4.4 7.2a19 19 0 0125.2 0" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>
        <span class="batt"><i></i></span>
      </span>
    </div>
    <img src="${dataUri}">
  </div></div>
</body></html>`;

// Brand mark, if the app icon is on disk — inlined so the CSP-free file:// page
// never needs the network.
const ICON = ['public/marketing/ball.png', 'public/icon-192.png']
  .map((p) => resolve(p)).find((p) => existsSync(p));
const logo = ICON ? 'data:image/png;base64,' + readFileSync(ICON).toString('base64') : null;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
let n = 0;
for (const [name, copy] of Object.entries(COPY)) {
  const src = resolve(RAW, `${name}.png`);
  if (!existsSync(src)) { console.log(`  – skip ${name} (no raw frame)`); continue; }
  const uri = 'data:image/png;base64,' + readFileSync(src).toString('base64');
  const html = resolve(OUT, `.tmp.html`);
  writeFileSync(html, page(uri, { ...copy, logo }), 'utf8');
  await p.goto('file://' + html, { waitUntil: 'load' });
  await p.waitForTimeout(320);
  await p.screenshot({ path: resolve(OUT, `${name}.png`) });
  console.log(`  framed  ${name}  —  "${copy.head.join(' ').replace(/[{}]/g, '')}"`);
  n++;
}
await b.close();
console.log(`\n${n} marketing frames -> ${OUT}  (${W}x${H})`);
