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
  WORDLE_ANSWER_POOL,
  WORDLE_MANAGERS,
} from "../../src/lib/wordle.js";

// The pool size the log was generated from. If WORDLE_PLAYERS grows, the
// formula-vs-log equality check below is skipped (that divergence is the
// entire point of the freeze) but every other invariant still runs.
const FROZEN_POOL_LENGTH = 406;

// Last log index that had already been served to players when the 4-letter
// purge ran — index 86 = Footle #87 = 2026-07-29. Everything at or below this
// is public record and must never change; everything above it is ours to
// curate. Advance it ONLY alongside another deliberate rewrite of the tail.
const PUBLISHED_THROUGH_IDX = 86;

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
    WORDLE_ANSWER_LOG.forEach((answer, n) => {
      expect(pool.has(answer)).toBe(true);
      // 5-8 from #88 on. The published prefix keeps its 4-letter answers:
      // rewriting a day that real players already solved would falsify the
      // public archive (api/footle.js, /footle/answer).
      expect(answer.length).toBeGreaterThanOrEqual(n > PUBLISHED_THROUGH_IDX ? 5 : 4);
      expect(answer.length).toBeLessThanOrEqual(8);
    });
  });

  it("no already-published day ever moves", () => {
    if (WORDLE_PLAYERS.length !== FROZEN_POOL_LENGTH) {
      // Pool has grown since the freeze — the formula is EXPECTED to
      // disagree now; the log is the source of truth. Nothing to verify.
      return;
    }
    // Only the PUBLISHED prefix is checked against the generating formula.
    // Beyond it the log is deliberately hand-curated (the 4-letter purge of
    // 2026-07-29), which is exactly what the freeze exists to permit — the
    // invariant that matters is that no answer a player has already seen
    // changes, not that unplayed future days still match a formula.
    for (let n = 0; n <= PUBLISHED_THROUGH_IDX; n++) {
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

// ── Managers are guessable but never the answer (Alex, 2026-07-29) ───────────
//
// The hero reads "Surname of a footballer" — the word "manager" was cut because
// it wrapped the subtitle onto a fourth line. Copy and puzzle have to agree, so
// the seven manager-only names stopped being answers on the same day.
//
// This is a promise that lapses SILENTLY: nothing crashes if a manager sneaks
// back into the pool, a player just gets a puzzle the card told them they
// wouldn't. The frozen prefix is exempt — BIELSA is Footle #11, already
// published, and api/footle.js serves that archive.
describe('managers are guessable, never answers', () => {
  it('keeps manager-only names out of the answer pool', () => {
    const leaked = WORDLE_ANSWER_POOL.filter((w) => WORDLE_MANAGERS.includes(w));
    expect(leaked).toEqual([]);
  });

  it('keeps them valid as GUESSES — rejecting MOURINHO would just baffle people', () => {
    for (const m of WORDLE_MANAGERS) expect(WORDLE_PLAYERS).toContain(m);
  });

  it('has no manager scheduled on any unpublished day', () => {
    const future = WORDLE_ANSWER_LOG
      .map((w, i) => ({ day: i + 1, w }))
      .filter(({ day, w }) => day > PUBLISHED_THROUGH_IDX + 1 && WORDLE_MANAGERS.includes(w));
    expect(future).toEqual([]);
  });
});
