// Ballpark: how a guess stands against everyone else's (20 Nov 2026).
//
// Alex, on the first reveal: the line that makes an estimation game worth
// sharing is the one that says how you did against other people. This asks the
// database for it. One call does both jobs: it keeps this device's first guess
// for the question and returns { n, beat } for the guess sent
// (supabase/migrations/v3_5_ballpark_guesses.sql says exactly what that means).
//
// Same rules as the daily results (lib/dailyResults.js, whose pieces this
// reuses): nothing is sent from a test browser or from localhost, the only
// identity is the random device id the dailies already use, and a failure of
// any kind means the line is simply not shown. It is never guessed at.
import { rpc, synthetic, visitorId, hasBackend } from './dailyResults.js';
import '../i18n/en.js'; // crowdLine names bp.crowd.* keys: the full English table, not on Home's eager path

// Under this many other players a percentage is noise ("closer than 50%" of
// two people), so the line counts heads instead. The dailies' own "how everyone
// did" bars wait for 20 as well (dailyResults.js MIN_N).
export const CROWD_PCT_FROM = 20;

// What the function returned, or null if it is not a pair of sane counts.
export function cleanStanding(d) {
  if (!d || typeof d !== 'object') return null;
  const n = Number(d.n), beat = Number(d.beat);
  if (!Number.isInteger(n) || !Number.isInteger(beat) || n < 0 || beat < 0 || beat > n) return null;
  return { n, beat };
}

// One question, one guess: asked once a page load however often the reveal is
// drawn. A failed call is forgotten, so coming back to the reveal tries again.
const asked = new Map();

export function crowdStanding({ id, guess, answer }) {
  if (typeof id !== 'string' || !(guess > 0) || !(answer > 0)) return Promise.resolve(null);
  if (synthetic() || !hasBackend()) return Promise.resolve(null);
  const vid = visitorId();
  if (!vid) return Promise.resolve(null);
  const key = `${id}:${guess}`;
  if (!asked.has(key)) {
    asked.set(key, rpc('ballpark_guess', { p_question: id, p_guess: guess, p_answer: answer, p_visitor: vid })
      .then(cleanStanding)
      .catch(() => { asked.delete(key); return null; }));
  }
  return asked.get(key);
}

// The line to print, as an i18n key and its numbers, or null for no line.
//   nobody else yet      "You are the first to answer this one."
//   one other            beat them, or did not
//   a few others         "Closer than 3 of the 7 others so far."
//   twenty or more       "Closer than 62% of 143 players."
export function crowdLine(standing) {
  const s = cleanStanding(standing);
  if (!s) return null;
  if (s.n === 0) return { key: 'bp.crowd.first', vars: {} };
  if (s.n === 1) return { key: s.beat === 1 ? 'bp.crowd.oneWon' : 'bp.crowd.oneLost', vars: {} };
  if (s.n < CROWD_PCT_FROM) return { key: 'bp.crowd.count', vars: { beat: s.beat, n: s.n } };
  // Rounded DOWN, and 100 only when it is every one of them: the line never
  // claims a player it did not beat.
  const p = s.beat === s.n ? 100 : Math.min(99, Math.floor((s.beat / s.n) * 100));
  return { key: 'bp.crowd.pct', vars: { p, n: s.n } };
}

export function __resetCrowdForTests() { asked.clear(); }
