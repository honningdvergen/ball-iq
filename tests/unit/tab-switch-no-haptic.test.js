import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const APP = readFileSync(join(ROOT, "src/App.jsx"), "utf8");

/**
 * Switching tabs must not fire a haptic.
 *
 * Alex reported tab switching as slow four separate times, and three of my
 * diagnoses were wrong because browser profiling cannot see this: every
 * haptic() is a JS→native→JS bridge round trip and Capacitor constructs a
 * fresh UIImpactFeedbackGenerator per call. His device log is what settled it
 * — ~57 queued `Haptics impact` calls followed by
 * WebProcessProxy::didBecomeUnresponsive. Throttling to 55ms helped and was
 * not enough.
 *
 * It is also the platform convention: Threads and Instagram fire nothing on
 * tab change. The screen changing is the feedback.
 */
describe("tab switching", () => {
  it("the tab bar button fires no haptic", () => {
    // NB: don't stop the match at the first ">" — the arrow function "=>"
    // contains one, which silently truncated this assertion on first write.
    const at = APP.indexOf("<button key={id} className={`tab-item");
    expect(at, "tab bar button not found — did the markup change?").toBeGreaterThan(-1);
    const tag = APP.slice(at, APP.indexOf("\n", at));
    expect(tag).toMatch(/onClick=\{\(\) => setTab\(id\)\}/);
    expect(tag).not.toMatch(/haptic/);
  });

  it("no tab-switch handler anywhere pairs setTab with a haptic on the same line", () => {
    // Guards the OTHER definition sites too — BiqNav and the screen-level
    // shortcuts — because the same defect shipping in a second nav is exactly
    // the pattern that has cost this repo repeatedly.
    const files = ["src/App.jsx", "src/BiqNav.jsx"]
      .concat(readdirSync(join(ROOT, "src/screens")).map((f) => `src/screens/${f}`))
      .filter((f) => f.endsWith(".jsx"));

    const offenders = [];
    for (const rel of files) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      src.split("\n").forEach((line, i) => {
        if (/setTab\(/.test(line) && /haptic\(/.test(line)) offenders.push(`${rel}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it("still fires haptics where they mark a real moment", () => {
    // A control: if this ever hits zero, the guard above has been over-applied
    // and the app has gone silent everywhere, which is a different bug.
    const total = (APP.match(/haptic\(/g) || []).length;
    expect(total).toBeGreaterThan(10);
  });
});
