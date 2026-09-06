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

  // ⚠️ ONE exception, and it is not a short form of anything. Rangers play in
  // Glasgow and Queens Park Rangers play in west London: two clubs, two
  // countries, and the detector's stated design ("does not fire on genuinely
  // distinct clubs that merely share a word") simply did not anticipate a
  // distinct pair where one name ends with the other. Every OTHER hit is a
  // split and the fix is still to rename the newcomer — do not grow this list
  // to silence a real one. Both spellings must already be in the bank for the
  // exemption to mean anything, so it is asserted below rather than assumed.
  const DISTINCT_PAIRS = new Set(['Rangers|Queens Park Rangers']);

  const isPrefixOrSuffix = (a, b) => {
    if (DISTINCT_PAIRS.has(`${a}|${b}`) || DISTINCT_PAIRS.has(`${b}|${a}`)) return false;
    const A = words(a);
    const B = words(b);
    if (A.length >= B.length) return false;
    const head = B.slice(0, A.length).join(' ').toLowerCase();
    const tail = B.slice(B.length - A.length).join(' ').toLowerCase();
    const key = A.join(' ').toLowerCase();
    return head === key || tail === key;
  };

  it('the one exempted pair is two real clubs, both present', () => {
    // If either side ever leaves the bank, the exemption is dead weight and
    // should go with it.
    expect(clubs, 'Rangers (Glasgow)').toContain('Rangers');
    expect(clubs, 'Queens Park Rangers (London)').toContain('Queens Park Rangers');
  });

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

/**
 * One competition, one category.
 *
 * ⚠️ Same failure as the club split above, one field over. The bank carried
 * BOTH `cat:"UCL"` (610 questions) and `cat:"ChampionsLeague"` (135) for the
 * same competition — not an era split, since both spanned pre- and post-1992.
 * Only "UCL" is in the app's CATS array, so those 135 questions could never be
 * served by the Champions League quiz. They were reachable only via "All".
 *
 * What makes it worth a guard: the SEO layer had already noticed and quietly
 * compensated — gen-seo-pages.mjs maps /champions-league|european-cup/ to
 * BOTH names. One half of the codebase worked around the drift while the other
 * half silently lost 135 questions. That is this repo's signature bug.
 *
 * Adding a category is a deliberate act: it must be wired into the app's CATS
 * array or LEAGUE_QUIZ_SECTIONS, or the questions are unreachable. So the list
 * lives here and adding to it should feel like a decision.
 */
describe('question bank categories', () => {
  // Every category the app can actually route to, plus the two that are
  // reachable by other means: `chaos` has its own mode, and `History` is a
  // deliberate general-pool bucket with no dedicated picker entry.
  const REACHABLE = new Set([
    'WorldCup', 'Euros', 'UCL', 'PL', 'LaLiga', 'Bundesliga', 'SerieA',
    'Ligue1', 'Transfers', 'Managers', 'Records', 'Legends',
    'SuperLig', 'Primeira',
    'chaos', 'History',
  ]);

  it('uses no category the app cannot route to', () => {
    const counts = {};
    for (const q of QB) counts[q.cat] = (counts[q.cat] || 0) + 1;
    const orphans = Object.keys(counts)
      .filter((c) => !REACHABLE.has(c))
      .map((c) => `${c} (${counts[c]} questions unreachable)`);
    expect(
      orphans,
      `\n  ${orphans.join('\n  ')}\n\nWire it into CATS/LEAGUE_QUIZ_SECTIONS, or fold it into an existing category.`,
    ).toEqual([]);
  });
});
