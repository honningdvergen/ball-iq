// Top 10 in turns' rules (src/lib/top10Turns.js): which list, turn order,
// strikes, out, the two refusals, the end and the winner. The rules Alex's build
// yes covers (26 Nov 2026; ball-iq-audit/2026-11-26/pass-play-build-brief.md,
// JOB 2, T1 and T2).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  TURNS_STRIKES, turnsBank, pickTurnsList, newTurnsGame, judgeTurn, playTurn, nextUp, isOut, rowsBy, turnsResult, swapStart,
} from '../../src/lib/top10Turns.js';
import { getTop10Number } from '../../src/lib/top10.js';
import { initialSlots, makePlayers } from '../../src/lib/passPlay.js';

const read = (f) => readFileSync(fileURLToPath(new URL(`../../${f}`, import.meta.url)), 'utf8');
const data = JSON.parse(read('src/data/top10Lists.json'));
const P = (n) => makePlayers(initialSlots(), n, (i) => `Player ${i}`);
const ids = (n) => P(n).map((p) => p.id);
// A made-up list of ten (slot keys k0 … k9), with a second name for slot 9.
const LIST = { slots: Array.from({ length: 10 }, (_, i) => ({ key: `k${i}`, name: `Name ${i}`, ...(i === 9 ? { also: ['alt9'] } : {}) })) };
const hit = (i) => ({ key: `k${i}`, name: `Name ${i}` });
const miss = (s) => ({ key: `x:${s}`, name: s });
const run = (g, picks) => picks.reduce((st, p) => playTurn(st, LIST, p).game, g);

describe('which list: never today\'s or a future daily', () => {
  const day = (ymd) => new Date(`${ymd}T12:00:00`);
  it('bars today, yesterday and every later day of the schedule; keeps past dailies and unscheduled lists', () => {
    for (const ymd of ['2026-11-26', '2026-10-12', '2026-12-31', '2027-01-31']) {
      const d = day(ymd);
      const n = getTop10Number(d);
      const bank = turnsBank(data, d);
      const later = data.log.slice(Math.max(0, n - 2));
      for (const id of later) expect(bank, `${ymd} ${id}`).not.toContain(id);
      if (n - 1 >= 0 && n - 1 < data.log.length) expect(bank).not.toContain(data.log[n - 1]); // today's
      for (const id of data.log.slice(0, Math.max(0, n - 2))) expect(bank, id).toContain(id);
      for (const id of Object.keys(data.lists).filter((x) => !data.log.includes(x))) expect(bank, id).toContain(id);
    }
  });
  it('before launch day the whole schedule is barred; after it has run out, every list is in', () => {
    const before = turnsBank(data, day('2026-09-01'));
    for (const id of data.log) expect(before).not.toContain(id);
    expect(before.length).toBe(Object.keys(data.lists).length - new Set(data.log).size);
    const after = turnsBank(data, day('2030-01-01'));
    expect(after.length).toBe(Object.keys(data.lists).length);
  });
  it('a longer schedule (fetched by the installed app) bars its days too', () => {
    const extra = Object.keys(data.lists).find((x) => !data.log.includes(x));
    const longer = { ...data, log: [...data.log, extra] };
    expect(turnsBank(data, day('2026-11-26'))).toContain(extra);
    expect(turnsBank(longer, day('2026-11-26'))).not.toContain(extra);
  });
  it('a random pick avoids the lists already played while others are left, and never repeats the last', () => {
    const bank = ['a', 'b', 'c'];
    expect(pickTurnsList(bank, { avoid: ['a', 'b'], rand: () => 0 })).toBe('c');
    expect(pickTurnsList(bank, { avoid: ['a', 'b', 'c'], current: 'c', rand: () => 0.99 })).toBe('b');
    expect(pickTurnsList(['a'], { current: 'a' })).toBe('a');
    expect(pickTurnsList([], {})).toBe(null);
    for (let i = 0; i < 50; i++) expect(bank).toContain(pickTurnsList(bank));
  });
});

describe('turns, strikes, out and refusals', () => {
  it('turns go round in play order from the starter', () => {
    let g = newTurnsGame(ids(3), 1);
    expect(g.turn).toBe(1);
    g = run(g, [hit(0)]); expect(g.turn).toBe(2);
    g = run(g, [miss('a')]); expect(g.turn).toBe(0);
    g = run(g, [hit(1)]); expect(g.turn).toBe(1);
    expect(g.found).toEqual({ 0: 1, 1: 0 });
    expect(g.strikes).toEqual({ 0: 0, 1: 0, 2: 1 });
  });
  it('a name on the list fills its row for the finder, a second name for a slot too', () => {
    const { game, kind, slot, by } = playTurn(newTurnsGame(ids(2)), LIST, { key: 'alt9', name: 'Alt' });
    expect([kind, slot, by]).toEqual(['hit', 9, 0]);
    expect(game.found[9]).toBe(0);
  });
  it('a name found already is refused with no strike, and the same player goes again', () => {
    const g = run(newTurnsGame(ids(2)), [hit(3)]);
    const r = playTurn(g, LIST, hit(3));
    expect(r.kind).toBe('found');
    expect(r.game).toBe(g);
    expect(r.game.turn).toBe(1);
    expect(r.game.strikes[1]).toBe(0);
  });
  it('a name tried and missed by anyone is refused with no strike', () => {
    const g = run(newTurnsGame(ids(2)), [miss('Nedved')]);
    expect(judgeTurn(g, LIST, 'x:Nedved').kind).toBe('tried');
    const r = playTurn(g, LIST, miss('Nedved'));
    expect(r.game).toBe(g);
    expect(g.strikes).toEqual({ 0: 1, 1: 0 });
    expect(g.missed).toEqual([{ key: 'x:Nedved', name: 'Nedved', by: 0 }]);
  });
  it('three strikes and that player is out and skipped; the others carry on', () => {
    let g = newTurnsGame(ids(3));
    g = run(g, [miss('a'), hit(0), hit(1), miss('b'), hit(2), hit(3), miss('c')]);
    expect(isOut(g, 0)).toBe(true);
    expect(g.strikes[0]).toBe(TURNS_STRIKES);
    expect(g.turn).toBe(1);
    g = run(g, [hit(4), hit(5)]); // 1 then 2, then 0 is skipped
    expect(g.turn).toBe(1);
    expect(nextUp(g, 2)).toBe(1);
    expect(g.over).toBe(false);
  });
  it('the last player standing plays alone until they too are out', () => {
    let g = newTurnsGame(ids(2));
    g = run(g, [miss('a'), miss('b'), miss('c'), miss('d'), miss('e')]); // 0,1,0,1, then 0's third
    expect(isOut(g, 0)).toBe(true);
    expect(g.turn).toBe(1);
    g = run(g, [hit(0)]);
    expect(g.turn).toBe(1);
    g = run(g, [miss('g')]); // strike three on the last player standing
    expect(g.over).toBe(true);
    expect(g.turn).toBe(null);
    expect(playTurn(g, LIST, hit(1)).kind).toBe('over');
  });
  it('the game ends when the tenth row is found', () => {
    const g = run(newTurnsGame(ids(2)), Array.from({ length: 10 }, (_, i) => hit(i)));
    expect(g.over).toBe(true);
    expect(rowsBy(g)).toEqual({ 0: 5, 1: 5 });
  });
});

describe('the end', () => {
  it('most rows wins; the table is best first', () => {
    const players = P(3);
    const g = run(newTurnsGame(ids(3)), [miss('a'), hit(0), hit(1), hit(2), hit(3)]);
    const r = turnsResult(g, players);
    expect(r.scores).toEqual({ 0: 1, 1: 2, 2: 1 });
    expect(r.kind).toBe('win');
    expect(r.top.map((p) => p.id)).toEqual([1]);
    expect(r.ranked.map((p) => p.id)).toEqual([1, 0, 2]);
  });
  it('equal rows is a draw, among those on the top count only', () => {
    const players = P(3);
    const g = run(newTurnsGame(ids(3)), [hit(0), hit(1), miss('a'), hit(2), hit(3)]);
    const r = turnsResult(g, players);
    expect(r.kind).toBe('draw');
    expect(r.top.map((p) => p.id)).toEqual([0, 1]);
    expect(r.topScore).toBe(2);
  });
  it('nobody found anything: everyone shares the draw', () => {
    const g = run(newTurnsGame(ids(2)), Array.from({ length: 6 }, (_, i) => miss(`m${i}`)));
    const r = turnsResult(g, P(2));
    expect(g.over).toBe(true);
    expect(r.kind).toBe('draw');
    expect(r.topScore).toBe(0);
  });
  it('"Same list, swap who starts" moves the start one seat on', () => {
    expect(swapStart(0, 2)).toBe(1);
    expect(swapStart(1, 2)).toBe(0);
    expect(swapStart(5, 6)).toBe(0);
  });
});
describe('the screen holds to the rules', () => {
  const src = read('src/screens/Top10Turns.jsx');
  it('the name search asks for SUGGEST_MAX, as every guess box does', () => {
    const calls = src.match(/rank(Player|List)Suggestions\([^)]*\)/g) || [];
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c).toContain('SUGGEST_MAX');
  });
  it('the list comes from the bank, never the day\'s list, and the daily screen is not imported', () => {
    expect(src).toContain('turnsBank(');
    expect(src).not.toMatch(/getTop10Id|from "\.\/Top10\.jsx"/);
    expect(src).not.toMatch(/saveTop10Day|biq:daily-completed/);
  });
});
