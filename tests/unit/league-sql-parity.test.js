import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LEAGUE_DAY_OFFSET, leagueDayIndex, leaguePoints, leagueWeekStart, LEAGUE_BUCKET_MAX } from '../../src/lib/leagueResults.js';
import { WORDLE_ANCHOR_DAY, getFootleNumber } from '../../src/lib/footleNumber.js';
import { TRAIL_ANCHOR_DAY, getTrailNumber } from '../../src/lib/trail.js';
import { TOP10_ANCHOR_DAY } from '../../src/data/top10Meta.js';
import { getTop10Number } from '../../src/lib/top10.js';
import { dayIndexForDate } from '../../src/lib/date.js';

/**
 * THE SERVER DECIDES WHICH DAY A RESULT BELONGS TO, AND WHAT IT IS WORTH.
 *
 * Mates' leagues never trust the device clock: the server maps a puzzle's
 * edition back to its day (_league_day_index) and scores it (_league_points).
 * If those drift from the games' own numbering, a Footle played on Monday is
 * filed under Tuesday and the week's table is quietly wrong. The JS copies in
 * leagueResults.js are for display only, and this pins all three together:
 * the SQL text, the JS copy, and the games' real edition functions.
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const MIG = read('../../supabase/migrations/v3_0_mates_leagues.sql');
const fnBody = (name) => {
  const i = MIG.indexOf(`create or replace function public.${name}(`);
  expect(i, `${name} is in the migration`).toBeGreaterThan(-1);
  return MIG.slice(i, MIG.indexOf('$function$;', i));
};

describe('edition -> day, SQL and JS and the games agree', () => {
  it('the SQL anchors are the games\' anchors', () => {
    const body = fnBody('_league_day_index');
    const anchor = (g) => Number((new RegExp(`when '${g}'\\s+then p_edition \\+ (\\d+)`).exec(body) || [])[1]);
    expect(anchor('footle')).toBe(WORDLE_ANCHOR_DAY - 1);
    expect(anchor('trail')).toBe(TRAIL_ANCHOR_DAY - 1);
    expect(anchor('top10')).toBe(TOP10_ANCHOR_DAY - 1);
    expect(body).toMatch(/when 'daily7' then p_edition\b/);
    expect(LEAGUE_DAY_OFFSET).toEqual({ footle: WORDLE_ANCHOR_DAY - 1, trail: TRAIL_ANCHOR_DAY - 1, top10: TOP10_ANCHOR_DAY - 1, daily7: 0 });
  });

  it('every game\'s edition for a date maps back to that date\'s day index', () => {
    for (const ymd of ['2026-10-12', '2026-10-16', '2026-10-18', '2026-12-31', '2027-03-28']) {
      const [y, m, d] = ymd.split('-').map(Number);
      const date = new Date(y, m - 1, d, 21, 30);
      const day = dayIndexForDate(date);
      expect(leagueDayIndex('footle', getFootleNumber(date)), `footle ${ymd}`).toBe(day);
      expect(leagueDayIndex('trail', getTrailNumber(date)), `trail ${ymd}`).toBe(day);
      expect(leagueDayIndex('top10', getTop10Number(date)), `top10 ${ymd}`).toBe(day);
      expect(leagueDayIndex('daily7', day), `daily7 ${ymd}`).toBe(day);
    }
  });

  it('the week starts on Monday, in SQL and JS', () => {
    expect(fnBody('_league_week_start')).toMatch(/p_day - \(\(p_day \+ 3\) % 7\)/);
    const mon = dayIndexForDate(new Date(2026, 9, 12));
    for (let i = 0; i < 7; i++) expect(leagueWeekStart(mon + i)).toBe(mon);
    expect(leagueWeekStart(mon + 7)).toBe(mon + 7);
    expect(new Date(mon * 86400000).getUTCDay()).toBe(1);
  });

  it('the whistle is Monday 00:00 after the week, in the league\'s zone', () => {
    expect(fnBody('_league_whistle')).toMatch(/\(date '1970-01-01' \+ \(p_week_start \+ 7\)\)::timestamp at time zone l\.tz/);
  });
});

describe('the scale, SQL and its display copy', () => {
  it('the SQL says what the spec says', () => {
    const body = fnBody('_league_points');
    expect(body).toMatch(/greatest\(5, 11 - p_bucket\)/);                 // 1->10 … 6+->5
    expect(body).toMatch(/p_won is not true[^\n]*then 1/);                 // a miss is 1
    expect(body).toMatch(/least\(7, p_bucket\) \+ 3/);                    // daily7 score + 3
    expect(body).toMatch(/greatest\(1, least\(10, coalesce\(p_bucket, 0\)\)\)/); // top10 found, min 1
  });

  it('the display copy matches, game by game', () => {
    expect([1, 2, 3, 4, 5, 6].map((b) => leaguePoints('footle', b, true))).toEqual([10, 9, 8, 7, 6, 5]);
    expect(leaguePoints('footle', 0, false)).toBe(1);
    expect([1, 2, 6, 9, 30].map((b) => leaguePoints('trail', b, true))).toEqual([10, 9, 5, 5, 5]);
    expect(leaguePoints('trail', 0, false)).toBe(1);
    expect([0, 1, 4, 7].map((b) => leaguePoints('daily7', b, true))).toEqual([1, 4, 7, 10]);
    expect([0, 1, 7, 10].map((b) => leaguePoints('top10', b, true))).toEqual([1, 1, 7, 10]);
  });

  it('the client limits on the bucket are the server\'s', () => {
    const body = fnBody('record_league_result');
    for (const [g, max] of Object.entries(LEAGUE_BUCKET_MAX)) {
      expect(body, `${g} limit`).toMatch(new RegExp(`p_game = '${g}' and p_bucket > ${max}\\b`));
    }
  });

  it('the client never sends points', () => {
    const LIB = read('../../src/lib/leagueResults.js');
    const body = LIB.slice(LIB.indexOf('async function send('), LIB.indexOf('// ⚠️ TWO PANELS'));
    expect(body).toMatch(/p_game: game, p_edition: edition, p_bucket: bucket, p_won: won !== false/);
    expect(body).not.toMatch(/p_points|points:/);
    expect(fnBody('record_league_result')).not.toMatch(/p_points/);
  });
});
