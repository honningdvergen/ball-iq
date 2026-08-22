import { describe, it, expect } from 'vitest';
import { QB } from '../../src/questions.js';

/**
 * One club, one spelling.
 *
 * ⚠️ THIS HAS NOW FIRED SIX TIMES, and the sixth was mine. Writing the
 * summer-2026 pack on 2026-08-21 I tagged four questions `club:"Tottenham"`
 * and `club:"Inter"` while the bank has used `"Tottenham Hotspur"` (42
 * questions) and `"Inter Milan"` (45) since forever. Nothing failed. The
 * questions simply detached from their packs: they would never appear in the
 * Spurs or Inter club quizzes, nor on either club's SEO page, and the club
 * page's own count silently understated itself.
 *
 * `club-alias.test.js` guards a DIFFERENT join — leagues.mjs short names
 * against clubs.mjs page names. Nothing was watching the `club:` field inside
 * questions.js, which is the one a question author actually types.
 *
 * The detector is deliberately narrow: it flags a club value whose words are a
 * strict PREFIX or SUFFIX of another club value's words. That is the shape a
 * split always takes ("Inter" inside "Inter Milan"), and it does not fire on
 * genuinely distinct clubs that merely share a word — "Manchester United" and
 * "Manchester City" are neither a prefix nor a suffix of one another, and the
 * same holds for the Real, Atlético and Athletic families.
 *
 * If this fails, the fix is ALWAYS to rename the newcomer to the established
 * spelling. Never add the short form to an allowlist: the point is that one
 * club has one name, and the established spelling is whichever the existing
 * pack already uses.
 */
describe('question bank club names', () => {
  const clubs = [...new Set(QB.filter((q) => q.club).map((q) => q.club))];
  const count = (c) => QB.filter((q) => q.club === c).length;
  const words = (c) => c.trim().split(/\s+/);

  const isPrefixOrSuffix = (a, b) => {
    const A = words(a);
    const B = words(b);
    if (A.length >= B.length) return false;
    const head = B.slice(0, A.length).join(' ').toLowerCase();
    const tail = B.slice(B.length - A.length).join(' ').toLowerCase();
    const key = A.join(' ').toLowerCase();
    return head === key || tail === key;
  };

  it('never carries two spellings of the same club', () => {
    const splits = [];
    for (const a of clubs) {
      for (const b of clubs) {
        if (a === b) continue;
        if (isPrefixOrSuffix(a, b)) {
          splits.push(`"${a}" (${count(a)} questions) looks like a split of "${b}" (${count(b)})`);
        }
      }
    }
    expect(splits, `\n  ${splits.join('\n  ')}\n\nRename the newcomer to the established spelling.`)
      .toEqual([]);
  });

  it('has no club referenced by a single stray question', () => {
    // A club with exactly one question is far more often a typo than a real
    // pack — it is what both 2026-08-21 splits looked like before anyone
    // noticed. Not fatal on its own, so this asserts the count rather than
    // banning it outright; update the number deliberately if a genuine new
    // club is being seeded.
    const singletons = clubs.filter((c) => count(c) === 1);
    expect(singletons, `singleton clubs: ${singletons.join(', ')}`).toEqual([]);
  });
});
