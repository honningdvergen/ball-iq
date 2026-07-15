// Ball IQ rating card model — tier boundaries and the six-competition face.
import { describe, it, expect } from "vitest";
import { CARD_COMPS, CARD_TIERS, compRating, cardTier, computeCard } from "../../src/lib/ballIqCard.js";

describe("cardTier boundaries", () => {
  it("prospect below 65, pro 65-79, elite 80+", () => {
    expect(cardTier(40)).toBe("prospect");
    expect(cardTier(64)).toBe("prospect");
    expect(cardTier(65)).toBe("pro");
    expect(cardTier(79)).toBe("pro");
    expect(cardTier(80)).toBe("elite");
    expect(cardTier(99)).toBe("elite");
  });

  it("every tier has a palette", () => {
    for (const tier of ["prospect", "pro", "elite"]) {
      expect(CARD_TIERS[tier]).toBeDefined();
      expect(CARD_TIERS[tier].label).toBe(tier.toUpperCase());
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

  it("unplayed comp sits at the smoothed rookie baseline (64 with default prior)", () => {
    // (0 + 0.4*2) / (0 + 2) = 0.4 accuracy -> round(40 + 0.4*59) = 64
    expect(compRating(undefined)).toBe(64);
    expect(compRating({})).toBe(64);
  });

  it("perfect record rates higher than an empty one, losing record lower", () => {
    expect(compRating({ c: 20, a: 20 })).toBeGreaterThan(compRating(undefined));
    expect(compRating({ c: 0, a: 20 })).toBeLessThan(compRating(undefined));
  });
});

describe("computeCard", () => {
  it("empty stats -> all-baseline card, prospect tier", () => {
    const card = computeCard({});
    expect(card.ratings).toHaveLength(6);
    expect(card.overall).toBe(64);
    expect(card.tier).toBe("prospect");
    for (const r of card.ratings) expect(r.answered).toBe(0);
  });

  it("overall is the rounded mean of the six ratings", () => {
    const catStats = { PL: { c: 50, a: 50 }, UCL: { c: 50, a: 50 } };
    const card = computeCard(catStats);
    const mean = Math.round(card.ratings.reduce((s, r) => s + r.rating, 0) / 6);
    expect(card.overall).toBe(mean);
    expect(card.ratings.find((r) => r.abbr === "PRL").answered).toBe(50);
  });
});
