import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

function walk(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(rel);
  }
  return out;
}

const stripComments = (s) => s
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

/**
 * Structural accessibility invariants that automated label checks miss.
 *
 * ⚠️ 179 aria-labels made every automated check pass while the playable app
 * had ZERO headings, never set document.title, and never announced a screen
 * change. Labels describe CONTROLS; none of them answers "what screen am I
 * on", which is the first question a screen-reader user has.
 *
 * ⚠️ ALSO A CORRECTION. Report #3 claimed "20 dialogs declare aria-modal but
 * NONE of them ever receives focus", citing three `.focus()` calls in src/
 * with none on a dialog ref. Measured 2026-08-23: there are TEN, seven of them
 * inside useModalA11y, and 19 of the 20 dialogs already called that hook. The
 * two real gaps were the marketing drawer (hand-rolled: Escape and focus
 * restore, no Tab trap) and one Profile modal. Both now use the hook. The
 * lesson kept here is the test, not the claim.
 */
describe('structural accessibility', () => {
  const appSrc = read('src/App.jsx');

  it('the app sets a document title per screen', () => {
    expect(appSrc, 'nothing assigns document.title').toMatch(/document\.title\s*=/);
  });

  it('screen changes are announced in a live region', () => {
    expect(appSrc).toMatch(/aria-live="polite"/);
    expect(appSrc, 'no screen announcer state').toMatch(/srScreenMsg/);
  });

  it('the announcement is deferred, and not with requestAnimationFrame', () => {
    // rAF does not fire in a hidden tab — that has already produced two
    // "the fix does not work" investigations in this repo. And announcing in
    // the same frame as the DOM swap gets dropped by VoiceOver entirely.
    // ⚠️ Anchor on the CALL, not the useState declaration. The first run of
    // this test anchored on `setSrScreenMsg` — which matches the destructured
    // declaration first — and its window swept up an unrelated
    // requestAnimationFrame elsewhere in the file. A false positive that
    // would have sent the next reader hunting a bug that is not there.
    const call = appSrc.indexOf('setSrScreenMsg(screenTitle)');
    expect(call, 'the announcement call was not found').toBeGreaterThan(-1);
    const block = appSrc.slice(call - 400, call + 200);
    expect(block, 'announcement must be deferred').toMatch(/setTimeout/);
    expect(block, 'requestAnimationFrame never fires in a hidden tab').not.toMatch(/requestAnimationFrame/);
  });

  it('the playable app renders a real h1', () => {
    expect(appSrc, 'no <h1> in App.jsx').toMatch(/<h1/);
  });

  it('every role="dialog" sits in a component that calls useModalA11y', () => {
    // The hook does focus-on-open, Escape, Tab trap, focus restore and
    // back-gesture coordination. A dialog declaring aria-modal WITHOUT it is
    // the worst case: assistive tech hides the rest of the page and the user
    // is left somewhere they cannot reach or escape.
    const offenders = [];
    for (const rel of walk('src')) {
      if (rel.includes('useModalA11y')) continue; // the hook's own documentation
      const src = stripComments(read(rel));
      const dialogs = (src.match(/role="dialog"/g) || []).length;
      if (!dialogs) continue;
      const hooks = (src.match(/useModalA11y\(/g) || []).length;
      if (hooks < dialogs) offenders.push(`${rel}: ${dialogs} dialog(s), ${hooks} useModalA11y call(s)`);
    }
    expect(offenders, `\n  ${offenders.join('\n  ')}\n`).toEqual([]);
  });

  it('Hot Streak signals right and wrong with a glyph, not colour alone', () => {
    // Deuteranope contrast between the green and red states measured 1.06 —
    // indistinguishable. Settings has a "Colour-blind tiles" toggle that
    // recolours Footle and nothing else, so any audit asking "is there a
    // colour-blind mode?" ticked the box while this mode stayed unreadable.
    const start = appSrc.indexOf('function HotStreakEngine');
    expect(start, 'HotStreakEngine not found').toBeGreaterThan(-1);
    const body = appSrc.slice(start, start + 9000);
    expect(body, 'Hot Streak options carry no tick/cross after answering')
      .toMatch(/['"]✓['"]/);
    expect(body).toMatch(/['"]✗['"]/);
  });
});
