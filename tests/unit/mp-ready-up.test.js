import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The multiplayer loop must not dead-end at the final whistle.
 *
 * ⚠️ MEASURED IN PROD 2026-08-24: 136 rooms, every one state='ended', and
 * `rematch_code` NULL on all of them — not a single rematch had ever completed,
 * across 90 rooms that held 2+ real players in ten days. The old Rematch button
 * minted a BRAND NEW room, stood the tapper in it alone, and left everyone else
 * to be retrieved by a push notification.
 *
 * Alex: *"we need some type of logic where people do not automatically leave
 * the lobby when game ends."* So the room stops dissolving — players stay put,
 * ready up, and the SAME room resets.
 *
 * The three things below are the ones whose breakage would be silent.
 */

const MP = readFileSync(fileURLToPath(new URL('../../src/screens/OnlineMultiplayer.jsx', import.meta.url)), 'utf8');
const RPC = readFileSync(fileURLToPath(new URL('../../src/multiplayerRpc.js', import.meta.url)), 'utf8');
const SQL = readFileSync(fileURLToPath(new URL('../../supabase/migrations/v1_7_mp_ready_up.sql', import.meta.url)), 'utf8');

/** The end-of-game component only. */
function lobbyEnded() {
  const i = MP.indexOf('function LobbyEnded(');
  expect(i, 'LobbyEnded has moved or been renamed').toBeGreaterThan(-1);
  const j = MP.indexOf('\nfunction ', i + 10);
  return MP.slice(i, j > -1 ? j : MP.length);
}

describe('the room survives the final whistle', () => {
  it('the client can call both new RPCs', () => {
    expect(RPC).toMatch(/export async function mpSetPlayerReady/);
    expect(RPC).toMatch(/export async function mpStartNextRound/);
    expect(RPC).toMatch(/withRetry\('set_player_ready'/);
    expect(RPC).toMatch(/withRetry\('start_next_round'/);
    expect(MP, 'the end screen must import them').toMatch(/mpSetPlayerReady, mpStartNextRound/);
  });

  it('ready state is read from the room, never mirrored locally', () => {
    // ⚠️ THE BUG THIS PREVENTS. useMultiplayerRoom already subscribes to
    // postgres_changes on room_players with select('*'), so `ready` arrives
    // live and identical on every device. A local mirror gives each client its
    // own slightly-wrong copy — exactly the class of drift that had two players
    // tap Rematch and land in rival rooms.
    const body = lobbyEnded();
    expect(body, 'ready must come from myPlayer').toMatch(/const iAmReady = !!myPlayer\?\.ready/);
    expect(body, 'the tally must be derived from players').toMatch(/players \|\| \[\]\)\.filter\(p => p\.ready\)/);
    expect(body, 'no local ready state').not.toMatch(/useState\([^)]*\)\s*;?\s*\/\/\s*ready\b/);
    expect(body).not.toMatch(/const \[(iAmReady|ready|readyState), set/);
  });

  it('starting does not navigate this client ahead of the others', () => {
    // The room flips to 'playing' and the game_rooms subscription moves EVERY
    // device down the same path the first start uses. Pushing this one client
    // forward manually is how a player ends up a question ahead.
    const body = lobbyEnded();
    const fn = body.slice(body.indexOf('const startNextRound'), body.indexOf('const startNextRound') + 2400);
    expect(fn).toMatch(/res\?\.started/);
    expect(fn, 'must not route on success — realtime does it').not.toMatch(/onRematch\?\.\(|setScreen|onExit\(\)/);
  });

  it('every refusal reason has its own message', () => {
    // "Waiting for one more player" and "only the host can start" are different
    // problems. A generic failure sends the player tapping the same dead button.
    const body = lobbyEnded();
    for (const reason of ['need_two_ready', 'starter_not_ready', 'not_host', 'not_ended']) {
      expect(body, `${reason} needs its own copy`).toMatch(new RegExp(reason));
    }
    // ...and the server can actually return each of them.
    for (const reason of ['need_two_ready', 'starter_not_ready', 'not_host', 'not_ended']) {
      expect(SQL, `server never returns ${reason}`).toMatch(new RegExp(`'${reason}'`));
    }
  });

  it('the player is warned that not readying drops them', () => {
    // start_next_round DELETEs non-ready players. Finding that out by
    // disappearing from the room is not acceptable.
    expect(SQL).toMatch(/delete from public\.room_players where room_id = v_room\.id and not ready/);
    expect(lobbyEnded(), 'the screen must say so before it happens')
      .toMatch(/not ready will sit this one out/i);
  });

  it('the client host rule matches the server escape hatch', () => {
    // Server: host-only WHILE the host is present; if the host left, anyone may
    // start. If the client disagreed it would either hide a working button or
    // show one that always fails.
    expect(SQL).toMatch(/if v_host_present and v_room\.host_id <> v_uid then/);
    expect(lobbyEnded()).toMatch(/const iCanStart = iAmHost \|\| !hostPresent/);
  });

  it('claim_rematch survives as the someone-actually-left path', () => {
    // Deliberately kept, deliberately demoted. Deleting it would strand a room
    // whose players really did leave.
    expect(MP).toMatch(/mpClaimRematch/);
    expect(lobbyEnded()).toMatch(/Someone left — start a new room/);
  });
});
