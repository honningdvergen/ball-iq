import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Each tab keeps its own scroll (7 Nov 2026). Before this, scrolling Home,
 * opening History and coming back landed Home at the top (measured 420 → 0 → 0):
 * the panes share the page scroll and a hidden pane is display:none.
 * The restore must happen before paint (a layout effect, instant), and a tab
 * change that arrives WITH a screen change (back from a game) must be left to
 * the [screen] effect, which puts Home at the top on purpose (QA S-03).
 */
const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
const block = APP.slice(APP.indexOf('EACH TAB KEEPS ITS OWN SCROLL'), APP.indexOf('const selectTab = useCallback'));

const HOOK = readFileSync(fileURLToPath(new URL('../../src/hooks/useScrollAwareTabBar.js', import.meta.url)), 'utf8');

describe('tab scroll memory', () => {
  it('the tab bar hook re-attaches when the bar mounts (callback ref)', () => {
    expect(HOOK).toMatch(/const tabBarRef = useCallback\(\(node\) => setEl\(node\), \[\]\);/);
    expect(HOOK).toMatch(/\}, \[el, screen, inGame\]\);/);
  });
  it('a restore tells the tab bar, which neither tucks nor counts it as a scroll', () => {
    expect(block).toMatch(/window\.dispatchEvent\(new Event\("biq:tab-restore"\)\)/);
    expect(HOOK).toMatch(/addEventListener\('biq:tab-restore', onRestore\)/);
    expect(HOOK).toMatch(/const onRestore = \(\) => \{ last = window\.scrollY; if \(hidden\) \{ hidden = false; el\.classList\.remove\('tab-bar--tucked'\); \} \};/);
  });
  it('notes every scroll against the tab it happened on, passively', () => {
    expect(block).toMatch(/addEventListener\("scroll", note, \{ passive: true \}\)/);
    expect(block).toMatch(/tabScrollRef\.current\[tabNowRef\.current\] = window\.scrollY/);
  });
  it('restores in a layout effect, instantly, and never on a screen change', () => {
    expect(block).toMatch(/useLayoutEffect\(\(\) => \{/);
    expect(block).toMatch(/if \(!tabChanged \|\| screenChanged \|\| screen !== "home"\) return;/);
    expect(block).toMatch(/behavior: "instant"/);
    expect(block).toMatch(/\}, \[tab, screen\]\);/);
  });
  it('the [screen] effect that puts a new screen at the top is still there', () => {
    expect(APP).toMatch(/window\.scrollTo\(\{ top: 0, left: 0, behavior: 'instant' \}\); \}\s*catch \{ try \{ window\.scrollTo\(0, 0\); \} catch \{\} \}\s*\}, \[screen\]\);/);
  });
});
