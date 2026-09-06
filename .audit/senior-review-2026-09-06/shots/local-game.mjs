import { chromium } from '@playwright/test';
const OUT = process.cwd() + '/.audit/senior-review-2026-09-06/shots';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.setItem('ballIQ_guestMode', 'true'); localStorage.setItem('biq_onboarded', '1'); localStorage.setItem('biq_consent', '{"analytics":false,"ads":false,"ts":1}'); } catch {} });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => { if (!/Unexpected token '<'/.test(e.message)) errs.push(e.message); });
await page.goto('http://localhost:5173/play?tab=online'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
await page.getByText('Local pass & play').locator('xpath=ancestor::div[2]').getByRole('button', { name: 'Play' }).first().click(); await page.waitForTimeout(600);
await page.locator('.local-count-btn', { hasText: '3' }).click();
await page.locator('.local-mode-chip', { hasText: 'Sprint' }).click();
await page.getByRole('button', { name: /Start with 3 players/ }).click(); await page.waitForTimeout(800);
let shotReveal = false, shotSummary = false;
for (let step = 0; step < 40; step++) {
  await page.waitForTimeout(500);
  const text = await page.evaluate(() => document.body.innerText);
  if (/wins|It's a tie|Game over/.test(text)) break;
  if (/Correct:/.test(text) && !shotReveal) { await page.screenshot({ path: OUT + '/12-local-reveal.png' }); shotReveal = true; }
  if (/After Q/.test(text) && !shotSummary) { await page.screenshot({ path: OUT + '/12b-local-summary.png' }); shotSummary = true; }
  const ready = page.getByRole('button', { name: /I'm Ready/ });
  if (await ready.count()) { await ready.first().click(); await page.waitForTimeout(500); continue; }
  const opts = page.locator('button:visible:not([aria-label="Go back"])').filter({ hasNotText: /Ready|Report|Next|Decline|Allow|Privacy/ });
  if (await opts.count()) { await opts.first().click({ force: true }); }
  await page.waitForTimeout(1200);
}
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT + '/15-local-podium.png', fullPage: true });
console.log('reveal:', shotReveal, 'summary:', shotSummary, 'errors:', errs.length ? errs.join(' | ') : 'none');
await browser.close();
