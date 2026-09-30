// SHQ card templates (from the Magic Patterns design "SHQ card templates", rebuilt as parameterised HTML → PNG 1080×1350).
//   node social/cards.mjs --type daily|receipt|table|triptych|quote --data card.json --out out.png [--bg photo.jpg]
//   node social/cards.mjs --demo  → renders the five sample cards into social/state/media/cards_demo/
// Look: near-black, signal red #FF2D2D + highlight yellow #FFD60A, Anton headlines, Inter body, JetBrains Mono receipts, SHQ badge bottom-left.
// No photo credits are drawn on cards (Alex 09-29). Photos are passed as files (--bg for quote, data.photos[] for triptych).
import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const img = (f) => (f ? `data:image/${/png$/i.test(f) ? 'png' : 'jpeg'};base64,${fs.readFileSync(f).toString('base64')}` : '');
const CSS = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{width:1080px;height:1350px;background:#0A0A0A;color:#fff;font-family:Inter,system-ui,sans-serif;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased}
.d{font-family:Anton,Impact,sans-serif;text-transform:uppercase;line-height:.95}.pill{display:inline-block;border-radius:999px;padding:14px 36px 10px;font-family:Anton,Impact;font-size:44px;text-transform:uppercase;line-height:1;letter-spacing:.02em}
.red{background:#FF2D2D;color:#fff}.yel{background:#FFD60A;color:#0A0A0A}.foot{position:absolute;left:72px;right:72px;bottom:72px;display:flex;align-items:center;gap:24px}
.badge{width:104px;height:104px;border-radius:50%;background:#0A0A0A;box-shadow:inset 0 0 0 4px #fff;display:flex;flex-direction:column;align-items:center;justify-content:center}.badge b{font-family:Anton;font-size:35px;letter-spacing:.03em;line-height:1}.badge i{width:20px;height:20px;border-radius:50%;background:#fff;margin-top:5px}
.tag{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin-top:10px;text-align:center}.handle{font-size:30px;font-weight:700;letter-spacing:-.01em}
.wrap{position:absolute;inset:0;padding:72px 72px 240px}`;
const badge = (light) => `<div style="display:flex;flex-direction:column;align-items:center"><div class="badge" ${light ? 'style="box-shadow:inset 0 0 0 4px #0A0A0A;background:#fff;color:#0A0A0A"' : ''}><b>SHQ</b><i ${light ? 'style="background:#0A0A0A"' : ''}></i></div></div>`;
const foot = `<div class="foot">${badge()}<span class="handle">@shithouseryhq</span></div>`;
const T = {
  daily: (d) => `<div class="wrap" style="display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;align-items:center"><span class="pill red">${esc(d.label)}</span><span style="font-family:'JetBrains Mono';font-size:24px;color:rgba(255,255,255,.45)">${esc(d.date || '')}</span></div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center"><p style="font-size:46px;font-weight:600;line-height:1.2;color:rgba(255,255,255,.8);letter-spacing:-.01em">${d.setup.map(esc).join('<br>')}</p>
    <p class="d" style="font-size:${d.number.length > 6 ? 250 : d.number.length > 4 ? 330 : 380}px;margin:24px 0 0 -8px">${esc(d.number)}</p><div style="height:6px;width:160px;background:#FF2D2D;margin-top:32px"></div>
    <p style="font-size:46px;font-weight:800;line-height:1.2;margin-top:32px;letter-spacing:-.01em">${esc(d.punchline).replace(esc(d.highlight || '\u0000'), `<mark style="background:#FFD60A;color:#0A0A0A;padding:0 8px">${esc(d.highlight || '')}</mark>`)}</p></div></div>${foot}`,
  receipt: (d) => `<div style="padding:72px"><h2 class="d" style="font-size:104px">${esc(d.title.split(' ').slice(0, -1).join(' '))} <span style="color:#FF2D2D">${esc(d.title.split(' ').slice(-1))}</span></h2></div>
    <div style="position:absolute;left:140px;top:250px;width:800px;transform:rotate(-1.5deg)"><div style="background:#F3EFE6;padding:40px 56px;font-family:'JetBrains Mono';color:#0A0A0A"><p style="text-align:center;font-size:30px;font-weight:700;letter-spacing:.08em">${esc(d.store || 'SHITHOUSERY HQ STORES')}</p><p style="text-align:center;font-size:22px;opacity:.6;margin-top:8px">${esc(d.order || '')}</p>
    <hr style="border:0;border-top:3px dashed rgba(10,10,10,.4);margin:24px 0"><div style="display:grid;grid-template-columns:1fr 200px 140px;font-size:20px;font-weight:700;letter-spacing:.1em;opacity:.55"><span>${esc((d.head||[])[0]||'PLAYER')}</span><span>${esc((d.head||[])[1]||'CLUB')}</span><span style="text-align:right">${esc((d.head||[])[2]||'FEE')}</span></div><hr style="border:0;border-top:3px dashed rgba(10,10,10,.4);margin:24px 0">
    ${d.rows.map((r) => `<div style="display:grid;grid-template-columns:1fr 200px 140px;font-size:30px;margin-bottom:24px"><b>${esc(r[0])}</b><span>${esc(r[1])}</span><span style="text-align:right">${esc(r[2])}</span></div>`).join('')}
    <hr style="border:0;border-top:3px dashed rgba(10,10,10,.4);margin:24px 0"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:34px;letter-spacing:.08em">TOTAL</b><b style="font-size:56px">${esc(d.total)}</b></div><hr style="border:0;border-top:3px dashed rgba(10,10,10,.4);margin:24px 0">
    <div style="text-align:center;font-size:22px;opacity:.6">${(d.footer || []).map(esc).join('<br>')}<div style="font-size:26px;letter-spacing:.3em;margin-top:16px;opacity:.9">||| || ||| | |||| ||</div></div></div>
    <div style="position:absolute;right:-30px;bottom:-40px;transform:rotate(-12deg);border:6px solid #FF2D2D;padding:14px 24px 8px"><div style="border:2px solid #FF2D2D;padding:10px 20px 4px"><span class="d" style="font-size:84px;color:#FF2D2D;white-space:nowrap">${esc(d.stamp || 'Refunds: None')}</span></div></div></div>${foot}`,
  table: (d) => `<div style="padding:72px"><span class="pill yel" style="font-size:40px">${esc(d.tag || 'Table Roast')}</span><div style="margin-top:48px;border-radius:28px;overflow:hidden;background:#161616">
    <div style="display:grid;grid-template-columns:88px 1fr 96px 120px 120px;padding:24px 32px;font-size:24px;font-weight:600;letter-spacing:.12em;color:rgba(255,255,255,.45);text-transform:uppercase"><span>Pos</span><span>Club</span><span style="text-align:center">P</span><span style="text-align:center">GD</span><span style="text-align:right">Pts</span></div>
    ${d.rows.map((r) => `<div style="display:grid;grid-template-columns:88px 1fr 96px 120px 120px;height:104px;align-items:center;padding:0 32px;font-size:38px;border-top:1px solid ${r.roast ? '#FF2D2D' : '#2A2A2A'};background:${r.roast ? '#FF2D2D' : 'transparent'};font-weight:${r.roast ? 800 : 600}"><span class="d" style="font-size:44px">${r.pos}</span><span style="display:flex;align-items:center;gap:20px"><span style="width:44px;height:44px;border-radius:50%;background:${r.roast ? 'rgba(255,255,255,.3)' : '#2E2E2E'}"></span>${esc(r.club)}</span><span style="text-align:center">${r.p ?? ''}</span><span style="text-align:center">${esc(r.gd ?? '')}</span><span class="d" style="text-align:right;font-size:48px">${r.pts}</span></div>`).join('')}</div>
    <h2 class="d" style="font-size:128px;margin-top:56px">${esc(d.caption[0])}<br><span style="color:#FFD60A">${esc(d.caption[1])}</span></h2><p style="font-size:36px;font-weight:600;color:rgba(255,255,255,.75);margin-top:20px">${esc(d.sub || '')}</p></div>${foot}`,
  triptych: (d) => `<div style="padding:72px"><h2 class="d" style="font-size:112px">${esc(d.headline)}</h2><p style="font-size:36px;font-weight:600;color:rgba(255,255,255,.75);margin-top:16px">${esc(d.sub || '')}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:48px">${d.photos.map((p) => `<div style="position:relative;height:640px;background:#2E2E2E ${p.file ? `url(${img(p.file)}) center/cover` : ''}"><span style="position:absolute;left:20px;top:20px;background:rgba(10,10,10,.8);border-radius:999px;padding:8px 16px;font-family:'JetBrains Mono';font-size:20px">${esc(p.year || '')}</span><span class="d" style="position:absolute;left:0;right:0;bottom:0;background:rgba(10,10,10,.8);padding:16px;text-align:center;font-size:34px">${esc(p.club)}</span></div>`).join('')}</div>
    <div style="height:104px;background:#FF2D2D;display:flex;align-items:center;justify-content:center"><p class="d" style="font-size:46px;white-space:nowrap">${esc(d.lead || '')} ${d.clubs.map(esc).join('<span style="color:#FFD60A;padding:0 12px">/</span>')}</p></div></div>${foot}`,
  quote: (d, bg) => `<div style="position:absolute;inset:0;background:#2E2E2E ${bg ? `url(${img(bg)}) center/cover` : ''}"></div><span class="pill red" style="position:absolute;left:72px;top:72px;font-size:40px;padding:12px 32px 8px">${esc(d.tag || '')}</span>
    <div style="position:absolute;left:72px;right:72px;bottom:72px;border-radius:36px;background:#fff;color:#0A0A0A;padding:48px"><div style="display:flex;align-items:center;gap:20px">${badge(true)}<div><div style="font-size:34px;font-weight:800;letter-spacing:-.01em">Shithousery HQ</div><div style="font-size:28px;font-weight:500;opacity:.5">@shithouseryhq</div></div></div>
    <p style="font-size:52px;font-weight:800;line-height:1.15;letter-spacing:-.02em;margin-top:32px">${esc(d.joke)}</p><div style="margin-top:32px;border-top:1px solid rgba(10,10,10,.1);padding-top:24px;display:flex;justify-content:space-between;font-size:26px;font-weight:500;opacity:.55"><span>${esc(d.meta || '')}</span><span style="font-size:22px;font-weight:700;letter-spacing:.18em;text-transform:uppercase">Football Humor</span></div></div>`,
};
const DEMO = {
  daily: { label: 'The Daily Number #12', date: '30.09.26', setup: ['Tottenham spent £300m+ this summer.', 'League points so far: 2. Cost per point:'], number: '£150m', punchline: 'That is a lot of money for a draw.', highlight: 'a draw' },
  receipt: { title: 'Deadline Day Damage', order: 'ORDER #0029 · 23:59:58', rows: [['D. SIDEWAYS', 'ROVERS', '£85M'], ['K. HAMSTRING', 'CITY', '£62M'], ['J. LOANBACK', 'ATHLETIC', '£48M']], total: '£195M', footer: ['PAYMENT: VIBES', 'THANK YOU FOR PANIC BUYING'], stamp: 'Refunds: None' },
  table: { rows: [{ pos: 9, club: 'Rovers', p: 7, gd: '+2', pts: 11 }, { pos: 10, club: 'Athletic', p: 7, gd: '0', pts: 10 }, { pos: 11, club: 'Money FC', p: 7, gd: '-6', pts: 8, roast: true }, { pos: 12, club: 'Wanderers', p: 7, gd: '-7', pts: 8 }], caption: ['£1.2bn spent.', '11th place.'], sub: 'Net spend is a lifestyle, not a strategy.' },
  triptych: { headline: 'The Loyalty Tour', sub: 'Badges kissed: 3. Contracts honoured: 0.', photos: [{ club: 'Club A', year: '2019' }, { club: 'Club B', year: '2022' }, { club: 'Club C', year: '2025' }], lead: 'Player at', clubs: ['Rovers', 'Athletic', 'Money FC'] },
  quote: { tag: 'Caught in 4K', joke: 'Not a dive. He was just checking the pitch was still there.', meta: '9:41 PM · 29 Sep 2026' },
};
async function render(type, data, out, bg) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.setContent(`<html><head><style>${CSS}</style></head><body>${T[type](data, bg)}</body></html>`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: out }); await b.close();
}
if (process.argv.includes('--demo')) {
  const dir = new URL('./state/media/cards_demo/', import.meta.url).pathname; fs.mkdirSync(dir, { recursive: true });
  for (const [t, d] of Object.entries(DEMO)) { await render(t, d, path.join(dir, t + '.png')); console.log('✅', t); }
} else if (arg('type') && arg('data') && arg('out')) { await render(arg('type'), JSON.parse(fs.readFileSync(arg('data'), 'utf8')), arg('out'), arg('bg')); console.log('✅', arg('out')); }
else console.error('usage: cards.mjs --type … --data card.json --out out.png [--bg photo] | --demo');
