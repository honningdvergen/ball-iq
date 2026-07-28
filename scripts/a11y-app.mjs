// a11y-app.mjs — WCAG 2.1 AA audit of THE APP, not the website.
//
//   node scripts/a11y-app.mjs
//
// scripts/a11y.mjs covers the marketing + SEO pages. Those are what a stranger
// from Google sees. This covers what a RETAINED user sees every day, which had
// never been audited: /play, its onboarding, the home grid, Settings, and a
// live quiz. The app ships from the same dist/ that goes into the native
// binary, so auditing it here is auditing the iOS and Android builds too.
//
// Drives real UI rather than reasoning about tokens: a token pair only matters
// if it is actually rendered somewhere.

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) f = path.join(ROOT, 'index.html');       // SPA fallback
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(8903);

const AUDIT = () => {
  const parse = (s) => { const n = (s.match(/[\d.]+/g) || []).map(Number); return { rgb: n.slice(0, 3), a: n.length > 3 ? n[3] : 1 }; };
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (fg, bg) => { const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };
  // Returns every candidate background actually painted behind `el`.
  //
  // Gradient stops carry alpha and MUST be composited, not read raw. Ball IQ
  // tints cards with things like
  //   linear-gradient(135deg, rgba(88,204,2,0.10), #0F1117 62%)
  // which renders as a barely-green near-black. An earlier version of this
  // function took the [88,204,2] triple and scored white text against OPAQUE
  // green — inventing 10 contrast failures on the home screen that do not
  // exist. Layers are collected top-down, then flattened bottom-up.
  const bgOf = (el) => {
    const layers = [];
    let n = el;
    while (n) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage.includes('gradient')) {
        const stops = [...cs.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)].map((m) => {
          const v = m[1].split(',').map(Number);
          return { rgb: v.slice(0, 3), a: v.length > 3 ? v[3] : 1 };
        });
        if (stops.length) layers.push({ stops });
      }
      const { rgb, a } = parse(cs.backgroundColor);
      if (a > 0) {
        layers.push({ stops: [{ rgb, a }] });
        if (a === 1) break;                       // fully opaque: nothing below shows
      }
      n = n.parentElement;
    }
    const over = (top, under) => top.rgb.map((c, i) => c * top.a + under[i] * (1 - top.a));
    let bases = [[10, 10, 10]];                   // page canvas
    for (let i = layers.length - 1; i >= 0; i--) {
      const next = [];
      for (const base of bases) for (const s of layers[i].stops) next.push(over(s, base));
      bases = next.slice(0, 8);                   // cap the combinatorics
    }
    return bases;
  };

  const contrast = [], noName = [], seen = new Set();
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.offsetParent === null) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') return;
    if (el.closest('[aria-hidden="true"]')) return;

    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
    if (own) {
      const { rgb, a } = parse(cs.color);
      let cr = Infinity, bg = null;
      for (const c of bgOf(el)) {
        const fg = a === 1 ? rgb : rgb.map((v, j) => v * a + c[j] * (1 - a));
        const x = ratio(fg, c);
        if (x < cr) { cr = x; bg = c; }
      }
      const px = parseFloat(cs.fontSize);
      const need = (px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700)) ? 3 : 4.5;
      if (cr < need) {
        const key = `${cs.color}|${Math.round(px)}|${el.className}`;
        if (!seen.has(key)) {
          seen.add(key);
          contrast.push({ t: own.slice(0, 38), px, ratio: +cr.toFixed(2), need, color: cs.color, bg: `rgb(${bg.map(Math.round)})`, cls: String(el.className || '').slice(0, 28) });
        }
      }
    }
    if (el.tagName !== 'BUTTON' && el.tagName !== 'A') return;
    const txt = (el.textContent || '').trim();
    if (!txt && !el.getAttribute('aria-label') && !el.getAttribute('title')) {
      noName.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 28) });
    }
  });
  return { contrast, noName };
};

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();

const report = (label, r) => {
  const bad = r.contrast.length + r.noName.length;
  console.log(`\n──── ${label}   ${bad ? '' : '✅ clean'}`);
  r.contrast.forEach((c) => console.log(`   1.4.3  ${String(c.ratio).padStart(5)}:1 need ${c.need}  ${c.px}px  ${c.color} on ${c.bg}\n          .${c.cls}  "${c.t}"`));
  r.noName.forEach((n) => console.log(`   4.1.2  <${n.tag}> .${n.cls} has no accessible name`));
  return bad;
};

let total = 0;
await page.goto('http://localhost:8903/play', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
total += report('onboarding — sample question', await page.evaluate(AUDIT));

await page.evaluate(() => document.querySelector('.onboard-sample-opt')?.click());
await page.waitForTimeout(700);
total += report('onboarding — answered state', await page.evaluate(AUDIT));

await page.evaluate(() => [...document.querySelectorAll('.onboard-btn')].find((b) => /continue|next/i.test(b.textContent))?.click());
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelectorAll('.onboard-skill')[1]?.click());
await page.waitForTimeout(400);
await page.evaluate(() => [...document.querySelectorAll('.onboard-btn')].find((b) => /finish/i.test(b.textContent))?.click());
await page.waitForTimeout(1500);
total += report('HOME (the daily surface)', await page.evaluate(AUDIT));

await page.evaluate(() => document.querySelector('.icon-btn')?.click());
await page.waitForTimeout(800);
total += report('SETTINGS', await page.evaluate(AUDIT));

await page.goBack().catch(() => {});
await page.evaluate(() => [...document.querySelectorAll('.back-btn,.icon-btn')][0]?.click());
await page.waitForTimeout(800);
await page.evaluate(() => [...document.querySelectorAll('.play-card')].find((c) => /Classic/.test(c.textContent))?.click());
await page.waitForTimeout(900);
await page.evaluate(() => document.querySelectorAll('.diff-option')[1]?.click());
await page.waitForTimeout(1800);
total += report('QUIZ — live question', await page.evaluate(AUDIT));

await page.evaluate(() => document.querySelectorAll('.opt')[0]?.click());
await page.waitForTimeout(900);
total += report('QUIZ — answered + explanation', await page.evaluate(AUDIT));

console.log(`\n═══ ${total} AA issue(s) across the app`);
await br.close();
server.close();
