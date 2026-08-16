// Mystery Player — guess the secret footballer, Contexto-style.
//
// Every guess returns a RANK. The answer is 1; the further down, the less the
// guess resembles the answer. Unlimited guesses, one puzzle a day.
//
// ⚠️ THE DESIGN RISK, and how this handles it.
// A rank only feels fair if the ordering is explicable. Contexto (the word
// game) gets that from embeddings with genuinely continuous distance. We have
// five attributes, and if the score were built from equal-weight boolean
// matches, hundreds of players would TIE — the game would then break ties
// arbitrarily and a player would see "Rice 340, Saka 12" with no way to reason
// about why. That reads as broken, not clever.
//
// So AGE is deliberately continuous and is the finest-grained term. Two
// players who match on club, country, position and nationality are still
// separated by how close their birth years are, which is a difference a
// football fan can actually feel. Booleans set the bands; age orders within
// them.
//
// WEIGHTS — chosen so each tier is worth strictly more than everything below
// it combined, which makes the ordering readable: "same club" always outranks
// "same country + same position + same nationality".
/* ── WEIGHTS ADOPTED FROM THE GENRE LEADER, 2026-08-15 ────────────────────────
   Football Contexto publishes its own model: shared clubs 35%, era overlap 15%,
   position 15%, nationality 15%, age 10%, career stats 10%. Alex: "can we copy
   theirs please, they know how to do it". Measured against our old weights on
   the Oblak puzzle, theirs is plainly better feedback:

     Alisson    1112 cold -> 107 warm     ter Stegen 1131 cold -> 138 warm
     Neuer      1374 cold -> 473 warm     Courtois     79 hot  ->  11 hot
     Casillas    261 warm -> 769 cold     Messi       720 warm -> 3405 cold

   Guessing a CONTEMPORARY KEEPER now reads warm, which is exactly the guess a
   knowledgeable player makes. The drops are correct too: Casillas and Yashin
   are right-position/wrong-era, and Messi was only warm because he shared a
   LEAGUE COUNTRY with Oblak — the model was rewarding "plays in Spain" over
   "is a goalkeeper". That term is gone.

   TWO DELIBERATE DEVIATIONS, both forced:
   · career stats 10% — we hold no goals/appearances data at all. Its share
     goes to a reduced CURRENT-CLUB term, which they can omit entirely because
     their pool is 766 players and almost nobody shares a club. Ours is 9,032,
     so dropping it would mute the strongest real-world tell.
   · league country — dropped, as above. They do not have it and it was
     actively misleading.

   Percentages of the ~1000 max: shared clubs 35 · era 15 · nationality 15 ·
   position 15 (slot 10 + specific 5) · age 10 · current club 10. */
const W = {
  club: 100, // same CURRENT club — kept, but no longer dominant
  /* A shared club splits into two parts, and that split is the whole point.
     Alex, 2026-08-15, relaying a player: "torres did play for atletico once,
     that should still count for some likeness but less so than players who
     have been teammates for a long time." Exactly right — so `sharedClub` is
     paid for having been there AT ALL, and `overlap` is paid on top for the
     years they were actually there TOGETHER.
     45 + 72 = 117, unchanged, so the 35% budget below still holds. */
  sharedClub: 45, //  per club BOTH played for, whenever
  overlap: 72, //  added per shared club, scaled by years as teammates
  overlapFull: 8, //  years of overlap that earn the full bonus
  sharedClubMax: 3, // cap, so a 19-club journeyman cannot dominate
  era: 150, // were they CONTEMPORARIES — the term we were missing entirely
  slot: 100, // same broad position (GK/DF/MF/FW)
  position: 50, // same specific position (centre-back vs full-back)
  nat: 150, // same nationality
  age: 100, // continuous — fine-grained closeness, and the tie-breaker
};

/**
 * Clubs both players have EVER been at. This is the term that makes the genre
 * work, and we nearly shipped without it.
 *
 * The game we are modelling ours on states its own algorithm: "attributes
 * associated with the player such as nationality, TEAMS PLAYED FOR, age and
 * position". Their worked example only holds up because of it — Rivaldo ranks
 * 5 for Ronaldinho since both are Brazilian AND both played for Barcelona.
 * Scoring on current club alone would call that pair strangers, and anyone who
 * knows the genre would feel ours was the worse game.
 *
 * Capped at sharedClubMax: without it a journeyman with 19 clubs would rank
 * absurdly high against half the pool purely for having been everywhere.
 */
const NOW_YEAR = 2026;

/** Years two spells at the same club actually overlapped. Unknown dates -> 0. */
function overlapYears([, s1, e1], [, s2, e2]) {
  if (s1 == null || s2 == null) return 0;
  return Math.max(0, Math.min(e1 ?? NOW_YEAR, e2 ?? NOW_YEAR) - Math.max(s1, s2));
}

/**
 * ⚠️ A PLAYER WITH NO OPEN-ENDED SPELL HAS NO CURRENT CLUB.
 *
 * latestClub() in the pool builder picks the LONGEST spell, not the most
 * recent — deliberately, because picking by recency labelled every active
 * player with an old club (Neuer as Schalke, Courtois as Chelsea). That is
 * right for someone still playing and wrong for someone who has retired: it
 * hands them their most-tenured club and `similarity` then reads it as CURRENT
 * and pays the full W.club.
 *
 * Fernando Torres, whose Atlético spell in our data ended in 2001, was
 * therefore scored as an Atlético player against Jan Oblak — who did not
 * arrive until 2014 — and outranked Saúl Ñíguez, Oblak's teammate of eleven
 * years, by 249 places. That is the bug a player reported.
 */
function isActive(p, careers) {
  const spells = careers?.p?.[p.id];
  if (!spells || !spells.length) return true; // unknown -> behave as before
  return spells.some(([, , end]) => end == null);
}

/**
 * Score for clubs both players have been at, weighted by time TOGETHER.
 * Returns points, not a count. Best `sharedClubMax` clubs only, so a
 * journeyman cannot dominate by having been everywhere.
 */
function sharedClubScore(a, b, careers) {
  const ca = careers?.p?.[a.id];
  const cb = careers?.p?.[b.id];
  if (!ca || !cb) return 0;
  const mine = new Map();
  for (const sp of cb) {
    // Keep the LONGEST spell per club: a player can have two stints at one club
    // and we want the one that best represents their time there.
    const prev = mine.get(sp[0]);
    if (!prev || ((sp[2] ?? NOW_YEAR) - sp[1]) > ((prev[2] ?? NOW_YEAR) - prev[1])) mine.set(sp[0], sp);
  }
  const scores = [];
  for (const sp of ca) {
    const theirs = mine.get(sp[0]);
    if (!theirs) continue;
    const yrs = overlapYears(sp, theirs);
    scores.push(W.sharedClub + W.overlap * Math.min(yrs, W.overlapFull) / W.overlapFull);
  }
  scores.sort((x, y) => y - x);
  return scores.slice(0, W.sharedClubMax).reduce((s, v) => s + v, 0);
}

/** Similarity of `p` to the secret `answer`. Higher is closer. */
export function similarity(p, answer, careers = null) {
  let s = 0;
  // Only players who are STILL AT a club can share a current one. For a retired
  // player `club` is really "last club" and must not be paid as if it were now.
  if (p.club === answer.club && isActive(p, careers) && isActive(answer, careers)) s += W.club;
  s += sharedClubScore(p, answer, careers);
  if (p.slot && p.slot === answer.slot) s += W.slot;
  if (p.position && p.position === answer.position) s += W.position;
  if (p.nat && p.nat === answer.nat) s += W.nat;
  /* ERA is a PLATEAU, not a curve, and that is what separates it from `age`
     below. Anyone born within ten years of the answer was a contemporary and
     gets full credit; past that it decays. Age then does the fine-grained
     work. Modelled on birth year because the shipped careers file carries club
     NAMES only — the real start/end years exist build-side and were stripped.
     ⚠️ So this is a PROXY: someone who retired at 28 or played until 41 sits
     slightly wrong. Shipping career years would fix it properly. */
  {
    const gap = Math.abs((p.born || 0) - (answer.born || 0));
    if (p.born && answer.born) s += W.era * (gap <= 10 ? 1 : Math.exp(-(gap - 10) / 6));
  }
  // Age closeness decays over ~12 years, so a 22-year-old is meaningfully
  // closer to a 24-year-old than to a 34-year-old.
  //
  // ⚠️ Uses the full birth DATE, not the year. Measured: a year-only gap gives
  // about 13 distinct levels, which left 118 distinct scores across 1,539
  // players and a largest tie group of 86 — ranks 400-486 would have been
  // alphabetical noise. Day-level precision makes this term effectively
  // continuous, so the ordering within a band is always explicable.
  // ⚠️ EXPONENTIAL, NOT LINEAR-CLAMPED. The previous form was
  //     max(0, W.age * (1 - gap / 12years))
  // which hits EXACTLY ZERO beyond twelve years — and in a pool spanning
  // 1910s to 2000s births, 37% of players sit that far from any given answer.
  // The one term whose whole job is "the tie-breaker that prevents mass ties"
  // was contributing nothing at all to more than a third of the field, so they
  // could only differ on the booleans and collapsed into a handful of scores.
  // Measured: 1.6% distinct with no dob at all, 28.8% once dob landed but still
  // clamped. Exponential decay never reaches zero, so two distinct birth dates
  // always produce distinct scores while "closer in age scores higher" still
  // holds everywhere. Half-life ~4.2 years keeps the near-age feel of the old
  // curve; the tail merely stops being flat.
  // ⚠️ BEFORE RE-ENABLING MYSTERY: Math.exp is implementation-defined precision
  // in ECMAScript, exactly like the Math.sin that once gave iOS and Android
  // different Daily 7 questions for months. Measured 2026-08-14 across the real
  // input range: 636 of 8000 values differ between JavaScriptCore (iOS) and V8
  // (Android/Chrome).
  //
  // It is harmless *here* and deliberately left alone: the deltas are 1 ULP
  // (max relative 2.2e-16), they feed a similarity score that is rounded before
  // display, and the ANSWER itself is scheduled server-side by
  // build-mystery-pool.mjs — so no player can be shown a different puzzle. The
  // Math.sin bug was severe because it fed a sort COMPARATOR and changed
  // ordering; this only perturbs a magnitude.
  //
  // What would make it matter: ranking guesses against each other, or exposing
  // an exact score that two players on different platforms could compare. If
  // this scoring ever becomes ordering, port it to integer maths the way
  // seededShuffle in lib/quiz.js was.
  const YEAR = 365.25;
  const ad = p.dob && answer.dob ? Math.abs(Date.parse(p.dob) - Date.parse(answer.dob)) / 86400000 : null;
  if (ad !== null && Number.isFinite(ad)) {
    s += W.age * Math.exp(-ad / (6 * YEAR));
  } else if (p.born && answer.born) {
    // 11 players still lack a day-precision date upstream. Same curve on the
    // year, so they degrade smoothly instead of falling into a separate band.
    s += W.age * Math.exp(-Math.abs(p.born - answer.born) / 6);
  }
  return s;
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
  const scored = pool.map((p) => ({ id: p.id, name: p.name, s: similarity(p, answer, careers) }));
  scored.sort((a, b) => (b.s - a.s) || a.name.localeCompare(b.name));
  const ranks = new Map();
  scored.forEach((p, i) => ranks.set(p.id, i + 1));
  // The answer must be rank 1 even if another player scores identically —
  // otherwise a correct guess would not read as a win.
  ranks.set(answer.id, 1);
  return ranks;
}

/** Bands drive the colour of a guess row. Contexto's green/amber/grey. */
export function bandFor(rank, poolSize) {
  if (rank === 1) return 'win';
  if (rank <= Math.max(10, Math.round(poolSize * 0.01))) return 'hot';
  if (rank <= Math.max(60, Math.round(poolSize * 0.08))) return 'warm';
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

export function mysteryDayIndex(now = new Date()) {
  return Math.floor(now.getTime() / 86400000);
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
  return String(s || '')
    .toLowerCase()
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
    if (!r || !r.won) break;
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
  const streakLine = won && streak > 1 ? `\n🔥 ${streak}-day streak` : '';
  return `${head}\n${line}\n${grid}${streakLine}\n\nballiq.app/mystery`;
}
