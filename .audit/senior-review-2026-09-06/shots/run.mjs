import { chromium } from '@playwright/test';
const OUT = '/Users/alexanderbrynolsen/ball-iq/.audit/senior-review-2026-09-06/shots';
const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.setItem('ballIQ_guestMode', 'true'); localStorage.setItem('biq_onboarded', '1'); localStorage.setItem('biq_consent', '{"analytics":false,"ads":false,"ts":1}'); } catch {} });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|googlesyndication|doubleclick/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });

async function answerUntilResults(label, max = 12) {
  for (let i = 0; i < max; i++) {
    await page.waitForTimeout(700);
    const text = await page.evaluate(() => document.body.innerText);
    if (/Back to Home|Share result|Share score/.test(text)) break;
    // pick the first answer option: a visible button that is not a chrome control
    const btns = page.locator('button:visible');
    const n = await btns.count();
    let clicked = false;
    for (let k = 0; k < n; k++) {
      const b = btns.nth(k);
      const t = ((await b.innerText()) || '').trim();
      const al = (await b.getAttribute('aria-label')) || '';
      if (!t || /^(Next|Skip|Report|Back|Go back|Leave|Cancel|Keep playing|See results|Finish|✕|×|←)/i.test(t) || /Go back|close|Report/i.test(al)) continue;
      if (t.length > 60) continue;
      await b.click({ force: true }); clicked = true; break;
    }
    if (!clicked) { console.log(label, 'no option button found at step', i); }
    await page.waitForTimeout(900);
    const next = page.locator('button', { hasText: /^(Next|See results|Finish)/ }).first();
    if (await next.count()) { try { await next.click({ timeout: 1500 }); } catch {} }
  }
  await page.waitForTimeout(1800);
}

// ── Daily 7
await page.goto(BASE + '/play?tab=home'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
await page.screenshot({ path: OUT + '/00-home.png' });
await page.locator('.todays-seven-secondary').filter({ hasText: /Daily 7/ }).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + '/01-daily-q1.png' });
await answerUntilResults('daily');
await page.screenshot({ path: OUT + '/02-daily-results-top.png' });
await page.screenshot({ path: OUT + '/03-daily-results-full.png', fullPage: true });

// ── Classic
await page.goto(BASE + '/play?tab=home'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
await page.locator('.play-card').filter({ hasText: 'Classic' }).first().click();
await page.waitForTimeout(1500);
await answerUntilResults('classic', 14);
await page.screenshot({ path: OUT + '/04-classic-results-top.png' });
await page.screenshot({ path: OUT + '/05-classic-results-full.png', fullPage: true });
console.log('errors:', errs.length ? errs.join('\n') : 'none');
await browser.close();
