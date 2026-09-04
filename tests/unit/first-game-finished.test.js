import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const APP = readFileSync(join(ROOT, "src/App.jsx"), "utf8");

const declIndex = APP.indexOf("const markFirstGameFinished = useCallback");

describe("first-game-finished", () => {
  it("is declared, once, as a stable callback", () => {
    expect(declIndex).toBeGreaterThan(-1);
    expect(APP.match(/const markFirstGameFinished = useCallback/g) || []).toHaveLength(1);
  });

  it("is declared ABOVE every hook that names it", () => {
    // ⚠️ This is the guard that matters. A useCallback referenced in a
    // dependency array declared later in the component is a temporal dead
    // zone error evaluated on EVERY render — it puts the whole app in the
    // error boundary, and ESLint, the production build and the full test
    // suite all pass it. That exact mistake took prod down on 2026-08-25.
    const consumers = [
      // the biq:daily-completed listener effect — Footle / Trail / Mystery / Stadiums
      APP.indexOf("const onDailyDone = "),
      // the quiz engines
      APP.indexOf("const handleComplete = useCallback"),
    ];
    for (const at of consumers) {
      expect(at).toBeGreaterThan(-1);
      expect(declIndex).toBeLessThan(at);
    }
    // And every dependency-array mention must also sit below the declaration.
    let i = APP.indexOf("markFirstGameFinished]", declIndex + 1);
    while (i > -1) {
      expect(declIndex).toBeLessThan(i);
      i = APP.indexOf("markFirstGameFinished]", i + 1);
    }
  });

  it("fires from BOTH completion families, not just the quiz engines", () => {
    // Footle is the most-played mode and never reaches handleComplete. Wiring
    // only one path would report that nobody finishes it.
    const dailyStart = APP.indexOf("const onDailyDone = ");
    const dailyEnd = APP.indexOf("window.addEventListener('biq:daily-completed'", dailyStart);
    expect(dailyEnd).toBeGreaterThan(dailyStart);
    expect(APP.slice(dailyStart, dailyEnd)).toMatch(/markFirstGameFinished\(/);

    const hcStart = APP.indexOf("const handleComplete = useCallback");
    const hcEnd = APP.indexOf("markFirstGameFinished", hcStart);
    expect(hcEnd).toBeGreaterThan(hcStart);
    expect(APP.slice(hcStart, hcEnd + 400)).toMatch(/markFirstGameFinished\(\{ mode/);
  });

  it("fires at most once per device, and never throws into a results screen", () => {
    const body = APP.slice(declIndex, declIndex + 700);
    expect(body).toMatch(/localStorage\.getItem\("biq_first_game_finished"\)/);
    expect(body).toMatch(/localStorage\.setItem\("biq_first_game_finished"/);
    // The read must gate the write, or the guard does nothing.
    expect(body.indexOf('getItem("biq_first_game_finished")'))
      .toBeLessThan(body.indexOf('setItem("biq_first_game_finished"'));
    expect(body).toMatch(/try\s*\{/);
    expect(body).toMatch(/catch/);
  });

  it("keeps its account-scoped sibling — they answer different questions", () => {
    // acct-first-finish is attributable but has fired once in prod, because
    // first games are played before sign-up. Neither replaces the other.
    expect(APP).toMatch(/'acct-first-finish'/);
    expect(APP).toMatch(/loopEvent\("first-game-started"(, \{[^)]*\})?\)/);
  });
});
