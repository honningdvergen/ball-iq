// 23 Nov 2026. The streak call failed in silence (a console line, no report,
// no retry, nothing kept), so a dropped connection in the evening was a missed
// day and a reset streak for a player who had played. lib/streak.js now writes
// the day down and sends it again, oldest first.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { owedStreakDays, tickOwedStreak } from '../../src/lib/streak.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const ok = (day) => Promise.resolve({ data: { lastDay: day, streak: day - 19990, best: 30 }, error: null });
const fail = () => Promise.resolve({ data: null, error: { message: 'TypeError: Load failed', code: '' } });

describe('a streak day the server never heard about', () => {
  it('today fails: it is written down for this account', async () => {
    const storage = mem();
    const r = await tickOwedStreak(fail, { uid: 'u1', today: 20000, upTo: 20000, storage });
    expect(r.error).toBeTruthy();
    expect(owedStreakDays('u1', 20000, storage)).toEqual([20000]);
    expect(owedStreakDays('u1', 20001, storage)).toEqual([20000]);   // still owed tomorrow
    expect(owedStreakDays('u2', 20001, storage)).toEqual([]);        // never another account's
  });

  it('next day: the owed day goes first, then today, and the list is cleared', async () => {
    const storage = mem(); const sent = [];
    await tickOwedStreak(fail, { uid: 'u1', today: 20000, upTo: 20000, storage });
    const r = await tickOwedStreak((d) => { sent.push(d); return ok(d); }, { uid: 'u1', today: 20001, upTo: 20001, storage });
    expect(sent).toEqual([20000, 20001]);
    expect(r.error).toBeNull();
    expect(r.data.lastDay).toBe(20001);          // the caller shows today's answer
    expect(owedStreakDays('u1', 20001, storage)).toEqual([]);
    expect(storage.m.size).toBe(0);
  });

  it('stops at the first failure: a later day is never sent past a missing one', async () => {
    const storage = mem(); const sent = [];
    await tickOwedStreak(fail, { uid: 'u1', today: 20000, upTo: 20000, storage });
    const r = await tickOwedStreak((d) => { sent.push(d); return fail(); }, { uid: 'u1', today: 20001, upTo: 20001, storage });
    expect(sent).toEqual([20000]);
    expect(r.error).toBeTruthy();
    expect(owedStreakDays('u1', 20001, storage)).toEqual([20000, 20001]);
  });

  it('a thrown call counts as a failure, not a crash', async () => {
    const storage = mem();
    const r = await tickOwedStreak(() => { throw new Error('boom'); }, { uid: 'u1', today: 20000, upTo: 20000, storage });
    expect(r.error.message).toBe('boom');
    expect(owedStreakDays('u1', 20000, storage)).toEqual([20000]);
  });

  it('nothing older than the two days the server accepts is kept or sent', async () => {
    const storage = mem(); const sent = [];
    storage.setItem('biq_streak_owed', JSON.stringify({ uid: 'u1', days: [19990, 19998, 19999, 20005, 'x'] }));
    expect(owedStreakDays('u1', 20001, storage)).toEqual([19999]);
    await tickOwedStreak((d) => { sent.push(d); return ok(d); }, { uid: 'u1', today: 20001, storage });   // the sign-in replay: no upTo
    expect(sent).toEqual([19999]);
  });

  it('with nothing owed and no day asked for, nothing is sent', async () => {
    const sent = [];
    const r = await tickOwedStreak((d) => { sent.push(d); return ok(d); }, { uid: 'u1', today: 20001, storage: mem() });
    expect(sent).toEqual([]); expect(r.data).toBeNull(); expect(r.error).toBeNull();
  });

  it('unreadable or blocked storage is an empty list, never a throw', async () => {
    const bad = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('SecurityError'); }, removeItem: () => { throw new Error('SecurityError'); } };
    expect(owedStreakDays('u1', 20000, bad)).toEqual([]);
    const r = await tickOwedStreak(fail, { uid: 'u1', today: 20000, upTo: 20000, storage: bad });
    expect(r.error).toBeTruthy();
  });

  it('the app uses it: tick, sign-in replay, repair that speaks, and sign-out clears the list', () => {
    const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    expect(app).toContain("{ uid: user.id, today: localDay, upTo: localDay });");
    expect(app).toContain("Sentry.captureException(error, { tags: { area: 'streak-tick' } });");
    expect(app).toContain('else if (owedStreakDays(user.id).length) {');
    expect(app).toContain('showToast(tl("ts.repairFailed"));');
    expect(app).not.toContain("if (error) { console.warn('[tick_login_streak]', error.message); return; }");
    expect(app).not.toContain("if (error) { console.warn('[repair_login_streak]', error.message); return; }");
    const auth = readFileSync(new URL('../../src/useAuth.jsx', import.meta.url), 'utf8');
    expect(auth).toMatch(/USER_SCOPED_STATIC_KEYS = \[[^\]]*'biq_streak_owed'/s);
  });
});
