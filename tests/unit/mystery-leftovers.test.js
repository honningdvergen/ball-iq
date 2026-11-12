// Mystery Player: the leftovers from the 14 Oct review (docs/TODO.md, "From
// that review, later"). One describe per item.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { clubsOf, mainClub, overlapYears, careerOf, withCareerFixes, NOW_YEAR } from '../../src/lib/mysteryCareer.js';
import { puzzleYear, MYSTERY_ANCHOR_DAY, rankPool, explainGuess, clueLadder } from '../../src/lib/mysteryPlayer.js';
import { clubSpacingBreaks } from '../../scripts/mystery-answer-bar.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('a running spell counts to the puzzle year, not 2026', () => {
  // Two clubs; the spell at Beta City from 2023 is still running.
  const careers = { c: ['Alpha Town', 'Beta City'], p: { x: [[0, 2015, 2020], [1, 2023, null]], y: [[1, 2021, null]] } };
  const x = { id: 'x', born: 1995 };
  const y = { id: 'y', born: 1996 };

  it('puzzleYear is the year of the day itself', () => {
    expect(puzzleYear(MYSTERY_ANCHOR_DAY)).toBe(2026); // No. 1, 3 Aug 2026
    expect(puzzleYear(MYSTERY_ANCHOR_DAY + 150)).toBe(2026); // 31 Dec 2026
    expect(puzzleYear(MYSTERY_ANCHOR_DAY + 151)).toBe(2027); // 1 Jan 2027
  });

  it('years at a club, teammate years and the club clue follow the year', () => {
    expect(clubsOf(x, careers, 2026).get('Beta City').years).toBe(3);
    expect(clubsOf(x, careers, 2027).get('Beta City').years).toBe(4);
    expect(overlapYears({ from: 2023, to: null }, { from: 2021, to: null }, 2027)).toBe(4);
    // Five years at Alpha beat three at Beta in 2026; by 2029 Beta has six.
    expect(mainClub(x, careers, 2026)).toBe('Alpha Town');
    expect(mainClub(x, careers, 2029)).toBe('Beta City');
    expect(explainGuess(y, x, careers, 2027).shared[0].together).toBe(4);
    expect(explainGuess(y, x, careers, 2026).shared[0].together).toBe(3);
  });

  it('with no year given, the old fallback stands (non-dated callers)', () => {
    expect(NOW_YEAR).toBe(2026);
    expect(clubsOf(x, careers).get('Beta City').years).toBe(3);
  });

  it('every day up to 31 Dec 2026 reads exactly as before', () => {
    const pool = read('../../src/data/mysteryPool.json');
    const roles = read('../../src/data/mysteryRoles.json');
    const schedule = read('../../src/data/mysterySchedule.json');
    const fixed = withCareerFixes(read('../../src/data/mysteryCareers.json'), read('../../src/data/mysteryCareerFixes.json'));
    const byId = new Map(pool.map((p) => [p.id, p]));
    for (let i = 0; i <= 150; i++) {
      const a = byId.get(schedule[i]);
      if (!a) continue;
      const y2 = puzzleYear(MYSTERY_ANCHOR_DAY + i);
      expect(clueLadder(a, fixed, roles, y2), `day ${i}`).toEqual(clueLadder(a, fixed, roles));
      expect(careerOf(a, fixed, y2), `day ${i}`).toEqual(careerOf(a, fixed));
    }
    const a = byId.get(schedule[128]);
    const r1 = rankPool(pool, a, fixed, puzzleYear(MYSTERY_ANCHOR_DAY + 128));
    const r2 = rankPool(pool, a, fixed);
    expect([...r1]).toEqual([...r2]);
  });

  it('the screen passes the puzzle year to everything that counts spells', () => {
    const s = src('../../src/screens/MysteryPlayer.jsx');
    expect(s).toMatch(/const year = puzzleYear\(dayIndex\)/);
    expect(s).toMatch(/rankPool\(POOL, answer, CAREERS, year\)/);
    expect(s).toMatch(/clueLadder\(answer, CAREERS, ROLES, year\)/);
    expect(s).toMatch(/careerOf\(answer, CAREERS, year\)/);
    expect(s).toMatch(/mainClub\(answer, CAREERS, year\)/);
    expect(s).toMatch(/explainGuess\(byId\.get\(g\.id\), answer, CAREERS, year\)/);
    expect(s).not.toMatch(/NOW_YEAR|getFullYear\(\)/);
  });
});

describe('one running spell per answer', () => {
  // Grealish (day 289) read "Manchester City 2021–now" AND "Everton 2025–now":
  // Wikidata keeps a parent club's spell open across a loan. The reveal can
  // print only one "now". The fix closes City at 2026 (not 2025: his City
  // years must count to 2026 exactly as before, or Haaland's day 94, already
  // served, would rank him differently). Day 57 (ter Stegen) is served and
  // frozen, so the guard starts at the first unchecked day.
  const pool = read('../../src/data/mysteryPool.json');
  const schedule = read('../../src/data/mysterySchedule.json');
  const fixed = withCareerFixes(read('../../src/data/mysteryCareers.json'), read('../../src/data/mysteryCareerFixes.json'));
  const byId = new Map(pool.map((p) => [p.id, p]));

  it('Grealish has one "now"', () => {
    const g = byId.get('Q16056053');
    // His day is wherever the schedule puts him (a redraw beyond the checked
    // days moves it: 289 → 335 on 7 Nov 2026); the guard is about his career.
    const day = schedule.indexOf('Q16056053');
    expect(day).toBeGreaterThan(128);
    const running = careerOf(g, fixed, puzzleYear(MYSTERY_ANCHOR_DAY + day)).filter((s) => s.to == null).map((s) => s.club);
    expect(running).toEqual(['Everton']);
  });

  it('no answer after the served days has two', () => {
    const bad = [];
    for (let i = 129; i < schedule.length; i++) {
      const a = byId.get(schedule[i]);
      if (!a) continue;
      const running = careerOf(a, fixed, puzzleYear(MYSTERY_ANCHOR_DAY + i)).filter((s) => s.to == null && s.from != null);
      if (running.length > 1) bad.push(`${i} ${a.name}: ${running.map((s) => s.club).join(' + ')}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('the all-done strip\'s "New in" ticks', () => {
  // It read `new Date()` in Home's (memoised) render, so it froze at whatever
  // Home last rendered. Now its own component with its own clock.
  const s = src('../../src/screens/HomeScreen.jsx');
  const body = s.slice(s.indexOf('function NextDailiesIn()'), s.indexOf('function HomeScreenImpl('));

  it('counts to local midnight from a clock that updates', () => {
    expect(body).toMatch(/setInterval\(\(\) => setNow\(new Date\(\)\), 30000\)/);
    expect(body).toMatch(/clearInterval\(id\)/);
    expect(body).toMatch(/countdownText\(msToNextLocalMidnight\(now\)\)/);
  });

  it('the strip uses it, and nothing in Home renders a frozen countdown', () => {
    const strip = s.slice(s.indexOf('className="daily-done-strip"'), s.indexOf('className="dds-chips"'));
    expect(strip).toMatch(/<NextDailiesIn \/>/);
    expect(s).not.toMatch(/msToNextLocalMidnight\(new Date\(\)\)/);
  });
});

describe('the weights comment in mysteryPlayer.js matches W', () => {
  // It said 300 per club + 200 together, full at 6; the code says 200 + 300,
  // full at 5. Read both from the source so they cannot drift apart again.
  const s = src('../../src/lib/mysteryPlayer.js');
  const w = (k) => Number(s.match(new RegExp(`\\n  ${k}: (\\d+),`))[1]);

  it('shared club, together, full-at, position, era, age', () => {
    expect(s).toContain(`${w('sharedClub')} for each club both played for, +${w('together')} scaled by`);
    expect(s).toContain(`TOGETHER (full at ${w('togetherFull')})`);
    expect(s).toContain(`SAME POSITION: ${w('slot')}`);
    expect(s).toContain(`ERA, as the tiebreak: ${w('era')}`);
    expect(s).toContain(`AGE: ${w('age')}`);
    expect(s).toContain(`, ${w('slot') + w('era') + w('age')} — below`);
    const four = w('sharedClub') + w('together') * 4 / w('togetherFull');
    expect(four).toBeGreaterThan(w('slot') + w('era') + w('age'));
    expect(s).toContain(`= ${four})`);
  });
});

describe('the club clue is not repeated inside ten days', () => {
  const pool = read('../../src/data/mysteryPool.json');
  const schedule = read('../../src/data/mysterySchedule.json');
  const fixed = withCareerFixes(read('../../src/data/mysteryCareers.json'), read('../../src/data/mysteryCareerFixes.json'));
  const byId = new Map(pool.map((p) => [p.id, p]));

  it('finds the served Zlatan/Nesta pair: a career fix after the draw', () => {
    const raw = withCareerFixes(read('../../src/data/mysteryCareers.json'), {});
    const zlatan = byId.get(schedule[75]);
    expect(mainClub(zlatan, raw)).toBe('Inter Milan'); // what the draw saw
    expect(mainClub(zlatan, fixed)).toBe('AC Milan'); // after his first Milan was restored
    const breaks = clubSpacingBreaks(schedule, byId, fixed, { from: 73, to: 128 });
    expect(breaks).toEqual([{ day: 83, earlier: 75, club: 'AC Milan' }]);
  });

  // ⚠️ Days after 128 can still be redrawn (gen-mystery-schedule.mjs --from),
  // and audit-mystery-schedule.mjs lists these at every build. They are known,
  // not accepted: 388 was on main already; the other five came when 2027 days
  // started counting running spells to 2027 (Gakpo, Isak, Gyökeres, Milik).
  // A NEW repeat fails here; clearing one by a redraw does not.
  const KNOWN = ['271/262 Liverpool', '292/287 Liverpool', '323/319 Arsenal', '330/323 Arsenal', '350/346 Juventus', '388/385 Chelsea'];
  it('no new repeat in the days still to be drawn', () => {
    const found = clubSpacingBreaks(schedule, byId, fixed, { from: 129 }).map((b) => `${b.day}/${b.earlier} ${b.club}`);
    expect(found.filter((b) => !KNOWN.includes(b))).toEqual([]);
  });
});
