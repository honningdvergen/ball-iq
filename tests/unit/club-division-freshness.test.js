import { describe, it, expect } from 'vitest';
import { LEAGUES } from '../../scripts/seo/leagues.mjs';
import { CLUB_COMPETITION, NO_ROSTER_COMPETITIONS } from '../../scripts/seo/club-competition.mjs';

/**
 * ⚠️ THE "RE-AUDIT EVERY AUGUST" NOTE, TURNED INTO SOMETHING THAT CAN FAIL.
 *
 * Every club's competition prints as text on a public page, and every value has
 * a shelf life of one season. The 2026-09-06 audit found two rotted entries
 * (Sheffield Wednesday, Saint-Étienne) — a season behind, on pages ranking on
 * Google. The fix then was a comment saying "re-audit every August". A comment
 * cannot fail a build; this can.
 *
 * WHAT THIS DOES NOT DO: it cannot tell you a value is WRONG — only a source
 * check can (feedback_traceable_is_not_true). What it can do is refuse to stay
 * green once the season the rosters were verified for is over, so the check
 * happens because the gate demands it, not because someone remembered.
 *
 * Rollover rules, deliberately generous so this fires once a year, not on a
 * flaky boundary:
 *   European leagues ("YYYY-YY"): the new season is expected from 1 August.
 *   Calendar leagues ("YYYY"):    the new season is expected from 1 March.
 */
function expectedSeasons(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const euroStart = m >= 8 ? y : y - 1;
  const euro = `${euroStart}-${String(euroStart + 1).slice(2)}`;
  const calendar = String(m >= 3 ? y : y - 1);
  return { euro, calendar };
}

describe('the club-division data is for the CURRENT season', () => {
  const { euro, calendar } = expectedSeasons();

  it('every league roster in leagues.mjs carries the current season', () => {
    const stale = LEAGUES
      .filter((l) => {
        const isCalendar = /^\d{4}$/.test(l.season);
        return isCalendar ? l.season !== calendar : l.season !== euro;
      })
      .map((l) => `${l.league} (${l.season})`);
    expect(
      stale,
      '\n  ⚠️ A NEW SEASON HAS STARTED and these rosters are from the old one.\n' +
      `  Expected ${euro} (European) / ${calendar} (calendar leagues).\n` +
      '  Promotions and relegations have happened; club pages print their division\n' +
      '  as text. Re-verify EVERY league against live sources — the\n' +
      '  clubs-directory-roster-verify workflow does this — then update the season\n' +
      '  strings. Do NOT just bump the strings to make this green: that is the\n' +
      '  exact rot this test exists to stop.\n',
    ).toEqual([]);
  });

  it('every hand-maintained competition still names a league that exists', () => {
    // Guards the OTHER direction: a league renamed or dropped in leagues.mjs
    // orphaning a club-competition value. gen-club-index exits on a club with
    // NO competition; this catches one with a competition that no longer exists.
    // A value is valid if a roster backs it, OR it is declared roster-less in
    // club-competition.mjs itself — where declaring it is a deliberate act.
    const known = new Set(LEAGUES.map((l) => l.league));
    const orphans = Object.entries(CLUB_COMPETITION)
      .filter(([, league]) => !known.has(league) && !NO_ROSTER_COMPETITIONS.has(league))
      .map(([club, league]) => `${club} -> "${league}"`);
    expect(orphans, 'names a league that has neither a roster nor a NO_ROSTER_COMPETITIONS declaration').toEqual([]);
  });

  it('nothing in NO_ROSTER_COMPETITIONS has quietly gained a roster', () => {
    // If a league gets a roster, the hand entries for its clubs should be
    // replaced by the roster match — leaving both is how two sources drift.
    const known = new Set(LEAGUES.map((l) => l.league));
    const shadowed = [...NO_ROSTER_COMPETITIONS].filter((l) => known.has(l));
    expect(shadowed, 'declared roster-less but leagues.mjs now has a roster — remove from the set').toEqual([]);
  });

  it('the rollover rule itself is right (so the gate fires when it should)', () => {
    expect(expectedSeasons(new Date('2026-09-07T12:00:00Z'))).toEqual({ euro: '2026-27', calendar: '2026' });
    expect(expectedSeasons(new Date('2027-07-31T12:00:00Z'))).toEqual({ euro: '2026-27', calendar: '2027' });
    expect(expectedSeasons(new Date('2027-08-01T12:00:00Z'))).toEqual({ euro: '2027-28', calendar: '2027' });
    expect(expectedSeasons(new Date('2027-02-15T12:00:00Z'))).toEqual({ euro: '2026-27', calendar: '2026' });
    expect(expectedSeasons(new Date('2027-03-01T12:00:00Z'))).toEqual({ euro: '2026-27', calendar: '2027' });
  });
});
