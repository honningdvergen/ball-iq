// clubPacks.js — every per-club table the app keeps, LAZY.
//
// ⚠️ WHY THIS IS ITS OWN MODULE, LOADED BY import() (2026-10-16). These maps
// sat in src/App.jsx, which is the GameRoot chunk Home blocks on, and each club
// wave added six entries to them: the Home eager JS budget
// (scripts/audit-home-budget.mjs) stood at 902 of 909 KB after wave 3. Home
// does not need any of it to paint. The club finder on Home is below the fold
// and already renders nothing until it has packs; every other reader is a
// screen behind a tap (club picker, Stadiums, Local, Online, Top 10 library)
// or a club round, which cannot start before the bank has loaded.
//
// HOW IT IS REACHED. src/lib/clubData.js owns the one import() of this file:
// App.jsx starts it at boot (in parallel with paint, never blocking it),
// questions-loader.js waits for it before handing out the bank, and it
// registers the Ball IQ card's club routes the moment it lands — so no club
// answer can exist before the card knows which face it feeds. Lazy screens
// may import this file statically: that only adds it to THEIR chunk.
// It must never be imported statically by App.jsx or anything on Home's eager
// path; the budget audit bans the chunk from the eager graph by name.
//
// ⚠️ PLAIN DATA, NO SIDE EFFECTS, NO IMPORTS. Node scripts read it too
// (gen-club-index, gen-seo-pages, add-club, the wave wiring tool), some by
// regex over the literal text: keep each map's `export const NAME = {` opening
// and its closing `};` at column 0, and one CLUB_PACKS entry per key.

// ─── CLUB QUIZ PACKS (Pro feature — starter content) ────────────────────────
// Maps each club-pack key to its canonical `club` value in the question bank, so
// the club quiz serves our fact-checked, hint-bearing QB questions whenever we
// have >=10 for that club — auto-upgrading each club as content is generated —
// and falls back to the pack's starter questions otherwise.
export const CLUB_PACK_TO_QB = {
  Fluminense: "Fluminense",
  Botafogo: "Botafogo",
  Vasco: "Vasco da Gama",
  AtleticoMineiro: "Atlético Mineiro",
  Tigres: "Tigres UANL",
  Monterrey: "Monterrey",
  Pumas: "Pumas UNAM",
  Zamalek: "Zamalek",
  AlAhly: "Al Ahly",
  AlNassr: "Al Nassr",
  AlHilal: "Al Hilal",
  Preston: "Preston North End",
  Millwall: "Millwall",
  Bolton: "Bolton Wanderers",
  Charlton: "Charlton Athletic",
  BristolCity: "Bristol City",
  Lincoln: "Lincoln City",
  Hearts: "Heart of Midlothian",
  Hibernian: "Hibernian",
  Bologna: "Bologna",
  Genoa: "Genoa",
  Lille: "Lille",
  Lens: "RC Lens",
  Koln: "1. FC Köln",
  Espanyol: "Espanyol",
  Rosenborg: "Rosenborg",
  Bodo: "Bodø/Glimt",
  Celta: "Celta Vigo",
  AlIttihad: "Al Ittihad",
  LAGalaxy: "LA Galaxy",
  Copenhagen: "FC Copenhagen",
  Newells: "Newell's Old Boys",
  Braga: "Braga",
  UnionBerlin: "Union Berlin",
  Freiburg: "SC Freiburg",
  Nice: "OGC Nice",
  Rennes: "Rennes",
  CruzAzul: "Cruz Azul",
  Guadalajara: "Guadalajara",
  ClubAmerica: "Club América",
  SanLorenzo: "San Lorenzo",
  Independiente: "Independiente",
  Racing: "Racing Club",
  // ── Wave O (2026-08-23): ten clubs that already had a live /quiz/<slug>/
  // page and 15-20 verified bank rows, but no entry in ANY of these four maps.
  // The landing pages therefore shipped a "Play the full <club> quiz →" button
  // that resolved to nothing and dumped the reader on Home with ?club= already
  // stripped from the URL — 60 dead links across 10 pages, measured against
  // the built output. They were never missing content, only missing wiring.
  // Bank names are the canonical long forms (see club-alias.mjs).
  Birmingham: "Birmingham City", Cardiff: "Cardiff City", Derby: "Derby County",
  Norwich: "Norwich City", Portsmouth: "Portsmouth", SheffWed: "Sheffield Wednesday",
  Middlesbrough: "Middlesbrough", WestBrom: "West Brom", SheffUtd: "Sheffield United", Blackburn: "Blackburn Rovers",
  Watford: "Watford", QPR: "Queens Park Rangers",
  Southampton: "Southampton", Stoke: "Stoke City", Swansea: "Swansea City",
  Wrexham: "Wrexham",
  Leipzig: "RB Leipzig",
  Atalanta: "Atalanta",
  Boca: "Boca Juniors",
  River: "River Plate",
  Flamengo: "Flamengo",
  Palmeiras: "Palmeiras",
  Corinthians: "Corinthians",
  SaoPaulo: "São Paulo", Gremio: "Grêmio", Internacional: "Internacional", Cruzeiro: "Cruzeiro",
  Arsenal: "Arsenal", Liverpool: "Liverpool", ManUtd: "Manchester United", ManCity: "Manchester City",
  Chelsea: "Chelsea", Tottenham: "Tottenham Hotspur", Newcastle: "Newcastle United",
  Barcelona: "Barcelona", RealMadrid: "Real Madrid", BayernMunich: "Bayern Munich",
  Juventus: "Juventus", AcMilan: "AC Milan", Atletico: "Atlético Madrid", Dortmund: "Borussia Dortmund",
  PSG: "Paris Saint-Germain", InterMilan: "Inter Milan", Ajax: "Ajax",
  Napoli: "Napoli", Galatasaray: "Galatasaray", Benfica: "Benfica",
  Fenerbahce: "Fenerbahçe", Porto: "Porto", Roma: "Roma",
  Celtic: "Celtic", Rangers: "Rangers", Marseille: "Marseille",
  Feyenoord: "Feyenoord", PSV: "PSV", Anderlecht: "Anderlecht",
  Besiktas: "Besiktas", Trabzonspor: "Trabzonspor", ClubBrugge: "Club Brugge",
  RedStar: "Red Star Belgrade", DinamoZagreb: "Dinamo Zagreb", Hajduk: "Hajduk Split", Basel: "Basel",
  Forest: "Nottingham Forest", Villa: "Aston Villa", Everton: "Everton",
  Leeds: "Leeds United", WestHam: "West Ham", Leicester: "Leicester City", Olympiacos: "Olympiacos", Panathinaikos: "Panathinaikos",
  Sunderland: "Sunderland", Ipswich: "Ipswich Town", Palace: "Crystal Palace", Fulham: "Fulham", Brighton: "Brighton",
  Bournemouth: "Bournemouth", Brentford: "Brentford", Burnley: "Burnley", Wolves: "Wolves",
  Coventry: "Coventry City", HullCity: "Hull City",
  Athletic: "Athletic Bilbao", Sevilla: "Sevilla", Betis: "Real Betis",
  // Wave N — two at a time from here on, so the curate step actually gets read.
  Santos: "Santos", RealSociedad: "Real Sociedad",
  Schalke: "Schalke 04", Hamburg: "Hamburger SV", Frankfurt: "Eintracht Frankfurt",
  // Wave 1, 16 Oct 2026 (the 4 Oct wave table).
  Villarreal: "Villarreal", Werder: "Werder Bremen", Stuttgart: "VfB Stuttgart",
  Gladbach: "Borussia Mönchengladbach", Aberdeen: "Aberdeen",
  Fiorentina: "Fiorentina", Lazio: "Lazio", Torino: "Torino",
  Sporting: "Sporting CP", SaintEtienne: "Saint-Étienne",
  Valencia: "Valencia", Leverkusen: "Bayer Leverkusen", Lyon: "Olympique Lyonnais",
  Parma: "Parma", Monaco: "AS Monaco",
};

// Club -> COUNTRY, and the order they appear inside it.
//
// ⚠️ ORDER IS DELIBERATE AND LOAD-BEARING. The picker previews only the
// first CLUB_PREVIEW (2) clubs per section, so whatever leads each country is
// effectively the whole section until someone taps "Show all". It used to be
// CLUB_PACKS insertion order, which is why adding ten clubs on 2026-08-23 put
// Birmingham and Cardiff above Arsenal and Liverpool — the newest rows, not
// the ones anyone came looking for. Ordered by who a fan opening this screen
// is most likely to want; adding a club appends rather than displaces.
export const CLUB_LEAGUES = {
  Fluminense: "brazil",
  Botafogo: "brazil",
  Vasco: "brazil",
  AtleticoMineiro: "brazil",
  Tigres: "mexico",
  Monterrey: "mexico",
  Pumas: "mexico",
  Zamalek: "other",
  AlAhly: "other",
  AlNassr: "other",
  AlHilal: "other",
  Preston: "england",
  Millwall: "england",
  Bolton: "england",
  Charlton: "england",
  BristolCity: "england",
  Lincoln: "england",
  Hearts: "scotland",
  Hibernian: "scotland",
  Bologna: "italy",
  Genoa: "italy",
  Lille: "france",
  Lens: "france",
  Koln: "germany",
  Espanyol: "spain",
  Rosenborg: "other",
  Bodo: "other",
  Celta: "spain",
  AlIttihad: "other",
  LAGalaxy: "other",
  Copenhagen: "other",
  Newells: "argentina",
  Braga: "portugal",
  UnionBerlin: "germany",
  Freiburg: "germany",
  Nice: "france",
  Rennes: "france",
  CruzAzul: "mexico",
  Guadalajara: "mexico",
  ClubAmerica: "mexico",
  SanLorenzo: "argentina",
  Independiente: "argentina",
  Racing: "argentina",
  Arsenal: "england", ManUtd: "england", Liverpool: "england", ManCity: "england",
  Chelsea: "england", Tottenham: "england", Newcastle: "england", Everton: "england",
  Villa: "england", WestHam: "england", Forest: "england", Leeds: "england", Leicester: "england",
  // ⚠️ EXPLICIT, not left to fall through. `CLUB_LEAGUES[key] || "other"`
  // at the call site made an entry here look optional — it is not:
  // club-sections.test.js asserts every CLUB_PACKS key has a country, and
  // Greece has no section of its own, so "other" ("More clubs") is the
  // deliberate home, same as Red Star and Basel.
  Olympiacos: "other",
  Panathinaikos: "other",
  Palace: "england", Fulham: "england", Brighton: "england", Bournemouth: "england",
  Brentford: "england", Sunderland: "england", Ipswich: "england", Wolves: "england",
  Burnley: "england", Southampton: "england", Norwich: "england", Derby: "england",
  Middlesbrough: "england", WestBrom: "england", SheffUtd: "england", Blackburn: "england",
  Watford: "england", QPR: "england",
  Stoke: "england", Birmingham: "england", SheffWed: "england", Coventry: "england",
  HullCity: "england", Portsmouth: "england", Cardiff: "england", Swansea: "england",
  Wrexham: "england",
  RealMadrid: "spain", Barcelona: "spain", Atletico: "spain", Sevilla: "spain",
  Valencia: "spain", Athletic: "spain", Betis: "spain", RealSociedad: "spain",
  Juventus: "italy", AcMilan: "italy", InterMilan: "italy", Napoli: "italy",
  Roma: "italy", Lazio: "italy", Atalanta: "italy", Fiorentina: "italy",
  Torino: "italy", Parma: "italy",
  BayernMunich: "germany", Dortmund: "germany", Leverkusen: "germany", Leipzig: "germany",
  Schalke: "germany", Hamburg: "germany", Frankfurt: "germany",
  Werder: "germany", Stuttgart: "germany", Villarreal: "spain", Gladbach: "germany",
  PSG: "france", Marseille: "france", Lyon: "france", Monaco: "france",
  SaintEtienne: "france",
  Benfica: "portugal", Porto: "portugal", Sporting: "portugal",
  Ajax: "netherlands", PSV: "netherlands", Feyenoord: "netherlands",
  Galatasaray: "turkiye", Fenerbahce: "turkiye", Besiktas: "turkiye", Trabzonspor: "turkiye",
  Celtic: "scotland", Rangers: "scotland", Aberdeen: "scotland",
  Anderlecht: "belgium", ClubBrugge: "belgium",
  DinamoZagreb: "croatia", Hajduk: "croatia",
  Flamengo: "brazil", Palmeiras: "brazil", Corinthians: "brazil", Santos: "brazil",
  SaoPaulo: "brazil", Gremio: "brazil", Internacional: "brazil", Cruzeiro: "brazil",
  Boca: "argentina", River: "argentina",
  RedStar: "other", Basel: "other",
};
// ⚠️ THE CARD'S CLUB ROUTES are built from the two tables above by
// src/lib/clubData.js the moment this module loads (see the header).
// Position within a country, from the order above. Unknown keys sort last so a
// club added to CLUB_PACKS but not here still renders instead of vanishing.
export const CLUB_ORDER = Object.fromEntries(Object.values({"england": ["Arsenal", "ManUtd", "Liverpool", "ManCity", "Chelsea", "Tottenham", "Newcastle", "Everton", "Villa", "WestHam", "Forest", "Leeds", "Palace", "Fulham", "Brighton", "Bournemouth", "Brentford", "Sunderland", "Ipswich", "Wolves", "Burnley", "Southampton", "Leicester", "Norwich", "Derby", "Stoke", "Birmingham", "SheffWed", "Coventry", "HullCity", "Portsmouth", "Cardiff", "Swansea", "Wrexham", "Middlesbrough", "WestBrom", "SheffUtd", "Blackburn", "Watford", "QPR", "Millwall", "Preston", "Bolton", "Charlton", "BristolCity", "Lincoln"], "spain": ["RealMadrid", "Barcelona", "Atletico", "Sevilla", "Valencia", "Villarreal", "Athletic", "Betis", "RealSociedad", "Espanyol", "Celta"], "italy": ["Juventus", "AcMilan", "InterMilan", "Napoli", "Roma", "Lazio", "Atalanta", "Fiorentina", "Torino", "Parma", "Bologna", "Genoa"], "germany": ["BayernMunich", "Dortmund", "Leverkusen", "Leipzig", "Frankfurt", "Gladbach", "Stuttgart", "Werder", "Schalke", "Hamburg", "Koln", "UnionBerlin", "Freiburg"], "france": ["PSG", "Marseille", "Lyon", "Monaco", "SaintEtienne", "Lille", "Lens", "Nice", "Rennes"], "portugal": ["Benfica", "Porto", "Sporting", "Braga"], "netherlands": ["Ajax", "PSV", "Feyenoord"], "turkiye": ["Galatasaray", "Fenerbahce", "Besiktas", "Trabzonspor"], "scotland": ["Celtic", "Rangers", "Aberdeen", "Hearts", "Hibernian"], "belgium": ["Anderlecht", "ClubBrugge"], "croatia": ["DinamoZagreb", "Hajduk"], "brazil": ["Flamengo", "Palmeiras", "Corinthians", "Santos", "SaoPaulo", "Gremio", "Internacional", "Cruzeiro", "AtleticoMineiro", "Vasco", "Botafogo", "Fluminense"], "argentina": ["Boca", "River", "Racing", "Independiente", "SanLorenzo", "Newells"], "mexico": ["ClubAmerica", "Guadalajara", "CruzAzul", "Pumas", "Monterrey", "Tigres"], "other": ["RedStar", "Basel", "Olympiacos", "Panathinaikos", "AlHilal", "AlNassr", "AlIttihad", "AlAhly", "Zamalek", "Rosenborg", "Bodo", "Copenhagen", "LAGalaxy"]}).flat().map((k, i) => [k, i]));
export const CLUB_LEAGUE_SECTIONS = [
  // ── SECTIONS ARE COUNTRIES, NOT LEAGUES ────────────────────────────────────
  // Alex, 2026-08-23, on seeing Birmingham and Cardiff heading the Premier
  // League list: "they are not even in the premier league? ... maybe we should
  // categorize by country instead?"
  //
  // Right on both counts. League membership changes every May, so a league
  // label is a fact with an expiry date — which is exactly how this list ended
  // up asserting that Birmingham and Cardiff are Premier League clubs, and why
  // Burnley and Wolves sat under "pl" beneath a comment admitting they are in
  // the Championship. A club's COUNTRY does not change, so these labels cannot
  // rot and never need re-verifying against a season we cannot see.
  //
  // ⚠️ TWO CLUBS DO NOT PLAY IN THEIR OWN COUNTRY'S LEAGUE, and pretending
  // otherwise would trade one wrong label for another:
  //   · Cardiff, Swansea and Wrexham are WELSH clubs in the English pyramid —
  //     hence "England & Wales" rather than "England". Calling Wrexham English
  //     is exactly the kind of error this change exists to stop.
  //   · Monaco is Monégasque, not French. It sits under France because it
  //     plays in Ligue 1 and every fan discusses it as a Ligue 1 club; the
  //     alternative is a section of one, which serves nobody.
  { key: "england", label: "England & Wales" },
  { key: "spain", label: "Spain" },
  { key: "italy", label: "Italy" },
  { key: "germany", label: "Germany" },
  { key: "france", label: "France" },
  { key: "portugal", label: "Portugal" },
  { key: "netherlands", label: "Netherlands" },
  { key: "turkiye", label: "Türkiye" },
  { key: "scotland", label: "Scotland" },
  { key: "belgium", label: "Belgium" },
  { key: "croatia", label: "Croatia" },
  { key: "brazil", label: "Brazil" },
  { key: "argentina", label: "Argentina" },
  { key: "mexico", label: "Mexico" },
  // Same 2+ rule the old list used: a country gets a section once it has two
  // clubs. Red Star (Serbia) and Basel (Switzerland) are still singletons.
  { key: "other", label: "More clubs" },
];

// Broadcast/club-recognised short codes for the row swatches (MUN, FCB, BVB, …),
// not raw initials. Falls back to clubInitials() for any unmapped key.
export const CLUB_ABBR = {
  Fluminense: "FLU",
  Botafogo: "BOT",
  Vasco: "VAS",
  AtleticoMineiro: "CAM",
  Tigres: "TIG",
  Monterrey: "MTY",
  Pumas: "PUM",
  Zamalek: "ZAM",
  AlAhly: "AHL",
  AlNassr: "NAS",
  AlHilal: "HIL",
  Preston: "PNE",
  Millwall: "MIL",
  Bolton: "BOL",
  Charlton: "CHA",
  BristolCity: "BRC",
  Lincoln: "LIN",
  Hearts: "HEA",
  Hibernian: "HIB",
  Bologna: "BLG",
  Genoa: "GEN",
  Lille: "LIL",
  Lens: "LEN",
  Koln: "KOE",
  Espanyol: "ESP",
  Rosenborg: "ROS",
  Bodo: "BOD",
  Celta: "CLV",
  AlIttihad: "ITT",
  LAGalaxy: "LAG",
  Copenhagen: "FCK",
  Newells: "NOB",
  Braga: "SCB",
  UnionBerlin: "UNB",
  Freiburg: "SCF",
  Nice: "NIC",
  Rennes: "REN",
  CruzAzul: "CAZ",
  Guadalajara: "GDL",
  ClubAmerica: "AME",
  SanLorenzo: "SLO",
  Independiente: "IND",
  Racing: "RAC",
  Leipzig: "RBL",
  Atalanta: "ATA",
  Boca: "BOC",
  River: "RIV",
  Flamengo: "FLA",
  Palmeiras: "PAL",
  Corinthians: "COR",
  Santos: "SAN", RealSociedad: "RSO",
  // SCI, not INT — Inter Milan already holds INT, and this map has no duplicates.
  SaoPaulo: "SAO", Gremio: "GRE", Internacional: "SCI", Cruzeiro: "CRU",
  Arsenal: "ARS", Liverpool: "LIV", ManUtd: "MUN", ManCity: "MCI", Chelsea: "CHE", Tottenham: "TOT", Newcastle: "NEW",
  Barcelona: "FCB", RealMadrid: "RMA", Atletico: "ATM",
  Juventus: "JUV", AcMilan: "ACM", InterMilan: "INT",
  BayernMunich: "BAY", Dortmund: "BVB", Frankfurt: "SGE",
  Werder: "SVW", Stuttgart: "VFB", Villarreal: "VIL", Gladbach: "BMG", Aberdeen: "ABE",
  PSG: "PSG", Ajax: "AJA",
  Napoli: "NAP", Galatasaray: "GAL", Benfica: "SLB",
  Fenerbahce: "FEN", Porto: "POR", Roma: "ROM",
  Celtic: "CEL", Rangers: "RAN", Marseille: "OM",
  Feyenoord: "FEY", PSV: "PSV", Anderlecht: "RSCA",
  Besiktas: "BJK", Trabzonspor: "TS", ClubBrugge: "CLU",
  RedStar: "CZ", DinamoZagreb: "DIN", Hajduk: "HAJ", Basel: "BAS",
  Forest: "NFO", Villa: "AVL", Everton: "EVE", Leeds: "LEE", WestHam: "WHU", Leicester: "LEI", Olympiacos: "OLY", Panathinaikos: "PAO",
  Sunderland: "SUN", Ipswich: "IPS", Palace: "CRY", Fulham: "FUL", Brighton: "BHA",
  Middlesbrough: "MID", WestBrom: "WBA", SheffUtd: "SHU", Blackburn: "BLA",
  Watford: "WAT", QPR: "QPR",
  Bournemouth: "BOU", Brentford: "BRE", Burnley: "BUR", Wolves: "WOL",
  Coventry: "COV", HullCity: "HUL",
  Athletic: "ATH", Sevilla: "SEV", Betis: "BET", Schalke: "S04", Hamburg: "HSV",
  Fiorentina: "FIO", Lazio: "LAZ", Torino: "TOR", Sporting: "SCP", SaintEtienne: "ASSE",
  Valencia: "VAL", Leverkusen: "B04", Lyon: "OL", Parma: "PAR", Monaco: "ASM",
};

// SEO deep-links: /play?club=<slug> and /play?quiz=<league-slug> land a
// searcher IN the quiz they Googled (the club/league landing pages' CTAs emit
// these — see scripts/gen-seo-pages.mjs ctaBlock). Slugs match scripts/seo.
export const CLUB_SLUG_TO_PACK = {
  "fluminense": "Fluminense",
  "botafogo": "Botafogo",
  "vasco-da-gama": "Vasco",
  "atletico-mineiro": "AtleticoMineiro",
  "tigres-uanl": "Tigres",
  "monterrey": "Monterrey",
  "pumas-unam": "Pumas",
  "zamalek": "Zamalek",
  "al-ahly": "AlAhly",
  "al-nassr": "AlNassr",
  "al-hilal": "AlHilal",
  "preston-north-end": "Preston",
  "millwall": "Millwall",
  "bolton-wanderers": "Bolton",
  "charlton-athletic": "Charlton",
  "bristol-city": "BristolCity",
  "lincoln-city": "Lincoln",
  "hearts": "Hearts",
  "hibernian": "Hibernian",
  "bologna": "Bologna",
  "genoa": "Genoa",
  "lille": "Lille",
  "rc-lens": "Lens",
  "fc-koln": "Koln",
  "espanyol": "Espanyol",
  "rosenborg": "Rosenborg",
  "bodo-glimt": "Bodo",
  "celta-vigo": "Celta",
  "al-ittihad": "AlIttihad",
  "la-galaxy": "LAGalaxy",
  "fc-copenhagen": "Copenhagen",
  "newells-old-boys": "Newells",
  "braga": "Braga",
  "union-berlin": "UnionBerlin",
  "sc-freiburg": "Freiburg",
  "ogc-nice": "Nice",
  "rennes": "Rennes",
  "cruz-azul": "CruzAzul",
  "chivas": "Guadalajara",
  "club-america": "ClubAmerica",
  "san-lorenzo": "SanLorenzo",
  "independiente": "Independiente",
  "racing-club": "Racing",
  // Wave O — the ten slugs whose landing pages linked here and found nothing.
  "birmingham-city": "Birmingham", "cardiff-city": "Cardiff",
  "derby-county": "Derby", "norwich-city": "Norwich", "portsmouth": "Portsmouth",
  "middlesbrough": "Middlesbrough", "west-brom": "WestBrom", "sheffield-united": "SheffUtd", "blackburn-rovers": "Blackburn",
  "watford": "Watford", "queens-park-rangers": "QPR", "eintracht-frankfurt": "Frankfurt",
  "villarreal": "Villarreal", "werder-bremen": "Werder", "vfb-stuttgart": "Stuttgart",
  "borussia-monchengladbach": "Gladbach", "aberdeen": "Aberdeen",
  "sheffield-wednesday": "SheffWed", "southampton": "Southampton",
  "stoke-city": "Stoke", "swansea-city": "Swansea", "wrexham": "Wrexham",
  "rb-leipzig": "Leipzig",
  "atalanta": "Atalanta",
  "boca-juniors": "Boca",
  "river-plate": "River",
  "flamengo": "Flamengo",
  "palmeiras": "Palmeiras",
  "corinthians": "Corinthians",
  "santos": "Santos", "real-sociedad": "RealSociedad",
  "sao-paulo": "SaoPaulo", "gremio": "Gremio", "internacional": "Internacional", "cruzeiro": "Cruzeiro",
  "arsenal": "Arsenal", "liverpool": "Liverpool", "manchester-united": "ManUtd",
  "manchester-city": "ManCity", "chelsea": "Chelsea", "tottenham": "Tottenham",
  "newcastle": "Newcastle", "barcelona": "Barcelona", "real-madrid": "RealMadrid",
  "atletico-madrid": "Atletico", "bayern-munich": "BayernMunich",
  "borussia-dortmund": "Dortmund", "psg": "PSG", "inter-milan": "InterMilan",
  "juventus": "Juventus", "ac-milan": "AcMilan", "ajax": "Ajax",
  "napoli": "Napoli", "galatasaray": "Galatasaray", "benfica": "Benfica",
  "fenerbahce": "Fenerbahce", "porto": "Porto", "roma": "Roma",
  "celtic": "Celtic", "rangers": "Rangers", "marseille": "Marseille",
  "feyenoord": "Feyenoord", "psv": "PSV", "anderlecht": "Anderlecht",
  "besiktas": "Besiktas", "trabzonspor": "Trabzonspor", "club-brugge": "ClubBrugge",
  "red-star-belgrade": "RedStar", "dinamo-zagreb": "DinamoZagreb", "hajduk-split": "Hajduk", "basel": "Basel",
  "nottingham-forest": "Forest", "aston-villa": "Villa", "everton": "Everton",
  "leeds-united": "Leeds", "west-ham": "WestHam", "leicester-city": "Leicester", "olympiacos": "Olympiacos", "panathinaikos": "Panathinaikos",
  "sunderland": "Sunderland", "ipswich": "Ipswich", "crystal-palace": "Palace", "fulham": "Fulham", "brighton": "Brighton",
  "bournemouth": "Bournemouth", "brentford": "Brentford", "burnley": "Burnley", "wolves": "Wolves",
  "coventry": "Coventry", "hull-city": "HullCity",
  "athletic-bilbao": "Athletic", "sevilla": "Sevilla", "real-betis": "Betis",
  "schalke-04": "Schalke", "hamburger-sv": "Hamburg",
  "fiorentina": "Fiorentina", "lazio": "Lazio", "torino": "Torino",
  "sporting-cp": "Sporting", "saint-etienne": "SaintEtienne",
  "valencia": "Valencia", "bayer-leverkusen": "Leverkusen", "lyon": "Lyon",
  "parma": "Parma", "monaco": "Monaco",
};
// Reverse maps for share deep-links (opportunity-scan #1): a club/league quiz
// result should link the recipient back into THAT quiz (/play?club=… /
// ?quiz=…), not the marketing homepage — the boot routing above already
// handles these params; shares just never used them.
export const PACK_TO_CLUB_SLUG = Object.fromEntries(Object.entries(CLUB_SLUG_TO_PACK).map(([s, k]) => [k, s]));

export const CLUB_PACKS = {
  Fluminense: {
    name: "Fluminense", icon: "🟥", color: "#92062A",
    questions: [],
  },
  Botafogo: {
    name: "Botafogo", icon: "⭐", color: "#000000",
    questions: [],
  },
  Vasco: {
    name: "Vasco da Gama", icon: "⚓", color: "#000000",
    questions: [],
  },
  AtleticoMineiro: {
    name: "Atlético Mineiro", icon: "🐓", color: "#000000",
    questions: [],
  },
  Tigres: {
    name: "Tigres UANL", icon: "🐯", color: "#FBAF35",
    questions: [],
  },
  Monterrey: {
    name: "Monterrey", icon: "⛰️", color: "#0B2341",
    questions: [],
  },
  Pumas: {
    name: "Pumas UNAM", icon: "🐾", color: "#132347",
    questions: [],
  },
  Zamalek: {
    name: "Zamalek", icon: "🏹", color: "#D41D27",
    questions: [],
  },
  AlAhly: {
    name: "Al Ahly", icon: "🦅", color: "#D5001A",
    questions: [],
  },
  AlNassr: {
    name: "Al Nassr", icon: "🟡", color: "#FEDC00",
    questions: [],
  },
  AlHilal: {
    name: "Al Hilal", icon: "🌙", color: "#0028F0",
    questions: [],
  },
  Bolton: { name: "Bolton Wanderers", icon: "⚪", color: "#E6E6E6", questions: [] },
  Charlton: { name: "Charlton Athletic", icon: "🔴", color: "#E31B23", questions: [] },
  BristolCity: { name: "Bristol City", icon: "🐦", color: "#E21A23", questions: [] },
  Lincoln: { name: "Lincoln City", icon: "🔴", color: "#D92C2C", questions: [] },
  Hearts: { name: "Heart of Midlothian", icon: "🟤", color: "#7A1F35", questions: [] },
  Hibernian: { name: "Hibernian", icon: "🟢", color: "#007A3D", questions: [] },
  Bologna: { name: "Bologna", icon: "🔴", color: "#A21C26", questions: [] },
  Genoa: { name: "Genoa", icon: "🔴", color: "#B5121B", questions: [] },
  Lille: { name: "Lille", icon: "🔴", color: "#E01E13", questions: [] },
  Lens: { name: "RC Lens", icon: "🟡", color: "#F2C200", questions: [] },
  Koln: { name: "1. FC Köln", icon: "🔴", color: "#ED1C24", questions: [] },
  Espanyol: { name: "Espanyol", icon: "🔵", color: "#007FC8", questions: [] },
  Rosenborg: { name: "Rosenborg", icon: "⚫", color: "#1A1A1A", questions: [] },
  Bodo: { name: "Bodø/Glimt", icon: "🟡", color: "#F5C400", questions: [] },
  Celta: { name: "Celta Vigo", icon: "🔵", color: "#8AC3EE", questions: [] },
  AlIttihad: { name: "Al Ittihad", icon: "🟡", color: "#E8B500", questions: [] },
  LAGalaxy: { name: "LA Galaxy", icon: "🔵", color: "#00245D", questions: [] },
  Copenhagen: { name: "FC Copenhagen", icon: "🔵", color: "#1C3F94", questions: [] },
  Newells: { name: "Newell's Old Boys", icon: "🔴", color: "#D7141A", questions: [] },
  Braga: { name: "Braga", icon: "🔴", color: "#E30613", questions: [] },
  UnionBerlin: { name: "Union Berlin", icon: "🔴", color: "#EB1923", questions: [] },
  Freiburg: { name: "SC Freiburg", icon: "🔴", color: "#D40F1F", questions: [] },
  Nice: { name: "OGC Nice", icon: "🔴", color: "#C8102E", questions: [] },
  Rennes: { name: "Rennes", icon: "🔴", color: "#E30613", questions: [] },
  Preston: {
    name: "Preston North End", icon: "⚪", color: "#E9EEF5",
    questions: [],
  },
  Millwall: {
    name: "Millwall", icon: "🦁", color: "#003D7C",
    questions: [],
  },
  CruzAzul: {
    name: "Cruz Azul", icon: "🔵", color: "#212452",
    questions: [],
  },
  Guadalajara: {
    name: "Chivas", icon: "🔴", color: "#CD1731",
    questions: [],
  },
  ClubAmerica: {
    name: "Club América", icon: "🟡", color: "#FFEB00",
    questions: [],
  },
  SanLorenzo: {
    name: "San Lorenzo", icon: "🔵", color: "#3D63C9",
    questions: [],
  },
  Independiente: {
    name: "Independiente", icon: "🔴", color: "#DA291C",
    questions: [],
  },
  Racing: {
    name: "Racing Club", icon: "🔵", color: "#6CAFE0",
    questions: [],
  },
  Leipzig: {
    name: "RB Leipzig", icon: "🐂", color: "#DD0741",
    questions: [],
  },
  Atalanta: {
    name: "Atalanta", icon: "⚫", color: "#1D71B8",
    questions: [],
  },
  Boca: {
    name: "Boca Juniors", icon: "🔵", color: "#0A2B72",
    questions: [],
  },
  River: {
    name: "River Plate", icon: "⚪", color: "#E1122E",
    questions: [],
  },
  Flamengo: {
    name: "Flamengo", icon: "🔴", color: "#C52613",
    questions: [],
  },
  SaoPaulo: {
    name: "São Paulo", icon: "🔴", color: "#FE0000",
    questions: [],
  },
  Gremio: {
    name: "Grêmio", icon: "🔵", color: "#0D80BF",
    questions: [],
  },
  Internacional: {
    name: "Internacional", icon: "🔴", color: "#E5050F",
    questions: [],
  },
  Cruzeiro: {
    name: "Cruzeiro", icon: "🔵", color: "#2F529E",
    questions: [],
  },
  Palmeiras: {
    name: "Palmeiras", icon: "🟢", color: "#006437",
    questions: [],
  },
  Corinthians: {
    name: "Corinthians", icon: "⬛", color: "#111111",
    questions: [],
  },
  Santos: {
    name: "Santos", icon: "⚪", color: "#0B0B0B",
    questions: [],
  },
  RealSociedad: {
    name: "Real Sociedad", icon: "🔵", color: "#0067B1",
    questions: [],
  },
  Arsenal: {
    name: "Arsenal", icon: "🔴", color: "#EF0107",
    questions: [],
  },
  Liverpool: {
    name: "Liverpool", icon: "🔴", color: "#C8102E",
    questions: [],
  },
  ManUtd: {
    name: "Man United", icon: "🔴", color: "#DA291C",
    questions: [],
  },
  Barcelona: {
    name: "Barcelona", icon: "🔵", color: "#A50044",
    questions: [],
  },
  RealMadrid: {
    name: "Real Madrid", icon: "⚪", color: "#FFFFFF",
    questions: [],
  },

  ManCity: {
    name: "Man City", icon: "🔵", color: "#6CABDD",
    questions: [],
  },
  Chelsea: {
    name: "Chelsea", icon: "🔵", color: "#034694",
    questions: [],
  },
  BayernMunich: {
    name: "Bayern Munich", icon: "🔴", color: "#DC052D",
    questions: [],
  },
  Juventus: {
    name: "Juventus", icon: "⚫", color: "#000000",
    questions: [],
  },
  AcMilan: {
    name: "AC Milan", icon: "🔴", color: "#FB090B",
    questions: [],
  },
  Atletico: {
    name: "Atletico Madrid", icon: "🔴", color: "#CB3524",
    questions: [],
  },
  Frankfurt:   { name: "Eintracht Frankfurt",  icon: "🦅", color: "#E1000F", questions: [] },
  Villarreal:  { name: "Villarreal",           icon: "🟡", color: "#F2D53C", questions: [] },
  Werder:      { name: "Werder Bremen",        icon: "💚", color: "#1D9053", questions: [] },
  Stuttgart:   { name: "VfB Stuttgart",        icon: "🦌", color: "#E32219", questions: [] },
  Gladbach:    { name: "Borussia Mönchengladbach", icon: "🐴", color: "#18A05A", questions: [] },
  Aberdeen:    { name: "Aberdeen",             icon: "🔴", color: "#D0021B", questions: [] },
  Dortmund: {
    name: "Borussia Dortmund", icon: "🟡", color: "#FDE100",
    questions: [],
  },
  PSG: {
    name: "Paris Saint-Germain", icon: "🔵", color: "#003170",
    questions: [],
  },
  InterMilan: {
    name: "Inter Milan", icon: "⚫", color: "#010E80",
    questions: [],
  },
  Ajax: {
    name: "Ajax", icon: "🔴", color: "#CC0000",
    questions: [],
  },
  Tottenham: {
    name: "Tottenham", icon: "⚪", color: "#132257",
    questions: [],
  },
  Newcastle: {
    name: "Newcastle", icon: "⚫", color: "#241F20",
    questions: [],
  },
  Napoli: {
    name: "Napoli", icon: "🔵", color: "#12A0D7",
    questions: [],
  },
  Galatasaray: {
    name: "Galatasaray", icon: "🟡", color: "#A90432",
    questions: [],
  },
  Benfica: {
    name: "Benfica", icon: "🔴", color: "#E32221",
    questions: [],
  },
  Fenerbahce: {
    name: "Fenerbahçe", icon: "🟡", color: "#163962",
    questions: [],
  },
  Porto: {
    name: "Porto", icon: "🔵", color: "#00428C",
    questions: [],
  },
  Roma: {
    name: "Roma", icon: "🔴", color: "#8E1F2F",
    questions: [],
  },
  Celtic: {
    name: "Celtic", icon: "🍀", color: "#018749",
    questions: [],
  },
  Rangers: {
    name: "Rangers", icon: "🔵", color: "#1B458F",
    questions: [],
  },
  Marseille: {
    name: "Marseille", icon: "⚪", color: "#2FAEE0",
    questions: [],
  },
  Feyenoord: {
    name: "Feyenoord", icon: "🔴", color: "#DA020E",
    questions: [],
  },
  PSV: {
    name: "PSV", icon: "🔴", color: "#ED1C24",
    questions: [],
  },
  Anderlecht: {
    name: "Anderlecht", icon: "🟣", color: "#52247F",
    questions: [],
  },
  Besiktas: {
    name: "Beşiktaş", icon: "🦅", color: "#000000",
    questions: [],
  },
  Trabzonspor: {
    name: "Trabzonspor", icon: "🌊", color: "#7B1E3C",
    questions: [],
  },
  ClubBrugge: {
    name: "Club Brugge", icon: "🔵", color: "#0A4595",
    questions: [],
  },
  RedStar: {
    name: "Red Star Belgrade", icon: "⭐", color: "#E4002B",
    questions: [],
  },
  DinamoZagreb: {
    name: "Dinamo Zagreb", icon: "🔵", color: "#1B458F",
    questions: [],
  },
  Hajduk: {
    name: "Hajduk Split", icon: "⚪", color: "#0E4C92",
    questions: [],
  },
  Basel: {
    name: "Basel", icon: "🔴", color: "#002D62",
    questions: [],
  },
  Forest: {
    name: "Nottingham Forest", icon: "🌳", color: "#E53233",
    questions: [],
  },
  Villa: {
    name: "Aston Villa", icon: "🦁", color: "#670E36",
    questions: [],
  },
  Everton: {
    name: "Everton", icon: "🔵", color: "#003399",
    questions: [],
  },
  Leeds: {
    name: "Leeds United", icon: "⚪", color: "#1D428A",
    questions: [],
  },
  Leicester: {
    name: "Leicester City", icon: "🦊", color: "#003090",
    questions: [],
  },
  Olympiacos: {
    name: "Olympiacos", icon: "🔴", color: "#DA020E",
    questions: [],
  },
  // 🍀 is the trifylli, the three-leaf clover on the badge since 1918 —
  // the club's own nickname, not a decorative pick.
  Panathinaikos: {
    name: "Panathinaikos", icon: "🍀", color: "#00614E",
    questions: [],
  },
  WestHam: {
    name: "West Ham", icon: "⚒️", color: "#7A263A",
    questions: [],
  },
  Sunderland: {
    name: "Sunderland", icon: "🔴", color: "#EB172B",
    questions: [],
  },
  Ipswich: {
    name: "Ipswich Town", icon: "🔵", color: "#3A64A3",
    questions: [],
  },
  Palace: {
    name: "Crystal Palace", icon: "🦅", color: "#1B458F",
    questions: [],
  },
  Fulham: {
    name: "Fulham", icon: "⚪", color: "#E6E6E6",
    questions: [],
  },
  Brighton: {
    name: "Brighton", icon: "🔵", color: "#0057B8",
    questions: [],
  },
  Bournemouth: {
    name: "Bournemouth", icon: "🍒", color: "#DA291C",
    questions: [],
  },
  Brentford: {
    name: "Brentford", icon: "🐝", color: "#E30613",
    questions: [],
  },
  Burnley: {
    name: "Burnley", icon: "🟣", color: "#6C1D45",
    questions: [],
  },
  Wolves: {
    name: "Wolves", icon: "🐺", color: "#FDB913",
    questions: [],
  },
  Coventry: {
    name: "Coventry City", icon: "🐘", color: "#059DD9",
    questions: [],
  },
  HullCity: {
    name: "Hull City", icon: "🐯", color: "#F18A01",
    questions: [],
  },
  Athletic: {
    name: "Athletic Bilbao", icon: "🦁", color: "#EE2523",
    questions: [],
  },
  Sevilla: {
    name: "Sevilla", icon: "🔴", color: "#CB0007",
    questions: [],
  },
  Betis: {
    name: "Real Betis", icon: "🟢", color: "#00954C",
    questions: [],
  },
  Schalke: {
    name: "Schalke 04", icon: "🔵", color: "#004E9E",
    questions: [],
  },
  Hamburg: {
    name: "Hamburger SV", icon: "⬦", color: "#0A3A7A",
    questions: [],
  },
  Fiorentina: {
    name: "Fiorentina", icon: "🟣", color: "#592C82",
    questions: [],
  },
  Lazio: {
    name: "Lazio", icon: "🦅", color: "#87D8F7",
    questions: [],
  },
  Torino: {
    name: "Torino", icon: "🐂", color: "#8A1E12",
    questions: [],
  },
  Sporting: {
    name: "Sporting CP", icon: "🦁", color: "#008056",
    questions: [],
  },
  SaintEtienne: {
    name: "Saint-Étienne", icon: "🟢", color: "#009E60",
    questions: [],
  },
  Valencia: {
    name: "Valencia", icon: "🦇", color: "#F18E00",
    questions: [],
  },
  Leverkusen: {
    name: "Bayer Leverkusen", icon: "🔴", color: "#E32221",
    questions: [],
  },
  Lyon: {
    name: "Olympique Lyonnais", icon: "🦁", color: "#3D74C4",
    questions: [],
  },
  Parma: {
    name: "Parma", icon: "🟡", color: "#F5D800",
    questions: [],
  },
  Monaco: {
    name: "AS Monaco", icon: "🔺", color: "#DA291C",
    questions: [],
  },
  // draw prefers the verified, hint-bearing QB rows via CLUB_PACK_TO_QB and
  // only falls back to this array. Each of these clears the 10 medium+hard
  // floor the club draw needs (thinnest is Sheffield Wednesday at 11).
  Birmingham:  { name: "Birmingham City",     icon: "🔵", color: "#253896", questions: [] },
  Cardiff:     { name: "Cardiff City",        icon: "🐦", color: "#0070B5", questions: [] },
  Derby:       { name: "Derby County",        icon: "🐏", color: "#1B1B1B", questions: [] },
  Norwich:     { name: "Norwich City",        icon: "🐤", color: "#00A650", questions: [] },
  Middlesbrough: { name: "Middlesbrough",     icon: "🔴", color: "#DC143C", questions: [] },
  WestBrom:    { name: "West Brom",          icon: "🔵", color: "#122F67", questions: [] },
  SheffUtd:    { name: "Sheffield United",   icon: "⚔️", color: "#EE2737", questions: [] },
  Blackburn:   { name: "Blackburn Rovers",   icon: "🔷", color: "#009EE0", questions: [] },
  Watford:     { name: "Watford",             icon: "🐝", color: "#F2E23A", questions: [] },
  QPR:         { name: "Queens Park Rangers", icon: "⭕", color: "#1D5BA4", questions: [] },
  Portsmouth:  { name: "Portsmouth",          icon: "⚓", color: "#001489", questions: [] },
  SheffWed:    { name: "Sheffield Wednesday", icon: "🦉", color: "#0066B3", questions: [] },
  Southampton: { name: "Southampton",         icon: "⛵", color: "#D71920", questions: [] },
  Stoke:       { name: "Stoke City",          icon: "🔴", color: "#E03A3E", questions: [] },
  Swansea:     { name: "Swansea City",        icon: "🦢", color: "#121212", questions: [] },
  Wrexham:     { name: "Wrexham",             icon: "🐐", color: "#DA291C", questions: [] },
};

// What a fan actually types. CLUB_COLOUR_ALIASES already covers the transfer
// shorthand (spurs, bvb, man utd, atletico…) because the Trail needed the same
// normalisation, so it is reused rather than duplicated — these are only the
// terrace nicknames it lacks. Search-only: never rendered, so a wrong-ish entry
// costs nothing but a stray match.
export const CLUB_SEARCH_NICKNAMES = {
  gunners: "Arsenal", reds: "Liverpool", toffees: "Everton", citizens: "Man City",
  "red devils": "Man United", devils: "Man United", blues: "Chelsea",
  barca: "Barcelona", barça: "Barcelona", madrid: "Real Madrid", juve: "Juventus",
  nerazzurri: "Inter", rossoneri: "AC Milan", gers: "Rangers", hoops: "Celtic",
  magpies: "Newcastle", hammers: "West Ham", villans: "Aston Villa",
  bianconeri: "Juventus", merengues: "Real Madrid", cityzens: "Man City",
  lilywhites: "Tottenham", potters: "Stoke City", baggies: "West Brom",
};
