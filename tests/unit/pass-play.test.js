// Pass and play's pure parts (src/lib/passPlay.js): the players' colours and
// badges, Steal, the tables and the end. The look and the rules Alex approved on
// 26 Nov 2026 (ball-iq-audit/2026-11-26/pass-play-build-brief.md, JOB 1).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  STEAL_MAX_PLAYERS, STEAL_SHOWS_STRUCK, COLOURS, BADGES, initialSlots, normalizeSlots, heldByOthers, pickFor,
  makePlayers, slotsFromPlayers, stealInGame, canSteal, stealerFor, newTally, scoreOwn, scoreSteal, stealOptions,
  scoresSoFar, standing,
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
