// Captures a Guess-the-XI line-up from FotMob's lineup builder (fotmob.com/lineup-builder), the look fans
// know. Writes two pitch images (names+faces hidden / revealed) plus each player's box, for xireel.mjs.
//
//   node social/fmxi.mjs --id 2022-fifa-world-cup-final-0 [--vw 620]
//
// social/state/fotmob-xi.json maps each xiPool XI to FotMob: formation `f`, FotMob player ids `ids` in POOL
// order, and `o` = pool indices in FotMob slot order (GK, then each line back→front, right→left).
// Every id was checked against FotMob's playerData name + birth date (a same-name player once slipped in).
// The consent popup is removed from the DOM, never accepted.

import { chromium } from '../node_modules/playwright/index.mjs';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const id = arg('id'), VW = +arg('vw', 700), ZOOM = +arg('zoom', 0), OUTW = 1080;
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'state', 'fotmob-xi.json'), 'utf8'));
const m = map[id];
if (!m) { console.error('--id one of:\n' + Object.keys(map).join('\n')); process.exit(1); }
if (m.ids.some((x) => !x)) { console.error(`${id}: FotMob has no entry for pool player(s) ${m.ids.map((x, i) => x ? null : i).filter((x) => x !== null)}`); process.exit(1); }

const slotIds = m.o.map((i) => m.ids[i]);
// 3 outfield lines (4-3-3) have room for big faces; 4+ lines (4-2-3-1, 4-4-1-1) overlap the row below at 1.45
const zoom = ZOOM || (m.f.split('-').length >= 4 ? 1.12 : 1.45);
const q = `players=${encodeURIComponent(slotIds.join(':'))}&formation=${m.f}`;
const url = 'https://www.fotmob.com/lineup-builder?d=' + zlib.deflateRawSync(q).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b = await chromium.launch();
// first pass at DSF 1 to measure the pitch, then pick the DSF that makes it exactly OUTW px wide
const ctx0 = await b.newContext({ viewport: { width: VW, height: 1400 }, locale: 'en-GB' });
const measure = async (ctx) => {
  await ctx.addInitScript(() => { try { localStorage.setItem('continue_in_app_prompt_dismissed', 'true'); } catch {} });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForSelector('[class*="PitchDiv"] img', { timeout: 30000 });
  await page.evaluate(() => {
    document.querySelectorAll('.fc-consent-root, .fc-dialog-overlay, .fc-help-dialog-overlay, header').forEach((e) => e.remove());
    document.querySelectorAll('[class*="DisabledPitchOverlay"]').forEach((e) => { e.style.background = 'none'; });
    document.body.style.overflow = 'visible';
  });
  // FotMob's own render, players enlarged: at reel width the stock 46px faces read as dots
  await page.addStyleTag({ content: `[class*="PitchDiv"] [class*="LineupPlayerCSSWrapper"]{transform:scale(${zoom});transform-origin:50% 40%}` });
  await page.waitForFunction(() => [...document.querySelectorAll('[class*="PitchDiv"] img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
  return page;
};
const p0 = await measure(ctx0);
const w0 = await p0.evaluate(() => document.querySelector('[class*="PitchDiv"]').getBoundingClientRect().width);
await ctx0.close();
const ctx = await b.newContext({ viewport: { width: VW, height: 1400 }, deviceScaleFactor: OUTW / w0, locale: 'en-GB' });
const page = await measure(ctx);
const pitch = page.locator('[class*="PitchDiv"]').first();
const boxes = await page.evaluate(() => {
  const P = document.querySelector('[class*="PitchDiv"]').getBoundingClientRect();
  return [...document.querySelectorAll('[class*="PitchDiv"] [class*="LineupPlayerCSS"]')].map((el) => {
    const img = el.querySelector('img'), txt = el.querySelector('[class*="LineupPlayerText"]');
    const r = (e) => { const x = e.getBoundingClientRect(); return { x: x.x - P.x, y: x.y - P.y, w: x.width, h: x.height }; };
    return { fmId: +(img.src.match(/playerimages\/(\d+)/) || [])[1], face: r(img), name: r(txt), label: txt.textContent.trim(), all: r(el) };
  });
});
const dir = path.join(HERE, '.fmxi'); fs.mkdirSync(dir, { recursive: true });
await pitch.screenshot({ path: path.join(dir, `${id}-shown.png`) });
await page.addStyleTag({ content: '[class*="PitchDiv"] [class*="LineupPlayerCSS"] img{visibility:hidden!important} [class*="LineupPlayerText"]{visibility:hidden!important}' });
await page.waitForTimeout(200);
await pitch.screenshot({ path: path.join(dir, `${id}-hidden.png`) });
const box = await pitch.boundingBox();
await b.close();

const scale = OUTW / box.width;
const S = (r) => ({ x: r.x * scale, y: r.y * scale, w: r.w * scale, h: r.h * scale });
const players = m.ids.map((fmId, poolIdx) => {
  const bx = boxes.find((x) => x.fmId === fmId);
  if (!bx) throw new Error(`${id}: pool #${poolIdx} (FotMob ${fmId}) not on the pitch`);
  return { poolIdx, fmId, label: bx.label, face: S(bx.face), name: S(bx.name), all: S(bx.all) };
});
const out = { id, url, width: OUTW, height: Math.round(box.height * scale), players };
fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(out, null, 1));
console.log(`✅ ${id}  pitch ${OUTW}x${out.height}  ${players.map((p) => p.label).join(', ')}`);
