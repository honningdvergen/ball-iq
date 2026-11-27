// Pass and play's pure parts (src/lib/passPlay.js): the players' colours and
// badges, Steal, the tables and the end. The look and the rules Alex approved on
// 26 Nov 2026 (ball-iq-audit/2026-11-26/pass-play-build-brief.md, JOB 1).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  STEAL_MAX_PLAYERS, STEAL_SHOWS_STRUCK, COLOURS, BADGES, initialSlots, normalizeSlots, heldByOthers, pickFor,
  makePlayers, slotsFromPlayers, stealInGame, canSteal, stealerFor, newTally, scoreOwn, scoreSteal, stealOptions,
  scoresSoFar, standing, ROUNDS, TURN_SIZE, MAX_GAME_QUESTIONS, gamePlan, fitPlan, dealt, ownQuestions, handoverLineKey,
} from '../../src/lib/passPlay.js';

const unnamed = (n) => `Player ${n}`;
const read = (f) => readFileSync(fileURLToPath(new URL(`../../${f}`, import.meta.url)), 'utf8');
const uniq = (a) => new Set(a).size === a.length;
const P = (n) => makePlayers(initialSlots(), n, unnamed);
const mcq = { type: 'mcq', o: ['A', 'B', 'C', 'D'], a: 2 };

describe('colours and badges', () => {
  it('six colours and eight badges, as drawn (lp4.py), in list order', () => {
    expect(COLOURS.map((c) => c.hex)).toEqual(['#6FD61F', '#FFC107', '#4AA3DF', '#F0785A', '#A878F0', '#1FBEAF']);
    expect(BADGES).toEqual(['crown', 'flame', 'bolt', 'star', 'shield', 'ghost', 'heart', 'moon']);
  });
  it('defaults: each seat the next colour and the next badge in list order, never shared', () => {
    const s = initialSlots();
    expect(s.map((x) => x.colour)).toEqual(COLOURS.map((c) => c.id));
    expect(s.map((x) => x.badge)).toEqual(BADGES.slice(0, 6));
    for (let n = 2; n <= 6; n++) {
      const p = P(n);
      expect(uniq(p.map((x) => x.colour)) && uniq(p.map((x) => x.badge)), String(n)).toBe(true);
    }
  });
  it('what another player in the game holds is taken and cannot be picked', () => {
    const s = initialSlots();
    expect([...heldByOthers(s, 2, 0, 'colour').keys()]).toEqual(['yellow']);
    expect(pickFor(s, 2, 0, 'colour', 'yellow')).toBe(s); // refused
    expect(pickFor(s, 2, 0, 'badge', 'flame')).toBe(s);
    const s2 = pickFor(s, 2, 0, 'colour', 'blue'); // seat 3's default, but seat 3 is not playing
    expect(s2[0].colour).toBe('blue');
    expect(s2[1].colour).toBe('yellow'); // nobody else moved
  });
  it('changing the player count never leaves two with the same colour or badge', () => {
    let s = initialSlots();
    s = pickFor(s, 2, 0, 'colour', 'blue');
    s = pickFor(s, 2, 1, 'badge', 'bolt');
    for (const n of [3, 4, 5, 6, 2, 6]) {
      s = normalizeSlots(s, n);
      const live = s.slice(0, n);
      expect(uniq(live.map((x) => x.colour)) && uniq(live.map((x) => x.badge)), String(n)).toBe(true);
    }
    // Earlier seats keep their picks; the later clash takes the first free one.
    expect(s[0].colour).toBe('blue');
    expect(s[1].badge).toBe('bolt');
    expect(s[2].colour).toBe('green');
    expect(s[2].badge).toBe('flame');
  });
  it('a player is { id, name, colour, badge }; a blank name is "Player n"', () => {
    const s = initialSlots(); s[0].name = '  Alex '; s[3].name = '';
    expect(makePlayers(s, 4, unnamed)).toEqual([
      { id: 0, name: 'Alex', colour: 'green', badge: 'crown' },
      { id: 1, name: 'Player 2', colour: 'yellow', badge: 'flame' },
      { id: 2, name: 'Player 3', colour: 'blue', badge: 'bolt' },
      { id: 3, name: 'Player 4', colour: 'orange', badge: 'star' },
    ]);
  });
  it('"Change topic or mode" brings the same players back, a "Player n" back to blank', () => {
    const s = initialSlots(); s[0].name = 'Alex'; s[0].colour = 'teal'; s[0].badge = 'moon';
    const back = slotsFromPlayers(makePlayers(s, 3, unnamed), unnamed);
    expect(back.slice(0, 3)).toEqual([{ name: 'Alex', colour: 'teal', badge: 'moon' }, { name: '', colour: 'yellow', badge: 'flame' }, { name: '', colour: 'blue', badge: 'bolt' }]);
  });
});

describe('Steal', () => {
  it('the two switches: two players at most, the struck answer shown', () => {
    expect(STEAL_MAX_PLAYERS).toBe(2);
    expect(STEAL_SHOWS_STRUCK).toBe(true);
    const src = read('src/lib/passPlay.js');
    expect(src).toMatch(/^export const STEAL_MAX_PLAYERS = 2;$/m);
    expect(src).toMatch(/^export const STEAL_SHOWS_STRUCK = true;$/m);
  });
  it('only two-player Classic and Sprint; never Survival; never three to six', () => {
    expect(stealInGame(2, 'classic')).toBe(true);
    expect(stealInGame(2, 'sprint')).toBe(true);
    expect(stealInGame(2, 'survival')).toBe(false);
    for (const n of [3, 4, 5, 6]) for (const m of ['classic', 'sprint', 'survival']) expect(stealInGame(n, m), `${n} ${m}`).toBe(false);
  });
  it('never on a two-option (true or false) question', () => {
    expect(canSteal(2, 'classic', mcq)).toBe(true);
    expect(canSteal(2, 'classic', { type: 'tf', o: ['True', 'False'], a: 0 })).toBe(false);
    expect(canSteal(2, 'classic', { type: 'mcq', o: ['Yes', 'No'], a: 0 })).toBe(false);
    expect(canSteal(3, 'classic', mcq)).toBe(false);
  });
  it('the other player steals; the struck option is out of reach; a no-pick miss leaves all four live', () => {
    const p = P(2);
    expect(stealerFor(p, 0).id).toBe(1);
    expect(stealerFor(p, 1).id).toBe(0);
    expect(stealOptions(mcq, 1)).toEqual([true, false, true, true]);
    expect(stealOptions(mcq, null)).toEqual([true, true, true, true]);
  });
  it('right: the point is the stealer\'s and a steal; wrong: nobody scores, no penalty', () => {
    const p = P(2);
    let tl = newTally(p);
    tl = scoreOwn(tl, 0, false);       // Alex misses
    tl = scoreSteal(tl, 1, true);      // Johannes steals it
    expect(tl).toEqual({ scores: { 0: 0, 1: 1 }, rights: { 0: 0, 1: 0 }, steals: { 0: 0, 1: 1 } });
    const before = tl;
    tl = scoreSteal(scoreOwn(tl, 1, false), 0, false); // a miss, then a failed steal
    expect(tl).toEqual(before);
    tl = scoreOwn(tl, 1, true);
    expect(tl).toEqual({ scores: { 0: 0, 1: 2 }, rights: { 0: 0, 1: 1 }, steals: { 0: 0, 1: 1 } });
  });
});

describe('the deal: the same number of questions each (Alex, 26 Nov: "Yes, same each")', () => {
  const MODES = ['sprint', 'classic'];
  const deal = (plan, n) => Array.from({ length: plan.total }, (_, q) => dealt(plan, n, q));
  it('the table, as HQ settled it: Sprint one round, Classic two; a turn of three, two with five or six', () => {
    expect(ROUNDS).toEqual({ sprint: 1, classic: 2 });
    expect(TURN_SIZE).toEqual({ 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 });
    const rows = [2, 3, 4, 5, 6].map((n) => [n, gamePlan('sprint', n), gamePlan('classic', n)].map((x) => (typeof x === 'number' ? x : `${x.each}/${x.total}`)));
    expect(rows).toEqual([[2, '3/6', '6/12'], [3, '3/9', '6/18'], [4, '3/12', '6/24'], [5, '2/10', '4/20'], [6, '2/12', '4/24']]);
    expect(gamePlan('classic', 4)).toEqual({ perTurn: 3, rounds: 2, each: 6, total: 24 });
  });
  it('not dealt in turns: Survival, Top 10 in turns, a count outside 2 to 6', () => {
    expect(gamePlan('survival', 3)).toBeNull();
    expect(gamePlan('top10', 3)).toBeNull();
    expect(gamePlan('classic', 1)).toBeNull();
    expect(gamePlan('classic', 7)).toBeNull();
  });
  it('every player answers the same number, every mode, every count; no game past 24', () => {
    for (const m of MODES) for (let n = 2; n <= 6; n++) {
      const plan = gamePlan(m, n);
      expect(plan.total, `${m} ${n}`).toBeLessThanOrEqual(MAX_GAME_QUESTIONS);
      const counts = Array(n).fill(0);
      for (const d of deal(plan, n)) counts[d.seat]++;
      expect(counts, `${m} ${n}`).toEqual(Array(n).fill(plan.each));
      // Each player's own index runs 0 … each-1 once, in order.
      for (let s = 0; s < n; s++) {
        const own = deal(plan, n).filter((d) => d.seat === s).map((d) => d.own);
        expect(own, `${m} ${n} seat ${s}`).toEqual([...Array(plan.each).keys()]);
        expect(ownQuestions(plan, n, s).map((q) => dealt(plan, n, q).seat)).toEqual(Array(plan.each).fill(s));
      }
    }
  });
  it('who answers which question: turns go round in seat order, round after round', () => {
    const seats = (m, n) => deal(gamePlan(m, n), n).map((d) => d.seat).join('');
    expect(seats('sprint', 2)).toBe('000111');
    expect(seats('classic', 2)).toBe('000111000111');
    expect(seats('sprint', 4)).toBe('000111222333');
    expect(seats('classic', 3)).toBe('000111222000111222');
    expect(seats('sprint', 5)).toBe('0011223344');
    expect(seats('classic', 6)).toBe('001122334455001122334455');
    expect(ownQuestions(gamePlan('classic', 4), 4, 1)).toEqual([3, 4, 5, 15, 16, 17]);
    // Question 16 of a four-player Classic is the second player's fifth (own index 4), in their last turn.
    expect(dealt(gamePlan('classic', 4), 4, 16)).toEqual({ seat: 1, round: 1, own: 4, turnStart: 15, turnEnd: 17, ownStart: 3, ownEnd: 5, playersLast: true, gamesLast: false });
  });
  it('the line under the name: the game\'s last turn alone has nobody to pass to', () => {
    const lines = (m, n) => { const p = gamePlan(m, n); return Array.from({ length: p.rounds * n }, (_, t) => handoverLineKey(p, n, t * p.perTurn)); };
    expect(lines('classic', 2)).toEqual(['lp.next3', 'lp.next3', 'lp.yourLast3', 'lp.last3']);
    expect(lines('classic', 4)).toEqual(['lp.next3', 'lp.next3', 'lp.next3', 'lp.next3', 'lp.yourLast3', 'lp.yourLast3', 'lp.yourLast3', 'lp.last3']);
    expect(lines('classic', 6).slice(5)).toEqual(['lp.next2', 'lp.yourLast2', 'lp.yourLast2', 'lp.yourLast2', 'lp.yourLast2', 'lp.yourLast2', 'lp.last2']);
    // One round: nobody has had a turn before, so "your last" would read oddly; plain until the game's last.
    expect(lines('sprint', 3)).toEqual(['lp.next3', 'lp.next3', 'lp.last3']);
    expect(lines('sprint', 6)).toEqual(['lp.next2', 'lp.next2', 'lp.next2', 'lp.next2', 'lp.next2', 'lp.last2']);
  });
  it('a short bank: whole rounds come off, never an unequal game; none covered is the not-enough state', () => {
    const c4 = gamePlan('classic', 4);
    expect(fitPlan(c4, 4, 24)).toEqual(c4);
    expect(fitPlan(c4, 4, 40)).toEqual(c4);               // never more than the table
    expect(fitPlan(c4, 4, 23)).toEqual({ perTurn: 3, rounds: 1, each: 3, total: 12 });
    expect(fitPlan(c4, 4, 12)).toEqual({ perTurn: 3, rounds: 1, each: 3, total: 12 });
    expect(fitPlan(c4, 4, 11)).toBeNull();
    expect(fitPlan(gamePlan('sprint', 6), 6, 11)).toBeNull();
    expect(fitPlan(gamePlan('sprint', 6), 6, 0)).toBeNull();
    expect(fitPlan(null, 3, 30)).toBeNull();
    for (const m of MODES) for (let n = 2; n <= 6; n++) for (let have = 0; have <= 30; have++) {
      const p = fitPlan(gamePlan(m, n), n, have);
      if (!p) { expect(have, `${m} ${n} ${have}`).toBeLessThan(gamePlan(m, n).perTurn * n); continue; }
      expect(p.total).toBeLessThanOrEqual(have);
      const counts = Array(n).fill(0);
      for (const d of deal(p, n)) counts[d.seat]++;
      expect(counts, `${m} ${n} ${have}`).toEqual(Array(n).fill(p.each));
      // A cut game's last turn is the game's last; its earlier turns are never "the last".
      expect(dealt(p, n, p.total - 1).gamesLast).toBe(true);
      expect(deal(p, n).filter((d) => d.gamesLast).length).toBe(p.perTurn);
    }
  });
});

describe('the tables and the end', () => {
  it('scores so far: best first, play order on a tie (so before anyone scores, the play order), anyone out last', () => {
    const p = P(4);
    expect(scoresSoFar(p, { 0: 0, 1: 0, 2: 0, 3: 0 }).map((x) => x.id)).toEqual([0, 1, 2, 3]);
    expect(scoresSoFar(p, { 0: 3, 1: 1, 2: 2, 3: 1 }).map((x) => x.id)).toEqual([0, 2, 1, 3]);
    expect(scoresSoFar(p, { 0: 3, 1: 1, 2: 2, 3: 1 }, [0]).map((x) => x.id)).toEqual([2, 1, 3, 0]);
  });
  it('a win: the top score alone; the table best first', () => {
    const p = P(4);
    const st = standing({ players: p, scores: { 0: 5, 1: 3, 2: 7, 3: 4 }, mode: 'classic' });
    expect(st.kind).toBe('win');
    expect(st.top.map((x) => x.id)).toEqual([2]);
    expect(st.ranked.map((x) => x.id)).toEqual([2, 0, 3, 1]);
    expect(st.topScore).toBe(7);
  });
  it('a draw: the top score shared, two or three ways; no decider', () => {
    const p = P(4);
    const two = standing({ players: p.slice(0, 2), scores: { 0: 5, 1: 5 }, mode: 'sprint' });
    expect(two.kind).toBe('draw');
    expect(two.top.map((x) => x.id)).toEqual([0, 1]);
    const three = standing({ players: p, scores: { 0: 4, 1: 6, 2: 6, 3: 6 }, mode: 'classic' });
    expect(three.kind).toBe('draw');
    expect(three.top.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(three.ranked.map((x) => x.id)).toEqual([1, 2, 3, 0]);
    const twoOfFour = standing({ players: p, scores: { 0: 2, 1: 6, 2: 6, 3: 1 }, mode: 'classic' });
    expect(twoOfFour.top.map((x) => x.id)).toEqual([1, 2]);
    expect(twoOfFour.ranked.length).toBe(4);
  });
  it('Survival keeps its facts: last one standing first, then who lasted longest', () => {
    const p = P(4);
    const ls = standing({ players: p, scores: { 0: 1, 1: 4, 2: 2, 3: 0 }, mode: 'survival', eliminatedIds: [3, 0, 2], winnerId: 1, endReason: 'last-standing' });
    expect(ls.kind).toBe('win');
    expect(ls.ranked.map((x) => x.id)).toEqual([1, 2, 0, 3]);
    const wipe = standing({ players: p.slice(0, 2), scores: { 0: 2, 1: 2 }, mode: 'survival', eliminatedIds: [0, 1], winnerId: null, endReason: 'total-wipe' });
    expect(wipe.kind).toBe('wipe');
    expect(wipe.ranked.map((x) => x.id)).toEqual([1, 0]);
    const out = standing({ players: p, scores: { 0: 30, 1: 30, 2: 3, 3: 1 }, mode: 'survival', eliminatedIds: [3, 2], winnerId: null, endReason: 'questions-out' });
    expect(out.kind).toBe('draw');
    expect(out.top.map((x) => x.id)).toEqual([0, 1]);
    expect(out.ranked.map((x) => x.id)).toEqual([0, 1, 2, 3]);
  });
});

describe('the screens hold to the rules', () => {
  const lp = read('src/screens/LocalPlay.jsx');
  const parts = read('src/screens/passPlayParts.jsx');
  it('the old numbered PlayerMark is gone from pass and play; the disc draws no number', () => {
    expect(lp).not.toMatch(/PlayerMark|PLAYER_RGB/);
    expect(parts).toMatch(/export function PlayerDisc/);
    expect(parts).not.toMatch(/p\.n\b|id \+ 1\}/);
  });
  it('the question wears quizQuestion.css as it is (imported, not copied)', () => {
    expect(lp).toContain('import "./quizQuestion.css";');
    expect(read('src/screens/passPlay.css')).not.toMatch(/\.qq-card\{|\.qq-o\{/);
  });
  it('online multiplayer is untouched by the new classes', () => {
    expect(read('src/screens/OnlineMultiplayer.jsx')).not.toMatch(/pp-|passPlay/);
  });
});
