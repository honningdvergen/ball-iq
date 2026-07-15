// XP levels, IQ percentile bands, and badge unlock thresholds.
import { describe, it, expect } from "vitest";
import { LEVELS, getLevelInfo, iqPercentile, computeBadges } from "../../src/lib/scoring.js";

describe("getLevelInfo", () => {
  it("0 XP -> Sunday League, progress 0 toward Non-League", () => {
    const { level, nextLevel, progress } = getLevelInfo(0);
    expect(level.name).toBe("Sunday League");
    expect(nextLevel.name).toBe("Non-League");
    expect(progress).toBe(0);
  });

  it("exact threshold lands ON the new level", () => {
    expect(getLevelInfo(100).level.name).toBe("Non-League");
    expect(getLevelInfo(99).level.name).toBe("Sunday League");
    expect(getLevelInfo(700).level.name).toBe("Premier League");
  });

  it("mid-band progress is the rounded percentage", () => {
    // Championship band is 300..700; 500 XP is halfway.
    const { level, progress } = getLevelInfo(500);
    expect(level.name).toBe("Championship");
    expect(progress).toBe(50);
  });

  it("max level: Legend, no next level, progress pinned at 100", () => {
    const { level, nextLevel, progress } = getLevelInfo(9999);
    expect(level.name).toBe("Legend");
    expect(nextLevel).toBeNull();
    expect(progress).toBe(100);
  });

  it("LEVELS thresholds are strictly increasing from 0", () => {
    expect(LEVELS[0].xpNeeded).toBe(0);
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].xpNeeded).toBeGreaterThan(LEVELS[i - 1].xpNeeded);
    }
  });
});

describe("iqPercentile", () => {
  it("band edges", () => {
    expect(iqPercentile(155)).toBe(99);
    expect(iqPercentile(154)).toBe(97);
    expect(iqPercentile(115)).toBe(75);
    expect(iqPercentile(114)).toBe(60);
    expect(iqPercentile(85)).toBe(30);
    expect(iqPercentile(84)).toBe(15);
    expect(iqPercentile(0)).toBe(15);
  });
});

describe("computeBadges", () => {
  it("fresh player has no badges", () => {
    expect(computeBadges({}, 0, 0).size).toBe(0);
  });

  it("first game unlocks first_blood only", () => {
    expect(computeBadges({ gamesPlayed: 1 }, 0, 0)).toEqual(new Set(["first_blood"]));
  });

  it("threshold edges: streaks, IQ tiers, XP", () => {
    expect(computeBadges({}, 0, 4).has("roll5")).toBe(false);
    expect(computeBadges({}, 0, 5).has("roll5")).toBe(true);
    expect(computeBadges({}, 0, 30).has("roll30")).toBe(true);
    // bestIQ 140 unlocks BOTH big_brain (>=120) and goat (>=140)
    const iq = computeBadges({ bestIQ: 140 }, 0, 0);
    expect(iq.has("big_brain")).toBe(true);
    expect(iq.has("goat")).toBe(true);
    expect(computeBadges({ bestIQ: 139 }, 0, 0).has("goat")).toBe(false);
    expect(computeBadges({}, 3000, 0).has("legend_xp")).toBe(true);
    expect(computeBadges({}, 2999, 0).has("legend_xp")).toBe(false);
  });
});
