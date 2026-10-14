// Mystery Player — reading a player's CAREER out of mysteryCareers.json.
//
// The rebuild of 14 Oct 2026 leans on careers for three things the old screen
// did without: the reason printed under every guess ("Shared Juventus"), the
// club clue, and the career shown on the reveal. All three print club names as
// facts, so every name goes through here and nowhere else.
//
// THE FILE: { c: [club name, …], p: { playerId: [[clubIndex, from, to], …] } }
// with `to` null for a spell still running and `from` null where Wikidata has
// no start date.
//
// ⚠️ THE NAMES ARE WIKIDATA LABELS, NOT WHAT A FAN SAYS. "Real Madrid Club de
// Fútbol", "AFC Ajax", "S.L. Benfica", and some clubs twice under two labels
// ("AC Milan" and "A.C. Milan", "FC Bayern Munich" and "FC Bayern München").
// clubName() turns a label into the name a fan uses, and the same name is the
// KEY two careers are compared on, so the two Milans count as one club.
//
// ⚠️ YOUTH AND RESERVE SIDES ARE LEFT OUT of all three uses. "Shared FC
// Barcelona Juvenil A" is not a reason anyone recognises, a boyhood club is
// not "a club he played for" in a clue, and the reveal is a senior career.

// Labels whose fan name is not just the label with its letters taken off.
const NAMES = {
  // Names a fan says (verifier, 14 Oct 2026). "Los Angeles FC" lost its "FC" to
  // the tail rule and read like LA Galaxy.
  'Los Angeles FC': 'LAFC',
  'Montpellier Hérault Sport Club': 'Montpellier',
  'Grenoble Foot 38': 'Grenoble',
  'U.F.C.I. Tomar': 'União de Tomar',
  'Al Ahli SC (Doha)': 'Al Ahli Doha',
  'Stade Brestois 29': 'Brest',
  'SD Eibar': 'Eibar',
  'Al Jazira Club': 'Al Jazira',
  'K.R.C. Genk': 'Genk',
  'Real Madrid Club de Fútbol': 'Real Madrid',
  'FC Barcelona': 'Barcelona',
  'FC Bayern Munich': 'Bayern Munich',
  'FC Bayern München': 'Bayern Munich',
  'A.C. Milan': 'AC Milan',
  'AC Milan': 'AC Milan',
  'Inter Milan': 'Inter Milan',
  'AS Roma': 'Roma',
  'A.S. Roma': 'Roma',
  'SSC Napoli': 'Napoli',
  'SS Lazio': 'Lazio',
  'S.L. Benfica': 'Benfica',
  'AFC Ajax': 'Ajax',
  'Paris Saint-Germain FC': 'Paris Saint-Germain',
  'Olympique de Marseille': 'Marseille',
  'Olympique Lyonnais': 'Lyon',
  'AS Monaco FC': 'Monaco',
  'FC Girondins de Bordeaux': 'Bordeaux',
  'ACF Fiorentina': 'Fiorentina',
  'Parma Calcio 1913': 'Parma',
  'U.C. Sampdoria': 'Sampdoria',
  'Genoa CFC': 'Genoa',
  'Bologna F.C. 1909': 'Bologna',
  'Atalanta BC': 'Atalanta',
  'Udinese Calcio': 'Udinese',
  'Cagliari Calcio': 'Cagliari',
  'Brescia Calcio': 'Brescia',
  'Hellas Verona FC': 'Hellas Verona',
  'AS Reggina 1914': 'Reggina',
  'Tottenham Hotspur F.C.': 'Tottenham',
  'Brighton & Hove Albion F.C.': 'Brighton',
  'Wolverhampton Wanderers F.C.': 'Wolves',
  'Bayer 04 Leverkusen': 'Bayer Leverkusen',
  'TSG 1899 Hoffenheim': 'Hoffenheim',
  'SV Werder Bremen': 'Werder Bremen',
  'Real Betis Balompié': 'Real Betis',
  'RCD Espanyol de Barcelona': 'Espanyol',
  'Deportivo de A Coruña': 'Deportivo La Coruña',
  'RC Celta de Vigo': 'Celta Vigo',
  'R.S.C. Anderlecht': 'Anderlecht',
  'Feyenoord Rotterdam': 'Feyenoord',
  'PSV Eindhoven': 'PSV',
  'Club Brugge K.V.': 'Club Brugge',
  'FK Crvena zvezda': 'Red Star Belgrade',
  'GNK Dinamo Zagreb': 'Dinamo Zagreb',
  'FC Dynamo Kyiv': 'Dynamo Kyiv',
  'FC Shakhtar Donetsk': 'Shakhtar Donetsk',
  'FC Zenit Saint Petersburg': 'Zenit',
  'PFC CSKA Moscow': 'CSKA Moscow',
  'Galatasaray S.K.': 'Galatasaray',
  'Fenerbahçe Istanbul': 'Fenerbahçe',
  'Beşiktaş J.K. (Football)': 'Beşiktaş',
  'Olympiacos F.C.': 'Olympiacos',
  'Clube de Regatas do Flamengo': 'Flamengo',
  'S.C. Corinthians Paulista': 'Corinthians',
  'Sociedade Esportiva Palmeiras': 'Palmeiras',
  'Santos F.C.': 'Santos',
  'Santos FC': 'Santos',
  'Grêmio FBPA': 'Grêmio',
  'CR Vasco da Gama': 'Vasco da Gama',
  'S.C. Internacional': 'Internacional',
  'Clube Atlético Mineiro': 'Atlético Mineiro',
  'Club Atlético River Plate': 'River Plate',
  'Club Atlético Peñarol': 'Peñarol',
  'Club Nacional de Football': 'Nacional',
  'Al Hilal SFC': 'Al Hilal',
  'Red Bull New York': 'New York Red Bulls',
  'FC Red Bull Salzburg': 'Red Bull Salzburg',
  'Inter Miami CF': 'Inter Miami',
  'Sporting CP': 'Sporting CP',
  'Celtic F.C.': 'Celtic',
  'Rangers F.C.': 'Rangers',
  'Athletic Club': 'Athletic Bilbao',
  'RC Strasbourg Alsace': 'Strasbourg',
  'Club de Fútbol Monterrey': 'Monterrey',
  'Club Social y Deportivo Colo Colo': 'Colo-Colo',
  'Club Deportivo Universidad Católica': 'Universidad Católica',
  'Club Athletico Paranaense': 'Athletico Paranaense',
  'Al Sadd Sports Club': 'Al Sadd',
  'Shabab AlAhli Dubai Club': 'Shabab Al Ahli',
  'En Avant de Guingamp': 'Guingamp',
  'Club Sport Emelec': 'Emelec',
  'İstanbul Başakşehir F.K.': 'İstanbul Başakşehir',
  'Le Havre AC': 'Le Havre',
  'Lille OSC': 'Lille',
  'OGC Nice': 'Nice',
  'Stade Rennais F.C.': 'Rennes',
  // The letters are part of the name a fan says.
  'Karlsruher SC': 'Karlsruher SC',
  'FC Tokyo': 'FC Tokyo',
  'FC Seoul': 'FC Seoul',
  'Yokohama FC': 'Yokohama FC',
  'Sydney FC': 'Sydney FC',
  'Toronto FC': 'Toronto FC',
};

// Club-type letters a fan never says. Only taken off the END, or the FRONT
// when a real name is left behind ("SC Freiburg" -> "Freiburg"); "AC Milan",
// "VfB Stuttgart" and "1. FC Köln" are spoken with theirs and keep them.
const TAIL = /\s+(F\.?\s?C\.?|A\.?F\.?C\.?|C\.?F\.?|S\.?C\.?|F\.?K\.?|CFC|SFC|FBPA|E\.?C\.?|S\.?K\.?|K\.?V\.?|BC|Calcio|\(Football\)|\d{4})$/;
const HEAD = /^(FC|F\.C\.|FK|NK|HŠK|AFC|AC|A\.C\.|AS|A\.S\.|SS|S\.S\.|SSC|US|U\.S\.|CD|C\.D\.|RCD|SL|S\.L\.|SC|S\.C\.|RC|CA|Club Atlético)\s+/;

/** The name a fan uses for a club label. Pure; safe on anything. */
export function clubName(label) {
  const raw = String(label || '').trim();
  if (!raw) return '';
  if (Object.hasOwn(NAMES, raw)) return NAMES[raw];
  let s = raw;
  for (let i = 0; i < 3; i++) {
    const next = s.replace(TAIL, '').trim();
    if (next === s || next.length < 3) break;
    s = next;
  }
  const front = s.replace(HEAD, '');
  if (front !== s && front.length >= 4 && !/^\d/.test(front)) s = front;
  return s;
}

/* Sides that are not a senior first team. Wider than playerSearch's list on
   purpose: this decides what a clue or a reveal may PRINT, so it errs towards
   leaving a side out. */
const NOT_SENIOR = [
  /\sCastilla$/, /\sAtl[eè]tic$/, /\sMestalla$/, /\s(B|C|II|III)$/, /^Jong\s/,
  /Reserves/i, /\b(Youth|Juvenil|Primavera|Academy|Development|Next Gen)\b/i,
  /\b(U|Under)-?\d\d\b/i, /soccer$/i,
];
// A label that is a CITY, not a club (Q1492 "Barcelona"): it once filed Edwin
// van der Sar's Ajax years under it. Never printed, never shared. Plus the
// boys' clubs playerSearch.js already hides (Xabi Alonso's Antiguoko, nine
// years from the age of nine, would otherwise be his "main club").
const NOT_A_CLUB = new Set(['Barcelona', 'no tiene club actual', 'Antiguoko', 'Rayo Cantabria']);

export function isSeniorClub(label) {
  const raw = String(label || '');
  // A bare Wikidata id ("Q8343694") is a club the export never labelled.
  if (!raw || NOT_A_CLUB.has(raw) || /^Q\d+$/.test(raw)) return false;
  return !NOT_SENIOR.some((re) => re.test(raw));
}

// Club index -> fan name, or '' for a side we never print or compare. Worked
// out once per careers object: rankPool asks for it nine thousand times.
const KEYS = new WeakMap();
function clubKeys(careers) {
  let k = KEYS.get(careers);
  if (!k) {
    k = careers.c.map((label) => (isSeniorClub(label) ? clubName(label) : ''));
    KEYS.set(careers, k);
  }
  return k;
}

export const NOW_YEAR = 2026;

/**
 * The generated careers with the checked corrections laid over them
 * (src/data/mysteryCareerFixes.json). ⚠️ Wikidata drops or misdates whole
 * spells: Zlatan without his first AC Milan, Cruyff without his return to
 * Ajax, Salah's Roma ending a year early (verifier, 14 Oct 2026). A corrected
 * career replaces the generated one for everything that reads careers, so the
 * reveal, the clues and the reasons under a guess agree. Returns a new object;
 * the input is not changed.
 */
export function withCareerFixes(careers, fixes) {
  if (!careers || !fixes) return careers;
  const c = [...careers.c];
  const index = new Map(c.map((label, i) => [label, i]));
  const at = (label) => { if (!index.has(label)) { index.set(label, c.length); c.push(label); } return index.get(label); };
  const p = { ...careers.p };
  for (const [id, spells] of Object.entries(fixes)) {
    if (!Array.isArray(spells)) continue;
    p[id] = spells.map(([label, from, to]) => [at(label), from, to]);
  }
  return { c, p };
}

/**
 * A player's senior career, oldest first: [{ club, from, to }], `to` null
 * while it runs, `from` null where the start is unknown.
 *
 * ⚠️ BOYHOOD SPELLS ARE DROPPED BY AGE TOO, not only by name. Wikidata files
 * youth years under the senior club's own label: Totti's Trastevere spell
 * starts at nine, Messi's Newell's at eight. A spell that ends before the
 * player turned seventeen is a boy's.
 */
export function careerOf(player, careers) {
  const spells = player && careers?.p?.[player.id];
  if (!spells || !spells.length) return [];
  const keys = clubKeys(careers);
  const born = player.born || null;
  const out = [];
  for (const [i, from, to] of spells) {
    const club = keys[i];
    if (!club) continue;
    if (born && to != null && to < born + 17) continue;
    // Joined as a child, gone by nineteen: a boyhood club, whatever its name.
    if (born && from != null && to != null && from < born + 15 && to <= born + 19) continue;
    if (from == null && to == null) continue;
    out.push({ club, from: from ?? null, to: to ?? null });
  }
  out.sort((a, b) => (a.from ?? a.to ?? 0) - (b.from ?? b.to ?? 0) || (a.to ?? NOW_YEAR) - (b.to ?? NOW_YEAR));
  return out;
}

/**
 * Clubs as a Map: fan name -> { years, spells }. `years` sums every spell at
 * that club, so two stints count together.
 */
export function clubsOf(player, careers) {
  const m = new Map();
  for (const sp of careerOf(player, careers)) {
    const yrs = sp.from == null ? 0 : Math.max(0, (sp.to ?? NOW_YEAR) - sp.from);
    const cur = m.get(sp.club) || { years: 0, spells: [] };
    cur.years += yrs;
    cur.spells.push(sp);
    m.set(sp.club, cur);
  }
  return m;
}

/**
 * The club he gave the most years to, for the club clue.
 *
 * ⚠️ YEARS, NOT APPEARANCES. The careers file holds no appearance counts, so
 * "the club where he made most appearances" is approximated by the longest
 * total time there.
 *
 * ⚠️ WITHIN A YEAR OF THE LONGEST, THE BETTER-KNOWN CLUB WINS. Year counts are
 * coarse, and a near-tie went the wrong way often enough to matter: Cantona
 * five years at Auxerre and five at Manchester United, Keylor Navas five at
 * Saprissa and five at Real Madrid, and Arturo Vidal's Juventus beaten by a
 * Universidad de Chile spell that is a Wikidata error (2007-11 were his
 * Leverkusen years). "Better known" is how many players in the file have
 * played there, which is a fair proxy for how many people have heard of it.
 */
export function mainClub(player, careers) {
  const clubs = [...clubsOf(player, careers)];
  if (!clubs.length) return null;
  const longest = Math.max(...clubs.map(([, c]) => c.years));
  const size = clubSizes(careers);
  const near = clubs.filter(([, c]) => c.years >= longest - 1);
  near.sort((a, b) => (size.get(b[0]) || 0) - (size.get(a[0]) || 0) || b[1].years - a[1].years || a[0].localeCompare(b[0]));
  return near[0][0];
}

// Fan name -> how many players in the file have a spell there.
const SIZES = new WeakMap();
function clubSizes(careers) {
  let m = SIZES.get(careers);
  if (!m) {
    m = new Map();
    const keys = clubKeys(careers);
    for (const spells of Object.values(careers.p)) {
      const seen = new Set();
      for (const [i] of spells) if (keys[i] && !seen.has(keys[i])) { seen.add(keys[i]); m.set(keys[i], (m.get(keys[i]) || 0) + 1); }
    }
    SIZES.set(careers, m);
  }
  return m;
}

/** Years two spells overlapped. Unknown starts never overlap. */
export function overlapYears(a, b) {
  if (a.from == null || b.from == null) return 0;
  return Math.max(0, Math.min(a.to ?? NOW_YEAR, b.to ?? NOW_YEAR) - Math.max(a.from, b.from));
}

/**
 * Clubs both played for, best link first: [{ club, together }], where
 * `together` is the most years any two of their spells there overlapped.
 */
export function sharedClubs(a, b, careers, aClubs = null) {
  const mine = aClubs || clubsOf(a, careers);
  const theirs = clubsOf(b, careers);
  const out = [];
  for (const [club, t] of theirs) {
    const m = mine.get(club);
    if (!m) continue;
    let together = 0;
    for (const x of m.spells) for (const y of t.spells) together = Math.max(together, overlapYears(x, y));
    out.push({ club, together, years: m.years });
  }
  out.sort((x, y) => (y.together - x.together) || (y.years - x.years) || x.club.localeCompare(y.club));
  return out;
}

/** "2001–2006", "2023–now", "–2012" (start unknown), "1999" (one season). */
export function spellYears({ from, to }) {
  if (from == null) return to == null ? '' : `until ${to}`;
  if (to == null) return `${from}–now`;
  return to === from ? String(from) : `${from}–${to}`;
}

/** "Z. Z.", or for a one-name player "R." — the third clue. */
export function initials(name) {
  return String(name || '')
    .split(/[\s-]+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .map((w) => `${w[0]}.`)
    .join(' ');
}
