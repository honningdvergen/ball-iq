import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// MP was the only mode whose completion event paid XP but never persisted a
// score — measured 2026-08-28: ZERO mp rows in `scores` across a week of daily
// ended rooms. Finished games vanished from server history, and the guest
// "save your stats" upgrade pitch was empty for MP-only guests (8 of 11).
//
// AppInner renders in no unit test (the TDZ incident proved a broken AppInner
// keeps a green build), so this gate reads the source: the biq:mp-completed
// listener must persist via saveScore, and the emitter must pass the question
// count it alone knows.
const app = readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");
const omp = readFileSync(new URL("../../src/screens/OnlineMultiplayer.jsx", import.meta.url), "utf8");

describe("finished MP games persist like every other mode", () => {
  it("the biq:mp-completed listener writes a score row", () => {
    const i = app.indexOf("const onMpDone");
    expect(i, "onMpDone listener missing from App.jsx").toBeGreaterThan(-1);
    const block = app.slice(i, app.indexOf("addEventListener('biq:mp-completed'", i));
    expect(block, "onMpDone pays XP but no longer persists the game").toMatch(/saveScore\(/);
    expect(block, "the row must be labelled as multiplayer").toMatch(/game_mode:\s*`mp:/);
  });

  it("the ended emitter passes the room's question count", () => {
    const i = omp.indexOf("'biq:mp-completed'");
    expect(i, "ended emitter missing from OnlineMultiplayer.jsx").toBeGreaterThan(-1);
    const block = omp.slice(i, i + 700);
    expect(block, "detail.total dropped — the listener would write null totals forever").toMatch(/total:/);
  });
});
