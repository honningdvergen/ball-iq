// Ball IQ slides for the second-to-last slot of the social carousels
// (Alex, 14 Oct 2026). Specs from the social session: 1080x1350 PNG (4:5),
// everything important inside the centre 960x1170 and above y=1150 (TikTok
// lays its caption over the bottom), one dry line of ten words at most, never
// "download", "free" or "app" in the line, a small grey balliq.app mark
// bottom right, dark backdrop like the App Store header.
//
//   node scripts/social-app-slides.mjs [outDir]
//   -> balliq_<idea>_<club-or-generic>_1080x1350.png
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SIM = join(ROOT, 'screenshots/sim');
const OUT = process.argv[2] || join(ROOT, 'screenshots/social');
mkdirSync(OUT, { recursive: true });
const img = (f) => `data:image/png;base64,${readFileSync(join(SIM, f)).toString('base64')}`;
const icon = `data:image/png;base64,${readFileSync(join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')).toString('base64')}`;
const band = img('status-band.png');
const GREEN = '#58CC02', AMBER = '#FFC107', ORANGE = '#FF8A3D';

// The same iPhone 17 as the App Store header (scripts/store-header.mjs):
// sizes in px of the screen width, never a CSS %.
const ASPECT = 2622 / 1206;
const device = (src, w, style = '') => {
  const h = Math.round(w * ASPECT), r = Math.round(w * 0.137), edge = Math.max(3, Math.round(w * 0.022));
  const u = (n) => Math.round(w * n / 402);
  return `<div style="position:absolute;${style};width:${w + edge * 2}px;height:${h + edge * 2}px;padding:${edge}px;border-radius:${r + edge}px;
      background:linear-gradient(135deg,#8d9093 0%,#3a3d40 18%,#1b1d1f 50%,#3a3d40 82%,#9a9da0 100%);
      box-shadow:0 0 0 1px rgba(0,0,0,.9) inset,0 ${u(30)}px ${u(80)}px rgba(0,0,0,.6),0 ${u(6)}px ${u(18)}px rgba(0,0,0,.5)">
    <div style="position:relative;width:${w}px;height:${h}px;border-radius:${r}px;overflow:hidden;background:#0B0C10;box-shadow:0 0 0 ${Math.max(1, u(1.5))}px #000">
      <img src="${band}" style="display:block;width:100%">
      <span style="position:absolute;left:${Math.round(w * 0.066)}px;top:0;width:${Math.round(w * 0.25)}px;height:${Math.round(w * 186 / 1206)}px;display:flex;align-items:center;justify-content:center;padding-top:${Math.round(w * 0.012)}px;background:#0B0C10;font-weight:600;font-size:${u(17)}px;letter-spacing:-.2px;color:#fff">9:41</span>
      <span style="position:absolute;left:50%;transform:translateX(-50%);top:${u(11)}px;width:${u(125)}px;height:${u(37)}px;border-radius:99px;background:#000"></span>
      <img src="${src}" style="display:block;width:100%">
    </div></div>`;
};

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; };
const slide = ({ line, accent, shot }) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1080px;height:1350px;overflow:hidden;font-family:-apple-system,'Inter','Helvetica Neue',sans-serif;color:#fff;
    background:radial-gradient(70% 45% at 50% 0%, rgba(${rgb(accent)},.30), transparent 72%),
      radial-gradient(60% 40% at 50% 100%, rgba(${rgb(accent)},.14), transparent 70%),
      linear-gradient(180deg,#121317,#060607)}
  .mark{position:absolute;top:84px;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:14px}
  .mark img{width:52px;height:52px;border-radius:12px}
  .mark span{font-size:40px;font-weight:800;letter-spacing:-.5px}
  .mark b{color:${AMBER}}
  h1{position:absolute;top:170px;left:60px;right:60px;text-align:center;font-size:66px;line-height:1.06;font-weight:800;letter-spacing:-1.5px;text-wrap:balance}
  h1 em{font-style:normal;color:${accent}}
  .url{position:absolute;right:60px;bottom:104px;font-size:24px;font-weight:600;color:rgba(255,255,255,.42);letter-spacing:.02em}
</style></head><body>
  <div class="mark"><img src="${icon}"><span>Ball <b>IQ</b></span></div>
  <h1>${line}</h1>
  ${device(img(shot), 520, 'left:50%;transform:translateX(-50%);top:360px')}
  <div class="url">balliq.app</div>
</body></html>`;

// Generic slides. Lines in the house voice: dry, a dare, never an advert.
const SLIDES = [
  { name: 'balliq_footle-brag_generic', accent: GREEN, shot: '02-footle.png', line: 'Solved in three. <em>Your turn.</em>' },
  { name: 'balliq_top10_generic', accent: ORANGE, shot: '11-top10.png', line: "England's most capped men. <em>Name all ten.</em>" },
  { name: 'balliq_proveit_generic', accent: GREEN, shot: '01-home.png', line: 'Think you know ball? <em>Prove it.</em>' },
  { name: 'balliq_draft_generic', accent: AMBER, shot: '12-draft.png', line: 'Build an eleven. Win the league. <em>Easy, right?</em>' },
  // Club versions: question 1 of that club's own quiz, unanswered (captured
  // with CLUBS=1 SIMLIKE=1 node scripts/shoot-store-screens.mjs). The accent
  // is a readable tint of the club colour (Chelsea's and Barcelona's own
  // colours are too dark to read on black). Never a question count.
  ...[
    ['manchester-united', 'united', 'United fan?', '#E8382B'],
    ['manchester-city', 'city', 'City fan?', '#6CABDD'],
    ['liverpool', 'liverpool', 'Liverpool fan?', '#E0263F'],
    ['arsenal', 'arsenal', 'Gooner?', '#F2353A'],
    ['chelsea', 'chelsea', 'Chelsea fan?', '#4A8BFF'],
    ['real-madrid', 'realmadrid', 'Madridista?', '#FEBE10'],
    ['barcelona', 'barcelona', 'Culé?', '#E0457B'],
  ].map(([slug, tag, who, accent]) => ({ name: `balliq_clubquiz_${tag}`, accent, shot: `club-${slug}.png`, line: `${who} <em>Prove it.</em>` })),
  // Club Top 10s, half filled (Alex, 15 Oct 2026: a United deck ends on
  // United's top scorers). Only lists that exist in the app; no City list yet,
  // and Barcelona has appearances, not scorers.
  ...[
    ['manchester-united-top-scorers', 'united', 'United fan?', '#E8382B'],
    ['liverpool-top-scorers', 'liverpool', 'Liverpool fan?', '#E0263F'],
    ['arsenal-top-scorers', 'arsenal', 'Gooner?', '#F2353A'],
    ['chelsea-top-scorers', 'chelsea', 'Chelsea fan?', '#4A8BFF'],
    ['real-madrid-top-scorers', 'realmadrid', 'Madridista?', '#FEBE10'],
    ['barcelona-appearances', 'barcelona', 'Culé?', '#E0457B'],
  ].map(([id, tag, who, accent]) => ({ name: `balliq_top10_${tag}`, accent, shot: `top10-${id}.png`, line: `${who} <em>Name all ten.</em>` })),
];

// ── Club Top 10, version 2 (Alex, 15 Oct 2026, through the social session):
// "looks like an App Store screenshot, not something that belongs in a
// carousel". So: carousel-native. The club's colour fills the frame with kit
// stripes, the board is cropped big and slightly tilted under our own title
// strip, the line is set in the quote cards' typeface, and the store badges
// say where the full game is. ⚠️ No crests: a crest is the club's copyright
// and trade mark and this slide advertises our app (the 8 Oct ruling,
// docs/TODO.md "Real club emblems: no"). Badges: the site's own
// (src/lib/storeGlyphs.js) until Alex clears downloading Apple's and Google's
// official artwork.
import { APPLE_GLYPH_PATH, PLAY_GLYPH_PATH } from '../src/lib/storeGlyphs.js';
const QC = join(process.env.HOME, 'shithousery-hq/social/assets/fonts');
const font = (fam, w, f, type) => `@font-face{font-family:${fam};font-weight:${w};src:url(data:font/${type};base64,${readFileSync(join(QC, f)).toString('base64')})}`;
const FONTS = font('QC', 700, 'BarlowSemiCondensed-Bold.ttf', 'ttf') + font('QC', 600, 'BarlowSemiCondensed-SemiBold.ttf', 'ttf');
const badge = (glyph, small, big) => `<div class="badge"><svg viewBox="0 0 24 24"><path fill="#fff" d="${glyph}"/></svg><div><small>${small}</small><b>${big}</b></div></div>`;
// The board alone, all ten slots, from its own element capture
// (top10board-<id>.png), shown 724px wide.
const WIN_W = 680;
const top10v2 = ({ shot, who, title, bg, accent }) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1080px;height:1350px;overflow:hidden;color:#fff;font-family:-apple-system,'Inter',sans-serif;
    background:radial-gradient(80% 60% at 50% 42%, ${bg[0]} 0%, ${bg[1]} 55%, ${bg[2]} 100%)}
  .stripes{position:absolute;inset:-200px;transform:rotate(-12deg);background:repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 120px, rgba(255,255,255,.05) 120px 200px)}
  h1{position:absolute;top:66px;left:60px;right:60px;text-align:center;font:700 90px/0.95 QC;text-transform:uppercase;letter-spacing:1px;text-shadow:0 6px 24px rgba(0,0,0,.35)}
  h1 em{font-style:normal;color:${accent}}
  .card{position:absolute;left:50%;top:262px;width:732px;transform:translateX(-50%) rotate(-3deg);border-radius:40px;padding:26px 26px 28px;
    background:#0B0C10;box-shadow:0 0 0 3px rgba(255,255,255,.16),0 40px 90px rgba(0,0,0,.55)}
  .ttl{display:flex;justify-content:space-between;align-items:baseline;padding:0 6px 16px;font:700 33px/1 QC;text-transform:uppercase;letter-spacing:1px}
  .ttl span{color:${accent}}
  .win img{display:block;width:${WIN_W}px}
  /* The app named in full (Alex: "it has to be totally obvious"): icon,
     BALL IQ, FOOTBALL QUIZ, then where to get it. */
  .foot{position:absolute;left:60px;right:60px;top:1046px;display:flex;align-items:center;justify-content:center;gap:16px}
  .app{display:flex;align-items:center;gap:12px;margin-right:6px}
  .app img{width:66px;height:66px;border-radius:15px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
  .app b{display:block;font:700 40px/0.9 QC;letter-spacing:1px}
  .app small{display:block;margin-top:5px;font:600 20px/1 QC;letter-spacing:2.4px;color:${accent}}
  .badge{display:flex;align-items:center;gap:10px;height:66px;padding:0 20px 0 16px;background:#000;border:2px solid rgba(255,255,255,.55);border-radius:14px}
  .badge svg{width:34px;height:34px}
  .badge small{display:block;font:600 15px/1 -apple-system,'Inter',sans-serif;letter-spacing:.2px;opacity:.9}
  .badge b{display:block;margin-top:3px;font:700 26px/1 -apple-system,'Inter',sans-serif;letter-spacing:-.3px}
  .url{position:absolute;left:0;right:0;top:1126px;text-align:center;font:600 21px/1 QC;letter-spacing:2px;color:rgba(255,255,255,.7)}
</style></head><body>
  <div class="stripes"></div>
  <h1>${who}<br><em>Name all ten.</em></h1>
  <div class="card"><div class="ttl">${title}<span>4/10</span></div><div class="win"><img src="${img(shot)}"></div></div>
  <div class="foot"><div class="app"><img src="${icon}"><div><b>BALL IQ</b><small>FOOTBALL QUIZ</small></div></div>${badge(APPLE_GLYPH_PATH, 'Download on the', 'App Store')}${badge(PLAY_GLYPH_PATH, 'GET IT ON', 'Google Play')}</div>
  <div class="url">OR PLAY AT BALLIQ.APP</div>
</body></html>`;
const V2 = [
  { tag: 'united', id: 'manchester-united-top-scorers', who: 'United fan?', title: 'United · all-time top scorers', bg: ['#C8102E', '#8A0B1C', '#2A0408'], accent: '#FFD23F' },
  { tag: 'liverpool', id: 'liverpool-top-scorers', who: 'Liverpool fan?', title: 'Liverpool · all-time top scorers', bg: ['#C8102E', '#7E0A1D', '#240307'], accent: '#F6EB61' },
  { tag: 'arsenal', id: 'arsenal-top-scorers', who: 'Gooner?', title: 'Arsenal · all-time top scorers', bg: ['#EF0107', '#9A0005', '#2C0102'], accent: '#F2D47E' },
  { tag: 'chelsea', id: 'chelsea-top-scorers', who: 'Chelsea fan?', title: 'Chelsea · all-time top scorers', bg: ['#0A56B0', '#033273', '#010C1C'], accent: '#F2C14E' },
  { tag: 'realmadrid', id: 'real-madrid-top-scorers', who: 'Madridista?', title: 'Madrid · all-time top scorers', bg: ['#3A4192', '#1B1F55', '#06071A'], accent: '#FEBE10' },
  { tag: 'barcelona', id: 'barcelona-appearances', who: 'Culé?', title: 'Barcelona · most appearances', bg: ['#A50044', '#4A1A6B', '#0A0A2A'], accent: '#EDBB00' },
];

const browser = await chromium.launch();
if (process.env.V2) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const c of V2.filter((x) => process.env.V2 === '1' || process.env.V2.split(',').includes(x.tag))) {
    await page.setContent(top10v2({ ...c, shot: `top10board-${c.id}.png` }), { waitUntil: 'load' });
    const f = join(OUT, `balliq_top10v2_${c.tag}_1080x1350.png`);
    await page.screenshot({ path: f });
    console.log(f);
  }
  await browser.close();
  process.exit(0);
}
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const s of SLIDES) {
  await page.setContent(slide(s), { waitUntil: 'load' });
  const f = join(OUT, `${s.name}_1080x1350.png`);
  await page.screenshot({ path: f });
  console.log(f);
}
await browser.close();
