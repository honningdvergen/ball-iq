import { describe, it, expect } from 'vitest';
import { bucketFor, isoWeek, installDay, appDayEvent, cleanAppDayMeta, playDays, INSTALL_KEY, SENT_KEY } from '../../src/lib/cohort.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// A localStorage stand-in with key(i), which the scan needs.
function store(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    dump: () => Object.fromEntries(m),
  };
}
const day = (s) => new Date(`${s}T12:00:00`);

describe('the return counter', () => {
  it('buckets days since the first open', () => {
    expect([0, 1, 2, 3, 4, 7, 8, 14, 15, 30, 31, 400].map(bucketFor))
      .toEqual(['0', '1', '2-3', '2-3', '4-7', '4-7', '8-14', '8-14', '15-30', '15-30', '31+', '31+']);
  });

  it('names ISO weeks, including across the new year', () => {
    expect(isoWeek('2026-11-08')).toBe('2026-W45');
    expect(isoWeek('2026-11-09')).toBe('2026-W46');
    expect(isoWeek('2027-01-01')).toBe('2026-W53');
  });

  it('a brand-new phone starts today and says so once a day', () => {
    const ls = store();
    expect(appDayEvent(day('2026-11-08'), ls)).toEqual({ name: 'app-day', meta: { w: '2026-W45', b: '0', lg: '0' } });
    expect(appDayEvent(day('2026-11-08'), ls)).toBeNull();
    expect(appDayEvent(day('2026-11-09'), ls).meta).toEqual({ w: '2026-W45', b: '1', lg: '0' });
    expect(ls.getItem(INSTALL_KEY)).toBe('2026-11-08');
  });

  it('an existing phone dates itself from its earliest stored daily, not from the update', () => {
    const ls = store({ biq_first_game_played: '1', 'biq_trail_2026-10-03': '{}', 'biq_wordle_2026-10-20': '{}', biq_league_member: '1' });
    expect(appDayEvent(day('2026-11-08'), ls).meta).toEqual({ w: '2026-W40', b: '31+', lg: '1' });
    expect(installDay(day('2026-11-09'), ls)).toBe('2026-10-03');
  });

  it('a phone that played but kept no dated history is "pre", never new', () => {
    const ls = store({ biq_first_game_played: '1' });
    expect(appDayEvent(day('2026-11-08'), ls).meta).toEqual({ w: 'pre', b: '31+', lg: '0' });
  });

  it('carries nothing but week, bucket and the league flag, and the native filter drops anything else', () => {
    const e = appDayEvent(day('2026-11-08'), store());
    expect(Object.keys(e.meta).sort()).toEqual(['b', 'lg', 'w']);
    expect(cleanAppDayMeta({ w: '2026-W45', b: '0', lg: '1', club: 'arsenal', vid: 'x' })).toEqual({ w: '2026-W45', b: '0', lg: '1' });
    expect(cleanAppDayMeta({ w: 'Arsenal', b: '9', lg: 'yes' })).toEqual({});
  });

  it('a storage failure sends nothing rather than a guess', () => {
    const broken = { getItem() { throw new Error('denied'); }, setItem() {}, key: () => null, length: 0 };
    expect(appDayEvent(day('2026-11-08'), broken)).toBeNull();
  });

  it('the sent marker is the calendar day', () => {
    const ls = store();
    appDayEvent(day('2026-11-08'), ls);
    expect(ls.getItem(SENT_KEY)).toBe('2026-11-08');
  });
});

describe('the rating ask reaches the dailies', () => {
  it('counts distinct days played across the five dailies', () => {
    const ls = store({ 'biq_trail_2026-11-01': '{}', 'biq_wordle_2026-11-01': '{}', 'biq_mystery_2026-11-03': '{}', 'biq_top10_2026-11-05': '{}', biq_other: 'x' });
    expect(playDays(ls)).toBe(3);
  });
  it('Trail, Top 10 and Mystery ask natively on a good result, for a phone with three play days', () => {
    const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
    const i = APP.indexOf('TRAIL, TOP 10 AND MYSTERY ASK TOO');
    const block = APP.slice(i, APP.indexOf("if (e?.detail?.game === 'footle'", i));
    expect(block).toMatch(/if \(IS_NATIVE && \["trail", "top10", "mystery"\]\.includes\(e\?\.detail\?\.game\) && e\.detail\.positive === true\)/);
    expect(block).toMatch(/if \(playDays\(\) < 3\) return;/);
    expect(block).toMatch(/if \(notifOpened\) return;/);
    expect(block).toMatch(/const blocked = nativeAskBlockedReason\(\);[\s\S]*loopEvent\("rate-prompt-shown"/);
  });
});
