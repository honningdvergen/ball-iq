// 23 Nov 2026, the silent-loss audit. Three ways the sign-in merge between a
// phone and the account could throw a player's progress away without a word.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { localBoardLeads, mergeWordleRecords } from '../../src/lib/wordleStatus.js';

const auth = readFileSync(new URL('../../src/useAuth.jsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');

describe('a Footle solved after the connection dropped is not replaced by the older server copy', () => {
  const server = { guesses: ['MESSI', 'SILVA', 'KROOS'], status: 'playing' };
  const phone = { guesses: ['MESSI', 'SILVA', 'KROOS', 'PEDRI', 'MODRIC'], status: 'won', answer: 'MODRIC' };
  it('the phone leads when it is the same board further along', () => {
    expect(localBoardLeads(phone, server)).toBe(true);
    expect(localBoardLeads({ guesses: ['MESSI', 'SILVA', 'KROOS', 'PEDRI'], status: 'playing' }, server)).toBe(true);
    expect(localBoardLeads({ ...phone, status: 'lost' }, server)).toBe(true);
  });
  it('the merge keeps it', () => {
    expect(mergeWordleRecords({ '2026-11-23': phone }, { '2026-11-23': server })['2026-11-23']).toEqual(phone);
  });
  it('a finished server day stands, and so does a different board', () => {
    expect(localBoardLeads(phone, { ...server, status: 'won' })).toBe(false);
    expect(localBoardLeads(phone, { guesses: ['PIRLO', 'SILVA', 'KROOS'], status: 'playing' })).toBe(false);   // another device's own attempt
    expect(localBoardLeads({ guesses: ['MESSI'], status: 'playing' }, server)).toBe(false);                     // the phone is behind
    expect(localBoardLeads(server, server)).toBe(false);
    expect(localBoardLeads(null, server)).toBe(false);
    expect(localBoardLeads(phone, null)).toBe(false);
    expect(localBoardLeads({ status: 'won' }, server)).toBe(false);
  });
  it('the merge is otherwise as it was: remote wins and borrows the local answer and archive stamps', () => {
    const local = { a: { guesses: ['X'], status: 'won', answer: 'X', arc: 1 }, b: { guesses: ['Q'], status: 'playing' } };
    const remote = { a: { guesses: ['X'], status: 'won' }, c: { guesses: [], status: 'playing' } };
    const out = mergeWordleRecords(local, remote);
    expect(out.a).toEqual({ guesses: ['X'], status: 'won', answer: 'X', arc: 1 });
    expect(out.b).toEqual(local.b);
    expect(out.c).toEqual(remote.c);
  });
  it('and it is sent up: leading days join the back-sync', () => {
    expect(auth).toContain("filter(d => !(d in remoteWordleState) || localBoardLeads(localWordleState[d], remoteWordleState[d]))");
  });
});

describe("a phone that never read the account does not overwrite the account's totals", () => {
  it('both absolute writers ask first', () => {
    expect(app).toContain("const { error: updErr } = !statsHydratedFor(user.id) ? { error: null } : await supabase.from('profiles').update({");
    const daily = app.slice(app.indexOf('// Absolutes: only once this phone'), app.indexOf('[daily stats]'));
    expect(daily).toContain('if (!statsHydratedFor(user.id)) return;');
    // and there is no third absolute writer of the totals
    expect((app.match(/from\('profiles'\)\.update\(\{\s*games_played/g) || []).length).toBe(2);
  });
  it('the marker is set only after the max-merge is written, and cleared at sign-out', () => {
    const set = auth.indexOf('_statsHydratedUserId = userId');
    expect(set).toBeGreaterThan(auth.indexOf("safeSetItem('biq_stats', JSON.stringify(finalStats))"));
    expect(auth).toMatch(/activeUserIdRef\.current = null\n\s*_statsHydratedUserId = null/);
    expect(auth).toContain('export function statsHydratedFor(userId) { return !!userId && _statsHydratedUserId === userId }');
  });
  it('a failed profile read is reported and tried again, twice', () => {
    expect(auth).toContain("Sentry.captureException(profileError, { tags: { area: 'load-profile' } })");
    expect(auth).toContain('retryLoadProfile(userId, userObj, attempt)');
    expect(auth).toContain('if (attempt >= 2) return');
    expect(auth).toContain('if (activeUserIdRef.current === userId) loadProfile(userId, userObj, attempt + 1)');
  });
});

describe('a failed game-state read is not an empty account', () => {
  it('the days are not merged or sent up, and the streak credit does not start', () => {
    expect(auth).toContain('_gameStateUnread: !!gameStateError,');
    const skip = auth.indexOf('if (remoteProfile._gameStateUnread) {');
    expect(skip).toBeGreaterThan(auth.indexOf('_statsHydratedUserId = userId'));   // totals are still merged
    expect(skip).toBeLessThan(auth.indexOf("rpc('upsert_daily_score'"));
    expect(skip).toBeLessThan(auth.indexOf("rpc('upsert_wordle_state'"));
    expect(auth.slice(skip, skip + 400)).toContain('partial: true');
    expect(app).toContain('if (!detail.partial) setHydratedStreak(');
  });
  it('sync failures are reported, not just logged', () => {
    for (const area of ['load-game-state', 'hydrate', 'hydrate-xp', 'hydrate-score', 'hydrate-back-sync']) expect(auth).toContain(`area: '${area}'`);
    expect((auth.match(/area: 'hydrate-back-sync'/g) || []).length).toBe(4);
  });
});
