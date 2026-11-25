// 17 Nov 2026, Alex's recording of build 181: the league row arrived on Home a
// second after the rest and pushed the rows under it down. For a member the
// card now draws the last answer this phone had, at once, and the network
// corrects it. These pin what is remembered and when it is forgotten.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let answer;
// `session`: what this phone has stored. `asked`: calls that reached the server.
let session = { user: { id: 'u1' } };
let asked = 0;
vi.mock('../../src/supabase.js', () => ({
  supabase: { rpc: async () => { asked += 1; return answer; } },
  readStoredSession: async () => session,
}));

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };
const league = [{ id: 'l1', code: 'K7QM2XPA', name: 'The Lads', members: 3 }];

describe('the Home league card remembers its last answer', () => {
  let lib;
  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', mem());
    lib = await import('../../src/lib/leagues.js');
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('nothing remembered on a phone that has never had an answer', () => {
    expect(lib.cachedLeagues()).toBeNull();
  });
  it('an answer with a league in it is remembered, with the member flag', async () => {
    answer = { data: league, error: null };
    expect(await lib.getMyLeagues()).toEqual(league);
    expect(lib.cachedLeagues()).toEqual(league);
    expect(lib.isLeagueMember()).toBe(true);
  });
  // 25 Nov 2026 (BALL-IQ-3Y): the member flag outlives a sign-out, and Home
  // asked get_my_leagues as nobody on every visit ("permission denied").
  it('a phone with no session does not ask the server, and forgets nothing', async () => {
    answer = { data: league, error: null }; await lib.getMyLeagues();
    session = null; asked = 0;
    try {
      expect(await lib.getMyLeagues()).toBeNull();
      expect(asked).toBe(0);
      expect(lib.cachedLeagues()).toEqual(league);
      expect(lib.isLeagueMember()).toBe(true);
    } finally { session = { user: { id: 'u1' } }; }
  });
  it('a failed fetch forgets nothing: an offline member keeps the card', async () => {
    answer = { data: league, error: null }; await lib.getMyLeagues();
    answer = { data: null, error: { message: 'Failed to fetch' } };
    expect(await lib.getMyLeagues()).toBeNull();
    expect(lib.cachedLeagues()).toEqual(league);
    expect(lib.isLeagueMember()).toBe(true);
  });
  it('an empty answer forgets it, flag and all: the last league was left', async () => {
    answer = { data: league, error: null }; await lib.getMyLeagues();
    answer = { data: [], error: null };
    expect(await lib.getMyLeagues()).toEqual([]);
    expect(lib.cachedLeagues()).toBeNull();
    expect(lib.isLeagueMember()).toBe(false);
  });
  // 18 Nov 2026, the recording of build 182: the row vanished for a moment after
  // Create, and the old card stood on Home for a moment after Leave.
  it('a league just made is remembered at once, as a league of one', async () => {
    answer = { data: { id: 'l9', code: '9Y6GDPMF', name: "Mates' league" }, error: null };
    await lib.createLeague({ name: "Mates' league", displayName: 'Alex' });
    expect(lib.cachedLeagues()).toEqual([{ id: 'l9', code: '9Y6GDPMF', name: "Mates' league", members: 1, is_final: false }]);
    expect(lib.isLeagueMember()).toBe(true);
  });
  it('a league just made goes in front of the ones already remembered, once', async () => {
    answer = { data: league, error: null }; await lib.getMyLeagues();
    answer = { data: { id: 'l9', code: '9Y6GDPMF', name: 'Second' }, error: null };
    await lib.createLeague({ name: 'Second', displayName: 'Alex' });
    await lib.createLeague({ name: 'Second', displayName: 'Alex' });
    expect(lib.cachedLeagues().map((x) => x.id)).toEqual(['l9', 'l1']);
  });
  it('a failed create remembers nothing', async () => {
    answer = { data: null, error: { message: 'nope' } };
    await lib.createLeague({ name: 'X', displayName: 'Alex' });
    expect(lib.cachedLeagues()).toBeNull();
    expect(lib.isLeagueMember()).toBe(false);
  });
  it('leaving the only league forgets it and the member flag at once', async () => {
    answer = { data: league, error: null }; await lib.getMyLeagues();
    answer = { data: true, error: null };
    expect(await lib.leaveLeague('l1')).toBe(true);
    expect(lib.cachedLeagues()).toBeNull();
    expect(lib.isLeagueMember()).toBe(false);
  });
  it('leaving one of two keeps the other, and a failed leave keeps both', async () => {
    const two = [...league, { id: 'l2', code: 'ABCDEFGH', name: 'Work', members: 4 }];
    answer = { data: two, error: null }; await lib.getMyLeagues();
    answer = { data: null, error: { message: 'down' } };
    expect(await lib.leaveLeague('l1')).toBe(false);
    expect(lib.cachedLeagues().length).toBe(2);
    answer = { data: true, error: null };
    expect(await lib.leaveLeague('l1')).toBe(true);
    expect(lib.cachedLeagues().map((x) => x.id)).toEqual(['l2']);
    expect(lib.isLeagueMember()).toBe(true);
  });
  it('rubbish in storage reads as nothing remembered', () => {
    localStorage.setItem('biq_league_home', '{not json');
    expect(lib.cachedLeagues()).toBeNull();
    localStorage.setItem('biq_league_home', '[]');
    expect(lib.cachedLeagues()).toBeNull();
    localStorage.setItem('biq_league_home', '"x"');
    expect(lib.cachedLeagues()).toBeNull();
  });
  it('an explicit sign-out clears it: one account\'s league never shows for the next', async () => {
    const { readFileSync } = await import('node:fs');
    const auth = readFileSync(new URL('../../src/useAuth.jsx', import.meta.url), 'utf8');
    const keys = auth.slice(auth.indexOf('const USER_SCOPED_STATIC_KEYS = ['), auth.indexOf('const USER_SCOPED_PREFIXES'));
    expect(keys).toContain("'biq_league_home'");
  });
});
