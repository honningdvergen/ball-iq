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

const W = 1320, H = 2868;
const PHONE_W = Math.round(W * 0.70);
const PHONE_H = Math.round(PHONE_W * 2.16);       // taller than the canvas allows: it bleeds off
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
  .mark{display:flex;align-items:center;gap:18px;margin-top:96px}
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
    position:relative;margin-top:86px;flex:0 0 auto;
    width:${PHONE_W}px;height:${PHONE_H}px;
    border-radius:${Math.round(PHONE_W*0.115)}px;
    padding:${Math.round(PHONE_W*0.013)}px;
    background:linear-gradient(150deg,#5a5f5c 0%,#15181a 20%,#0d0f10 62%,#42423f 100%);
    box-shadow:0 34px 90px rgba(0,0,0,.75);
  }
  .screen{
    width:100%;height:100%;overflow:hidden;display:flex;flex-direction:column;
    border-radius:${Math.round(PHONE_W*0.104)}px;background:#0A0A0A;
  }
  /* #0A0A0A, matching the app body — a pure-black bar drew a visible seam. */
  .statusbar{
    position:relative;flex:0 0 auto;height:${Math.round(PHONE_W*0.118)}px;background:#0A0A0A;
    display:flex;align-items:center;justify-content:space-between;
    padding:0 ${Math.round(PHONE_W*0.072)}px ${Math.round(PHONE_W*0.022)}px;
    color:#fff;font-size:${Math.round(PHONE_W*0.044)}px;font-weight:600;
  }
  .statusbar .ic{font-size:${Math.round(PHONE_W*0.036)}px;letter-spacing:2px}
  .island{
    position:absolute;top:${Math.round(PHONE_W*0.020)}px;left:50%;transform:translateX(-50%);
    width:${Math.round(PHONE_W*0.31)}px;height:${Math.round(PHONE_W*0.084)}px;
    background:#000;border-radius:999px;
  }
  .screen img{display:block;width:100%;flex:1 1 auto;min-height:0;object-fit:cover;object-position:top center}
</style></head><body>
  <div class="mark">${c.logo ? `<img src="${c.logo}">` : ''}<span>Ball <b>IQ</b></span></div>
  <div class="eyebrow">${c.eyebrow}</div>
  <h1>${c.head.map((l) => hl(l, c.accent)).join('<br>')}</h1>
  <div class="sub">${c.sub}</div>
  <div class="phone"><div class="screen">
    <div class="statusbar"><span>9:41</span><span class="island"></span><span class="ic">▮▮▮ ᯤ ▰</span></div>
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
