import { chromium } from '@playwright/test';
const OUT = process.cwd() + '/.audit/senior-review-2026-09-06/shots';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.setItem('ballIQ_guestMode', 'true'); localStorage.setItem('biq_onboarded', '1'); localStorage.setItem('biq_consent', '{"analytics":false,"ads":false,"ts":1}'); localStorage.setItem('biq_clarity_consent', 'declined'); } catch {} });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:5173/play?tab=online'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
await page.getByText('Local pass & play').locator('xpath=ancestor::div[2]').getByRole('button', { name: 'Play' }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: OUT + '/10-local-setup.png', fullPage: true });
await page.locator('.local-count-btn', { hasText: '3' }).click();
await page.getByRole('button', { name: /Start with 3 players/ }).click(); await page.waitForTimeout(900);
await page.screenshot({ path: OUT + '/11-local-handoff.png' });
await page.getByRole('button', { name: /I'm Ready/ }).click(); await page.waitForTimeout(900);
// answer three questions (one chunk) to reach the reveal + summary
for (let i = 0; i < 3; i++) { const b = page.locator('button:visible').filter({ hasNotText: /Ready|Go back|Report|Next/ }).nth(0); await b.click({ force: true }); await page.waitForTimeout(1200); }
await page.screenshot({ path: OUT + '/12-local-reveal.png' });
// report sheet from a Classic round
await page.goto('http://localhost:5173/play?tab=home'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
await page.locator('.play-card').filter({ hasText: 'Classic' }).first().click(); await page.waitForTimeout(1500);
const opt = page.locator('button:visible').filter({ hasNotText: /Go back|Report|Next|←/ }).nth(0); await opt.click({ force: true }); await page.waitForTimeout(900);
await page.screenshot({ path: OUT + '/13-quiz-answered-flag.png' });
await page.getByRole('button', { name: /Report a problem/ }).click(); await page.waitForTimeout(600);
await page.screenshot({ path: OUT + '/14-report-sheet.png' });
console.log('errors:', errs.length ? errs.join(' | ') : 'none');
await browser.close();
