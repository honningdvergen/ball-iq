// Footle answer-schedule freeze. WORDLE_ANSWER_LOG pins #1..#400 so the
// player pool can grow without retroactively rewriting past answers (the
// old pure-stride formula used pool length as its modulo base, so ONE
// appended player moved every answer — including the public archive that
// api/footle.js serves).
import { describe, it, expect } from "vitest";
import {
  WORDLE_PLAYERS,
  WORDLE_ANSWER_LOG,
  WORDLE_ANCHOR_DAY,
  WORDLE_ANCHOR_IDX,
  WORDLE_STRIDE,
  getWordleAnswerForDayIndex,
  getWordleAnswer,
  getWordleDayIndex,
} from "../../src/lib/wordle.js";

// The pool size the log was generated from. If WORDLE_PLAYERS grows, the
// formula-vs-log equality check below is skipped (that divergence is the
// entire point of the freeze) but every other invariant still runs.
const FROZEN_POOL_LENGTH = 406;

// The pre-freeze algorithm, verbatim: pure stride over a given pool.
function strideFormula(dayIndex, pool) {
  const offset = (dayIndex - WORDLE_ANCHOR_DAY) * WORDLE_STRIDE;
  const len = pool.length;
  const idx = ((WORDLE_ANCHOR_IDX + offset) % len + len) % len;
  return pool[idx];
}

describe("WORDLE_ANSWER_LOG freeze", () => {
  it("covers #1..#400 with real pool entries of valid Footle lengths", () => {
    expect(WORDLE_ANSWER_LOG).toHaveLength(400);
    const pool = new Set(WORDLE_PLAYERS);
    for (const answer of WORDLE_ANSWER_LOG) {
      expect(pool.has(answer)).toBe(true);
      expect(answer.length).toBeGreaterThanOrEqual(4);
      expect(answer.length).toBeLessThanOrEqual(8);
    }
  });

  it("matches the old stride formula for every logged day (zero behavior change)", () => {
    if (WORDLE_PLAYERS.length !== FROZEN_POOL_LENGTH) {
      // Pool has grown since the freeze — the formula is EXPECTED to
      // disagree now; the log is the source of truth. Nothing to verify.
      return;
    }
    for (let n = 0; n < WORDLE_ANSWER_LOG.length; n++) {
      expect(WORDLE_ANSWER_LOG[n]).toBe(strideFormula(WORDLE_ANCHOR_DAY + n, WORDLE_PLAYERS));
    }
  });

  it("appending a player changes no answer for any logged day (incl. all days <= today)", () => {
    const grownPool = [...WORDLE_PLAYERS, "FAKEGUY"];
    // Reimplement answerFor over the grown pool exactly as wordle.js does:
    // log first, stride fallback beyond the horizon.
    const answerForWithGrownPool = (dayIndex) => {
      const n = dayIndex - WORDLE_ANCHOR_DAY;
      if (n >= 0 && n < WORDLE_ANSWER_LOG.length) return WORDLE_ANSWER_LOG[n];
      return strideFormula(dayIndex, grownPool);
    };
    const today = getWordleDayIndex();
    expect(today).toBeGreaterThanOrEqual(WORDLE_ANCHOR_DAY); // sanity: Footle launched
    expect(today).toBeLessThan(WORDLE_ANCHOR_DAY + WORDLE_ANSWER_LOG.length); // today is inside the log
    for (let di = WORDLE_ANCHOR_DAY; di < WORDLE_ANCHOR_DAY + WORDLE_ANSWER_LOG.length; di++) {
      expect(answerForWithGrownPool(di)).toBe(getWordleAnswerForDayIndex(di));
    }
  });

  it("getWordleAnswer() is the logged answer for today", () => {
    const today = getWordleDayIndex();
    expect(getWordleAnswer()).toBe(WORDLE_ANSWER_LOG[today - WORDLE_ANCHOR_DAY]);
  });

  it("known anchors: #1 = GAZZA (2026-05-04), #72 = KLOSE (2026-07-14)", () => {
    expect(getWordleAnswerForDayIndex(WORDLE_ANCHOR_DAY)).toBe("GAZZA");
    expect(getWordleAnswerForDayIndex(WORDLE_ANCHOR_DAY + 71)).toBe("KLOSE");
  });
});
