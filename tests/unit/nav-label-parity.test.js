import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Three navigation surfaces point at the same four destinations:
 *
 *   src/App.jsx            the mobile tab bar (native + installed PWA)
 *   src/BiqNav.jsx         the desktop rail (>=1024, native + installed PWA)
 *   src/components/AppBar.jsx  the slim app bar under the site header, on the web
 *
 * BiqNav has carried a comment demanding label parity with the mobile bar since
 * it was written. AppBar was added later, on 2026-09-03, and never joined the
 * rule -- so when the third tab was renamed Daily -> History on 2026-09-06 the
 * rename landed in two files and missed the third. Web visitors then pressed a
 * button marked "Daily" and arrived on a page titled "History".
 *
 * A rename is cheap; noticing that a rename missed one of three files is not.
 * This holds them in step.
 *
 * AppBar's first slot is deliberately "Play" rather than "Home": on the web the
 * SITE header is the home, so "Home" there would name the wrong thing. That one
 * divergence is intentional and is pinned as such, so it cannot drift back by
 * accident either.
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const APP = read('../../src/App.jsx');
const RAIL = read('../../src/BiqNav.jsx');
const APPBAR = read('../../src/components/AppBar.jsx');

// The mobile tab bar is the source of truth: id -> label.
const mobileLabels = () => {
  const arr = APP.match(/\{ id:"home",[\s\S]*?\{ id:"profile",[^}]*\}/)?.[0] || '';
  const out = {};
  for (const m of arr.matchAll(/id:"(\w+)",\s*Icon: \w+,\s*label:"([^"]+)"/g)) out[m[1]] = m[2];
  return out;
};

describe('the three navs agree on what each tab is called', () => {
  it('the mobile tab bar names all four tabs', () => {
    const labels = mobileLabels();
    expect(Object.keys(labels).sort()).toEqual(['daily', 'home', 'online', 'profile']);
  });

  it('the web app bar matches the mobile bar, except for the one named exception', () => {
    const labels = mobileLabels();
    for (const [id, label] of Object.entries(labels)) {
      if (id === 'home') continue; // "Play" on the web, by design — asserted below
      expect(APPBAR, `AppBar's "${id}" tab must read "${label}"`)
        .toMatch(new RegExp(`id: '${id}',[^}]*label: '${label}'`));
    }
    expect(APPBAR, "the web bar's first tab is Play, not Home")
      .toMatch(/id: 'home',[^}]*label: 'Play'/);
  });

  it('the desktop rail matches the mobile bar', () => {
    const labels = mobileLabels();
    for (const label of Object.values(labels)) {
      expect(RAIL, `the rail must offer "${label}"`).toContain(`<span>${label}</span>`);
    }
  });

  it('no surface still says "Daily" for the history tab', () => {
    for (const [name, src] of [['App.jsx', APP], ['BiqNav.jsx', RAIL], ['AppBar.jsx', APPBAR]]) {
      expect(src, `${name} must not label a tab "Daily"`).not.toMatch(/label: ?'Daily'|label: ?"Daily"|<span>Daily<\/span>/);
    }
  });
});
