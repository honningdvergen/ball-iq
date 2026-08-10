// verify-lineup-prefill.mjs — pre-fill must produce a CURRENT XI.
// Alex's Man United test is the regression: filtering the fame pool by club led
// with Rooney and Fellaini, because that club label means "known for".
import { webkit } from '@playwright/test';
const b = await webkit.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', e => console.log('PAGEERROR:', e.message));
await p.goto('http://localhost:8899/lineup/#f=4-3-3&p=0-0-0-0-0-0-0-0-0-0-0', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
for (const club of ['Manchester United', 'Arsenal', 'Liverpool']) {
  await p.selectOption('#loadTeam', club);
  await p.waitForTimeout(900);
  const names = await p.evaluate(() => [...document.querySelectorAll('.nm')].map(n => n.textContent));
  console.log(`${club.padEnd(18)} ${names.length}/11 — ${names.join(', ')}`);
}
const stale = ['Rooney', 'Fellaini', 'Smalling', 'Rojo', 'Hernández', 'Mata'];
const mu = await p.evaluate(() => [...document.querySelectorAll('.nm')].map(n => n.textContent).join(' '));
await p.selectOption('#loadTeam', 'Manchester United');
await p.waitForTimeout(900);
const mu2 = await p.evaluate(() => [...document.querySelectorAll('.nm')].map(n => n.textContent).join(' '));
console.log('\nretired United names present:', stale.filter(n => mu2.includes(n)).join(', ') || 'NONE');
await b.close();
