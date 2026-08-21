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
import DAILY_LOG from '../data/dailyLog.js';

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

// ── THE FROZEN DAILY LOG ─────────────────────────────────────────────────────
//
// ⚠️ THE BUG THIS EXISTS TO STOP (measured 2026-08-19, from a player report).
// This function used to shuffle the LIVE bank, so adding or removing ONE
// question changed all seven questions of today's daily AND of every past one.
// Verified: +1 question -> today's 7 all change; a daily from 7 days earlier
// -> also rewritten. Consequences: `/c/` challenge links resolved to a
// different quiz than was shared, "shared by everyone today" was false across
// any deploy, and native (frozen bank) disagreed with web continuously.
//
// The comment below already stated the rule — "depend on the date and nothing
// else" — and the implementation depended on the date AND the size of the bank.
//
// Same fix as WORDLE_ANSWER_LOG: log the ANSWERS per day. A logged day never
// consults the bank to decide WHICH questions, only to resolve them, so it is
// immune to additions, deletions and re-tags alike.
//
// Extend with `node scripts/gen-daily-log.mjs` — deliberately, never in the
// build. The generator only ever appends; previously logged days are copied
// byte-for-byte.
//
// ⚠️ A question deleted from the bank cannot resolve. Rather than shortening
// the day (a 6-question "Daily 7" is a bug — the same principle
// pickAvoidingConflicts follows), the gap is topped up from the live shuffle
// for that day, which touches ONLY days that referenced the deleted question.
export function pickDailyFromLog(QB, dayIndex, log = DAILY_LOG) {
  const n = dayIndex - (log?.anchor ?? 0);
  const ids = log?.days?.[n];
  if (!ids) return null;                       // beyond the horizon: caller falls back
  const byId = new Map(QB.map((q) => [q.id, q]));
  const picked = ids.map((id) => byId.get(id)).filter(Boolean);
  if (picked.length === 7) return picked;
  // Top up deterministically, skipping anything already picked.
  const taken = new Set(picked.map((q) => q.id));
  // Same filter as the main draw — otherwise a deleted slot could refill with
  // exactly the free point the draw is built to exclude.
  const pool = QB.filter((q) => q.type === "mcq" && q.cat !== "Legends" && q.diff !== "easy" && isModernEra(q) && !taken.has(q.id));
  for (const q of seededShuffle(pool, dayIndex * DAILY_SEED_MULTIPLIER)) {
    if (picked.length >= 7) break;
    picked.push(q);
  }
  return picked.length === 7 ? picked : null;
}

// The live date-seeded draw, with NO log consulted. Exported so the log
// GENERATOR can compute fresh days — it must never call pickDailyQuestions,
// which reads the log first and would therefore rebuild the log from itself.
// (That exact mistake produced a no-op "regeneration" on 2026-08-19.)
export function pickDailyFresh(QB, dayIndex) {
  // Era filter, not just Legends. Alex's standing rule is that nobody cares about
  // pre-1950 football; we stopped GENERATING it but it kept SURFACING, and the
  // Daily 7 is the worst place for it — it is the most-shared, most-compared
  // screen in the app and the one a new player is most likely to meet first.
  // These questions stay playable in Classic and Legends; they just stop
  // representing us on the daily.
  // ⚠️ NO EASY QUESTIONS IN THE DAILY (Alex, 2026-08-19: "a free point does not
  // belong in the daily"). Prompted by a player calling out "Harry Kane joined
  // Bayern from which Premier League club?" — correct, correctly labelled easy,
  // and a free point for anyone who follows football, which is the whole
  // audience. Measured: the daily was carrying ~1.8 easy questions EVERY day,
  // a quarter of the set.
  //
  // This is the rule club and league quizzes have always used ("for invested
  // fans — never serve easy"); the Daily 7 is the most invested-fan surface we
  // have, since it is shared, compared and carries the streak. 4,270 medium+
  // hard questions remain eligible = 610 days of unique sets, so the pool is
  // not the constraint.
  const mcqOnly = QB.filter((q) => q.type === "mcq" && q.cat !== "Legends" && q.diff !== "easy" && isModernEra(q));
  return seededShuffle(mcqOnly, dayIndex * DAILY_SEED_MULTIPLIER).slice(0, 7);
}

export function pickDailyQuestions(QB, dayIndex) {
  const logged = pickDailyFromLog(QB, dayIndex);
  return logged || pickDailyFresh(QB, dayIndex);
}

// ── Answer-leak avoidance ────────────────────────────────────────────────────
//
// 540 answers in the club packs appear inside another question's stem or hint.
// Each of those questions is correct and was verified when it shipped; the
// defect is the PAIR. Measured on 10-question sessions, 28.9% of club sessions
// contained at least one leaked pair — Parma 66.5%, Porto 64.3% — so roughly
// one session in three was handing out a free point.
//
// Taking one of each pair out of the draw fixes that without touching a single
// verified question. Pure and exported so it can be tested directly.
//
// ⚠️ NEVER SHORTEN A GAME. If avoiding conflicts cannot fill `count` — a thin
// pack where most questions conflict — the remainder is topped up from the
// skipped candidates. A player noticing an easy pair is a small cost; a
// 7-question "10-question quiz" is a bug. Same principle applySeenFilter uses.
//
// ⚠️ NOT FOR THE DAILY 7. Its selection must depend on the date and nothing
// else (it feeds /c/ links, the beat-a-friend modal and an OG card). This takes
// an already-shuffled pool and is order-dependent, so applying it there would
// silently rewrite every past and future daily.
export function pickAvoidingConflicts(pool, count, conflictsOf) {
  const picked = [];
  const skipped = [];
  const taken = new Set();
  for (const q of pool) {
    if (picked.length >= count) break;
    const clash = (conflictsOf(q.id) || []).some((id) => taken.has(id));
    if (clash) { skipped.push(q); continue; }
    picked.push(q);
    taken.add(q.id);
  }
  for (const q of skipped) {
    if (picked.length >= count) break;
    picked.push(q);
  }
  return picked;
}

// ─── TOPICAL PACK ────────────────────────────────────────────────────────────
// A time-boxed, in-the-news set surfaced as its own tile on Home.
//
// WHY IT EXISTS. The summer-2026 pack is 94 questions inside a 6,788-question
// bank. Every one of them is reachable through the normal category pickers, so
// nothing is stranded — but reachable is not the same as findable. Spread that
// thin, a player who wants "what actually happened this summer" meets roughly
// one of these per Transfers quiz and never learns the set exists. Topical
// content is worth most while it is topical, so it gets its own door.
//
// ⚠️ THIS IS DESIGNED TO BE RETIRED. Point `tag` at the next pack and rewrite
// the two strings, or set the whole constant to null to remove the tile with
// no other code change. A topical card that stops being topical is worse than
// no card — it advertises the app's staleness on the home screen.
//
// No count in `desc`, per the standing rule: an inventory number in
// user-facing copy is banned, and it would advertise exactly how small a
// topical pack is.
export const TOPICAL_PACK = {
  key: "topical",
  tag: "summer2026",
  name: "Summer 2026",
  desc: "The window and the World Cup",
};
