// Ghost-name capture on the Daily 7 share.
//
// The growth loop's whole value is that the recipient knows WHO challenged
// them. Both link builders carried an optional name for months and nothing
// ever asked for one, so guests shared anonymous links. This asserts the
// three behaviours that make the capture worth having:
//
//   1. A nameless sharer is ASKED (not shipped anonymous).
//   2. The name they give reaches the /c/ token in the shared text.
//   3. Answering once is enough — the second share does NOT re-ask.
//
// ⚠️ Assert on the SHARED TEXT, not on the sheet closing. The sheet closing
// proves the modal works; only the text proves the name survived into the
// link, which is the thing the recipient actually sees.
import { test, expect } from '@playwright/test';

const AD_NOISE = /googlesyndication|adtrafficquality|googleads|doubleclick/;

async function seedNamelessGuest(context) {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
      localStorage.removeItem('biq_profile');   // the ghost: no name at all
      // The once-ever guest 'save' auth nudge fires when the player leaves
      // the results screen (2026-09-03: no longer on a 2s timer over it) and
      // would collide with the share path. Mark it already-seen so this spec
      // tests the share path, not the nudge. (The collision itself is guarded in
      // App.jsx via askShareNameRef — this is isolation, not a workaround.)
      localStorage.setItem('biq_save_nudge_shown', '1');
      // ⚠️ AND the notification pre-prompt, for exactly the same reason — this
      // is what made the spec flaky (~40% of full-suite runs, 0% in isolation,
      // diagnosed 2026-08-23). maybePromptNotif() fires after a POSITIVE DAILY
      // COMPLETION on a 7000ms timer, which is this precise flow, and its
      // bottom sheet covers the share button. Whether it lands before or after
      // the test reaches the share depends on how loaded the machine is, so it
      // passed alone and failed under parallelism — the signature of a race,
      // not of a broken feature.
      // Capped at its 2-ask lifetime limit so the sheet never schedules.
      localStorage.setItem('biq_notif_asks', '2');
      // navigator.share is absent in headless Chromium, so the app would fall
      // through to the clipboard. Stub it to capture the payload directly.
      window.__shared = [];
      // The app hands the sheet {title, text, url} (2026-09-04) — the link
      // travels as `url`, not at the end of `text`. Capture what a target
      // would see: text and link together.
      navigator.share = (d) => { window.__shared.push([d.text || '', d.url || ''].filter(Boolean).join('\n')); return Promise.resolve(); };
    } catch {}
  });
}

async function playDailyToEnd(page) {
  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  const daily = page.locator('text=/Today\'?s 7|Daily 7/i').first();
  await daily.click();
  await page.waitForTimeout(900);
  // Answer 7 questions by always taking the first option — correctness is
  // irrelevant here; reaching the result screen is the point.
  for (let i = 0; i < 7; i += 1) {
    const opt = page.locator('button.opt').filter({ visible: true }).first();
    if (!(await opt.count())) break;
    await opt.click();
    // ⚠️ WAIT FOR THE CONDITION, NOT A DURATION. This was waitForTimeout(850),
    // which is fine on a dev machine and NOT fine on a CI runner: when the
    // reveal took longer than the sleep, the loop advanced without the answer
    // registering, broke early, never reached the results screen, and failed
    // at `expect(share).toBeVisible()` — exactly the misleading symptom the
    // comment below already warns about. It failed on 2026-08-21 in the first
    // CI run after the e2e job became a real gate, while passing 6/6 locally.
    // A gate that flakes teaches people to ignore red, so the sleeps go.
    await page.locator('button.opt.correct, button.opt.wrong')
      .first().waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => {});
    // ⚠️ The advance button is "Next →" mid-game but "Results →" on Q7. An
    // earlier regex matched only the former and the loop stalled on the last
    // question, which reads exactly like "the share button doesn't exist".
    const next = page.locator('button').filter({ hasText: /Next|Continue|Results|Finish/i }).filter({ visible: true }).first();
    await next.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    if (await next.count()) {
      await next.click();
      // Settle on whatever comes next — the following question, or the result
      // screen on Q7 — rather than guessing how long that takes.
      await page.locator('button.opt, button:has-text("Share"), button:has-text("Challenge")')
        .first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    }
    // ⚠️ STOP AS SOON AS THE RESULT SCREEN EXISTS. The loop used to always run
    // seven times; if a question was skipped or the daily was already partly
    // played, the extra iterations clicked into whatever came next and walked
    // off the result screen again.
    if (await page.locator('button:has-text("Share"), button:has-text("Challenge")')
      .filter({ visible: true }).count()) break;
  }

  // ⚠️ ASSERT ARRIVAL HERE, not 40 lines later at the share button.
  //
  // Every wait above ends in `.catch(() => {})`, which is deliberate — a
  // single slow reveal should not fail the run — but it means a step that
  // genuinely stalls is SILENT, the loop limps on, and the test dies later
  // with "share button on the daily result" pointing at the wrong place
  // entirely. That is why this spec has read as flaky for two days: the
  // symptom was never where the problem was.
  //
  // The generous timeout is on purpose. Measured 2026-08-23: this spec fails
  // roughly 40% of full-suite runs and 0% in isolation, and a full suite run
  // alongside a booted iOS Simulator took load average past 10 and failed 33
  // of 44. The machine, not the app, is what varies.
  await expect(
    page.locator('button:has-text("Share"), button:has-text("Challenge")').filter({ visible: true }).first(),
    'never reached the daily result screen — a step in playDailyToEnd stalled, look THERE not at the share button',
  ).toBeVisible({ timeout: 20000 });
}

test('nameless sharer is asked, and the name reaches the link', async ({ page, context }) => {
  const errs = [];
  page.on('pageerror', (e) => { if (!AD_NOISE.test(e.message)) errs.push(e.message); });

  await seedNamelessGuest(context);
  await playDailyToEnd(page);

  const share = page.locator('button', { hasText: /Share|Challenge/i }).filter({ visible: true }).first();
  await expect(share, 'share button on the daily result').toBeVisible({ timeout: 8000 });
  await share.click();
  await page.waitForTimeout(600);

  // 1. asked, not shipped anonymous
  const sheet = page.locator('[aria-label="Add your name to the challenge"]');
  await expect(sheet, 'name sheet opens for a nameless sharer').toBeVisible();
  expect(await page.evaluate(() => window.__shared.length),
    'must not have shared before asking').toBe(0);

  // 2. the name reaches the /c/ token
  await page.locator('input[aria-label="Your name"]').fill('Alex');
  await page.locator('button[type="submit"]', { hasText: /Share challenge/i }).first().click();
  await page.waitForTimeout(700);
  const first = await page.evaluate(() => window.__shared[0] || '');
  expect(first, 'shared text carries the /c/ challenge link').toMatch(/\/c\/\d\.\d{8}/);
  expect(first, 'shared link carries the captured name').toContain('.Alex');

  // 3. answering once is enough
  await expect(sheet).toBeHidden();
  const share2 = page.locator('button', { hasText: /Share|Challenge/i }).filter({ visible: true }).first();
  await share2.click();
  await page.waitForTimeout(700);
  await expect(sheet, 'second share must NOT re-ask').toBeHidden();
  const second = await page.evaluate(() => window.__shared[1] || '');
  expect(second, 'second share still carries the name').toContain('.Alex');

  expect(errs, 'no page errors').toEqual([]);
});

test('skipping still shares — the prompt must never block the share', async ({ page, context }) => {
  await seedNamelessGuest(context);
  await playDailyToEnd(page);

  const share = page.locator('button', { hasText: /Share|Challenge/i }).filter({ visible: true }).first();
  await expect(share).toBeVisible({ timeout: 8000 });
  await share.click();
  await page.waitForTimeout(600);
  await page.locator('button', { hasText: /Share without a name/i }).first().click();
  await page.waitForTimeout(700);

  const text = await page.evaluate(() => window.__shared[0] || '');
  expect(text, 'skipping still produces a share').toMatch(/\/c\/\d\.\d{8}/);
  expect(text, 'and it is anonymous, with no trailing name segment').not.toMatch(/\/c\/\d\.\d{8}\./);
});
