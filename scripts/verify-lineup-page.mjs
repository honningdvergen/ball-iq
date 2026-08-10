import { webkit } from '@playwright/test';
import { existsSync, statSync } from 'fs';
const b = await webkit.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [], failed = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
// Count image requests that FAIL, not just console noise — a fallback can hide
// a 100% failure rate behind a page that looks correct.
p.on('response', r => { if (!r.ok() && /wikimedia/.test(r.url())) failed.push(r.status() + ' ' + r.url().slice(0,90)); });
await p.goto('http://localhost:8899/lineup/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
console.log('boot:', JSON.stringify(await p.evaluate(() => ({
  clubFilterGone: !document.getElementById('clubFilter'),
  poolSize: (document.getElementById('sheetSub').textContent || '').trim(),
  formations: document.getElementById('form').options.length,
  formDefault: document.getElementById('form').value,
  slots: document.querySelectorAll('.slot').length,
}))));
// Search must find an accented marquee name typed without accents.
await p.locator('.slot').nth(0).click(); await p.waitForTimeout(250);
await p.locator('#search').fill('sesko'); await p.waitForTimeout(350);
console.log('search "sesko" ->', await p.evaluate(() => {
  const b = document.querySelector('.opt b'); return b ? b.textContent : 'NO RESULTS'; }));
await p.locator('#closeSheet').click();
await p.waitForTimeout(150);
for (let i = 0; i < 11; i++) {
  await p.locator('.slot').nth(i).click(); await p.waitForTimeout(200);
  const o = p.locator('.opt').first();
  if (await o.count()) { await o.click(); await p.waitForTimeout(160); } else await p.locator('#closeSheet').click();
}
await p.locator('#teamName').fill('Dream XI');
await p.waitForTimeout(2500);
console.log('filled:', await p.evaluate(() => document.getElementById('foot').textContent));
// EXPORT — the tainted-canvas failure would surface exactly here.
const dl = p.waitForEvent('download', { timeout: 60000 }).catch(() => null);
await p.locator('#download').click();
const d = await dl;
if (d) { const f = '/tmp/lineup-export.png'; await d.saveAs(f);
  console.log('export: OK ->', d.suggestedFilename(), statSync(f).size + ' bytes'); }
else console.log('export: FAILED — button says "' + await p.locator('#download').textContent() + '"');
// Share link must restore the same XI in a clean context.
const link = await p.evaluate(() => { const b=document.getElementById('copyLink'); b.click();
  return document.getElementById('linkOut').value || location.href; });
const names = await p.evaluate(() => [...document.querySelectorAll('.nm')].map(n=>n.textContent).join(','));
const p2 = await b.newPage({ viewport: { width: 390, height: 844 } });
await p2.goto(link.replace('http://localhost:8899','http://localhost:8899'), { waitUntil: 'networkidle' });
await p2.waitForTimeout(2200);
const names2 = await p2.evaluate(() => [...document.querySelectorAll('.nm')].map(n=>n.textContent).join(','));
console.log('share link restores XI:', names && names === names2 ? 'YES' : 'NO\n  was: '+names+'\n  got: '+names2);
await p.screenshot({ path: '/tmp/lineup-v2.png', fullPage: true });
console.log('failed image requests:', failed.length);
if (failed.length) failed.slice(0,3).forEach(f => console.log('   ' + f));
console.log('console errors:', errs.length ? errs.slice(0,3) : 'none');
await b.close();
