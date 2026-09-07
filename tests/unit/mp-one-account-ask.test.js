import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * ONE account ask per screen (review C11's class).
 *
 * The Daily 7 results screen was fixed on 2026-09-06. The multiplayer game-over
 * screen had the identical defect and escaped, because multiplayer was never
 * played during the review: an anonymous guest finished a game and was asked to
 * sign up twice, in two idioms, for the same action — "Save your account to add
 * them as a friend" directly above "Playing as a guest — save your stats".
 */
const MP = readFileSync(fileURLToPath(new URL('../../src/screens/OnlineMultiplayer.jsx', import.meta.url)), 'utf8');

describe('the multiplayer game-over screen asks for an account once', () => {
  it('the two asks are mutually exclusive, by a mirrored predicate', () => {
    // The generic ask renders only when the specific one could not.
    expect(MP).toMatch(/\{isAnonUser && !friendAskShown && \(/);
    // And the flag mirrors AddFriendRow's own filter, so they cannot drift.
    expect(MP).toMatch(/const friendAskShown = !!\(isAnonUser && myUserId/);
    expect(MP).toMatch(/players \|\| \[\]\)\.filter\(p => p\.user_id && p\.user_id !== myUserId\)\.length > 0\)/);
    const rowFilter = MP.match(/\(players \|\| \[\]\)\.filter\(p => p\.user_id && p\.user_id !== myUserId\)/g) || [];
    expect(rowFilter.length, 'the same filter appears in AddFriendRow and in the flag').toBeGreaterThanOrEqual(2);
  });

  it('a guest is never asked twice and never left unasked', () => {
    // Both branches exist: the specific ask, and the fallback for a room with
    // nobody else in it.
    expect(MP).toMatch(/Save your stats and add \{opponents\.length === 1/);
    expect(MP).toMatch(/Playing as a guest — save your stats with a free account/);
  });

  it('both asks use the upgrade prompt, which is the honest one for a guest', () => {
    // The upgrade keeps the same auth.uid(), so the game's score and XP really
    // do carry over. The specific ask used to call openAuthPrompt with no
    // argument, which promises nothing about the stats it just showed you.
    const specific = MP.slice(MP.indexOf('Save your stats and add') - 700, MP.indexOf('Save your stats and add'));
    expect(specific).toMatch(/openAuthPrompt\?\.\('upgrade'\)/);
  });

  it('no emoji stands in for an icon on this screen', () => {
    const code = MP.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    expect(code, 'the floppy disk on the guest ask is gone').not.toMatch(/💾/);
  });
});
