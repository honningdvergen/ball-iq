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
const CSS = read('../../src/app.css')
  // + the Footle board's rules, which moved to src/games/footle.css on 2026-09-05;
  // the app bundle imports both, so the gate reads what the app ships.
  + '\n' + read('../../src/games/footle.css')
  // + the tokens: --btn-shine / --btn-glow moved from app.css's :root to
  // src/design/tokens.js on 2026-09-05 (one palette, one place); the gate
  // below still asserts ONE definition, now in the generated tokens.css.
  + '\n' + read('../../src/design/tokens.css');
const APP = read('../../src/App.jsx');
const HUB = read('../../src/screens/OnlineHubTab.jsx'); // Online tab, extracted 2026-09-06 (E16)

// ⚠️ SCAN EVERY JSX FILE, NOT TWO OF THEM.
// The inline-style button rule below originally read only App.jsx (and Login).
// Alex found a rounded-rect accent button on the Profile screen — "does this
// look a bit outdated to you?" — and widening the scan turned up FIFTEEN more
// across six files that had never been looked at. Third time in one session a
// guard watched one of several definition sites and reported clean.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));
const ALL_JSX = (function walk(d) {
  const out = [];
  for (const n of readdirSync(d)) {
    if (n.startsWith('.')) continue; // background-task worktrees under src/.claude
    const p = join(d, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (n.endsWith('.jsx')) out.push(p);
  }
  return out;
})(SRC_DIR);
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
    // a BLACK drop shadow instead of the green glow, #0B0C10 ink instead of
    // #06230C, and an opacity-only press. The most-tapped button in the app
    // looked least like the app.
    const i = CSS.indexOf('.next-btn-primary{');
    const rule = CSS.slice(i, CSS.indexOf('}', i));
    expect(rule).toMatch(/border-radius:999px/);
    // ⚠️ Asserts the TOKEN. The glow and the specular shine are now
    // --btn-glow / --btn-shine in :root, so pinning the literal here would pin
    // the duplication the tokens removed — the same trap the copy and accent
    // guards fell into earlier today.
    expect(rule).toMatch(/box-shadow:var\(--btn-shine\), var\(--btn-glow\)/);
    // The ink is the token since 2026-09-05 (C3: stylesheets read tokens).
    expect(rule).toMatch(/color:(#06230C|var\(--grn-ink\))/);
    expect(CSS).toMatch(/\.next-btn-primary:active\{transform:scale\(0\.97\)/);
    expect(CSS, 'the desktop variant carried the same rounded rect')
      .not.toMatch(/\.qd-play \.next-btn-primary \{[^}]*border-radius: 14px/);
  });

  it('the Today block is four equal rows, each carrying its own mode colour', () => {
    // 2026-09-06 (Alex, with the app beside the website's Today block): no
    // hero card, no mode-grid tile for a daily. One row shape; each row sets
    // --mode / --mode-rgb from src/lib/accents.js so the icon well and the
    // pill take the mode colour without a per-mode CSS rule.
    for (const k of ['footle', 'daily7', 'trail', 'mystery']) {
      expect(HOME, `${k} row carries its accent + rgb`).toContain(`accent: MODE_ACCENT.${k}, rgb: MODE_RGB.${k}`);
    }
    // The grid is neutral again: the only tinted tiles were the two dailies,
    // and both now live in the rows above.
    expect(HOME, 'no grid tile is tinted').not.toMatch(/iconColor: MODE_ACCENT/);
    expect(HOME, 'Transfer Trail is a row, not a grid tile').not.toMatch(/key:"trail", Icon/);
    expect(HOME, 'Mystery Player is a row, not a grid tile').not.toMatch(/\.\.\.\(mysteryLive \? \[\{ key:"mystery"/);
    expect(HOME, 'no hero card on the home').not.toMatch(/<FootleHero|DesktopFootleHero/);
    // 2026-09-06 critique (23/40): the top third was not the product. The
    // finder sits BELOW the Today block as the head of the catalogue; the Club
    // Quiz tile (the same door twice) is gone; Play is one colour.
    expect(HOME.indexOf('<ClubFinder'), 'finder renders after the Today zone').toBeGreaterThan(HOME.indexOf('className="daily-zone"'));
    expect(HOME, 'no Club Quiz tile — the finder is the club entry').not.toMatch(/key:"clubquiz"/);
    expect(HOME, 'chips wear club colour (Alex 2026-09-06)').toMatch(/className="cf-abbr" style=\{\{ background: clubPacks\[k\]\.color/);
    const cta = CSS.match(/\n\.t7s-cta\{[^}]*\}/)?.[0] || '';
    expect(cta, 'Play is green on every row, like the website').toContain('background:var(--accent)');
    expect(CSS, 'inactive tabs are not dimmed by opacity').not.toMatch(/\.tab-item\{[^}]*opacity:0\.6/);
    expect(APP, 'the first-session banner left the home').not.toMatch(/Welcome to \{APP_NAME\}!/);
    expect(APP, 'the first-session flag reaches HomeScreen instead').toMatch(/firstSession=\{showFirstQuizTip\}/);
    // And nobody re-types a mode colour beside a component.
    expect(HOME, 'import from lib/accents.js instead of pasting a hex')
      .not.toMatch(/iconColor: "#/);
  });
});

/**
 * ⚠️ FOUR PRIMARY BUTTON RADII SHIPPED AT ONCE.
 *
 * .btn-3d — Play, Invite friends, Same phone — is a 999px pill with a green
 * glow. Against it the app also shipped: the quiz's Next at 14px, the Online
 * tab's main CTA at 16px, the sign-up screen's auth buttons at 15px, and the
 * local-play button at 10px. Alex found three of them by eye in a single pass
 * ("does the next button look a bit outdated?", "are the login option buttons
 * also a bit square?", "also sign up to play online button?"). The design
 * review had already named the class and undercounted it as "two Play-button
 * components".
 *
 * This is the assertion that stops a fifth appearing.
 */
describe('one primary button, everywhere', () => {
  const LOGIN = readFileSync(fileURLToPath(new URL('../../src/Login.jsx', import.meta.url)), 'utf8');

  it('the sign-up screen uses the pill', () => {
    // The highest-stakes screen in the product: scouting report #4's five-star
    // blocker was a sign-up dead end, and 36% of accounts never play a game.
    expect(LOGIN).toMatch(/minHeight: 44, borderRadius: 999,/);
  });

  it('the Online tab CTA uses the pill and the standard glow', () => {
    // The ink is the token since 2026-09-05 (C3-B: inline styles read tokens).
    expect(HUB).toMatch(/borderRadius:999,background:"var\(--accent\)",color:"var\(--grn-ink\)",boxShadow:"0 8px 22px -8px rgba\(88,204,2,0\.55\)"/);
  });

  it('the primary button look is one definition, not six', () => {
    // Alex: "it does not have that slight shine that makes it more tempting to
    // tap". The fix is a specular highlight — but added per-button it would be
    // six copies of the same two shadows, which is how this file's other
    // subjects drifted in the first place.
    expect(CSS).toMatch(/--btn-shine:inset 0 1\.5px 0 rgba\(255,255,255,0\.30\)/);
    expect(CSS).toMatch(/--btn-glow:0 8px 22px -8px rgba\(88,204,2,0\.55\)/);
    const users = CSS.match(/box-shadow:var\(--btn-shine\), var\(--btn-glow\)/g) || [];
    expect(users.length, 'every primary green button must take both tokens')
      .toBeGreaterThanOrEqual(5);
  });

  it('no primary green button is left on a rounded rectangle', () => {
    // Catches the shape rather than any one element: a full-width or
    // accent-filled button carrying a small radius is the defect.
    const offenders = [];
    // ⚠️ \d{1,3} then filter — \d{1,2} silently matched the "99" of "999" and
    // reported every CORRECT button as an offender. A guard that flags the fix
    // gets deleted for crying wolf.
    for (const m of APP.matchAll(/borderRadius:(\d{1,3})[^}]{0,160}background:"var\(--accent\)"/g)) {
      if (m[1] === '999') continue;
      const line = APP.slice(0, m.index).split('\n').length;
      offenders.push(`App.jsx:${line} borderRadius:${m[1]} on an accent-filled button`);
    }
    expect(offenders, '\n  Use 999 — see .btn-3d.\n  ' + offenders.join('\n  ') + '\n').toEqual([]);
  });
});

/**
 * ⚠️ THE SAME DEFECT LIVES IN TWO FILES AND MY FIRST GUARD ONLY WATCHED ONE.
 *
 * The inline-style guard above caught accent-filled buttons declared in
 * App.jsx. It could not see the ones declared as CSS classes, so seven more
 * shipped on small radii — including .onboard-btn, the first button a new
 * player ever taps. Alex found it by eye, again: "notice the green button
 * here? it seems to be a pattern this with many buttons where they are
 * outdated". It was: thirteen in total across the two files.
 *
 * A guard that watches one of two definition sites is not a guard, it is a
 * false sense of coverage. This one watches the stylesheet.
 */
describe('no accent button on a rounded rectangle, in CSS either', () => {
  it('every accent-filled rule is a pill, a circle, or not a button', () => {
    // ⚠️ ALLOWLIST, NOT A LOOSER PATTERN. These three are genuinely not
    // buttons — a progress bar, a 9px inline marker, and an element rendered
    // into the OG share IMAGE (where a pill would look wrong at card scale).
    // Naming them keeps the rule strict for everything else.
    const NOT_BUTTONS = new Set(['.prog-bar', '.friends-you-pill', '.og-you']);
    const offenders = [];

    // ⚠️ FIRST PASS: index every rule's radius by selector, because a button
    // can declare its FILL and its SHAPE in two different rules. `.rd-btn`
    // carried border-radius:14px and `.rd-btn-primary` carried the accent
    // background; neither rule alone looked like an offender, so the desktop
    // results buttons — Play again, Home, Share — sat on 14px through the
    // whole pill migration and the guard reported clean. A guard that only
    // sees single-rule buttons is the same false coverage this file was
    // written to end.
    const radiusOf = new Map();
    const bodyRules = [...CSS.matchAll(/(^|\})\s*([^{}@]+)\{([^}]*)\}/gm)];
    for (const m of bodyRules) {
      const sel = m[2].trim().replace(/\s+/g, ' ');
      const r = /border-radius:\s*([^;]+)/.exec(m[3]);
      if (r && !radiusOf.has(sel)) radiusOf.set(sel, r[1].trim());
    }
    // `.rd-btn-primary` inherits shape from `.rd-btn`: strip trailing -words
    // until a rule with a radius is found.
    //
    // ⚠️ ONLY FOR SELECTORS NAMED LIKE BUTTONS. Resolving inherited radii for
    // everything accent-filled produced three false positives on its first run
    // — .wd-key-green (a Footle KEYBOARD KEY, which must stay a small rounded
    // rect), .fh-tile-green (a grid TILE) and .dr-opt-tag (a correct-answer
    // badge). None are buttons; they matched only on the fill. Three false to
    // one true is not a guard, it is noise that gets muted.
    //
    // Known limit, stated rather than hidden: a button that splits fill from
    // shape AND is not named *btn / *cta is still invisible here. The repo
    // names its buttons consistently, so that is a narrow gap — but it is a
    // gap, not coverage.
    const looksLikeButton = (sel) => /btn|cta/i.test(sel);
    const inheritedRadius = (sel) => {
      if (!looksLikeButton(sel)) return null;
      let base = sel;
      while (base.includes('-')) {
        base = base.slice(0, base.lastIndexOf('-'));
        if (radiusOf.has(base)) return radiusOf.get(base);
      }
      return null;
    };

    for (const m of bodyRules) {
      const sel = m[2].trim().replace(/\s+/g, ' ');
      const body = m[3];
      if (sel.startsWith('/*')) continue;
      if (!/background:\s*(#58CC02|var\(--accent\))/.test(body)) continue;
      const r = /border-radius:\s*([^;]+)/.exec(body);
      const rad = r ? r[1].trim() : inheritedRadius(sel);
      if (!rad || rad === '999px' || rad === '50%') continue;
      if ([...NOT_BUTTONS].some((n) => sel.includes(n))) continue;
      offenders.push(`${sel} — border-radius:${rad}`);
    }
    expect(
      offenders,
      '\n  Accent-filled buttons use the 999px pill — see .btn-3d.\n  ' +
      offenders.join('\n  ') + '\n',
    ).toEqual([]);
  });
});
