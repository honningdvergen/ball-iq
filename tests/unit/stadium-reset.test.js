import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("../../src/screens/StadiumGame.jsx", import.meta.url)), "utf8");

/**
 * Stadiums is a completion run, and its progress is per-league in localStorage
 * under `biq_stadiums_v1_<leagueId>`. `resetRun` always existed but was
 * rendered only inside the `done` block, so a player stuck part-way — or one
 * who wanted a clean run after revealing letters — had no way back.
 */
describe("Stadiums can be reset per league, mid-run", () => {
  it("resetRun clears the whole per-league state", () => {
    const fn = SRC.slice(SRC.indexOf("const resetRun"), SRC.indexOf("const resetRun") + 400);
    // Every field of the saved shape must be reset. Leaving `letters` behind
    // would keep revealed hints on a "fresh" board, which is worse than no
    // reset at all because it looks like it worked.
    for (const field of ["solved", "clubsHidden", "letters", "gaveUp"]) {
      expect(fn, `resetRun does not clear ${field}`).toMatch(new RegExp(`${field}:`));
    }
  });

  it("the reset is reachable while a run is in progress, not only when done", () => {
    // Anchor on the guard, not on position: the control must be gated on
    // having progress, NOT on `done`.
    expect(SRC).toMatch(/\(solvedSet\.size > 0 \|\| hintsUsed > 0\) && \(/);
    // And it must sit outside the done block. The done block is the last
    // `{done && (` in the file; the reset guard has to appear before it.
    const guard = SRC.indexOf("(solvedSet.size > 0 || hintsUsed > 0) && (");
    const doneBlock = SRC.indexOf("{done && (");
    expect(guard, "reset control not found").toBeGreaterThan(-1);
    expect(guard, "the reset is inside the done block again").toBeLessThan(doneBlock);
  });

  it("destructive action is confirmed, and the confirm cannot leak between runs", () => {
    expect(SRC, "no two-tap confirm — one stray tap would wipe a run").toMatch(/confirmReset/);
    const fn = SRC.slice(SRC.indexOf("const resetRun"), SRC.indexOf("const resetRun") + 400);
    expect(fn, "resetRun must disarm the confirm or it survives into the next run")
      .toMatch(/setConfirmReset\(false\)/);
  });
});
