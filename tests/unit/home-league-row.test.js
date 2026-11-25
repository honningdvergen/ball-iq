// 25 Nov 2026. A member's league row on Home is the first row of the mates card, not a card of
// its own. Alex, on Home in build 188 as a league member: "And what happened to the space between
// mates league and multiplayer there? Looks a bit off no?"; to the drawing where the row joins
// the card: "Yes, like this". Phones only; league.css keeps the wide-screen card.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/app.css', import.meta.url), 'utf8');
const at = css.indexOf("/* A MEMBER'S LEAGUE ROW IS A ROW OF THE MATES CARD");
const block = css.slice(at, css.indexOf('/* THE SMALLEST PHONES GIVE THE WORDS THEIR MARGINS', at));

describe("a member's league row on Home", () => {
  it('is in the stylesheet, after the rules it overrides', () => {
    expect(at).toBeGreaterThan(css.indexOf('.home-mates > .lg-home,.home-mates > .lg-solo,.home-mates > .lg-home-wait{min-height:68px;}'));
    expect(block.length).toBeGreaterThan(400);
  });
  it('all three forms take the top of the plain card: no box, no gap, 68 high', () => {
    expect(block).toContain('.home-mates > .lg-home,.home-mates > .lg-solo,.home-mates > .lg-home-wait{background:var(--s1);border:0;box-shadow:none;border-radius:20px 20px 0 0;margin:0;padding:11px 14px;min-height:68px;}');
  });
  it('the row under them takes the bottom, behind a hairline, and keeps it on hover', () => {
    expect(block).toContain('.home-mates > .lg-home + .mp-row,.home-mates > .lg-solo + .mp-row,.home-mates > .lg-home-wait + .mp-row{border-radius:0 0 20px 20px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.07);}');
    expect(block).toMatch(/@media \(max-width: 1023px\) and \(hover: hover\)\{\s*\.home-mates > \.lg-home \+ \.mp-row:hover,[^{]*\{box-shadow:inset 0 1px 0 rgba\(255,255,255,0\.07\);\}/);
  });
  it('the well, the title and the grey line are every other row\'s', () => {
    expect(block).toContain('.home-mates .lg-home-ic{width:46px;height:46px;border-radius:13px;box-sizing:border-box;background:rgba(255,170,0,0.10);border:1px solid rgba(255,170,0,0.32);}');
    expect(block).toContain('.home-mates .lg-home-name{font-size:14px;font-weight:900;letter-spacing:-0.2px;line-height:1.1;height:1.1em;}');
    expect(block).toContain('.home-mates .lg-home-line{font-weight:500;}');
  });
  it('the invite is a soft pill 36 high to the eye and 44 to the thumb', () => {
    // quiet, as drawn (hk.css): no outline, a softer green, weight 700
    expect(block).toContain('.home-mates .lg-solo-invite{position:relative;min-height:0;height:36px;padding:0 14px;border:0;background:rgba(88,204,2,0.16);color:#8AE042;-webkit-text-fill-color:#8AE042;font-size:13.5px;font-weight:700;}');
    expect(block).toContain('.home-mates .lg-solo-invite::after{content:"";position:absolute;left:0;right:0;top:-4px;bottom:-4px;}');
    expect(block).toContain('@media (max-width: 359px){.home-mates .lg-solo-invite{padding:0 11px;font-size:12px;}}');
  });
  it("the arrow is the mates rows' own grey, in their column", () => {
    expect(block).toContain('.home-mates .lg-home-chev{color:#5E6270;-webkit-text-fill-color:#5E6270;margin:0 8px 0 -4px;}');
    expect(css).toContain('.mp-row-chev{display:grid;place-items:center;width:34px;flex:none;color:#5E6270;}');
  });
  it('only on phones', () => {
    for (const m of block.matchAll(/\n(\.home-mates[^{]*)\{/g)) throw new Error('a rule outside a media query: ' + m[1]);
  });
});
