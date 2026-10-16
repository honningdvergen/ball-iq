// One place that answers "what colour is this club?".
//
// WHY THIS EXISTS. Transfer Trail names clubs the way a transfer story does —
// "Man Utd", "Dortmund", "Monaco" — while the quiz packs name them formally:
// "Man United", "Borussia Dortmund", "AS Monaco". A first pass at colouring the
// Trail ladder reported only 34% coverage and flagged MAN UTD as having no
// colour, which is obviously wrong and was the tell: the data was there under a
// different string. Same trap as the club-page title aliases.
//
// So: normalise, alias, then look up — and never guess. A club with no known
// colour gets a neutral chip rather than a hashed one, because a football
// audience notices Everton rendered in red instantly, and a wrong colour is
// worse than no colour.

// Trail/transfer shorthand -> the name the pack data uses.
const ALIASES = {
  "man utd": "Man United",
  "man u": "Man United",
  "manchester united": "Man United",
  "manchester city": "Man City",
  "dortmund": "Borussia Dortmund",
  "bvb": "Borussia Dortmund",
  "monaco": "AS Monaco",
  "spurs": "Tottenham",
  "tottenham hotspur": "Tottenham",
  "inter milan": "Inter",
  "internazionale": "Inter",
  "atletico madrid": "Atlético Madrid",
  "atletico": "Atlético Madrid",
  "athletic bilbao": "Athletic Club",
  "bayern": "Bayern Munich",
  "bayern münchen": "Bayern Munich",
  "psv eindhoven": "PSV",
  "sporting cp": "Sporting",
  "sporting lisbon": "Sporting",
  "newcastle united": "Newcastle",
  "wolverhampton": "Wolves",
  "leeds united": "Leeds",
  "west ham united": "West Ham",
  "brighton & hove albion": "Brighton",
  // Trail #26 rendered three grey chips out of four and prompted a full sweep:
  // 74 of 181 career clubs resolved to nothing. These aliases route career
  // spellings to clubs that already have colours; new colours live in EXTRA.
  "leverkusen": "Bayer Leverkusen",
  "vfl wolfsburg": "Wolfsburg",
  "jong psv": "PSV",
  "jong ajax": "Ajax",
  "sheffield united": "Sheffield Utd",
};

// Clubs that appear in careers but have no quiz pack, so no colour came with
// them. Only clubs whose colours are unambiguous are listed — anything I would
// have to guess at is deliberately left out to fall through to neutral.
const EXTRA = {
  "PSG": "#004170",
  "Southampton": "#D71920",
  "Santos": "#111111",
  "Malaga": "#0067B1",
  "Feyenoord": "#C4002B",
  "Ajax": "#D2122E",
  "Juventus": "#111111",
  "Sevilla": "#D81920",
  "Valencia": "#F5811F",
  "Real Sociedad": "#0067B1",
  "Fiorentina": "#592C82",
  "Lazio": "#87D8F7",
  "Roma": "#8E1F2F",
  "Napoli": "#12A0D7",
  "Werder Bremen": "#1D9053",
  "Schalke 04": "#004D9D",
  "Bayer Leverkusen": "#E32219",
  "Eintracht Frankfurt": "#E1000F",
  "Marseille": "#2FAEE0",
  "Lyon": "#1B2C56",
  "Lille": "#E01E13",
  "Nantes": "#FCD800",
  "Celta Vigo": "#8AC3EE",
  "Independiente": "#D62027",
  "Gremio": "#0D80BF",
  "São Paulo": "#FE0000",
  "Cruzeiro": "#2F529E",
  "Botafogo": "#111111",
  "Panathinaikos": "#00614E",
  "Galatasaray": "#E1362C",
  "Fenerbahce": "#1B2A6B",
  "Al-Nassr": "#F7D708",
  "Al-Hilal": "#0B4EA2",
  "Blackburn": "#009EE0",
  "Everton": "#003399",
  "Aston Villa": "#670E36",
  "Stoke City": "#D81920",
  "Derby County": "#111111",
  "Crystal Palace": "#1B458F",
  "LA Galaxy": "#00245D",
  "LAFC": "#C39E6D",
  "DC United": "#111111",
  "New York Red Bulls": "#ED1E36",
  "Parma": "#FDD100",
  "Sampdoria": "#1B4C97",
  "Cannes": "#C8102E",
  "Metz": "#8E1F2F",
  "Red Bull Salzburg": "#D50032",
  "Groningen": "#009B48",
  "Kaiserslautern": "#E30613",
  "Como": "#0057B8",
  "Antwerp": "#C8102E",
  "Inter": "#0068A8",
  "Leicester": "#003090",
  "Hamburg": "#1D3C7C",
  "Nice": "#C8102E",
  "Getafe": "#005CA9",
  "Sparta Prague": "#8B1A1A",
  "Rennes": "#E23237",
  "Troyes": "#005BAC",
  "Caen": "#0B1A3C",
  "Eibar": "#0B4EA2",
  "Inter Miami": "#F7B5CD",
  "Melbourne City": "#7BB2DD",
  "Shamrock Rovers": "#00843D",
  "Atletico Mineiro": "#111111",
  "Basaksehir": "#F26522",
  // Gilberto Silva's trail (#2) opens América Mineiro → Atlético Mineiro. Two
  // genuinely different Belo Horizonte clubs, but with América missing here it
  // resolved to null and rendered as an uncoloured row directly above Atlético's
  // near-black one — so a real transfer read as the same club listed twice.
  // América-MG ("Coelho") play in green and white.
  "America Mineiro": "#0B7A3B",
  "Dinamo Zagreb": "#1B458F",
  "Hajduk Split": "#0E4C92",
  "Celtic": "#018749",
  "Genk": "#005EB8",
  "Wolfsburg": "#65B32E",
  "Olympiacos": "#DA020E",
  // ── Trail-career sweep, 2026-08-28 ────────────────────────────────────────
  // Only long-settled, unambiguous club identities; ~10 genuinely obscure ones
  // (Chmel Blsany, Inter Zaprešić, Al-Gharafa, the fictional Nankatsu SC…)
  // deliberately stay neutral per the rule above.
  "VfB Stuttgart": "#E32219",
  "Vissel Kobe": "#A6093D",
  "Albirex Niigata": "#F08300",
  "Union Berlin": "#EB1923",
  "1. FC Köln": "#ED1C24",
  "Hoffenheim": "#1961B5",
  "Mainz 05": "#C3141E",
  "Hannover 96": "#D01317",
  "1. FC Nürnberg": "#AD1732",
  "1860 Munich": "#5FA8DC",
  "Borussia Mönchengladbach": "#1C9E5A",
  "RB Salzburg": "#DD0741",
  "Chemnitzer FC": "#5FA8DC",
  "Rot Weiss Ahlen": "#D2232A",
  "Homburg": "#0B7A3B",
  "Udinese": "#111111",
  "Palermo": "#EE87B4",
  "Cesena": "#111111",
  "Novara": "#5FA8DC",
  "Pescara": "#5FA8DC",
  "Espanyol": "#0067B1",
  "Girona": "#CD2534",
  "Tenerife": "#0B4EA2",
  "Leganés": "#0067B1",
  "Deportivo": "#005CA9",
  "Sheffield Utd": "#EE2737",
  "Millwall": "#003D7C",
  "Leyton Orient": "#D2232A",
  "Barnsley": "#C8102E",
  "Wigan Athletic": "#005CA9",
  "Reading": "#004494",
  "Sunderland": "#EB172B",
  "Norwich City": "#FFF200",
  "Peñarol": "#FDB913",
  "Internacional": "#E5050F",
  "Figueirense": "#111111",
  "Instituto": "#D2232A",
  "Monterrey": "#0B2341",
  "San Jose Earthquakes": "#0067B1",
  "Orlando City": "#61259E",
  "Chicago Fire": "#A32035",
  "Toulouse": "#5F4B8B",
  "Charleroi": "#111111",
  "Lech Poznan": "#005CA9",
  "AIK": "#111111",
  "AEK Athens": "#F6C500",
  "FC Tokyo": "#22366B",
  "Cerezo Osaka": "#E5006D",
  "Gamba Osaka": "#0B1F62",
  "Kashima Antlers": "#9E0B39",
  "Nagoya Grampus": "#DC0A20",
  "Urawa Red Diamonds": "#E60012",
  "Kashiwa Reysol": "#FFD400",
  "Consadole Sapporo": "#C8102E",
  "Júbilo Iwata": "#6CA9DC",
  "Sagan Tosu": "#1CA5DC",
  "VVV-Venlo": "#F6C500",
  "RKC Waalwijk": "#F2C500",
  "Al-Ittihad": "#F6C500",
  "Al-Ahli": "#0B7A3B",
  "Al Ahli": "#0B7A3B",
  "Al Sadd": "#111111",
  "Al-Arabi": "#C8102E",
  "Al Duhail": "#C8102E",
  "Al-Duhail": "#C8102E",

  // ── grid harvest, added 2026-09-15 ───────────────────────────────────────
  // Six clubs that rendered with NO colour on the football-grid headers. They
  // live here rather than in grid-club-colours.mjs on purpose: that map is
  // gated by a build check that fails on any key which matched no club, and the
  // grid's club set rotates DAILY — five of these six were in the window on
  // 09-13 and none of the six was in it on 09-15, so a correct key there goes
  // red on the wrong day. These are ordinary club colours anyway, so the app's
  // shared table is the right home and Transfer Trail gets them too.
  //
  // Keyed on the exact career-dictionary spelling: "Portuguesa" alone would
  // subset-match Associação Atlética Portuguesa and Portuguesa FC as well, and
  // colouring three different clubs from one entry is the wrong-colour failure
  // the grid's exactly-one rule exists to prevent.
  // Each settled by two independent passes, each citing a page it fetched.
  "AC ChievoVerona": "#FFF500",                    // crest yellow; it.wikipedia colori "Giallo, blu"
  "Clube Atlético Mineiro": "#1F1A17",             // crest black, atletico.com.br SVG; gold is a crest accent
  "Fluminense F.C.": "#6E182C",                    // grená; club declares theme-color #6e182c over the green
  "Vicenza Calcio": "#E30613",                     // the club's own .rosso; red is the identifying stripe
  "Coritiba F.C.": "#015842",                      // crest green; --primary in the club's own theme document
  "Associação Portuguesa de Desportos": "#E31E27", // crest red; "Rubro-Verde" names red first
};

const key = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/**
 * @param {string} club                    club name as the career data spells it
 * @param {Record<string,string>} packMap  {displayName: hex} from the quiz packs
 * @returns {string|null} hex, or null when unknown — callers render neutral
 */
export function clubColour(club, packMap = {}) {
  if (!club) return null;
  const direct = packMap[club] || EXTRA[club];
  if (direct) return direct;

  const aliased = ALIASES[key(club)];
  if (aliased && (packMap[aliased] || EXTRA[aliased])) return packMap[aliased] || EXTRA[aliased];

  // last resort: accent-insensitive match against both tables
  const k = key(club);
  for (const [name, hex] of [...Object.entries(packMap), ...Object.entries(EXTRA)]) {
    if (key(name) === k) return hex;
  }
  return null;
}

// ── Abbreviations ────────────────────────────────────────────────────────────
// CLUB_ABBR already holds proper 3-letter codes (LIV, CHE, MUN, RMA, ATM, BVB)
// but is keyed by PACK id — "ManUtd", "RealMadrid", "AcMilan" — while careers
// carry display names. First preview computed initials instead and rendered
// Liverpool as "L" and Chelsea as "C". The codes existed; the lookup did not.
const squash = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

// Clubs with no pack of their own whose derived letters collide with a bigger
// club's. Keyed by the squashed name.
const ABBR_FIXED = {
  borussiamgladbach: "BMG",
  borussiamonchengladbach: "BMG",
  monchengladbach: "BMG",
  // Pairs that sat in the SAME Transfer Trail career with the same letters.
  spartaksubotica: "SUB",
  chemnitzerfc: "CHM",
  jongpsv: "JPS",
  jongajax: "JAJ",
};

/**
 * A 3-letter badge for a club. Prefers the curated CLUB_ABBR code, then the
 * alias, then a derived form — never a single letter.
 * @param {string} club
 * @param {Record<string,string>} abbrMap  CLUB_ABBR, keyed by pack id
 */
export function clubAbbr(club, abbrMap = {}) {
  if (!club) return "--";
  const want = squash(club);
  // Explicit letters win: some of these names are aliased to a parent club for
  // COLOUR (Jong PSV wears PSV red), and would take the parent's letters too.
  if (ABBR_FIXED[want]) return ABBR_FIXED[want];
  for (const [k, v] of Object.entries(abbrMap)) if (squash(k) === want) return v;

  const aliased = ALIASES[key(club)];
  if (aliased) {
    const a = squash(aliased);
    for (const [k, v] of Object.entries(abbrMap)) if (squash(k) === a) return v;
  }

  // The other direction (2026-10-08). The packs key Dortmund as "Dortmund"
  // (BVB) but a career names it "Borussia Dortmund", and the alias table only
  // runs short -> formal, so the formal name fell through to the derived
  // letters. In the simulator one Transfer Trail showed "Borussia M.gladbach"
  // and "Borussia Dortmund" one above the other, both as "BOR".
  for (const [alias, formal] of Object.entries(ALIASES)) {
    if (squash(formal) !== want) continue;
    const a = squash(alias);
    for (const [k, v] of Object.entries(abbrMap)) if (squash(k) === a) return v;
  }

  // Derived fallback. Three letters, always — "L" for Liverpool is what this
  // exists to prevent. Multi-word names take initials only when that yields
  // three (Red Bull Salzburg -> RBS); otherwise the first three letters of the
  // squashed name (Sagan Tosu -> SAG, Feyenoord -> FEY).
  const words = String(club).trim().split(/\s+/).filter(Boolean);
  if (words.length >= 3) return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
  return want.slice(0, 3).toUpperCase() || "--";
}

export const CLUB_COLOUR_ALIASES = ALIASES;
export const CLUB_COLOUR_EXTRA = EXTRA;

// ── Rendering a club colour ──────────────────────────────────────────────────
// These three lived inside TransferTrail.jsx. Stadiums needs the identical
// treatment, and a second copy of a colour-maths helper is precisely how two
// screens drift into rendering the same club two different shades. Moved here
// so there is one answer to "what colour is this club" AND one answer to "how
// do I paint it".

// CLUB_PACKS carries { name, color }; this is the shape clubColour() wants.
export function packColourMap(packs) {
  return Object.fromEntries(
    Object.values(packs || {}).map((p) => [p?.name, p?.color]).filter(([n, c]) => n && c)
  );
}


// The painting maths lives in colourMath.js (dependency-free, so Home can
// import it without these tables); re-exported so this stays the one door.
export { tint, lift, onColour, contrast, inkOn } from './colourMath.js';
