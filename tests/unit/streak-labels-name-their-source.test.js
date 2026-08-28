import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Two different streaks may not wear the same label.
 *
 * ⚠️ There are TWO kinds of streak in this app and they answer different
 * questions:
 *
 *   · `loginStreak` — cross-mode, "days you showed up". Ticks on ANY daily
 *     completion, lives on the server, survives a reinstall, merges across
 *     devices. Rendered on Home, Daily and Profile.
 *   · `computeFootleStreak` / `computeMysteryStreak` / `computeTrailStreak` —
 *     per-mode, "days you SOLVED this one", derived from local history.
 *     Rendered on each mode's own finish card.
 *
 * Until 2026-08-24 all of them rendered the identical string "🔥 N-day streak"
 * under the identical flame. So one player, on one day, could read 12 on Home
 * and 3 on the Footle card and have no way to tell which was lying. Neither
 * was — they measure different things. The numbers are both correct and both
 * worth showing; the LABEL was the bug.
 *
 * ⚠️ The report called this "fixed between two surfaces, third one shipped".
 * It was four surfaces, and the fix is naming rather than reconciling: making
 * the mode cards render loginStreak would delete a real, different fact.
 */

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');

/** Every JS/JSX source file, so the sweep below cannot miss a new surface. */
function allSource(dir = 'src') {
  const root = fileURLToPath(new URL(`../../${dir}`, import.meta.url));
  const out = [];
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue; // skip src/.claude worktrees
    if (e.isDirectory()) out.push(...allSource(`${dir}/${e.name}`));
    else if (/\.(js|jsx)$/.test(e.name)) out.push(`${dir}/${e.name}`);
  }
  return out;
}
const ALL_SOURCE = allSource();
const FOOTLE = read('../../src/components/FootleHero.jsx');
const MYSTERY = read('../../src/screens/MysteryPlayer.jsx');
const TRAIL = read('../../src/screens/TransferTrail.jsx');
const HOME = read('../../src/screens/HomeScreen.jsx');
const DAILY = read('../../src/screens/DailyScreen.jsx');

/** The three visible finish cards. The share builders are swept separately. */
const MODE_SURFACES = [
  { name: 'Footle', src: FOOTLE, compute: 'computeFootleStreak', label: '{streak}-day Footle streak' },
  { name: 'Mystery', src: MYSTERY, compute: 'computeMysteryStreak', label: '{streak}-day Mystery streak' },
  { name: 'Trail', src: TRAIL, compute: 'computeTrailStreak', label: '${streak}-day Trail streak' },
];

describe('a streak label names which streak it is', () => {
  it('the sweep can actually see the tree', () => {
    // A zero-length file list would make the class guard vacuously green.
    expect(ALL_SOURCE.length).toBeGreaterThan(30);
    expect(ALL_SOURCE).toContain('src/lib/trail.js');
    expect(ALL_SOURCE).toContain('src/components/FootleHero.jsx');
  });

  it('each mode card still derives its OWN streak', () => {
    // ⚠️ If a card ever switched to loginStreak the label assertions below
    // would still pass while showing a different number — so pin the source.
    for (const { name, src, compute } of MODE_SURFACES) {
      expect(src, `${name} should compute its own streak`).toContain(compute);
    }
  });

  it('each mode card names its mode in the label', () => {
    for (const { name, src, label } of MODE_SURFACES) {
      expect(src, `${name}'s streak label must say "${name}"`).toContain(label);
    }
  });

  it('NOTHING in src/ renders a bare "N-day streak"', () => {
    // ⚠️ Swept the whole tree rather than the three cards, because the first
    // pass at this fix did exactly what the report calls the project's most
    // expensive habit: I renamed the three visible labels and left the FIVE
    // share builders emitting the bare string (two Footle builders in App.jsx
    // that "MUST stay in sync", FootleHero's own fallback, lib/trail.js and
    // lib/mysteryPlayer.js). This test caught it on its own baseline run.
    // Eight sites, not three — so guard the CLASS, not the instances.
    const offenders = [];
    for (const f of ALL_SOURCE) {
      const src = read(`../../${f}`);
      for (const m of src.matchAll(/\$?\{streak\}-day streak/g)) {
        offenders.push(`${f}: ${src.slice(Math.max(0, m.index - 30), m.index + 25).replace(/\s+/g, ' ')}`);
      }
    }
    expect(
      offenders,
      '\n  A per-mode streak under the generic label contradicts Home, which\n' +
      '  shows the cross-mode one with the same flame and the same words.\n' +
      '  Name the mode — do NOT reconcile the numbers, they measure different\n' +
      '  things and both are true.\n',
    ).toEqual([]);
  });

  it('the cross-mode surfaces keep the generic label, and keep loginStreak', () => {
    // The other half: "Day streak" must stay the name of the SHARED number, or
    // renaming the mode cards just moves the ambiguity somewhere else.
    expect(HOME).toContain('Day streak');
    expect(HOME).toMatch(/loginStreak/);
    expect(DAILY).toContain('Day streak');
    expect(DAILY, 'Daily renders loginStreak via the reconciled `streak` memo').toMatch(/typeof loginStreak === "number"/);
  });
});
