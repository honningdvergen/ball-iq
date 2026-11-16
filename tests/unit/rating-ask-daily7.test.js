// 16 Nov 2026. Read from funnel_events for 2 to 15 Nov: the Daily 7 asked for
// a rating once in fourteen days. Two causes, both fixed here:
//   - seven questions can never reach the "10 or more at 90%" line, so only a
//     perfect seven or a streak milestone counted as a great moment;
//   - guests were excluded so the save-your-progress sheet could own the
//     moment, but that sheet was removed on 6 Sep and the exclusion stayed.
// And one rule for every ask: never over another sheet or the level-up overlay.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
const HOOK = readFileSync(fileURLToPath(new URL('../../src/useModalA11y.js', import.meta.url)), 'utf8');

describe('the Daily 7 asks for a rating', () => {
  it('five of seven is a great moment, for a phone that has played on three days', () => {
    // Today counts as one of the three: its own key is written after this line.
    expect(APP).toContain('const strongDaily = mode === "daily" && res.total >= 5 && res.score / res.total >= 0.7 && playDays(undefined, todayKey) >= 3;');
    const def = APP.slice(APP.indexOf('const hadGreatMoment ='), APP.indexOf('const hadGreatMoment =') + 260);
    expect(def).toMatch(/\|\|\s*strongDaily;/);
    // 5/7 passes the line and 4/7 does not.
    expect(5 / 7 >= 0.7).toBe(true);
    expect(4 / 7 >= 0.7).toBe(false);
  });
  it('a guest is asked, and nothing yields to a sheet that no longer exists', () => {
    const from = APP.indexOf('const willAskNativeReview =');
    const cond = APP.slice(from, APP.indexOf(';', from));
    expect(cond).not.toMatch(/isGuest/);
    // The notification bottom sheet was retired on 6 Sep 2026; yielding to it
    // blocked every player who had not switched reminders on.
    expect(cond).not.toMatch(/notif/i);
    expect(APP).not.toContain('notifOwnsDailyMoment');
    expect(cond).toContain('(mode !== "daily" || !challengeOwnsDailyMoment)');
    expect(cond).toContain('newTotal >= 5');
    // The thing it would have yielded to really opens nothing.
    const HOOK_N = readFileSync(fileURLToPath(new URL('../../src/hooks/useLocalNotifications.js', import.meta.url)), 'utf8');
    expect(HOOK_N).not.toMatch(/setNotifPromptOpen\(true\)/);
    expect(APP).not.toMatch(/setNotifPromptOpen\(true\)/);
  });
  it('a level-up overlay delays the results ask once instead of swallowing it', () => {
    const from = APP.indexOf('const askAfterResults = (waited) => {');
    expect(from).toBeGreaterThan(-1);
    const body = APP.slice(from, from + 1900);
    expect(body).toContain('if (!waited && ratingAskHeld() === "level-up") { celebrationTimeoutsRef.current.push(setTimeout(() => askAfterResults(true), 2400)); return; }');
    expect(body).toContain('celebrationTimeoutsRef.current.push(setTimeout(() => askAfterResults(false), 3500));');
    // 3.5 s + 2.4 s is past the overlay's end (1.6 s + STREAK_TOAST).
    const toast = Number((APP.match(/STREAK_TOAST:\s*(\d+)/) || [])[1]);
    expect(toast).toBeGreaterThan(0);
    expect(3500 + 2400).toBeGreaterThan(1600 + toast);
  });
  it('a web prompt held back by an open sheet does not spend the session\'s one ask', () => {
    expect((APP.match(/if \(held\) \{ setRatePromptShown\(false\); loopEvent\("rate-prompt-skipped", \{ reason: held, engine: "web"/g) || []).length).toBe(2);
  });
  it('is scheduled in the apps only, and counted apart from the quiz results', () => {
    const from = APP.indexOf('const willAskNativeReview =');
    expect(APP.slice(from, APP.indexOf(';', from))).toMatch(/= IS_NATIVE && hadGreatMoment/);
    const body = APP.slice(from, from + 2600);
    expect(body).toContain('const trigger = mode === "daily" ? "daily" : "results";');
    expect(body).toContain('loopEvent("rate-prompt-shown", { engine: "native", trigger });');
    expect(body).not.toContain('trigger: "results"');
  });
});

describe('no rating ask lands on top of another sheet', () => {
  it('the hook says whether any sheet is open', () => {
    expect(HOOK).toMatch(/export function anyModalOpen\(\) \{\s*return modalStack\.length > 0\s*\}/);
  });
  it('held for an open sheet or the level-up overlay, and says which', () => {
    expect(APP).toContain('const ratingAskHeld = useCallback(() => (anyModalOpen() ? "sheet-open" : levelUpRef.current ? "level-up" : null), []);');
    expect(APP).toContain('levelUpRef.current = levelUpOverlay;');
  });
  it('every ask checks it after the screen gate and before it claims to have shown anything', () => {
    const shown = [...APP.matchAll(/loopEvent\("rate-prompt-shown"/g)].map((m) => m.index);
    expect(shown.length).toBe(5);
    for (const at of shown) {
      const before = APP.slice(Math.max(0, at - 1500), at);
      const gate = before.lastIndexOf('if (!ratingAskAllowed())');
      const held = before.lastIndexOf('const held = ratingAskHeld(); if (held) {');
      expect(gate, 'screen gate missing').toBeGreaterThan(-1);
      expect(held, 'sheet check missing').toBeGreaterThan(gate);
      // It logs why, and returns before anything is spent.
      expect(before.slice(held, held + 200)).toMatch(/loopEvent\("rate-prompt-skipped", \{ reason: held, engine: "(native|web)", trigger[^}]*\}\); return; \}/);
    }
  });
});
