// Mystery Player's photo path and XP rule, as the play screen and finish use
// them (26 Nov 2026). The shipped reviewed list is EMPTY (R15), so the photo
// path is proved here on a TEST-ONLY fixture, never in the bundle.
import { describe, it, expect } from 'vitest';
import { photoView, LIST_PX, HERO_PX } from '../../src/lib/photoCrop.js';
import { mysteryXp, buildMysteryShareText } from '../../src/lib/mysteryPlayer.js';
import lean from '../../src/data/mysteryPhotoLean.json';
import reviewed from '../../src/data/mysteryPhotoReviewed.json';

const FIXTURE = {
  u: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Some_player.jpg', w: 2000, h: 3000,
  x: 0.25, y: 0.1, s: 0.5, hero: 960, list: 500, a: 'Someone', l: 'CC BY-SA 4.0', pg: 'https://commons.wikimedia.org/wiki/File:Some_player.jpg',
};

describe('photoView: what a round face draws', () => {
  // Until 27 Nov 2026 this pinned an EMPTY list ("ships with no photo for
  // anyone"). The owner's first approvals arrived that day from his review
  // page, so the pin is now the rule itself: a photo ships for a player only
  // if the owner approved it, every shipped entry carries who approved it and
  // when, and a player he has not approved still draws the shirt in a ring.
  it('ships a photo only for players the owner approved; everyone else is the shirt in a ring', () => {
    const approved = Object.keys(reviewed.ids);
    expect(Object.keys(lean).sort()).toEqual([...approved].sort());
    for (const id of approved) {
      expect(reviewed.ids[id].approvedBy, id).toBe('Alex');
      expect(reviewed.ids[id].approvedOn, id).toMatch(/^\d{4}-\d\d-\d\d$/);
      expect(photoView(lean[id], LIST_PX), id).not.toBe(null);
    }
    // An id that is on no list draws nothing.
    expect(photoView(lean.Q0, LIST_PX)).toBe(null);
  });
  it('a fixture entry draws the Commons thumbnail the size asks for, cropped on the head', () => {
    const v = photoView(FIXTURE, LIST_PX);
    expect(v.src).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Some_player.jpg/500px-Some_player.jpg');
    // 52 across = 0.5 of the width, so the picture is drawn 104 wide, shifted left by a quarter of that.
    expect(v.box).toEqual({ width: 104, height: 156, left: -26, top: -15.6 });
    expect(photoView(FIXTURE, HERO_PX).src).toContain('/960px-');
  });
  it('a size the picture cannot serve at three times its pixels draws no photo', () => {
    expect(photoView({ ...FIXTURE, hero: 0 }, HERO_PX)).toBe(null);
    expect(photoView({ ...FIXTURE, list: 0 }, LIST_PX)).toBe(null);
    expect(photoView(undefined, LIST_PX)).toBe(null);
  });
});

describe('the finish XP and share line', () => {
  it('is the app\'s rule of 17 Aug 2026: 50 within 5 guesses, 35 within 15, else 20; a give-up 0; hints do not change it', () => {
    expect([1, 5, 6, 15, 16, 40].map((n) => mysteryXp(true, n))).toEqual([50, 50, 35, 35, 20, 20]);
    expect(mysteryXp(false, 3)).toBe(0);
  });
  it('the share text says the hints when the screen hands them over, and is unchanged when it does not', () => {
    const g = [{ rank: 1, band: 'win' }, { rank: 40, band: 'hot' }];
    expect(buildMysteryShareText({ number: 113, guesses: g, won: true, hintWords: 'no hints' })).toContain('\nSolved in 2 guesses · no hints\n');
    expect(buildMysteryShareText({ number: 113, guesses: g, won: true })).toContain('\nSolved in 2 guesses\n');
    expect(buildMysteryShareText({ number: 113, guesses: g, won: false, hintWords: '1 hint' })).not.toContain('hint');
  });
});
