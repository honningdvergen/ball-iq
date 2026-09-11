// The football grid's answer key — what counts as naming a player for a cell.
//
// ⚠️ THREE OUTCOMES, NOT TWO, AND THE THIRD IS THE POINT. Our career data is a
// curated subset of football, not football. A cell we score at 8 may have 40
// valid players alive. So a guess we cannot confirm is NOT the same thing as a
// wrong guess, and the difference has to survive all the way into the copy: we
// may say "we could not confirm that", and we may never say "he did not play
// there". Telling someone who is right that they are wrong is this mode's
// version of shipping a wrong answer.
//
// ⚠️ THE MATCHER IS REUSED, NOT REWRITTEN. matchGuess already resolves typed
// names for Mystery Player — exact match first, then surname-only, refusing
// ambiguous surnames rather than silently picking whichever sorts first. A
// second copy here would drift from it, which is the exact failure this repo
// has been bitten by before (the engine's own note: "duplicating recordAnswers
// here in vanilla JS is exactly the drift this file has been bitten by").
import { matchGuess } from "./mysteryPlayer.js";

/**
 * CORRECT   — we hold both clubs for this player, with years. Accept.
 * UNCONFIRMED — we know the player, our record does not show both clubs.
 *               ⚠️ NOT a denial. Our record drops academy and trial spells and
 *               is incomplete by construction; the player may well be right.
 * UNKNOWN   — the text does not resolve to a player we hold at all.
 * AMBIGUOUS — a surname shared by players we hold; ask which one.
 */
export const GRID = {
  CORRECT: "correct",
  UNCONFIRMED: "unconfirmed",
  UNKNOWN: "unknown",
  AMBIGUOUS: "ambiguous",
};

/**
 * Judge one typed guess against one cell.
 *
 * @param {object}   pool     { players: {id: [clubIdx]}, clubs: string[], index: [{id,name}] }
 * @param {string}   typed    what the player wrote
 * @param {string}   rowClub  display name of the row's club
 * @param {string}   colClub  display name of the column's club
 */
export function judgeCell(pool, typed, rowClub, colClub) {
  const text = String(typed || "").trim();
  if (!text) return { result: GRID.UNKNOWN, player: null };

  const hit = matchGuess(pool.index, text);
  if (!hit) return { result: GRID.UNKNOWN, player: null };
  // matchGuess returns null on an ambiguous surname; a caller that wants to
  // distinguish "nobody" from "which one?" passes an explicit resolver.
  const clubIdx = pool.players[hit.id];
  if (!clubIdx) return { result: GRID.UNCONFIRMED, player: hit };

  const names = new Set(clubIdx.map((i) => pool.clubs[i]));
  const ok = names.has(rowClub) && names.has(colClub);
  return { result: ok ? GRID.CORRECT : GRID.UNCONFIRMED, player: hit };
}

/**
 * The message for a result. Kept here rather than in a component so the
 * "never deny" rule lives with the logic that decides it.
 *
 * ⚠️ UNCONFIRMED MUST NOT READ AS A DENIAL. "He never played for Chelsea" is a
 * claim our data cannot support. "We can't confirm" is what we actually know.
 */
export function gridMessage(result, player, rowClub, colClub) {
  switch (result) {
    case GRID.CORRECT:
      return `${player.name} — ${shortClub(rowClub)} and ${shortClub(colClub)}.`;
    case GRID.UNCONFIRMED:
      return `We can't confirm ${player.name} for both ${shortClub(rowClub)} and ${shortClub(colClub)}.`;
    case GRID.AMBIGUOUS:
      return "More than one player goes by that name — try a first name too.";
    default:
      return "No player by that name here — check the spelling?";
  }
}

/** "Arsenal F.C." → "Arsenal". The suffixes are noise in a sentence. */
export function shortClub(name) {
  return String(name || "")
    .replace(/\s*(F\.?C\.?|A\.?F\.?C\.?|C\.?F\.?|S\.?C\.?|Club de Fútbol|\(Football\))\s*$/i, "")
    .trim();
}
