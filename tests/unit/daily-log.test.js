import { describe, it, expect } from "vitest";
import { QB } from "../../src/questions.js";
import { pickDailyQuestions, warmUpFirst, DAILY_MIX } from '../../src/lib/dailyDraw.js';
import DAILY_LOG from "../../src/data/dailyLog.js";

// ⚠️ WHAT THIS PROTECTS, AND WHAT IT COST TO LEARN (player report, 2026-08-19).
// pickDailyQuestions shuffled the LIVE bank, so adding or removing ONE question
// changed all seven questions of today's daily AND of every past one. `/c/`
// challenge links resolved to a different quiz than was shared; "shared by
// everyone today" was false across any deploy. Same trap as Footle's and
// Trail's answer logs — this is the third mode in that family, and the last.
const EXTRA = { id: "q_TEST_ONLY", q: "t", o: ["a", "b", "c", "d"], a: 0, type: "mcq", cat: "PL", diff: "medium" };
const ids = (qs) => qs.map((q) => q.id);

describe("Daily 7 is frozen against bank changes", () => {
  it("a logged day does not move when a question is ADDED", () => {
    for (const offset of [0, 1, 7, 60, 399]) {
      const d = DAILY_LOG.anchor + offset;
      expect(ids(pickDailyQuestions([...QB, EXTRA], d)), `day +${offset}`)
        .toEqual(ids(pickDailyQuestions(QB, d)));
    }
  });

  it("a logged day survives a question being DELETED — never a short day", () => {
    const d = DAILY_LOG.anchor + 3;
    const served = ids(pickDailyQuestions(QB, d));
    const without = pickDailyQuestions(QB.filter((q) => q.id !== served[0]), d);
    expect(without).toHaveLength(7);
    // Only the missing slot refills; the other six are untouched.
    for (const keep of served.slice(1)) expect(ids(without)).toContain(keep);
  });

  it("every logged day resolves to 7 real questions today", () => {
    const byId = new Set(QB.map((q) => q.id));
    const broken = DAILY_LOG.days
      .map((day, i) => ({ i, missing: day.filter((id) => !byId.has(id)) }))
      .filter((r) => r.missing.length);
    // A few unresolvable ids are survivable (they top up), but they mean the
    // bank has drifted from the log — worth seeing rather than silently healing.
    expect(broken.slice(0, 5)).toEqual([]);
  });

  it("logs no duplicate question within a single day", () => {
    const dupes = DAILY_LOG.days.filter((day) => new Set(day).size !== day.length);
    expect(dupes).toEqual([]);
  });

  // ── THE MIX (Alex, 13 Oct 2026) ────────────────────────────────────────────
  // History, because this test replaced its opposite. 19 Aug: "a free point
  // does not belong in the daily" (one player called out an easy Kane
  // question), and easy questions were dropped. The daily then averaged 3.2 of
  // 7 over three weeks, a third of results were 2 or less, and Alex scored 3
  // himself: "make it easier ... get the average up to 4 correct", "mix
  // difficulty level throughout the quiz, do not make them gradually harder".
  //
  // Log index 57 is 15 Oct 2026, the first day that could not have been served
  // when the rule changed (today and tomorrow are always kept).
  const MIX_FROM = 57;
  const byId = new Map(QB.map((q) => [q.id, q]));
  const diffsOf = (day) => day.map((id) => byId.get(id)?.diff);
  const count = (arr, d) => arr.filter((x) => x === d).length;

  it("every day from 15 Oct is two easy, four medium and one hard", () => {
    expect(DAILY_MIX).toEqual([["easy", 2], ["medium", 4], ["hard", 1]]);
    const off = [];
    DAILY_LOG.days.slice(MIX_FROM).forEach((day, i) => {
      const d = diffsOf(day);
      if (count(d, "easy") !== 2 || count(d, "medium") !== 4 || count(d, "hard") !== 1) off.push({ day: i + MIX_FROM, d });
    });
    expect(off.slice(0, 3)).toEqual([]);
  });

  it("days served before the rule changed are untouched: none of them holds an easy question", () => {
    const off = [];
    DAILY_LOG.days.slice(2, MIX_FROM).forEach((day, i) => { if (diffsOf(day).includes("easy")) off.push(i + 2); });
    expect(off).toEqual([]);
  });

  it("the order is mixed, not a ramp: the hard one and the easy ones land in every slot they may", () => {
    const hardAt = Array(7).fill(0), easyAt = Array(7).fill(0);
    let ramps = 0;
    const rank = { easy: 0, medium: 1, hard: 2 };
    const days = DAILY_LOG.days.slice(MIX_FROM);
    for (const day of days) {
      const d = diffsOf(day);
      d.forEach((x, k) => { if (x === "hard") hardAt[k]++; if (x === "easy") easyAt[k]++; });
      if (d.every((x, k) => k === 0 || rank[x] >= rank[d[k - 1]])) ramps++;
    }
    expect(hardAt[0], "Q1 is never the hard one").toBe(0);
    for (let k = 1; k < 7; k++) expect(hardAt[k], `hard in slot ${k + 1}`).toBeGreaterThan(days.length / 14);
    for (let k = 0; k < 7; k++) expect(easyAt[k], `easy in slot ${k + 1}`).toBeGreaterThan(days.length / 9);
    // easy, easy, medium x4, hard in that order is one arrangement of 105: rare, never the rule
    expect(ramps).toBeLessThan(days.length / 20);
  });

  it("a fresh draw beyond the log follows the same mix and is the same every time it is asked", () => {
    for (const offset of [500, 750, 1000]) {
      const a = pickDailyQuestions(QB, DAILY_LOG.anchor + offset), b = pickDailyQuestions(QB, DAILY_LOG.anchor + offset);
      const d = a.map((q) => q.diff);
      expect([count(d, "easy"), count(d, "medium"), count(d, "hard")], `day +${offset}`).toEqual([2, 4, 1]);
      expect(d[0]).not.toBe("hard");
      expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
      expect(new Set(a.map((q) => q.id)).size).toBe(7);
    }
  });

  it("still serves 7 beyond the log horizon", () => {
    expect(pickDailyQuestions(QB, DAILY_LOG.anchor + DAILY_LOG.days.length + 10)).toHaveLength(7);
  });

  it("the log covers today — regenerate before it lapses", () => {
    const today = Math.floor(Date.UTC(
      new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(),
    ) / 86400000);
    expect(today).toBeGreaterThanOrEqual(DAILY_LOG.anchor);
    expect(DAILY_LOG.anchor + DAILY_LOG.days.length).toBeGreaterThan(today);
  });
});

// Alex, 2026-10-04: "Medium warm-up Q1". Q1 was right 57% of the time when
// medium and 39% when hard (30 days of Daily 7 answers). Days already served
// when the rule landed (through 2026-10-05, log index 47) are exempt. Since
// the mix of 13 Oct the rule is "never hard": Q1 may be one of the easy ones.
describe("Daily 7 never opens on the hard question", () => {
  const WARMUP_FROM = 48;
  it("every unserved logged day opens on a medium or an easy question", () => {
    const byId = new Map(QB.map((q) => [q.id, q]));
    const offenders = DAILY_LOG.days.slice(WARMUP_FROM)
      .map((day, i) => ({ day: i + WARMUP_FROM, diff: byId.get(day[0])?.diff }))
      .filter((r) => r.diff === "hard" || !r.diff);
    expect(offenders.slice(0, 5)).toEqual([]);
  });

  it("an easy opener is left alone", () => {
    const q = (id, diff) => ({ id, diff });
    const day = [q("e1", "easy"), q("h2", "hard")];
    expect(warmUpFirst(day, [q("m9", "medium")])).toBe(day);
  });

  it("only Q1 moves: a hard opener is replaced, Q2 to Q7 keep their slots", () => {
    const q = (id, diff) => ({ id, diff });
    const day = [q("h1", "hard"), q("m2", "medium"), q("h3", "hard"), q("h4", "hard"), q("h5", "hard"), q("h6", "hard"), q("h7", "hard")];
    const out = warmUpFirst(day, [...day, q("m8", "medium")]);
    expect(out.map((x) => x.id)).toEqual(["m8", "m2", "h3", "h4", "h5", "h6", "h7"]);
    expect(warmUpFirst(out, [])).toBe(out);
  });
});
