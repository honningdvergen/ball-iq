import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * UI chrome uses the icon set, not emoji.
 *
 * ⚠️ ALEX, 2026-08-24, looking at the notification sheet: *"does this look a bit
 * not modern to you?"* It did, and the reason was one thing: a 🔔 emoji where an
 * icon belonged.
 *
 * The app already has a coherent icon language — lucide-react, 24px grid,
 * `currentColor`, strokeWidth 2 — used across the Home mode cards, the Daily 7
 * row and the tab bar. Emoji had survived in the OLDER surfaces, so the app was
 * running two visual systems at once. That mix is what reads as "assembled"
 * rather than "designed", and it was sharpest in the worst places:
 *
 *   · the Home header settings button rendered ⚙️ while the same header drew a
 *     proper lucide bell path a few lines above
 *   · the join-the-game modal rendered 🎮 while `Gamepad2` was ALREADY imported
 *     at the top of the same file
 *   · the notification sheet — the one screen that spends one of only two
 *     lifetime permission asks — led with a 🔔
 *
 * ⚠️ THIS IS NOT AN EMOJI BAN. Emoji are fine and on-brand in CONTENT: streak
 * toasts (🔥), celebrations (🎉), the welcome banner's ball, question text. The
 * rule is narrower and about role: an emoji may not stand in for an ICON — the
 * glyph inside a control, or the hero mark of a sheet.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url));
function allJsx(dir = SRC) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...allJsx(p));
    else if (e.name.endsWith('.jsx')) out.push(p);
  }
  return out;
}
const FILES = allJsx();
const rel = (p) => p.slice(SRC.length - 3);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

describe('icons are icons, not emoji', () => {
  it('the sweep can see the tree', () => {
    expect(FILES.length).toBeGreaterThan(5);
    expect(FILES.some((f) => f.endsWith('screens/HomeScreen.jsx'))).toBe(true);
  });

  it('no icon button renders an emoji as its glyph', () => {
    // `icon-btn` is the app's class for a control whose entire content is a
    // glyph. An emoji there is the control's icon by definition.
    const offenders = [];
    for (const f of FILES) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<button[^>]*className="[^"]*icon-btn[^"]*"[^>]*>([^<]{0,12})</g)) {
        if (EMOJI.test(m[1])) offenders.push(`${rel(f)}: ${m[1].trim()}`);
      }
    }
    expect(
      offenders,
      '\n  Use the lucide icon set — the app already ships it and every other\n' +
      '  control uses it. An emoji here runs a second visual system.\n',
    ).toEqual([]);
  });

  it('no sheet or modal leads with an emoji as its hero mark', () => {
    // A large decorative glyph (fontSize >= 30, aria-hidden) is a hero mark.
    const offenders = [];
    for (const f of FILES) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/fontSize:\s*(\d{2,})[^}]*\}\}\s*aria-hidden="true"\s*>\s*([^<\s]{1,4})\s*</g)) {
        if (Number(m[1]) >= 30 && EMOJI.test(m[2])) offenders.push(`${rel(f)}: ${m[1]}px ${m[2]}`);
      }
    }
    expect(
      offenders,
      '\n  A permission ask or modal led by an emoji is the clearest "not\n' +
      '  designed" tell. Put a lucide icon in a tinted container instead —\n' +
      '  see the notification sheet in App.jsx for the pattern.\n',
    ).toEqual([]);
  });

  it('the replacements actually shipped', () => {
    // ⚠️ Guards against "passing" by deleting the elements instead of fixing
    // them — the offender lists above would be empty either way.
    const app = readFileSync(`${SRC}/App.jsx`, 'utf8');
    const home = readFileSync(`${SRC}/screens/HomeScreen.jsx`, 'utf8');
    expect(app, 'the notification sheet needs its bell').toMatch(/<Bell size=\{26\}/);
    expect(app, 'the join modal needs its gamepad').toMatch(/<Gamepad2 size=\{26\}/);
    expect(home, 'the Home settings button needs its gear').toMatch(/<Settings size=\{18\}/);
    expect(home, 'the name CTA needs its pencil').toMatch(/<Pencil size=\{12\}/);
  });

  it('the notification sheet is announced as a dialog', () => {
    // It spends one of two lifetime asks and had no role/aria-modal at all,
    // while the join modal beside it has both.
    const app = readFileSync(`${SRC}/App.jsx`, 'utf8');
    const i = app.indexOf('notifPromptOpen && (');
    expect(i).toBeGreaterThan(-1);
    const sheet = app.slice(i, i + 2600);
    expect(sheet).toMatch(/role="dialog"/);
    expect(sheet).toMatch(/aria-modal="true"/);
    expect(sheet).toMatch(/aria-labelledby="notif-sheet-title"/);
  });
});
