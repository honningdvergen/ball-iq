// Ball IQ rating card model — tier boundaries and the six-competition face.
import { describe, it, expect } from "vitest";
import { CARD_COMPS, CARD_TIERS, compRating, cardTier, computeCard, tierPalette, ratingFromAccuracy, PROVISIONAL_ANSWERS, recordAnswers, rawAnswered } from "../../src/lib/ballIqCard.js";
// MIN_RATED_ANSWERS lives in scoring.js — ballIqCard.js imports it but does not
// re-export it, so importing it from there yields undefined and silently turns
// a `for (i < MIN_RATED_ANSWERS)` loop into a no-op that passes nothing.
import { MIN_RATED_ANSWERS } from "../../src/lib/scoring.js";

describe("cardTier boundaries", () => {
  it("bronze below 60, silver 60-74, gold 75+", () => {
    expect(cardTier(40)).toBe("bronze");
    expect(cardTier(59)).toBe("bronze");
    expect(cardTier(60)).toBe("silver");
    expect(cardTier(74)).toBe("silver");
    expect(cardTier(75)).toBe("gold");
    expect(cardTier(99)).toBe("gold");
  });

  it("every tier has a palette", () => {
    for (const tier of ["bronze", "silver", "gold"]) {
      expect(CARD_TIERS[tier]).toBeDefined();
      expect(CARD_TIERS[tier].label).toBe(tier.toUpperCase());
    }
  });

  it("⚠️ still renders cards shared under the OLD tier names", () => {
    // api/og.js reads the tier from a URL parameter, so every /p?... card
    // already sitting in someone's chat carries elite / pro / prospect. Those
    // links outlive every deploy; dropping them to a default palette would be
    // a silent regression in the one artefact we cannot re-issue.
    expect(tierPalette("elite").label).toBe("GOLD");
    expect(tierPalette("pro").label).toBe("SILVER");
    expect(tierPalette("prospect").label).toBe("BRONZE");
    // and an unknown key must still return a usable palette, never undefined
    expect(tierPalette("nonsense").label).toBeTruthy();
    expect(tierPalette(undefined).label).toBeTruthy();
  });

  it("no tier uses the brand green — that colour means correct, not rank", () => {
    for (const t of Object.values(CARD_TIERS)) {
      expect(t.accent.toUpperCase()).not.toBe("#58CC02");
    }
  });
});

describe("CARD_COMPS", () => {
  it("is exactly the six face stats with unique abbr + cat", () => {
    expect(CARD_COMPS).toHaveLength(6);
    expect(new Set(CARD_COMPS.map((c) => c.abbr)).size).toBe(6);
    expect(new Set(CARD_COMPS.map((c) => c.cat)).size).toBe(6);
    for (const c of CARD_COMPS) expect(c.abbr).toMatch(/^[A-Z]{3}$/);
  });
});

describe("compRating", () => {
  it("clamps to the 40-99 band", () => {
    expect(compRating({ c: 0, a: 100 })).toBeGreaterThanOrEqual(40);
    expect(compRating({ c: 100, a: 100 })).toBeLessThanOrEqual(99);
  });

  it("an unplayed face sits at the population median (64), whatever the caller thinks", () => {
    // Prior weight 2 on zero answers = the prior itself, and the prior is the
    // measured median accuracy → 65 by calibration. A caller's own accuracy is
    // clamped to [0.25, 0.75], so two lucky answers cannot make an unplayed
    // face gold (the 2026-09-01 "99 GOLD off two questions" report).
    expect(compRating(undefined)).toBe(64);
    expect(compRating({})).toBe(64);
    // The caller's prior is clamped: a perfect start counts as 0.75, no more.
    expect(compRating(undefined, 1.0)).toBe(compRating(undefined, 0.75));
    expect(compRating(undefined, 0.0)).toBe(compRating(undefined, 0.25));
  });

  it("perfect record rates higher than an empty one, losing record lower", () => {
    expect(compRating({ c: 20, a: 20 })).toBeGreaterThan(compRating(undefined));
    expect(compRating({ c: 0, a: 20 })).toBeLessThan(compRating(undefined));
  });
});

describe("computeCard", () => {
  it("empty stats -> median overall (64), SILVER, unrated, every face unrated", () => {
    const card = computeCard({});
    expect(card.ratings).toHaveLength(6);
    expect(card.overall).toBe(64);
    expect(card.tier).toBe("silver");
    expect(card.rated).toBe(false);
    for (const r of card.ratings) { expect(r.answered).toBe(0); expect(r.rated).toBe(false); }
  });

  it("⚠️ the overall NEVER derives from the faces — unplayed faces do not move it", () => {
    // 2026-09-09: the overall was the mean of six faces with unplayed ones at
    // an invented prior. Now it is the player's own answers, all of them.
    const played = computeCard({ PL: { c: 30, a: 40 } });
    const withThemes = computeCard({ PL: { c: 30, a: 40 }, History: { c: 15, a: 20 }, ClubQuiz: { c: 15, a: 20 } });
    // Same 0.75 accuracy in every bucket → more evidence at the same level
    // moves the number TOWARD 0.75's rating (the prior fading), never past it,
    // and never because faces appeared or vanished.
    const target = ratingFromAccuracy(0.75);
    expect(withThemes.overall).toBeGreaterThanOrEqual(played.overall);
    expect(withThemes.overall).toBeLessThanOrEqual(target);
    expect(played.overall).toBeLessThanOrEqual(target);
    // Every answered key counts, even ones that feed no face.
    expect(withThemes.answeredTotal).toBe(80);
    expect(played.ratings.filter(r => r.rated)).toHaveLength(1);
  });

  it("folds legacy ChampionsLeague into UCL and Euros into INT", () => {
    const card = computeCard({ ChampionsLeague: { c: 6, a: 8 }, UCL: { c: 4, a: 6 }, Euros: { c: 9, a: 12 } });
    const ucl = card.ratings.find(r => r.abbr === "UCL");
    const int = card.ratings.find(r => r.abbr === "INT");
    expect(ucl.answered).toBe(14);
    expect(ucl.rated).toBe(true);
    expect(int.answered).toBe(12);
  });
});

describe("provisional faces", () => {
  it("a face prints muted from 3 answers, fully from 10, never before 3", () => {
    expect(PROVISIONAL_ANSWERS).toBe(3);
    const f = (a) => computeCard({ LaLiga: { c: a / 2, a } }).ratings.find(r => r.abbr === "LAL");
    expect(f(2).provisional).toBe(false); expect(f(2).rated).toBe(false);
    expect(f(4).provisional).toBe(true);  expect(f(4).rated).toBe(false);
    expect(f(10).provisional).toBe(false); expect(f(10).rated).toBe(true);
  });
});

// ⚠️ PLAYING A CATEGORY MUST NEVER REMOVE ITS RATING.
// Shipped in 1.7.3 build 125 and caught on Alex's device: "4 of the items on
// the scorecard are gone, this was never an issue in 1.7.2." rawAnswered
// preferred the per-difficulty counter `d` the moment it existed, and `d`
// only counts answers recorded since the 2026-09-09 rebuild — so one new
// answer replaced a whole legacy history with "1" and the face fell under
// every gate. A correct answer DELETED a rating.
//
// The two clauses pull in opposite directions and both are load-bearing, so
// each gets its own test: `a` alone never opens the gate for a new player
// (decay leaves it at 9.78 after ten), and `d` alone discards everything
// before the rebuild.
describe("the face gate counts every answer, not just the new ones", () => {
  const LEGACY = { WorldCup: { c: 26, a: 40 }, PL: { c: 60, a: 95 } };
  const faceOf = (card, abbr) => card.ratings.find((r) => r.abbr === abbr);

  it("a rated legacy face STAYS rated after a single new answer", () => {
    const before = faceOf(computeCard(LEGACY, null, { c: 86, a: 135 }), "INT");
    expect(before.rated).toBe(true);
    const after = faceOf(
      computeCard(recordAnswers(LEGACY, [{ cat: "WorldCup", diff: "medium", isCorrect: true }], { c: 86, a: 135 }), null, { c: 87, a: 136 }),
      "INT",
    );
    expect(after.rated).toBe(true);
    expect(after.rating).toBeGreaterThanOrEqual(before.rating); // a CORRECT answer never lowers it
  });

  it("answering only ever raises a face's answer count", () => {
    let stats = LEGACY;
    let prev = rawAnswered(stats.WorldCup);
    for (let i = 0; i < 12; i++) {
      stats = recordAnswers(stats, [{ cat: "WorldCup", diff: "hard", isCorrect: i % 2 === 0 }], { c: 86, a: 135 });
      const now = rawAnswered(stats.WorldCup);
      expect(now).toBeGreaterThanOrEqual(prev);
      prev = now;
    }
  });

  it("a brand-new player is still rated at exactly MIN_RATED_ANSWERS", () => {
    let stats = {};
    for (let i = 0; i < MIN_RATED_ANSWERS; i++) {
      stats = recordAnswers(stats, [{ cat: "PL", diff: "medium", isCorrect: i % 3 !== 0 }], { c: 0, a: 0 });
    }
    expect(faceOf(computeCard(stats, null, { c: 0, a: 0 }), "EPL").rated).toBe(true);
  });

  it("a thin legacy face prints a provisional number rather than an empty slot", () => {
    const thin = { Bundesliga: { c: 4, a: 6 } };
    const face = faceOf(computeCard(thin, null, { c: 4, a: 6 }), "BUN");
    expect(face.rated).toBe(false);
    expect(face.provisional).toBe(true);
    const after = faceOf(
      computeCard(recordAnswers(thin, [{ cat: "Bundesliga", diff: "medium", isCorrect: true }], { c: 4, a: 6 }), null, { c: 5, a: 7 }),
      "BUN",
    );
    expect(after.provisional).toBe(true); // still a number, never back to a bar
  });
});
