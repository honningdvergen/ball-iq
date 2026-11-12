import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { crestPaint, contrast } from "../../src/lib/clubColour.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * WHY (10 Nov 2026). The club badge wrote white letters on every colour darker
 * than a fixed luminance, which left sky blue, orange and pink clubs at 2.3 to
 * 3 to 1. The axe gate in CI then failed on whichever days the daily Transfer
 * Trail held one of those clubs, so CI was red at random. Every colour in the
 * club table must give a badge that reaches 4.5 to 1.
 */
describe("club badges are readable", () => {
  const src = readFileSync(join(ROOT, "src/lib/clubColour.js"), "utf8");
  const hexes = [...new Set((src.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase()))];

  it("finds the club colour table", () => {
    expect(hexes.length).toBeGreaterThan(80);
  });

  it("every club colour paints a badge at 4.5 to 1 or better", () => {
    const bad = hexes
      .map((h) => ({ h, ...crestPaint(h) }))
      .filter((p) => contrast(p.bg, p.ink) < 4.5)
      .map((p) => `${p.h} -> ${p.bg} / ${p.ink}`);
    expect(bad).toEqual([]);
  });

  it("keeps white letters on the reds and dark letters on the light blues", () => {
    expect(crestPaint("#EF0107").ink).toBe("#FFFFFF");
    expect(crestPaint("#6CA9DC").ink).toBe("#14181F");
  });

  it("passes a non-hex value through untouched", () => {
    expect(crestPaint("var(--s3)").bg).toBe("var(--s3)");
  });
});
