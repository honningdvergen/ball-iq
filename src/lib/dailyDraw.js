// The frozen Daily 7 draw, split out of lib/quiz.js on 2026-09-07.
//
// ⚠️ SPLIT FOR WEIGHT, NOT FOR TIDINESS, AND THE SIGNATURES DID NOT CHANGE.
// dailyLog.js is 33 KB of generated frozen answers, and quiz.js is imported
// statically by App.jsx for four small helpers — so the whole log rode into the
// eager Home chunk to serve a draw that cannot run without the question bank.
//
// The obvious fix — making `log` a required parameter — was rejected: the
// default parameter IS the guarantee that a logged day never moves, and every
// caller that forgot to pass it would silently fall through to the live draw,
// which is exactly the 2026-08-19 bug described below. Moving the module keeps
// the default, keeps every signature, and keeps the tests honest.

import DAILY_LOG from '../data/dailyLog.js';
import { seededShuffle, DAILY_SEED_MULTIPLIER, isModernEra } from './quiz.js';

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

/** What a Daily 7 is made of, from 15 Oct 2026. Order is shuffled by the date. */
export const DAILY_MIX = [["easy", 2], ["medium", 4], ["hard", 1]];

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
  //
  // ⚠️ REVERSED IN PART ON 13 OCT 2026, BY THE NUMBERS. With no easy question
  // the Daily 7 averaged 3.2 of 7 over three weeks (about 500 results; 2.7 on
  // 12 Oct; guessing gets 1.75) and a third of all results were 2 or less.
  // Alex, having scored 3 himself: "make it easier ... get the average up to 4
  // correct", and "mix difficulty level throughout the quiz, do not make them
  // gradually harder ... so you do not get 2 right then all wrong".
  //
  // So a day is a FIXED MIX in a SHUFFLED ORDER: two easy, four medium, one
  // hard (DAILY_MIX), placed by the date. On Q1's measured rates (medium 57%,
  // hard 39%) and an assumed 80% for easy, that is about 4 of 7. Two easy a
  // day is what the daily carried before 19 Aug, when one player called a
  // Kane question a free point: if that complaint returns, the lever is the
  // easy POOL (which easy questions qualify), not the count.
  // The order is not a ramp. One thing is kept from 4 Oct: Q1 is never the
  // hard one (opening on a likely miss is the worst first impression).
  const eligible = QB.filter((q) => q.type === "mcq" && q.cat !== "Legends" && isModernEra(q));
  const picked = [];
  DAILY_MIX.forEach(([diff, n], k) => {
    const pool = eligible.filter((q) => q.diff === diff);
    picked.push(...seededShuffle(pool, dayIndex * DAILY_SEED_MULTIPLIER + k * 7919).slice(0, n));
  });
  if (picked.length !== 7) {            // a bank too thin for the mix: the old draw, never a short day
    const shuffled = seededShuffle(eligible.filter((q) => q.diff !== "easy"), dayIndex * DAILY_SEED_MULTIPLIER);
    return warmUpFirst(shuffled.slice(0, 7), shuffled);
  }
  return orderDay(picked, dayIndex);
}

// The order of one day's seven: shuffled by the date, never opening on the
// hard one. Shared by the live draw and the schedule below, so a day reads the
// same however it was chosen.
function orderDay(picked, dayIndex) {
  const order = seededShuffle(picked, dayIndex * DAILY_SEED_MULTIPLIER + 104729);
  if (order[0].diff === "hard") { const k = order.findIndex((q) => q.diff !== "hard"); [order[0], order[k]] = [order[k], order[0]]; }
  return order;
}

/** A question with a "Why?" to show after it is answered. */
export const hasHint = (q) => typeof q?.hint === "string" && q.hint.trim().length > 0;

// ── THE SCHEDULE: DRAWN WITHOUT REPLACEMENT (16 Oct 2026) ────────────────────
//
// ⚠️ WHY THIS REPLACED pickDailyFresh FOR THE LOG. pickDailyFresh shuffles
// each difficulty pool afresh for every day, so consecutive days are
// independent draws from the same pool: they collide (the birthday problem).
// Measured on the log of 13 Oct: 2,090 different questions filled the 2,520
// slots from 18 Oct, 272 of those 360 days held a question a daily player
// had already met, 76 repeats came back within 30 days and 7 within three
// (q_5de8ef on 26 and 28 Nov). The pool was never the limit: it covers about
// two years with no repeat at all.
//
// So the generator now deals each difficulty from ONE seeded permutation by
// cursor: day n takes the next two easy, the next four medium and the next
// hard. Nothing already in `used` (every day kept before the first new one)
// is dealt, and only questions with a "Why?" qualify: the explanation after
// each answer is half of what the daily is for. Only when a pool is
// exhausted does a question come round again, and then in a fresh
// permutation, so the gap is as long as the pool allows.
//
// ⚠️ The committed log is NOT rebuilt with it yet (16 Oct 2026): builds up to
// 1.8.1 cannot fetch a new log, so a rebuilt future would split them from
// the website. It deals any day the generator APPENDS, and rebuilds the
// future with `--regen-from` once a fetching build is adopted.
//
// Deterministic: the same bank, the same first day and the same `used` give
// the same days. It decides only what the GENERATOR writes; a logged day is
// read from the log and never drawn again (pickDailyFromLog).
export function drawDailySchedule(QB, firstDayIndex, count, used = new Set()) {
  const eligible = QB.filter((q) => q.type === "mcq" && q.cat !== "Legends" && isModernEra(q) && hasHint(q));
  const decks = DAILY_MIX.map(([diff, n], k) => {
    const pool = eligible.filter((q) => q.diff === diff);
    const seed = firstDayIndex * DAILY_SEED_MULTIPLIER + k * 7919;
    return { n, pool, seed, cycle: 0, queue: seededShuffle(pool.filter((q) => !used.has(q.id)), seed) };
  });
  // A bank too thin for the mix (tests, a broken load): the live draw, never a short day.
  if (decks.some((d) => d.pool.length < d.n)) {
    return Array.from({ length: count }, (_, i) => pickDailyFresh(QB, firstDayIndex + i));
  }
  const days = [];
  for (let i = 0; i < count; i++) {
    const picked = [];
    const taken = new Set();
    for (const deck of decks) {
      let got = 0, skipped = [];
      while (got < deck.n) {
        if (!deck.queue.length) {
          // Exhausted: everything has been dealt once; start a new round.
          deck.cycle++;
          deck.queue = seededShuffle(deck.pool, deck.seed + deck.cycle * 104723);
        }
        const q = deck.queue.shift();
        if (taken.has(q.id)) { skipped.push(q); continue; }   // only at a round's seam
        picked.push(q); taken.add(q.id); got++;
      }
      deck.queue.unshift(...skipped);
    }
    days.push(orderDay(picked, firstDayIndex + i));
  }
  return days;
}


// ⚠️ Q1 IS ALWAYS MEDIUM (Alex, 2026-10-04, choosing "Medium warm-up Q1").
// Measured from 30 days of Daily 7 answers: Q1 is answered right 57% of the
// time when it is medium and 39% when it is hard, and the set averaged 3.45/7.
// Opening on a likely miss is the worst first impression the mode can make.
// Still medium, never easy, so the 2026-08-19 "no free point" rule holds.
//
// Only Q1 changes: a hard opener is REPLACED by the first unused medium in
// `candidates` (the day's own shuffle), and Q2 to Q7 keep their slots. A plain
// reorder was rejected because it moves no score: a question is as hard in
// slot 5 as in slot 1.
export function warmUpFirst(picked, candidates) {
  // Only a HARD opener is replaced. (It read `!== "medium"` until 13 Oct 2026,
  // which would now swap out an easy Q1 that the mix put there on purpose.)
  if (!picked.length || picked[0].diff !== "hard") return picked;
  const taken = new Set(picked.map((q) => q.id));
  const opener = candidates.find((q) => q.diff === "medium" && !taken.has(q.id));
  return opener ? [opener, ...picked.slice(1)] : picked;
}

// `log` defaults to the bundled copy, and that default is the guarantee (see
// the top of this file). An installed app passes the copy it fetched from the
// site when it holds a good one (lib/dailyRemote.js): that is how a phone
// stays on the same seven as the website after the log is regenerated.
export function pickDailyQuestions(QB, dayIndex, log = DAILY_LOG) {
  const logged = pickDailyFromLog(QB, dayIndex, log);
  return logged || pickDailyFresh(QB, dayIndex);
}
