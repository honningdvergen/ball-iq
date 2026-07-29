import { describe, it, expect } from "vitest";
import {
  TRAIL_PLAYERS, TRAIL_ANSWER_LOG, TRAIL_ANCHOR_DAY,
  getTrailAnswerForDayIndex, getTrailNumber,
} from "../../src/lib/trail.js";

// Transfer Trail's schedule was frozen 2026-07-29 for a 2026-08-01 launch.
// Everything here guards a promise that fails SILENTLY — the mode keeps
// working, it just hands people a different puzzle than their friends got,
// which is precisely what makes a shared grid meaningless.

const dayIndex = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};

describe("Trail schedule is frozen", () => {
  it("has not moved the anchor — Trail #1 is 2026-08-01", () => {
    // Once a puzzle number is public it is the token that makes strangers'
    // grids comparable. Moving the anchor renumbers every past puzzle.
    expect(TRAIL_ANCHOR_DAY).toBe(dayIndex("2026-08-01"));
    expect(getTrailNumber(new Date("2026-08-01T12:00:00Z"))).toBe(1);
  });

  it("stays dark before launch rather than serving puzzle #0", () => {
    expect(getTrailAnswerForDayIndex(dayIndex("2026-07-31"))).toBeNull();
  });

  it("pins the opening week", () => {
    // Literals on purpose: if a reshuffle ever changes these, that is the
    // failure, not the test.
    expect(TRAIL_ANSWER_LOG.slice(0, 4)).toEqual(
      ["TORRES", "GILBERTO_SILVA", "RONALDO_C", "RAMOS"]
    );
  });

  it("only schedules careers that actually exist", () => {
    const keys = new Set(TRAIL_PLAYERS.map((p) => p.key));
    expect(TRAIL_ANSWER_LOG.filter((k) => !keys.has(k))).toEqual([]);
  });

  it("never repeats a career on consecutive days", () => {
    const adjacent = TRAIL_ANSWER_LOG.filter((k, i) => i > 0 && k === TRAIL_ANSWER_LOG[i - 1]);
    expect(adjacent).toEqual([]);
  });

  it("uses every career an equal number of times", () => {
    const counts = {};
    for (const k of TRAIL_ANSWER_LOG) counts[k] = (counts[k] || 0) + 1;
    const seen = Object.values(counts);
    expect(Math.min(...seen)).toBe(Math.max(...seen));
    expect(Object.keys(counts).length).toBe(TRAIL_PLAYERS.length);
  });

  it("obeys the locked editorial rules on every career", () => {
    for (const p of TRAIL_PLAYERS) {
      expect(p.clubs.length, `${p.key} rungs`).toBeLessThanOrEqual(6);
      expect(p.clubs.length, `${p.key} clubs/loans aligned`).toBe(p.loans.length);
      expect(p.display).toHaveLength(2);
    }
  });
});
