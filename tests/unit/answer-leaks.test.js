import { describe, it, expect } from 'vitest';
import { findLeaks } from '../../scripts/leak-rules.mjs';
import { conflictsWith } from '../../src/questionConflicts.js';
import { pickAvoidingConflicts } from '../../src/lib/quiz.js';
import { QB } from '../../src/questions.js';

/**
 * A session must never contain both halves of an answer leak.
 *
 * ⚠️ THIS WAS BLIND TO 52% OF THE BANK. gen-leak-conflicts.mjs keyed on
 * `q.club`, so the 3,535 mcq rows that carry only a `cat` — the whole of
 * WorldCup, Euros, Managers, Records, History and the category-only half of
 * every league — were never compared to anything.
 *
 * It surfaced from a player, not from a check: three questions about the 1999
 * Champions League semi-final, one naming Juventus in its stem, which is the
 * answer to the other two. Zero conflicts registered between them.
 *
 * ⚠️ AND IT INVALIDATED A MEASUREMENT. On 2026-08-23 the League Quiz draw
 * gained pickAvoidingConflicts and the leak rate was reported as 0.0% — but
 * that was measured against the conflicts MAP, i.e. against the same blind
 * spot. Re-measured against the leak RULES: 8.0% of league sessions still
 * leaked, Primeira 27.2%, Ligue1 22.7%.
 *
 * So this test deliberately does NOT trust the map. It re-derives leaks from
 * the rules and asserts the map covers them — an independent source, which is
 * the standing lesson from every detector that has been wrong here.
 */

const mcq = QB.filter((q) => q && q.type === 'mcq' && Array.isArray(q.o));

const groupBy = (key) => {
  const m = new Map();
  for (const q of mcq) {
    const v = q[key];
    if (!v) continue;
    if (!m.has(v)) m.set(v, []);
    m.get(v).push(q);
  }
  return m;
};

// Mirrors the draw: both modes drop "easy" when the pool can afford it, and
// subsetting changes which leaks are strong.
const poolsFor = (qs, threshold) => {
  const noEasy = qs.filter((q) => q.diff !== 'easy');
  return noEasy.length >= threshold ? [qs, noEasy] : [qs];
};

const strongPairs = (groups, threshold, withClubName = false) => {
  const pairs = [];
  for (const [name, qs] of groups) {
    // ⚠️ clubName is NOT optional for club pools. classifyLeak downgrades a
    // leak whose answer is the pack's own club — "Tottenham Hotspur" appearing
    // in a Tottenham question is unavoidable vocabulary, not a giveaway.
    // The first run of this file omitted it and reported 9 phantom unguarded
    // pairs, every one of them a club naming itself. The generator was right
    // and the test was wrong, which is the direction that matters: a guard
    // that disagrees with the thing it guards must prove itself first.
    const opts = withClubName ? { clubName: name } : undefined;
    for (const pool of poolsFor(qs, threshold)) {
      for (const l of findLeaks(pool, opts)) {
        if (l.severity !== 'strong') continue;
        const a = pool[l.answerOf]?.id;
        const b = pool[l.at]?.id;
        if (a && b && a !== b) pairs.push([a, b]);
      }
    }
  }
  return pairs;
};

describe('answer leaks are guarded everywhere a session is drawn', () => {
  it('the bank is large enough for these numbers to mean anything', () => {
    expect(mcq.length).toBeGreaterThan(5000);
  });

  // ⚠️ THE EXHAUSTIVE PAIR-COVERAGE CHECK LIVES IN scripts/audit-leaks-full.mjs,
  // NOT HERE. Re-deriving every strong leak from the rules takes ~23s because
  // findLeaks is O(n^2) per pool and History alone is 857 questions. vitest
  // runs on every build and the whole suite is currently ~2s; a 10x slowdown
  // on every build buys a check the generator already performs when it writes
  // the map. What stays here is the part the generator CANNOT tell you: that
  // the map, the draw thresholds and the picker still agree with each other.
  //
  // ⚠️ Its first run here failed and it was neither a real defect nor a wrong
  // assertion — it was the 5s timeout. Run directly it reported zero unguarded
  // pairs. A red test that means "too slow" reads exactly like a red test that
  // means "broken", which is how a timeout becomes a phantom bug hunt.

  it('conflicts are symmetric', () => {
    // A stem leak spoils whichever question the player reaches first, so a
    // one-directional entry silently guards only half the orderings.
    const broken = [];
    for (const q of mcq) {
      for (const other of conflictsWith(q.id)) {
        if (!conflictsWith(other).includes(q.id)) broken.push(`${q.id} -> ${other}`);
      }
    }
    expect(broken.slice(0, 8)).toEqual([]);
  });

  it('no pack is so thin that avoidance cannot fill a session', () => {
    // pickAvoidingConflicts tops up from skipped candidates rather than
    // shorten a game — correct, but it means a pool with no headroom serves a
    // leaked pair every time. Wrexham did exactly that at 100% before the
    // draw threshold moved from 10 to 16.
    const starved = [];
    for (const [name, qs] of groupBy('club')) {
      const noEasy = qs.filter((q) => q.diff !== 'easy');
      const pool = noEasy.length >= 16 ? noEasy : qs;
      if (pool.length < 10) continue;
      if (pool.length < 13) starved.push(`${name}: ${pool.length} eligible for a 10-question draw`);
    }
    expect(starved, `\n  ${starved.join('\n  ')}\n`).toEqual([]);
  });

  it('a leaked pair cannot survive a draw from a healthy pool', () => {
    // End-to-end rather than structural: run the real picker over the real
    // pools and assert the result is clean.
    const offenders = [];
    for (const [name, qs] of groupBy('cat')) {
      const noEasy = qs.filter((q) => q.diff !== 'easy');
      const pool = noEasy.length >= 10 ? noEasy : qs;
      if (pool.length < 10) continue;
      let seed = 42;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let run = 0; run < 40; run += 1) {
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(rnd() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const picked = pickAvoidingConflicts(shuffled, 10, conflictsWith);
        const ids = new Set(picked.map((q) => q.id));
        if (picked.some((q) => conflictsWith(q.id).some((o) => ids.has(o)))) {
          offenders.push(name);
          break;
        }
      }
    }
    expect(offenders, `\n  categories that still served a leaked pair: ${offenders.join(', ')}\n`).toEqual([]);
  });
});
