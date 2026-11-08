#!/usr/bin/env node
// The social daily kit (8 Nov 2026, from the 7 Nov plan): today's puzzles as
// ready-to-post portrait images, captured from the LIVE site so they always
// match what players get. Answers are never on them: Transfer Trail shows its
// opening clubs, Top 10 its title and empty list, Footle its empty board.
//
//   node scripts/daily-kit.mjs                 # today's puzzles
//   node scripts/daily-kit.mjs --out <dir>     # default ~/ball-iq-audit/daily-kit/<date>/
//
// It plays nothing: it opens each game and photographs the board before the
// first guess, so no result row is sent and nobody's numbers move. The
// consent banner is answered "no" before the page loads.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const BASE = process.env.KIT_BASE || 'https://balliq.app';
const today = new Date();
const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const outArg = process.argv.indexOf('--out');
const OUT = outArg > 0 ? process.argv[outArg + 1] : join(homedir(), 'ball-iq-audit', 'daily-kit', ymd);
mkdirSync(OUT, { recursive: true });

const GAMES = [
  { key: 'trail', path: '/play?game=trail', file: 'transfer-trail.png' },
  { key: 'top10', path: '/play?game=top10', file: 'top-10.png' },
  { key: 'footle', path: '/play?game=footle', file: 'footle.png' },
];

const launchOpts = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const browser = await chromium.launch(launchOpts);
// 1080x1350 (Instagram portrait) as 360x450 at 3x.
const ctx = await browser.newContext({ viewport: { width: 360, height: 450 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'en-GB' });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('biq_consent_analytics', 'denied');
    localStorage.setItem('biq_onboarded', '1');
    // Installed-app look: the bottom bar and no website header.
    Object.defineProperty(navigator, 'standalone', { get: () => true });
    const mm = window.matchMedia.bind(window);
    window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, onchange: null } : mm(q));
  } catch {}
});
// Never send a result or an event from the kit: drop calls to the database.
await ctx.route(/supabase\.co\/rest\/v1\/rpc\/(record_|log_)/, (r) => r.fulfill({ status: 204, body: '' }));

const made = [];
for (const g of GAMES) {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + g.path, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((e) => /^(Skip|Decline|Not now)$/.test(e.textContent.trim()));
      b?.click();
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: join(OUT, g.file) });
    made.push(join(OUT, g.file));
  } catch (e) {
    console.error(`✗ ${g.key}: ${e.message.split('\n')[0]}`);
  } finally {
    await page.close();
  }
}
await browser.close();
for (const f of made) console.log('✓', f);
if (!made.length) process.exit(1);
