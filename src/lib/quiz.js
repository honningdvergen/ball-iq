// Pure quiz helpers, extracted from the App.jsx monolith so they can be tested.
//
// Everything here MUST stay pure and dependency-free: no React, no localStorage,
// no Date.now(), no network. That's the whole point — App.jsx is ~10.5k lines and
// nothing inside it is reachable from a test, which is how the Daily 7 shipped
// broken for months (see pickDailyQuestions, now in ./dailyDraw.js).

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
  // ⚠️ THE ANSWER'S ERA, not the newest option's. "Roma's first Scudetto — which
  // season?" carried 1951-52 as a distractor, so the max-of-everything rule
  // read it as modern and it led today's Daily 7 (review 2026-09-06, B7). The
  // stem + the correct option decide; the distractors are a second veto (a
  // 1930s/1870s/1910s/1890s set is pre-era whatever the stem says). A
  // question with no year anywhere is caught only by the `preEra` bank flag
  // below — no regex can see it.
  // THE BANK FLAG the comment above asked for. A question can be about a
  // pre-era fact and contain no year at all — "Torino were co-founded by which
  // Swiss businessman?" is 1906 and every regex here reads it as year-less,
  // which is why it led a Daily 7 (review B7). No pattern can catch that class;
  // only a human marking the question can. `preEra: true` means exactly "this
  // is older than DAILY_MIN_ERA even though nothing in the text says so".
  //
  // ⚠️ IT CANNOT REPAIR THE PAST. The daily log is frozen and append-only by
  // design (see below) — precisely so a bank edit can never rewrite a day
  // somebody already played and shared. So flagging a question keeps it out of
  // FUTURE draws and leaves the days it already led exactly as they were, which
  // is the correct trade and not a shortfall of this fix.
  if (q && q.preEra === true) return false;
  const opts = Array.isArray(q.o) ? q.o : [];
  const answer = Number.isInteger(q.a) && opts[q.a] != null ? String(opts[q.a]) : "";
  const core = yearsReferenced(`${q.q || ""} ${answer}`);
  if (core.length > 0 && Math.max(...core) < minYear) return false;
  const all = yearsReferenced(`${q.q || ""} ${opts.join(" ")}`);
  return all.length === 0 || Math.max(...all) >= minYear;
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
// ⚠️ RETIRED 2026-08-24 BY ALEX, after playing it: "i think we scrap the 2026
// summer mode, the questions are factually correct and all but it is such a bad
// mode… like 40% of the questions there have really disappointed me."
//
// He is right about the shape, and it is worth writing down because the next
// topical pack will be tempting for the same reasons. A pack about the last few
// weeks cannot test football knowledge — it tests whether you read the news.
// "Which club broke its transfer record to sign Yan Diomande?" is not a hard
// question, it is an unanswerable one for anyone who was not following the
// window, and it rots the moment the window closes. The mode was re-cut once
// already (headline questions moved to easy, tile served hard-only) and that
// only sharpened the problem: the "detail tier" is minutiae.
//
// The retirement path this file documented is exactly the one taken — null the
// constant, no other code change. The pack's 89 questions are ALSO withheld
// from general draws via RETIRED_TAGS below; they remain in the bank, so this
// is reversible and nothing is lost while Alex decides which to keep.
export const TOPICAL_PACK = null;

/**
 * Tags withheld from every draw.
 *
 * ⚠️ Nulling TOPICAL_PACK removes the TILE, not the questions — they each carry
 * a real `cat` (Transfers 33, WorldCup 22, Managers 11, PL 8…), so without this
 * they would keep surfacing in Classic and category quizzes, which is precisely
 * where the 40% Alex objected to would still reach players.
 *
 * Withheld rather than deleted: none of them are in the frozen Daily 7 log
 * (checked), so deletion would be safe — but 89 rows is a large editorial call
 * and some fraction are fine. This makes them inert today and keeps every one
 * recoverable by removing a string.
 */
export const RETIRED_TAGS = new Set(["summer2026"]);
