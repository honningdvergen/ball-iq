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
import { friendableOpponents } from '../../src/screens/OnlineMultiplayer.jsx';

describe('the multiplayer game-over screen asks for an account once', () => {
  it('the two asks are mutually exclusive, by ONE shared predicate', () => {
    // The generic ask renders only when the specific one could not.
    expect(MP).toMatch(/\{isAnonUser && !friendAskShown && \(/);
    expect(MP).toMatch(/const friendAskShown = !!\(isAnonUser && myUserId/);

    // ⚠️ THIS ASSERTION USED TO REQUIRE THE DUPLICATION IT WAS GUARDING.
    // It demanded the opponents filter appear at least TWICE — once in
    // AddFriendRow, once in the flag — because that was how exclusivity was
    // achieved on 2026-09-07: two copies of one condition 660 lines apart, kept
    // in agreement by a comment saying they "cannot drift". A comment is not a
    // mechanism, and a test that pins the copy in place makes removing it look
    // like a regression. Both callers now call friendableOpponents, so they
    // cannot disagree rather than being asked not to.
    const definition = /export function friendableOpponents/;
    expect(MP, 'the shared predicate must exist').toMatch(definition);
    const withoutDefinition = MP.replace(/export function friendableOpponents[\s\S]*?\n\}/, '');
    const inlineCopies = withoutDefinition.match(/filter\(p => p\.user_id && p\.user_id !== myUserId\)/g) || [];
    expect(inlineCopies.length, 'the filter was re-inlined — both asks must call friendableOpponents').toBe(0);
    expect(MP).toMatch(/&& friendableOpponents\(players, myUserId\)\.length > 0\)/);
    expect(MP).toMatch(/\(\) => friendableOpponents\(players, myUserId\)/);
  });

  // The behaviour that predicate has to get right, since exclusivity is only as
  // good as the condition both sides read.
  describe('who counts as someone worth adding as a friend', () => {
    const me = 'me';
    const cases = [
      ['nobody else in the room',       [], false],
      ['only me',                       [{ user_id: me }], false],
      ['other players are all guests',  [{ user_id: me }, { user_id: null }, {}], false],
      ['one real opponent',             [{ user_id: 'a' }], true],
      ['me plus a real opponent',       [{ user_id: me }, { user_id: 'a' }], true],
    ];
    for (const [name, players, expected] of cases) {
      it(`${name} -> specific ask ${expected ? 'IS' : 'is NOT'} available`, () => {
        expect(friendableOpponents(players, me).length > 0).toBe(expected);
      });
    }
    it('a missing players array does not throw mid-render', () => {
      expect(friendableOpponents(undefined, me)).toEqual([]);
      expect(friendableOpponents(null, me)).toEqual([]);
    });
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
