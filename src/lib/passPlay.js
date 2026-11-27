// Pass and play (screens/LocalPlay.jsx): the players, Steal and the end, as pure
// functions so they can be tested without rendering (tests/unit/pass-play.test.js).
//
// The look Alex approved on 26 Nov 2026 ("Yes, build them", "Yes, badges", "Yes,
// lock it", "No, just a draw"): ball-iq-audit/2026-11-24/finish/pass-play-*.png,
// measures in lp4.py and lp5.py there; the build brief is
// ball-iq-audit/2026-11-26/pass-play-build-brief.md.

// ── Steal: two switches, one line each ──────────────────────────────────────
// The largest game that has Steal. Alex, 26 Nov: "Yes, lock it" (two players only).
export const STEAL_MAX_PLAYERS = 2;
// Whether the stealer sees the wrong option struck out. Alex, 26 Nov: "Yes, show it".
export const STEAL_SHOWS_STRUCK = true;

// ── Players ─────────────────────────────────────────────────────────────────
// A player is { id, name, colour, badge }: no number anywhere on the disc.
export const MAX_PLAYERS = 6;
// The six colours (lp4.py COL), in list order. `rgb` feeds the soft tints.
export const COLOURS = [
  { id: "green", hex: "#6FD61F", rgb: "88,204,2" },
  { id: "yellow", hex: "#FFC107", rgb: "255,193,7" },
  { id: "blue", hex: "#4AA3DF", rgb: "74,163,223" },
  { id: "orange", hex: "#F0785A", rgb: "240,120,90" },
  { id: "purple", hex: "#A878F0", rgb: "168,120,240" },
  { id: "teal", hex: "#1FBEAF", rgb: "31,190,175" },
];
// The eight badges (lp4.py I), in list order; each is a lucide icon in the disc.
export const BADGES = ["crown", "flame", "bolt", "star", "shield", "ghost", "heart", "moon"];

export const colourOf = (id) => COLOURS.find((c) => c.id === id) || COLOURS[0];

/** Six seats, each with the next colour and badge in list order and no name yet. */
export function initialSlots() {
  return Array.from({ length: MAX_PLAYERS }, (_, i) => ({ name: "", colour: COLOURS[i].id, badge: BADGES[i] }));
}

/**
 * The seats with no two of the first `count` sharing a colour or a badge. A seat
 * keeps what it has unless an earlier seat in play already holds it; then it
 * takes the first free one in list order. Seats past `count` are left as they
 * are (they are not in the game). Used whenever the player count changes.
 */
export function normalizeSlots(slots, count) {
  const out = slots.map((s) => ({ ...s }));
  for (const [key, list] of [["colour", COLOURS.map((c) => c.id)], ["badge", BADGES]]) {
    const seen = new Set();
    const clash = [];
    for (let i = 0; i < count; i++) {
      if (seen.has(out[i][key]) || !list.includes(out[i][key])) clash.push(i);
      else seen.add(out[i][key]);
    }
    for (const i of clash) {
      const free = list.find((v) => !seen.has(v));
      out[i][key] = free;
      seen.add(free);
    }
  }
  return out;
}

/** What the other players in play hold: Map value -> seat index. */
export function heldByOthers(slots, count, seat, key) {
  const m = new Map();
  for (let i = 0; i < count; i++) if (i !== seat) m.set(slots[i][key], i);
  return m;
}

/** Set one seat's colour or badge, refused when another seat in play holds it. */
export function pickFor(slots, count, seat, key, value) {
  if (heldByOthers(slots, count, seat, key).has(value)) return slots;
  return slots.map((s, i) => (i === seat ? { ...s, [key]: value } : s));
}

/** The players of a game. `unnamed(n)` gives "Player n" for a seat left blank. */
export function makePlayers(slots, count, unnamed) {
  return slots.slice(0, count).map((s, i) => ({
    id: i,
    name: (s.name || "").trim() || unnamed(i + 1),
    colour: s.colour,
    badge: s.badge,
  }));
}

/** Seats back from a game's players (the end's "Change topic or mode"). */
export function slotsFromPlayers(players, unnamed) {
  const slots = initialSlots();
  (players || []).slice(0, MAX_PLAYERS).forEach((p, i) => {
    slots[i] = {
      name: p.name && p.name !== unnamed(i + 1) ? p.name : "",
      colour: p.colour || slots[i].colour,
      badge: p.badge || slots[i].badge,
    };
  });
  return normalizeSlots(slots, Math.max(2, (players || []).length));
}

// ── Steal ───────────────────────────────────────────────────────────────────
/** Steal is in this game: two players (STEAL_MAX_PLAYERS), Classic or Sprint, never Survival. */
export function stealInGame(playerCount, mode) {
  return playerCount >= 2 && playerCount <= STEAL_MAX_PLAYERS && (mode === "classic" || mode === "sprint");
}

/** A miss on this question is offered as a steal: Steal in the game, more than two options. */
export function canSteal(playerCount, mode, q) {
  return stealInGame(playerCount, mode) && !!q && q.type !== "tf" && Array.isArray(q.o) && q.o.length > 2;
}

/** Who steals: the next player in the order after the one who missed. */
export function stealerFor(players, misserId) {
  const i = players.findIndex((p) => p.id === misserId);
  return players[(i + 1) % players.length];
}

/** A fresh tally: points, own right answers and steals per player. */
export function newTally(players) {
  const z = () => Object.fromEntries(players.map((p) => [p.id, 0]));
  return { scores: z(), rights: z(), steals: z() };
}

/** A player's own answer: right is a point and a right answer; wrong is nothing. */
export function scoreOwn(tally, playerId, right) {
  if (!right) return tally;
  return {
    scores: { ...tally.scores, [playerId]: (tally.scores[playerId] || 0) + 1 },
    rights: { ...tally.rights, [playerId]: (tally.rights[playerId] || 0) + 1 },
    steals: tally.steals,
  };
}

/** A steal: right is the stealer's point and a steal; wrong, nobody scores, no penalty. */
export function scoreSteal(tally, stealerId, right) {
  if (!right) return tally;
  return {
    scores: { ...tally.scores, [stealerId]: (tally.scores[stealerId] || 0) + 1 },
    rights: tally.rights,
    steals: { ...tally.steals, [stealerId]: (tally.steals[stealerId] || 0) + 1 },
  };
}

/** The options the stealer may pick: all but the struck miss (all when nothing was picked). */
export function stealOptions(q, missedIdx) {
  return (q?.o || []).map((_, i) => i !== missedIdx);
}

// ── The deal: every player gets the same number of questions ───────────────
// Alex, 26 Nov 2026: "Yes, same each" (ball-iq-audit/2026-11-27/
// pass-play-fair-brief.md). A game is a number of ROUNDS; in a round every
// player has one turn; a turn is a fixed number of questions. Sprint is one
// round, Classic two; a turn is three questions, two with five or six players
// so no game runs past MAX_GAME_QUESTIONS. HQ settled the numbers on his
// ruling and they are his to overrule: change them HERE and nowhere else.
//   players  turn  Sprint each/total  Classic each/total
//   2        3     3 / 6              6 / 12
//   3        3     3 / 9              6 / 18
//   4        3     3 / 12             6 / 24
//   5        2     2 / 10             4 / 20
//   6        2     2 / 12             4 / 24
// Survival (one question at a time, out on a miss) and Top 10 in turns are
// not dealt this way. A steal is an extra try at another player's question and
// never uses up the stealer's own.
export const ROUNDS = { sprint: 1, classic: 2 };
export const TURN_SIZE = { 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 };
export const MAX_GAME_QUESTIONS = 24;

const planOf = (perTurn, rounds, playerCount) => ({ perTurn, rounds, each: perTurn * rounds, total: perTurn * rounds * playerCount });

/** The game as the table deals it: { perTurn, rounds, each, total }, or null for a mode not dealt in turns. */
export function gamePlan(mode, playerCount) {
  const rounds = ROUNDS[mode];
  const perTurn = TURN_SIZE[playerCount];
  if (!rounds || !perTurn) return null;
  return planOf(perTurn, rounds, playerCount);
}

/**
 * The plan cut to what the bank could supply: whole rounds come off until
 * `available` questions cover every turn, so every player still gets the same
 * number. null when not even one round is covered (the mode's "not enough
 * questions" state). Never an unequal game.
 */
export function fitPlan(plan, playerCount, available) {
  if (!plan) return null;
  const rounds = Math.min(plan.rounds, Math.floor((available || 0) / (plan.perTurn * playerCount)));
  return rounds >= 1 ? planOf(plan.perTurn, rounds, playerCount) : null;
}

/**
 * Who answers the game's question `qIdx`, and where it sits in that player's
 * own run. Turns go round the players in seat order, round after round.
 *   seat      - the player's index in the play order
 *   round     - 0-based round
 *   own       - 0-based index among that player's own questions (0 … each-1)
 *   turnStart, turnEnd - the game indexes of this turn's first and last question
 *   ownStart, ownEnd   - the same turn counted in the player's own questions
 *   playersLast - this turn is that player's last of the game
 *   gamesLast   - this turn is the game's last (the phone is not passed on)
 */
export function dealt(plan, playerCount, qIdx) {
  const turn = Math.floor(qIdx / plan.perTurn);
  const round = Math.floor(turn / playerCount);
  const ownStart = round * plan.perTurn;
  const turnStart = turn * plan.perTurn;
  return {
    seat: turn % playerCount,
    round,
    own: ownStart + (qIdx - turnStart),
    turnStart,
    turnEnd: turnStart + plan.perTurn - 1,
    ownStart,
    ownEnd: ownStart + plan.perTurn - 1,
    playersLast: round === plan.rounds - 1,
    gamesLast: turn === plan.rounds * playerCount - 1,
  };
}

/** The game indexes of one player's own questions, in the order they answer them. */
export function ownQuestions(plan, playerCount, seat) {
  const out = [];
  for (let r = 0; r < plan.rounds; r++) {
    const start = (r * playerCount + seat) * plan.perTurn;
    for (let k = 0; k < plan.perTurn; k++) out.push(start + k);
  }
  return out;
}

/**
 * The line under the name on a hand-over, as an i18n key:
 *  lp.last{k}     - the game's last turn: nobody to pass the phone to;
 *  lp.yourLast{k} - that player's last turn when they have had one before; the phone still goes on;
 *  lp.next{k}     - any other turn (in a one-round game, every turn but the last).
 * k is the turn's size, 1 to 3.
 */
export function handoverLineKey(plan, playerCount, qIdx) {
  const d = dealt(plan, playerCount, qIdx);
  const k = Math.min(3, Math.max(1, plan.perTurn));
  if (d.gamesLast) return `lp.last${k}`;
  if (d.playersLast && plan.rounds > 1) return `lp.yourLast${k}`;
  return `lp.next${k}`;
}

// ── Tables and the end ──────────────────────────────────────────────────────
const byScore = (scores, players) => (a, b) =>
  (scores[b.id] || 0) - (scores[a.id] || 0) || players.indexOf(a) - players.indexOf(b);

/**
 * "Scores so far" on the hand-over: everyone still in, best first (play order
 * breaks ties, so before anyone scores it is the play order), then anyone out.
 */
export function scoresSoFar(players, scores, outIds = []) {
  const live = players.filter((p) => !outIds.includes(p.id)).sort(byScore(scores, players));
  const out = players.filter((p) => outIds.includes(p.id));
  return [...live, ...out];
}

/**
 * The end. Returns { kind, top, ranked, topScore }:
 *  kind "win"  - one player on top (top = [them]);
 *  kind "draw" - the top score shared (top = everyone on it, in play order);
 *  kind "wipe" - Survival, everyone out on the same question (top = []).
 * ranked is the final table's order. Survival keeps its own facts: who lasted
 * longest ranks first (the order the old podium used).
 */
export function standing(result) {
  const { players, scores, eliminatedIds = [], mode, winnerId, endReason } = result;
  if (mode === "survival") {
    const live = players.filter((p) => !eliminatedIds.includes(p.id));
    const outRev = [...eliminatedIds].reverse().map((id) => players.find((p) => p.id === id)).filter(Boolean);
    if (endReason === "total-wipe" || (live.length === 0 && winnerId == null)) {
      return { kind: "wipe", top: [], ranked: outRev, topScore: 0 };
    }
    if (endReason === "last-standing" || live.length === 1) {
      const w = players.find((p) => p.id === winnerId) || live[0];
      return { kind: "win", top: [w], ranked: [w, ...outRev.filter((p) => p.id !== w.id)], topScore: scores[w.id] || 0 };
    }
    const sorted = [...live].sort(byScore(scores, players));
    const topScore = scores[sorted[0].id] || 0;
    const top = sorted.filter((p) => (scores[p.id] || 0) === topScore);
    return { kind: top.length > 1 ? "draw" : "win", top, ranked: [...sorted, ...outRev], topScore };
  }
  const ranked = [...players].sort(byScore(scores, players));
  const topScore = scores[ranked[0]?.id] || 0;
  const top = ranked.filter((p) => (scores[p.id] || 0) === topScore);
  return { kind: top.length > 1 ? "draw" : "win", top, ranked, topScore };
}
