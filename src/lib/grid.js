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
 * A header is a string, stored by name or id and never by index (see
 * scripts/gen-grid-schedule.mjs):
 *   "FC Barcelona"   a club: the career name, as v1 had it
 *   "nat:Argentina"  a nationality: "from Argentina"
 *   "in:Germany"     a spell at a club in that country (grid-club-countries.mjs)
 *   "with:Q615"      a spell overlapping that star's at the same club by a
 *                    season (overlapYears in build-grid-pool.mjs)
 */
export function headerKind(h) {
  const m = /^(nat|in|with):(.+)$/.exec(String(h || ""));
  return m ? { t: m[1], v: m[2] } : { t: "club", v: String(h || "") };
}

// Each star's teammates as a Set, once per pool.
const MATES = new WeakMap();
function matesOf(pool, star) {
  if (!pool.mates) return null;
  let m = MATES.get(pool.mates);
  if (!m) { m = new Map(); MATES.set(pool.mates, m); }
  if (!m.has(star)) m.set(star, new Set(pool.mates[star] || []));
  return m.get(star);
}

/**
 * Whether our record shows this player meeting one header. false means "not
 * in our record", never "not true" (see the note on UNCONFIRMED).
 */
export function fits(pool, id, header) {
  const cs = pool.players[id];
  if (!cs) return false;
  const { t, v } = headerKind(header);
  if (t === "club") return cs.some((i) => pool.clubs[i] === v);
  if (t === "nat") return pool.natNames != null && pool.natNames[pool.nat?.[id]] === v;
  if (t === "in") return cs.some((i) => pool.country?.[i] === v);
  return !!matesOf(pool, v)?.has(id);
}

/**
 * Judge one typed guess against one cell.
 *
 * @param {object}   pool     { players: {id: [clubIdx]}, clubs: string[], index: [{id,name}] }
 *                            and, for the other headers, natNames/nat, country, mates
 *                            (toJudgePool)
 * @param {string}   typed    what the player wrote
 * @param {string}   rowClub  the row's header: a club's name, or "nat:", "in:", "with:" (headerKind)
 * @param {string}   colClub  the column's header, the same way
 */
export function judgeCell(pool, typed, rowClub, colClub) {
  const text = String(typed || "").trim();
  if (!text) return { result: GRID.UNKNOWN, player: null };

  const hit = matchGuess(pool.index, text);
  if (!hit) return { result: GRID.UNKNOWN, player: null };
  // matchGuess returns null on an ambiguous surname; a caller that wants to
  // distinguish "nobody" from "which one?" passes an explicit resolver.
  if (!pool.players[hit.id]) return { result: GRID.UNCONFIRMED, player: hit };

  const ok = fits(pool, hit.id, rowClub) && fits(pool, hit.id, colClub);
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
 * scripts/build-grid-pool.mjs --write: { c: clubs, p: players, N: nations,
 * n: nation per player, k: country per club, m: teammates per star }) and the
 * names, which live in mysteryPool.json (the same index the club-page grid uses).
 */
export function toJudgePool(gridPool, index) {
  return {
    clubs: gridPool.c, players: gridPool.p, index,
    natNames: gridPool.N, nat: gridPool.n, country: gridPool.k, mates: gridPool.m,
  };
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
  const groups = homonymsOf(pool.index);
  const out = [];
  for (const p of pool.index) {
    if (!fits(pool, p.id, rowClub) || !fits(pool, p.id, colClub)) continue;
    const same = groups.get(normaliseName(p.name)) || [p];
    const r = judgeCell({ ...pool, index: same }, p.name, rowClub, colClub);
    if (r.result === GRID.CORRECT && r.player.id === p.id) out.push(p);
  }
  return out.sort((a, b) => (b.fame || 0) - (a.fame || 0));
}

/**
 * The rarity score for one right answer, Immaculate Grid's idea turned round
 * so that more is better: 100 minus the share of players who would have named
 * him. We have no pick counts, so the share is modelled from fame: the cell's
 * answers (cellAnswers, most famous first) are picked in proportion to
 * 1 / (rank + 1), the long tail of a popularity list. The most famous answer
 * scores lowest; the obscure end scores in the 90s.
 *
 * Players of equal fame share a rank. A right answer cellAnswers does not offer
 * (a pick whose typed name would reach a namesake) counts as the rarest.
 *
 * @param {{id: string, fame?: number}[]} answers  cellAnswers for the cell
 * @param {string} id                              the player named
 * @returns {number} 1..99
 */
export function rarityScore(answers, id) {
  const n = answers.length;
  if (!n) return 0;
  const me = answers.find((p) => p.id === id);
  const rank = me ? answers.filter((p) => (p.fame || 0) > (me.fame || 0)).length : n - 1;
  let h = 0;
  for (let i = 1; i <= n; i++) h += 1 / i;
  const share = 100 / (rank + 1) / h;
  return Math.min(99, Math.max(1, Math.round(100 - share)));
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
  const pts = (c) => (Number.isInteger(c.pts) && c.pts >= 0 && c.pts <= 100 ? c.pts : 0);
  const cells = saved.cells.map((c) => (c && typeof c.id === "string" && typeof c.name === "string" ? { id: c.id, name: c.name, pts: pts(c) } : null));
  const ids = cells.filter(Boolean).map((c) => c.id);
  if (new Set(ids).size !== ids.length) return null; // a player is used once per board
  if (ids.length > GRID_GUESSES - saved.left) return null; // more cells filled than guesses spent
  return { cells, left: saved.left, gaveUp: !!saved.gaveUp };
}

export const gridOver = (g) => g.gaveUp || g.left <= 0 || g.cells.every(Boolean);

/** The board's rarity score: the sum of its cells' (rarityScore), out of 900. */
export const gridRarity = (g) => g.cells.reduce((s, c) => s + (c?.pts || 0), 0);

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
export function buildGridShareText({ cells, head, score, url }) {
  const rows = [0, 1, 2].map((r) => cells.slice(r * 3, r * 3 + 3).map((c) => (c ? "🟩" : "⬛")).join(""));
  return [head, ...rows, ...(score ? [score] : []), url].join("\n");
}

// ── Headers that are not clubs ───────────────────────────────────────────────

/**
 * The flag for a nation or country header, as the app draws flags elsewhere: a
 * plain emoji (scripts/seo/leagues.mjs, components/TopicPickerSheet.jsx).
 * England's is the subdivision flag, not the Union Jack.
 */
export const GRID_FLAGS = {
  Argentina: "🇦🇷", Belgium: "🇧🇪", Brazil: "🇧🇷", Croatia: "🇭🇷", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", France: "🇫🇷",
  Germany: "🇩🇪", Italy: "🇮🇹", Netherlands: "🇳🇱", Portugal: "🇵🇹", Spain: "🇪🇸", Turkey: "🇹🇷", Uruguay: "🇺🇾",
};

// ── Two players, one phone (the reference game's versus mode) ────────────────
//
// X and O take turns on one board. To put your mark on a square you name a
// player for it; three in a row wins. Each side has three steals: a square the
// other side holds can be taken by naming a DIFFERENT player for it. A player
// can be named once a game, so a steal can never reuse the name it replaces.
//
// ⚠️ THE SAME NEVER-DENY RULE. A name we cannot confirm loses the turn, and the
// copy says we could not confirm him, never that he is wrong.

export const DUEL_STEALS = 3;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const other = (m) => (m === "X" ? "O" : "X");

export const freshDuel = () => ({
  cells: Array(9).fill(null), turn: "X", steals: { X: DUEL_STEALS, O: DUEL_STEALS }, used: [], winner: null, line: null, draw: false,
});

/** The three squares of a finished line, or null. */
export function duelLine(cells) {
  for (const l of LINES) {
    const m = cells[l[0]]?.mark;
    if (m && l.every((i) => cells[i]?.mark === m)) return l;
  }
  return null;
}

/** What the side to move may do with a square: "claim", "steal" or a reason it may not. */
export function duelAction(state, i) {
  if (state.winner || state.draw) return "over";
  const c = state.cells[i];
  if (!c) return "claim";
  if (c.mark === state.turn) return "own";
  return state.steals[state.turn] > 0 ? "steal" : "noSteals";
}

// Hand the turn on. On a full board, a side with no steals left has no move,
// so the turn goes back to the side that has one; with none left either side,
// the game is drawn.
function nextTurn(s) {
  const full = s.cells.every(Boolean);
  const to = other(s.turn);
  if (!full) return { ...s, turn: to };
  if (s.steals[to] > 0) return { ...s, turn: to };
  if (s.steals[s.turn] > 0) return s;
  return { ...s, draw: true };
}

/**
 * Play one judged name on square i. `result` is judgeCell's (or judgePick's)
 * for that square. UNKNOWN and AMBIGUOUS change nothing: the side asks again.
 * @returns {{ state: object, outcome: "placed"|"stolen"|"won"|"draw"|"unconfirmed"|"used"|"retry"|"own"|"noSteals"|"over" }}
 */
export function duelPlay(state, i, result, player) {
  const act = duelAction(state, i);
  if (act !== "claim" && act !== "steal") return { state, outcome: act };
  if (result !== GRID.CORRECT && result !== GRID.UNCONFIRMED) return { state, outcome: "retry" };
  if (state.used.includes(player.id)) return { state, outcome: "used" };
  const steals = act === "steal" ? { ...state.steals, [state.turn]: state.steals[state.turn] - 1 } : state.steals;
  if (result === GRID.UNCONFIRMED) {
    // A steal that fails is still spent: otherwise a steal could be tried for free every turn.
    return { state: nextTurn({ ...state, steals }), outcome: "unconfirmed" };
  }
  const cells = state.cells.map((c, k) => (k === i ? { mark: state.turn, id: player.id, name: player.name } : c));
  const s = { ...state, cells, steals, used: [...state.used, player.id] };
  const line = duelLine(cells);
  if (line) return { state: { ...s, winner: state.turn, line }, outcome: "won" };
  const n = nextTurn(s);
  return { state: n, outcome: n.draw ? "draw" : act === "steal" ? "stolen" : "placed" };
}

/**
 * The side to move gives up the turn. On a full board where the other side has
 * no steals left, nobody else can move, so passing ends the game as a draw.
 */
export function duelPass(state) {
  if (state.winner || state.draw) return state;
  const n = nextTurn(state);
  return n.turn === state.turn && !n.draw ? { ...state, draw: true } : n;
}
