import { describe, it, expect } from 'vitest';
import { CLUBS } from '../../scripts/seo/clubs.mjs';
import { LEAGUES } from '../../scripts/seo/leagues.mjs';
import { pageNameFor, suspectedMissingAliases } from '../../scripts/seo/club-alias.mjs';

// leagues.mjs is the coverage map the club wave is picked from. A club whose
// short name doesn't resolve to a page reads as MISSING COVERAGE — so a missing
// alias sends us off to write a club we already published.
//
// It has happened three times: Lyon (page is "Olympique Lyonnais"), Monaco
// ("AS Monaco") and Beşiktaş ("Besiktas"). Nothing failed; the gap list simply
// lied, and a whole question pack was written against it before anyone checked.

const paged = new Set(CLUBS.map((c) => c.club));

describe('club alias map', () => {
  it('resolves every alias to a page that actually exists', () => {
    // A stale alias is the opposite failure: it hides a real gap.
    for (const [short, long] of Object.entries(
      // eslint-disable-next-line no-undef
      Object.fromEntries(
        LEAGUES.flatMap((lg) => lg.clubs)
          .map((c) => [c.name, pageNameFor(c.name, paged)])
          .filter(([, v]) => v)
      )
    )) {
      expect(paged.has(long), `${short} -> ${long} is not a page`).toBe(true);
    }
  });

  it('has no unreviewed near-miss between a league short name and a page name', () => {
    // Containment alone is not proof — "Angers" sits inside "Rangers", and they
    // are different clubs in different countries. So each near-miss is listed
    // here by hand with its verdict, and a NEW one fails the build until someone
    // decides which of the two errors it is: a missing alias, or a coincidence.
    const REVIEWED = new Set([
      'Angers', // ≠ Rangers. France vs Scotland. Genuinely uncovered.
    ]);

    const unreviewed = suspectedMissingAliases(LEAGUES, paged).filter(
      (s) => !REVIEWED.has(s.short)
    );

    expect(
      unreviewed,
      `Unreviewed near-miss(es). Either add an alias to club-alias.mjs, or add the ` +
        `short name to REVIEWED here with a note on why it is a different club:\n` +
        unreviewed.map((s) => `  ${s.short} ~ ${s.near.join(', ')}`).join('\n')
    ).toEqual([]);
  });

  it('reports Ligue 1 as complete now that Lyon and Monaco resolve', () => {
    const l1 = LEAGUES.find((lg) => lg.league === 'Ligue 1');
    const gaps = l1.clubs.filter((c) => !pageNameFor(c.name, paged)).map((c) => c.name);
    expect(gaps).not.toContain('Lyon');
    expect(gaps).not.toContain('Monaco');
  });
});
