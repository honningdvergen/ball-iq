// Pure predicates about a multiplayer room's lifecycle.
//
// Lives here rather than inside OnlineMultiplayer.jsx so it can be tested
// without dragging App.jsx (and Supabase) into a unit test — the screen imports
// a large slice of the monolith at module load, and this logic depends on none
// of it.

/**
 * Did a match actually happen in this room?
 *
 * ⚠️ `state === 'ended'` DOES NOT MEAN A GAME WAS PLAYED. `leave_room` sets
 * state='ended' when the HOST leaves a lobby, and again when the last player
 * leaves — neither asks a single question. Treating 'ended' as "a match
 * finished" is what showed an invited stranger confetti, a gold trophy,
 * "You won!", "+50 XP earned" and a final score of 0 on the same screen, then
 * asked them to share it — while writing a phantom W into their head-to-head
 * record and a scores row for a game nobody played.
 *
 * `start_game` is the ONLY writer of started_at (see
 * supabase/prod-snapshot/functions.sql), so its absence is authoritative. The
 * remaining clauses are belt-and-braces for a realtime UPDATE payload that
 * arrives without every column: current_question is 0 at kick-off and only
 * start_next_round ever increments it, and nobody scores in a room that never
 * ran.
 *
 * Note it must stay true for a genuine 0-0 finish, which is why "did anyone
 * score?" cannot be the primary test.
 */
export function gameEverStarted(room, players) {
  if (!room) return false;
  if (room.started_at) return true;
  if ((room.current_question ?? 0) > 0) return true;
  return (players || []).some((p) => (p.score || 0) > 0);
}
