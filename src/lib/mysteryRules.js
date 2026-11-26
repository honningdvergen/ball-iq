// Mystery Player, the rules of the rebuild (Job A, 26 Nov 2026).
//
// PURE FUNCTIONS ONLY, AND NOTHING IMPORTS THIS FILE YET. The live screen
// (screens/MysteryPlayer.jsx) still runs on lib/mysteryPlayer.js: its free
// clues, its club-then-initials ladder, its saves. Job B switches the screen
// over; until then this file is not in any bundle. What Job B must delete or
// switch is listed in the Job A report and at the foot of this header.
//
// THE STANDARD. Every hint and every tile is shown to football fans as a fact.
// Each function here either returns a value it can support from the data, with
// the facts it rests on, or says it is not available and why. It never
// guesses, pads or falls back to something it cannot check.
//
// DATA, passed in by the caller as one `ctx` object (all loaded lazily with
// the pool, never on Home; see lib/mysteryRulesData.js):
//   ctx.careers  mysteryCareers.json with withCareerFixes applied
//   ctx.byId     Map id -> pool record (mysteryPool.json)
//   ctx.answers  array of the curated answer ids (mysteryAnswers.json)
//   ctx.nations  mysteryNations.json  { n: [nation], p: { id: [nationIndex] } }
//   ctx.regions  nationRegions.json   { UEFA: [nation], … }
//   ctx.flags    nationFlags.json     { nation: "flags/<slug>.png" }
//   ctx.year     the puzzle's year (puzzleYear(dayIndex)), for running spells
//
// WHAT JOB B DELETES OR SWITCHES WHEN IT TURNS THIS ON (also in the report):
//   · lib/mysteryPlayer.js: FREE_CLUES, CLUE_AFTER, birthDecade's use as a
//     clue, clueLadder, and paidCluesFromSave's role as the screen's counter
//     (keep the function: hintsFromSave below calls it for old saves).
//   · screens/MysteryPlayer.jsx: CLUE_ICON, CLUE_PLACEHOLDER, the clue ladder
//     block, revealHint, the starters memo (use startersForDay), the
//     reasonMarks line under each guess (use tileVerdicts), `clues: 3` in the
//     three save calls (use saveHintFields).
//   · i18n: mp.position / mp.born / mp.club / mp.initials / mp.oneName /
//     mp.tapReveal / mp.inN / mp.unlocksIn / mp.readyNext / mp.readyAfter and
//     mp.rules' two numbers, once nothing reads them.
import { careerOf, clubsOf, mainClub, sharedClubs, clubFame } from './mysteryCareer.js';
import { paidCluesFromSave, normaliseName } from './mysteryPlayer.js';

// ── Constants ───────────────────────────────────────────────────────────────

/** The four-line slot as a word. Job B translates it (en/es). */
export const SLOT_WORD = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' };
/** Born within this many years (and not the same year) is `close`. */
export const BORN_CLOSE_YEARS = 4;
/** Years together that make a teammate hint; the fallback when nobody has them. */
export const TEAMMATE_YEARS = 3;
export const TEAMMATE_FALLBACK_YEARS = 2;
/**
 * The two rounds (R1). One hint may be chosen per round; a round opens after
 * `after` guesses and stays open until a card is taken. Nothing is ever shown
 * unasked. Never offered in either round: the main club itself, the initials,
 * any letter of the name.
 */
export const HINT_ROUNDS = [
  { round: 1, after: 4, cards: ['teammate', 'club', 'careerYears'] },
  { round: 2, after: 8, cards: ['teammateMain', 'nation', 'birthYear'] },
];
/** `clues` version written by saves under these rules (old ladders: 2 and 3). */
export const HINT_SAVE_VERSION = 4;
/** A running spell counts as a running career only for someone this young. */
const ACTIVE_MAX_AGE = 42;

// ── Nations, regions, flags ─────────────────────────────────────────────────

/** Every senior national team the player was a member of, primary first; [] when none. */
export function nationsOf(player, nations) {
  const ix = player && nations?.p?.[player.id];
  return ix ? ix.map((i) => nations.n[i]) : [];
}

/** The primary nation (most years in the side), or null: never a guess from citizenship. */
export function primaryNation(player, nations) {
  return nationsOf(player, nations)[0] || null;
}

const REGION_INDEX = new WeakMap();
/** UEFA, CONMEBOL, CONCACAF, CAF, AFC or OFC for a nation; null when unknown. */
export function regionOf(nation, regions) {
  if (!nation || !regions) return null;
  let m = REGION_INDEX.get(regions);
  if (!m) {
    m = new Map();
    for (const [conf, list] of Object.entries(regions)) if (Array.isArray(list)) for (const n of list) m.set(n, conf);
    REGION_INDEX.set(regions, m);
  }
  return m.get(nation) || null;
}

/** The flag file (relative to the site root, e.g. "flags/spain.png"), or null. */
export function flagOf(nation, flags) {
  return (nation && flags && flags[nation]) || null;
}

// ── Tile verdicts (A7) ──────────────────────────────────────────────────────
// For one guess against the secret player, what each of the four tiles shows
// and one of three states: 'same' | 'close' | 'different'. A fourth value,
// 'unknown', means the data cannot say (the tile shows a dash, not a verdict);
// the Job A report counts how often. Nothing here touches the rank or band.

/**
 * @returns {{
 *   club:     { club: string|null, state, together: number|null },
 *   position: { slot: string|null, word: string|null, state },
 *   nation:   { nation: string|null, flag: string|null, region: string|null, state },
 *   born:     { year: number|null, arrow: 'up'|'down'|null, state },
 * }}
 *  club.club is null with state 'different' for "None"; `together` is the
 *  years both were there at once (0 when they were there at different times).
 *  born.arrow points toward the secret player: 'down' = born EARLIER than the
 *  guess, 'up' = later; null when the same year or unknown.
 */
export function tileVerdicts(guess, secret, ctx) {
  if (!guess || !secret) return null;
  const isAnswer = guess.id === secret.id;
  return {
    club: clubTile(guess, secret, ctx, isAnswer),
    position: positionTile(guess, secret, isAnswer),
    nation: nationTile(guess, secret, ctx, isAnswer),
    born: bornTile(guess, secret),
  };
}

/** Clubs both played for, best first: most years at once, then the better-known club, then by name. */
export function sharedClubsRanked(guess, secret, ctx) {
  const { careers, year } = ctx;
  if (!careers) return [];
  return sharedClubs(secret, guess, careers, null, year)
    .map((x) => ({ club: x.club, together: x.together, fame: clubFame(careers, x.club) }))
    .sort((a, b) => b.together - a.together || b.fame - a.fame || a.club.localeCompare(b.club));
}

function clubTile(guess, secret, ctx, isAnswer) {
  const { careers, year } = ctx;
  if (!careers) return { club: null, together: null, state: 'unknown' };
  if (isAnswer) {
    const m = mainClub(secret, careers, year);
    return { club: m, together: null, state: m ? 'same' : 'unknown' };
  }
  // A guess with no senior career on file cannot be said to share "None".
  if (!clubsOf(guess, careers, year).size || !clubsOf(secret, careers, year).size) return { club: null, together: null, state: 'unknown' };
  const shared = sharedClubsRanked(guess, secret, ctx);
  if (!shared.length) return { club: null, together: null, state: 'different' };
  return { club: shared[0].club, together: shared[0].together, state: 'same' };
}

function positionTile(guess, secret, isAnswer) {
  const slot = SLOT_WORD[guess.slot] ? guess.slot : null;
  if (!slot) return { slot: null, word: null, state: 'unknown' };
  const state = isAnswer || slot === secret.slot ? 'same' : SLOT_WORD[secret.slot] ? 'different' : 'unknown';
  return { slot, word: SLOT_WORD[slot], state };
}

function nationTile(guess, secret, ctx, isAnswer) {
  const nation = primaryNation(guess, ctx.nations);
  if (!nation) return { nation: null, flag: null, region: null, state: 'unknown' };
  const region = regionOf(nation, ctx.regions);
  const flag = flagOf(nation, ctx.flags);
  const theirs = nationsOf(secret, ctx.nations);
  let state;
  if (isAnswer || theirs.includes(nation)) state = 'same';
  else if (!theirs.length) state = 'unknown';
  // Close: the guess's nation is in the same confederation as any nation the
  // secret player represented (Zaha: UEFA through England, CAF through Ivory Coast).
  else if (region && theirs.some((n) => regionOf(n, ctx.regions) === region)) state = 'close';
  else state = 'different';
  return { nation, flag, region, state };
}

function bornTile(guess, secret) {
  const g = Number(guess.born), s = Number(secret.born);
  if (!(g > 1800) || !(s > 1800)) return { year: g > 1800 ? g : null, arrow: null, state: 'unknown' };
  if (g === s) return { year: g, arrow: null, state: 'same' };
  return { year: g, arrow: s < g ? 'down' : 'up', state: Math.abs(g - s) <= BORN_CLOSE_YEARS ? 'close' : 'different' };
}

// ── Hints (A6, R1) ──────────────────────────────────────────────────────────
// Each card: { key, round, available, value, facts, level, reason }.
//   available false  -> the card is not offered; `reason` says why.
//   level            -> which rule produced it ('main' or a named fallback),
//                       so the report can count every fallback.
//   facts            -> what the value rests on (clubs, years), printed in the
//                       report for a person to check.

const surname = (name) => { const parts = normaliseName(name).split(' ').filter(Boolean); return parts.length > 1 ? parts[parts.length - 1] : null; };

/** The clubs a hint may never name: the longest spell and anything within a year of it (mainClub's near-tie set). */
export function nearMainClubs(secret, ctx) {
  const clubs = [...clubsOf(secret, ctx.careers, ctx.year)];
  if (!clubs.length) return new Set();
  const longest = Math.max(...clubs.map(([, c]) => c.years));
  return new Set(clubs.filter(([, c]) => c.years >= longest - 1).map(([k]) => k));
}

/** The best stretch two players were at one club at once: { from, to, running, years } or null. */
export function togetherAt(a, b, club, ctx) {
  const { careers, year } = ctx;
  const sa = (clubsOf(a, careers, year).get(club) || { spells: [] }).spells;
  const sb = (clubsOf(b, careers, year).get(club) || { spells: [] }).spells;
  let best = null;
  for (const x of sa) for (const y of sb) {
    if (x.from == null || y.from == null) continue;
    const from = Math.max(x.from, y.from);
    const to = Math.min(x.to ?? year, y.to ?? year);
    const years = to - from;
    if (years <= 0) continue;
    if (!best || years > best.years) best = { from, to, running: x.to == null && y.to == null, years };
  }
  return best;
}

/**
 * Teammates the hint could name, best first. A candidate is a CURATED answer
 * (known as a footballer: the pool's `fame` alone once offered a prime
 * minister) who was at `club` at the same time as the secret player for at
 * least `minYears`, and who is NOT a giveaway:
 *   · shared two or more clubs with him (Arbeloa for Xabi Alonso: Liverpool
 *     AND Real Madrid would hand over most of the career);
 *   · has his surname (brothers, fathers and sons: the de Boers, the Nevilles);
 *   · is the secret player himself.
 */
export function teammateCandidates(secret, ctx, { clubs, minYears }) {
  const out = [];
  const mySurname = surname(secret.name);
  for (const id of ctx.answers) {
    if (id === secret.id) continue;
    const p = ctx.byId.get(id);
    if (!p) continue;
    const shared = sharedClubs(secret, p, ctx.careers, null, ctx.year);
    if (shared.length !== 1) continue;
    const club = shared[0].club;
    if (!clubs.has(club)) continue;
    if (mySurname && surname(p.name) === mySurname) continue;
    const t = togetherAt(secret, p, club, ctx);
    if (!t || t.years < minYears) continue;
    out.push({ id: p.id, name: p.name, fame: p.fame || 0, club, ...t });
  }
  return out.sort((a, b) => b.fame - a.fame || b.years - a.years || a.name.localeCompare(b.name));
}

function teammateCard(secret, ctx, key, round, clubs, what) {
  for (const [level, minYears] of [['main', TEAMMATE_YEARS], ['twoYears', TEAMMATE_FALLBACK_YEARS]]) {
    const c = teammateCandidates(secret, ctx, { clubs, minYears })[0];
    if (c) {
      return {
        key, round, available: true, level,
        value: { id: c.id, name: c.name, club: c.club, from: c.from, to: c.running ? null : c.to },
        facts: { club: c.club, together: `${c.from}–${c.running ? 'now' : c.to}`, years: c.years, clubsAllowed: [...clubs], from: what },
      };
    }
  }
  return { key, round, available: false, reason: clubs.size ? 'no well-known teammate with two or more years together' : `no ${what} club` };
}

/** Round 1: someone he played with for 3+ years (fallback 2) at a club that is not his longest spell or within a year of it. */
export function teammateHint(secret, ctx) {
  const near = nearMainClubs(secret, ctx);
  const clubs = new Set([...clubsOf(secret, ctx.careers, ctx.year).keys()].filter((c) => !near.has(c)));
  return teammateCard(secret, ctx, 'teammate', 1, clubs, 'other');
}

/** Round 2: someone he played with for 3+ years (fallback 2) at his longest-spell club. */
export function teammateMainHint(secret, ctx) {
  const main = mainClub(secret, ctx.careers, ctx.year);
  return teammateCard(secret, ctx, 'teammateMain', 2, new Set(main ? [main] : []), 'main');
}

/**
 * Round 1: one club from the career that is not his longest spell and not
 * within a year of it, so Xabi Alonso's card can never be Real Madrid or
 * Liverpool (five years each) or Real Sociedad (four): it is Bayern Munich.
 * Senior first teams only (careerOf already drops B, youth and boyhood
 * sides). A club with an undated spell is never named: its length is unknown,
 * so it might be the main club. Best known first, among clubs of two years or
 * more; a shorter spell is the named fallback.
 * One club in the whole career: { oneClub: true } and no club is named.
 */
export function clubHint(secret, ctx) {
  const all = clubsOf(secret, ctx.careers, ctx.year);
  if (!all.size) return { key: 'club', round: 1, available: false, reason: 'no senior career on file' };
  if (all.size === 1) return { key: 'club', round: 1, available: true, level: 'oneClub', value: { oneClub: true }, facts: { clubs: [...all.keys()] } };
  const near = nearMainClubs(secret, ctx);
  const dated = (c) => c.spells.every((s) => s.from != null);
  const pool = [...all].filter(([k, c]) => !near.has(k) && dated(c));
  const pick = (list) => list.sort((a, b) => clubFame(ctx.careers, b[0]) - clubFame(ctx.careers, a[0]) || b[1].years - a[1].years || a[0].localeCompare(b[0]))[0];
  const long = pick(pool.filter(([, c]) => c.years >= 2));
  const chosen = long || pick(pool);
  if (!chosen) return { key: 'club', round: 1, available: false, reason: 'every club is the main club or within a year of it, or undated' };
  const [club, c] = chosen;
  return {
    key: 'club', round: 1, available: true, level: long ? 'main' : 'shortSpell',
    value: { club },
    facts: { club, years: c.years, spells: c.spells.map((s) => `${s.from}–${s.to ?? 'now'}`), excluded: [...near] },
  };
}

/**
 * Round 1: first and last senior year. A spell still open counts to the
 * puzzle's year and reads "now", but only for a player young enough to still
 * be playing: an open spell on a 60-year-old is a missing end date.
 * Not available when any spell has no start year (the first year is unknown).
 */
export function careerYearsHint(secret, ctx) {
  const spells = careerOf(secret, ctx.careers, ctx.year);
  if (!spells.length) return { key: 'careerYears', round: 1, available: false, reason: 'no senior career on file' };
  if (spells.some((s) => s.from == null)) return { key: 'careerYears', round: 1, available: false, reason: 'a spell has no start year' };
  const from = Math.min(...spells.map((s) => s.from));
  const open = spells.some((s) => s.to == null);
  if (open && !(secret.born && ctx.year - secret.born <= ACTIVE_MAX_AGE)) {
    return { key: 'careerYears', round: 1, available: false, reason: `an open spell on a player born ${secret.born}` };
  }
  const to = open ? null : Math.max(...spells.map((s) => s.to));
  return {
    key: 'careerYears', round: 1, available: true, level: 'main',
    value: { from, to },
    facts: { first: spells.find((s) => s.from === from), last: open ? spells.find((s) => s.to == null) : spells.find((s) => s.to === to) },
  };
}

/** Round 2: his (primary) nation with its flag. All his nations are in `facts`. */
export function nationHint(secret, ctx) {
  const all = nationsOf(secret, ctx.nations);
  if (!all.length) return { key: 'nation', round: 2, available: false, reason: 'no senior national team on file' };
  return {
    key: 'nation', round: 2, available: true, level: 'main',
    value: { nation: all[0], flag: flagOf(all[0], ctx.flags) },
    facts: { nations: all, source: 'Wikidata P54, senior national team' },
  };
}

/** Round 2: his exact birth year. Not available when the date of birth on file disagrees with it. */
export function birthYearHint(secret) {
  const y = Number(secret.born);
  if (!(y > 1800)) return { key: 'birthYear', round: 2, available: false, reason: 'no birth year on file' };
  if (secret.dob && Number(String(secret.dob).slice(0, 4)) !== y) return { key: 'birthYear', round: 2, available: false, reason: `born ${y} but dob ${secret.dob}` };
  return { key: 'birthYear', round: 2, available: true, level: 'main', value: { year: y }, facts: { born: y, dob: secret.dob || null } };
}

/** All six cards for a secret player, by round. Deterministic: the same player gives the same cards. */
export function hintCards(secret, ctx) {
  return {
    1: [teammateHint(secret, ctx), clubHint(secret, ctx), careerYearsHint(secret, ctx)],
    2: [teammateMainHint(secret, ctx), nationHint(secret, ctx), birthYearHint(secret)],
  };
}

// ── What the player already holds (R4) ──────────────────────────────────────

/**
 * Which cards would tell the player something a green tile on one of their own
 * guesses already says. Such a card is drawn greyed ("You already have this")
 * and cannot be taken.
 *   nation      a guess's Nation tile is green on the nation the card names
 *   birthYear   any Born tile is green (it is the exact year)
 *   club        a Shared club tile is green on the club the card names
 *   teammate*   the teammate the card names is already among the guesses
 * Returns { [key]: true } for every held card; a round whose available cards
 * are all held is held as a whole (roundHeld).
 */
export function heldHints(cards, guesses, secret, ctx) {
  const held = {};
  const tiles = guesses.filter((g) => g && g.id !== secret.id).map((g) => ({ g, t: tileVerdicts(g, secret, ctx) }));
  const ids = new Set(guesses.map((g) => g?.id));
  for (const round of Object.values(cards)) {
    for (const c of round) {
      if (!c.available) continue;
      if (c.key === 'nation' && tiles.some(({ t }) => t.nation.state === 'same' && t.nation.nation === c.value.nation)) held[c.key] = true;
      if (c.key === 'birthYear' && tiles.some(({ t }) => t.born.state === 'same')) held[c.key] = true;
      if (c.key === 'club' && !c.value.oneClub && tiles.some(({ t }) => t.club.state === 'same' && t.club.club === c.value.club)) held[c.key] = true;
      if ((c.key === 'teammate' || c.key === 'teammateMain') && ids.has(c.value.id)) held[c.key] = true;
    }
  }
  return held;
}

/** True when every available card of the round is held, or none is available. */
export function roundHeld(roundCards, held) {
  return roundCards.filter((c) => c.available).every((c) => held[c.key]);
}

// ── The ladder and saves (A8, R1) ───────────────────────────────────────────

/**
 * The rounds a player may choose from now: each round opens at its `after`
 * guesses and closes once a card from it is taken. Returns [1], [2], [1, 2]
 * (round one never taken by guess 8) or [].
 */
export function openRounds(guessCount, taken = []) {
  return HINT_ROUNDS
    .filter((r) => guessCount >= r.after && !taken.some((t) => t.round === r.round))
    .map((r) => r.round);
}

/**
 * The hints a saved game took. A save under these rules carries
 * `clues: 4, hints: [{ round, key }]`. An older save (the 16 Oct ladder,
 * `clues: 3`, or older) took clues these rules no longer have: its count is
 * kept for the finish line ("· 1 hint") through paidCluesFromSave, and its
 * cards are empty, so nothing old is shown as a new card.
 *   -> { taken: [{ round, key }], count, legacy }
 */
export function hintsFromSave(saved) {
  if (saved?.clues === HINT_SAVE_VERSION && Array.isArray(saved.hints)) {
    const taken = saved.hints
      .filter((h) => h && HINT_ROUNDS.some((r) => r.round === h.round && r.cards.includes(h.key)))
      .filter((h, i, all) => all.findIndex((x) => x.round === h.round) === i);
    return { taken, count: taken.length, legacy: false };
  }
  const count = paidCluesFromSave(saved);
  return { taken: [], count, legacy: !!saved && count > 0 };
}

/**
 * The fields a save writes under these rules, beside won / gaveUp / guesses.
 * `hintsUsed` is kept for anything that still reads it; the old screen reads a
 * `clues: 4` save as no clues taken (paidCluesFromSave ignores the version), so
 * opening an old build on a new save shows the board with its ladder fresh.
 */
export function saveHintFields(taken = []) {
  return { clues: HINT_SAVE_VERSION, hints: taken.map(({ round, key }) => ({ round, key })), hintsUsed: taken.length };
}

// ── Starters (R5, R7) ───────────────────────────────────────────────────────

const LINES = ['GK', 'DF', 'MF', 'FW'];
/** How deep into each line's best-known players the starters reach. */
export const STARTER_DEPTH = 12;

/**
 * Three well-known players to offer before the first guess, one from each of
 * three different lines, a different three each day. Chosen WITHOUT looking at
 * the answer's position or era (R5): the only thing read from the answer is
 * its id, to never offer it. Only curated answers (R7): sorted on the whole
 * pool's `fame`, the best-known "goalkeeper" was Niels Bohr.
 * @param {number} dayIndex  mysteryDayIndex of the puzzle
 * @param {string} answerId  never offered
 * @param {object[]} answerPlayers  pool records of the curated answers
 */
export function startersForDay(dayIndex, answerId, answerPlayers) {
  const d = Math.abs(Math.trunc(Number(dayIndex) || 0));
  const skip = LINES[d % LINES.length];
  const out = [];
  LINES.filter((l) => l !== skip).forEach((line, k) => {
    // The answer stays IN the list, so the list is the same whoever the answer
    // is; only if the day's pick is the answer itself does the next one stand in.
    const list = answerPlayers.filter((p) => p.slot === line)
      .sort((a, b) => (b.fame || 0) - (a.fame || 0) || a.name.localeCompare(b.name))
      .slice(0, STARTER_DEPTH);
    if (!list.length) return;
    let i = (Math.floor(d / LINES.length) * 5 + k * 7) % list.length;
    if (list[i].id === answerId) i = (i + 1) % list.length;
    if (list[i].id !== answerId) out.push(list[i]);
  });
  return out;
}

/**
 * The grey line under a starter: birth year and the club he is known for,
 * which is mainClub (most years, near-ties to the better-known club), not the
 * pool's `club` field. That field is a raw Wikidata label from the pool build
 * (Buffon read "1978 · Parma Calcio 1913", true but not his club).
 * -> { born, club } with either part null when unknown.
 */
export function starterLine(player, ctx) {
  return { born: player?.born || null, club: player && ctx.careers ? mainClub(player, ctx.careers, ctx.year) : null };
}
