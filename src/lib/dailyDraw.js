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
