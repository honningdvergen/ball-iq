import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * A stitch-up never touches the daily: no biq_trail_<day> save, no
 * biq:daily-completed (XP, the streak, the scores row, the day bar), no
 * biq:daily-reviewed. It plays in the Trail's own engine, so this runs that
 * engine's EFFECTS, which a server render skips: React's useEffect is swapped
 * for one that runs at once. The daily is run through the same harness first,
 * so a harness that ran nothing could not pass.
 */
vi.mock('react', async (importOriginal) => {
  const R = await importOriginal();
  const run = (fn) => { try { fn(); } catch (e) { globalThis.__effectErrors?.push(e); } };
  return { ...R, default: { ...R, useEffect: run, useLayoutEffect: run }, useEffect: run, useLayoutEffect: run };
});

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { default: TransferTrail } = await import('../../src/screens/TransferTrail.jsx');
const { findStitchPlayer } = await import('../../src/lib/stitch.js');
const { stitchHash } = await import('../../src/lib/stitchToken.js');
const { TRAIL_PLAYERS } = await import('../../src/lib/trail.js');

let store, events;
beforeEach(() => {
  store = new Map();
  events = [];
  globalThis.__effectErrors = [];
  const ls = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  };
  vi.stubGlobal('localStorage', ls);
  vi.stubGlobal('window', {
    localStorage: ls,
    addEventListener() {}, removeEventListener() {},
    dispatchEvent: (e) => { events.push(e.type); return true; },
    innerHeight: 812, visualViewport: null,
  });
  vi.stubGlobal('document', { activeElement: null, documentElement: { classList: { contains: () => false } } });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => null })));
});
afterEach(() => { vi.unstubAllGlobals(); });

const h = React.createElement;
const zidane = () => findStitchPlayer(stitchHash('t:ZIDANE'));
const DAY = new Date(2026, 9, 16, 12);

describe('the harness runs effects (control: the daily writes)', () => {
  it('a daily Trail in play saves its day', () => {
    const p = TRAIL_PLAYERS.find((x) => x.key === 'ZIDANE');
    renderToStaticMarkup(h(TransferTrail, { player: p, date: DAY }));
    expect([...store.keys()]).toContain('biq_trail_2026-10-16');
  });

  it('a daily Trail solved now announces the daily finish', () => {
    const p = TRAIL_PLAYERS.find((x) => x.key === 'ZIDANE');
    // Saved as in play, then the winning guess is already in the attempts.
    store.set('biq_trail_2026-10-16', JSON.stringify({ status: 'playing', attempts: [{ text: 'Zidane', skipped: false }] }));
    renderToStaticMarkup(h(TransferTrail, { player: p, date: DAY }));
    expect(events).toContain('biq:daily-completed');
  });
});

describe('a stitch-up', () => {
  const stitchFor = (initial) => {
    const saves = [], finishes = [];
    return {
      saves, finishes,
      stitch: {
        opening: 2, sub: 'Alex stitched you up',
        load: () => initial, save: (s) => saves.push(s), onFinish: (r) => finishes.push(r),
        Done: () => null,
      },
    };
  };

  for (const [label, attempts, won] of [
    ['solved', [{ text: 'Zidane', skipped: false }], true],
    ['lost on five skips', Array.from({ length: 5 }, () => ({ text: '', skipped: true })), false],
  ]) {
    it(`${label}: no daily key, no daily event, its own save and one finish`, () => {
      const s = stitchFor({ status: 'playing', attempts });
      renderToStaticMarkup(h(TransferTrail, { player: zidane(), date: DAY, stitch: s.stitch }));
      expect([...store.keys()].filter((k) => /^biq_trail_|^biq_daily|^biq_streak|^biq_login/.test(k))).toEqual([]);
      expect(events.filter((e) => /^biq:daily-/.test(e) || e === 'biq:archive-completed')).toEqual([]);
      expect(s.saves.at(-1)).toMatchObject({ status: won ? 'won' : 'lost' });
      expect(s.finishes).toEqual([{ won, clubsUsed: won ? 2 : 4 }]);
      expect(globalThis.__effectErrors).toEqual([]);
    });
  }

  it('a stitch-up reopened after its finish does not finish again', () => {
    const s = stitchFor({ status: 'won', attempts: [{ text: 'Zidane', skipped: false }] });
    renderToStaticMarkup(h(TransferTrail, { player: zidane(), date: DAY, stitch: s.stitch }));
    expect(s.finishes).toEqual([]);
    expect(events).toEqual([]);
  });

  it('a stitch-up in play writes nothing of the daily either', () => {
    const s = stitchFor(null);
    renderToStaticMarkup(h(TransferTrail, { player: zidane(), date: DAY, stitch: s.stitch }));
    expect([...store.keys()]).toEqual([]);
    expect(s.saves.at(-1)).toMatchObject({ status: 'playing', attempts: [] });
  });
});
