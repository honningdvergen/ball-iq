// 17 Nov 2026, Alex's recording of build 181: the league row arrived on Home a
// second after the rest and pushed the rows under it down. For a member the
// card now draws the last answer this phone had, at once, and the network
// corrects it. These pin what is remembered and when it is forgotten.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let answer;
vi.mock('../../src/supabase.js', () => ({ supabase: { rpc: async () => answer } }));

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
