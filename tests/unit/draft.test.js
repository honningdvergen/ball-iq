// The Draft: the season model, the squads it spins, and a game in progress.
//
// What must never break without someone noticing:
//   - the day's board and the day's luck come from the date alone, so two
//     players on the same day are playing the same game
//   - a change to the data moves only the boards it touches (it is NOT true
//     that two different data files deal the same boards: see draftModel.js)
//   - an eleven better at both ends never finishes below a weaker one that day
//   - the model has no opinions in it: a club's own first eleven, put through
//     it, lands near that club's real season. Recomputed HERE, not read from
//     the number the generator wrote, so a constant changed without
//     regenerating fails
//   - a saved game is restored whole or not at all (the first version crashed
//     on a half-restored one, on every open)
//   - the game is off Home's path and not linked from it
//
// The screen itself has no test (the repo has no DOM environment). That is why
// every rule the screen follows lives in draftModel.js and is tested here.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  POS, FORMATION, SPINS, BENCH, GAMES, HOME, AWAY,
  prepare, value, strength, firstEleven, chances, rng, dayLuck, playSeason, board, tierOf,
  freshGame, restoreGame, squadKeyAt, picksOf, openIn, settleSpin, respin, takePick, standing, ordinal, SAVE_V,
} from '../../src/lib/draftModel.js';

const RAW = JSON.parse(readFileSync(new URL('../../src/data/draftSquads.json', import.meta.url), 'utf8'));
const D = prepare(RAW);
const find = (club, y) => D.byKey.get(`${y}|${club}`);
const DAY = 20740;
const copy = (x) => JSON.parse(JSON.stringify(x));
// Plays a whole game by always taking the first man who fits.
const playOut = (g) => { let cur = settleSpin({ ...g, started: true }, D); while (cur.picks.length < SPINS) { const sq = D.byKey.get(squadKeyAt(cur, cur.picks.length)); const p = sq.players.find(openIn(picksOf(cur, D)).can); cur = settleSpin(takePick(cur, D, p.id), D); } return cur; };

describe('the squads', () => {
  it('there are enough of them, from 1995-96 on, 38 games each', () => {
    expect(D.squads.length).toBeGreaterThanOrEqual(330);
    expect(D.byKey.size).toBe(D.squads.length);
    for (const s of D.squads) { expect(s.y).toBeGreaterThanOrEqual(1995); expect(s.w + s.d + s.l).toBe(GAMES); }
  });

  it('every squad can fill any place: a man for every line, nobody twice, every share between 0 and 1', () => {
    for (const s of D.squads) {
      for (const pos of POS) expect(s.players.some((p) => p.p === pos), `${s.k} has no ${pos}`).toBe(true);
      expect(new Set(s.players.map((p) => p.id)).size, s.k).toBe(s.players.length);
      for (const p of s.players) { expect(p.on, `${s.k} ${p.n}`).toBeGreaterThan(0); expect(p.on).toBeLessThanOrEqual(1); }
    }
  });

  it('where starts are known they add up to eleven a game, and one keeper a game', () => {
    for (const s of D.squads.filter((x) => x.split)) {
      expect(s.players.reduce((a, p) => a + p.st, 0), s.k).toBe(11 * GAMES);
      expect(s.players.filter((p) => p.p === 'GK').reduce((a, p) => a + p.st, 0), s.k).toBe(GAMES);
    }
  });

  it('where only totals are known they are possible for 38 games, and no man has more than 38', () => {
    const totals = D.squads.filter((x) => !x.split);
    expect(totals.length).toBeGreaterThan(0);
    for (const s of totals) {
      const apps = s.players.reduce((a, p) => a + p.st, 0), gk = s.players.filter((p) => p.p === 'GK').reduce((a, p) => a + p.st, 0);
      expect(apps, s.k).toBeGreaterThanOrEqual(11 * GAMES);
      expect(apps, s.k).toBeLessThanOrEqual(16 * GAMES);
      expect(gk, s.k).toBeGreaterThanOrEqual(GAMES);
      expect(gk, s.k).toBeLessThanOrEqual(GAMES + 6);
      for (const p of s.players) { expect(p.st, `${s.k} ${p.n}`).toBeLessThanOrEqual(GAMES); expect(p.su).toBe(0); }
    }
  });

  it('goals never exceed the club’s goals for, and fall short by a few own goals at most', () => {
    for (const s of D.squads) {
      const g = s.players.reduce((a, p) => a + p.g, 0);
      expect(g, s.k).toBeLessThanOrEqual(s.gf);
      expect(s.gf - g, s.k).toBeLessThanOrEqual(11); // Manchester United 2009-10 were given eleven
    }
  });

  it('the season that broke the first attempt is right: Thierry Henry, Arsenal 2003-04, 37 starts and 30 goals', () => {
    expect(find('Arsenal', 2003).players.find((p) => p.n === 'Thierry Henry')).toMatchObject({ p: 'FW', st: 37, su: 0, g: 30 });
  });

  it('a substitute appearance is three tenths of a game; a totals-only squad shares out ten outfield starts a game', () => {
    const sq = find('Arsenal', 2003), sub = sq.players.find((p) => p.su > 3 && p.st + p.su < 30);
    expect(sub.on).toBeCloseTo((sub.st + 0.3 * sub.su) / GAMES, 10);
    const city = D.squads.find((s) => !s.split), out = city.players.filter((p) => p.p !== 'GK');
    const apps = out.reduce((a, p) => a + p.st, 0), want = 10 * GAMES + 0.3 * (apps - 10 * GAMES);
    // No man is capped at a whole season here, so the shares add back up exactly.
    expect(out.reduce((a, p) => a + p.on * GAMES, 0)).toBeCloseTo(want, 6);
  });
});

describe('the model has no opinions', () => {
  // Expected points with no luck in it: the chances of each of the 38 matches.
  const xPts = (st) => { let x = 0; for (const home of [true, false]) for (let k = 2; k <= 20; k++) { const [ogf, oga] = D.league.place[k - 1]; const c = chances(st.lf * (oga / D.league.avg) * (home ? HOME : AWAY), st.la * (ogf / D.league.avg) * (home ? AWAY : HOME)); x += 3 * c.w + c.d; } return x; };

  it('a club’s own first eleven lands near that club’s real season (recomputed from the model as it stands)', () => {
    let pts = 0, gf = 0, ga = 0;
    for (const sq of D.squads) { const st = strength(firstEleven(sq), D); pts += Math.abs(xPts(st) - sq.pts); gf += Math.abs(st.lf * GAMES - sq.gf); ga += Math.abs(st.la * GAMES - sq.ga); }
    const n = D.squads.length;
    expect(pts / n).toBeLessThan(5);
    expect(gf / n).toBeLessThan(3.2);
    expect(ga / n).toBeLessThan(1.6);
    // and the generator's own figure is the same sum, so the file is not stale against the model
    expect(RAW.check.squads).toBe(n);
    expect(RAW.check.points).toBeCloseTo(pts / n, 1);
  });

  it('the Invincibles’ eleven comes out near the Invincibles’ goals', () => {
    const ars = find('Arsenal', 2003), st = strength(firstEleven(ars), D);
    expect(Math.abs(st.lf * GAMES - ars.gf)).toBeLessThan(8);
    expect(Math.abs(st.la * GAMES - ars.ga)).toBeLessThan(5);
  });

  // The weights, pinned through what they produce. Henry 2003-04: half of his
  // 30 goals are his, plus a forward's share of the other half of Arsenal's 73
  // for the 37 games he played, plus one game of a stand-in.
  it('a pick is worth exactly what the rules say', () => {
    const sq = find('Arsenal', 2003), L = D.league;
    const henry = sq.players.find((p) => p.n === 'Thierry Henry'), on = 37 / 38;
    const standIn = 0.5 * (L.repl[0] * 38 * L.share[3] / 3) + (0.43 / 3) * 0.5 * L.repl[0] * 38;
    const v = value(henry, sq, L);
    expect(v.att).toBeCloseTo(0.5 * 30 + (0.43 / 3) * 0.5 * 73 * on + (1 - on) * standIn, 9);
    expect(v.ga).toBeCloseTo(on * (26 / 38) + (1 - on) * L.repl[1], 9);
    // Goals against, weighted: keeper a fifth, each defender .13, each midfielder .07, the forwards .07 between them.
    const xi = firstEleven(sq), w = { GK: 0.20, DF: 0.13, MF: 0.07, FW: 0.07 / 3 };
    expect(strength(xi, D).raw.la).toBeCloseTo(xi.reduce((a, { p }) => a + w[p.p] * value(p, sq, L).ga, 0), 9);
    expect(strength(xi, D).raw.lf).toBeCloseTo(xi.reduce((a, { p }) => a + value(p, sq, L).att, 0) / 38, 9);
  });

  it('a man who missed half the season, with half the goals, is worth less at both ends', () => {
    const sq = find('Arsenal', 2003), henry = sq.players.find((p) => p.n === 'Thierry Henry');
    const full = value(henry, sq, D.league), half = value({ ...henry, on: 0.5, g: henry.g / 2 }, sq, D.league);
    expect(half.att).toBeLessThan(full.att);
    expect(half.ga).toBeGreaterThan(full.ga);
  });

  it('nothing in it rolls dice or reads the clock', () => {
    const src = readFileSync(new URL('../../src/lib/draftModel.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
    expect(src).not.toMatch(/Math\.random|Date\.now|new Date/);
  });
});

describe('the day’s board', () => {
  it('the same day deals the same board and the same luck; another day does not', () => {
    const a = board(D, DAY), b = board(D, DAY), c = board(D, DAY + 1);
    expect(a.spins.map((s) => s.k)).toEqual(b.spins.map((s) => s.k));
    expect(a.spins.map((s) => s.k)).not.toEqual(c.spins.map((s) => s.k));
    expect(dayLuck(DAY)).toEqual(dayLuck(DAY));
    expect(dayLuck(DAY).rolls).not.toEqual(dayLuck(DAY + 1).rolls);
  });

  it('every board for a year: eleven squads, five top, four middle, two lower, no club more than twice, a bench of eight', () => {
    for (let day = 20738; day < 20738 + 365; day++) {
      const { spins, bench } = board(D, day);
      const all = [...spins, ...bench];
      expect(spins.length).toBe(SPINS);
      expect(bench.length).toBe(BENCH);
      expect(new Set(all.map((s) => s.k)).size).toBe(all.length);
      const tiers = { top: 0, mid: 0, low: 0 }; for (const s of spins) tiers[tierOf(s)]++;
      expect(tiers).toEqual({ top: 5, mid: 4, low: 2 });
      const clubs = {}; for (const s of all) clubs[s.club] = (clubs[s.club] || 0) + 1;
      expect(Math.max(...Object.values(clubs))).toBeLessThanOrEqual(2);
    }
  });

  // The reason the board is dealt by a number per squad and not by position.
  it('taking a squad out of the data changes only the days that squad was on', () => {
    for (const drop of [5, 120, 301]) {
      const gone = `${RAW.squads[drop][0]}|${RAW.clubs[RAW.squads[drop][1]]}`;
      const Dless = prepare({ ...RAW, squads: RAW.squads.filter((_, i) => i !== drop) });
      let touched = 0;
      for (let day = 20738; day < 20738 + 365; day++) {
        const a = board(D, day), b = board(Dless, day);
        const keys = (x) => [...x.spins, ...x.bench].map((s) => s.k);
        if (keys(a).includes(gone)) { touched++; continue; }
        expect(keys(b), `day ${day} without ${gone}`).toEqual(keys(a));
      }
      expect(touched).toBeLessThan(80); // it was only ever on a fraction of the year's boards
    }
  });

  it('the spin order does not depend on how the data file is ordered', () => {
    const Drev = prepare({ ...RAW, squads: [...RAW.squads].reverse() });
    for (const day of [20738, 20800, 21000]) {
      expect(board(Drev, day).spins.map((s) => s.k)).toEqual(board(D, day).spins.map((s) => s.k));
      expect(board(Drev, day).bench.map((s) => s.k)).toEqual(board(D, day).bench.map((s) => s.k));
    }
  });

  it('a tier too small to deal from says so rather than dealing a broken board', () => {
    const tiny = prepare({ ...RAW, squads: RAW.squads.filter((s) => s[2] > 4) });
    expect(() => board(tiny, DAY)).toThrow(/no top squads/);
  });
});

describe('a game in progress', () => {
  it('a fresh game holds the day’s board by name and nothing else', () => {
    const g = freshGame(D, DAY);
    expect(g).toMatchObject({ v: SAVE_V, started: false, hard: false, picks: [], swaps: {}, used: 0, respun: false, seen: false });
    expect(g.deal.spins).toEqual(board(D, DAY).spins.map((s) => s.k));
    expect(restoreGame(copy(g), D)).toEqual(g);
  });

  it('taking a man fills a place, and he cannot be taken again or put in a full line', () => {
    let g = { ...freshGame(D, DAY), started: true };
    const sq = D.byKey.get(squadKeyAt(g, 0)), keeper = sq.players.find((p) => p.p === 'GK');
    g = takePick(g, D, keeper.id);
    expect(g.picks).toEqual([[sq.k, keeper.id]]);
    expect(openIn(picksOf(g, D)).left).toEqual({ GK: 0, DF: 4, MF: 3, FW: 3 });
    const next = D.byKey.get(squadKeyAt(g, 1)), nextKeeper = next.players.find((p) => p.p === 'GK');
    expect(takePick(g, D, nextKeeper.id)).toBe(g);   // no keeper's place left
    expect(takePick(g, D, -1)).toBe(g);              // nobody of that id here
  });

  it('a whole game can always be played out, for a year of boards', () => {
    for (let day = 20738; day < 20738 + 365; day += 3) {
      const g = playOut(freshGame(D, day));
      expect(g.picks.length).toBe(SPINS);
      const have = picksOf(g, D);
      expect(new Set(have.map((x) => x.p.id)).size).toBe(SPINS);
      for (const pos of POS) expect(have.filter((x) => x.p.p === pos).length).toBe(FORMATION[pos]);
    }
  });

  it('the one re-spin swaps the squad once, and only once', () => {
    const g = { ...freshGame(D, DAY), started: true };
    const r = respin(g);
    expect(squadKeyAt(r, 0)).toBe(g.deal.bench[0]);
    expect(r).toMatchObject({ respun: true, used: 1 });
    expect(respin(r)).toBe(r);
  });

  it('a spin nobody fits is swapped for free and leaves the re-spin unspent', () => {
    // Built by hand, since it almost never happens: ten places filled, one
    // forward's place open, and the last squad's only forward already in the
    // eleven from another season.
    const U = find('Arsenal', 2003), henry = U.players.find((p) => p.n === 'Thierry Henry');
    const T = D.squads.find((x) => x.k !== U.k && x.players.some((p) => p.id === henry.id));
    expect(T, 'another season with Henry in it').toBeTruthy();
    // the same data, with that other season left with one forward: Henry
    const Ds = prepare({ ...RAW, squads: RAW.squads.map((sq) => (`${sq[0]}|${RAW.clubs[sq[1]]}` === T.k ? [...sq.slice(0, 10), sq[10].filter((row) => row[2] !== 3 || row[0] === henry.id)] : sq)) });
    const others = Ds.squads.filter((x) => x.club !== 'Arsenal').slice(0, 17);
    const want = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW'];
    const picks = [[U.k, henry.id]], have = new Set([henry.id]);
    want.forEach((pos, i) => { const p = others[i].players.find((x) => x.p === pos && !have.has(x.id)); have.add(p.id); picks.push([others[i].k, p.id]); });
    const g = { v: SAVE_V, started: true, hard: false, picks, swaps: {}, used: 0, respun: false, seen: false,
      deal: { spins: [U.k, ...others.slice(0, 9).map((x) => x.k), T.k], bench: others.slice(9, 17).map((x) => x.k) } };
    expect(restoreGame(copy(g), Ds)).toEqual(g);                       // a legal game
    expect(openIn(picksOf(g, Ds)).left).toEqual({ GK: 0, DF: 0, MF: 0, FW: 1 });
    expect(Ds.byKey.get(T.k).players.some(openIn(picksOf(g, Ds)).can)).toBe(false); // nobody fits
    const settled = settleSpin(g, Ds);
    expect(settled.used).toBe(1);
    expect(settled.respun).toBe(false);
    expect(squadKeyAt(settled, 10)).toBe(g.deal.bench[0]);
    expect(Ds.byKey.get(squadKeyAt(settled, 10)).players.some(openIn(picksOf(settled, Ds)).can)).toBe(true);
    expect(respin(settled)).toMatchObject({ respun: true, used: 2 });  // the player's own re-spin is still there
    expect(restoreGame(copy(settled), Ds)).toEqual(settled);
  });

  it('a spent bench stops the swapping instead of looping', () => {
    const g = { ...freshGame(D, DAY), started: true, used: BENCH };
    expect(settleSpin(g, D)).toBe(g);
    expect(respin(g)).toBe(g);
  });

  describe('what is saved is restored whole or not at all', () => {
    const played = playOut(freshGame(D, DAY));
    const half = { ...played, picks: played.picks.slice(0, 5) };
    it('a game half played and a game finished both come back as they were', () => {
      expect(restoreGame(copy(half), D)).toEqual(half);
      expect(restoreGame(copy({ ...played, seen: true }), D)).toEqual({ ...played, seen: true });
    });
    it('anything that is not a game is refused', () => {
      for (const bad of [null, undefined, 7, 'x', [], {}, { deal: {} }, { v: SAVE_V }, { ...half, v: 0 }, { ...half, deal: null },
        { ...half, deal: { spins: half.deal.spins.slice(0, 4), bench: half.deal.bench } },
        { ...half, deal: { spins: half.deal.spins, bench: half.deal.bench.slice(0, 4) } },
        { ...half, picks: undefined }, { ...half, picks: [null] }, { ...half, swaps: undefined }, { ...half, swaps: [] },
        { ...half, used: -1 }, { ...half, used: 99 }, { ...half, used: 'two' }, { ...half, swaps: { 3: 5 } }, { ...half, swaps: { 40: 1 }, used: 1 }]) {
        expect(restoreGame(bad === undefined ? bad : copy(bad ?? null), D), JSON.stringify(bad)?.slice(0, 60)).toBe(null);
      }
    });
    it('a pick whose squad or player the data no longer has is refused, not half-restored', () => {
      const gone = copy(half); gone.picks[2][1] = -5;
      expect(restoreGame(gone, D)).toBe(null);
      const moved = copy(half); moved.picks[1][0] = moved.deal.spins[7];
      expect(restoreGame(moved, D)).toBe(null);
      const unknown = copy(half); unknown.deal.spins[9] = '1901|Nobody';
      expect(restoreGame(unknown, D)).toBe(null);
      const twice = copy(half); twice.picks[4] = [twice.picks[4][0], twice.picks[0][1]];
      expect(restoreGame(twice, D)).toBe(null);
    });
    it('"seen" only survives on a finished game, so a result is never shown for ten men', () => {
      expect(restoreGame(copy({ ...half, seen: true }), D).seen).toBe(false);
    });
  });
});

describe('the season', () => {
  it('chances add up to one', () => {
    const c = chances(1.9, 0.7);
    expect(c.w + c.d + c.l).toBeCloseTo(1, 9);
    expect(c.w).toBeGreaterThan(c.l);
  });

  it('the day’s luck: 38 rolls, 38 score rolls, and a fixture list that goes home, away, home, away', () => {
    const luck = dayLuck(DAY);
    expect(luck.rolls.length).toBe(GAMES);
    expect(luck.scores.length).toBe(GAMES);
    expect([...luck.order].sort((a, b) => a - b)).toEqual(Array.from({ length: GAMES }, (_, i) => i));
    luck.order.forEach((n, i) => expect(n < 19, `match ${i + 1}`).toBe(i % 2 === 0));
  });

  it('38 matches against places 2 to 20, each at home and away, three points a win', () => {
    const se = playSeason({ lf: 1.5, la: 1.2 }, D.league, dayLuck(DAY));
    expect(se.matches.length).toBe(GAMES);
    expect(se.w + se.d + se.l).toBe(GAMES);
    expect(se.pts).toBe(3 * se.w + se.d);
    for (const home of [true, false]) expect(se.matches.filter((m) => m.home === home).map((m) => m.place).sort((a, b) => a - b)).toEqual(Array.from({ length: 19 }, (_, i) => i + 2));
  });

  it('the goals shown are the goals of those 38 matches, and every score matches its result', () => {
    for (let day = 20738; day < 20738 + 40; day++) {
      for (const st of [{ lf: 0.9, la: 1.9 }, { lf: 1.4, la: 1.3 }, { lf: 2.6, la: 0.7 }]) {
        const se = playSeason(st, D.league, dayLuck(day));
        expect(se.gf).toBe(se.matches.reduce((a, m) => a + m.f, 0));
        expect(se.ga).toBe(se.matches.reduce((a, m) => a + m.a, 0));
        for (const m of se.matches) expect(m.r, `${m.f}-${m.a}`).toBe(m.f > m.a ? 'w' : m.f === m.a ? 'd' : 'l');
      }
    }
  });

  it('the fixture list is the day’s, not the team’s: two different elevens play the same opponents in the same order', () => {
    const a = playSeason({ lf: 0.9, la: 1.9 }, D.league, dayLuck(DAY)), b = playSeason({ lf: 2.8, la: 0.6 }, D.league, dayLuck(DAY));
    expect(a.matches.map((m) => [m.place, m.home])).toEqual(b.matches.map((m) => [m.place, m.home]));
  });

  // The promise the comparison between players rests on. It is a promise about
  // elevens better AT BOTH ENDS; see the note at the top of draftModel.js.
  it('on the same day an eleven better at both ends never loses a match the weaker one did not, and never has fewer points', () => {
    for (let day = 20738; day < 20738 + 60; day++) {
      const luck = dayLuck(day);
      let last = null;
      for (const [lf, la] of [[0.8, 2.0], [1.0, 1.7], [1.2, 1.4], [1.5, 1.2], [1.9, 1.0], [2.4, 0.8], [3.0, 0.6], [4.0, 0.4]]) {
        const se = playSeason({ lf, la }, D.league, luck);
        if (last) {
          expect(se.pts).toBeGreaterThanOrEqual(last.pts);
          const rank = { l: 0, d: 1, w: 2 };
          se.matches.forEach((m, i) => expect(rank[m.r]).toBeGreaterThanOrEqual(rank[last.matches[i].r]));
        }
        last = se;
      }
    }
  });

  it('an average side draws about as often as the real league does', () => {
    let d = 0;
    for (let day = 20738; day < 20738 + 200; day++) d += playSeason({ lf: D.league.avg, la: D.league.avg }, D.league, dayLuck(day)).d;
    expect(d / 200).toBeGreaterThan(8);
    expect(d / 200).toBeLessThan(11);
  });

  it('points are held against every real table since 1995-96; level with the champions wins it', () => {
    const seasons = Object.keys(D.table).length;
    expect(seasons).toBeGreaterThanOrEqual(31);
    for (const y of Object.keys(D.table)) { expect(D.table[y].length, y).toBe(20); expect([...D.table[y]].sort((a, b) => b - a), y).toEqual(D.table[y]); }
    expect(standing(101, D.table)).toMatchObject({ titles: seasons, place: 1 });
    expect(standing(10, D.table)).toMatchObject({ titles: 0, down: seasons, place: 20 });
    // Leicester's 81 in 2015-16 won it that year and would not have in most.
    const s81 = standing(81, D.table);
    expect(D.table[2015][0]).toBe(81);
    expect(s81.titles).toBeGreaterThan(0);
    expect(s81.titles).toBeLessThan(seasons / 2);
    expect(standing(80, D.table).titles).toBeLessThan(s81.titles);
  });

  it('the seeded generator is the same everywhere', () => {
    const r = rng(12345);
    expect([r(), r(), r()].map((x) => +x.toFixed(6))).toEqual([0.979728, 0.306752, 0.484205]);
  });

  it('ordinals read as English', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 20].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '20th']);
  });
});

describe('where it lives', () => {
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
  const screen = readFileSync(new URL('../../src/screens/Draft.jsx', import.meta.url), 'utf8');
  it('the screen is loaded on demand, opens by address, and has a title', () => {
    expect(app).toMatch(/const Draft = React\.lazy\(\(\) => import\('\.\/screens\/Draft\.jsx'\)\)/);
    expect(app).toMatch(/gameSlug === "draft"/);
    expect(app).toMatch(/draft: "Draft"/);
  });
  it('a finished game is not logged as one that was walked away from', () => {
    expect(screen).toMatch(/CustomEvent\("biq:draft-completed"/);
    expect(app).toMatch(/addEventListener\('biq:draft-completed', onDone\)/);
  });
  it('Home does not know it yet: it is not a daily and must not look like one', () => {
    const home = readFileSync(new URL('../../src/screens/HomeScreen.jsx', import.meta.url), 'utf8');
    expect(home).not.toMatch(/draft/i);
    expect(screen).not.toMatch(/CustomEvent\("biq:daily-completed"/);
    expect(screen).toMatch(/import\("\.\.\/data\/draftSquads\.json"\)/);
  });
  it('the squads file is on the budget gate’s ban list, so Home can never import it', () => {
    expect(readFileSync(new URL('../../scripts/audit-home-budget.mjs', import.meta.url), 'utf8')).toMatch(/const HEAVY = [^\n]*draftSquads/);
  });
  // The crash found in review: with Reduce Motion on, every match counted as
  // shown before a pick was made, and the screen read a result that was null.
  it('the season only counts as played once there is a season', () => {
    expect(screen).toMatch(/const played = done && shown >= GAMES;/);
    expect(screen).toMatch(/if \(!played \|\| !result \|\| g\.seen\) return;/);
  });
});
