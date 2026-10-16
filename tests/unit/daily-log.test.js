import { describe, it, expect } from "vitest";
import { QB } from "../../src/questions.js";
import { pickDailyQuestions, warmUpFirst, DAILY_MIX, drawDailySchedule, hasHint } from '../../src/lib/dailyDraw.js';
import { logHash } from '../../src/lib/top10Hash.js';
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
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

// ── THE LOG DOES NOT MOVE UNTIL INSTALLED APPS CAN FOLLOW (16 Oct 2026) ──────
// The log of 13 Oct shuffles each difficulty afresh for every day, so days
// collide: 2,090 different questions in the 2,520 slots from 18 Oct, 272 of
// those 360 days holding a question already met, 76 repeats within 30 days
// and 7 within three (q_5de8ef on 26 and 28 Nov). drawDailySchedule (below)
// deals without replacement instead, but the log is NOT rebuilt yet: every
// build up to 1.8.1 (152) plays its own bundled copy, so a rebuilt future
// would split those phones from the website. The fetch door
// (lib/dailyRemote.js) ships first; the rebuild follows once a build that
// carries it is what players have.
describe("Daily 7 log: unchanged until the fetch door is in players' hands", () => {
  it("days 0 to 59 (through 17 Oct 2026) are byte-for-byte what they were", () => {
    expect(DAILY_LOG.anchor).toBe(20684);
    expect(logHash(DAILY_LOG.days.slice(0, 60).map((d) => d.join(",")))).toBe("c70cc5d6");
  });

  // ⚠️ Pinned on purpose. Until the log is rebuilt (`dealtFrom` appears), every
  // day is the 13 Oct log. After a rebuild, the days before it must still be:
  // days 0 to 81 (through 8 Nov) are pinned below for the planned
  // --regen-from 2026-11-09; a rebuild from an EARLIER date must update that
  // pin deliberately, in the same commit.
  it("until the rebuild, every day is still the 13 Oct log, byte for byte", () => {
    if (DAILY_LOG.dealtFrom != null) return;
    expect(DAILY_LOG.days).toHaveLength(420);
    expect(logHash(DAILY_LOG.days.map((d) => d.join(",")))).toBe("60105ee5");
  });

  it("days 0 to 81 (through 8 Nov 2026) never move", () => {
    expect(logHash(DAILY_LOG.days.slice(0, 82).map((d) => d.join(",")))).toBe("04adcf05");
  });

  it("from the first day dealt without replacement: no repeat, and every question explained", () => {
    const from = DAILY_LOG.dealtFrom;
    if (from == null) return;                   // not rebuilt yet (see above)
    const byId = new Map(QB.map((q) => [q.id, q]));
    const before = new Set(DAILY_LOG.days.slice(0, from).flat());
    const seen = new Set(), again = [], bare = [];
    DAILY_LOG.days.slice(from).forEach((day, i) => {
      for (const id of day) {
        if (seen.has(id) || before.has(id)) again.push(`${i + from}:${id}`);
        if (!hasHint(byId.get(id))) bare.push(`${i + from}:${id}`);
        seen.add(id);
      }
    });
    expect(again.slice(0, 5)).toEqual([]);
    expect(bare.slice(0, 5)).toEqual([]);
  });

  it("the log records how many leading days may have been served", () => {
    expect(DAILY_LOG.served).toBeGreaterThanOrEqual(60);
    expect(DAILY_LOG.served).toBeLessThanOrEqual(DAILY_LOG.days.length);
  });
});

// The planned rebuild, run here on the real log and the real bank without
// writing anything: what `--regen-from 2026-11-09` would deal.
describe("the planned rebuild from 9 Nov 2026, simulated", () => {
  const FROM = 82;
  const kept = DAILY_LOG.days.slice(0, FROM);
  const used = new Set(kept.flat());
  const dealt = drawDailySchedule(QB, DAILY_LOG.anchor + FROM, DAILY_LOG.days.length - FROM, used);

  it("deals the rest of the horizon with no repeat, nothing already in the kept days, every one explained", () => {
    const all = dealt.flat();
    expect(dealt).toHaveLength(DAILY_LOG.days.length - FROM);
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    expect(all.filter((q) => used.has(q.id))).toEqual([]);
    expect(all.filter((q) => !hasHint(q))).toEqual([]);
    for (const day of dealt) {
      const d = day.map((q) => q.diff);
      expect([d.filter((x) => x === "easy").length, d.filter((x) => x === "medium").length, d.filter((x) => x === "hard").length]).toEqual([2, 4, 1]);
      expect(d[0]).not.toBe("hard");
    }
  });
});

// The generator's --regen-from guard, run for real with --dry-run (nothing is written).
describe("gen-daily-log --regen-from", () => {
  const run = (...args) => spawnSync(process.execPath, ["scripts/gen-daily-log.mjs", ...args, "--dry-run"], { cwd: ROOT, encoding: "utf8" });
  const iso = (offsetDays) => new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

  it("refuses today, tomorrow and any day the log records as served", () => {
    for (const date of [iso(0), iso(1), "2026-10-17", "2026-08-19"]) {
      const r = run("--regen-from", date);
      expect(r.status, date).toBe(1);
      expect(r.stderr, date).toMatch(/served horizon/);
    }
  }, 60000);

  it("refuses a date that is not a real day, and refuses being paired with --regen-future", () => {
    expect(run("--regen-from", "2026-02-30").status).toBe(1);
    expect(run("--regen-from", iso(30), "--regen-future").status).toBe(1);
  }, 30000);

  it("a dry run reports what would move and writes nothing", () => {
    const before = readFileSync(resolve(ROOT, "src/data/dailyLog.js"), "utf8");
    const r = run("--regen-from", iso(30));
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/DRY RUN, nothing written/);
    expect(r.stdout).toMatch(/after: .* 0 repeat slots/);
    expect(readFileSync(resolve(ROOT, "src/data/dailyLog.js"), "utf8")).toBe(before);
  }, 30000);
});

describe("drawDailySchedule", () => {
  const D = DAILY_LOG.anchor + 500;
  const count = (arr, d) => arr.filter((x) => x === d).length;

  it("is the same every time it is asked", () => {
    expect(drawDailySchedule(QB, D, 30).map(ids)).toEqual(drawDailySchedule(QB, D, 30).map(ids));
  });

  it("deals the mix, never opens on the hard one, never repeats and never deals an id in `used`", () => {
    const used = new Set(drawDailySchedule(QB, D, 10).flat().map((q) => q.id));
    const days = drawDailySchedule(QB, D, 50, used);
    for (const day of days) {
      const d = day.map((q) => q.diff);
      expect([count(d, "easy"), count(d, "medium"), count(d, "hard")]).toEqual([2, 4, 1]);
      expect(d[0]).not.toBe("hard");
      for (const q of day) { expect(used.has(q.id)).toBe(false); expect(hasHint(q)).toBe(true); }
    }
    expect(new Set(days.flat().map((q) => q.id)).size).toBe(50 * 7);
  });

  it("when a pool runs out it deals every question once before any comes back, and never twice in a day", () => {
    const mk = (diff, n) => Array.from({ length: n }, (_, i) => ({ id: `t_${diff}_${i}`, q: "t", o: ["a", "b", "c", "d"], a: 0, type: "mcq", cat: "PL", diff, hint: "why" }));
    const tiny = [...mk("easy", 5), ...mk("medium", 9), ...mk("hard", 3)];
    const days = drawDailySchedule(tiny, D, 12);
    for (const day of days) expect(new Set(day.map((q) => q.id)).size).toBe(7);
    const easyIn = (from, to) => days.slice(from, to).flat().filter((q) => q.diff === "easy").map((q) => q.id);
    expect(new Set(easyIn(0, 2)).size).toBe(4);       // two days, four different
    expect(new Set(easyIn(0, 3)).size).toBe(5);       // the whole pool before the third day ends
    const hardIn = days.slice(0, 3).flat().filter((q) => q.diff === "hard").map((q) => q.id);
    expect(new Set(hardIn).size).toBe(3);
  });

  it("a bank too thin for the mix falls back to the live draw, never a short day", () => {
    const days = drawDailySchedule(QB.filter((q) => q.diff !== "easy"), D, 3);
    for (const day of days) expect(day).toHaveLength(7);
  });
});
