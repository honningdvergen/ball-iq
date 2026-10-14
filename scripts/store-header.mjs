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
const base = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#070707;font-family:-apple-system,'Inter','Helvetica Neue',sans-serif;overflow:hidden;color:#fff}
  .stage{position:relative;overflow:hidden;background:
    radial-gradient(60% 90% at 12% 70%, rgba(88,204,2,.30), transparent 70%),
    radial-gradient(60% 90% at 88% 70%, rgba(255,138,61,.28), transparent 70%),
    radial-gradient(50% 60% at 50% 110%, rgba(255,193,7,.16), transparent 70%),
    linear-gradient(180deg,#0c0c0c,#050505)}
  .phone{position:absolute;border-radius:9%/4.4%;padding:1.1%;background:linear-gradient(150deg,#5a5f5c 0%,#15181a 22%,#0d0f10 62%,#42423f 100%);
    box-shadow:0 40px 90px rgba(0,0,0,.65),0 0 0 2px rgba(255,255,255,.05)}
  .phone img{display:block;width:100%;border-radius:8%/3.9%}
  .mark{display:flex;align-items:center;justify-content:center;gap:22px}
  .mark img{border-radius:22.5%;box-shadow:0 10px 30px rgba(0,0,0,.5)}
  .mark span{font-weight:800;letter-spacing:-1px}
  .mark b{color:${AMBER};font-weight:800}
  .pill{display:inline-block;border-radius:999px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
`;

// Header, 1920x823 CSS px at 2x. The words sit in the centred safe area;
// the phones fan out to either side, where a crop costs nothing.
const phone = (src, { left, top, w, rot }) =>
  `<div class="phone" style="left:${left}px;top:${top}px;width:${w}px;transform:rotate(${rot}deg)"><img src="${src}"></div>`;
const header = `<!doctype html><html><head><style>${base}
  .stage{width:1920px;height:823px}
  .center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;width:900px}
  .mark img{width:96px;height:96px}
  .mark span{font-size:92px}
  h1{margin-top:26px;font-size:50px;font-weight:800;line-height:1.1;letter-spacing:-.5px}
  h1 em{font-style:normal;color:${GREEN}}
  .modes{margin-top:22px;font-size:25px;color:#a6acb2;font-weight:600;letter-spacing:.02em}
</style></head><body><div class="stage">
  ${phone(img('12-draft.png'), { left: 40, top: 150, w: 330, rot: -9 })}
  ${phone(img('11-top10.png'), { left: 300, top: 70, w: 350, rot: -3 })}
  ${phone(img('04-transfer-trail.png'), { left: 1270, top: 70, w: 350, rot: 3 })}
  ${phone(img('02-footle.png'), { left: 1550, top: 150, w: 330, rot: 9 })}
  <div class="center">
    <div class="mark"><img src="${icon}"><span>Ball <b>IQ</b></span></div>
    <h1>The football quiz for people<br>who <em>actually watch</em> football</h1>
    <div class="modes">Footle · Daily 7 · Transfer Trail · Top 10 · Draft</div>
  </div>
</div></body></html>`;

// Search results, 1920x1280 CSS px at 2x: show the games themselves
// (Apple: "state the obvious", "showcase the firsthand experience").
const card = (src, label, color, x) => `
  <div style="position:absolute;left:${x}px;top:150px;width:520px;text-align:center">
    <span class="pill" style="font-size:26px;padding:12px 26px;color:#0b0b0b;background:${color}">${label}</span>
    <div class="phone" style="position:relative;margin:34px auto 0;width:460px"><img src="${src}"></div>
  </div>`;
const search = `<!doctype html><html><head><style>${base}
  .stage{width:1920px;height:1280px}
</style></head><body><div class="stage">
  ${card(img('02-footle.png'), 'Footle', GREEN, 130)}
  ${card(img('11-top10.png'), 'Top 10', ORANGE, 700)}
  ${card(img('12-draft.png'), 'Draft', AMBER, 1270)}
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
