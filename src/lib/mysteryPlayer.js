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
const W = {
  club: 1000, // same CURRENT club — the strongest possible signal
  sharedClub: 420, // per club they have BOTH played for (career overlap)
  sharedClubMax: 3, // cap, so a 19-club journeyman cannot dominate
  country: 300, // same league country
  slot: 150, // same broad position (GK/DF/MF/FW)
  position: 90, // same specific position (centre-back vs full-back)
  nat: 220, // same nationality
  age: 60, // continuous, 0..60 — the tie-breaker that prevents mass ties
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
function sharedClubs(a, b, careers) {
  if (!careers) return 0;
  const ca = careers[a.id];
  const cb = careers[b.id];
  if (!ca || !cb) return 0;
  const setB = new Set(cb);
  let n = 0;
  for (const c of ca) if (setB.has(c)) n++;
  return Math.min(n, W.sharedClubMax);
}

/** Similarity of `p` to the secret `answer`. Higher is closer. */
export function similarity(p, answer, careers = null) {
  let s = 0;
  if (p.club === answer.club) s += W.club;
  s += sharedClubs(p, answer, careers) * W.sharedClub;
  if (p.country && p.country === answer.country) s += W.country;
  if (p.slot && p.slot === answer.slot) s += W.slot;
  if (p.position && p.position === answer.position) s += W.position;
  if (p.nat && p.nat === answer.nat) s += W.nat;
  // Age closeness decays over ~12 years, so a 22-year-old is meaningfully
  // closer to a 24-year-old than to a 34-year-old.
  //
  // ⚠️ Uses the full birth DATE, not the year. Measured: a year-only gap gives
  // about 13 distinct levels, which left 118 distinct scores across 1,539
  // players and a largest tie group of 86 — ranks 400-486 would have been
  // alphabetical noise. Day-level precision makes this term effectively
  // continuous, so the ordering within a band is always explicable.
  const ad = p.dob && answer.dob ? Math.abs(Date.parse(p.dob) - Date.parse(answer.dob)) / 86400000 : null;
  if (ad !== null && Number.isFinite(ad)) {
    s += Math.max(0, W.age * (1 - ad / (12 * 365.25)));
  } else if (p.born && answer.born) {
    const gap = Math.abs(p.born - answer.born);
    s += Math.max(0, W.age * (1 - gap / 12));
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
  const surname = pool.filter((p) => {
    const parts = normaliseName(p.name).split(' ');
    return parts[parts.length - 1] === q;
  });
  return surname.length === 1 ? surname[0] : null;
}
