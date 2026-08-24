import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Where a signup stops, before it ever becomes a player.
 *
 * ⚠️ MEASURED 2026-08-24, and it inverted the project's standing thesis.
 * 36.2% of accounts (79 of 218) have never played a single game, and it is not
 * improving — 33.9% of the last 30 days' signups are in the same state. But of
 * the 131 who DID play, only 15.3% played once and vanished; the rest average
 * 9.7 plays, one is at 77.
 *
 * So retention is NOT the problem. It is good. A third of the water never
 * reaches the bucket. "Leaky bucket, retention first" was backwards, and every
 * person converted past the first game is worth ~9.7 plays at 85% return odds.
 *
 * ⚠️ AND THE EXISTING FUNNEL COULD NOT SEE ANY OF IT: 907 of 908
 * `first-game-started` rows carry a NULL user_id, because they fire while
 * signed out. record_funnel_event records auth.uid(), so a step recorded
 * signed-out is a step that cannot be attributed to anybody. That is precisely
 * why those 79 accounts are invisible. Every acct-* step fires signed in.
 *
 * ⚠️ SCOPE, DELIBERATELY NARROW. Never-played rates, provider splits and
 * retention curves are all derivable TODAY from profiles / scores /
 * user_game_state / auth.users — plain SQL answered every one of them before
 * this file existed. Re-instrumenting them would create a second, weaker source
 * of truth that can disagree with the first. What SQL cannot say is which
 * screen someone was looking at when they stopped, and that is all this adds.
 */

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { markAcctStep, acctStepsSeen, resetAcctFunnel, ACCT_STEPS } =
  await import('../../src/lib/acctFunnel.js');

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
const USER = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';

beforeEach(() => { store.clear(); });

describe('the signup to first-play funnel', () => {
  it('a step fires once and only once', () => {
    const emit = vi.fn();
    expect(markAcctStep(USER, 'acct-home', emit)).toBe(true);
    expect(markAcctStep(USER, 'acct-home', emit)).toBe(false);
    expect(markAcctStep(USER, 'acct-home', emit)).toBe(false);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('acct-home', undefined);
  });

  it('different steps are independent', () => {
    const emit = vi.fn();
    markAcctStep(USER, 'acct-session', emit);
    markAcctStep(USER, 'acct-home', emit);
    markAcctStep(USER, 'acct-first-play', emit, { mode: 'daily' });
    expect(emit).toHaveBeenCalledTimes(3);
    expect(acctStepsSeen(USER)).toEqual(['acct-session', 'acct-home', 'acct-first-play']);
  });

  it('meta rides along', () => {
    const emit = vi.fn();
    markAcctStep(USER, 'acct-first-finish', emit, { mode: 'classic', total: 10 });
    expect(emit).toHaveBeenCalledWith('acct-first-finish', { mode: 'classic', total: 10 });
  });

  it('a signed-OUT caller records nothing', () => {
    // ⚠️ The whole point. An unattributed step is the bug being fixed, not a
    // partial success — 907 of 908 existing rows are exactly this.
    const emit = vi.fn();
    expect(markAcctStep(null, 'acct-home', emit)).toBe(false);
    expect(markAcctStep(undefined, 'acct-home', emit)).toBe(false);
    expect(emit).not.toHaveBeenCalled();
  });

  it('a second account on the same device is a fresh journey', () => {
    const emit = vi.fn();
    markAcctStep(USER, 'acct-home', emit);
    markAcctStep(OTHER, 'acct-home', emit);
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it('the store never grows past the current account', () => {
    // Bookkeeping, not user data. A shared device must not accumulate a map
    // keyed by everyone who has ever signed in on it.
    const emit = vi.fn();
    markAcctStep(USER, 'acct-session', emit);
    markAcctStep(OTHER, 'acct-session', emit);
    const raw = JSON.parse(localStorage.getItem('biq_acct_funnel'));
    expect(Object.keys(raw)).toEqual([OTHER]);
  });

  it('measurement never throws into the thing it measures', () => {
    // A funnel that can break a game is worse than no funnel.
    const boom = () => { throw new Error('sentry down'); };
    expect(() => markAcctStep(USER, 'acct-home', boom)).not.toThrow();
    expect(() => markAcctStep(USER, 'acct-home', null)).not.toThrow();
    expect(() => markAcctStep(USER, 'acct-home', 'not a function')).not.toThrow();
  });

  it('reset clears it', () => {
    const emit = vi.fn();
    markAcctStep(USER, 'acct-home', emit);
    resetAcctFunnel();
    expect(markAcctStep(USER, 'acct-home', emit)).toBe(true);
  });

  it('every declared step is actually wired in the app', () => {
    // ⚠️ A step that exists only in this list is a hole in the funnel that
    // looks like coverage. The whole chain has to be emitted or the drop-off
    // between two steps is unreadable.
    const missing = ACCT_STEPS.filter((s) => !APP.includes(`'${s}'`));
    expect(
      missing,
      '\n  Declared but never emitted — the funnel would show a cliff at this\n' +
      '  step that is an instrumentation gap, not player behaviour.\n',
    ).toEqual([]);
    expect(ACCT_STEPS.length).toBe(5);
  });

  it('the steps fire signed in, not signed out', () => {
    // Each call site must pass a real user id, or record_funnel_event has no
    // auth.uid() to attach and the row joins to nobody.
    const calls = [...APP.matchAll(/markAcctStep\(([^,]+),/g)].map((m) => m[1].trim());
    expect(calls.length).toBeGreaterThanOrEqual(5);
    for (const arg of calls) {
      expect(arg, `markAcctStep called with "${arg}" — must be a user id`)
        .toMatch(/^user(\?)?\.id$/);
    }
  });
});
