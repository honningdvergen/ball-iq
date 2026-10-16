import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  leagueInviteToken, parseLeagueInviteToken, leagueInviteUrl, homeCardLine, finalShareText,
  h2hShareText, rankText, whistleLine, weekOfLabel, zoneCity, h2hLeagueName,
} from '../../src/lib/leagues.js';

/**
 * Mates' leagues, the client half: the invite token, the words on the table,
 * and the one-send guarantee of the results panel.
 */

describe('the invite token', () => {
  it('round-trips a code, a league name and an inviter', () => {
    const t = leagueInviteToken('K7QM2XPA', 'The Lads', 'Alex');
    expect(t).toBe('K7QM2XPA.The%20Lads.Alex');
    expect(parseLeagueInviteToken(t)).toEqual({ code: 'K7QM2XPA', name: 'The Lads', inviter: 'Alex' });
    expect(leagueInviteUrl('K7QM2XPA', 'The Lads', 'Alex')).toBe('https://balliq.app/l/K7QM2XPA.The%20Lads.Alex');
  });

  it('reads the decoded form a query string hands over, and a lower-case code', () => {
    expect(parseLeagueInviteToken('k7qm2xpa.The Lads.Alex')).toEqual({ code: 'K7QM2XPA', name: 'The Lads', inviter: 'Alex' });
    expect(parseLeagueInviteToken('K7QM2XPA')).toEqual({ code: 'K7QM2XPA', name: '', inviter: '' });
  });

  it('a dot in a label can never split the token in the wrong place', () => {
    const t = leagueInviteToken('K7QM2XPA', 'St. Pauli Lads', 'J.Doe');
    expect(t.split('.').length).toBe(3);
    expect(parseLeagueInviteToken(t)).toEqual({ code: 'K7QM2XPA', name: 'St Pauli Lads', inviter: 'J Doe' });
    // Decoded on the way in (a rewrite or searchParams), it still parses.
    expect(parseLeagueInviteToken(decodeURIComponent(t))).toEqual({ code: 'K7QM2XPA', name: 'St Pauli Lads', inviter: 'J Doe' });
  });

  it('accents survive; markup and over-long labels do not', () => {
    const t = leagueInviteToken('K7QM2XPA', 'Atlético <b>Lads</b>', 'Ødegaard');
    expect(parseLeagueInviteToken(t)).toEqual({ code: 'K7QM2XPA', name: 'Atlético bLadsb', inviter: 'Ødegaard' });
    expect(parseLeagueInviteToken(leagueInviteToken('K7QM2XPA', 'x'.repeat(80))).name).toHaveLength(32);
  });

  it('refuses a code outside the alphabet', () => {
    expect(leagueInviteToken('K7QM2XP0', 'Lads')).toBeNull();     // 0 is not in it
    expect(leagueInviteToken('K7QM2XP', 'Lads')).toBeNull();      // seven characters
    expect(parseLeagueInviteToken('K7QM2XPI.Lads')).toBeNull();   // I is not in it
    expect(parseLeagueInviteToken('f.166.3.Alex')).toBeNull();    // a game challenge
    expect(parseLeagueInviteToken('')).toBeNull();
  });
});

describe('the words on the table', () => {
  const MON = 20738; // Mon 12 Oct 2026
  it('week and whistle', () => {
    expect(new Date(MON * 86400000).getUTCDay()).toBe(1);
    expect(weekOfLabel(MON)).toBe('Week of 12 Oct');
    expect(zoneCity('America/New_York')).toBe('New York');
    expect(whistleLine({ week_start: MON, tz: 'Europe/Oslo', is_final: false })).toBe('Week of 12 Oct · Final whistle Sun midnight (Oslo)');
    expect(whistleLine({ week_start: MON, tz: 'Europe/Oslo', is_final: true })).toBe('Week of 12 Oct · Final table');
  });

  it('a shared rank reads "=2"', () => {
    expect(rankText(2, true)).toBe('=2');
    expect(rankText(3, false)).toBe('3');
  });

  it('the Home card line', () => {
    expect(homeCardLine({ id: 'a', my_rank: 2, my_points: 30, leader_name: 'Alex', leader_points: 34, gap: 4 })).toBe('2nd · 4 behind Alex');
    expect(homeCardLine({ id: 'a', my_rank: 1, my_tied: true, my_points: 30, leader_name: 'Alex', leader_points: 30, gap: 0 })).toBe('=1st · level with Alex');
    expect(homeCardLine({ id: 'a', my_rank: 1, my_points: 31, leader_name: null, leader_points: 31, gap: 0 })).toBe('1st · 31 points');
    expect(homeCardLine({ id: 'a', my_rank: 1, my_points: 0, leader_points: 0 })).toBe('Points from today, Monday to Sunday');
    expect(homeCardLine({ id: 'b', week_start: MON, last_final_unseen: true, my_rank: 3 })).toBe('Final table is in');
  });

  it('the final card text: one winner, a tie, the spoon and a bottler', () => {
    const meta = { name: 'The Lads', week_start: MON };
    expect(finalShareText(meta, [
      { name: 'Alex', points: 214, labels: ['crown'] },
      { name: 'Ben', points: 200, labels: [] },
      { name: 'Cal', points: 150, labels: [] },
      { name: 'Jon', points: 140, labels: ['bottled'] },
      { name: 'Sam', points: 90, labels: ['spoon'] },
    ])).toBe('The Lads, week of 12 Oct: Alex wins on 214. Wooden spoon: Sam. Bottled it: Jon.');
    expect(finalShareText(meta, [
      { name: 'Alex', points: 120, labels: ['crown'] },
      { name: 'Sam', points: 120, labels: ['crown'] },
      { name: 'Jon', points: 80, labels: ['spoon'] },
    ])).toBe('The Lads, week of 12 Oct: Alex and Sam share it on 120. Wooden spoon: Jon.');
  });

  it('the head-to-head seed', () => {
    expect(h2hShareText({ game: 'footle', edition: 166, mine: 3, theirs: 5 }, 'https://balliq.app/l/X'))
      .toBe('Footle No. 166: 3 v your 5. Make it a week? https://balliq.app/l/X');
    expect(h2hShareText({ game: 'daily7', edition: 20742, mine: 6, theirs: 4 }, 'U')).toBe('Daily 7: 6/7 v your 4/7. Make it a week? U');
    expect(h2hLeagueName('Sam', 'Alex')).toBe('Alex v Sam');
    expect(h2hLeagueName('', '')).toBe("Mates' league");
  });
});

// ── the results panel sends a result exactly once ──
describe('recordLeagueResult: two panels, one request', () => {
  let store, fetchMock;
  const mem = () => ({
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  });
  const session = () => {
    store['sb-blcisypmngimqkwxrrdm-auth-token'] = JSON.stringify({ access_token: 'tok-1', expires_at: Math.floor(Date.now() / 1000) + 3600 });
  };
  const fresh = async () => { vi.resetModules(); return import('../../src/lib/leagueResults.js'); };

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', mem());
    vi.stubGlobal('navigator', { webdriver: false });
    vi.stubEnv('VITE_SUPABASE_KEY', 'anon-key');
    fetchMock = vi.fn(async () => ({ ok: true, status: 200, text: async () => '8' }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('the double mount (mobile + desktop panel, same tick) sends once, with the player\'s own token', async () => {
    session();
    const { recordLeagueResult } = await fresh();
    const r = { game: 'footle', edition: 166, bucket: 3, won: true };
    const [a, b] = await Promise.all([recordLeagueResult(r), recordLeagueResult(r)]);
    expect(a && b).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/rest\/v1\/rpc\/record_league_result$/);
    expect(init.headers.authorization).toBe('Bearer tok-1');
    expect(JSON.parse(init.body)).toEqual({ p_game: 'footle', p_edition: 166, p_bucket: 3, p_won: true });
    // A later mount (a reload) reads the flag and sends nothing.
    const again = await fresh();
    await again.recordLeagueResult(r);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('no session: the result waits in the outbox, and goes once a session exists', async () => {
    const lib = await fresh();
    await lib.recordLeagueResult({ game: 'top10', edition: 9, bucket: 7, won: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(lib.readLeagueOutbox()).toEqual([{ game: 'top10', edition: 9, bucket: 7, won: true }]);
    session();
    expect(await lib.flushLeagueOutbox()).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lib.readLeagueOutbox()).toEqual([]);
  });

  it('the outbox keeps the last sixteen, one per puzzle', async () => {
    const lib = await fresh();
    for (let i = 0; i < 20; i++) lib.queueLeagueResult({ game: 'daily7', edition: 20000 + i, bucket: 5, won: true });
    lib.queueLeagueResult({ game: 'daily7', edition: 20019, bucket: 6, won: true });
    const box = lib.readLeagueOutbox();
    expect(box).toHaveLength(16);
    expect(box.filter((x) => x.edition === 20019)).toEqual([{ game: 'daily7', edition: 20019, bucket: 6, won: true }]);
  });

  it('the migration not applied (404): nothing is kept to retry, nothing breaks', async () => {
    session();
    fetchMock.mockImplementation(async () => ({ ok: false, status: 404, text: async () => '' }));
    const lib = await fresh();
    expect(await lib.recordLeagueResult({ game: 'trail', edition: 75, bucket: 2, won: true })).toBe(false);
    expect(lib.readLeagueOutbox()).toEqual([]);
  });

  it('native shells and out-of-range results send nothing', async () => {
    session();
    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true } });
    const lib = await fresh();
    expect(await lib.recordLeagueResult({ game: 'footle', edition: 166, bucket: 3, won: true })).toBe(false);
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', mem());
    vi.stubGlobal('fetch', fetchMock);
    const lib2 = await fresh();
    expect(await lib2.recordLeagueResult({ game: 'footle', edition: 166, bucket: 7, won: true })).toBe(false);
    expect(await lib2.recordLeagueResult({ game: 'mystery', edition: 3, bucket: 2, won: true })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
