// Sprint #14 Stage 2 — DailyScreen extraction verification.
//
// Originally asserted on the Sprint #15 calendar / 4-stat row / Today
// container. Sprint #16's v3 redesign replaced those with FormHero +
// Up next + matchday list. Sprint #24 ships v4 — the tactics card
// hero + restructured fixtures list. The extraction itself (Daily tab
// lives in src/screens/DailyScreen.jsx) is still what this spec
// verifies; the rendered elements just changed.

import { test, expect } from '@playwright/test';

function seedGuestMode(context) {
  return context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
    } catch {}
  });
}

// Third-party AdSense iframes throw cross-origin SecurityErrors under
// http://localhost (webkit especially) — ad-script noise, not app errors.
const AD_FRAME_NOISE = /googlesyndication|adtrafficquality|googleads|doubleclick/;

test('Daily tab — no console errors after extraction', async ({ page, context }) => {
  await seedGuestMode(context);
  const errors = [];
  page.on('pageerror', (e) => {
    if (AD_FRAME_NOISE.test(e.message)) return;
    errors.push(`pageerror: ${e.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (/Failed to load resource/.test(t)) return;
      if (AD_FRAME_NOISE.test(t)) return;
      errors.push(`console.error: ${t}`);
    }
  });

  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // In a browser tab the app's tabs are the .fd-appbar under the site
  // header (2026-09-03 web shell); native and installed PWAs keep the
  // .tab-bar / .biq-nav rail. Filter for whichever is visible.
  //
  // The text alternation is deliberate. This tab read "Daily", was renamed
  // "History" on 2026-09-06, and may be renamed again. e2e only needs to FIND
  // it; the exact wording is pinned across all three navs by
  // tests/unit/nav-label-parity.test.js. Keying this locator on the copy meant
  // a label fix turned CI red, which is why the alternation is here.
  const dailyNav = page.locator('.fd-appbar-tab, .tab-item, .biq-nav .bn-item')
    .filter({ hasText: /History|Daily/, visible: true }).first();
  await dailyNav.click();
  await page.waitForTimeout(500);

  const body = await page.evaluate(() => document.body.innerText);
  expect(body, 'error-boundary visible').not.toContain('Something went wrong');
  expect(errors, `JS errors: ${errors.join('\n')}`).toEqual([]);
});

test('Daily tab — History renders for a new player (a Today row on a phone, no rows of Home\'s)', async ({ page, context }) => {
  // 2026-09-06 (Alex's call in the app-home critique): the Daily tab is
  // HISTORY — streak, the last-14-days form and the recent-days table. The
  // four today-puzzle rows live on Home only; the tab no longer repeats them
  // ("copies the app"). Mobile and desktop variants both live in the DOM
  // (display:contents/none swap at 1024px), so every text assertion filters
  // for the visible copy.
  //
  // 26 Nov 2026: on a PHONE the tab was rebuilt from a drawing Alex approved
  // ("Yes, build it"). Today is always the first row of the list of days, each
  // game not yet finished a round play button on it, so a new player gets the
  // same screen as everyone else: the streak card at zero, one row, one quiet
  // line. The "No days yet" card and its button are gone. The wide window is
  // as it was, and Home's rows (a title, a line and a pill each) are still
  // Home's alone.
  await seedGuestMode(context);

  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Browser tab: .fd-appbar; native / PWA: .tab-bar or .biq-nav. All three read
  // "History" since 2026-09-06; the alternation tolerates a future rename, and
  // tests/unit/nav-label-parity.test.js is what pins the actual wording.
  const dailyNav = page.locator('.fd-appbar-tab, .tab-item, .biq-nav .bn-item')
    .filter({ hasText: /Daily|History/, visible: true }).first();
  await dailyNav.click();
  await page.waitForTimeout(400);

  await expect(page.locator('.daily-screen')).toBeVisible();
  await expect(page.getByText('History', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/New puzzles in/i).filter({ visible: true }).first()).toBeVisible();
  // The label over the days is on both layouts now: a phone's list always has
  // its Today row, so it is never a header over no table.
  const wide = (page.viewportSize()?.width || 0) >= 1024;
  await expect(page.getByText(/Recent days/i).filter({ visible: true }).first()).toBeVisible();

  if (wide) {
    // The wide window, unchanged: this guest has played nothing, so its streak
    // card is ABSENT (the gate is hasFormHistory in DailyScreen.jsx), and the
    // recent-days table shows its empty state rather than a header over a
    // single all-dashes row. The phone column is display:none here, so its
    // own streak card and squares are not counted by any of these.
    await expect(page.getByText(/day streak/i).filter({ visible: true })).toHaveCount(0);
    await expect(page.getByText(/Play today, then your recent days show up here/i)
      .filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('.daily-desktop .hr-streak')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Form — last 14 days' })).toHaveCount(0);
  } else {
    // A phone: the streak card is ALWAYS there, at zero too, with its 14
    // squares; under it the Today row offers today's games (two at least:
    // Footle and the Daily 7 run every day, the other two only on days they
    // have an answer), then the one line that says what the card will hold.
    const phone = page.locator('.daily-col-mobile');
    await expect(phone.getByText('0 day streak').first()).toBeVisible();
    await expect(phone.getByText('Play one puzzle to light it', { exact: true })).toBeVisible();
    const form = page.getByRole('group', { name: 'Form — last 14 days' });
    await expect(form).toHaveCount(1);
    await expect(form.locator('span')).toHaveCount(14);
    await expect(phone.getByText('Each day you play gets a row here', { exact: true })).toBeVisible();
    const plays = phone.getByRole('button', { name: /Play today.s / });
    await expect(plays.first()).toBeVisible();
    expect(await plays.count()).toBeGreaterThanOrEqual(2);
    await expect(phone.locator('.hs-row')).toHaveCount(1);
    // 26 Nov 2026, the sixth drawing (Alex, of the first build: "it does not pass the eye test";
    // of this one: "Yes, build it"). The four games head their columns inside the card as their
    // own icons, each an image with the game's name (the coloured words are gone); the title and
    // the countdown are one block; and in a browser tab, which is where this test runs, that row
    // has no gear or bell of its own: the website's bar above carries them.
    await expect(phone.getByRole('img', { name: 'Footle', exact: true })).toBeVisible();
    await expect(phone.getByRole('img', { name: 'Daily 7', exact: true })).toBeVisible();
    await expect(phone.getByText('FOOTLE', { exact: true })).toHaveCount(0);
    await expect(phone.locator('.hs-top .hs-title')).toHaveText('History');
    await expect(phone.locator('.hs-tools')).toHaveCount(0);
    await expect(page.getByText('No days yet', { exact: true })).toHaveCount(0);
  }

  // Home's rows must NOT appear in THIS screen: their sublines are the tell
  // (Home stays mounted but hidden behind the tab switch, so scope to the
  // screen).
  await expect(page.locator('.daily-screen').getByText('7 questions · ~3 min')).toHaveCount(0);
  await expect(page.locator('.daily-screen').getByText(/Surname of a footballer/i)).toHaveCount(0);

  // v4 elements that MUST be gone — guard against accidental revival.
  await expect(page.locator('.tactics-card')).toHaveCount(0);
  await expect(page.locator('.daily-greet')).toHaveCount(0);

  // v3 elements that MUST be gone — guard against accidental revival.
  await expect(page.locator('.form-hero')).toHaveCount(0);
  await expect(page.locator('.run-chip')).toHaveCount(0);
  await expect(page.locator('.up-next')).toHaveCount(0);
  await expect(page.locator('.stats-footer')).toHaveCount(0);
  await expect(page.locator('.md-row')).toHaveCount(0);
  await expect(page.getByText(/Friendlies|Between fixtures|Tomorrow's Daily/i)).toHaveCount(0);

  // Older artefacts that were removed in earlier sprints
  await expect(page.locator('.daily-stats-row')).toHaveCount(0);
  await expect(page.locator('.cal-grid')).toHaveCount(0);
  await expect(page.locator('.streak-hero')).toHaveCount(0);
  await expect(page.locator('.daily-zone[aria-label="Today"]')).toHaveCount(0);
});

test('Daily tab — a player WITH history still gets the streak strip', async ({ page, context }) => {
  // The negative control for the test above. Gating the wide window's card on
  // hasFormHistory is only correct if it still opens; a gate stuck shut would
  // satisfy every "absent" assertion in this file and silently delete the
  // habit surface for the players who actually have a streak. (A phone's card
  // has had no gate since 26 Nov 2026; there this checks its squares and that
  // the played days are rows under Today.)
  await seedGuestMode(context);
  await context.addInitScript(() => {
    try {
      const d = (n) => {
        const t = new Date();
        t.setDate(t.getDate() - n);
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
      };
      // Three completed Footle days. The strip reads local puzzle history, so
      // this is what a real player who has played the last three days has.
      for (const n of [1, 2, 3]) {
        localStorage.setItem(`biq_wordle_${d(n)}`, JSON.stringify({ status: 'won', guesses: ['SALAH'], answer: 'SALAH' }));
      }
    } catch {}
  });

  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  const dailyNav = page.locator('.fd-appbar-tab, .tab-item, .biq-nav .bn-item')
    .filter({ hasText: /History|Daily/, visible: true }).first();
  await dailyNav.click();
  await page.waitForTimeout(400);

  await expect(page.locator('.daily-screen')).toBeVisible();

  const isDesktop = await page.locator('.daily-desktop').isVisible();
  if (isDesktop) {
    const streak = page.locator('.daily-desktop .hr-streak');
    await expect(streak).toBeVisible();
    await expect(streak.locator('.hr-form-cell')).toHaveCount(14);
  } else {
    const form = page.getByRole('group', { name: 'Form — last 14 days' }).filter({ visible: true }).first();
    await expect(form).toBeVisible();
    await expect(form.locator('span')).toHaveCount(14);
  }

  // And the recent-days table shows real rows instead of its empty state.
  // The wide window leaves today out by name, so its rows are the three seeded
  // days; a phone lists Today first and then the three.
  await expect(page.getByText(/Play today, then your recent days show up here/i)).toHaveCount(0);
  if (!isDesktop) {
    await expect(page.locator('.daily-col-mobile .hs-row')).toHaveCount(4);
    await expect(page.getByText('Each day you play gets a row here', { exact: true })).toHaveCount(0);
  }
});
