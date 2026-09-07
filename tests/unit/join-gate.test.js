import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const APP = read('../../src/App.jsx');
const RPC = read('../../src/multiplayerRpc.js');
const MIG = read('../../supabase/migrations/v1_9_room_lookup.sql');

/** Review 2026-09-06, A1: a typed / linked invite code is checked before it is promised, and never re-prompts over a live game. */
describe('join gate', () => {
  it('validates a typed code with room_lookup before persisting it', () => {
    expect(RPC).toMatch(/export async function mpLookupRoom/);
    expect(RPC).toMatch(/room_lookup:\s*\{ attempts/);
    const guest = APP.slice(APP.indexOf('const hubJoinRoom'), APP.indexOf('const trimmed = String(rawCode'));
    expect(guest).toMatch(/await mpLookupRoom\(code\)/);
    expect(guest.indexOf('mpLookupRoom')).toBeLessThan(guest.indexOf('localStorage.setItem("biq_pending_join"'));
    expect(guest).toMatch(/No room with that code/);
  });
  it('never opens the gate over a live game, and drops a dead stored code on boot', () => {
    // ⚠️ These pinned `!inGame` until 2026-09-07, and `inGame` is only
    // ["quiz","local-game","local-results"] -- so the assertions codified the
    // very bug the test is named for: the gate could open over a live Footle,
    // Trail, Mystery or Stadiums round. `playing` is the value that covers all
    // seven, and both the render guard and the a11y hook must use it, because
    // those two had already drifted apart (the hook was widened first).
    expect(APP).toMatch(/\{pendingJoinCode && \(!user \|\| isGuest\) && !playing && \(/);
    expect(APP).toMatch(/isOpen: !!\(pendingJoinCode && \(!user \|\| isGuest\) && !playing\)/);
    expect(APP, 'playing must cover the four standalone games')
      .toMatch(/const playing = inGame \|\| \["wordle","trail","mystery","stadiums"\]\.includes\(screen\);/);
    expect(APP).toMatch(/loopEvent\("join-token-dead"/);
  });
  it('the RPC is anon-callable and follows the house rules', () => {
    expect(MIG).toMatch(/security definer/);
    expect(MIG).toMatch(/revoke all on function public\.room_lookup\(text\) from public/);
    expect(MIG).toMatch(/grant execute on function public\.room_lookup\(text\) to anon, authenticated/);
  });
  it('the guest primary is drawn, not an emoji', () => {
    expect(APP).not.toMatch(/⚡ Play as guest/);
  });
});
