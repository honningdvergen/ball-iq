import { describe, it, expect, beforeEach } from "vitest";
import { CALIBRATION } from "../../src/data/cardCalibration.js";
import { computeCard, pickLeagueFace, ratingFromScore, ratingFromAccuracy, faceCatFor, cardTier, PRIOR_WEIGHT, MULT, AVG_MULT, BASELINE, scoreOf, LEAGUE_CATS } from "../../src/lib/ballIqCard.js";
import { CLUB_NAME_TO_COMP } from "../../src/data/clubPackColours.js";

// THE MODEL (Alex, 2026-09-09): "61% accuracy on easy equals 61; 61% at medium
// should be 10% more rewarding, hard 20%." These pin that sentence, the two
// guardrails around it, and the population reference it is checked against.

const played = (n, acc, diff) => {
  let s = 0; for (let i = 0; i < n; i++) s += ((i / n) < acc ? MULT[diff] : 0);
  return { PL: { c: Math.round(n * acc), a: n, s, n } };
};

describe("Alex's sentence", () => {
  it("61% on easy = 61, and the same 61% is worth more on medium and more again on hard", () => {
    const N = 4000; // large so 20 answers of prior are noise
    expect(computeCard(played(N, 0.61, "easy")).overall).toBe(61);
    expect(computeCard(played(N, 0.61, "medium")).overall).toBe(76);   // 61 × 1.25
    expect(computeCard(played(N, 0.61, "hard")).overall).toBe(91);     // 61 × 1.50, minus a shade of prior
  });
  it("the multipliers are exactly 1.0 / 1.25 / 1.50 and AVG_MULT is their bank-mix average", () => {
    // 1.25/1.50 since 2026-09-10 (Alex, second pass). The premium also sets
    // where the whole population sits — at 1.15/1.25 the median card read 64,
    // the best card in the game was 90 and the top nine points of the scale
    // were unreachable. See the note on MULT in scripts/calibrate-card.mjs.
    // Bank mix re-counted across all 7,078 graded questions: 24.9 / 48.1 / 27.0.
    expect(MULT).toEqual({ easy: 1.0, medium: 1.25, hard: 1.50 });
    expect(AVG_MULT).toBeCloseTo(0.249 * 1.0 + 0.481 * 1.25 + 0.270 * 1.50, 3);
  });
  it("a hard specialist at 50% out-rates an easy farmer at 55%; perfect on hard caps at 99", () => {
    expect(computeCard(played(200, 0.5, "hard")).overall).toBeGreaterThan(computeCard(played(200, 0.55, "easy")).overall);
    expect(computeCard(played(200, 1.0, "hard")).overall).toBe(99);
    expect(ratingFromScore(1.25)).toBe(99);
    expect(ratingFromScore(0)).toBe(40);
  });
});

describe("the two guardrails", () => {
  it("an unplayed card is the measured median player, and two lucky rights cannot make gold", () => {
    expect(computeCard({}).overall).toBe(Math.round(BASELINE * 100));
    expect(computeCard({}).overall).toBe(67);
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
    // ⚠️ DERIVED, NOT PINNED. What this test is about is the SHAPE — never
    // falls, converges on the player's own level — and that is true at any
    // premium. Pinning the literal made it fail (with seven others) the first
    // time the multipliers moved, which teaches "retune the number" instead of
    // "check the shape". The target is 2/3 at medium; 20 answers of prior still
    // pull a couple of points even at 201 answers.
    const target = Math.round(100 * (2 / 3) * MULT.medium);
    expect(prev).toBeGreaterThanOrEqual(target - 3);
    expect(prev).toBeLessThanOrEqual(target);
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
    expect(scoreOf({ c: 55, a: 106 }).s).toBeCloseTo(AVG_MULT * 55, 10);
    expect(scoreOf({ c: 55, a: 106 }).n).toBe(106);
    expect(scoreOf({ c: 1, a: 1, s: 1.2, n: 1 })).toEqual({ s: 1.2, n: 1 });
    // `u` — a real answer with no difficulty grade — is worth the average
    // question and MUST reach the score. 91% of the live answer log is `u`.
    expect(scoreOf({ d: { u: [6, 10] } })).toEqual({ s: AVG_MULT * 6, n: 10 });
    // raw counts first; the frozen decayed totals carry only the remainder
    expect(scoreOf({ d: { u: [6, 10] }, c: 10, a: 20 }).n).toBe(20);
    // and a record whose raw counts have caught up with them carries no estimate
    expect(scoreOf({ d: { u: [6, 10] }, c: 5, a: 10 })).toEqual({ s: AVG_MULT * 6, n: 10 });
    expect(scoreOf(undefined)).toEqual({ s: 0, n: 0 });
    // The median player reads 67. Two moves got here on 2026-09-10: the
    // population was re-measured from REAL per-question records (median 0.5306,
    // not the 0.58 the decayed c/a totals claimed), and then the difficulty
    // premium was raised to 1.25/1.50 so the scale actually reaches its own
    // ceiling — at 1.15/1.25 the best card in the game was 90 of a possible 99.
    expect(ratingFromAccuracy(CALIBRATION.median)).toBe(67);
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

describe("your league on the card", () => {
  it("auto-picks the league you have actually answered most in", () => {
    const cs = { PL: { d: { u: [5, 12] } }, Bundesliga: { d: { u: [20, 40] } } };
    expect(pickLeagueFace(cs).cat).toBe("Bundesliga");
    expect(computeCard(cs).ratings[0].abbr).toBe("BUNDESLIGA");
  });
  it("falls back to the Premier League only when NOTHING has been answered", () => {
    expect(pickLeagueFace({}).cat).toBe("PL");
    expect(pickLeagueFace({ WorldCup: { d: { u: [9, 10] } } }).cat).toBe("PL");
  });
  // ⚠️ THE WHOLE POINT OF THE PICKER. 8 of 112 rated cards have answered no
  // league question at all and wear the Premier League by pure fallback — the
  // German who watches the Bundesliga but only plays Daily 7. A pin must
  // therefore work with ZERO evidence behind it, and must not be overridable
  // by play: if twenty PL answers could take it back, the choice is a
  // suggestion, not a setting.
  it("an explicit pin is absolute — no evidence needed, and play cannot undo it", () => {
    expect(pickLeagueFace({}, "Bundesliga").cat).toBe("Bundesliga");
    const heavyPL = { PL: { d: { u: [200, 400] } }, Bundesliga: { d: { u: [1, 2] } } };
    expect(pickLeagueFace(heavyPL, "Bundesliga").cat).toBe("Bundesliga");
    expect(computeCard(heavyPL, undefined, undefined, "Bundesliga").ratings[0].abbr).toBe("BUNDESLIGA");
    // and the other five faces are NOT changeable — only slot 0 moves
    expect(computeCard(heavyPL, undefined, undefined, "Bundesliga").ratings.slice(1).map(r => r.abbr))
      .toEqual(computeCard(heavyPL).ratings.slice(1).map(r => r.abbr));
  });
  it("a pin that names no real league is ignored rather than blanking the slot", () => {
    expect(pickLeagueFace({ LaLiga: { d: { u: [8, 10] } } }, "Eredivisie").cat).toBe("LaLiga");
    expect(pickLeagueFace({}, "").cat).toBe("PL");
  });
  it("pinning a league you have played keeps its real rating, not a blank", () => {
    const cs = { PL: { d: { u: [30, 50] } }, SerieA: { d: { u: [18, 20] } } };
    const pinned = computeCard(cs, undefined, undefined, "SerieA");
    expect(pinned.ratings[0].abbr).toBe("SERIE A");
    expect(pinned.ratings[0].rated).toBe(true);
    // the overall pools every answer and must not move just because the card
    // is showing a different face
    expect(pinned.overall).toBe(computeCard(cs).overall);
  });
});

describe("club play feeds the faces", () => {
  it("routes by real category, alias, then the club's league", () => {
    expect(faceCatFor({ cat: "PL" })).toBe("PL");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "UCL", club: "Arsenal" })).toBe("UCL");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Arsenal" })).toBe("PL");
    // Stored under its REAL league since 2026-09-10 — the card's league slot is
    // the player's own most-played league, so pooling at write time would
    // destroy the signal it reads. computeCard pools at render instead.
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "Legends", club: "Juventus" })).toBe("SerieA");
    expect(faceCatFor({ cat: "ChampionsLeague" })).toBe("UCL");
    expect(faceCatFor({ cat: "Euros" })).toBe("WorldCup");
    // Since the 2026-09-10 re-cut these reach a face instead of falling off the
    // card — that is the whole point of the re-cut.
    expect(faceCatFor({ cat: "History" })).toBe("Legends");
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Marseille" })).toBe("Ligue1"); // routes since 09-10
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
    // every value is either a real league face or the Clubs catch-all — never
    // an unrouted club, and never a pooled one where the league is known
    const LEGAL = new Set([...LEAGUE_CATS, "Clubs"]);
    for (const v of Object.values(CLUB_NAME_TO_COMP)) expect(LEGAL.has(v), `${v} is not a face`).toBe(true);
    for (const l of ["LaLiga", "SerieA", "Bundesliga", "Ligue1", "SuperLig", "Primeira"]) {
      expect(by[l], `${l} has no clubs routed to it`).toBeGreaterThanOrEqual(3);
    }
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
    // ⚠️ RAW COUNTS, NOT DECAYED SUMS (2026-09-10). The writer no longer
    // derives s/n through CAT_DECAY — that is what produced "26.78 correct",
    // a number nobody can check that also saturates at 200 answers.
    expect(pl.d).toEqual({ h: [1, 1], e: [0, 1], m: [1, 1] });
    expect(pl.s).toBeUndefined();
    expect(pl.n).toBeUndefined();
    // and scoreOf weights each bucket by its OWN difficulty
    expect(scoreOf(pl)).toEqual({ s: MULT.hard + MULT.medium, n: 3 });
    expect(cs._legacy).toBeUndefined();
  });

  it("files a club answer under its league's face", () => {
    // Juventus -> SerieA -> the Clubs face (2026-09-10 re-cut). The point of
    // the test is unchanged: a club answer must NOT pile up under "ClubQuiz",
    // which was the biggest key in prod and fed nothing.
    const cs = recordAnswers({}, [{ cat: "ClubQuiz", realCat: "History", club: "Juventus", diff: "medium", isCorrect: true }]);
    expect(cs.SerieA).toBeDefined();   // its own league, not a pool
    expect(cs.Clubs).toBeUndefined();
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
