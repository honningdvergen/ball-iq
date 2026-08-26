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

// PLATFORM=android → Google Play assets instead of App Store ones.
//   PLATFORM=android node scripts/frame-store-screens.mjs
// The RAW captures are shared: it is the same app on the same screens, only the
// frame and canvas differ, so no re-shoot is needed for the second store.
const IS_ANDROID = (process.env.PLATFORM || 'ios').toLowerCase() === 'android';

const RAW = resolve('screenshots/raw');
const OUT = resolve(IS_ANDROID ? 'screenshots/android' : 'screenshots/framed');
mkdirSync(OUT, { recursive: true });

// ⚠️ 1284x2778, NOT 1320x2868 — VERIFIED AGAINST THE LIVE LISTING.
// 1320x2868 is the 6.9" size, and this app HAS NO 6.9" SLOT: App Store Connect
// Media Manager offers 6.5" / 6.3" / 6.1" / 5.5" / 4.7" / 4" / 3.5", and the
// five live screenshots are all named *-1284x2778.png. Uploading 6.9" assets
// would have been rejected at the picker. Read the size off the listing before
// rendering — do not assume the current largest size Apple documents.
// ⚠️ 1284x2778, NOT 1320x2868 — VERIFIED AGAINST THE LIVE LISTING (see above).
//
// ⚠️ PLAY CANNOT REUSE THE APPLE CANVAS. 1284x2778 is a 0.462 ratio; Google Play
// wants phone screenshots at 16:9 or 9:16, and 9:16 is 0.5625. 1080x1920 is exactly
// 9:16 and sits inside Play's 320–3840px bounds, so the Android set is rendered on
// its own canvas rather than scaled from Apple's.
const W = IS_ANDROID ? 1080 : 1284;
const H = IS_ANDROID ? 1920 : 2778;
// Type was authored against the 1284-wide Apple canvas; F rescales it for Android.
const F = W / 1284;
const f = (n) => Math.round(n * F);
const S = 1284 / 1320;           // everything below was authored at 1320 wide

// ⚠️ GEOMETRY IS EXACT, NOT APPROXIMATE — the tab bar was getting sliced.
// The phone used to be taller than the canvas and object-fit:cover ate the
// bottom of the app, which meant the nav bar (the thing that shows the app has
// four sections) was always half-cut. Now the phone fits entirely, and the
// capture viewport is DERIVED from this geometry so the app image lands at the
// image area's exact aspect and nothing is cropped at either edge.
//   phone 899x1845 · pad 12 · status band 106 · image area 875x1739
//   -> capture at 440 x 874 (see CAPTURE_H in shoot-store-screens.mjs)
//
// ⚠️ THE ANDROID NUMBERS ARE DERIVED FROM THE SAME RAW CAPTURES, NOT GUESSED.
// The raws are shot once at the Apple image-area aspect (440x874). The Android
// phone is therefore sized so ITS image area lands on that identical aspect —
// otherwise object-fit:cover eats the bottom of the app and slices the tab bar,
// which is the exact bug this block already exists to prevent. Solve for width:
//   IMG_H = IMG_W * 874/440, then PHONE_H = IMG_H + BAND.
const RAW_ASPECT = 874 / 440;
const PAD = IS_ANDROID ? 10 : 12;
// 640, not 560: at 560 the phone only filled 52% of the width and the leftover
// copy-block height showed up as ~200px of dead air between the subline and the
// device. 9:16 is a wider canvas than Apple's, so the phone has to grow to keep
// the composition tight rather than floating in the middle of the frame.
const PHONE_W = IS_ANDROID ? 640 : Math.round(924 * S);
const BAND = IS_ANDROID ? 56 : Math.round(109 * S);
const BOTTOM = IS_ANDROID ? 44 : Math.round(60 * S);
const IMG_W = PHONE_W - PAD * 2;
const IMG_H = IS_ANDROID ? Math.round(IMG_W * RAW_ASPECT) : (H - Math.round(900 * S) - BOTTOM) - BAND;
const PHONE_H = IS_ANDROID ? IMG_H + BAND : H - Math.round(900 * S) - BOTTOM;
const TOP_BLOCK = H - PHONE_H - BOTTOM;
console.log(`  ${IS_ANDROID ? 'PLAY  ' : 'APPLE '}frame ${W}x${H} · phone ${PHONE_W}x${PHONE_H}`
  + ` · image ${IMG_W}x${IMG_H} · copy block ${TOP_BLOCK}`
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
  '08-daily-chips': {
    eyebrow: 'DAILY 7', accent: GREEN,
    head: ['Seven questions,', '{every single day}'],
    sub: 'Instant marking. Green right, red wrong.',
  },
  '06-profile': {
    eyebrow: 'YOUR PROFILE', accent: AMBER,
    head: ["What's your {Ball IQ}?"],
    sub: 'Every answer builds your rating.',
  },
  // Stadiums shipped 2026-08-20, is badged NEW in the app and named in both the
  // description and What's New — and had no screenshot at all.
  '09-stadiums': {
    eyebrow: 'NEW · STADIUMS', accent: GREEN,
    head: ['Name {every ground}', 'in the league'],
    sub: 'Five leagues. No multiple choice.',
  },
  // Not a screenshot of a screen — the card the app hands you, which is why it
  // is `bare`. In a row of nine phone thumbnails it is the one that stops the eye.
  '10-iq-card': {
    eyebrow: 'YOUR BALL IQ CARD', accent: AMBER,
    head: ['One card.', '{Settle it} with your mates.'],
    sub: 'Save it, send it, see who actually knows football.',
    bare: true,
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
    padding-bottom:${f(40)}px;
  }
  .mark{display:flex;align-items:center;gap:${f(18)}px}
  .mark img{width:${f(64)}px;height:${f(64)}px;border-radius:${f(16)}px}
  .mark span{font-size:${f(52)}px;font-weight:800;color:#fff;letter-spacing:-.5px}
  .mark b{color:${AMBER};font-weight:800}
  .eyebrow{
    margin-top:${f(78)}px;font-size:${f(31)}px;font-weight:800;letter-spacing:.16em;
    color:${c.accent};text-transform:uppercase;text-align:center;
  }
  h1{
    margin-top:${f(26)}px;font-size:${f(86)}px;line-height:1.06;font-weight:800;
    color:#fff;letter-spacing:${(-2 * F).toFixed(1)}px;text-align:center;text-wrap:balance;
  }
  .sub{margin-top:${f(30)}px;font-size:${f(38)}px;color:#9AA0A6;text-align:center;max-width:${W-f(180)}px}
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
    padding:${f(14)}px ${f(46)}px 0;
    color:#fff;font-size:${f(40)}px;font-weight:600;letter-spacing:-.3px;
  }
  .statusbar .t{font-variant-numeric:tabular-nums;padding-left:${f(10)}px}
  .statusbar .ic{display:flex;align-items:center;gap:${f(14)}px;padding-right:${f(6)}px}
  .bars{display:flex;align-items:flex-end;gap:${f(4)}px;height:${f(26)}px}
  .bars i{width:${f(7)}px;background:#fff;border-radius:2px}
  .bars i:nth-child(1){height:${f(9)}px}.bars i:nth-child(2){height:${f(14)}px}
  .bars i:nth-child(3){height:${f(20)}px}.bars i:nth-child(4){height:${f(26)}px}
  .batt{width:${f(48)}px;height:${f(25)}px;border:${Math.max(2,f(3))}px solid rgba(255,255,255,.55);border-radius:${f(8)}px;padding:2.5px;position:relative}
  .batt i{display:block;height:100%;width:82%;background:#fff;border-radius:${f(4)}px}
  .batt:after{content:'';position:absolute;right:${-f(7)}px;top:${f(8)}px;width:${f(4)}px;height:${f(9)}px;background:rgba(255,255,255,.55);border-radius:0 2px 2px 0}
  /* ⚠️ THE ISLAND NEEDS AN EDGE TO EXIST AT ALL.
     It was drawn as pure #000 on a #0A0A0A status bar — a 4/255 difference, so
     it rendered as "no island". A real device reads because the cutout catches
     a rim of light and the front camera sits just inside it. Both are drawn
     here; without them a dark app makes the island invisible. */
  /* ⚠️ THE CUTOUT IS THE THING THAT SAYS WHICH PHONE THIS IS. An iPhone Dynamic
     Island on a Play listing reads as a screenshot of the wrong platform — the
     one detail a reviewer and a shopper both clock instantly. Android gets a
     centred punch-hole (Pixel/Samsung convention) instead. Same lighting logic
     as the island: without the rim and the lens gradient it renders as a flat
     dark blob on a dark bar and effectively disappears. */
  .island{
    position:absolute;top:${IS_ANDROID ? Math.round(PHONE_W*0.030) : Math.round(PHONE_W*0.020)}px;
    left:50%;transform:translateX(-50%);
    width:${IS_ANDROID ? Math.round(PHONE_W*0.055) : Math.round(PHONE_W*0.31)}px;
    height:${IS_ANDROID ? Math.round(PHONE_W*0.055) : Math.round(PHONE_W*0.084)}px;
    background:${IS_ANDROID
      ? 'radial-gradient(circle at 35% 30%, #23262b 0%, #0d0f12 60%, #050506 100%)'
      : '#000'};
    border-radius:999px;
    box-shadow:0 0 0 1.5px rgba(255,255,255,.10), inset 0 3px 8px rgba(0,0,0,.9);
  }
  ${IS_ANDROID ? '' : `.island:after{
    content:'';position:absolute;top:50%;right:${Math.round(PHONE_W*0.020)}px;
    transform:translateY(-50%);
    width:${Math.round(PHONE_W*0.036)}px;height:${Math.round(PHONE_W*0.036)}px;
    border-radius:50%;
    background:radial-gradient(circle at 35% 30%, #23262b 0%, #0d0f12 60%, #050506 100%);
    box-shadow:0 0 0 1px rgba(255,255,255,.06);
  }`}
  .screen img{display:block;width:100%;flex:1 1 auto;min-height:0;object-fit:cover;object-position:top center}
  /* A bare panel shows an ARTEFACT rather than a screen — the shareable card
     is not a screenshot of the app, it is the thing the app hands you, so
     wrapping it in a phone frame would misrepresent it as a screen. */
  /* Centred in the space the phone would occupy, and sized to fill it: at 78%
     with flex-start the card floated in the top third with a ~600px void under
     it, which reads as a layout that failed rather than a deliberate crop. */
  .bare{flex:1 1 auto;display:flex;align-items:center;justify-content:center;width:100%;padding-bottom:${f(40)}px}
  .bare img{
    width:${Math.round(IMG_W * 0.96)}px;height:auto;display:block;border-radius:${f(34)}px;
    box-shadow:0 ${f(44)}px ${f(100)}px rgba(0,0,0,.6);
  }
</style></head><body>
  <div class="top">
    <div class="mark">${c.logo ? `<img src="${c.logo}">` : ''}<span>Ball <b>IQ</b></span></div>
    <div class="eyebrow">${c.eyebrow}</div>
    <h1>${c.head.map((l) => hl(l, c.accent)).join('<br>')}</h1>
    <div class="sub">${c.sub}</div>
  </div>
  ${c.bare ? `<div class="bare"><img src="${dataUri}"></div>` : `
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
  </div></div>`}
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
// ONLY=02-footle → frame just that one, to match the same flag on the shooter.
const ONLY = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
for (const [name, copy] of Object.entries(COPY)) {
  if (ONLY.length && !ONLY.includes(name)) continue;
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
