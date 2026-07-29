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

/**
 * A 3-letter badge for a club. Prefers the curated CLUB_ABBR code, then the
 * alias, then a derived form — never a single letter.
 * @param {string} club
 * @param {Record<string,string>} abbrMap  CLUB_ABBR, keyed by pack id
 */
export function clubAbbr(club, abbrMap = {}) {
  if (!club) return "--";
  const want = squash(club);
  for (const [k, v] of Object.entries(abbrMap)) if (squash(k) === want) return v;

  const aliased = ALIASES[key(club)];
  if (aliased) {
    const a = squash(aliased);
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
