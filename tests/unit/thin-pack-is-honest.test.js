import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { QB } from '../../src/questions.js';

/**
 * When a club pack runs out, say so.
 *
 * ⚠️ MEASURED 2026-08-24, and the report's figure was exact: 81 of 86 club
 * packs hold under four rounds' worth of eligible questions. Manchester United
 * has 24 against a 10-question round — 2.4 rounds. 43 packs are under three
 * rounds, 14 under two.
 *
 * `applySeenFilter` already handles this WELL: when the fresh pool runs short
 * it tops up with the least-recently-seen rows, spacing unavoidable repeats as
 * far apart as the pool allows. What it does not do is say anything. So a fan
 * on their third United round meets questions they answered last week, in
 * silence, and concludes the app is thin.
 *
 * It IS thin. But "you have played most of these" and "this app has no
 * questions" are very different reactions to the same fact, and only one of
 * them is true. That is the whole fix — no new questions, just an honest
 * sentence.
 *
 * ⚠️ Once per club per DAY. A thin pack repeats on every session from the third
 * onward, so a toast per session would stop being information and become the
 * exact kind of nagging this release exists to remove.
 */

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');

/** The shipped depth maths, so the premise stays measured rather than recalled. */
function packDepths() {
  const byClub = new Map();
  for (const q of QB) {
    if (!q?.club || q.type !== 'mcq' || !Array.isArray(q.o)) continue;
    if (q.tag === 'summer2026') continue;
    if (!byClub.has(q.club)) byClub.set(q.club, []);
    byClub.get(q.club).push(q);
  }
  return [...byClub.entries()].map(([club, qs]) => {
    const noEasy = qs.filter((q) => q.diff !== 'easy');
    return { club, eligible: noEasy.length >= 16 ? noEasy.length : qs.length };
  });
}

describe('a spent club pack admits it', () => {
  it('the premise still holds — most packs really are under four rounds', () => {
    const depths = packDepths();
    expect(depths.length, 'club packs should still exist').toBeGreaterThan(50);
    const underFour = depths.filter((d) => d.eligible < 40).length;
    expect(
      underFour / depths.length,
      'if this ever drops, the warning is firing for a problem that is gone',
    ).toBeGreaterThan(0.5);
    // The specific case the message was written for.
    const united = depths.find((d) => d.club === 'Manchester United');
    expect(united, 'Manchester United should still have a pack').toBeTruthy();
    expect(united.eligible).toBeLessThan(40);
  });

  it('the club launcher checks freshness before drawing', () => {
    // ⚠️ BEFORE, not after: applySeenFilter's return value cannot tell you
    // whether it had to top up, so a post-hoc check is not possible.
    expect(APP).toMatch(/countFreshQuestions\(clubPool, qbHistKey\) < 10 && shouldWarnPackThin\(clubKey\)/);
    const draw = APP.indexOf('const freshPool = applySeenFilter(clubPool, 10, qbHistKey)');
    const check = APP.indexOf('countFreshQuestions(clubPool, qbHistKey) < 10');
    expect(check, 'the freshness check must precede the draw').toBeLessThan(draw);
  });

  it('asking how fresh the pool is costs nothing', () => {
    // A counter that wrote history would corrupt the very thing it measures.
    //
    // ⚠️ CASE-INSENSITIVE ON PURPOSE, and this is the whole reason falsifying a
    // green test matters. The first version matched /setItem/ — which does NOT
    // occur in `safeSetItem`, the wrapper this codebase actually uses, because
    // the S is capitalised there. Seeding a real write left the test green. A
    // guard against the one API nobody calls is not a guard.
    const fn = APP.slice(APP.indexOf('function countFreshQuestions'));
    const body = fn.slice(0, fn.indexOf('\n}'));
    expect(body).not.toMatch(/setitem|_writeSeenHistoryRaw|recordSeen|localStorage/i);
  });

  it('the notice is deduped per club per day', () => {
    const fn = APP.slice(APP.indexOf('function shouldWarnPackThin'));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    expect(body, 'must key on the club').toMatch(/raw\[clubKey\]/);
    expect(body, 'must key on the day').toMatch(/toISOString\(\)\.slice\(0, 10\)/);
    expect(body, 'a repeat on the same day must be refused').toMatch(/=== today\) return false/);
    expect(body, 'the store must not grow without bound').toMatch(/const next = \{ \[clubKey\]: today \}/);
  });

  it('the message states no question count', () => {
    // Standing rule, seven previous disguises: never print how many questions
    // there are. "most of these" is the honest form that cannot rot either.
    const m = APP.match(/showToast\(`You've played most of the \$\{pack\.name\}[^`]*`\)/);
    expect(m, 'the thin-pack toast should still exist').toBeTruthy();
    expect(m[0], 'no digits in the copy').not.toMatch(/\d/);
  });
});
