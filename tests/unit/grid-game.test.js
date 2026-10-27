import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  GRID, GRID_ANCHOR_DAY, GRID_GUESSES, GRID_LIVE, GRID_FLAGS, gridNumber, gridForDay, toJudgePool,
  judgeCell, judgePick, judgeTyped, cellAnswers, gridMessage, headerKind, fits, rarityScore,
  freshGrid, restoreGrid, gridOver, gridRarity, buildGridShareText,
  freshDuel, duelAction, duelPlay, duelPass, duelLine, DUEL_STEALS,
} from "../../src/lib/grid.js";
import { dayIndexForDate } from "../../src/lib/date.js";
import { buildDailyPool, overlapYears } from "../../scripts/build-grid-pool.mjs";
import en from "../../src/i18n/en.js";
import es from "../../src/i18n/es.js";

const read = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8"));
const SCHEDULE = read("../../src/data/gridSchedule.json");
const KITS = read("../../src/data/gridKits.json");
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

  it("every scheduled club has a kit: a short name, a pattern and two colours", () => {
    const PATTERNS = ["solid", "stripes", "hoops", "halves", "sash", "sleeves", "centre", "diagonal", "band"];
    for (const [club, k] of Object.entries(KITS)) {
      expect(Object.keys(k).sort(), club).toEqual(["c1", "c2", "p", "s"]);
      expect(k.s.length, club).toBeLessThanOrEqual(14);
      expect(PATTERNS, club).toContain(k.p);
      expect(k.c1, club).toMatch(/^#[0-9A-F]{6}$/i);
      expect(k.c2, club).toMatch(/^#[0-9A-F]{6}$/i);
      expect(k.c1.toUpperCase(), `${club}: a pattern in one colour is a plain shirt`).not.toBe(k.c2.toUpperCase());
    }
    let clubs = 0;
    for (const d of [...SCHEDULE.days, ...SCHEDULE.duels]) for (const h of [...d.r, ...d.c]) {
      if (headerKind(h).t !== "club") continue;
      clubs++;
      expect(KITS[h], h).toBeTruthy();
    }
    expect(clubs).toBeGreaterThan(1000);
  });

  it("every other header has a flag or a name, in both languages", () => {
    for (const d of [...SCHEDULE.days, ...SCHEDULE.duels]) for (const h of [...d.r, ...d.c]) {
      const k = headerKind(h);
      if (k.t === "nat" || k.t === "in") {
        expect(GRID_FLAGS[k.v], h).toBeTruthy();
        expect(en[`grid.country.${k.v}`], h).toBeTruthy();
        expect(es[`grid.country.${k.v}`], h).toBeTruthy();
      }
      if (k.t === "with") expect(SCHEDULE.stars[k.v], h).toBeTruthy();
    }
  });

  it("columns are clubs, at most one row is not, and no board repeats", () => {
    const all = [...SCHEDULE.days, ...SCHEDULE.duels];
    expect(SCHEDULE.days.length).toBe(180);
    for (const d of all) {
      expect(d.c.every((h) => headerKind(h).t === "club"), d.c.join()).toBe(true);
      expect(d.r.filter((h) => headerKind(h).t !== "club").length).toBeLessThanOrEqual(1);
      expect(new Set([...d.r, ...d.c]).size).toBe(6);
    }
    const sigs = all.map((d) => [...d.r].sort().join("|") + "::" + [...d.c].sort().join("|"));
    expect(new Set(sigs).size).toBe(all.length);
    // Every kind of row is in the schedule.
    const kinds = new Set(SCHEDULE.days.flatMap((d) => d.r.map((h) => headerKind(h).t)));
    expect([...kinds].sort()).toEqual(["club", "in", "nat", "with"]);
  });
});

describe("the pool the client judges with", () => {
  it("is what scripts/build-grid-pool.mjs builds today, not a stale copy", () => {
    // Re-run `node scripts/build-grid-pool.mjs --write` after any change to the
    // careers, the curation rules or grid-club-countries.mjs.
    const P = buildDailyPool();
    expect(P.fail).toEqual([]);
    expect(P.missingCountryClubs).toEqual([]);
    expect(GRID_POOL).toEqual(P.daily);
  });

  it("teammates share a club for a full season, never just a calendar year", () => {
    expect(overlapYears([0, 2004, 2005], [0, 2005, 2010])).toBe(0);
    expect(overlapYears([0, 2004, 2006], [0, 2005, 2010])).toBe(1);
    expect(overlapYears([0, 2023, null], [0, 2020, null])).toBeGreaterThanOrEqual(1);
  });
});

/**
 * ⭐ THE DATA CHECK. Every board still to come must be solvable: each of its
 * nine cells has at least the schedule's floor of players (8) the judge accepts
 * when their name is typed, and every header club exists in the pool. Days
 * already played are not checked: the schedule is frozen, and a past board
 * cannot be fixed. The two-player boards are all checked: any can be dealt.
 * (Past the schedule's last day this checks nothing; gridForDay then returns
 * null and the screen says there is no grid.)
 */
describe("every board from today to the end of the schedule", () => {
  const today = dayIndexForDate(new Date());
  const from = Math.max(0, gridNumber(today) - 1);
  const days = SCHEDULE.days.slice(from).map((d, k) => ({ ...d, at: `#${from + k + 1}` }));
  const boards = [...days, ...SCHEDULE.duels.map((d, k) => ({ ...d, at: `duel ${k + 1}` }))];

  it("has every header club in the pool", () => {
    const clubs = new Set(POOL.clubs);
    for (const d of boards) for (const c of [...d.r, ...d.c]) if (headerKind(c).t === "club") expect(clubs.has(c), c).toBe(true);
  });

  it("has at least the floor of accepted answers in every cell", () => {
    const low = {};
    for (const d of boards) {
      for (const r of d.r) for (const c of d.c) {
        const n = cellAnswers(POOL, r, c).length;
        const kind = headerKind(r).t;
        if (!low[kind] || n < low[kind].n) low[kind] = { n, at: `${d.at} ${r} × ${c}` };
        expect(n, `${d.at} ${r} × ${c}`).toBeGreaterThanOrEqual(SCHEDULE.minAnswers);
      }
    }
    console.log(`  grid data check: ${days.length} days from #${from + 1} and ${SCHEDULE.duels.length} two-player boards; lowest cell by row kind: ${Object.entries(low).map(([k, v]) => `${k} ${v.n} (${v.at})`).join(" · ")}`);
  });

  it("cellAnswers agrees with judgeCell over the FULL index (one board of each kind)", () => {
    const kinds = new Set();
    for (const d of boards) {
      const kind = d.r.map((h) => headerKind(h).t).find((t) => t !== "club") || "club";
      if (kinds.has(kind)) continue;
      kinds.add(kind);
      for (const r of d.r) for (const c of d.c) {
        for (const p of cellAnswers(POOL, r, c).slice(0, 3)) {
          const v = judgeCell(POOL, p.name, r, c);
          expect(v.result, `${p.name} for ${r} × ${c}`).toBe(GRID.CORRECT);
          expect(v.player.id).toBe(p.id);
        }
      }
    }
    expect(kinds.size).toBe(4);
  });
});

describe("judging the squares that are not clubs, on the real data", () => {
  const BARCA = "FC Barcelona";
  it("a nationality", () => {
    expect(judgeCell(POOL, "Sergio Agüero", "nat:Argentina", "Manchester City F.C.").result).toBe(GRID.CORRECT);
    expect(judgeCell(POOL, "Sergio Agüero", "nat:Brazil", "Manchester City F.C.").result).toBe(GRID.UNCONFIRMED);
  });
  it("a country, through a club placed in it", () => {
    expect(judgeCell(POOL, "Luka Modrić", "in:Spain", "Tottenham Hotspur F.C.").result).toBe(GRID.CORRECT);
    expect(judgeCell(POOL, "Mesut Özil", "in:England", "Real Madrid Club de Fútbol").result).toBe(GRID.CORRECT);
    expect(judgeCell(POOL, "Mesut Özil", "in:Italy", "Real Madrid Club de Fútbol").result).toBe(GRID.UNCONFIRMED);
  });
  it("a teammate, and never the star himself", () => {
    expect(judgeCell(POOL, "Carles Puyol", "with:Q615", BARCA).result).toBe(GRID.CORRECT);
    // Rivaldo left Barcelona in 2002, Messi's first season was 2004-05.
    expect(judgeCell(POOL, "Rivaldo", "with:Q615", BARCA).result).toBe(GRID.UNCONFIRMED);
    expect(judgeCell(POOL, "Lionel Messi", "with:Q615", BARCA).result).toBe(GRID.UNCONFIRMED);
    expect(fits(POOL, "Q615", "with:Q615")).toBe(false);
  });
  it("a header the pool has no data for is unconfirmed, not wrong", () => {
    expect(judgeCell({ ...POOL, mates: undefined }, "Carles Puyol", "with:Q615", BARCA).result).toBe(GRID.UNCONFIRMED);
    expect(judgeCell(POOL, "Carles Puyol", "in:Atlantis", BARCA).result).toBe(GRID.UNCONFIRMED);
  });
});

describe("the rarity score", () => {
  const A = [{ id: "a", fame: 200 }, { id: "b", fame: 100 }, { id: "c", fame: 100 }, { id: "d", fame: 30 }];
  it("scores the most famous answer lowest and the obscure end highest", () => {
    const s = A.map((p) => rarityScore(A, p.id));
    expect(s[0]).toBeLessThan(s[1]);
    expect(s[1]).toBe(s[2]); // equal fame, equal rank
    expect(s[2]).toBeLessThan(s[3]);
    for (const x of s) { expect(x).toBeGreaterThanOrEqual(1); expect(x).toBeLessThanOrEqual(99); }
  });
  it("counts a right answer outside the list as the rarest, and an empty cell as nothing", () => {
    expect(rarityScore(A, "zz")).toBe(rarityScore(A, "d"));
    expect(rarityScore([], "a")).toBe(0);
  });
  it("adds up over the board, and survives a reload", () => {
    const g = { ...freshGrid(), left: 7, cells: [{ id: "a", name: "A", pts: 60 }, { id: "b", name: "B", pts: 91 }, ...Array(7).fill(null)] };
    expect(gridRarity(g)).toBe(151);
    expect(gridRarity(restoreGrid(JSON.parse(JSON.stringify(g))))).toBe(151);
    expect(restoreGrid({ ...g, cells: [{ id: "a", name: "A", pts: 500 }, ...g.cells.slice(1)] }).cells[0].pts).toBe(0);
  });
  it("on today's board, the best-known answer scores below an obscure one", () => {
    const d = SCHEDULE.days[0];
    const all = cellAnswers(POOL, d.r[0], d.c[0]);
    expect(rarityScore(all, all[0].id)).toBeLessThan(rarityScore(all, all[all.length - 1].id));
  });
});

describe("two players, one phone", () => {
  const P = (id) => ({ id, name: id.toUpperCase() });
  const play = (s, i, id, result = GRID.CORRECT) => duelPlay(s, i, result, P(id));

  it("X moves first, marks alternate, and three in a row wins", () => {
    let s = freshDuel();
    expect(s.turn).toBe("X");
    let r;
    for (const [i, id] of [[0, "a"], [3, "b"], [1, "c"], [4, "d"]]) { r = play(s, i, id); s = r.state; }
    expect(r.outcome).toBe("placed");
    r = play(s, 2, "e");
    expect(r.outcome).toBe("won");
    expect(r.state.winner).toBe("X");
    expect(r.state.line).toEqual([0, 1, 2]);
    expect(duelAction(r.state, 8)).toBe("over");
  });

  it("an unconfirmed name passes the turn; an unknown one asks again", () => {
    const s = freshDuel();
    const u = play(s, 0, "a", GRID.UNCONFIRMED);
    expect(u.outcome).toBe("unconfirmed");
    expect(u.state.turn).toBe("O");
    expect(u.state.cells[0]).toBeNull();
    expect(play(s, 0, "a", GRID.UNKNOWN)).toEqual({ state: s, outcome: "retry" });
  });

  it("a steal takes the square with a different player, and there are three", () => {
    let s = play(freshDuel(), 4, "a").state;           // X holds the centre
    expect(duelAction(s, 4)).toBe("steal");               // O may steal it
    expect(play(s, 4, "a").outcome).toBe("used");         // ...but not with the same player
    const r = play(s, 4, "b");
    expect(r.outcome).toBe("stolen");
    expect(r.state.cells[4]).toMatchObject({ mark: "O", id: "b" });
    expect(r.state.steals).toEqual({ X: DUEL_STEALS, O: DUEL_STEALS - 1 });
    expect(duelAction(r.state, 4)).toBe("steal");         // X may steal it back
    s = { ...r.state, turn: "O" };
    expect(duelAction(s, 4)).toBe("own");
  });

  it("a failed steal is spent, and with none left a steal is refused", () => {
    let s = play(freshDuel(), 4, "a").state;
    s = play(s, 4, "b", GRID.UNCONFIRMED).state;
    expect(s.steals.O).toBe(DUEL_STEALS - 1);
    s = { ...s, turn: "O", steals: { X: 3, O: 0 } };
    expect(duelAction(s, 4)).toBe("noSteals");
  });

  it("a full board with no line goes to whoever still has steals, then is drawn", () => {
    // O X O / X X O / X O X: no line.
    const marks = "OXOXXOXOX".split("");
    const cells = marks.map((m, i) => ({ mark: m, id: `p${i}`, name: `P${i}` }));
    expect(duelLine(cells)).toBeNull();
    const s = { ...freshDuel(), cells, used: cells.map((c) => c.id), turn: "O", steals: { X: 0, O: 1 } };
    // X has no move, so O's pass ends the game.
    expect(duelPass(s).draw).toBe(true);
    // O spends the last steal without a line: nobody can move, a draw.
    const r = play(s, 6, "zz");
    expect(r.outcome).toBe("draw");
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
    const g = { cells: [{ id: "x", name: "X", pts: 0 }, null, null, null, null, null, null, null, null], left: 7, gaveUp: false };
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
    expect(buildGridShareText({ cells, head: "H", score: "S", url: "U" })).toBe("H\n🟩⬛⬛\n⬛🟩⬛\n⬛⬛⬛\nS\nU");
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
    for (const k of ["grid.unconfirmedNat", "grid.unconfirmedIn", "grid.unconfirmedWith"]) {
      expect(en[k], k).toMatch(/^We can't confirm /);
      expect(en[k], k).not.toMatch(/never|didn't|did not|wrong|incorrect/i);
      expect(es[k], k).toMatch(/no podemos confirmar/i);
      expect(es[k], k).not.toMatch(/nunca|no jugó|incorrect|equivocad|mal\b/i);
    }
  });

  it("every grid key is in both languages, with the same placeholders", () => {
    const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    for (const k of Object.keys(en).filter((k) => k.startsWith("grid.") || k.startsWith("share.grid"))) {
      expect(es[k], k).toBeTruthy();
      expect(vars(es[k]), k).toBe(vars(en[k]));
    }
  });
});
