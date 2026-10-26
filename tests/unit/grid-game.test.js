import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  GRID, GRID_ANCHOR_DAY, GRID_GUESSES, GRID_LIVE, gridNumber, gridForDay, toJudgePool,
  judgeCell, judgePick, judgeTyped, cellAnswers, gridMessage,
  freshGrid, restoreGrid, gridOver, buildGridShareText,
} from "../../src/lib/grid.js";
import { dayIndexForDate } from "../../src/lib/date.js";
import { buildPool } from "../../scripts/build-grid-pool.mjs";
import en from "../../src/i18n/en.js";
import es from "../../src/i18n/es.js";

const read = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8"));
const SCHEDULE = read("../../src/data/gridSchedule.json");
const HEADERS = read("../../src/data/gridHeaders.json");
const GRID_POOL = read("../../src/data/gridPool.json");
const NAMES = read("../../src/data/mysteryPool.json");
const POOL = toJudgePool(GRID_POOL, NAMES);
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);

describe("the daily board", () => {
  it("is hidden from Home until Alex has played it", () => {
    expect(GRID_LIVE).toBe(false);
  });

  it("counts days the way the other dailies do, from the schedule's own anchor", () => {
    const [y, m, d] = SCHEDULE.anchor.split("-").map(Number);
    expect(dayIndexForDate(new Date(y, m - 1, d))).toBe(GRID_ANCHOR_DAY);
    expect(gridNumber(GRID_ANCHOR_DAY)).toBe(1);
    expect(GRID_GUESSES).toBe(9);
  });

  it("serves the frozen day, and nothing outside the schedule", () => {
    const first = gridForDay(SCHEDULE, GRID_ANCHOR_DAY);
    expect(first).toEqual({ rows: SCHEDULE.days[0].r, cols: SCHEDULE.days[0].c, number: 1 });
    expect(gridForDay(SCHEDULE, GRID_ANCHOR_DAY - 1)).toBeNull();
    expect(gridForDay(SCHEDULE, GRID_ANCHOR_DAY + SCHEDULE.days.length - 1)?.number).toBe(SCHEDULE.days.length);
    expect(gridForDay(SCHEDULE, GRID_ANCHOR_DAY + SCHEDULE.days.length)).toBeNull();
  });

  it("every scheduled club has a header: a short name, letters, and a colour or none", () => {
    for (const d of SCHEDULE.days) for (const c of [...d.r, ...d.c]) {
      const h = HEADERS[c];
      expect(h, c).toBeTruthy();
      expect(h.s.length, c).toBeLessThanOrEqual(14);
      expect(h.a, c).toMatch(/^[A-Z]{2,3}$/);
      expect(h.h === null || /^#[0-9A-F]{6}$/i.test(h.h), c).toBe(true);
    }
  });
});

describe("the pool the client judges with", () => {
  it("is what scripts/build-grid-pool.mjs builds today, not a stale copy", () => {
    // Re-run `node scripts/build-grid-pool.mjs --write` after any change to the
    // careers or the curation rules.
    const P = buildPool();
    expect(P.fail).toEqual([]);
    expect(GRID_POOL.c).toEqual(P.clubs);
    expect(GRID_POOL.p).toEqual(P.players);
  });
});

/**
 * ⭐ THE DATA CHECK. Every board still to come must be solvable: each of its
 * nine cells has at least three players the judge accepts when their name is
 * typed, and every header club exists in the pool. Days already played are not
 * checked: the schedule is frozen, and a past board cannot be fixed.
 * (Past the schedule's last day this checks nothing; gridForDay then returns
 * null and the screen says there is no grid.)
 */
describe("every board from today to the end of the schedule", () => {
  const today = dayIndexForDate(new Date());
  const from = Math.max(0, gridNumber(today) - 1);
  const days = SCHEDULE.days.slice(from);

  it("has every header club in the pool", () => {
    const clubs = new Set(POOL.clubs);
    for (const d of days) for (const c of [...d.r, ...d.c]) expect(clubs.has(c), c).toBe(true);
  });

  it("has at least three accepted answers in every cell", () => {
    let low = Infinity, at = null;
    days.forEach((d, k) => {
      for (const r of d.r) for (const c of d.c) {
        const n = cellAnswers(POOL, r, c).length;
        if (n < low) { low = n; at = `#${from + k + 1} ${r} × ${c}`; }
        expect(n, `#${from + k + 1} ${r} × ${c}`).toBeGreaterThanOrEqual(3);
      }
    });
    if (days.length) console.log(`  grid data check: ${days.length} days from #${from + 1}, lowest cell ${low} (${at})`);
  });

  it("cellAnswers agrees with judgeCell over the FULL index (today's board)", () => {
    const d = days[0];
    if (!d) return;
    for (const r of d.r) for (const c of d.c) {
      for (const p of cellAnswers(POOL, r, c).slice(0, 3)) {
        const v = judgeCell(POOL, p.name, r, c);
        expect(v.result, `${p.name} for ${r} × ${c}`).toBe(GRID.CORRECT);
        expect(v.player.id).toBe(p.id);
      }
    }
  });
});

describe("judging a guess", () => {
  const P = {
    clubs: ["Arsenal F.C.", "Chelsea F.C.", "Manchester United F.C."],
    players: { a: [0, 1], b: [0, 2], c: [0, 1] },
    index: [
      { id: "b", name: "Danilo" },          // Arsenal + United
      { id: "a", name: "Danilo" },          // Arsenal + Chelsea, same name, later in the index
      { id: "c", name: "Ashley Cole" },
      { id: "d", name: "Joe Cole" },
    ],
  };

  it("a picked suggestion is judged as that player, not a namesake", () => {
    expect(judgePick(P, P.index[1], "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.CORRECT);
    // Typed, the name resolves to the first Danilo, whom we cannot confirm.
    expect(judgeTyped(P, "Danilo", "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.UNCONFIRMED);
  });

  it("a shared surname asks which one, rather than saying there is nobody", () => {
    expect(judgeTyped(P, "Cole", "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.AMBIGUOUS);
    expect(judgeTyped(P, "Ashley Cole", "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.CORRECT);
    expect(judgeTyped(P, "Zidane", "Arsenal F.C.", "Chelsea F.C.").result).toBe(GRID.UNKNOWN);
  });

  it("an example answer is only one the judge takes when typed", () => {
    // The second Danilo played for both, but typing "Danilo" reaches the first.
    expect(cellAnswers(P, "Arsenal F.C.", "Chelsea F.C.").map((p) => p.id)).toEqual(["c"]);
  });
});

describe("the saved board", () => {
  it("restores a sound board and refuses a broken one", () => {
    const g = { cells: [{ id: "x", name: "X" }, null, null, null, null, null, null, null, null], left: 7, gaveUp: false };
    expect(restoreGrid(g)).toEqual(g);
    expect(restoreGrid(freshGrid())).toEqual(freshGrid());
    expect(restoreGrid(null)).toBeNull();
    expect(restoreGrid({ ...g, cells: g.cells.slice(0, 8) })).toBeNull();
    expect(restoreGrid({ ...g, left: 10 })).toBeNull();
    // More filled cells than guesses spent.
    expect(restoreGrid({ ...g, left: 9 })).toBeNull();
    // A player used twice.
    expect(restoreGrid({ ...g, left: 5, cells: [g.cells[0], g.cells[0], ...g.cells.slice(2)] })).toBeNull();
  });

  it("is over with no guesses left, nine names, or a give-up", () => {
    expect(gridOver(freshGrid())).toBe(false);
    expect(gridOver({ ...freshGrid(), left: 0 })).toBe(true);
    expect(gridOver({ ...freshGrid(), gaveUp: true })).toBe(true);
    expect(gridOver({ cells: Array(9).fill({ id: "x", name: "X" }), left: 0, gaveUp: false })).toBe(true);
  });

  it("shares as squares, row by row, and names nobody", () => {
    const cells = [{ id: "a", name: "Giroud" }, null, null, null, { id: "b", name: "Cole" }, null, null, null, null];
    expect(buildGridShareText({ cells, head: "H", url: "U" })).toBe("H\n🟩⬛⬛\n⬛🟩⬛\n⬛⬛⬛\nU");
  });
});

describe("the words", () => {
  const v = { name: "Danny Welbeck", row: "Arsenal", col: "Chelsea" };
  it("the screen's English is gridMessage's, word for word", () => {
    const pl = { name: v.name };
    expect(fill(en["grid.correct"], v)).toBe(gridMessage(GRID.CORRECT, pl, "Arsenal F.C.", "Chelsea F.C."));
    expect(fill(en["grid.unconfirmed"], v)).toBe(gridMessage(GRID.UNCONFIRMED, pl, "Arsenal F.C.", "Chelsea F.C."));
    expect(en["grid.ambiguous"]).toBe(gridMessage(GRID.AMBIGUOUS, null));
    expect(en["grid.unknown"]).toBe(gridMessage(GRID.UNKNOWN, null));
  });

  it("⚠️ an unconfirmed guess is never called wrong, in either language", () => {
    expect(en["grid.unconfirmed"]).not.toMatch(/never|didn't|did not|wrong|incorrect/i);
    expect(es["grid.unconfirmed"]).toMatch(/no podemos confirmar/i);
    expect(es["grid.unconfirmed"]).not.toMatch(/nunca|no jugó|incorrect|equivocad|mal\b/i);
    for (const k of ["grid.unknown", "grid.ambiguous"]) {
      expect(en[k]).not.toMatch(/never|didn't|did not|wrong/i);
      expect(es[k]).not.toMatch(/nunca|no jugó|incorrect|equivocad/i);
    }
  });
});
