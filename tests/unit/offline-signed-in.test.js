// Signed in, no network (28 Nov 2026, Alex on a flight): the game still counts
// on the phone, nothing warns about it, and it reaches the account the moment
// the phone is back.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { tickStreakLocally } from '../../src/lib/streak.js';
import { markSyncOwed, syncOwed, clearSyncOwed, isNetFail } from '../../src/lib/syncOwed.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

describe('the streak, counted on the phone', () => {
  const T = 20785;
  it('starts at one with no record', () => {
    expect(tickStreakLocally(null, T)).toMatchObject({ streak: 1, lastDay: T, best: 1, ticked: true, shieldSaved: false });
  });
  it('continues from yesterday', () => {
    expect(tickStreakLocally({ streak: 12, lastDay: T - 1, best: 30 }, T)).toMatchObject({ streak: 13, lastDay: T, best: 30, ticked: true });
  });
  it('does not count the same day twice', () => {
    expect(tickStreakLocally({ streak: 13, lastDay: T, best: 30 }, T)).toMatchObject({ streak: 13, ticked: false });
  });
  it('a shield covers one missed day, and only when one is banked', () => {
    expect(tickStreakLocally({ streak: 5, lastDay: T - 2, best: 5 }, T, 1)).toMatchObject({ streak: 6, shieldSaved: true });
    const broke = tickStreakLocally({ streak: 5, lastDay: T - 2, best: 5 }, T, 0);
    expect(broke).toMatchObject({ streak: 1, shieldSaved: false, fell: 5, fellDay: T, best: 5 });
  });
  it('a break of one day leaves nothing to repair', () => {
    expect(tickStreakLocally({ streak: 1, lastDay: T - 5, best: 4 }, T, 0).fell).toBeUndefined();
  });
  it('a record ahead of today is kept as it is', () => {
    expect(tickStreakLocally({ streak: 9, lastDay: T + 1, best: 9 }, T)).toEqual({ lastDay: T + 1, streak: 9, best: 9, ticked: false, shieldSaved: false });
  });
});

describe('a sync the phone still owes', () => {
  it('is marked, read and cleared', () => {
    const s = mem();
    expect(syncOwed(s)).toBe(false);
    markSyncOwed(s);
    expect(syncOwed(s)).toBe(true);
    clearSyncOwed(s);
    expect(syncOwed(s)).toBe(false);
  });
  it('survives blocked storage without throwing', () => {
    const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
    expect(() => { markSyncOwed(bad); clearSyncOwed(bad); }).not.toThrow();
    expect(syncOwed(bad)).toBe(false);
  });
  it('tells no network from the server saying no', () => {
    expect(isNetFail({ message: 'TypeError: Load failed' }, { onLine: true })).toBe(true);
    expect(isNetFail({ message: 'TypeError: Failed to fetch' }, { onLine: true })).toBe(true);
    expect(isNetFail(new Error('NetworkError when attempting to fetch resource.'), { onLine: true })).toBe(true);
    expect(isNetFail({ message: 'permission denied for function increment_score', code: '42501' }, { onLine: true })).toBe(false);
    expect(isNetFail({ message: 'permission denied', code: '42501' }, { onLine: false })).toBe(true);
  });
});

describe('the wiring', () => {
  const app = readFileSync('src/App.jsx', 'utf8');
  const auth = readFileSync('src/useAuth.jsx', 'utf8');
  it('a failed streak call falls back to the phone instead of returning', () => {
    const i = app.indexOf("console.warn('[tick_login_streak]'");
    const block = app.slice(i, i + 900);
    expect(block).toContain('result = tickOnPhone()');
    expect(block).not.toMatch(/captureException\([^)]*\)\);\s*return;/);
  });
  it('the sync warning is not shown when the cause is no network', () => {
    expect(app).toMatch(/if \(syncFailed && !netOnly && !scoreSyncToastShownRef\.current\)/);
  });
  it('the score queue is flushed when the phone comes back', () => {
    const i = app.indexOf('AND WHEN THE PHONE COMES BACK');
    const block = app.slice(i, i + 1100);
    expect(block).toContain("window.addEventListener('online', back)");
    expect(block).toContain('flushScoreOutbox(user.id)');
  });
  it('an owed sync makes the profile read again, and the mark clears only once settled', () => {
    expect(auth).toContain('(statsHydratedFor(userId) && !syncOwed())');
    expect(auth).toContain('if (settled) clearSyncOwed()');
    expect(auth).toContain("'biq_sync_owed',");
  });
});
