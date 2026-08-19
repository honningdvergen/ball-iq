import { describe, it, expect } from "vitest";
import { QB } from "../../src/questions.js";
import { pickDailyQuestions } from "../../src/lib/quiz.js";
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

  // Alex, 2026-08-19: "a free point does not belong in the daily." Prompted by a
  // player calling out a Kane question that was correct, correctly labelled
  // easy, and free to anyone who follows football. The daily was carrying ~1.8
  // easy questions EVERY day — a quarter of the set. Same rule club and league
  // quizzes have always used; the daily is the most invested-fan surface there
  // is, since it is shared, compared and carries the streak.
  //
  // The first two logged days are exempt: they were already served when the
  // rule changed, and moving a served day is the bug this whole file prevents.
  it("no easy question is scheduled on any unserved day", () => {
    const byId = new Map(QB.map((q) => [q.id, q]));
    const offenders = [];
    DAILY_LOG.days.slice(2).forEach((day, i) => {
      for (const id of day) {
        if (byId.get(id)?.diff === "easy") offenders.push({ day: i + 2, id });
      }
    });
    expect(offenders.slice(0, 5)).toEqual([]);
  });

  it("a fresh draw never contains an easy question", () => {
    for (const offset of [500, 750, 1000]) {   // beyond the log: the live path
      const fresh = pickDailyQuestions(QB, DAILY_LOG.anchor + offset);
      expect(fresh.map((q) => q.diff), `day +${offset}`).not.toContain("easy");
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
