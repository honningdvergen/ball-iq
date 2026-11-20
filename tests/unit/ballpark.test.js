// Ballpark (prototype, 20 Nov 2026): the scoring, the keypad's number and the
// save. The view is thin; these pin what a player is told about their guess.
import { describe, it, expect } from 'vitest';
import {
  ballparkFactor, ballparkPoints, ballparkTier, ballparkSide, ballparkOffset, ballparkVerdict, ballparkMiss,
  factorLabel, pressKey, keypadValue, keypadShown, fullNumber, roundedParts,
  ballparkSlot, ballparkDay, localDayIndex, loadBallpark, saveBallpark, ballparkSaveKey, ballparkExact, ballparkTotal, ballparkSquares,
  shotSpot, SHOT_BOX, BALLPARK_DAYS, BALLPARK_ANCHOR_DAY, BALLPARK_PER_DAY, BALLPARK_VALUE_CAP, ballparkQuestion,
} from '../../src/lib/ballpark.js';
import DATA from '../../src/data/ballparkQuestions.json';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };

describe('how far out a guess was', () => {
  it('the factor is the same for double and for half, and never under 1', () => {
    expect(ballparkFactor(200, 100)).toBe(2);
    expect(ballparkFactor(50, 100)).toBe(2);
    expect(ballparkFactor(100, 100)).toBe(1);
  });
  it('nothing, zero or a negative is no guess at all', () => {
    for (const g of [0, -5, NaN, undefined, null, '']) {
      expect(ballparkFactor(g, 100)).toBe(Infinity);
      expect(ballparkPoints(g, 100)).toBe(0);
    }
  });
  it('100 for exact, 70 for a factor of two, 0 from a factor of ten, never negative', () => {
    expect(ballparkPoints(2720, 2720)).toBe(100);
    expect(ballparkPoints(5440, 2720)).toBe(70);
    expect(ballparkPoints(1360, 2720)).toBe(70);
    expect(ballparkPoints(27200, 2720)).toBe(0);
    expect(ballparkPoints(1, 2720)).toBe(0);
    expect(ballparkPoints(1e12, 6.175)).toBe(0);
  });
  it('the scale does not care how big the number is', () => {
    expect(ballparkPoints(7, 6.175)).toBe(ballparkPoints(7e6, 6.175e6));
  });
  it('tiers: within 5 percent, 25 percent, double, five times, then Row Z', () => {
    expect(ballparkTier(104, 100)).toBe(0);
    expect(ballparkTier(96, 100)).toBe(0);
    expect(ballparkTier(120, 100)).toBe(1);
    expect(ballparkTier(81, 100)).toBe(1);
    expect(ballparkTier(199, 100)).toBe(2);
    expect(ballparkTier(51, 100)).toBe(2);
    expect(ballparkTier(450, 100)).toBe(3);
    expect(ballparkTier(600, 100)).toBe(4);
    expect(ballparkTier(0, 100)).toBe(4);
  });
  it('too low, too high, and spot on only when it is exactly right', () => {
    expect(ballparkSide(90, 100)).toBe(-1);
    expect(ballparkSide(110, 100)).toBe(1);
    expect(ballparkSide(100, 100)).toBe(0);
    expect(ballparkSide(6.175, 6.175)).toBe(0);
    // The first draft called these "spot on". They are not.
    expect(ballparkSide(212, 211)).toBe(1);
    expect(ballparkSide(210, 211)).toBe(-1);
    expect(ballparkSide(1505, 1500)).toBe(1);
    expect(ballparkSide(452, 450)).toBe(1);
    expect(ballparkExact(100.4, 100)).toBe(false);
    expect(ballparkExact(0, 100)).toBe(false);
  });
  it('100 points is for the exact answer and nothing else: a near miss tops out at 99', () => {
    expect(ballparkPoints(1500, 1500)).toBe(100);
    expect(ballparkPoints(1501, 1500)).toBe(99);
    expect(ballparkPoints(1515, 1500)).toBe(99);
    expect(ballparkPoints(212, 211)).toBe(99);
    expect(ballparkPoints(3600000, 3587538)).toBe(99);
    for (const g of [1, 7, 1499, 1500, 1501, 3000, 15000, 1e9]) {
      const p = ballparkPoints(g, 1500);
      expect(p >= 0 && p <= 100, String(g)).toBe(true);
    }
  });
  it('the dot: 0 on the answer, -1 and 1 at a tenth and ten times, and no further', () => {
    expect(ballparkOffset(100, 100)).toBe(0);
    expect(ballparkOffset(10, 100)).toBe(-1);
    expect(ballparkOffset(1000, 100)).toBe(1);
    expect(ballparkOffset(1, 100)).toBe(-1);
    expect(ballparkOffset(1e9, 100)).toBe(1);
    expect(ballparkOffset(0, 100)).toBe(-1);
  });
  it('the factor as it is read: two decimals when close, none when far', () => {
    expect(factorLabel(1.4234, 'en-GB')).toBe('1.42');
    expect(factorLabel(3.64, 'en-GB')).toBe('3.6');
    expect(factorLabel(36.4, 'en-GB')).toBe('36');
    expect(factorLabel(5000, 'en-GB')).toBe('1,000+');
    expect(factorLabel(Infinity, 'en-GB')).toBe('1,000+');
  });
  it('the miss as a person says it: a percentage when close, a factor when far', () => {
    expect(ballparkMiss(2720, 2720, 'en-GB')).toEqual({ side: 0 });
    expect(ballparkMiss(212, 211, 'en-GB')).toEqual({ side: 1, pct: 1 });
    expect(ballparkMiss(2500, 2720, 'en-GB')).toEqual({ side: -1, pct: 8 });
    expect(ballparkMiss(5000, 2720, 'en-GB')).toEqual({ side: 1, pct: 84 });
    expect(ballparkMiss(1361, 2720, 'en-GB')).toEqual({ side: -1, pct: 50 });
    expect(ballparkMiss(1000, 2720, 'en-GB')).toEqual({ side: -1, x: '2.7' });
    expect(ballparkMiss(100000, 2720, 'en-GB')).toEqual({ side: 1, x: '37' });
    expect(ballparkMiss(2735, 2720, 'en-GB')).toEqual({ side: 1, pct: 1 });
  });
  it('the line under the total', () => {
    expect(ballparkVerdict(300)).toBe(3);
    expect(ballparkVerdict(270)).toBe(3);
    expect(ballparkVerdict(269)).toBe(2);
    expect(ballparkVerdict(210)).toBe(2);
    expect(ballparkVerdict(130)).toBe(1);
    expect(ballparkVerdict(129)).toBe(0);
    expect(ballparkVerdict(0)).toBe(0);
  });
});

describe('the shot map: every guess is a shot at goal', () => {
  const B = SHOT_BOX;
  it('low guesses land left of centre, high guesses right', () => {
    for (const g of [1, 50, 80, 97]) expect(shotSpot(g, 100).x).toBeLessThan(160);
    for (const g of [103, 120, 190, 400, 5000]) expect(shotSpot(g, 100).x).toBeGreaterThan(160);
  });
  it('top corner and on target are inside the frame; off the post is on the post', () => {
    for (const g of [96, 100, 104, 82, 120]) {
      const p = shotSpot(g, 100);
      expect(p.x > B.left && p.x < B.right && p.y > B.bar && p.y < B.ground, String(g)).toBe(true);
    }
    expect(shotSpot(104, 100).y).toBeLessThan(shotSpot(120, 100).y); // the top corner is higher than a plain shot on target
    expect(shotSpot(60, 100).x).toBe(B.left);
    expect(shotSpot(180, 100).x).toBe(B.right);
  });
  it('wide is outside the post on the ground, Row Z is far out and high, and nothing leaves the picture', () => {
    const wide = shotSpot(300, 100); const z = shotSpot(100000, 100); const zLow = shotSpot(0.001, 100);
    expect(wide.x).toBeGreaterThan(B.right + 9);
    expect(wide.y).toBeGreaterThan(B.bar);
    expect(z.y).toBeLessThan(B.bar);
    expect(z.x).toBeGreaterThan(wide.x);
    for (const p of [wide, z, zLow, shotSpot(450, 100), shotSpot(21, 100)]) {
      expect(p.x >= 10 && p.x <= B.w - 10 && p.y >= B.top + 10 && p.y <= B.h - 10).toBe(true);
    }
  });
  it('a worse miss in the same tier never sits nearer the middle', () => {
    expect(shotSpot(120, 100).x).toBeGreaterThan(shotSpot(110, 100).x);
    expect(shotSpot(450, 100).x).toBeGreaterThan(shotSpot(250, 100).x);
  });
  it('a top-corner ball and a ball on the same post are a clear ball apart', () => {
    for (const [i, j] of [[0, 1], [1, 0], [0, 2], [2, 1]]) {
      const a = shotSpot(96, 100, i); const b = shotSpot(60, 100, j);
      expect(Math.hypot(a.x - b.x, a.y - b.y), `${i},${j}`).toBeGreaterThan(19);
    }
  });
  it('three shots of the same kind on the same side do not sit on top of each other', () => {
    const [a, b, c] = [0, 1, 2].map((i) => shotSpot(150, 100, i));
    expect(new Set([a.y, b.y, c.y]).size).toBe(3);
  });
});

describe('the keypad builds a number', () => {
  const type = (keys, start = '') => keys.reduce((cur, k) => pressKey(cur, k), start);
  it('digits append, back removes one, and back on nothing stays nothing', () => {
    expect(type(['2', '7', '2', '0'])).toBe('2720');
    expect(type(['2', '7', 'back'])).toBe('2');
    expect(type(['back'])).toBe('');
  });
  it('no leading zeros, but "0." is fine', () => {
    expect(type(['0', '0', '7'])).toBe('7');
    expect(type(['.'])).toBe('0.');
    expect(type(['0', '.', '5'])).toBe('0.5');
  });
  it('one point only, three decimals at most, twelve whole digits at most', () => {
    expect(type(['6', '.', '1', '.', '7'])).toBe('6.17');
    expect(type(['6', '.', '1', '7', '5', '9'])).toBe('6.175');
    expect(type('12345678901234'.split(''))).toBe('123456789012');
  });
  it('a key that is not a key changes nothing', () => {
    expect(pressKey('12', 'x')).toBe('12');
    expect(pressKey('12', '10')).toBe('12');
  });
  it('the value is the number as typed, in full: there is no "million" to lean on', () => {
    expect(keypadValue('2400000')).toBe(2400000);
    expect(keypadValue('2360000000')).toBe(2360000000);
    expect(keypadValue('6.175')).toBe(6.175);
    expect(keypadValue('')).toBe(0);
    expect(keypadValue('0.')).toBe(0);
    expect(keypadValue('0')).toBe(0);
    expect(keypadValue('999999999999')).toBeLessThan(BALLPARK_VALUE_CAP);
  });
  it('shown with thousands marks, keeping what was just typed', () => {
    expect(keypadShown('', 'en-GB')).toBe('');
    expect(keypadShown('2720', 'en-GB')).toBe('2,720');
    expect(keypadShown('1250.', 'en-GB')).toBe('1,250.');
    expect(keypadShown('0.50', 'en-GB')).toBe('0.50');
  });
  it('a number in full, and in words when it is big enough to need them', () => {
    expect(fullNumber(3587538, 'en-GB')).toBe('3,587,538');
    expect(fullNumber(6.175, 'en-GB')).toBe('6.175');
    expect(roundedParts(2720, 'en-GB')).toBeNull();
    expect(roundedParts(107, 'en-GB')).toBeNull();
    expect(roundedParts(91648, 'en-GB')).toEqual({ n: '91.6', scale: 1e3, exact: false });
    expect(roundedParts(3587538, 'en-GB')).toEqual({ n: '3.59', scale: 1e6, exact: false });
    expect(roundedParts(265000000, 'en-GB')).toEqual({ n: '265', scale: 1e6, exact: true });
    expect(roundedParts(2360000000, 'en-GB')).toEqual({ n: '2.36', scale: 1e9, exact: true });
    // Rounding past a boundary moves up a word: never "1,000 thousand".
    expect(roundedParts(999999, 'en-GB')).toEqual({ n: '1', scale: 1e6, exact: false });
    expect(roundedParts(999999999, 'en-GB')).toEqual({ n: '1', scale: 1e9, exact: false });
    expect(roundedParts(999999999999, 'en-GB').n).toBe('1,000');
  });
});

describe('the day', () => {
  const at = (dayIndex) => new Date(dayIndex * 86400000 + 12 * 3600000 + new Date(dayIndex * 86400000).getTimezoneOffset() * 60000);
  it('the anchor day is Ballpark #1, and the short list comes round again', () => {
    const n = BALLPARK_DAYS.length;
    expect(localDayIndex(at(BALLPARK_ANCHOR_DAY))).toBe(BALLPARK_ANCHOR_DAY);
    expect(ballparkSlot(at(BALLPARK_ANCHOR_DAY))).toBe(1);
    expect(ballparkSlot(at(BALLPARK_ANCHOR_DAY + 1))).toBe(2);
    expect(ballparkSlot(at(BALLPARK_ANCHOR_DAY + n))).toBe(1);
    expect(ballparkSlot(at(BALLPARK_ANCHOR_DAY - 1))).toBe(n);
  });
  it('?day=N opens that day when it exists, and is ignored when it does not', () => {
    const today = ballparkSlot(at(BALLPARK_ANCHOR_DAY));
    expect(ballparkSlot(at(BALLPARK_ANCHOR_DAY), 2)).toBe(2);
    for (const junk of [0, -1, 99, 1.5, NaN, 'x', null]) expect(ballparkSlot(at(BALLPARK_ANCHOR_DAY), junk)).toBe(today);
  });
});

describe('the data', () => {
  it('every day has three questions that exist, and no question is used twice', () => {
    const seen = new Set();
    for (const ids of DATA.days) {
      expect(ids.length).toBe(BALLPARK_PER_DAY);
      for (const id of ids) {
        expect(ballparkQuestion(id), id).toBeTruthy();
        expect(seen.has(id), `${id} twice`).toBe(false);
        seen.add(id);
      }
    }
    expect(ballparkDay(1).length).toBe(BALLPARK_PER_DAY);
  });
  it('every question has a positive number, a unit, a how line and a named https source', () => {
    for (const q of DATA.questions) {
      expect(typeof q.q === 'string' && q.q.trim().endsWith('?'), q.id).toBe(true);
      expect(Number.isFinite(q.answer) && q.answer > 0, q.id).toBe(true);
      expect(typeof q.unit === 'string' && q.unit.length > 0, q.id).toBe(true);
      expect(typeof q.how === 'string' && q.how.length > 10, q.id).toBe(true);
      expect(typeof q.source?.name === 'string' && q.source.name.length > 1, q.id).toBe(true);
      expect(/^https:\/\//.test(q.source?.url || ''), q.id).toBe(true);
    }
  });
  it('nothing unverified ships: no provisional marker, no placeholder source', () => {
    expect(DATA._provisional).toBeUndefined();
    for (const q of DATA.questions) {
      expect(q.source.name).not.toMatch(/unverified/i);
      expect(q.source.url).not.toMatch(/example\.com/);
    }
  });
  it('the question never gives its own answer away', () => {
    for (const q of DATA.questions) {
      const digits = String(q.answer).replace(/\D/g, '');
      if (digits.length >= 3) expect(q.q.replace(/\D/g, '').includes(digits), q.id).toBe(false);
    }
  });
});

describe('the save', () => {
  it('nothing saved reads as no guesses and nothing seen', () => {
    expect(loadBallpark('d1', mem())).toEqual({ g: [], seen: 0 });
  });
  it('a locked guess comes back, per key, with how many reveals were moved on from', () => {
    const s = mem();
    expect(saveBallpark('d20778', [2500], 0, s)).toBe(true);
    saveBallpark('p2', [5, 6, 7], 3, s);
    expect(loadBallpark('d20778', s)).toEqual({ g: [2500], seen: 0 });
    expect(loadBallpark('p2', s)).toEqual({ g: [5, 6, 7], seen: 3 });
    expect(loadBallpark('p3', s)).toEqual({ g: [], seen: 0 });
  });
  it('a reload in the middle of a reveal comes back to that reveal: seen stays behind the guess', () => {
    const s = mem();
    saveBallpark('p1', [10, 20], 1, s);
    expect(loadBallpark('p1', s)).toEqual({ g: [10, 20], seen: 1 });
  });
  it('seen can never run ahead of the guesses, and an old row without it counts every guess as seen', () => {
    const s = mem();
    saveBallpark('p1', [10], 5, s);
    expect(loadBallpark('p1', s).seen).toBe(1);
    s.setItem('biq_ballpark', JSON.stringify({ p2: { g: [1, 2] }, p3: { g: [1, 2], s: -4 }, p4: { g: [1], s: 'x' } }));
    expect(loadBallpark('p2', s).seen).toBe(2);
    expect(loadBallpark('p3', s).seen).toBe(2);
    expect(loadBallpark('p4', s).seen).toBe(1);
  });
  it('a real day is keyed by the calendar, a day opened on purpose by its slot', () => {
    const noon = new Date(20778 * 86400000 + 12 * 3600000 + new Date(20778 * 86400000).getTimezoneOffset() * 60000);
    expect(ballparkSaveKey(3, false, noon)).toBe('d20778');
    expect(ballparkSaveKey(3, true, noon)).toBe('p3');
    // Five days on the same slot comes round again, under a new key: playable.
    const later = new Date(noon.getTime() + 5 * 86400000);
    expect(ballparkSaveKey(3, false, later)).toBe('d20783');
  });
  it('real days older than a month are dropped on save; prototype days are kept', () => {
    const s = mem();
    const today = localDayIndex();
    s.setItem('biq_ballpark', JSON.stringify({ [`d${today - 40}`]: { g: [1], s: 1 }, [`d${today - 2}`]: { g: [2], s: 1 }, p1: { g: [3], s: 1 } }));
    saveBallpark(`d${today}`, [9], 0, s);
    const all = JSON.parse(s.getItem('biq_ballpark'));
    expect(Object.keys(all).sort()).toEqual([`d${today - 2}`, `d${today}`, 'p1'].sort());
  });
  it('rubbish in storage reads as no guesses, and never more than three', () => {
    const s = mem();
    s.setItem('biq_ballpark', '{not json');
    expect(loadBallpark('d1', s)).toEqual({ g: [], seen: 0 });
    s.setItem('biq_ballpark', '[1,2]');
    expect(loadBallpark('d1', s)).toEqual({ g: [], seen: 0 });
    s.setItem('biq_ballpark', JSON.stringify({ d1: { g: [1, 'x', -2, 3, 4, 5, 6] } }));
    expect(loadBallpark('d1', s).g).toEqual([1, 3, 4]);
  });
  it('storage that throws does not break the game', () => {
    const bad = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(loadBallpark('d1', bad)).toEqual({ g: [], seen: 0 });
    expect(saveBallpark('d1', [1], 0, bad)).toBe(false);
  });
  it('a browser that throws on the very mention of localStorage does not break it either', () => {
    const real = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    try {
      expect(loadBallpark('d1')).toEqual({ g: [], seen: 0 });
      expect(saveBallpark('d1', [1], 0)).toBe(false);
    } finally {
      if (real) Object.defineProperty(globalThis, 'localStorage', real); else delete globalThis.localStorage;
    }
  });
});

describe('the total and the share line', () => {
  const qs = [{ answer: 100 }, { answer: 1000 }, { answer: 5 }];
  it('adds the three scores; an unanswered question scores nothing', () => {
    expect(ballparkTotal([100, 2000, 50], qs)).toBe(100 + 70 + 0);
    expect(ballparkTotal([100], qs)).toBe(100);
  });
  it('one square a question', () => {
    expect([...ballparkSquares([100, 2000, 50], qs)].length).toBe(3);
  });
});
