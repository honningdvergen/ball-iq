import { describe, it, expect, beforeEach } from "vitest";
import { CALIBRATION } from "../../src/data/cardCalibration.js";
import { computeCard, ratingFromScore, ratingFromAccuracy, faceCatFor, cardTier, PRIOR_WEIGHT, MULT, AVG_MULT, BASELINE, scoreOf } from "../../src/lib/ballIqCard.js";
import { CLUB_NAME_TO_COMP } from "../../src/data/clubPackColours.js";

// THE MODEL (Alex, 2026-09-09): "61% accuracy on easy equals 61; 61% at medium
// should be 10% more rewarding, hard 20%." These pin that sentence, the two
// guardrails around it, and the population reference it is checked against.

const played = (n, acc, diff) => {
  let s = 0; for (let i = 0; i < n; i++) s += ((i / n) < acc ? MULT[diff] : 0);
  return { PL: { c: Math.round(n * acc), a: n, s, n } };
};

describe("Alex's sentence", () => {
  it("61% on easy = 61, on medium = 67, on hard = 73 (once the prior has faded)", () => {
    const N = 4000; // large so 20 answers of prior are noise
    expect(computeCard(played(N, 0.61, "easy")).overall).toBe(61);
    expect(computeCard(played(N, 0.61, "medium")).overall).toBe(67);
    expect(computeCard(played(N, 0.61, "hard")).overall).toBe(73);
  });
  it("the multipliers are exactly 1.0 / 1.1 / 1.2 and AVG_MULT is their bank-mix average", () => {
    expect(MULT).toEqual({ easy: 1.0, medium: 1.1, hard: 1.2 });
    expect(AVG_MULT).toBeCloseTo(0.25 * 1.0 + 0.48 * 1.1 + 0.27 * 1.2, 3);
  });
  it("a hard specialist at 50% out-rates an easy farmer at 55%; perfect on hard caps at 99", () => {
    expect(computeCard(played(200, 0.5, "hard")).overall).toBeGreaterThan(computeCard(played(200, 0.55, "easy")).overall);
    expect(computeCard(played(200, 1.0, "hard")).overall).toBe(99);
    expect(ratingFromScore(1.2)).toBe(99);
    expect(ratingFromScore(0)).toBe(40);
  });
});

describe("the two guardrails", () => {
  it("an unplayed card is the measured median player (~64), and two lucky rights cannot make gold", () => {
    expect(computeCard({}).overall).toBe(Math.round(BASELINE * 100));
    expect(computeCard({}).overall).toBe(64);
    expect(computeCard({ PL: { c: 2, a: 2 } }).tier).not.toBe("gold");
    expect(computeCard({ PL: { c: 2, a: 2 } }).rated).toBe(false);
    expect(PRIOR_WEIGHT).toBe(20);
  });
  it("a steady player never falls: the number climbs toward their level", () => {
    let prev = 0;
    for (const n of [9, 21, 30, 60, 99, 201]) {
      const r = computeCard(played(n, 2 / 3, "medium")).overall;
      expect(r).toBeGreaterThanOrEqual(prev); prev = r;
    }
    expect(prev).toBeGreaterThanOrEqual(72); // 2/3 × 1.1 = 73.3; 20 answers of prior still pull a point at 201
    expect(prev).toBeLessThanOrEqual(73);
  });
  it("a lucky 8/10 start corrects by a few points, never a cliff", () => {
    const first = computeCard({ PL: { c: 8, a: 10 } }).overall;
    const later = computeCard({ PL: { c: 27.5, a: 40 } }).overall;
    expect(first - later).toBeLessThanOrEqual(4);
    expect(cardTier(first)).toBe(cardTier(later));
  });
});

describe("legacy records and the population reference", () => {
  it("a legacy record is topped up from the lifetime totals, until any key carries scores", () => {
    const window = { PL: { c: 55, a: 106 } };                  // Alex's decayed window, 52%
    const bare = computeCard(window).overall;                  // 58
    const topped = computeCard(window, 0.61, { c: 305, a: 500 }).overall;
    expect(topped).toBeGreaterThan(bare);
    expect(topped).toBeGreaterThanOrEqual(64);
    // the cap: a 5,000-answer lifetime counts no more than LIFETIME_TOPUP extra
    expect(computeCard(window, 0.61, { c: 3050, a: 5000 }).overall).toBe(topped);
    // once a key carries s/n the top-up stops — the card is the player's own scored answers
    const scored = { ...window, UCL: { c: 1, a: 2, s: 1.1, n: 2 } };
    expect(computeCard(scored, 0.61, { c: 305, a: 500 }).overall).toBe(computeCard(scored).overall);
    // garbage lifetime is ignored
    expect(computeCard(window, 0.61, { c: 900, a: 500 }).overall).toBe(bare);
  });

  it("a legacy {c,a} record is scored as average difficulty", () => {
    expect(scoreOf({ c: 55, a: 106 })).toEqual({ s: AVG_MULT * 55, n: 106 });
    expect(scoreOf({ c: 1, a: 1, s: 1.2, n: 1 })).toEqual({ s: 1.2, n: 1 });
    expect(scoreOf(undefined)).toEqual({ s: 0, n: 0 });
    expect(ratingFromAccuracy(CALIBRATION.median)).toBe(64);
  });
  it("the measured population (n≥50, increasing percentiles) puts the median in silver and the 90th in gold", () => {
    expect(CALIBRATION.n).toBeGreaterThanOrEqual(50);
    const A = CALIBRATION.anchors;
    for (let i = 1; i < A.length; i++) expect(A[i][0]).toBeGreaterThan(A[i - 1][0]);
    const p = (acc) => ratingFromAccuracy(acc);
    expect(cardTier(p(CALIBRATION.median))).toBe("silver");
    const p90 = A.find(([, r]) => r === 84)[0];
    expect(cardTier(p(p90))).toBe("gold");
  });
});

describe("club play feeds the faces", () => {
  it("routes by real category, alias, then the club's league", () => {
    expect(faceCatFor({ cat: "PL" })).toBe("PL");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "UCL", club: "Arsenal" })).toBe("UCL");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Arsenal" })).toBe("PL");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "Legends", club: "Juventus" })).toBe("Clubs");
    expect(faceCatFor({ cat: "ChampionsLeague" })).toBe("UCL");
    expect(faceCatFor({ cat: "Euros" })).toBe("WorldCup");
    // Since the 2026-09-10 re-cut these reach a face instead of falling off the
    // card — that is the whole point of the re-cut.
    expect(faceCatFor({ cat: "History" })).toBe("Legends");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Marseille" })).toBe("Clubs"); // routes since 09-10
    expect(faceCatFor({ cat: "Managers" })).toBe("Records");
    expect(faceCatFor({ cat: "Quidditch" })).toBeNull();
    expect(faceCatFor(null)).toBeNull();
  });
  it("EVERY club pack routes to a face — no fan is left off the card", () => {
    // ⚠️ This used to assert the four league countries only, which quietly
    // encoded the bug: a Marseille, Porto, Ajax or Galatasaray fan's club
    // rounds fed the overall and left every face blank. Since the 2026-09-10
    // re-cut England keeps its own face and every other country lands on
    // Clubs, so the real invariant is TOTALITY — assert that instead.
    const by = {};
    for (const v of Object.values(CLUB_NAME_TO_COMP)) by[v] = (by[v] || 0) + 1;
    expect(by.PL).toBeGreaterThanOrEqual(30);
    expect(by.Clubs).toBeGreaterThanOrEqual(40);
    expect(new Set(Object.values(CLUB_NAME_TO_COMP))).toEqual(new Set(["PL", "Clubs"]));
    // and the map covers the whole pack list, not a subset of it
    expect(Object.keys(CLUB_NAME_TO_COMP).length).toBeGreaterThanOrEqual(90);
  });
});

// ── THE WRITER ────────────────────────────────────────────────────────────────
import { recordAnswers, CAT_DECAY, withLegacyTopUp } from "../../src/lib/ballIqCard.js";
describe("recordAnswers", () => {
  const alex = { UCL: { c: 8, a: 20 }, PL: { c: 6, a: 12 }, Transfers: { c: 6, a: 11 }, WorldCup: { c: 6, a: 11 }, ClubQuiz: { c: 5, a: 10 }, Managers: { c: 9, a: 10 }, Records: { c: 3, a: 8 }, Bundesliga: { c: 2, a: 6 }, LaLiga: { c: 2, a: 4 }, SerieA: { c: 3, a: 4 } };
  const life = { c: 305, a: 500 };
  const hard = (cat, n, ok = true) => Array.from({ length: n }, () => ({ cat, diff: "hard", isCorrect: ok }));

  it("⚠️ right answers never lower the card — the lifetime top-up is materialised, not switched off", () => {
    const before = computeCard(alex, 0.61, life).overall;
    let cs = alex, prev = before;
    for (let round = 0; round < 6; round++) {
      cs = recordAnswers(cs, hard("UCL", 10), life);
      const now = computeCard(cs, 0.61, life).overall;
      expect(now).toBeGreaterThanOrEqual(prev);
      prev = now;
    }
    expect(prev).toBeGreaterThan(before + 5);
    expect(cs._legacy).toBeUndefined(); // spread into the keys, not parked on one
  });

  it("⚠️ the top-up is spread across the leagues, so the overall sits AMONG the faces, not above them", () => {
    // Alex on build 117: overall 63, every rated face 46-56 — the overall
    // carried ~200 lifetime answers the faces never saw.
    const card = computeCard(alex, 0.61, life);
    const faces = card.ratings.filter(r => r.rated).map(r => r.rating);
    expect(Math.max(...faces)).toBeGreaterThanOrEqual(card.overall - 2);
    // order is preserved: UCL (8/20, 40%) is the weakest input and stays the
    // weakest rated face — the top-up must not reorder anyone.
    const ucl = card.ratings.find(r => r.abbr === "UCL").rating;
    expect(Math.min(...faces)).toBe(ucl);
    // gates are on OWN answers, never the borrowed share. Records carries
    // Managers(10)+Records(8) after the 2026-09-10 re-cut and rates; nothing
    // is rated off the top-up alone.
    for (const r of card.ratings) {
      if (r.rated) expect(r.answered).toBeGreaterThanOrEqual(10);
      if (r.provisional) expect(r.answered).toBeGreaterThanOrEqual(3);
    }
    // and the spread is proportional: every key's n grows by the same factor
    const spread = withLegacyTopUp(alex, life);
    const f = (k) => spread[k].n / alex[k].a;
    expect(f("UCL")).toBeCloseTo(f("PL"), 6);
  });

  it("scores (correct ? MULT : 0), counts, keeps c/a and raw per-difficulty d", () => {
    const cs = recordAnswers({}, [
      { cat: "PL", diff: "hard", isCorrect: true }, { cat: "PL", diff: "easy", isCorrect: false }, { cat: "PL", diff: "medium", isCorrect: true },
    ]);
    const pl = cs.PL;
    expect(pl.n).toBeCloseTo(1 * CAT_DECAY * CAT_DECAY + 1 * CAT_DECAY + 1, 6);
    expect(pl.s).toBeCloseTo(1.2 * CAT_DECAY * CAT_DECAY + 0 + 1.1, 6);
    expect(pl.d).toEqual({ h: [1, 1], e: [0, 1], m: [1, 1] });
    expect(pl.a).toBeCloseTo(pl.n, 6);
    expect(cs._legacy).toBeUndefined();
  });

  it("files a club answer under its league's face", () => {
    // Juventus -> SerieA -> the Clubs face (2026-09-10 re-cut). The point of
    // the test is unchanged: a club answer must NOT pile up under "ClubQuiz",
    // which was the biggest key in prod and fed nothing.
    const cs = recordAnswers({}, [{ cat: "ClubQuiz", realCat: "History", club: "Juventus", diff: "medium", isCorrect: true }]);
    expect(cs.Clubs).toBeDefined();
    expect(cs.ClubQuiz).toBeUndefined();
    // an English club still reaches its own face rather than the Clubs bucket
    const eng = recordAnswers({}, [{ cat: "ClubQuiz", realCat: "History", club: "Arsenal", diff: "medium", isCorrect: true }]);
    expect(eng.PL).toBeDefined();
  });

  it("wrong answers lower it, and a miss on hard costs the same as a miss on easy", () => {
    const base = recordAnswers({}, hard("PL", 20));
    const r0 = computeCard(base).overall;
    expect(computeCard(recordAnswers(base, hard("PL", 5, false))).overall).toBeLessThan(r0);
    const e = computeCard(recordAnswers(base, [{ cat: "PL", diff: "easy", isCorrect: false }])).overall;
    const h = computeCard(recordAnswers(base, [{ cat: "PL", diff: "hard", isCorrect: false }])).overall;
    expect(e).toBe(h);
  });
});

// ── THE RESULTS DELTA ─────────────────────────────────────────────────────────
import { cardDelta } from "../../src/lib/ballIqCard.js";
describe("cardDelta", () => {
  const alex = { UCL: { c: 8, a: 20 }, PL: { c: 6, a: 12 }, WorldCup: { c: 6, a: 11 }, ClubQuiz: { c: 5, a: 10 }, Managers: { c: 9, a: 10 }, LaLiga: { c: 2, a: 4 } };
  const life = { c: 150, a: 246 };
  it("reports the overall and the faces that moved after a perfect UCL round", () => {
    const next = recordAnswers(alex, Array.from({ length: 10 }, (_, i) => ({ cat: "UCL", diff: i < 5 ? "hard" : "medium", isCorrect: true })), life);
    const d = cardDelta(alex, next, life, { c: 160, a: 256 });
    expect(d.ratedBefore && d.ratedAfter).toBe(true);
    expect(d.after).toBeGreaterThan(d.before);
    const ucl = d.faces.find(f => f.abbr === "UCL");
    expect(ucl).toBeDefined();
    expect(ucl.after).toBeGreaterThan(ucl.before);
  });
  it("an unrated player is told how many answers are left; the tenth answer announces the number", () => {
    const d0 = cardDelta({}, recordAnswers({}, [{ cat: "PL", diff: "medium", isCorrect: true }]), null, null);
    expect(d0.ratedAfter).toBe(false); expect(d0.toRated).toBe(9);
    const nine = recordAnswers({}, Array.from({ length: 9 }, () => ({ cat: "PL", diff: "medium", isCorrect: true })));
    const ten = recordAnswers(nine, [{ cat: "PL", diff: "medium", isCorrect: true }]);
    const d1 = cardDelta(nine, ten, null, null);
    expect(d1.ratedBefore).toBe(false); expect(d1.ratedAfter).toBe(true); expect(d1.after).toBeGreaterThan(60);
  });
});

// ── THE SHARE LINE ────────────────────────────────────────────────────────────
import { shareLine } from "../../src/lib/ballIqCard.js";
describe("shareLine", () => {
  it("leads with the strongest league, adds today's move, and stays honest when unrated", () => {
    const card = computeCard({ UCL: { c: 20, a: 24, s: 24, n: 24 }, PL: { c: 6, a: 12, s: 6.6, n: 12 } });
    expect(shareLine(card)).toMatch(/^Ball IQ \d\d · UCL \d\d\. Can you beat me\? ⚽$/);
    const withMove = shareLine(card, { ratedAfter: true, faces: [{ abbr: "UCL", before: 72, after: 78 }] });
    expect(withMove).toContain("UCL 72 → 78 today");
    expect(shareLine(computeCard({}))).toBe("Can you beat me at Ball IQ? ⚽");
  });
});

// ── THE WEB QUEUE ─────────────────────────────────────────────────────────────
// A club page queues its round's answers; the app scores them with the same
// writer. The page must never do the arithmetic itself.
import { drainPendingRounds, PENDING_KEY } from "../../src/lib/ballIqCard.js";
describe("drainPendingRounds", () => {
  const store = {};
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  it("claims the queue before use, so a later failure cannot double-count", () => {
    store[PENDING_KEY] = JSON.stringify([{ cat: "PL", diff: "hard", isCorrect: true }]);
    expect(drainPendingRounds()).toHaveLength(1);
    expect(store[PENDING_KEY]).toBeUndefined();
    expect(drainPendingRounds()).toEqual([]);
  });

  it("admits any face OR alias, normalises the cat, and normalises difficulty", () => {
    // ⚠️ A club page stamps `data-face` at BUILD time, so pages already live
    // carry pre-2026-09-10 cats. The drain must accept those and fold them,
    // or every queued round from an older page is silently dropped.
    store[PENDING_KEY] = JSON.stringify([
      { cat: "PL", diff: "hard", isCorrect: true },
      { cat: "ClubQuiz", diff: "hard", isCorrect: true },   // alias -> Clubs
      { cat: "Ligue1", diff: "medium", isCorrect: true },   // alias -> Clubs
      { cat: "SerieA", diff: "nonsense", isCorrect: false },// alias -> Clubs
      { cat: "Quidditch", diff: "hard", isCorrect: true },  // no face, dropped
      { cat: "UCL", isCorrect: "yes" },                     // not a boolean
    ]);
    expect(drainPendingRounds()).toEqual([
      { cat: "PL", diff: "hard", isCorrect: true },
      { cat: "Clubs", diff: "hard", isCorrect: true },
      { cat: "Clubs", diff: "medium", isCorrect: true },
      { cat: "Clubs", diff: "medium", isCorrect: false },
    ]);
  });

  it("survives junk and an absent queue", () => {
    expect(drainPendingRounds()).toEqual([]);
    store[PENDING_KEY] = "not json";
    expect(drainPendingRounds()).toEqual([]);
    store[PENDING_KEY] = JSON.stringify({ cat: "PL" });
    expect(drainPendingRounds()).toEqual([]);
  });

  it("a queued web round moves the face it names, through the app's own writer", () => {
    const before = computeCard({ PL: { c: 6, a: 12 } });
    store[PENDING_KEY] = JSON.stringify(Array.from({ length: 10 }, () => ({ cat: "PL", diff: "hard", isCorrect: true })));
    const after = computeCard(recordAnswers({ PL: { c: 6, a: 12 } }, drainPendingRounds()));
    expect(after.ratings.find(r => r.abbr === "EPL").rating)
      .toBeGreaterThan(before.ratings.find(r => r.abbr === "EPL").rating);
  });
});
