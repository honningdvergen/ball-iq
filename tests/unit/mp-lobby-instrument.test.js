import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MP = readFileSync(fileURLToPath(new URL('../../src/screens/OnlineMultiplayer.jsx', import.meta.url)), 'utf8');

/**
 * THE LOBBY IS WHERE MULTIPLAYER DIES, AND IT HAD NO INSTRUMENT.
 *
 * Read 2026-09-04 over 7 days of game_rooms: 68 rooms, 41 started, 27 not.
 * All 27 are state='ended' — none is a room still waiting — and 13 of them
 * hold ZERO room_players rows. create_room inserts the host's row in the same
 * transaction, so those are hosts who opened a lobby and left before anyone
 * arrived: 48% of the failures.
 *
 * The rows cannot say whether they tried to invite anyone. Nothing in this
 * file reported anything except the rival prompt, so the question was
 * unanswerable. These guards pin the three events and, more importantly, the
 * ORDER: the leave event has to be emitted before leave() ends the room and
 * onExit unmounts the component.
 */
describe('the multiplayer lobby reports its own funnel', () => {
  it('emits lobby-open once, on entering a lobby', () => {
    expect(MP).toMatch(/loopEvent\('mp-lobby-open'/);
    expect(MP).toMatch(/lobbyOpenSentRef\.current = true;/);
  });

  it('emits lobby-left BEFORE the room is ended and the screen unmounts', () => {
    const start = MP.indexOf('const handleLeave = useCallback');
    expect(start).toBeGreaterThan(-1);
    const block = MP.slice(start, MP.indexOf('const handleCopy', start));
    const evt = block.indexOf("loopEvent('mp-lobby-left'");
    const leave = block.indexOf('actions.leave()');
    const exit = block.indexOf('onExit()');
    expect(evt).toBeGreaterThan(-1);
    expect(evt).toBeLessThan(leave);
    expect(evt).toBeLessThan(exit);
    // The three fields the read needs: who, how many were there, did they try.
    expect(block).toMatch(/host:/);
    expect(block).toMatch(/players:/);
    expect(block).toMatch(/invited: invitedRef\.current/);
    expect(block).toMatch(/secs:/);
  });

  it('counts BOTH invite routes — the share sheet and the code', () => {
    // A host who read the code out to someone in the room still tried.
    const shares = MP.match(/loopEvent\('mp-invite-shared'/g) || [];
    expect(shares.length).toBe(2);
    const flags = MP.match(/invitedRef\.current = true;/g) || [];
    expect(flags.length).toBe(2);
  });

  it('only the LOBBY leave is instrumented, not the in-game one', () => {
    // MultiplayerGameplay has its own handleLeave; leaving a game in progress
    // is a different event and must not inflate the lobby funnel.
    const all = MP.match(/loopEvent\('mp-lobby-left'/g) || [];
    expect(all.length).toBe(1);
  });
});
