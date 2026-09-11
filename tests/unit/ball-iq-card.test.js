// Ball IQ rating card model — tier boundaries and the six-competition face.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CARD_COMPS, CARD_TIERS, compRating, cardTier, computeCard, tierPalette, ratingFromAccuracy, PROVISIONAL_ANSWERS, recordAnswers, rawAnswered, faceCatFor, EXCLUDED_CATS } from "../../src/lib/ballIqCard.js";
// MIN_RATED_ANSWERS lives in scoring.js — ballIqCard.js imports it but does not
// re-export it, so importing it from there yields undefined and silently turns
// a `for (i < MIN_RATED_ANSWERS)` loop into a no-op that passes nothing.
import { MIN_RATED_ANSWERS } from "../../src/lib/scoring.js";

describe("cardTier boundaries", () => {
  it("bronze below 62, silver 62-74, gold 75+", () => {
    // ⚠️ THESE ARE ALEX'S NUMBERS AND THEY ARE NOT A QUANTILE. I moved them to
    // 72/82 on 2026-09-11 to hold gold at the top quarter and he reversed it
    // on sight of a real 71-rated card. Gold is 69% of the live population by
    // choice: a 75 means to a football fan what it means in FIFA, and that
    // legibility was judged worth more than scarcity. If a future change makes
    // this test fail because gold "should" be rarer, the test is right and the
    // change is the thing to reconsider.
    expect(cardTier(40)).toBe("bronze");
    expect(cardTier(61)).toBe("bronze");
    expect(cardTier(62)).toBe("silver");
    expect(cardTier(71)).toBe("silver");   // the card that triggered the reversal
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
    for (const c of CARD_COMPS) expect(c.abbr).toMatch(/^[A-Z]{3,8}$/) // 3 for a real abbreviation (EPL/UCL/INT), a whole word where none exists;
  });
});

describe("compRating", () => {
  it("clamps to the 40-99 band", () => {
    expect(compRating({ c: 0, a: 100 })).toBeGreaterThanOrEqual(40);
    expect(compRating({ c: 100, a: 100 })).toBeLessThanOrEqual(99);
  });

  it("an unplayed face sits at the population median (77), whatever the caller thinks", () => {
    // Prior weight 2 on zero answers = the prior itself, and the prior is the
    // measured median accuracy → 65 by calibration. A caller's own accuracy is
    // clamped to [0.25, 0.75], so two lucky answers cannot make an unplayed
    // face gold (the 2026-09-01 "99 GOLD off two questions" report).
    expect(compRating(undefined)).toBe(77);
    expect(compRating({})).toBe(77);
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
  it("empty stats -> median overall (77), SILVER, unrated, every face unrated", () => {
    const card = computeCard({});
    expect(card.ratings).toHaveLength(6);
    expect(card.overall).toBe(77);
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

  it("folds legacy ChampionsLeague into UCL and Euros into NATIONS", () => {
    const card = computeCard({ ChampionsLeague: { c: 6, a: 8 }, UCL: { c: 4, a: 6 }, Euros: { c: 9, a: 12 } });
    const ucl = card.ratings.find(r => r.abbr === "UCL");
    const int = card.ratings.find(r => r.abbr === "NATIONS");
    expect(ucl.answered).toBe(14);
    expect(ucl.rated).toBe(true);
    expect(int.answered).toBe(12);
  });
});

describe("provisional faces", () => {
  it("a face prints muted from 3 answers, fully from 10, never before 3", () => {
    expect(PROVISIONAL_ANSWERS).toBe(3);
    // A player whose only history is La Liga gets the LA LIGA face — the card's
    // league slot is their own most-played league (2026-09-10).
    const f = (a) => computeCard({ LaLiga: { c: a / 2, a } }).ratings.find(r => r.abbr === "LA LIGA");
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
    const before = faceOf(computeCard(LEGACY, null, { c: 86, a: 135 }), "NATIONS");
    expect(before.rated).toBe(true);
    const after = faceOf(
      computeCard(recordAnswers(LEGACY, [{ cat: "WorldCup", diff: "medium", isCorrect: true }], { c: 86, a: 135 }), null, { c: 87, a: 136 }),
      "NATIONS",
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
    const thin = { Bundesliga: { c: 4, a: 6 } }; // their only league -> the league slot
    const face = faceOf(computeCard(thin, null, { c: 4, a: 6 }), "BUNDESLIGA");
    expect(face.rated).toBe(false);
    expect(face.provisional).toBe(true);
    const after = faceOf(
      computeCard(recordAnswers(thin, [{ cat: "Bundesliga", diff: "medium", isCorrect: true }], { c: 4, a: 6 }), null, { c: 5, a: 7 }),
      "BUNDESLIGA",
    );
    expect(after.provisional).toBe(true); // still a number, never back to a bar
  });
});

// ⚠️ AN ORPHAN CATEGORY IS A SILENT CARD BUG, SO IT FAILS THE BUILD.
// The overall counts EVERY key in catStats; the faces can only show six. A
// category that reaches no face therefore props up a number that nothing on
// the card explains — and the card contradicts itself without erroring.
// This has now been reported twice by the same person about the same symptom,
// from two different causes: the lifetime top-up on build 117 ("overall 63,
// every rated face 46-56"), and `chaos` on 2026-09-10 ("the 73 overall does
// not correspond at all to the 6 faces... am I completely mistaken?"). He was
// right both times, and both times a human found it rather than a test.
//
// The second test is the one with teeth: adding a NEW category to the bank
// without giving it a face now fails here rather than shipping a card that
// quietly disagrees with itself.
import { QB } from "../../src/questions.js";
describe("no category is orphaned from the card", () => {
  it("every category in the question bank reaches a face", () => {
    const orphans = {};
    for (const q of QB) {
      // EXCLUDED_CATS are dropped from the card ON PURPOSE and documented at
      // their definition — they are not orphans, they are not scored at all.
      if (EXCLUDED_CATS.has(q.cat)) continue;
      if (!faceCatFor({ cat: q.cat })) orphans[q.cat] = (orphans[q.cat] || 0) + 1;
    }
    expect(orphans, `these bank categories reach no card face: ${JSON.stringify(orphans)}`).toEqual({});
  });

  it("the overall never sits above every face, even with a lopsided category", () => {
    // The shape that broke it: one huge, very strong category beside several
    // ordinary ones. Before `chaos` had a face this produced overall 73 with a
    // top face of 60.
    const lopsided = {
      PL: { c: 26, a: 58 }, UCL: { c: 18, a: 46 }, WorldCup: { c: 26, a: 73 },
      Records: { c: 19, a: 48 }, Managers: { c: 26, a: 45 },
      chaos: { c: 413, a: 452 },
    };
    const card = computeCard(lopsided, null, null);
    const faces = card.ratings.filter((r) => r.rated).map((r) => r.rating);
    expect(faces.length, "fixture should rate at least one face").toBeGreaterThan(0);
    expect(Math.max(...faces), "the overall floated above every face").toBeGreaterThanOrEqual(card.overall - 2);
  });
});


/**
 * ⭐ THE PLAYER AND THEIR FRIENDS MUST SEE THE SAME CARD.
 *
 * Alex, 2026-09-11, holding his phone next to the simulator: "i just think it
 * is important that everyone sees the same card you know, the player and their
 * friends."
 *
 * He was right, and it was not a stale read. Johannes read 69 to his friends
 * and 74 to himself, every face lower. Two causes, both at the friend call
 * sites in ProfileScreen:
 *
 *  1. `friendStats.totalCorrect` is ALWAYS null. Measured on prod: all 152
 *     accounts carrying catStats have a null `totalCorrect` inside the stats
 *     jsonb, because the sync writes that number to the `correct_answers`
 *     COLUMN instead. `|| 0` then told computeCard the player answered 1028
 *     questions and got NONE right.
 *  2. The pin was not passed, so a league the player chose was invisible to
 *     everyone but the player.
 *
 * ⚠️ WHY IT ONLY SHOWED ON SOME CARDS: the lifetime top-up applies ONLY to a
 * record with no `d` buckets (isScored false). 119 of 152 accounts have `d`
 * and ignored the lie entirely; the 33 still on legacy data had their whole
 * card driven by it. A bug that is invisible on four fifths of the data is
 * exactly the kind that ships.
 */
describe("a friend's card equals the player's own card", () => {
  // Johannes's real shape, trimmed: legacy c/a only, NO `d` anywhere.
  const LEGACY = {
    PL: { a: 57.97, c: 26.24 }, UCL: { a: 45.93, c: 17.88 },
    WorldCup: { a: 73.17, c: 26.14 }, Records: { a: 48.01, c: 19.44 },
    Legends: { a: 7, c: 0 }, Bundesliga: { a: 23.54, c: 11.78 },
  };
  const LIFETIME = { c: 684, a: 1028 };

  it("the lifetime top-up is load-bearing for a legacy record — so it must be REAL", () => {
    const withTruth = computeCard(LEGACY, 684 / 1028, LIFETIME);
    const withZero  = computeCard(LEGACY, 684 / 1028, { c: 0, a: 1028 });
    // If these were equal the bug would have been harmless. They are not:
    // measured 74 vs 69 on the real row.
    expect(withZero.overall).toBeLessThan(withTruth.overall);
    for (const r of withZero.ratings) {
      const truth = withTruth.ratings.find((x) => x.cat === r.cat);
      expect(r.rating).toBeLessThanOrEqual(truth.rating);
    }
  });

  it("same data + same pin ⇒ byte-identical card, whoever is looking", () => {
    for (const pin of [undefined, "PL", "Bundesliga"]) {
      const owner  = computeCard(LEGACY, 684 / 1028, LIFETIME, pin);
      const friend = computeCard(LEGACY, 684 / 1028, LIFETIME, pin);
      expect(friend.overall).toBe(owner.overall);
      expect(friend.tier).toBe(owner.tier);
      expect(friend.ratings.map((r) => `${r.abbr}:${r.rating}`))
        .toEqual(owner.ratings.map((r) => `${r.abbr}:${r.rating}`));
    }
  });

  it("a pin the player chose changes the card — so dropping it changes what a friend sees", () => {
    const unpinned = computeCard(LEGACY, 684 / 1028, LIFETIME);
    const pinned   = computeCard(LEGACY, 684 / 1028, LIFETIME, "Bundesliga");
    // Not a cosmetic relabel: the pinned league keeps its own slot and every
    // OTHER league folds into Clubs, so the Clubs face moves too.
    expect(pinned.ratings[0].abbr).toBe("BUNDESLIGA");
    expect(unpinned.ratings[0].abbr).not.toBe("BUNDESLIGA");
  });

  // ⚠️ SOURCE-LEVEL, deliberately. The defect was not a wrong value, it was
  // reading a field that is always null while the right one sat two lines up
  // under a name differing by one qualifier. No value-level test can see that.
  it("ProfileScreen never feeds the friend card the always-null blob field", () => {
    const SRC = readFileSync(fileURLToPath(new URL("../../src/screens/ProfileScreen.jsx", import.meta.url)), "utf8");
    expect(SRC).not.toMatch(/friendStats\.totalCorrect/);
    expect(SRC).toMatch(/const friendLifetime = \{ c: totalCorrect,/);
    expect(SRC).toMatch(/const friendPin = friendStats\.cardLeague/);
    // both friend surfaces take the shared pair
    expect((SRC.match(/computeCard\([^)]*friendLifetime, friendPin\)/g) || []).length).toBe(2);
  });
});
