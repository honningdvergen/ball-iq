// Shared player-name autocomplete for the guess-a-footballer modes.
//
// ONE implementation on purpose. Mystery Player and Transfer Trail both ask a
// player to type a name, and the ranking below was tuned against real queries
// (see the tuning notes in each branch). Two copies would drift the first time
// one was touched — which is exactly how the standalone CSS mirror, the pool
// nationality pass and the dob pass all silently reverted on 2026-08-14/15.
//
// ── HOW IT RANKS, and why it is not just a substring filter ──────────────────
// The pool is 9k+ deep, so plain `includes()` buries the obvious answer:
//   "saka"   → 32 matches, mostly Sakai / Sakamoto / Sakaguchi / Hosaka.
//   "shaw"   → Shawcross and Earnshaw sat level with Luke Shaw.
// Before this, the good answer only came first because the pool FILE happened
// to be fame-ordered — nothing in the code put it there, and any re-export
// would have moved it.
//
// FAME LEADS, position breaks ties. People mostly search a surname, but plenty
// of players are known by their first name, and "james" is the case that fixes
// the weighting: the expected order is James Rodríguez (90), James Milner (63),
// Reece James (55), David James (48) — fame order, first names and surnames
// interleaved. So the positional bonuses sit in the SAME range as a fame gap,
// never above it. An earlier attempt used +1000 surname vs +250 first-name — a
// gap fame (max 211) can never close — and it buried James Rodríguez.
import { normaliseName } from './mysteryPlayer.js';
import { foldDigraphs } from './letterFold.js';

// A name's searchable spellings, worked out once per record instead of on every
// keystroke: the plain fold ("muller", "odegaard") and, where it differs, the
// written-out one ("mueller", "oedegaard"). Both are things a real person
// types, and the Trail's grader has accepted both since July; the suggestions
// list only learned them on 2026-10-09.
const SPELLINGS = new WeakMap();
function spellingsOf(p) {
  let v = SPELLINGS.get(p);
  if (!v) {
    const plain = normaliseName(p.name);
    const long = normaliseName(foldDigraphs(p.name));
    v = long === plain ? [plain] : [plain, long];
    SPELLINGS.set(p, v);
  }
  return v;
}

export function scorePlayerMatch(p, q) {
  let s = 0;
  for (const full of spellingsOf(p)) {
    const parts = full.split(' ').filter(Boolean);
    // 60, not 250: a mononym's full name IS a partial query. At 250, typing
    // "ronaldo" put R9 (fame 124) above Cristiano (fame 211), which is not who
    // anyone means.
    const m = full === q ? 60
      : parts.some((w) => w === q) ? 45          // Saka · Reece James · James Milner
      : parts.some((w) => w.startsWith(q)) ? 25  // Sakai · Shawcross
      : 0;                                       // buried mid-word (Hosaka, Earnshaw): fame alone
    if (m > s) s = m;
  }
  s += p.fame || 0;
  // Recency nudge, smaller still: settles same-surname pile-ups (35 players
  // match "santos" and the 1950s Brazilians outrank the current ones on fame)
  // without reordering real prominence. At +30 it flipped André Silva above
  // Thiago Silva, whose fame is 23 higher — hence 12.
  if (p.born >= 1995) s += 12; else if (p.born >= 1985) s += 6;
  return s;
}

// ⚠️ HOW MANY MATCHES A GUESS BOX OFFERS: every one a player could want, up
// to thirty, in a list that scrolls. Top 10 and the Trail stopped at six, so
// "James" offered six Jameses and never David James, the seventh; the list
// would not scroll because there was nothing more in it (Alex, looking for
// England's keeper on build 146, 14 Oct 2026). Typing more narrows it, as it
// always did.
export const SUGGEST_MAX = 30;

/**
 * @param {Array} pool     player records ({ id, name, fame, born, club })
 * @param {string} text    raw user input
 * @param {object} [opts]  { exclude?: Set<id>, limit?: number }
 * @returns {Array} ranked player records, best first
 */
export function rankPlayerSuggestions(pool, text, opts = {}) {
  const q = normaliseName(text);
  // Two characters minimum: one letter matches thousands and is never a real
  // intent, and rendering that list on every keystroke janks a mid-range phone.
  if (q.length < 2) return [];
  const { exclude, limit = 8 } = opts;
  const exact = pool
    .filter((p) => (!exclude || !exclude.has(p.id)) && spellingsOf(p).some((n) => n.includes(q)))
    .map((p) => ({ p, s: scorePlayerMatch(p, q) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
  if (exact.length >= limit || q.length < 4) return exact;
  // ── THE FORGIVING PASS (Alex, 23 Oct 2026) ────────────────────────────────
  // Nobody can be expected to spell Mkhitaryan: "Mikita" found nothing, because
  // the list above only takes names that CONTAIN what was typed. When it comes
  // up short, the names that START within a typo or two of the query follow it,
  // nearest spelling first, then fame. One slip allowed up to five letters, two
  // from six (a short query with two slips matches half the pool).
  const seen = new Set(exact.map((p) => p.id));
  const max = q.length <= 5 ? 1 : 2;
  const near = [];
  for (const p of pool) {
    if (seen.has(p.id) || (exclude && exclude.has(p.id))) continue;
    const d = typoDistance(p, q, max);
    if (d <= max) near.push({ p, d });
  }
  near.sort((a, b) => a.d - b.d || (b.p.fame || 0) - (a.p.fame || 0));
  return exact.concat(near.slice(0, limit - exact.length).map((x) => x.p));
}

// The fewest typos between the query and the start of any word of the name
// (or of the whole name, for "henrik mkhitar"), counting a swapped pair as one.
// `max` bounds the work: anything worse is reported as max + 1.
// Same first letter only: a slip on the first letter is rare, and it cuts the
// work about twenty-fold, which a phone typing at speed needs.
const WORDS = new WeakMap();
function wordsOf(p) {
  let v = WORDS.get(p);
  if (!v) { v = spellingsOf(p).flatMap((f) => f.split(' ').filter(Boolean)); WORDS.set(p, v); }
  return v;
}
function typoDistance(p, q, max) {
  let best = max + 1;
  const multi = q.includes(' ');
  const targets = multi ? spellingsOf(p) : wordsOf(p);
  {
    for (const w of targets) {
      if (w[0] !== q[0]) continue;
      if (w.length < q.length - max) continue;
      for (let k = Math.max(1, q.length - max); k <= Math.min(w.length, q.length + max); k++) {
        const d = editDistance(q, w.slice(0, k), max);
        if (d < best) best = d;
        if (best === 0) return 0;
      }
    }
  }
  return best;
}

// Damerau-Levenshtein (optimal string alignment), stopping early once every
// path in a row is over `max`.
function editDistance(a, b, max) {
  const n = a.length, m = b.length;
  if (Math.abs(n - m) > max) return max + 1;
  let prev2 = null, prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = [i];
    let low = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < low) low = v;
    }
    if (low > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[m];
}

/**
 * Subtitle under a suggested name, used to tell two players apart.
 *
 * ⚠️ NATIONALITY IS DELIBERATELY ABSENT. `nat` is unreliable on a chunk of the
 * pool — it collapses toward the CLUB's country, so Messi, Vinícius Júnior and
 * James Rodríguez all read "Spain". Birth year separates the two Ronaldos
 * (1976 / 1985 / 1965) without asserting anything false.
 *
 * `club: false` is the Transfer Trail's form, birth year only. There the club
 * under a name is read against the clubs on the board ("David de Gea, 1990 ·
 * Fiorentina" while Fiorentina sits on it: design review, 15 Oct 2026), so the
 * list would play the puzzle for you, and the club is the longest spell, not
 * the career the board is asking about.
 */
export function suggestionSubtitle(p, { club = true } = {}) {
  return [p.born, club ? clubLabel(p) : ''].filter(Boolean).join(' · ');
}

/**
 * The club to print under a player's name, or '' when the pool's `club` is not
 * a senior side he played for.
 *
 * ⚠️ `club` IS "THE LONGEST SINGLE SPELL", AND BOYHOOD IS LONG. The pool
 * builder's latestClub() picks by tenure so that an active player is not
 * labelled with a club he left (see isActive in mysteryPlayer.js). The cost is
 * that nine years in a youth system outlasts five in a first team: Xabi Alonso
 * and Aritz Aduriz both read "Antiguoko", a boys' club in San Sebastián; Álvaro
 * Morata read "Real Madrid Castilla"; Unai Emery "Real Sociedad B". Found from a
 * screen recording of the iPhone app, 2026-10-08.
 *
 * Hidden, not replaced. "The club he is best known for" is an opinion (Alonso:
 * Liverpool, Real Madrid or Real Sociedad?) and the career data cannot settle
 * it, because it has holes of its own: Buffon's seventeen years at Juventus are
 * missing, which is why he reads Parma. Birth year still separates namesakes.
 *
 * ⚠️ NOT THE SCRIPTS' `NON_SENIOR` REGEX. That one decides who may be an ANSWER
 * and errs wide on purpose; printed here it would also blank Willem II (King
 * William II, an Eredivisie club), Académica de Coimbra and Académico de Viseu,
 * and it misses "FC Barcelona Atlètic" altogether.
 *
 * Takes anything with { id, club }: a pool record, or a saved guess row.
 */
const NOT_A_SENIOR_SIDE = [
  /\sCastilla$/,                 // Real Madrid Castilla
  /\sAtlètic$/,                  // FC Barcelona Atlètic
  /\s(B|C|II|III)$/,             // Villarreal CF B, FC Bayern Munich II
  /Reserves and Academy$/,       // Liverpool F.C. Reserves and Academy
  /\b(Youth|Juvenil|Primavera)\b/i,
  /\b(U|Under)-?\d\d\b/i,
  /(^|\s)(wo)?men's soccer$/i,   // US college teams
  /^(Antiguoko|Rayo Cantabria)$/,  // a boys' club; Racing Santander's reserves
  /^no tiene club actual$/,      // a Wikidata value, not a club
];
const SENIOR_DESPITE_THE_NAME = new Set(['Willem II']);

/* Senior-sounding clubs the player only ever represented as a boy. Each pair
   was checked against a source on 2026-10-08; ids, because a guess row saved
   yesterday carries the id and the old label but nothing else. */
const YOUTH_ONLY_AT = new Map([
  ['Q173972', 'AFC DWS'],                          // Ruud Gullit: senior from Haarlem, 1979
  ['Q187125', 'FC Maritsa Plovdiv'],               // Hristo Stoichkov
  ['Q250901', 'Real Zaragoza'],                    // Álvaro Arbeloa: never their first team
  ['Q294951', 'Middelfart Boldklub'],              // Christian Eriksen: left at thirteen
  ['Q4254043', 'K.R.C. Genk'],                     // Divock Origi: senior from Lille
  ['Q192913', 'FC Baník Prievidza'],               // Martin Škrtel
  ['Q57152', 'Bayern Munich'],                     // Thomas Hitzlsperger: juniors only
  ['Q193024', 'FC Sion'],                          // Alexander Frei: in no career list but Wikidata's
  ['Q311372', 'Barcelona'],                        // Albert Luque: youth and the C team
  ['Q2586675', 'Victoria CF'],                     // Lucas Pérez
  ['Q218982', 'CD Banyoles'],                      // Andreu Fontàs
  ['Q10556299', 'FK Hajduk Veljko'],               // Predrag Rajković
  ['Q122971833', 'AFC Creil'],                     // Ayyoub Bouaddi
  ['Q296467', 'HNK Hajduk Split'],                 // Dado Pršo: released at seventeen
  ['Q313143', 'Central University of Venezuela'],  // Juan Arango
]);

export function clubLabel(p) {
  const club = p?.club || '';
  if (!club) return '';
  if (YOUTH_ONLY_AT.get(p.id) === club) return '';
  if (SENIOR_DESPITE_THE_NAME.has(club)) return club;
  return NOT_A_SENIOR_SIDE.some((re) => re.test(club)) ? '' : club;
}
