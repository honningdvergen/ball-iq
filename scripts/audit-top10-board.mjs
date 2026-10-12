#!/usr/bin/env node
// Does every name on every Top 10 list sit inside its card, at every phone width?
//
//   node scripts/audit-top10-board.mjs
//
// The unit suite has no DOM, so nothing there can see a name wrap. This lays the
// board out in WebKit (Safari's engine) with the REAL stylesheet and measures:
//
//   finished board   the large size, cards free to grow          (no keyboard)
//   fitted board     .is-fit at each size, every rank found       (keyboard up)
//
// and fails if any text stands outside its card, or if a name is broken inside
// a word at 360pt or wider. Why it exists: on 12 Oct 2026 the finished board
// was given a fixed 60pt row, 1136 tests stayed green, and "Manchester United"
// was drawn as "Mancheste / r United" on a 360pt phone.
//
// Needs the network once (Inter comes from Google Fonts, as it does in the app)
// and Playwright's WebKit. Run it after any change to top10.css or a new list.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from 'playwright';
import { hasLongWord } from '../src/lib/top10.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const css = readFileSync(join(ROOT, 'src/screens/top10.css'), 'utf8');
const { lists } = JSON.parse(readFileSync(join(ROOT, 'src/data/top10Lists.json'), 'utf8'));
const WIDTHS = [320, 360, 375, 390, 393, 402, 412, 430];
const STATES = [
  { tag: 'finished', size: 'l', row: 60, fit: false, cls: 'is-missed' },
  { tag: 'typing l52', size: 'l', row: 52, fit: true, cls: 'is-found' },
  { tag: 'typing m44', size: 'm', row: 44, fit: true, cls: 'is-found' },
  { tag: 'typing m38', size: 'm', row: 38, fit: true, cls: 'is-found' },
  { tag: 'typing s30', size: 's', row: 30, fit: true, cls: 'is-found' },
];

const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>:root{--font:'Inter',system-ui,sans-serif;--s1:#13151C;--s2:#1B1E27;--t1:#fff;--t2:#9BA0B8;--t3:#8A8E99;--border:#242730;--bg:#0B0C10;--t10:#FF9B7A;--t10-rgb:255,138,101}
*{box-sizing:border-box}body{margin:0;font-family:var(--font);background:var(--bg)}.app{max-width:420px;margin:0 auto;padding:0 20px}
${css}</style></head><body><div class="app"><div id="root"></div></div></body></html>`;
const file = join(mkdtempSync(join(tmpdir(), 't10-board-')), 'board.html');
writeFileSync(file, html);

const render = (list, st) => `<div class="screen t10"><div class="t10-board is-${st.size}${st.fit ? ' is-fit' : ''}" style="--t10-row: ${st.row}px">${
  list.slots.map((s, i) => `<div class="t10-cell ${st.cls}"><span class="t10-rank">${i + 1}</span><span class="t10-body"><span class="t10-name${hasLongWord(s.name) ? ' is-long' : ''}">${s.name}</span>${s.clue ? `<span class="t10-clue">${s.clue}</span>` : ''}</span></div>`).join('')
}</div></div>`;

const measure = () => [...document.querySelectorAll('.t10-cell')].map((c) => {
  const cr = c.getBoundingClientRect(), name = c.querySelector('.t10-name'), clue = c.querySelector('.t10-clue');
  const nr = name.getBoundingClientRect(), kr = clue?.getBoundingClientRect();
  const cs = getComputedStyle(name);
  const pen = document.createElement('canvas').getContext('2d'); pen.font = `${cs.fontWeight} ${cs.fontSize} Inter`;
  const room = c.querySelector('.t10-body').getBoundingClientRect().width;
  const widest = Math.max(...name.textContent.split(/\s+|(?<=-)/).map((w) => pen.measureText(w).width));
  const top = Math.min(nr.top, kr ? kr.top : Infinity), bottom = Math.max(nr.bottom, kr ? kr.bottom : -Infinity);
  return {
    name: name.textContent,
    lines: Math.round(nr.height / parseFloat(cs.lineHeight)),
    broken: cs.whiteSpace !== 'nowrap' && widest > room + 0.5,
    out: Math.max(cr.top - top, bottom - cr.bottom),
  };
});

const browser = await webkit.launch();
const bad = [];
for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto('file://' + file);
  // Nothing on the page uses the font yet, so ask for it by name before measuring.
  await page.evaluate(() => Promise.all([document.fonts.load('800 15px Inter'), document.fonts.load('700 12px Inter')]).then(() => document.fonts.ready));
  if (!(await page.evaluate(() => document.fonts.check('800 15px Inter')))) { console.error('Inter did not load: the widths would be measured in the wrong font.'); process.exit(2); }
  const line = [];
  for (const st of STATES) {
    let two = 0, n = 0, out = 0, broken = 0;
    for (const [id, list] of Object.entries(lists)) {
      await page.evaluate((h) => { document.getElementById('root').innerHTML = h; }, render(list, st));
      for (const c of await page.evaluate(measure)) {
        n++;
        if (c.lines >= 2) two++;
        if (c.out > 0.5) { out++; bad.push(`${w}pt ${st.tag}: "${c.name}" stands ${c.out.toFixed(1)}px outside its card (${id})`); }
        if (c.broken) { broken++; if (w >= 360) bad.push(`${w}pt ${st.tag}: "${c.name}" is broken inside a word (${id})`); }
      }
    }
    line.push(`${st.tag}: ${Math.round((100 * two) / n)}% two-line${broken ? `, ${broken} broken` : ''}${out ? `, ${out} OUT` : ''}`);
  }
  console.log(`${String(w).padStart(3)}pt  ${line.join('  |  ')}`);
  await page.close();
}
await browser.close();

if (bad.length) {
  console.error(`\n✗ ${bad.length} problem(s):\n  ` + [...new Set(bad)].slice(0, 30).join('\n  '));
  process.exit(1);
}
console.log(`\n✓ ${Object.keys(lists).length} lists at ${WIDTHS.length} widths: every name inside its card, none broken inside a word from 360pt up.`);
