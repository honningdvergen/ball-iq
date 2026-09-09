import { describe, it, expect } from "vitest";
import { CALIBRATION } from "../../src/data/cardCalibration.js";
import { computeCard, ratingFromAccuracy, ratingFromSkill, faceCatFor, cardTier, PRIOR_WEIGHT, EXPECTED, PBAR, skillOf } from "../../src/lib/ballIqCard.js";
import { CLUB_NAME_TO_COMP } from "../../src/data/clubPackColours.js";

// The card's number is only worth having if it means something against other
// players. These pin the 2026-09-09 calibration and the two behaviours real
// players complained about.

describe("calibration table", () => {
  it("is a measured, strictly increasing, generated table", () => {
    expect(CALIBRATION.n).toBeGreaterThanOrEqual(50);
    expect(CALIBRATION.measured).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const A = CALIBRATION.anchors;
    for (let i = 1; i < A.length; i++) { expect(A[i][0]).toBeGreaterThan(A[i - 1][0]); expect(A[i][1]).toBeGreaterThan(A[i - 1][1]); }
    expect(A[0]).toEqual([0, 40]);
    expect(A[A.length - 1]).toEqual([1, 99]);
  });

  it("the median player is a mid-silver 65; the 75th percentile is the gold line", () => {
    expect(ratingFromAccuracy(CALIBRATION.median)).toBe(65);
    const p75 = CALIBRATION.anchors.find(([, r]) => r === 75)[0];
    expect(cardTier(ratingFromAccuracy(p75))).toBe("gold");
    expect(cardTier(ratingFromAccuracy(p75 - 0.02))).toBe("silver");
  });

  it("interpolates monotonically and clamps", () => {
    let prev = -1;
    for (let x = 0; x <= 1.0001; x += 0.01) { const r = ratingFromAccuracy(x); expect(r).toBeGreaterThanOrEqual(prev); prev = r; }
    expect(ratingFromAccuracy(-1)).toBe(40);
    expect(ratingFromAccuracy(2)).toBe(99);
    expect(ratingFromAccuracy(NaN)).toBe(65);
  });
});

describe("the number reflects the player, not their first two answers", () => {
  // Alex's friend, 2026-09-09: "my overall kept getting lower and it did not
  // reflect how well I actually answered". Simulate a steady 2-in-3 player.
  const steady = (n) => { let c = 0, a = 0; for (let i = 0; i < n; i++) { a++; if (i % 3 !== 2) c++; } return { PL: { c, a } }; };

  it("a steady above-median player NEVER falls: the number climbs toward their level", () => {
    let prev = 0;
    // Multiples of three: the 2-in-3 pattern is EXACTLY 0.667 only there.
    for (const n of [9, 21, 30, 60, 99, 201]) {
      const r = computeCard(steady(n)).overall;
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
    // …and lands where a 0.67 player belongs: the gold line, not 80+.
    expect(prev).toBeGreaterThanOrEqual(73);
    expect(prev).toBeLessThanOrEqual(77);
  });

  it("a lucky start corrects by a few points, never a cliff (the friend's report)", () => {
    // 8/10, then 65% for thirty more: the first printed number vs the settled one.
    const first = computeCard({ PL: { c: 8, a: 10 } }).overall;
    const later = computeCard({ PL: { c: 8 + 19.5, a: 40 } }).overall;
    expect(first - later).toBeLessThanOrEqual(4);
    expect(cardTier(first)).toBe(cardTier(later));
  });

  it("two lucky rights cannot make a gold card", () => {
    const card = computeCard({ PL: { c: 2, a: 2 } });
    expect(card.tier).not.toBe("gold");
    expect(card.rated).toBe(false);
  });

  it("a genuinely good player rises, a genuinely poor one falls — in both directions from 65", () => {
    expect(computeCard({ PL: { c: 36, a: 40 } }).overall).toBeGreaterThan(80);
    expect(computeCard({ PL: { c: 12, a: 40 } }).overall).toBeLessThan(55);
  });

  it("the prior weight is twenty answers", () => { expect(PRIOR_WEIGHT).toBe(20); });
});

describe("club play feeds the faces", () => {
  it("routes by real category, alias, then the club's league", () => {
    expect(faceCatFor({ cat: "PL" })).toBe("PL");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "UCL", club: "Arsenal" })).toBe("UCL");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Arsenal" })).toBe("PL");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "Legends", club: "Juventus" })).toBe("SerieA");
    expect(faceCatFor({ cat: "ChampionsLeague" })).toBe("UCL");
    expect(faceCatFor({ cat: "Euros" })).toBe("WorldCup");
    // A theme question with no club, or a club whose league has no face, feeds nothing.
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

// ── SCORE ABOVE EXPECTATION (2026-09-09, later the same day) ─────────────────
// Alex: "you should be rewarded slightly more for getting hard questions
// correct". Under the old evidence weights 80% on easy out-rated 50% on hard.
describe("difficulty is scored against what the population gets right", () => {
  const played = (n, acc, diff) => {
    let s = 0; for (let i = 0; i < n; i++) s += ((i / n) < acc ? 1 : 0) - EXPECTED[diff];
    return { PL: { c: Math.round(n * acc), a: n, s, n } };
  };

  it("expected scores are ordered easy > medium > hard and PBAR is their bank-mix average", () => {
    expect(EXPECTED.easy).toBeGreaterThan(EXPECTED.medium);
    expect(EXPECTED.medium).toBeGreaterThan(EXPECTED.hard);
    expect(PBAR).toBeCloseTo(0.25 * EXPECTED.easy + 0.48 * EXPECTED.medium + 0.27 * EXPECTED.hard, 2);
  });

  it("a hard specialist at 50% out-rates an easy farmer at 80%", () => {
    const farmer = computeCard(played(40, 0.8, "easy")).overall;      // par on easy
    const specialist = computeCard(played(40, 0.5, "hard")).overall;  // above par on hard
    expect(specialist).toBeGreaterThan(farmer);
    // …and the same 67% is gold on hard, the gold LINE on medium.
    expect(computeCard(played(60, 0.667, "hard")).tier).toBe("gold");
    expect(computeCard(played(60, 0.667, "medium")).overall).toBeGreaterThanOrEqual(74);
    expect(computeCard(played(60, 0.667, "medium")).overall).toBeLessThanOrEqual(76);
  });

  it("a legacy {c,a} record rates exactly as its plain accuracy did (the calibration was measured on those)", () => {
    for (const [c, a] of [[55, 106], [40, 60], [12, 40], [36, 40]]) {
      const legacy = computeCard({ PL: { c, a } }).overall;
      const asSkill = ratingFromSkill((c - PBAR * a + (0.58 - PBAR) * PRIOR_WEIGHT) / (a + PRIOR_WEIGHT));
      expect(legacy).toBe(asSkill);
    }
    expect(skillOf({ c: 61, a: 100 }).s).toBeCloseTo(61 - PBAR * 100, 6);
    expect(skillOf({ c: 1, a: 1, s: 0.4, n: 1 })).toEqual({ s: 0.4, n: 1 });
    expect(skillOf(undefined)).toEqual({ s: 0, n: 0 });
  });

  it("an unplayed card is the median player, 65 — never above it", () => {
    expect(computeCard({}).overall).toBe(65);
    expect(ratingFromAccuracy(0.58)).toBe(65);
  });
});
