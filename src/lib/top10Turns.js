// Top 10 in turns: pass and play's list mode (screens/Top10Turns.jsx), as pure
// functions so the rules can be tested without rendering
// (tests/unit/top10-turns.test.js).
//
// The rules Alex's build yes covers (26 Nov 2026; brief ball-iq-audit/
// 2026-11-26/pass-play-build-brief.md, JOB 2): players take turns on the one
// phone, one name per turn. A name on the list fills its row for the finder. A
// name not on the list is a strike; three strikes and that player is out and
// is skipped. A name already found is not a strike, and neither is a name
// already tried and missed by anyone: both are refused and the same player
// picks again. The game ends when the list is full or everyone is out. Most
// rows wins; equal rows is a draw. No hints.
//
// The lists and the name search are the daily Top 10's own (src/data/
// top10Lists.json, lib/top10.js, lib/playerSearch.js); nothing here changes
// the daily game.
import { getTop10Number, slotIndexFor, TOP10_SIZE } from './top10.js';
import { standing } from './passPlay.js';

/** Strikes that put a player out. */
export const TURNS_STRIKES = 3;
/** The mode's id in pass and play's config. */
export const TURNS_MODE = 'top10';

// ── Which list ──────────────────────────────────────────────────────────────
// NEVER A DAILY THAT IS STILL TO COME (settled by HQ, 26 Nov 2026: "never spoil
// a daily"). The schedule is `log`: day N of Top 10 plays log[N - 1]. Every id
// the schedule holds from YESTERDAY on is barred: today's and every later
// day's, and yesterday's too, so a phone whose clock runs a day ahead (or that
// has crossed a date line) cannot be handed the list its owner meets today.
// Before launch day the whole schedule is barred. What is left is the lists
// already played as dailies and the ones never scheduled (the library's).
// `data` must be the data the daily itself plays from (a newer schedule fetched
// by the installed app included), so a longer schedule bars its days too.
export function turnsBank(data, date = new Date()) {
  const lists = data?.lists || {};
  const log = Array.isArray(data?.log) ? data.log : [];
  const today = getTop10Number(date); // day 1 is log[0]
  const from = Math.max(0, today - 2); // yesterday's index, never below 0
  const barred = new Set(log.slice(from));
  return Object.keys(lists).filter((id) => !barred.has(id)
    && Array.isArray(lists[id]?.slots) && lists[id].slots.length === TOP10_SIZE);
}

/**
 * A list from the bank at random, avoiding `avoid` (the lists already played
 * this sitting) while any other is left; never the one just played when
 * another exists. Null for an empty bank.
 */
export function pickTurnsList(bank, { avoid = [], current = null, rand = Math.random } = {}) {
  if (!bank || bank.length === 0) return null;
  let pool = bank.filter((id) => !avoid.includes(id) && id !== current);
  if (pool.length === 0) pool = bank.filter((id) => id !== current);
  if (pool.length === 0) pool = bank;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}

// ── A game ──────────────────────────────────────────────────────────────────
/**
 * A fresh game: `order` is the player ids in play order, `start` the index of
 * who goes first. found: slot index -> finder id; missed: [{ key, name, by }]
 * oldest first; strikes per player.
 */
export function newTurnsGame(order, start = 0) {
  const n = order.length;
  return {
    order: [...order],
    turn: n ? order[((start % n) + n) % n] : null,
    found: {},
    strikes: Object.fromEntries(order.map((id) => [id, 0])),
    missed: [],
    over: false,
  };
}

export const isOut = (g, id) => (g.strikes[id] || 0) >= TURNS_STRIKES;
export const foundCount = (g) => Object.keys(g.found).length;

/**
 * What a name would do on this turn, without doing it:
 *  "hit"   - on the list and still open;
 *  "found" - on the list and found already (refused, no strike);
 *  "tried" - not on the list and tried already by anyone (refused, no strike);
 *  "miss"  - not on the list: a strike;
 *  "over"  - the game has ended.
 */
export function judgeTurn(g, list, key) {
  if (g.over || g.turn == null) return { kind: 'over', slot: -1 };
  const slot = slotIndexFor(list, key);
  if (slot >= 0) return { kind: g.found[slot] != null ? 'found' : 'hit', slot };
  if (g.missed.some((m) => m.key === key)) return { kind: 'tried', slot: -1 };
  return { kind: 'miss', slot: -1 };
}

/** The next player in order after `from` who is not out, or null when all are. */
export function nextUp(g, from) {
  const n = g.order.length;
  const at = g.order.indexOf(from);
  for (let step = 1; step <= n; step++) {
    const id = g.order[(at + step) % n];
    if (!isOut(g, id)) return id;
  }
  return null;
}

/**
 * One name on one turn. Returns { game, kind, slot, by }: the game after it
 * (the same object when the name was refused), what it was, the slot it filled
 * and whose turn it was. A hit or a miss passes the turn on; the game ends when
 * all ten are found or everyone is out.
 */
export function playTurn(g, list, pick) {
  const { kind, slot } = judgeTurn(g, list, pick?.key);
  const by = g.turn;
  if (kind !== 'hit' && kind !== 'miss') return { game: g, kind, slot, by };
  const next = { ...g, found: { ...g.found }, strikes: { ...g.strikes }, missed: g.missed };
  if (kind === 'hit') next.found[slot] = by;
  else {
    next.strikes[by] = (next.strikes[by] || 0) + 1;
    next.missed = [...g.missed, { key: pick.key, name: pick.name, by }];
  }
  const size = (list?.slots || []).length || TOP10_SIZE;
  const up = nextUp(next, by);
  if (foundCount(next) >= size || up == null) { next.over = true; next.turn = null; }
  else next.turn = up;
  return { game: next, kind, slot, by };
}

/** Rows found per player id (everyone in the game, 0 for none). */
export function rowsBy(g) {
  const c = Object.fromEntries(g.order.map((id) => [id, 0]));
  for (const id of Object.values(g.found)) c[id] = (c[id] || 0) + 1;
  return c;
}

/**
 * The end, in pass and play's terms (lib/passPlay.js standing): kind "win"
 * (top = [the winner]) or "draw" (top = everyone on the most rows, in play
 * order), ranked best first with play order breaking ties, and the counts.
 */
export function turnsResult(g, players) {
  const scores = rowsBy(g);
  const inOrder = g.order.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  return { ...standing({ players: inOrder, scores, mode: TURNS_MODE }), scores };
}

/** "Same list, swap who starts": the next player in the seat order starts. */
export const swapStart = (start, n) => (n > 0 ? (start + 1) % n : 0);
