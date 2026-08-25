import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CSS = readFileSync(fileURLToPath(new URL('../../src/app.css', import.meta.url)), 'utf8');

/**
 * THE TAB CAPSULE IS DECLARED TWICE AND ONLY ONE COPY IS VISIBLE TO ALEX.
 *
 * app.css carries a `@media (display-mode: standalone)` mirror of ~155
 * !important rules that re-states chrome for installed PWAs and the native
 * app. `.tab-pill` lives in both.
 *
 * ⚠️ On 2026-08-25 Alex reported the tab bar lagging on device. The cause was a
 * .52s transition on the sliding capsule. The fix went into the BASE rule — and
 * did nothing, because the mirror's `!important` copy still said .52s and
 * outranked it. The built bundle contained both values. The one surface the bug
 * was reported from was the one surface the fix could not reach.
 *
 * The mirror's own comment already said "updated in lockstep with the base
 * rule". A comment is not a lockstep. This is.
 */
describe('.tab-pill base and standalone mirror stay in lockstep', () => {
  const durations = [...CSS.matchAll(/\.tab-pill\s*\{[^}]*?transition:\s*transform\s+([\d.]+)s\s+(cubic-bezier\([^)]*\))/g)]
    .map((m) => ({ duration: m[1], curve: m[2].replace(/\s/g, '') }));

  it('finds both declarations (a zero here means the scan broke, not that it is clean)', () => {
    expect(durations.length).toBe(2);
  });

  it('declares the same duration in both', () => {
    expect(durations[0].duration).toBe(durations[1].duration);
  });

  it('declares the same easing curve in both', () => {
    expect(durations[0].curve).toBe(durations[1].curve);
  });

  it('stays fast enough to survive a second tap', () => {
    // The complaint was specifically about tapping two tabs close together: a
    // transition still travelling when the next tap lands restarts from wherever
    // the capsule happens to be. Anything at or above ~.35s brings that back.
    for (const d of durations) expect(Number(d.duration)).toBeLessThanOrEqual(0.3);
  });
});
