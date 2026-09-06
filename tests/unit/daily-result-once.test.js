import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * ⚠️ TWO PANELS MOUNT PER RESULT, AND BOTH USED TO WRITE A ROW.
 *
 * The results screen renders DailyDone twice — the mobile stack and the
 * desktop card — swapped by CSS `display`, not by a conditional, so both
 * mount and both run the record effect in the same tick. `hasRecorded`
 * could not catch it: its localStorage flag is written only after the
 * network round trip, long after the second caller has read it as false.
 *
 * The web never showed the symptom, because the server's partial unique
 * index dedupes on visitor_id. Native rows carry no visitor_id by promise,
 * so `on conflict … where visitor_id is not null` does not apply to them —
 * two identical daily7 rows, 3ms apart, were sitting in prod on 2026-09-06.
 * The panel publishes "how everyone did" from n >= 20, so this was on its
 * way to becoming a visibly wrong distribution in the one place the product
 * promises honesty.
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const LIB = read('../../src/lib/dailyResults.js');
const DD = read('../../src/components/DailyDone.jsx');
const RESULTS = read('../../src/screens/ResultsScreen.jsx');
const MIG = read('../../supabase/migrations/v1_9_daily_results.sql');

describe('a finished daily writes exactly one row', () => {
  it('the premise still holds: two panels mount per Daily 7 result', () => {
    // If this ever drops to one, the guard below is still correct — but the
    // reason for it changes, so make the change deliberate.
    expect((RESULTS.match(/<DailyDone game="daily7"/g) || []).length).toBe(2);
  });

  it('the claim is synchronous — taken before any await, not after', () => {
    expect(LIB, 'a session-scoped claim set').toMatch(/const claimed = new Set\(\);/);
    const fn = LIB.slice(LIB.indexOf('export async function recordDailyResult'));
    const claim = fn.indexOf('claimed.add(');
    const firstAwait = fn.indexOf('await ');
    expect(claim, 'claim must exist').toBeGreaterThan(-1);
    expect(claim, 'claim must be taken BEFORE the first await, or the race is still open')
      .toBeLessThan(firstAwait);
    expect(fn, 'a second caller bails out').toMatch(/if \(claimed\.has\(key\)\) return true;/);
  });

  it('a failed send releases the claim so a retry can still land', () => {
    expect(LIB).toMatch(/catch \{ claimed\.delete\(key\); return false; \}/);
  });

  it('the play hour is noted once, from inside the same claim', () => {
    // Noting it from both panels put the same hour into the 7-sample median
    // twice and dragged the reminder toward that hour.
    expect(LIB, 'the hour note lives in the lib now').toMatch(/noteCompletionHour\(\)/);
    expect(DD, 'and no longer in the component').not.toMatch(/noteCompletionHour/);
  });

  it('native still sends no identifier — the guard must not have bought dedupe with one', () => {
    expect(LIB).toMatch(/const vid = isNative\(\) \? null : visitorId\(\);/);
    expect(MIG).toMatch(/on conflict \(game, edition, visitor_id\) where visitor_id is not null/);
  });
});
