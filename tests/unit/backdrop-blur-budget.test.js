import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CSS = readFileSync(fileURLToPath(new URL('../../src/app.css', import.meta.url)), 'utf8');

/**
 * A BACKDROP BLUR IS AN INTERACTION COST, NOT A COLOUR.
 *
 * The tab bar shipped `backdrop-filter: blur(42px) saturate(200%)
 * brightness(1.35)`. A backdrop-filter re-samples and re-blurs everything
 * behind it whenever that content changes — which is exactly what a tab switch
 * does — and the cost scales with the radius.
 *
 * Measured in Chrome's profiler at 4x CPU throttle, one variable changed at a
 * time, on the same three taps:
 *
 *     blur(42px) saturate(200%) brightness(1.35)   INP 3118 ms
 *     blur(14px) saturate(160%)                    INP  722 ms
 *     no backdrop-filter at all                    INP  360 ms
 *     blur(14px) saturate(180%) brightness(1.25)   INP  350 ms   <- shipped
 *
 * 86% of the original 3.1s was PRESENTATION delay. React's own work was 253ms.
 * That is why an earlier fix to the .tab-pill transition changed nothing, and
 * why Alex reported the lag twice after it "landed".
 *
 * The glass survives at 14px. The lesson is the radius, so that is what this
 * pins.
 */
describe('backdrop-filter blur stays within its interaction budget', () => {
  const radii = [...CSS.matchAll(/backdrop-filter:\s*blur\((\d+(?:\.\d+)?)px\)/g)].map((m) => Number(m[1]));

  it('finds the declarations (a zero means the scan broke, not that it is clean)', () => {
    expect(radii.length).toBeGreaterThan(0);
  });

  it('keeps every blur radius at or under 20px', () => {
    // 42px cost 2.7 seconds of presentation delay per tap. There is no visual
    // gain above ~20px on a bar this size that is worth re-measuring for.
    const tooBig = radii.filter((r) => r > 20);
    expect(tooBig, `blur radii over 20px: ${tooBig.join(', ')}`).toEqual([]);
  });
});
