// Ball IQ rating card model — tier boundaries and the six-competition face.
import { describe, it, expect } from "vitest";
import { CARD_COMPS, CARD_TIERS, compRating, cardTier, computeCard, tierPalette } from "../../src/lib/ballIqCard.js";

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
  it("empty stats -> all-baseline card, SILVER tier", () => {
    // 64 is the prior-only baseline, and it lands in silver (60-74) rather than
    // bronze. That is the right side of the line: bronze should mean genuinely
    // below average, not "has not played yet" — and the card gates on
    // gamesPlayed anyway, so a fresh account shows UNRATED, never a tier.
    const card = computeCard({});
    expect(card.ratings).toHaveLength(6);
    expect(card.overall).toBe(64);
    expect(card.tier).toBe("silver");
    for (const r of card.ratings) expect(r.answered).toBe(0);
  });

  it("overall is the rounded mean of the six ratings", () => {
    const catStats = { PL: { c: 50, a: 50 }, UCL: { c: 50, a: 50 } };
    const card = computeCard(catStats);
    const mean = Math.round(card.ratings.reduce((s, r) => s + r.rating, 0) / 6);
    expect(card.overall).toBe(mean);
    expect(card.ratings.find((r) => r.abbr === "EPL").answered).toBe(50);
  });
});
