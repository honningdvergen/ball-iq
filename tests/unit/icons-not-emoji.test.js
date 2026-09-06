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
    if (e.name.startsWith('.')) continue; // skip src/.claude worktrees
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...allJsx(p));
    else if (e.name.endsWith('.jsx')) out.push(p);
  }
  return out;
}
const FILES = allJsx();
const rel = (p) => p.slice(SRC.length - 3);
// ⚠️ PICTOGRAPHS ONLY — NOT the Dingbats block. An earlier version included
// U+2600-27BF and flagged `✕` on a close button, plus it would have flagged the
// `✓` and `✗` the quiz renders beside answers. Those are monochrome TYPOGRAPHY,
// deliberately chosen (the tick/cross exist precisely so answer feedback is not
// colour-only, for red-green colour blindness). Banning them would have
// undone an accessibility fix in the name of visual consistency.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{FE0F}]/u;

describe('icons are icons, not emoji', () => {
  it('the sweep can see the tree', () => {
    expect(FILES.length).toBeGreaterThan(5);
    expect(FILES.some((f) => f.endsWith('screens/HomeScreen.jsx'))).toBe(true);
  });

  it('no icon button renders an emoji as its glyph', () => {
    // ⚠️ KEYED ON SHAPE, NOT ON A CLASS NAME. The first version matched only
    // className="icon-btn" and therefore missed `profile-avatar-edit`, a button
    // whose entire content was a ✏️ — found by eye on a simulator walk, not by
    // this test. A button whose visible content is nothing but an emoji IS an
    // icon button, whatever it is called.
    const offenders = [];
    for (const f of FILES) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<button[^>]*>([^<]{1,12})<\/button>/g)) {
        const content = m[1].trim();
        // Emoji-only content — an emoji sitting inside a text label is fine.
        if (content && EMOJI.test(content) && !/[a-zA-Z]{2}/.test(content)) {
          offenders.push(`${rel(f)}: ${content}`);
        }
      }
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

  it('no icon TABLE stores an emoji as its glyph', () => {
    // ⚠️ THE BADGE GRID HID FROM EVERY CHECK ABOVE. Twelve OS emoji rendered
    // into twelve icon slots — and not one of them appeared in the JSX, because
    // they lived in a DATA TABLE (`BADGE_DEFS`) and reached the markup through a
    // variable. Every rule in this file scans markup, so all twelve were
    // invisible to it while sitting on the screen a player opens to feel proud.
    //
    // Emoji in a table are also worse than emoji in markup: 🔥 was doing double
    // duty for BOTH streak badges, which is only visible when you look at the
    // rendered grid, never at the line of code.
    const offenders = [];
    // Match string literals of ANY length, then test each. A capped pattern
    // (`"[^"]{1,6}"`) pairs the CLOSING quote of a long member with the OPENING
    // quote of the next one, swallows the emoji, and reports 3 of 12 — which is
    // what the first cut of this rule did before it was run against the known
    // pre-fix file.
    const STR = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g;
    const TABLE = /(?:export\s+)?(?:const|let|var)\s+([A-Z][A-Z0-9_]*(?:_DEFS|_TIERS|_ICONS|_ITEMS|_LEVELS))\s*=\s*\[/g;
    for (const f of FILES) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(TABLE)) {
        let i = m.index + m[0].length, depth = 1;
        while (i < src.length && depth > 0) {
          if (src[i] === '[') depth++;
          else if (src[i] === ']') depth--;
          i++;
        }
        const body = src.slice(m.index + m[0].length, i - 1);
        for (const sm of body.matchAll(STR)) {
          const v = sm[0].slice(1, -1);
          // A lone glyph — an emoji inside real words is content, not an icon.
          if (v && EMOJI.test(v) && !/[a-zA-Z]{2}/.test(v)) {
            offenders.push(`${rel(f)}: ${m[1]} holds ${v}`);
          }
        }
      }
    }
    expect(
      offenders,
      '\n  A table that feeds an icon slot must hold components, not emoji —\n' +
      '  see BADGE_DEFS. Content emoji (toasts, celebrations) stay welcome.\n',
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
    // The notification sheet retired 2026-09-06; the ask now lives in the
    // results panel (components/DailyDone.jsx) as a Lucide bell on a real button.
    const dd = readFileSync(`${SRC}/components/DailyDone.jsx`, 'utf8');
    expect(dd, 'the Remind me control needs its bell').toMatch(/<Bell size=\{14\}/);
    expect(app, 'the join modal needs its gamepad').toMatch(/<Gamepad2 size=\{26\}/);
    expect(home, 'the Home settings button needs its gear').toMatch(/<Settings size=\{18\}/);
    expect(home, 'the name CTA needs its pencil').toMatch(/<Pencil size=\{12\}/);
  });

  it('the reminder ask is a labelled control, not an anonymous sheet', () => {
    // The old bottom sheet spent one of two lifetime asks and once had no
    // role at all. Its replacement is a plain <button> with an aria-label in
    // the results panel, and it asks for permission on that tap.
    const dd = readFileSync(`${SRC}/components/DailyDone.jsx`, 'utf8');
    expect(dd).toMatch(/aria-label="Remind me tomorrow"/);
    expect(dd).toMatch(/onClick=\{doRemind\}/);
    const app = readFileSync(`${SRC}/App.jsx`, 'utf8');
    expect(app, 'nothing opens the retired sheet').not.toMatch(/setNotifPromptOpen\(true\)/);
  });
});
