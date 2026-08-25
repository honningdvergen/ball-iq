import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Tier 2 of the 1.7.0 design review, pinned as it lands.
 *
 * ⚠️ THE HEADER WAS NEVER UNMOUNTING. The review's single "critical" finding
 * said answering a question unmounts the quiz header. It does not — .q-top is
 * rendered unconditionally. What removed it was the deliberate
 * scrollIntoView({block:'center'}) that fires when `answered` flips, which
 * exists so the explanation panel does not land under the sticky CTA and which
 * carries documented e2e consequences. Centring moves the page much further
 * than revealing the panel needs, so the chrome left the viewport even when
 * there was room to keep it.
 *
 * A sticky .q-top was tried first and did not pin on device. Rather than ship
 * CSS that could not be proved, the scroll itself was made minimal.
 */

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const CSS = read('../../src/app.css');
const APP = read('../../src/App.jsx');
const HOME = read('../../src/screens/HomeScreen.jsx');

describe('design review — tier 2', () => {
  it('the answer reveal scrolls the minimum, not to centre', () => {
    expect(APP, 'centring is what pushed the header off-screen')
      .not.toMatch(/scrollIntoView\(\{ block: 'center'/);
    expect(APP).toMatch(/const overshoot = el\.getBoundingClientRect\(\)\.bottom/);
    // The inset is why `nearest`/`end` were wrong: both put the panel back
    // under the CTA that sits on the viewport bottom.
    expect(APP).toMatch(/const CTA_INSET = 96;/);
    expect(APP, 'no scroll at all when the panel already fits')
      .toMatch(/if \(overshoot > 0\) window\.scrollBy/);
  });

  it('the brand colour reaches primary navigation', () => {
    expect(CSS).toMatch(/\.tab-item\.active \.tab-svg\{color:var\(--accent\)/);
    // ⚠️ The ICON, not the capsule. .tab-pill was tuned against Threads over
    // several rounds; repainting it green would undo that material.
    expect(CSS, 'the capsule stays neutral — it was tuned against Threads')
      .toMatch(/background:rgba\(255,255,255,0\.11\);display:block;/);
  });

  it('the quiz Next button is the same component as Play', () => {
    // ⚠️ It was a second primary button: 14px radius against the pill's 999px,
    // a BLACK drop shadow instead of the green glow, #0A0A0A ink instead of
    // #06230C, and an opacity-only press. The most-tapped button in the app
    // looked least like the app.
    const i = CSS.indexOf('.next-btn-primary{');
    const rule = CSS.slice(i, CSS.indexOf('}', i));
    expect(rule).toMatch(/border-radius:999px/);
    expect(rule).toMatch(/box-shadow:0 8px 22px -8px rgba\(88,204,2,0\.55\)/);
    expect(rule).toMatch(/color:#06230C/);
    expect(CSS).toMatch(/\.next-btn-primary:active\{transform:scale\(0\.97\)/);
    expect(CSS, 'the desktop variant carried the same rounded rect')
      .not.toMatch(/\.qd-play \.next-btn-primary \{[^}]*border-radius: 14px/);
  });

  it('only modes that own a colour are tinted in the grid', () => {
    // ⚠️ NOT a blanket per-mode tint. HomeScreen already records the decision
    // that the grid is neutral by default — nine green icons made it nine
    // competing accents — with an iconColor opt-in "when a tile has earned a
    // colour of its own". Trail and Mystery own theirs from Daily's MODE_THEME.
    expect(HOME).toMatch(/key:"trail", Icon: Route, iconColor: "#7CC3F0"/);
    expect(HOME).toMatch(/iconColor: "#B9A5FF"/);
    const tints = HOME.match(/iconColor: "#/g) || [];
    expect(tints, 'the long tail must stay quiet').toHaveLength(2);
  });
});
