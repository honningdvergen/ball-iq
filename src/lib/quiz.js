// Pure quiz helpers, extracted from the App.jsx monolith so they can be tested.
//
// Everything here MUST stay pure and dependency-free: no React, no localStorage,
// no Date.now(), no network. That's the whole point — App.jsx is ~10.5k lines and
// nothing inside it is reachable from a test, which is how the Daily 7 shipped
// broken for months (see pickDailyQuestions below).

/**
 * Deterministic shuffle — xorshift32 PRNG, Fisher-Yates.
 *
 * DO NOT replace the integer maths with anything float-based. This is the fix for
 * a real bug: the Daily 7 used to sort on Math.sin, which the ECMAScript spec
 * permits engines to approximate differently. 137 of 3000 values differ between
 * JavaScriptCore (iOS WKWebView, Safari) and V8 (Android, Chrome) — enough to
 * flip a comparator's sign and hand iOS and Android players different questions
 * on the same day. Integer bitwise ops (`^`, `<<`, `>>`, `>>>`) are spec-exact
 * via ToInt32/ToUint32, so this is bit-identical on every engine.
 */
export function seededShuffle(arr, seed) {
  let s = seed >>> 0;
  const prng = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The Daily 7's seed multiplier. Changing it reshuffles every past and future day. */
export const DAILY_SEED_MULTIPLIER = 1013904223;

/**
 * The Daily 7 selection — pure, so it can be tested.
 *
 * EVERY PLAYER GETS THE SAME SEVEN. This feeds /c/ challenge links, the "You beat
 * X!" modal and an OG card, so the selection must depend on the date and NOTHING
 * else. Two things broke that and both are easy to reintroduce:
 *
 *  1. No seen-filter. App.jsx has applySeenFilter, which reads a device-local
 *     14-day history — so two players with different play histories got different
 *     questions while the challenge links compared their scores as if identical.
 *     The caller still RECORDS into that history (other modes consume it); this
 *     never reads it.
 *  2. seededShuffle, never Math.sin — see above.
 *
 * Legends is gated out for the same reason getQs does it: the Daily 7 is casual.
 *
 * @param {Array} QB - the full question bank
 * @param {number} dayIndex - UTC-midnight day index (see src/lib/date.js)
 * @returns {Array} exactly the 7 questions for that day, in order
 */
export function pickDailyQuestions(QB, dayIndex) {
  const mcqOnly = QB.filter((q) => q.type === "mcq" && q.cat !== "Legends");
  return seededShuffle(mcqOnly, dayIndex * DAILY_SEED_MULTIPLIER).slice(0, 7);
}
