import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.setItem('ballIQ_guestMode', 'true'); localStorage.setItem('biq_onboarded', '1'); localStorage.setItem('biq_xp', '120'); localStorage.setItem('biq_consent', '{"analytics":false,"ads":false,"ts":1}'); } catch {} });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/play?tab=home'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
await page.locator('.todays-seven-secondary').filter({ hasText: /Daily 7/ }).first().click(); await page.waitForTimeout(1500);
for (let i = 0; i < 9; i++) {
  const text = await page.evaluate(() => document.body.innerText); if (/Back to Home/.test(text)) break;
  const btns = page.locator('button:visible'); const n = await btns.count();
  for (let k = 0; k < n; k++) { const b = btns.nth(k); const t = ((await b.innerText()) || '').trim(); const al = (await b.getAttribute('aria-label')) || ''; if (!t || /^(Next|Skip|Report|Back|Go back|✕|×|←)/i.test(t) || /Go back|close|Report/i.test(al) || t.length > 60) continue; await b.click({ force: true }); break; }
  await page.waitForTimeout(900); const next = page.locator('button', { hasText: /^Next/ }).first(); if (await next.count()) { try { await next.click({ timeout: 1500 }); } catch {} }
}
await page.waitForTimeout(1500);
const text = await page.evaluate(() => document.body.innerText);
console.log('xp in storage:', await page.evaluate(() => localStorage.getItem('biq_xp')));
console.log('save row present:', /on this phone only/.test(text), '| line:', (text.match(/[^\n]*on this phone only[^\n]*/) || [''])[0]);
await page.screenshot({ path: '/Users/alexanderbrynolsen/ball-iq/.audit/senior-review-2026-09-06/shots/06-daily-results-guest-xp.png', fullPage: true });
await browser.close();
