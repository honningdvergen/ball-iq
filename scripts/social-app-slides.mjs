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
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const s of SLIDES) {
  await page.setContent(slide(s), { waitUntil: 'load' });
  const f = join(OUT, `${s.name}_1080x1350.png`);
  await page.screenshot({ path: f });
  console.log(f);
}
await browser.close();
