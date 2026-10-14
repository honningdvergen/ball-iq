// App Store creative assets (iOS 27+): the product page HEADER (21:9,
// 3840x1646) and the SEARCH RESULTS asset (3:2, 3840x2560). Drawn as HTML
// from the raw store captures in screenshots/sim and rendered at 2x.
//
// Apple's rules that shaped this (creative-assets specs + asset best
// practices, read 14 Oct 2026): one clear idea; the focal point centred
// because the edges crop differently on iPhone and iPad (header safe area
// about the middle 1646x661, search about the middle 2168x1030); no alpha;
// 4+ content; no prices, rankings, awards or other stores' marks.
//
//   node scripts/store-header.mjs        -> screenshots/header/*.jpg
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SIM = join(ROOT, 'screenshots/sim');
const OUT = join(ROOT, 'screenshots/header');
mkdirSync(OUT, { recursive: true });
const img = (f) => `data:image/png;base64,${readFileSync(join(SIM, f)).toString('base64')}`;
const icon = `data:image/png;base64,${readFileSync(join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')).toString('base64')}`;

const GREEN = '#58CC02', AMBER = '#FFC107', ORANGE = '#FF8A3D';
const band = img('status-band.png');
const base = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#070707;font-family:-apple-system,'Inter','Helvetica Neue',sans-serif;overflow:hidden;color:#fff}
  .stage{position:relative;overflow:hidden;background:
    radial-gradient(55% 85% at 14% 75%, rgba(88,204,2,.26), transparent 70%),
    radial-gradient(55% 85% at 86% 75%, rgba(255,138,61,.24), transparent 70%),
    radial-gradient(45% 55% at 50% 0%, rgba(255,193,7,.10), transparent 70%),
    linear-gradient(180deg,#101114,#060607)}
  .mark{display:flex;align-items:center;justify-content:center;gap:22px}
  .mark img{border-radius:22.5%;box-shadow:0 10px 30px rgba(0,0,0,.5)}
  .mark span{font-weight:800;letter-spacing:-1px}
  .mark b{color:${AMBER};font-weight:800}
  .pill{display:inline-block;border-radius:999px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
`;

// An iPhone 17 drawn to its own proportions, everything in px of the screen
// width (a CSS % would measure the stage, which is how the first draft got a
// case six times too thick). Screen 1206x2622 at 3x; corner radius 13.7% of
// the width; a thin titanium edge; Apple's own status bar from a simulator
// capture with the time redrawn as 9:41; Dynamic Island; home indicator.
const ASPECT = 2622 / 1206;
const device = (src, w, style = '') => {
  const h = Math.round(w * ASPECT), r = Math.round(w * 0.137), edge = Math.max(3, Math.round(w * 0.022));
  const u = (n) => Math.round(w * n / 402);
  return `<div style="position:absolute;${style};width:${w + edge * 2}px;height:${h + edge * 2}px;padding:${edge}px;border-radius:${r + edge}px;
      background:linear-gradient(135deg,#8d9093 0%,#3a3d40 18%,#1b1d1f 50%,#3a3d40 82%,#9a9da0 100%);
      box-shadow:0 0 0 1px rgba(0,0,0,.9) inset,0 ${u(30)}px ${u(80)}px rgba(0,0,0,.6),0 ${u(6)}px ${u(18)}px rgba(0,0,0,.5)">
    <div style="position:relative;width:${w}px;height:${h}px;border-radius:${r}px;overflow:hidden;background:#0B0C10;box-shadow:0 0 0 ${Math.max(1, u(1.5))}px #000">
      <img src="${band}" style="display:block;width:100%">
      <span style="position:absolute;left:${Math.round(w * 0.066)}px;top:0;width:${Math.round(w * 0.25)}px;height:${Math.round(w * 186 / 1206)}px;display:flex;align-items:center;justify-content:center;padding-top:${Math.round(w * 0.012)}px;background:#0B0C10;font-weight:600;font-size:${u(17)}px;letter-spacing:-.2px">9:41</span>
      <span style="position:absolute;left:50%;transform:translateX(-50%);top:${u(11)}px;width:${u(125)}px;height:${u(37)}px;border-radius:99px;background:#000"></span>
      <img src="${src}" style="display:block;width:100%">
      <span style="position:absolute;left:50%;transform:translateX(-50%);bottom:${u(8)}px;width:${u(134)}px;height:${Math.max(3, u(5))}px;border-radius:99px;background:rgba(255,255,255,.9)"></span>
    </div></div>`;
};

// Header, 1920x823 CSS px at 2x. The words sit in the centred safe area
// (about the middle 823x330 here); upright phones stand either side and run
// off the bottom edge, where a crop costs nothing.
const header = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
  .stage{width:1920px;height:823px}
  .center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;width:900px}
  .mark img{width:92px;height:92px}
  .mark span{font-size:88px}
  h1{margin-top:24px;font-size:48px;font-weight:800;line-height:1.12;letter-spacing:-.5px}
  h1 em{font-style:normal;color:${GREEN}}
  .modes{margin-top:22px;font-size:24px;color:#a6acb2;font-weight:600;letter-spacing:.02em}
</style></head><body><div class="stage">
  ${device(img('12-draft.png'), 250, 'left:70px;top:250px;opacity:.92')}
  ${device(img('11-top10.png'), 290, 'left:290px;top:120px')}
  ${device(img('04-transfer-trail.png'), 290, 'right:290px;top:120px')}
  ${device(img('02-footle.png'), 250, 'right:70px;top:250px;opacity:.92')}
  <div class="center">
    <div class="mark"><img src="${icon}"><span>Ball <b>IQ</b></span></div>
    <h1>The football quiz for people<br>who <em>actually watch</em> football</h1>
    <div class="modes">Footle · Daily 7 · Transfer Trail · Top 10 · Draft</div>
  </div>
</div></body></html>`;

// Search results, 1920x1280 CSS px at 2x: the games themselves, upright
// (Apple: "state the obvious", "showcase the firsthand experience").
const card = (src, label, color, cx) => `
  <div style="position:absolute;left:${cx - 300}px;top:120px;width:600px;text-align:center">
    <span class="pill" style="font-size:28px;padding:13px 30px;color:#0b0b0b;background:${color}">${label}</span>
  </div>${device(src, 420, `left:${cx - 210 - 9}px;top:220px`)}`;
const search = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
  .stage{width:1920px;height:1280px}
</style></head><body><div class="stage">
  ${card(img('02-footle.png'), 'Footle', GREEN, 390)}
  ${card(img('11-top10.png'), 'Top 10', ORANGE, 960)}
  ${card(img('12-draft.png'), 'Draft', AMBER, 1530)}
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const [name, html, w, h] of [['header-3840x1646', header, 1920, 823], ['search-3840x2560', search, 1920, 1280]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: 'load' });
  const png = join(OUT, `${name}.png`);
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: w, height: h } });
  // Apple refuses alpha on these assets. ⚠️ THE HEADER IS PNG ONLY: the
  // help page says JPEG or PNG, but the live spec list (GET
  // /v1/appAssetLibraryRefData, i3840x1646a0) takes .png alone, and a JPEG
  // header FAILED as INVALID_ASSET_FILE_FORMAT (14 Oct 2026). So both go
  // through JPEG to drop the alpha channel, and the header comes back to PNG.
  const jpg = join(OUT, `${name}.jpg`);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '92', png, '--out', jpg], { stdio: 'ignore' });
  const out = name.startsWith('header') ? join(OUT, `${name}-flat.png`) : jpg;
  if (out !== jpg) execFileSync('sips', ['-s', 'format', 'png', jpg, '--out', out], { stdio: 'ignore' });
  console.log(out, execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'hasAlpha', out]).toString().split('\n').slice(1, 4).map((s) => s.trim()).join(' '));
}
await browser.close();
