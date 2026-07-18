// gradeTrail — label-based permutation grading for Transfer Trail. The
// duplicate-club cases (return spells: two Aston Villa rungs) are the ones
// that would regress silently, exactly like Wordle's duplicate letters.
import { describe, it, expect } from "vitest";
import {
  gradeTrail,
  isTrailSolved,
  scrambleBench,
  getTrailNumber,
  TRAIL_ANCHOR_DAY,
  DAY_MS,
  buildTrailShareText,
  TRAIL_MAX_ATTEMPTS,
} from "../../src/lib/trail.js";

const CAREER = ["Watford", "Villa", "ManUtd", "Inter", "Villa", "Everton"]; // return spell: Villa x2

describe("gradeTrail", () => {
  it("all green on the exact order", () => {
    const g = gradeTrail(CAREER, CAREER);
    expect(g.every((x) => x.mark === "green" && x.dir === null)).toBe(true);
    expect(isTrailSolved(g)).toBe(true);
  });

  it("off-by-one is yellow with the right direction", () => {
    // Swap rungs 2 and 3 (ManUtd ↔ Inter): both are 1 away from home.
    const guess = ["Watford", "Villa", "Inter", "ManUtd", "Villa", "Everton"];
    const g = gradeTrail(guess, CAREER);
    expect(g[2]).toEqual({ mark: "yellow", dir: "down" }); // Inter belongs later (3)
    expect(g[3]).toEqual({ mark: "yellow", dir: "up" });   // ManUtd belongs earlier (2)
    expect(isTrailSolved(g)).toBe(false);
  });

  it("two-plus rungs off is grey, direction still points home", () => {
    // Everton (true rung 5) placed on rung 0; Watford (true 0) pushed to rung 1.
    const guess = ["Everton", "Watford", "Villa", "ManUtd", "Inter", "Villa"];
    const g = gradeTrail(guess, CAREER);
    expect(g[0]).toEqual({ mark: "grey", dir: "down" });   // Everton belongs much later
    expect(g[1]).toEqual({ mark: "yellow", dir: "up" });   // Watford is 1 off, belongs earlier
  });

  it("duplicate labels are interchangeable: either Villa tile greens either Villa rung", () => {
    // Same career, but imagine the two Villa TILES swapped — labels identical,
    // so the grade must be indistinguishable from the solved board.
    const g = gradeTrail(["Watford", "Villa", "ManUtd", "Inter", "Villa", "Everton"], CAREER);
    expect(g[1].mark).toBe("green");
    expect(g[4].mark).toBe("green");
  });

  it("duplicate label off-slot grades against its NEAREST true rung", () => {
    // Villa placed on rung 3: true Villa rungs are 1 and 4 → nearest is 4
    // (distance 1) → yellow, belongs later.
    const guess = ["Watford", "ManUtd", "Inter", "Villa", "Villa", "Everton"];
    const g = gradeTrail(guess, CAREER);
    expect(g[3]).toEqual({ mark: "yellow", dir: "down" });
  });

  it("equidistant duplicate tie resolves up (deterministic)", () => {
    // Answer has the label at rungs 0 and 4; guessed at rung 2 → both are
    // distance 2 → tie prefers the earlier rung → grey pointing up.
    const answer = ["A", "B", "C", "D", "A"];
    const guess = ["B", "C", "A", "D", "A"];
    const g = gradeTrail(guess, answer);
    expect(g[2]).toEqual({ mark: "grey", dir: "up" });
  });
});

describe("scrambleBench", () => {
  it("returns a permutation that is never the solved order", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const bench = scrambleBench(CAREER, seed);
      expect([...bench].sort()).toEqual([...CAREER].sort());
      expect(bench.some((label, i) => label !== CAREER[i])).toBe(true);
    }
  });

  it("is deterministic per seed (same bench for everyone on a given day)", () => {
    expect(scrambleBench(CAREER, 12345)).toEqual(scrambleBench(CAREER, 12345));
  });
});

describe("getTrailNumber", () => {
  it("anchor day is #1 and it advances daily", () => {
    const anchor = new Date(TRAIL_ANCHOR_DAY * DAY_MS);
    const d1 = new Date(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate());
    expect(getTrailNumber(d1)).toBe(1);
    const d10 = new Date(d1); d10.setDate(d10.getDate() + 9);
    expect(getTrailNumber(d10)).toBe(10);
  });
});

describe("buildTrailShareText", () => {
  it("spoiler-free grid with score, streak and the /trail link", () => {
    const a1 = gradeTrail(["Everton", "Watford", "Villa", "ManUtd", "Inter", "Villa"], CAREER);
    const a2 = gradeTrail(CAREER, CAREER);
    const text = buildTrailShareText([a1, a2], { number: 128, won: true, streak: 7 });
    expect(text).toContain(`Transfer Trail #128 — 2/${TRAIL_MAX_ATTEMPTS}`);
    expect(text).toContain("🔥 7-day streak");
    expect(text).toContain("🟩🟩🟩🟩🟩🟩");
    expect(text).toContain("balliq.app/trail");
    // No club names anywhere in the share text.
    for (const club of CAREER) expect(text).not.toContain(club);
  });

  it("loss reads X/5 with no streak line", () => {
    const a = gradeTrail(["Everton", "Watford", "Villa", "ManUtd", "Inter", "Villa"], CAREER);
    const text = buildTrailShareText([a, a, a, a, a], { number: 128, won: false, streak: 0 });
    expect(text).toContain(`X/${TRAIL_MAX_ATTEMPTS}`);
    expect(text).not.toContain("streak");
  });
});
