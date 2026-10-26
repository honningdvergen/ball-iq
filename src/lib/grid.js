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
import { matchGuess, normaliseName } from "./mysteryPlayer.js";

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

// ── The daily mode (Tiki Taka Toe, screens/GridGame.jsx) ─────────────────────

/**
 * ⚠️ OFF UNTIL ALEX HAS PLAYED IT. While false, nothing on Home links to the
 * mode; /play?game=grid still opens it, so it can be tried by URL. Any Home
 * entry added later reads this switch.
 */
export const GRID_LIVE = false;

/** Days since the epoch of grid #1, gridSchedule.json's anchor (2026-09-12). */
export const GRID_ANCHOR_DAY = 20708;
/** Nine guesses for nine cells: the Immaculate Grid rule. */
export const GRID_GUESSES = 9;

/** The grid's number for a dayIndexForDate() day. 1 on the anchor. */
export const gridNumber = (day) => day - GRID_ANCHOR_DAY + 1;

/**
 * The day's board from the frozen schedule, or null when the schedule does not
 * cover that day (before #1, or past its last day). Never re-rolled here: a
 * missing day is shown as missing.
 * @returns {{ rows: string[], cols: string[], number: number } | null}
 */
export function gridForDay(schedule, day) {
  const n = gridNumber(day);
  const d = schedule?.days?.[n - 1];
  if (n < 1 || !d) return null;
  return { rows: d.r, cols: d.c, number: n };
}

/**
 * The object judgeCell expects, from src/data/gridPool.json (written by
 * scripts/build-grid-pool.mjs --write: { c: clubs, p: players }) and the names,
 * which live in mysteryPool.json (the same index the club-page grid uses).
 */
export function toJudgePool(gridPool, index) {
  return { clubs: gridPool.c, players: gridPool.p, index };
}

/**
 * Judge a player picked from the suggestions. The pick already says WHO, so
 * judgeCell gets an index of that one player: two players who share a full
 * name ("Danilo") must not be judged as whichever of them sorts first.
 */
export function judgePick(pool, player, rowClub, colClub) {
  return judgeCell({ ...pool, index: [player] }, player.name, rowClub, colClub);
}

/**
 * Judge typed text. The same as judgeCell, except that text which resolves to
 * nobody because SEVERAL players carry that surname comes back AMBIGUOUS,
 * so the copy can ask for a first name instead of saying there is no such
 * player. (matchGuess returns null for both; see judgeCell.)
 */
export function judgeTyped(pool, typed, rowClub, colClub) {
  const r = judgeCell(pool, typed, rowClub, colClub);
  if (r.result !== GRID.UNKNOWN) return r;
  const q = normaliseName(typed);
  if (!q) return r;
  let n = 0;
  for (const p of pool.index) {
    const parts = normaliseName(p.name).split(" ");
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts.slice(i).join(" ") === q) { n++; break; }
    }
    if (n > 1) return { result: GRID.AMBIGUOUS, player: null };
  }
  return r;
}

// Index entries grouped by their normalised name, in index order, once per
// index. See cellAnswers.
const HOMONYMS = new WeakMap();
function homonymsOf(index) {
  let m = HOMONYMS.get(index);
  if (!m) {
    m = new Map();
    for (const p of index) {
      const k = normaliseName(p.name);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(p);
    }
    HOMONYMS.set(index, m);
  }
  return m;
}

/**
 * Every player judgeCell accepts for a cell WHEN HIS NAME IS TYPED, most famous
 * first. These are the example answers on the finished board, and what the
 * schedule test counts.
 *
 * ⚠️ BY NAME, NOT BY ID. A player we hold for both clubs whose full name is
 * shared with someone earlier in the index would be judged as that other man
 * when typed, so he is not offered as an example.
 *
 * judgeCell is given the index entries that share the candidate's normalised
 * name instead of all nine thousand: an exact name match takes the first entry
 * with that name in index order, and the group keeps index order, so the
 * result is the one the full index gives at a fraction of the cost.
 */
export function cellAnswers(pool, rowClub, colClub) {
  const ri = pool.clubs.indexOf(rowClub), ci = pool.clubs.indexOf(colClub);
  if (ri < 0 || ci < 0) return [];
  const groups = homonymsOf(pool.index);
  const out = [];
  for (const p of pool.index) {
    const cs = pool.players[p.id];
    if (!cs || !cs.includes(ri) || !cs.includes(ci)) continue;
    const same = groups.get(normaliseName(p.name)) || [p];
    const r = judgeCell({ ...pool, index: same }, p.name, rowClub, colClub);
    if (r.result === GRID.CORRECT && r.player.id === p.id) out.push(p);
  }
  return out.sort((a, b) => (b.fame || 0) - (a.fame || 0));
}

const GRID_KEY = "biq_grid_";

/** A fresh board's state: nine empty cells, nine guesses. */
export const freshGrid = () => ({ cells: Array(9).fill(null), left: GRID_GUESSES, gaveUp: false });

/**
 * Today's saved board, if every part of it still makes sense; otherwise null
 * (and the caller deals a fresh one).
 */
export function restoreGrid(saved) {
  if (!saved || !Array.isArray(saved.cells) || saved.cells.length !== 9) return null;
  if (!Number.isInteger(saved.left) || saved.left < 0 || saved.left > GRID_GUESSES) return null;
  const cells = saved.cells.map((c) => (c && typeof c.id === "string" && typeof c.name === "string" ? { id: c.id, name: c.name } : null));
  const ids = cells.filter(Boolean).map((c) => c.id);
  if (new Set(ids).size !== ids.length) return null; // a player is used once per board
  if (ids.length > GRID_GUESSES - saved.left) return null; // more cells filled than guesses spent
  return { cells, left: saved.left, gaveUp: !!saved.gaveUp };
}

export const gridOver = (g) => g.gaveUp || g.left <= 0 || g.cells.every(Boolean);

export function loadGrid(day) {
  try { return restoreGrid(JSON.parse(localStorage.getItem(GRID_KEY + day) || "null")); } catch { return null; }
}
export function saveGrid(day, g) {
  try { localStorage.setItem(GRID_KEY + day, JSON.stringify(g)); } catch { /* private window: play on unsaved */ }
}
/** One saved board a day would otherwise pile up for ever. */
export function pruneGrids(today, keepDays = 7) {
  try {
    const old = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(GRID_KEY) && !(+k.slice(GRID_KEY.length) > today - keepDays)) old.push(k);
    }
    for (const k of old) localStorage.removeItem(k);
  } catch { /* nothing to clear */ }
}

/** The text share: the board as squares, row by row. */
export function buildGridShareText({ cells, head, url }) {
  const rows = [0, 1, 2].map((r) => cells.slice(r * 3, r * 3 + 3).map((c) => (c ? "🟩" : "⬛")).join(""));
  return [head, ...rows, url].join("\n");
}
