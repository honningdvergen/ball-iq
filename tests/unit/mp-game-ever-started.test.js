import { describe, it, expect } from 'vitest';
import { gameEverStarted } from '../../src/lib/mpRoom.js';

/**
 * ⚠️ 'ended' DOES NOT MEAN A MATCH HAPPENED.
 *
 * `leave_room` sets state='ended' when the HOST leaves a lobby, and again when
 * the last player leaves — neither asks a single question. Every consumer of
 * the ended state used to assume a game had been played, so an invited stranger
 * whose mate wandered off before kick-off was shown confetti, a gold trophy,
 * "You won!", "+50 XP earned" and a final score of 0 on the same screen, then
 * asked to share it. It also wrote a phantom W into their head-to-head record
 * and a scores row for a game nobody played — repeatably, once per abandoned
 * lobby.
 *
 * `start_game` is the ONLY writer of started_at (prod-snapshot/functions.sql),
 * which makes its absence authoritative. The other two clauses exist because a
 * realtime UPDATE payload is not guaranteed to carry every column.
 */
describe('gameEverStarted', () => {
  it('is false for a lobby that ended before kick-off — the bug this exists for', () => {
    const room = { state: 'ended', started_at: null, current_question: 0 };
    const players = [{ user_id: 'a', score: 0 }, { user_id: 'b', score: 0 }];
    expect(gameEverStarted(room, players)).toBe(false);
  });

  it('is true once start_game has stamped started_at', () => {
    expect(gameEverStarted({ state: 'playing', started_at: '2026-09-01T22:00:00Z' }, [])).toBe(true);
  });

  it('is true for a real 0-0 finish — nobody scored, but it was played', () => {
    // The case a naive "did anyone score?" check would get wrong.
    const room = { state: 'ended', started_at: '2026-09-01T22:00:00Z', current_question: 7 };
    const players = [{ user_id: 'a', score: 0 }, { user_id: 'b', score: 0 }];
    expect(gameEverStarted(room, players)).toBe(true);
  });

  it('falls back to current_question if a realtime payload omits started_at', () => {
    // current_question is 0 at kick-off and only start_next_round increments it.
    expect(gameEverStarted({ state: 'ended', current_question: 3 }, [])).toBe(true);
    expect(gameEverStarted({ state: 'ended', current_question: 0 }, [])).toBe(false);
  });

  it('falls back to a non-zero score — nobody scores in a room that never ran', () => {
    expect(gameEverStarted({ state: 'ended' }, [{ user_id: 'a', score: 4 }])).toBe(true);
  });

  it('is false for a null room and tolerates a missing player list', () => {
    expect(gameEverStarted(null, null)).toBe(false);
    expect(gameEverStarted({ state: 'ended' }, undefined)).toBe(false);
  });
});
