import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { mysteryDayIndex, MYSTERY_ANCHOR_DAY } from '../../src/lib/mysteryPlayer.js';

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');

/**
 * A DAILY-ONLY PLAYER WAS INVISIBLE TO THE APP.
 *
 * Measured in prod on 2026-08-25: eight accounts held 20+ solved puzzles and
 * `profiles.games_played = 0`. Footle, Trail, Mystery and Stadiums each wrote
 * a `scores` row and XP; none of them touched the aggregate counters that the
 * quiz path maintains. Consequences: the friend-profile stat grid hid itself
 * entirely, the friends leaderboard sorted them last forever, and the
 * "enable daily reminders?" ask — gated on `biq_stats.gamesPlayed` — could
 * never fire for exactly the players who wanted daily reminders most.
 *
 * These are source-level guards on purpose. The defect was not a wrong value;
 * it was a MISSING CALL in four sibling branches, which is invisible to any
 * test that only exercises the branches that were already right.
 */
describe('every daily mode counts as a game played', () => {
  it('pairs recordDailyPlay with awardXp in all four daily branches', () => {
    // One call per daily mode: footle, trail, mystery, stadiums.
    const calls = APP.match(/recordDailyPlay\(/g) || [];
    expect(calls.length).toBe(4);
  });

  it.each(['footle', 'trail', 'mystery'])('the %s branch records a play', (game) => {
    // A mode can be tested in more than one branch (footle has a separate
    // rating-prompt branch that fires only on a win), so check EVERY branch
    // that awards XP — that is the one that owns "this puzzle is finished".
    const needle = `e?.detail?.game === '${game}'`;
    const windows = [];
    for (let i = APP.indexOf(needle); i !== -1; i = APP.indexOf(needle, i + 1)) {
      windows.push(APP.slice(i, i + 1400));
    }
    expect(windows.length).toBeGreaterThan(0);
    const xpBranches = windows.filter((w) => /awardXp\(/.test(w.slice(0, 400)));
    expect(xpBranches.length).toBeGreaterThan(0);
    for (const branch of xpBranches) expect(branch).toMatch(/recordDailyPlay\(/);
  });

  it('the stadiums branch records a play even on a give-up', () => {
    const start = APP.indexOf('const onStadiumsDone');
    expect(start).toBeGreaterThan(-1);
    const block = APP.slice(start, start + 900);
    // Outside the !d.gaveUp guard — played-and-stopped is still played.
    expect(block).toMatch(/recordDailyPlay\(!d\.gaveUp/);
  });

  it('does not add a lower-is-better daily score to total_score', () => {
    // For the dailies `score` is ATTEMPTS USED: a Footle solved in 2 scores 2,
    // one solved in 6 scores 6. total_score is higher-is-better and drives the
    // leaderboard, so wiring one into the other would rank the worst players
    // top. increment_score must stay in the quiz path only.
    const rpcs = APP.match(/rpc\('increment_score'/g) || [];
    expect(rpcs.length).toBe(1);
  });

  it('reads the persisted snapshot, not React state, to increment', () => {
    // A setStats updater runs at render time, so a value computed inside it is
    // not readable on the next line — the Supabase push would silently never
    // fire. And these handlers close over whatever `stats` was when the effect
    // ran, so state goes stale. localStorage is the authority here.
    const start = APP.indexOf('const recordDailyPlay');
    const fn = APP.slice(start, APP.indexOf('}, [user?.id]);', start));
    expect(fn).toMatch(/localStorage\.getItem\("biq_stats"\)/);
    expect(fn).toMatch(/const \{ error \} = await supabase/);   // resolves on error
  });

  it('is declared ABOVE the effect that lists it as a dependency', () => {
    // ⚠️ THIS EXACT ORDERING TOOK THE WHOLE APP DOWN ONCE.
    // recordDailyPlay first landed just above handleComplete — ~100 lines
    // BELOW the effect that registers the daily listeners and names it in its
    // dependency array. A `const` is hoisted but sits in the temporal dead
    // zone, so the dep array threw `Cannot access 'recordDailyPlay' before
    // initialization` on first render and every route under AppInner fell into
    // the error boundary.
    //
    // ESLint passed it. The production build passed it. All 403 tests passed
    // it. Only loading the page caught it — which is the whole reason
    // "verified" has to mean the page rendered.
    const decl = APP.indexOf('const recordDailyPlay');
    const effect = APP.indexOf("window.addEventListener('biq:daily-completed'");
    expect(decl).toBeGreaterThan(-1);
    expect(effect).toBeGreaterThan(-1);
    expect(decl).toBeLessThan(effect);
  });

  it('makes the native notification bail visible to analytics', () => {
    // The web half already reported which gate it died at; the native half —
    // the one holding the single irreversible iOS permission prompt — returned
    // a bare false, so "never asked" and "asked and declined" looked identical.
    expect(APP).toMatch(/engine: "native"/);
    const skips = APP.match(/notif-prompt-skipped/g) || [];
    expect(skips.length).toBe(3);   // web bail, native bail, 24h-gap bail
  });
});

/**
 * The Mystery day index was UTC-based while every other daily rolls over at
 * LOCAL midnight. The two forms diverge in every timezone, not just western
 * ones: UTC-negative zones diverge in the local evening, UTC-positive zones in
 * the local early morning.
 */
describe('mysteryDayIndex rolls over at local midnight', () => {
  const idxFor = (y, m, d, h) => mysteryDayIndex(new Date(y, m, d, h, 0, 0));

  it('is stable across the whole of a local day', () => {
    const early = idxFor(2026, 7, 25, 1);
    const late  = idxFor(2026, 7, 25, 23);
    expect(late).toBe(early);
  });

  it('advances by exactly one at local midnight', () => {
    expect(idxFor(2026, 7, 26, 0) - idxFor(2026, 7, 25, 23)).toBe(1);
  });

  it('keeps the frozen anchor on its published date', () => {
    // MYSTERY_ANCHOR_DAY is puzzle #1 = 2026-08-03. Moving it re-dates every
    // puzzle in the archive.
    expect(idxFor(2026, 7, 3, 12)).toBe(MYSTERY_ANCHOR_DAY);
  });
});
