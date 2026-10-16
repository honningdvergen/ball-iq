// noBreakScore.js — keep "6-1" on one line, at RENDER time only.
//
// A browser may wrap a line after an ordinary hyphen, so a scoreline in a
// question or an option could split as "won 6-" / "1" on a narrow phone (seen
// on /quiz/bodo-glimt/ question cards, 2026-10-16). U+2011 NON-BREAKING HYPHEN
// looks the same and never breaks. Applied only where a question's stem or an
// option is DRAWN (the app's question card, the static quiz pages); the bank
// text, search, answer matching, share text, reports and structured data all
// keep the plain hyphen. Never write the result back into a question.
//
// Only a hyphen with a digit on BOTH sides changes: 6-1, 2-2, 4-4-2, 1988-89.
// Words ("Saint-Étienne", "half-time") and minus signs keep theirs.
export const NB_HYPHEN = '‑';

const DIGIT_HYPHEN_DIGIT = /(\d)-(?=\d)/g;

export function noBreakScores(text) {
  return typeof text === 'string' ? text.replace(DIGIT_HYPHEN_DIGIT, `$1${NB_HYPHEN}`) : text;
}
