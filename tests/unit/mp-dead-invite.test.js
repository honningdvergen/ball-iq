import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MP = readFileSync(fileURLToPath(new URL('../../src/screens/OnlineMultiplayer.jsx', import.meta.url)), 'utf8');
const HOOK = readFileSync(fileURLToPath(new URL('../../src/useMultiplayerRoom.js', import.meta.url)), 'utf8');

/**
 * AN INVITE THAT OUTLIVES ITS ROOM IS THE NORMAL CASE, NOT AN EDGE ONE.
 *
 * Measured 2026-09-04: in seven days, 13 rooms were opened by a host who left
 * before anyone arrived, and 12 of the 33 anonymous guests who never played
 * anything had joined a room that never started. The initial select filters
 * state='ended', so a guest tapping a stale link got "⚠️ Couldn't load room"
 * and a "Try again" that can never succeed — a wall, for the person the room
 * funnel exists to convert.
 *
 * These pin the two halves: the hook must SAY which failure it is, and the
 * view must not offer a retry that cannot work.
 */
describe('a dead invite link is a door, not a wall', () => {
  it('the hook distinguishes a gone room from a fetch failure', () => {
    expect(HOOK).toMatch(/errorKind/);
    // The one branch that means "this room does not exist any more".
    const start = HOOK.indexOf("setError('Room not found')");
    expect(start).toBeGreaterThan(-1);
    expect(HOOK.slice(start, start + 120)).toMatch(/setErrorKind\('gone'\)/);
    // And it is returned, or the view cannot act on it.
    expect(HOOK).toMatch(/\n\s*errorKind,\n/);
  });

  it('never offers Try again on a room that is gone', () => {
    const start = MP.indexOf('function LobbyError');
    const block = MP.slice(start, MP.indexOf('\n}', MP.indexOf('return (', start)));
    expect(block).toMatch(/const gone = kind === 'gone'/);
    expect(block).toMatch(/const retryable = !!onRetry && !gone/);
  });

  it('offers the daily as the primary way out, and says it plainly', () => {
    const start = MP.indexOf('function LobbyError');
    const block = MP.slice(start, start + 4000);
    expect(block).toMatch(/That room has closed/);
    expect(block).toMatch(/gone && onPlayDaily/);
    // Not a warning triangle: nothing here is the visitor's fault.
    expect(block).toMatch(/gone \? "\\u\{1F44B\}" : "⚠️"/);
  });

  it('counts how often an invite outlives its room', () => {
    expect(MP).toMatch(/loopEvent\('mp-join-dead'/);
  });

  it('passes the kind and the door down from the lobby', () => {
    expect(MP).toMatch(/<LobbyError error=\{error\} kind=\{errorKind\}[^>]*onPlayDaily=\{onPlayDaily\}/);
  });
});
