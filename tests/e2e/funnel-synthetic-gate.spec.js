/**
 * Synthetic traffic must never reach the funnel.
 *
 * Origin, measured 2026-08-21: three hours after funnel_events went live it
 * held 905 rows, 767 of them `first-game-started` at ~250/hour, exactly one
 * per visitor, arriving in precisely the hours this suite was running — against
 * a real DAU of 13-17. The e2e suite runs against localhost, localhost reads
 * .env.local, and .env.local points at PRODUCTION Supabase because there is no
 * staging project. The suite was corrupting the instrument the product's
 * decisions come from, at roughly 50 synthetic rows per real one.
 *
 * ⚠️ THIS TEST MUST ACTUALLY ENTER A GAME. The first version only loaded
 * /play, asserted zero writes, and passed — including with the gate
 * deliberately disabled, because `first-game-started` fires on the PLAYING
 * state, not on page load. It proved nothing. Verified the current version by
 * disabling the gate and watching it fail.
 */
import { test, expect } from '@playwright/test';

test('automated traffic never reaches the funnel', async ({ page }) => {
  const funnelWrites = [];
  page.on('request', (r) => {
    if (/record_funnel_event/.test(r.url())) funnelWrites.push(r.url());
  });

  // Same seeding the other 40 specs use: guest mode + onboarding done, so we
  // land on Home rather than the onboarding overlay.
  await page.context().addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
      localStorage.setItem('biq_consent_analytics', 'denied');
      // The event is once-per-device; a stale flag would make this vacuous.
      localStorage.removeItem('biq_first_game_started');
    } catch { /* private mode */ }
  });

  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // The gate keys off navigator.webdriver, so if this is ever false the test
  // is not testing what it claims to.
  expect(
    await page.evaluate(() => navigator.webdriver),
    'only meaningful under automation',
  ).toBe(true);

  // Enter a game — this is what sets `playing` and fires first-game-started.
  // Survival starts directly (Classic opens a difficulty picker first).
  await page.locator('.play-card').filter({ hasText: 'Survival' }).first().click();

  // Confirm we really are in a game, so a silent navigation failure cannot
  // masquerade as "the gate worked".
  await expect
    .poll(async () => page.evaluate(() => document.body.classList.contains('in-focused-play')), {
      timeout: 15_000,
    })
    .toBe(true);

  await page.waitForTimeout(2000);

  expect(
    funnelWrites,
    `a robot wrote ${funnelWrites.length} row(s) into the production funnel`,
  ).toEqual([]);
});

/**
 * The same rule, on the OTHER table — the one that had no gate at all.
 *
 * club_quiz_results is written by logRound() in scripts/seo/club-quiz-engine.js,
 * which sat 56 lines below bqSynthetic() and never called it, while bqev() in
 * the same finish() did. That table is not decoration: the front door orders
 * its club list by these counts and the thin-pack question trade is argued
 * from them.
 *
 * ⚠️ Like the test above, this one MUST reach the end of a quiz. logRound only
 * fires from finish(); a version that loads the page and asserts zero writes
 * would pass with the gate torn out.
 */
test('automated traffic never reaches club_quiz_results', async ({ page }) => {
  // Playing ten questions with a click each side of every step exceeds the
  // 30s default; the first run of this test died as "browser has been closed",
  // which reads like a crash and is only a timeout.
  test.setTimeout(90_000);
  const clubWrites = [];
  page.on('request', (r) => {
    if (/log_club_quiz/.test(r.url())) clubWrites.push(r.url());
  });

  await page.context().addInitScript(() => {
    try { localStorage.setItem('biq_consent_analytics', 'denied'); } catch { /* private mode */ }
  });

  // A STATIC page from dist, not the SPA — this engine ships only on generated
  // pages. If the base URL ever points at the dev server the catch-all serves
  // the app instead, and the assertion below about .bq-o catches that.
  await page.goto('/quiz/arsenal/');
  await page.waitForLoadState('networkidle');

  expect(
    await page.evaluate(() => navigator.webdriver),
    'only meaningful under automation',
  ).toBe(true);

  // Play the whole run inside the page.
  //
  // Driving it with Playwright locators cost 5s per unresolved click and blew
  // a 90s budget without finishing; the engine's own DOM is right here and the
  // thing under test is the NETWORK, which Playwright still observes either
  // way. The engine shows one question at a time by toggling the `hidden`
  // ATTRIBUTE (club-quiz-engine.js show()), so :not([hidden]) is what tracks
  // it -- a visibility-based selector looked right and silently stalled after
  // one question, which is how an earlier version of this test "passed".
  const played = await page.evaluate(async () => {
    const sleep = (m) => new Promise((r) => setTimeout(r, m));
    let answered = 0;
    for (let i = 0; i < 40; i++) {
      const q = document.querySelector('.bq-q:not([hidden])');
      if (!q) break;
      const o = q.querySelector('.bq-o:not(.ok):not(.no)');
      if (o) { o.click(); answered++; await sleep(150); }
      const n = document.querySelector('.bq-next:not([hidden])');
      if (n) { n.click(); await sleep(150); }
      if (document.querySelector('.bq-res:not([hidden])')) break;
    }
    const res = document.querySelector('.bq-res:not([hidden])');
    return { answered, finished: !!res, score: res?.querySelector('.bq-big')?.textContent || null };
  });

  // Prove the run reached finish(), the only place logRound is called. Without
  // this the "zero writes" below would be satisfied by never starting.
  expect(played.finished, `only answered ${played.answered} question(s) and never reached the result screen`).toBe(true);
  expect(played.answered, 'a full run is ten questions').toBeGreaterThanOrEqual(10);

  await page.waitForTimeout(1500);

  expect(
    clubWrites,
    `a robot wrote ${clubWrites.length} row(s) into club_quiz_results`,
  ).toEqual([]);
});
