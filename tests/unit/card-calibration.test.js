import { describe, it, expect } from "vitest";
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
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "Legends", club: "Juventus" })).toBe("SerieA");
    expect(faceCatFor({ cat: "ChampionsLeague" })).toBe("UCL");
    expect(faceCatFor({ cat: "Euros" })).toBe("WorldCup");
    expect(faceCatFor({ cat: "History" })).toBeNull();
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Marseille" })).toBeNull();
    expect(faceCatFor(null)).toBeNull();
  });
  it("the generated route covers every English, Spanish, German and Italian pack", () => {
    const by = {};
    for (const v of Object.values(CLUB_NAME_TO_COMP)) by[v] = (by[v] || 0) + 1;
    expect(by.PL).toBeGreaterThanOrEqual(30);
    expect(by.LaLiga).toBeGreaterThanOrEqual(5);
    expect(by.Bundesliga).toBeGreaterThanOrEqual(5);
    expect(by.SerieA).toBeGreaterThanOrEqual(5);
    expect(new Set(Object.values(CLUB_NAME_TO_COMP))).toEqual(new Set(["PL", "LaLiga", "Bundesliga", "SerieA"]));
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
    // order is preserved: UCL (8/20) stays the weakest rated face
    const ucl = card.ratings.find(r => r.abbr === "UCL").rating;
    expect(Math.min(...faces)).toBe(ucl);
    // gates are on OWN answers: La Liga (4) stays provisional despite the borrowed share
    const lal = card.ratings.find(r => r.abbr === "LAL");
    expect(lal.rated).toBe(false); expect(lal.provisional).toBe(true);
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
    const cs = recordAnswers({}, [{ cat: "ClubQuiz", realCat: "History", club: "Juventus", diff: "medium", isCorrect: true }]);
    expect(cs.SerieA).toBeDefined();
    expect(cs.ClubQuiz).toBeUndefined();
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
