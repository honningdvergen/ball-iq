// Mystery Player — guess the secret footballer, Contexto-style.
//
// Every guess returns a RANK. The answer is 1; the further down, the less the
// guess resembles the answer. Unlimited guesses, one puzzle a day.
//
// ⚠️ THE DESIGN RISK. A rank only feels fair if the player can see WHY it is
// what it is. Contexto gets that from word embeddings; we have a handful of
// attributes, so every one of them that moves a rank has to be one the guess
// row can name. That is the rule the 14 Oct 2026 rebuild is built on.
/* ── THE REBUILD, 14 OCT 2026 ────────────────────────────────────────────────
   A play-tester's day: the answer was Joachim Löw AS A PLAYER, and Maradona,
   Careca and Ramón Díaz all came back "boiling" with nothing on screen to say
   why. Fun was scored 3 out of 10, the worst in the app. Measured, the old
   weights explained it exactly:

     era 150 · nationality 150 · line 100 · position word 50 · age 100
     shared club 45 + 72 for years together, current club 100

   A forward born within ten years of the answer collected ~400 points for
   existing, while ONE shared club was worth at most 117. So every famous
   1960-born forward outranked nearly everyone who had actually played
   alongside Löw, and the screen could not say so. Worse, 150 of those points
   came from `nat`, which is not reliably nationality (Messi reads "Spain"; see
   MysteryPlayer.jsx) and must never be shown, so it could never be explained.
   (Those weights were copied on 2026-08-15 from Football Contexto's published
   model — shared clubs 35%, era 15, position 15, nationality 15, age 10 —
   which works for a 766-player pool. Ours is nine thousand, all eras.)

   What the ranking now pays for, and nothing else:
     · SHARED CLUBS, most: 300 for each club both played for, +200 scaled by
       the years they were there TOGETHER (full at 6), best three clubs.
       Torres-at-Atlético still counts for something; Koke counts for more.
     · SAME POSITION: 250, by line (GK / DF / MF / FW). The specific word
       ("centre-back", "wing half") is a Wikidata ranking token that is wrong
       often enough to be kept out of the score as it is kept out of print.
     · ERA, as the tiebreak: 150 while born within four years, then decaying.
     · AGE: 25, day-precise, so ties stay rare (the reason it was added: a
       year-only gap once left ranks 400-486 alphabetical).
   Gone: nationality (unreliable), the current-club term (`club` is the
   LONGEST spell, not the current one, and shared clubs already pay real
   teammates by their real years), the position word.

   The consequence that matters: with no shared club, the best a guess can do
   is same line + same era, 425 — below anyone who played at the answer's club
   in his time. The reasons line under each guess (explainGuess) says exactly
   these three things, so the rank and its explanation always agree. */
import { foldLetters } from './letterFold.js';
import { clubsOf, sharedClubs, mainClub, initials } from './mysteryCareer.js';

const W = {
  sharedClub: 200, // per club both played for, whenever
  together: 300, //   added per shared club, scaled by years as teammates
  togetherFull: 5, // years together that earn the whole bonus
  sharedClubMax: 3, // best three clubs only: a journeyman cannot win on volume
  slot: 250, // same line
  era: 150, // born within SAME_ERA_YEARS; decays past it
  eraDecay: 4,
  age: 25, // continuous tiebreak
};

/** Born within this many years of the answer reads "Same era". */
export const SAME_ERA_YEARS = 4;
/** Beyond this the reasons say "Different era"; in between, "Born N years apart". */
export const NEAR_ERA_YEARS = 9;

function eraShare(gap) {
  return gap <= SAME_ERA_YEARS ? 1 : Math.exp(-(gap - SAME_ERA_YEARS) / W.eraDecay);
}

// ⚠️ Math.exp is implementation-defined precision (JavaScriptCore and V8 differ
// by 1 ULP on ~8% of inputs, measured 2026-08-14). Harmless here: it perturbs a
// magnitude, and the ANSWER is read from the frozen schedule, so no two players
// can be shown different puzzles. If this score ever feeds an ordering that two
// devices must agree on exactly, port it to integer maths like seededShuffle.
function ageShare(p, answer) {
  const YEAR = 365.25;
  const ad = p.dob && answer.dob ? Math.abs(Date.parse(p.dob) - Date.parse(answer.dob)) / 86400000 : null;
  if (ad !== null && Number.isFinite(ad)) return Math.exp(-ad / (6 * YEAR));
  // A few players have only a birth year upstream: same curve on the year.
  if (p.born && answer.born) return Math.exp(-Math.abs(p.born - answer.born) / 6);
  return 0;
}

/**
 * A scoring function for one answer. The answer's clubs are worked out once,
 * so ranking nine thousand players does not rebuild them nine thousand times.
 */
export function makeScorer(answer, careers = null) {
  const answerClubs = careers ? clubsOf(answer, careers) : null;
  return (p) => {
    let s = 0;
    if (answerClubs && answerClubs.size) {
      const shared = sharedClubs(answer, p, careers, answerClubs);
      for (const x of shared.slice(0, W.sharedClubMax)) {
        s += W.sharedClub + W.together * Math.min(x.together, W.togetherFull) / W.togetherFull;
      }
    }
    if (p.slot && p.slot === answer.slot) s += W.slot;
    if (p.born && answer.born) s += W.era * eraShare(Math.abs(p.born - answer.born));
    s += W.age * ageShare(p, answer);
    return s;
  };
}

/** Similarity of `p` to the secret `answer`. Higher is closer. */
export function similarity(p, answer, careers = null) {
  return makeScorer(answer, careers)(p);
}

/**
 * Rank the whole pool against `answer`, best first.
 * Returns a Map of player id -> rank (1-based). The answer is always rank 1.
 *
 * Ties are broken by NAME rather than left to the engine's sort stability, so
 * the same puzzle produces the same ranks on every device — the Daily 7 was
 * bitten by exactly this when a sort depended on engine-specific behaviour.
 */
export function rankPool(pool, answer, careers = null) {
  const score = makeScorer(answer, careers);
  const scored = pool.map((p) => ({ id: p.id, name: p.name, s: p.id === answer.id ? Infinity : score(p) }));
  scored.sort((a, b) => (b.s - a.s) || a.name.localeCompare(b.name));
  const ranks = new Map();
  scored.forEach((p, i) => ranks.set(p.id, i + 1));
  // The answer must be rank 1 even if another player scores identically —
  // otherwise a correct guess would not read as a win.
  ranks.set(answer.id, 1);
  return ranks;
}

/**
 * WHY a guess sits where it does: the same three things the score pays for,
 * and nothing it does not. Returns null for the answer itself.
 *   shared       [{ club, together, years }], best link first
 *   samePosition same line (GK / DF / MF / FW)
 *   gap          years between their births, or null when one is unknown
 *   era          'same' | 'near' | 'far' | null
 *   bornWhen     'earlier' | 'later' | null: the GUESS was born before or
 *                after the answer (null when the years match or one is unknown)
 */
export function explainGuess(p, answer, careers = null) {
  if (!p || !answer || p.id === answer.id) return null;
  const shared = careers ? sharedClubs(answer, p, careers) : [];
  const gap = p.born && answer.born ? Math.abs(p.born - answer.born) : null;
  const era = gap == null ? null : gap <= SAME_ERA_YEARS ? 'same' : gap <= NEAR_ERA_YEARS ? 'near' : 'far';
  const bornWhen = !gap ? null : p.born < answer.born ? 'earlier' : 'later';
  return { shared, samePosition: !!p.slot && p.slot === answer.slot, gap, era, bornWhen };
}

const listClubs = (clubs) => (clubs.length <= 2 ? clubs.join(' & ') : `${clubs.slice(0, 2).join(', ')} +${clubs.length - 2}`);

/**
 * The one line printed under a guess: "Teammates at Juventus · Same position ·
 * Same era", "Shared Barcelona · Later era", "No shared club, born 6 years
 * earlier".
 *
 * ⚠️ THE ERA SAYS WHICH WAY (design review, 15 Oct 2026). "Born 6 years apart"
 * and "Different era" were true and taught nothing: seven megastar openers
 * came back cold, and not one of them told the player whether to think older
 * or younger. The direction is the one thing every guess knows about the
 * answer, it is already in the score (era and age), and it is no more than the
 * birth years the reveal prints. The subject is the GUESS, as with "Same
 * position": Rooney under a Salah day reads "born 7 years earlier".
 */
export function reasonLine(x) {
  if (!x) return '';
  const parts = [];
  if (x.shared.length) {
    const mates = x.shared.filter((c) => c.together >= 1).map((c) => c.club);
    const only = x.shared.filter((c) => c.together < 1).map((c) => c.club);
    if (mates.length) parts.push(`Teammates at ${listClubs(mates)}`);
    else parts.push(`Shared ${listClubs(only)}`);
  }
  if (x.samePosition) parts.push('Same position');
  // Same era keeps its word (the score treats those four years alike) and adds
  // the direction after a comma, so the pair holds together on a wrap.
  const eraWord = x.era === 'same' ? (x.bornWhen ? `Same era, born ${x.bornWhen}` : 'Same era')
    : x.era === 'near' ? (x.bornWhen ? `Born ${x.gap} years ${x.bornWhen}` : `Born ${x.gap} years apart`)
      : x.era === 'far' ? (x.bornWhen === 'earlier' ? 'Earlier era' : x.bornWhen === 'later' ? 'Later era' : 'Different era') : '';
  if (!x.shared.length && !x.samePosition) {
    if (eraWord.includes(',')) return `No shared club · ${eraWord}`;
    return eraWord ? `No shared club, ${eraWord.charAt(0).toLowerCase()}${eraWord.slice(1)}` : 'No shared club';
  }
  if (!x.shared.length) parts.unshift('No shared club');
  if (eraWord) parts.push(eraWord);
  return parts.join(' · ');
}

/**
 * Does this guess have a VISIBLE reason to be close? A shared club, or the
 * same position in the same era. The ranking is built so that nobody without
 * one reaches the boiling band; the unit tests hold it to that.
 */
export function hasCloseLink(x) {
  return !!x && (x.shared.length > 0 || (x.samePosition && (x.era === 'same' || x.era === 'near')));
}

// ── Clues ───────────────────────────────────────────────────────────────────
// ⚠️ THE WARM START (16 Oct 2026). The opening was a wall of "cold": seven
// megastar guesses on the Xavi day all came back cold, ranked 1,065 to 5,726
// of 9,030, and the daily win rate ran 5% to 94% (median 56%). Re-ordering the
// schedule could not fix that (return research, 16 Oct, "Fewer bad days");
// the game needed a warmer first guess.
//
// So two clues are FREE from guess one: his position and the decade he was
// born in. Both are things the ranking already pays for (same line 250, era
// 150), so a guess that follows them lands in the warm band and its reason
// line agrees ("Same position · Same era"). Then a club he gave most years to
// after 4 guesses and his initials after 8, each waiting for a tap.
//
// Measured with a scripted fan over the 75 served days and the next 60
// (ball-iq-audit/2026-10-16/mystery-warm/simulate.mjs), same answers:
//   cold among the first three guesses 72% -> 26%; first guess off cold from
//   the third to the first; guesses to solve, median 9 -> 6; modelled win
//   rate 56% -> 71%; days under 50% 11 of 75 -> 1 of 75. The fan's patience
//   is fitted so that "before" matches the real 56%.
// Position alone free did nothing for the win rate (56%); the decade is what
// lifts the first guess, the earlier club what lifts the bad days.
//
// ⚠️ "Born in the 1980s" was dropped as a LATE rung on 14 Oct: after three
// guesses every reason line has already said older or younger, so it added
// nothing. As a STARTING clue it is the opposite: the one thing that turns a
// first guess from a shot in the dark into a same-era guess.
// ⚠️ NEVER NATIONALITY. Rechecked 16 Oct 2026: `nat` is now the national team,
// mostly right, but it is the LAST one a player turned out for — Puskás and
// Di Stéfano read "Spain" — no source checks it per answer, and the ranking
// does not use it, so a nationality clue could not be explained by any rank.
/** Rungs that are shown from the start, before any guess. */
export const FREE_CLUES = ['position', 'born'];
/** Guesses before each paid rung unlocks: the club, then the initials. */
export const CLUE_AFTER = [4, 8];

/** "1980s" for a player born 1987. */
export function birthDecade(born) {
  return Number.isFinite(born) && born > 1800 ? `${Math.floor(born / 10) * 10}s` : null;
}

export function clueLadder(answer, careers = null, roles = null) {
  if (!answer) return [];
  const free = [];
  const pos = hintPosition(answer, roles);
  if (pos) free.push({ key: 'position', label: 'Position', value: pos.charAt(0).toUpperCase() + pos.slice(1) });
  const decade = birthDecade(answer.born);
  if (decade) free.push({ key: 'born', label: 'Born', value: decade });
  const paid = [];
  const club = careers ? mainClub(answer, careers) : null;
  if (club) paid.push({ key: 'club', label: 'Played for', value: club });
  const ini = initials(answer.name);
  // A one-name player (Eusébio, Neymar) gets one letter, and says so: a lone
  // "E." otherwise reads like a name with its surname missing.
  if (ini) paid.push({ key: 'initials', label: 'Initials', value: ini.includes(' ') ? ini : `${ini} (one name)` });
  return [
    ...free.map((c) => ({ ...c, after: 0, free: true })),
    ...paid.map((c, i) => ({ ...c, after: CLUE_AFTER[i], free: false })),
  ];
}

/**
 * How many PAID clues a saved game had taken, under today's ladder.
 *   clues: 3  today's ladder (club, initials): as saved
 *   clues: 2  the 14 Oct ladder (position, club, initials): position is free
 *             now, so one fewer
 *   none      before the ladder: at most the old first hint, which was the
 *             position, free now
 */
export function paidCluesFromSave(saved) {
  const h = Math.max(0, Number(saved?.hintsUsed) || 0);
  if (saved?.clues === 3) return Math.min(h, CLUE_AFTER.length);
  if (saved?.clues === 2) return Math.min(Math.max(0, h - 1), CLUE_AFTER.length);
  return 0;
}

/**
 * The rank put in proportion: "top 12%" reads as a place in the field where
 * "1,065 of 9,030" read as hopeless. Rounded UP, so nobody is flattered, and
 * never below 1%.
 */
export function topShare(rank, poolSize) {
  if (!(rank > 0) || !(poolSize > 0)) return '';
  return `top ${Math.max(1, Math.ceil((rank / poolSize) * 100))}%`;
}

// ── The position a clue or a reveal may PRINT ───────────────────────────────
// ⚠️ `position` AND `slot` ARE RANKING TOKENS, NOT FACTS. Both come from
// Wikidata P413 and both feed similarity() above, where a wrong one costs a
// few places. Printed as "The answer is a midfielder." a wrong one is a false
// statement about a real player, and that is what a screen recording caught on
// 2026-10-08: Hiroki Sakai, a right-back, was three days from being clued as a
// midfielder. Measured that day across the 400 scheduled answers:
//   · 32 where `position` contradicts `slot` (Messi, Pelé, Totti, Cruyff and
//     Maradona all "midfielder"; Stoichkov "coach")
//   · 15 "wing half", Wikidata's label for a modern winger. The real wing half
//     was a 1930s half-back, so of those fifteen the word is true of exactly
//     one, Bill Shankly, whom `slot` then files as a forward
//   · and agreement proves nothing either: Ezequiel Garay read "full-back" and
//     Nacho Monreal "centre-back", each the other's job.
//
// So printing goes through here and nowhere else. A verified role
// (src/data/mysteryRoles.json, each checked against a source) wins. Without
// one, the pool's word is printed only if it is a word we recognise AND it sits
// in the line `slot` says, which is the weakest claim the data can still
// support. Anything else returns null and the caller prints nothing: the
// reveal panel already runs on "thin and true beats rich and wrong".
//
// ⚠️ THE RANKING FOLLOWS THE SAME LIST. A clue that says "midfielder" on a day
// the ranking rewards defenders is confusing in a way a player cannot see
// through, so scripts/apply-mystery-roles.mjs writes each checked role back to
// the pool's `slot` and `position`, and audit-mystery-schedule.mjs fails the
// build if they drift apart again (a pool rebuild would do it silently).
// Where a source names two roles for a number ten ("attacking midfielder or
// forward"), the checked role is the one in the line the pool already ranked
// him in: build-mystery-pool-v2.mjs files Messi, Totti and Maradona under FW
// on purpose, and the clue should not argue with it.
const POSITION_LINE = {
  goalkeeper: 'GK',
  defender: 'DF', 'centre-back': 'DF', 'full-back': 'DF',
  midfielder: 'MF', 'defensive midfielder': 'MF', 'central midfielder': 'MF', 'attacking midfielder': 'MF',
  forward: 'FW', winger: 'FW', striker: 'FW', 'centre-forward': 'FW', 'second striker': 'FW',
};

/** GK / DF / MF / FW for a checked role. The one real wing half was a half-back. */
export function roleLine(role) {
  return role === 'wing half' ? 'MF' : POSITION_LINE[role] || null;
}

/**
 * @param {object} player  pool record
 * @param {object} [roles] id -> verified position word, or null to withhold (mysteryRoles.json)
 * @returns {string|null}  lower-case position, or null when nothing is safe to print
 */
export function hintPosition(player, roles = null) {
  if (!player) return null;
  // An explicit null is a decision, not a gap: the sources disagree about this
  // player, so the clue is withheld rather than guessed.
  if (roles && Object.hasOwn(roles, player.id)) return roles[player.id] || null;
  const word = String(player.position || '').toLowerCase();
  return POSITION_LINE[word] && POSITION_LINE[word] === player.slot ? word : null;
}

/** "a winger", "an attacking midfielder" — the clue used to print "a attacking". */
export function withArticle(phrase) {
  return `${/^[aeiou]/i.test(phrase) ? 'an' : 'a'} ${phrase}`;
}

/** Bands drive the colour of a guess row. Contexto's green/amber/grey. */
// The last rank that still counts as hot, and as warm. One source for the
// bands a guess is given and for the key the empty screen shows.
export const HOT_SHARE = 0.01, WARM_SHARE = 0.08;
export function bandLimits(poolSize) {
  return { hot: Math.max(10, Math.round(poolSize * HOT_SHARE)), warm: Math.max(60, Math.round(poolSize * WARM_SHARE)) };
}
export function bandFor(rank, poolSize) {
  if (rank === 1) return 'win';
  const { hot, warm } = bandLimits(poolSize);
  if (rank <= hot) return 'hot';
  if (rank <= warm) return 'warm';
  return 'cold';
}

// ── Daily schedule ──────────────────────────────────────────────────────────
// Same frozen-log pattern as Footle and the Trail, and for the same reason:
// picking the answer by `index % pool.length` means ADDING ONE PLAYER silently
// rewrites every past and future puzzle, including any archive we publish.
// The log is authored once and only ever appended to.
// ⚠️ Anchored to the day the mode SHIPPED, not to tomorrow. The Transfer
// Trail was anchored a month ahead and therefore served nothing while
// appearing finished — getTrailAnswer() returned null, the card hid itself,
// and nobody noticed for days. Verify this resolves to a real player on the
// day you ship.
export const MYSTERY_ANCHOR_DAY = 20668; // days since epoch — day #1

// ⚠️ MODE PULLED 2026-08-06 — Alex, after playing it: "i can not even search
// for ronaldo... we simply do not have enough players in the search bank for
// the mode to make sense at the moment."
//
// He is right, and the shape of the problem is worse than "not enough". The
// pool is 1,537 players drawn from the CURRENT SQUADS of the 68 clubs we have
// question packs for, which means it is both too big and the wrong people:
//
//   - it is full of squad filler nobody can name (Aaron Hayden, Abdallah Ali
//     Mohamed) — 1,537 candidates to rank against, most of them noise
//   - it contains ZERO legends, because legends are in nobody's current squad
//   - it misses the most-typed names on earth: Ronaldo is at Al-Nassr and
//     Messi at Inter Miami, neither of which is one of our 68 clubs
//
// So the first thing a player does — type the most famous name they know —
// returns nothing, and the game looks broken rather than hard. Guessing is the
// entire interaction; if the search bar cannot find Ronaldo there is no game.
//
// Flipping this to `true` is the ONLY thing needed to bring the mode back, so
// fix the POOL first (a curated set of recognisable players across eras, not a
// squad dump) and flip it after. Nothing else has been deleted: the screen,
// the ranking, the schedule and the tests all remain, dormant. Landing it
// inert rather than half-wired is the standing rule.
// RE-ENABLED 2026-08-12. The pool defect this flag was hiding is fixed: the
// ANSWER pool is now 606 players who are each either named in our verified
// question bank or played for a club we thought worth its own quiz page.
// Removed on the way: Julio Iglesias (a singer with a Real Madrid youth spell)
// and 53 career J-League players who cleared the old fame bar purely because
// Japanese Wikipedia coverage inflates a sitelink-based score.
// To pull it again, set this to false — nothing else needs touching.
// RE-ENABLED 2026-08-12, after BOTH defects that kept it pulled were fixed
// and all 18 previously-suspended assertions pass:
//   1. THE ANSWER POOL. 660 -> 606. Julio Iglesias (a singer with a Real
//      Madrid youth spell) and 53 career J-League players had cleared the old
//      fame>=55 gate, because that gate measures Wikipedia notability rather
//      than football recognisability.
//   2. THE RANKING. similarity()'s age term was keyed on `dob`, a field NO
//      pool entry had, so it never ran; and its linear decay clamped to zero
//      past 12 years, flattening 37% of the field. Backfilled 8,479 dates and
//      switched to exponential decay. Distinct scores: 1.6% -> 82-88%.
// To pull it again, set this to false — nothing else needs touching.
export const MYSTERY_ENABLED = true;

/**
 * ⚠️ LOCAL MIDNIGHT, NOT UTC — and this was the one daily that got it wrong.
 *
 * This used to be `Math.floor(now.getTime() / 86400000)`, a floor of a UTC
 * millisecond count, while the SAVE KEY for the same puzzle (`ymd()`, below)
 * has always used the local calendar date. The two disagreed for part of every
 * day, in every timezone on earth:
 *
 *   America/New_York  local 21:00  utcIdx 20691  localIdx 20690   diverge
 *   Europe/Oslo       local 01:00  utcIdx 20690  localIdx 20691   diverge
 *   Asia/Tokyo        local 01:00  utcIdx 20690  localIdx 20691   diverge
 *
 * ⚠️ The debug pass that found this reported Oslo and Tokyo as matching. They
 * do — at midday. Every zone agrees in the middle of its day and diverges near
 * a boundary; UTC-negative zones break in the local EVENING and UTC-positive
 * zones in the local EARLY MORNING. Verified by running both forms under all
 * three zones rather than trusting the report.
 *
 * What the player saw: solve it at 21:00 in New York and the result is filed
 * under the 25th, but the answer served was the 26th's — so opening the app
 * next morning gave a fresh empty board holding a player they had already
 * guessed. The shared puzzle number disagreed between countries, which is the
 * one token that makes "Mystery Player #24" comparable between friends. And
 * the result screen's countdown, which uses msToNextLocalMidnight, promised a
 * new player in three hours when the answer had changed an hour earlier.
 *
 * ⚠️ FOR UTC+12 AND UP IT WAS NOT AN EDGE CASE AT ALL. Auckland's local noon
 * is 23:00 UTC of the PREVIOUS day under NZDT, so the old form served
 * yesterday's puzzle for the WHOLE day — 189 of 400 days sampled, not just
 * near a boundary. New Zealand and the Pacific were a full puzzle behind the
 * rest of the world, while their save key (local `ymd()`) filed the result
 * under today. Everywhere else, midday is unchanged across all 400 days and
 * only the rollover moment moves.
 *
 * Consequence of shipping this: players in those zones see their Mystery
 * number advance by one, once. That is the correction, not a regression — it
 * puts them back in step with the shared number their friends see.
 *
 * This is now the same form Footle, the Trail and date.js's dayIndexForDate
 * all use — UTC midnight OF THE LOCAL DATE. Four dailies, one definition of
 * what day it is.
 */
export function mysteryDayIndex(now = new Date()) {
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
}
export function mysteryNumber(now = new Date()) {
  return mysteryDayIndex(now) - MYSTERY_ANCHOR_DAY + 1;
}

/**
 * Today's answer id, from the frozen log. Returns null beyond the log rather
 * than falling back to modulo — a wrong-but-plausible answer is worse than a
 * hidden card, and the card is gated on this being non-null.
 */
export function answerIdForDay(log, dayIndex) {
  const i = dayIndex - MYSTERY_ANCHOR_DAY;
  return i >= 0 && i < log.length ? log[i] : null;
}

/** Accepts a guess by name, case- and accent-insensitively. */
export function normaliseName(s) {
  // foldLetters first: ø ł ı ß and friends do not decompose, so without it the
  // mark-strip below turned Ødegaard into "degaard" and no plain spelling of
  // about 150 players could find them (lib/letterFold.js).
  return foldLetters(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Find the pool player a typed guess refers to, or null. */
export function matchGuess(pool, text) {
  const q = normaliseName(text);
  if (!q) return null;
  const exact = pool.find((p) => normaliseName(p.name) === q);
  if (exact) return exact;
  // Surname-only guesses are the common case ("saka", "odegaard"), but only
  // accept one if it is UNAMBIGUOUS — two players sharing a surname must not
  // silently resolve to whichever sorts first.
  //
  // ⚠️ Match any TRAILING RUN of name parts, not just the last one. Comparing
  // only the final token silently failed every multi-word surname in the game:
  // "de Ligt" split to ["matthijs","de","ligt"], the last part is "ligt", and
  // the guess "de ligt" matched nothing at all — despite exactly one such
  // player existing. Same for van Dijk, De Bruyne, Di María, Van de Beek.
  // Comparing part-aligned suffixes keeps "ligt" working too, so this is
  // strictly more permissive without loosening the ambiguity rule below.
  const suffix = pool.filter((p) => {
    const parts = normaliseName(p.name).split(' ');
    for (let i = parts.length - 1; i >= 0; i--) if (parts.slice(i).join(' ') === q) return true;
    return false;
  });
  return suffix.length === 1 ? suffix[0] : null;
}

// ── Persistence + streak ────────────────────────────────────────────────────
// Retention is the measured bottleneck (activation collapsing 100% -> 38% ->
// 15% by cohort), so the RETURN mechanic matters more than the game. Footle
// and the Trail both track a streak; this shipped without one.

const KEY = (ymd) => `biq_mystery_${ymd}`;

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Persist today's result so a reload does not reset a solved puzzle. */
export function saveMysteryResult(date, result) {
  try { localStorage.setItem(KEY(ymd(date)), JSON.stringify(result)); } catch { /* private mode */ }
}

export function loadMysteryResult(date) {
  try {
    const raw = localStorage.getItem(KEY(ymd(date)));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * Consecutive solved days ending today. Walks BACKWARDS from today and stops
 * at the first gap, which is what makes it a streak rather than a total.
 *
 * ⚠️ Uses LOCAL dates, matching the Trail. A UTC-based walk would break the
 * streak for anyone playing late evening west of UTC — their "today" and the
 * stored key would disagree for several hours every night.
 */
export function computeMysteryStreak(today = new Date()) {
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let i = 0; i < 366; i++) {
    const r = loadMysteryResult(cursor);
    if (!r || !r.won || r.arc) break; // arc = archive back-fill, not streak fuel
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Share text. A daily game without one does not spread — it is the entire
 * mechanism Wordle grew on, and Footle and the Trail both have it while this
 * shipped without.
 *
 * ⚠️ SPOILER-SAFE. The grid shows the BAND of each guess, never the rank and
 * never a name, so posting it cannot give the answer away to someone who has
 * not played. Ordered worst-to-best so it reads as a journey ending in green.
 */
export function buildMysteryShareText({ number, guesses = [], won, streak = 0 } = {}) {
  const head = `⚽ Ball IQ · Mystery Player${number > 0 ? ` #${number}` : ''}`;
  const icon = { win: '🟩', hot: '🟩', warm: '🟨', cold: '⬜' };
  const grid = [...guesses]
    .sort((a, b) => b.rank - a.rank)
    .map((g) => icon[g.band] || '⬜')
    .join('');
  const line = won
    ? `Solved in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}`
    : 'Gave up';
  const streakLine = won && streak > 1 ? `\n🔥 ${streak}-day Mystery streak` : '';
  return `${head}\n${line}\n${grid}${streakLine}\n\nballiq.app/mystery`;
}
