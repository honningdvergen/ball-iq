import { describe, it, expect } from "vitest";
import { judgeCell, gridMessage, shortClub, GRID } from "../../src/lib/grid.js";

/**
 * ⭐ THE GRID MAY NEVER TELL A PLAYER WHO IS RIGHT THAT THEY ARE WRONG.
 *
 * Our career data is a curated subset of football. Measured 2026-09-11:
 * Arsenal × Chelsea holds 21 players in our pool, and the real figure is
 * higher. So "not in our record" and "did not happen" are different claims,
 * and only the first one is ours to make. This suite pins that distinction,
 * because it is the kind of thing a later copy edit quietly destroys.
 */
const POOL = {
  clubs: ["Arsenal F.C.", "Chelsea F.C.", "Manchester United F.C."],
  players: {
    giroud: [0, 1],      // both
    welbeck: [0, 2],     // Arsenal + United, not Chelsea
    noclubs: undefined,  // known name, no career rows
  },
  index: [
    { id: "giroud", name: "Olivier Giroud" },
    { id: "welbeck", name: "Danny Welbeck" },
    { id: "noclubs", name: "Faiq Bolkiah" },
  ],
};

describe("the grid's answer key", () => {
  it("accepts a player we hold for both clubs", () => {
    const r = judgeCell(POOL, "Giroud", "Arsenal F.C.", "Chelsea F.C.");
    expect(r.result).toBe(GRID.CORRECT);
    expect(r.player.name).toBe("Olivier Giroud");
  });

  it("takes a surname alone — that is how people type", () => {
    expect(judgeCell(POOL, "giroud", "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.CORRECT);
    expect(judgeCell(POOL, "  Olivier Giroud  ", "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.CORRECT);
  });

  it("⚠️ says UNCONFIRMED, never wrong, when our record lacks a club", () => {
    const r = judgeCell(POOL, "Welbeck", "Arsenal F.C.", "Chelsea F.C.");
    expect(r.result).toBe(GRID.UNCONFIRMED);
    // The distinction only matters if it reaches the words.
    const msg = gridMessage(r.result, r.player, "Arsenal F.C.", "Chelsea F.C.");
    expect(msg).toMatch(/can't confirm/i);
    expect(msg).not.toMatch(/never|didn't|did not|wrong|incorrect/i);
  });

  it("a player with no career rows is unconfirmed, not accepted", () => {
    // Faiq Bolkiah carried Arsenal AND Chelsea in the raw harvest, both with no
    // years — academy spells. Unfiltered he answered this exact cell. A pool
    // entry with no career must never resolve to CORRECT.
    expect(judgeCell(POOL, "Bolkiah", "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.UNCONFIRMED);
  });

  it("an unknown name is unknown, and the copy does not accuse", () => {
    const r = judgeCell(POOL, "Zinedine Zidane", "Arsenal F.C.", "Chelsea F.C.");
    expect(r.result).toBe(GRID.UNKNOWN);
    expect(gridMessage(r.result, r.player, "Arsenal F.C.", "Chelsea F.C."))
      .not.toMatch(/never|didn't|did not/i);
  });

  it("empty input is not a guess", () => {
    expect(judgeCell(POOL, "", "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.UNKNOWN);
    expect(judgeCell(POOL, "   ", "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.UNKNOWN);
  });

  it("club suffixes are noise in a sentence", () => {
    expect(shortClub("Arsenal F.C.")).toBe("Arsenal");
    expect(shortClub("Beşiktaş J.K. (Football)")).toBe("Beşiktaş J.K.");
    expect(shortClub("Real Madrid Club de Fútbol")).toBe("Real Madrid");
    expect(shortClub("Inter Milan")).toBe("Inter Milan");
  });
});

describe("the curated pool keeps its promises", () => {
  it("⚠️ drops yearless spells, which are the false-positive class", async () => {
    // Source-level: this is a data rule, and a data rule that lives only in a
    // generated file is a rule nobody can see.
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const SRC = readFileSync(fileURLToPath(new URL("../../scripts/build-grid-pool.mjs", import.meta.url)), "utf8");
    expect(SRC).toMatch(/spells\.filter\(\(s\) => s\[1\] != null\)/);
  });
});
