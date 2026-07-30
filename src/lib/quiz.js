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
/** Anything whose newest reference predates this belongs in Legends, not the Daily 7. */
export const DAILY_MIN_ERA = 1950;

/**
 * True when a question touches football from DAILY_MIN_ERA onward.
 *
 * ⚠️ It reads the OPTIONS as well as the stem, and that is the whole point. The
 * question that prompted this — "Sunderland's great side of which decade was
 * dubbed the 'Team of All the Talents'?" — landed as question 1 of 7 on a
 * playtester's Daily 7 with options 1930s / 1870s / 1910s / 1890s. Its stem
 * contains no year at all, so a stem-only filter sails straight past it.
 *
 * The test is on the NEWEST year referenced, not the oldest: "whose 1972 record
 * did Messi beat in 2012?" is a modern question that happens to mention 1972.
 * Questions with no year at all are KEPT — absence of a date is not evidence of
 * age, and most of the bank carries no year.
 *
 * The trailing `s?` is load-bearing. Written first as `\b(1[6-9]\d\d)\b`, it did
 * not match "1930s" at all — there is no word boundary between "0" and "s", so
 * the decade options sailed through and the very question this was built for was
 * still served. Verified by asserting on that row, not by reading the regex.
 */
export function yearsReferenced(text) {
  return (String(text).match(/\b(1[6-9]\d\d|20\d\d)s?\b/g) || []).map((m) => {
    const y = parseInt(m, 10);
    // A DECADE spans its later years, so "the 1990s" reaches 1999 — and that
    // matters: judged as 1990, "Arsenal's famous 1990s back four" and Keegan's
    // "mid-1990s" Newcastle both read as pre-Premier-League, which they are not.
    return /s$/.test(m) ? y + 9 : y;
  });
}

export function isModernEra(q, minYear = DAILY_MIN_ERA) {
  const years = yearsReferenced(`${q.q || ""} ${(q.o || []).join(" ")}`);
  return years.length === 0 || Math.max(...years) >= minYear;
}

export function pickDailyQuestions(QB, dayIndex) {
  // Era filter, not just Legends. Alex's standing rule is that nobody cares about
  // pre-1950 football; we stopped GENERATING it but it kept SURFACING, and the
  // Daily 7 is the worst place for it — it is the most-shared, most-compared
  // screen in the app and the one a new player is most likely to meet first.
  // These questions stay playable in Classic and Legends; they just stop
  // representing us on the daily.
  const mcqOnly = QB.filter((q) => q.type === "mcq" && q.cat !== "Legends" && isModernEra(q));
  return seededShuffle(mcqOnly, dayIndex * DAILY_SEED_MULTIPLIER).slice(0, 7);
}
