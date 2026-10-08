// Top 10: the grader, the guess box for clubs and nations, and the data.
//
// The data tests run against EVERY list the builder can produce (--all), not
// only the fact-checked ones in src/data/top10Lists.json, so a list is held to these
// rules from the day it is written, not from the day it is scheduled.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  TOP10_LIVES, TOP10_ANCHOR_DAY, getTop10Number, getTop10Id, isTop10Live,
  gradeTop10, outcomeOf, rankListSuggestions, buildTop10ShareText, formatAsOf,
} from '../../src/lib/top10.js';
import { normaliseName } from '../../src/lib/mysteryPlayer.js';
import { DAILY_GAMES, SCORE_GAMES, summariseDistribution } from '../../src/lib/dailyResults.js';
import { MODE_ACCENT, MODE_RGB } from '../../src/lib/accents.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ALL = JSON.parse(execFileSync('node', ['scripts/gen-top10.mjs', '--all', '--stdout'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
const ON_DISK = JSON.parse(readFileSync(new URL('../../src/data/top10Lists.json', import.meta.url), 'utf8'));
const POOL_IDS = new Set(JSON.parse(readFileSync(new URL('../../src/data/mysteryPool.json', import.meta.url), 'utf8')).map((p) => p.id));

const LIST = {
  slots: 'abcdefghij'.split('').map((c, i) => ({ key: c, name: c.toUpperCase(), clue: String(2000 + i) })),
  near: [{ key: 'k', name: 'K', note: '11th, last in 1999' }],
};
const day = (...keys) => ({ picks: keys.map((k) => ({ k, n: k.toUpperCase() })) });

describe('gradeTop10', () => {
  it('starts with three lives and nothing found', () => {
    const g = gradeTop10(LIST, day());
    expect(g).toMatchObject({ score: 0, lives: TOP10_LIVES, done: false, perfect: false, out: false });
    expect(g.found).toEqual(new Array(10).fill(false));
  });

  it('fills the slot a right pick belongs to, wherever it sits', () => {
    const g = gradeTop10(LIST, day('j', 'a'));
    expect(g.found[9]).toBe(true);
    expect(g.found[0]).toBe(true);
    expect(g.order).toEqual([9, 0]);
    expect(g.score).toBe(2);
    expect(g.lives).toBe(3);
  });

  it('takes a life for a miss and ends the game on the third', () => {
    expect(gradeTop10(LIST, day('x')).lives).toBe(2);
    const g = gradeTop10(LIST, day('a', 'x', 'y', 'z'));
    expect(g).toMatchObject({ score: 1, lives: 0, out: true, done: true, perfect: false });
  });

  it('a near miss is shown and costs nothing', () => {
    const g = gradeTop10(LIST, day('k', 'x'));
    expect(g.close.map((c) => c.key)).toEqual(['k']);
    expect(g.close[0].near.note).toMatch(/^11th/);
    expect(g.wrong.map((w) => w.key)).toEqual(['x']);
    expect(g.lives).toBe(2);
  });

  it('ten out of ten is perfect, with the lives that are left', () => {
    const g = gradeTop10(LIST, day('x', ...'abcdefghij'.split('')));
    expect(g).toMatchObject({ score: 10, perfect: true, done: true, out: false, lives: 2 });
  });

  it('ignores a repeated pick and anything after the game has ended', () => {
    expect(gradeTop10(LIST, day('a', 'a', 'a')).score).toBe(1);
    expect(gradeTop10(LIST, day('x', 'x', 'x')).lives).toBe(2);
    const g = gradeTop10(LIST, day('x', 'y', 'z', 'a', 'b'));
    expect(g.score).toBe(0);
    expect(g.out).toBe(true);
  });

  it('giving up ends the game without being a perfect or an out', () => {
    const g = gradeTop10(LIST, { ...day('a'), gaveUp: true });
    expect(g).toMatchObject({ done: true, gaveUp: true, perfect: false, out: false, score: 1 });
    // A finished board cannot be given up afterwards.
    expect(gradeTop10(LIST, { ...day(...'abcdefghij'.split('')), gaveUp: true }).gaveUp).toBe(false);
  });

  it('outcomeOf says what a pick would be before it is made', () => {
    expect(outcomeOf(LIST, day('a'), 'a')).toBe('repeat');
    expect(outcomeOf(LIST, day(), 'a')).toBe('hit');
    expect(outcomeOf(LIST, day(), 'k')).toBe('near');
    expect(outcomeOf(LIST, day(), 'x')).toBe('miss');
  });
});

describe('the schedule', () => {
  it('the anchor is pinned: every share and every recorded result carries its number', () => {
    expect(TOP10_ANCHOR_DAY).toBe(20738);
    expect(getTop10Number(new Date(2026, 9, 12))).toBe(1);
    expect(getTop10Number(new Date(2026, 9, 13))).toBe(2);
  });

  it('Home shows the row only on a day the schedule covers', () => {
    expect(isTop10Live(new Date(2026, 9, 11), 3)).toBe(false);
    expect(isTop10Live(new Date(2026, 9, 12), 3)).toBe(true);
    expect(isTop10Live(new Date(2026, 9, 14), 3)).toBe(true);
    expect(isTop10Live(new Date(2026, 9, 15), 3)).toBe(false);
    // Nothing scheduled, nothing shown: how the game ships before launch.
    expect(isTop10Live(new Date(2026, 9, 12), 0)).toBe(false);
  });

  it('serves nothing before launch or past the end of the log', () => {
    const log = ['one', 'two'];
    expect(getTop10Id(new Date(2026, 9, 11), log)).toBe(null);
    expect(getTop10Id(new Date(2026, 9, 12), log)).toBe('one');
    expect(getTop10Id(new Date(2026, 9, 13), log)).toBe('two');
    expect(getTop10Id(new Date(2026, 9, 14), log)).toBe(null);
  });
});

describe('share text', () => {
  const found = [true, true, false, true, false, false, true, false, false, false];
  const text = buildTop10ShareText({ number: 7, title: 'The last 10 different clubs to win the FA Cup', found, lives: 1, streak: 3 });

  it('shows the shape of the result and the list it was', () => {
    expect(text).toContain('Top 10 #7');
    expect(text).toContain('The last 10 different clubs to win the FA Cup');
    expect(text).toContain('🟩🟩⬛🟩⬛⬛🟩⬛⬛⬛ 4/10');
    expect(text).toContain('3-day Top 10 streak');
    expect(text.trim().endsWith('balliq.app/top10')).toBe(true);
  });

  it('names no answer', () => {
    for (const l of Object.values(ALL.lists)) {
      const t = buildTop10ShareText({ number: 1, title: l.title, found: new Array(10).fill(true), lives: 3 });
      // A title may say "Champions League" without naming a winner of it.
      for (const s of l.slots) if (!l.title.includes(s.name)) expect(t).not.toContain(s.name);
    }
  });

  it('formats the as-of date the way the board prints it', () => {
    expect(formatAsOf('2026-07-20')).toBe('20 Jul 2026');
    expect(formatAsOf('nonsense')).toBe('');
  });
});

describe('the guess box for clubs and nations', () => {
  const clubs = ALL.pools.club;
  const nations = ALL.pools.nation;
  const top = (pool, q) => rankListSuggestions(pool, q, { limit: 1 })[0]?.name;

  it('answers to the names people actually type', () => {
    expect(top(clubs, 'psg')).toBe('Paris Saint-Germain');
    expect(top(clubs, 'spurs')).toBe('Tottenham Hotspur');
    expect(top(clubs, 'man utd')).toBe('Manchester United');
    expect(top(clubs, 'inter')).toBe('Inter Milan');
    expect(top(clubs, 'gladbach')).toBe('Borussia Mönchengladbach');
    expect(top(clubs, 'atletico madrid')).toBe('Atlético Madrid');
    expect(top(nations, 'holland')).toBe('Netherlands');
    expect(top(nations, 'west germany')).toBe('Germany');
    expect(top(nations, 'usa')).toBe('United States');
  });

  it('puts the whole name first, then the start of a word', () => {
    expect(rankListSuggestions(clubs, 'man', { limit: 2 }).map((c) => c.name)).toEqual(['Manchester City', 'Manchester United']);
    expect(top(clubs, 'milan')).toBe('AC Milan');
  });

  it('needs two letters, and never offers what was already picked', () => {
    expect(rankListSuggestions(clubs, 'a')).toEqual([]);
    const picked = new Set([normaliseName('Manchester City')]);
    expect(rankListSuggestions(clubs, 'man', { limit: 1, exclude: picked })[0].name).toBe('Manchester United');
  });
});

describe('the data', () => {
  const lists = Object.values(ALL.lists);

  it('has lists to check', () => {
    expect(lists.length).toBeGreaterThan(10);
  });

  it.each(lists.map((l) => [l.id, l]))('%s: ten slots, one name each, dated and sourced', (_, l) => {
    expect(l.slots).toHaveLength(10);
    expect(new Set(l.slots.map((s) => s.key)).size).toBe(10);
    expect(new Set(l.slots.map((s) => s.name)).size).toBe(10);
    expect(l.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(l.source).toBeTruthy();
    expect(['player', 'club', 'nation']).toContain(l.kind);
    expect(l.title.length).toBeLessThanOrEqual(64);
    for (const s of l.slots) expect(String(s.clue).length).toBeGreaterThan(0);
    for (const n of l.near || []) {
      expect(l.slots.some((s) => s.key === n.key)).toBe(false);
      expect(n.note).toMatch(/^1[1-3]th/);
    }
  });

  it('every answer can be picked from the guess box, under exactly one entry', () => {
    const extra = new Set(ALL.extras.map((e) => e.key));
    for (const l of lists) {
      const pool = l.kind === 'player' ? null : new Map(ALL.pools[l.kind].map((e) => [e.key, e]));
      for (const s of [...l.slots, ...(l.near || [])]) {
        if (l.kind === 'player') {
          expect(POOL_IDS.has(s.key) || extra.has(s.key), `${l.id}: ${s.name}`).toBe(true);
        } else {
          expect(pool.get(s.key)?.name, `${l.id}: ${s.name}`).toBe(s.name);
        }
      }
    }
  });

  it('a list can accept a second name for one slot, and only there', () => {
    const euros = ALL.lists['euro-winning-nations'];
    const russia = normaliseName('Russia');
    const g = gradeTop10(euros, { picks: [{ k: russia, n: 'Russia' }, { k: normaliseName('Czech Republic'), n: 'Czech Republic' }] });
    expect(g.score).toBe(2);
    expect(g.lives).toBe(TOP10_LIVES);
    expect(euros.slots[g.order[0]].name).toBe('Soviet Union');
    expect(euros.slots[g.order[1]].name).toBe('Czechoslovakia');
    // The same name is an ordinary wrong answer on a list that does not say so.
    const cups = ALL.lists['champions-league-last-ten'];
    expect(gradeTop10(cups, { picks: [{ k: russia, n: 'Russia' }] }).lives).toBe(TOP10_LIVES - 1);
    for (const l of lists) {
      const pool = l.kind === 'player' ? null : new Set(ALL.pools[l.kind].map((e) => e.key));
      const own = new Set([...l.slots, ...(l.near || [])].map((s) => s.key));
      for (const s of l.slots) for (const k of s.also || []) {
        expect(own.has(k), `${l.id}: ${k} is already on the list`).toBe(false);
        if (pool) expect(pool.has(k), `${l.id}: ${k} cannot be picked`).toBe(true);
      }
    }
  });

  it('club and nation keys are the app\'s own fold of the name', () => {
    for (const kind of ['club', 'nation']) {
      for (const e of ALL.pools[kind]) expect(e.key).toBe(normaliseName(e.name));
    }
  });

  it('no spelling leads to two different entries', () => {
    for (const kind of ['club', 'nation']) {
      const seen = new Map();
      for (const e of ALL.pools[kind]) {
        for (const k of [e.key, ...(e.aka || []).map(normaliseName)]) {
          expect(seen.has(k) && seen.get(k) !== e.name, `"${k}" -> ${seen.get(k)} and ${e.name}`).toBe(false);
          seen.set(k, e.name);
        }
      }
    }
  });

  it('the file on disk holds fact-checked lists only, and every scheduled one', () => {
    for (const l of Object.values(ON_DISK.lists)) expect(l.checked, l.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const id of ON_DISK.log) expect(ON_DISK.lists[id], id).toBeTruthy();
    expect(new Set(ON_DISK.log).size).toBe(ON_DISK.log.length);
  });
});

describe('where the result goes', () => {
  it('is a recorded daily, scored out of ten, higher is better', () => {
    expect(DAILY_GAMES).toContain('top10');
    expect(SCORE_GAMES.top10).toBe(10);
    const dist = { n: 40, won: 40, buckets: { 3: 10, 5: 10, 7: 10, 10: 10 } };
    const s = summariseDistribution(dist, { game: 'top10', mine: 7, won: true });
    expect(s.beatPct).toBe(50);
    expect(s.avg).toBeCloseTo(6.25);
    expect(s.outOf).toBe(10);
    expect(s.solvedPct).toBe(null);
  });

  it('has its own colour, readable on the dark surface', () => {
    expect(MODE_ACCENT.top10).toMatch(/^#[0-9A-F]{6}$/i);
    expect(MODE_RGB.top10).toMatch(/^\d+,\d+,\d+$/);
  });
});
