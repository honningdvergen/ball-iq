// 24 Nov 2026: "Stump a mate" came off every finish screen. Since 13 Sept it was shared 26 times,
// opened 4 times and answered twice, and it was one more thing asked of a player who had just
// finished. Links already sent must keep opening, so the landing screen and its API stay.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (p) => readFileSync(fileURLToPath(new URL("../../" + p, import.meta.url)), "utf8");

describe("Stump a mate is not offered after a game", () => {
  it("the results screens and the finish panel no longer draw it", () => {
    for (const f of ["src/screens/ResultsScreen.jsx", "src/components/DailyDone.jsx"]) {
      const src = read(f);
      expect(src, f).not.toMatch(/onStump|stumpQ|dd\.stump|rs\.stumpQ|dd-stump/);
    }
  });
  it("a link someone already sent still opens", () => {
    expect(existsSync(fileURLToPath(new URL("../../api/q.js", import.meta.url)))).toBe(true);
    expect(read("src/screens/StumpScreen.jsx")).toContain("share.stumpPassGot");
    expect(read("src/App.jsx")).toMatch(/sp\.get\("stump"\)/);
  });
});
