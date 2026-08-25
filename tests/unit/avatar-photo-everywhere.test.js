import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const PROFILE = read('../../src/screens/ProfileScreen.jsx');
const PIC = read('../../src/components/ProfilePic.jsx');
const HOME = read('../../src/screens/HomeScreen.jsx');

/**
 * A PLAYER'S PHOTO MUST FOLLOW THEM.
 *
 * Reported by Alex from a real device: Johannes showed his own photo in the
 * friends list and a default "J" monogram in the friends leaderboard — the two
 * lists sitting on the SAME screen, six rows apart. Alex's own row showed "A"
 * for the same reason.
 *
 * The query beside them already selected `photo:avatar_url`. Both leaderboard
 * row constructors simply left the field out, so `row.photo` was undefined and
 * every consumer fell back to the monogram. The render was innocent; the data
 * shape was wrong — which is why reading the JSX would never have found it.
 */
describe('a chosen photo follows the player', () => {
  it('carries photo into BOTH leaderboard row constructors', () => {
    // The friend rows...
    expect(PROFILE).toMatch(/username: other\.username, avatar: other\.avatar, photo: other\.photo/);
    // ...and the "me" row, which had the identical omission. Fixing one and
    // shipping is the habit this project keeps paying for.
    expect(PROFILE).toMatch(/avatar: currentUserAvatar, photo: currentUserPhoto/);
    expect(PROFILE).toMatch(/currentUserPhoto=\{authProfile\?\.avatar_url/);
  });

  it('falls back to the monogram when a photo URL is dead', () => {
    // ⚠️ It used to set visibility:hidden and stop, rendering an EMPTY circle —
    // no initial, no colour, no clue. A 404, an expired signed URL or a flaky
    // network turned an avatar into a hole. Falling back to the shared ball
    // would be wrong; falling back to this person's own monogram is right.
    expect(PIC).toMatch(/onError=\{\(\) => setBroken\(true\)\}/);
    expect(PIC).toMatch(/if \(url && !broken\)/);
    expect(PIC).not.toMatch(/visibility = "hidden"/);
    // A new URL must get a fresh attempt, or one bad photo poisons the slot
    // for whoever is rendered there next.
    expect(PIC).toMatch(/useEffect\(\(\) => \{ setBroken\(false\); \}, \[url\]\)/);
  });

  it('renders every avatar through the one component', () => {
    // HomeScreen's rail hand-rolled a third implementation: a raw <img> whose
    // own error handler hid the element and left a hole.
    expect(HOME).not.toMatch(/<img src=\{authProfile\.avatar_url\}/);
    expect(HOME).toMatch(/<ProfilePic value=\{authProfile\?\.avatar_id \|\| profile\?\.avatar\} url=\{authProfile\?\.avatar_url\}/);
  });
});
