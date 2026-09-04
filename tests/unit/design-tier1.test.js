import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Tier 1 of the 1.7.0 design review, pinned.
 *
 * A design critique conducted live on an iPhone 17 simulator graded the app
 * 3.3/5 and listed twelve small fixes worth roughly half a grade. These are
 * exactly the kind of change that rots: a token nudged back during a refactor,
 * an icon swapped by someone matching a name rather than a meaning, a display
 * label "simplified" into the raw key it came from. Each assertion below names
 * the defect so the next person can tell a deliberate change from a regression.
 *
 * ⚠️ THREE OF THE CRITIQUE'S FIXES WERE WRONG AND ARE NOT PINNED AS WRITTEN:
 *   · badge contrast — blamed on the label's colour token, which is a healthy
 *     --t2 (7.65:1). The real cause was .badge-tile.locked{opacity:0.4} veiling
 *     a label whose icon ALREADY carried its own grayscale+0.35.
 *   · CLUBQUIZ — a renamed `cat` literal would have orphaned every club-quiz
 *     row in catStats, because that string is the aggregation key. Display
 *     label only.
 *   · Mystery's back button — reported as an a11y failure. It was not; `hit44`
 *     supplies a 44pt target via ::after. The defect was visual: it was the
 *     only back control in the app without the chromed well.
 */

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const CSS = read('../../src/app.css');
const APP = read('../../src/App.jsx');
const HOME = read('../../src/screens/HomeScreen.jsx');
const DAILY = read('../../src/screens/DailyScreen.jsx');
const HERO = read('../../src/components/FootleHero.jsx');
const MYSTERY = read('../../src/screens/MysteryPlayer.jsx');
const ACCENTS = read('../../src/lib/accents.js');
const STADIUM = read('../../src/screens/StadiumGame.jsx');

/** sRGB relative luminance → WCAG contrast ratio. */
function ratio(hexA, hexB) {
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [a, b] = [lum(hexA), lum(hexB)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

describe('design review — tier 1', () => {
  it('the hero wordmark does not read "F ootle"', () => {
    // A 34px tile holds a ~13px glyph, so the F carries ~10px of side bearing.
    // An 8px flex gap on top of that put ~18px between the F and the "o"
    // against 2-3px between the rest — the word visibly came apart.
    expect(CSS).toMatch(/\.fh-title\{display:flex;align-items:center;gap:0;\}/);
    expect(CSS).toMatch(/\.fh-title-rest\{margin-left:3px;\}/);
    expect(HERO, 'the trailing text must be an element so it can be pulled left')
      .toMatch(/<span className="fh-title-rest">ootle<\/span>/);
  });

  it('locked badges are not dimmed twice', () => {
    // The icon carries grayscale(1) opacity(0.35) inline; a further 0.4 on the
    // tile composited the LABEL to ~14% and measured 1.71:1 — a hard AA fail
    // on twelve tiles whose only job is showing what there is to earn.
    expect(CSS).toMatch(/\.badge-tile\.locked\{opacity:1;\}/);
    expect(CSS).toMatch(/\.badge-tile\.locked \.badge-name\{color:var\(--t3\);\}/);
    // --t3 on --s1 is the floor this relies on.
    expect(ratio('#7E828C', '#13151C')).toBeGreaterThanOrEqual(4.5);
  });

  it('a weak score is not rendered in celebration green', () => {
    expect(CSS).toMatch(/\.score-big\{[^}]*color:var\(--text\)/);
    expect(CSS).toMatch(/\.score-big\.is-strong\{color:var\(--accent\);\}/);
    expect(APP, 'the accent must be earned at a threshold, not always on')
      .toMatch(/score \/ total >= 0\.7 \? " is-strong" : ""/);
  });

  it("Footle's absent tile is distinguishable from an unguessed one", () => {
    // --s2 (#1B1E27) measured 1.08:1 against the page: a letter ruled OUT
    // looked identical to one never tried, in the mode whose entire feedback
    // language is three tile states.
    expect(CSS).toMatch(/\.wd-tile\.wd-grey\{background:#2E323E/);
    expect(ratio('#2E323E', '#0B0C10')).toBeGreaterThan(ratio('#1B1E27', '#0B0C10'));
  });

  it('the club-quiz chip shows a label, and the stats key is untouched', () => {
    expect(APP).toMatch(/ClubQuiz:"Club Quiz"/);
    // ⚠️ The literal is the catStats aggregation key. Renaming it silently
    // orphans every club-quiz stat a player has already accumulated.
    expect(APP, 'the cat VALUE must stay ClubQuiz').toMatch(/cat: "ClubQuiz"/);
  });

  it('mode icons carry the right metaphor', () => {
    expect(HOME).toMatch(/key:"survival",\s*Icon: Heart/);   // lives, not a bolt
    expect(HOME).toMatch(/key:"hotstreak", Icon: Flame/);    // "hot" streak
    expect(HOME).toMatch(/key:"stadiums", Icon: LandPlot/);  // `landmark` read as a bank
    expect(HOME).toMatch(/key:"mystery", Icon: UserRoundSearch/);
    // Daily must name the mode with the same mark Home does.
    expect(DAILY).toMatch(/<UserRoundSearch size=\{size\}/);
    expect(HOME, 'Search was also the icon inside Mystery\'s own search field')
      .not.toMatch(/Icon: Search,/);
  });

  it('Mystery Player has a mode colour, like every other daily', () => {
    // It was the one neutral card in a row of tinted ones — which reads as
    // disabled, not as different.
    // ⚠️ Asserts the TOKEN, not a literal. This used to pin "#B9A5FF" inline;
    // the accent set now lives in src/lib/accents.js, so pinning the literal
    // here would be pinning the duplication that file removed.
    const i = DAILY.indexOf('mystery: {');
    const block = DAILY.slice(i, i + 700);
    expect(block).toMatch(/139,108,240/);
    expect(block).toMatch(/fg: MODE_ACCENT\.mystery/);
    expect(ACCENTS, 'the mode accent set must declare mystery')
      .toMatch(/mystery: '#B9A5FF'/);
    expect(ratio('#B9A5FF', '#13151C')).toBeGreaterThanOrEqual(4.5);
  });

  it('the two new modes share the app-wide 20px gutter', () => {
    // .app already supplies 20px; these added another 16px, rendering both
    // screens 32px narrower than the other eight surfaces.
    expect(STADIUM).not.toMatch(/padding: "16px 16px 32px"/);
    expect(MYSTERY).not.toMatch(/padding: 20 \}/);
    expect(MYSTERY).not.toMatch(/padding: '14px 16px 6px'/);
    expect(MYSTERY).not.toMatch(/margin: '4px 16px 14px'/);
  });

  it('there is one back button in the app', () => {
    expect(MYSTERY).toMatch(/aria-label="Back" className="back-btn"/);
  });

  it('picker rows are left-aligned', () => {
    // .mode-item is a <button>, and the UA stylesheet centres button text — so
    // club names floated between a left badge and a right arrow.
    expect(CSS).toMatch(/\.mode-item\{text-align:left;/);
  });

  it('the hero tile strip cannot crush its own copy', () => {
    // --fh-cols is the answer length (4-8). At a fixed 24px an 8-letter day
    // took 227px of ~330 and the subtitle collapsed to five ragged lines —
    // invisible in review because it only happens on long-answer days.
    expect(CSS).toMatch(/--fh-tile:min\(24px, calc\(\(165px/);
  });

  it('the notification ask never lands on a first-ever result', () => {
    // iOS grants exactly one native permission prompt, so a refusal is
    // permanent — spending it before the app has proven itself is the worst
    // available trade.
    // Pin the THRESHOLD, not the return form. This assertion originally
    // matched `return false;` verbatim and broke the moment the native bail
    // was instrumented — pinning a literal pins the duplication, not the
    // intent. Both engines must refuse under two completed plays; how they
    // report the refusal is free to change.
    expect(APP).toMatch(/if \(playsSoFar < 2\) return \w/);
    expect(APP).toMatch(/if \(webPlays < 2\) return \w/);
  });
});
