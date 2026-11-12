import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { needsTodayCredit } from '../../src/lib/streak.js';

/**
 * A daily finished as a guest, then a sign-in: the day must reach the
 * account's streak (10 Nov 2026, simulator: "0 day streak" beside a lit TODAY
 * square after signing in). The streak still never ticks for merely opening
 * the app.
 */
const TODAY = 20767;
const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');

describe('needsTodayCredit', () => {
  it('nothing played today: never, whatever the record says', () => {
    expect(needsTodayCredit(null, false, TODAY)).toBe(false);
    expect(needsTodayCredit({ streak: 5, lastDay: TODAY - 1 }, false, TODAY)).toBe(false);
    expect(needsTodayCredit({ streak: 0, lastDay: 0 }, false, TODAY)).toBe(false);
  });
  it('played today and the account has not counted today: yes', () => {
    expect(needsTodayCredit({ streak: 5, lastDay: TODAY - 1 }, true, TODAY)).toBe(true);
    expect(needsTodayCredit({ streak: 2, lastDay: TODAY - 9 }, true, TODAY)).toBe(true);
    expect(needsTodayCredit({ streak: 0, lastDay: 0 }, true, TODAY)).toBe(true);
  });
  it('a new account with no record at all: today is its first day', () => {
    expect(needsTodayCredit(null, true, TODAY)).toBe(true);
    expect(needsTodayCredit({}, true, TODAY)).toBe(true);
  });
  it('today already counted (or a legacy day ahead of it): no second tick', () => {
    expect(needsTodayCredit({ streak: 6, lastDay: TODAY }, true, TODAY)).toBe(false);
    expect(needsTodayCredit({ streak: 6, lastDay: TODAY + 1 }, true, TODAY)).toBe(false);
  });
});

describe('the app asks once per hydrate, signed in only', () => {
  it('hydrate records what the account held, and an effect does the asking', () => {
    expect(APP).toMatch(/setHydratedStreak\(\{ rec: /);
    expect(APP).toContain('const [hydratedStreak, setHydratedStreak] = useState(null);');
    const fx = APP.match(/useEffect\(\(\) => \{\n    if \(!hydratedStreak \|\| !user\?\.id\) return;[\s\S]*?\}, \[hydratedStreak, user\?\.id\]\);/);
    expect(fx, 'the credit effect').toBeTruthy();
    expect(fx[0]).toContain('if (!hydratedStreak || !user?.id) return;');
    expect(fx[0]).toContain('if (needsTodayCredit(hydratedStreak.rec, playedToday)) tickLoginStreak();');
  });
  it('the hydrate handler itself still never ticks (it is bound once, before anyone is signed in)', () => {
    const handler = APP.slice(APP.indexOf('const onHydrated ='), APP.indexOf("window.addEventListener('biq:hydrated', onHydrated)"));
    expect(handler.length).toBeGreaterThan(200);
    expect(handler).not.toContain('tickLoginStreak(');
  });
});
