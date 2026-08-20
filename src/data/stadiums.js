// Stadiums mode data — name every ground in a league (Sporcle-style
// completion run, NOT a daily: no frozen schedule needed, the set only
// changes once a season at promotion/relegation).
//
// ⚠️ SEASON-PINNED DATA. This is the 2026-27 Premier League, verified
// 2026-08-20 against premierleague.com's AGM announcement, the Wikipedia
// season page and NBC's season guide (all agree): Coventry, Ipswich and
// Hull came up; West Ham, Burnley and Wolves went down. Refresh every
// summer alongside the trail-careers verification — a stadium list one
// season stale is the "Van Persie twice in a week" of this mode.
//
// `stadium` is the DISPLAY name — the name fans actually use (sponsor
// names where that is what everyone says: Etihad, Vitality, Gtech, Amex).
// `accept` lists every normalized form that counts as correct, including
// traditional names (Dean Court, Falmer, City of Manchester) and recent
// former sponsors (Ricoh, KCOM). Normalization strips case, diacritics
// and punctuation — see normalizeStadiumGuess below — so accept entries
// are written pre-normalized: lowercase, letters/digits/spaces only.
// Old grounds a club has LEFT are deliberately absent (no White Hart
// Lane, no Goodison Park): accepting them would teach a stale fact.

export const STADIUM_LEAGUES = [
  {
    id: "premier-league",
    name: "Premier League",
    season: "2026-27",
    clubs: [
      { club: "Arsenal",            stadium: "Emirates Stadium",           accept: ["emirates", "emirates stadium", "the emirates", "ashburton grove"] },
      { club: "Aston Villa",        stadium: "Villa Park",                 accept: ["villa park"] },
      { club: "Bournemouth",        stadium: "Vitality Stadium",           accept: ["vitality", "vitality stadium", "dean court"] },
      { club: "Brentford",          stadium: "Gtech Community Stadium",    accept: ["gtech", "gtech community stadium", "gtech stadium", "brentford community stadium"] },
      { club: "Brighton",           stadium: "Amex Stadium",               accept: ["amex", "the amex", "amex stadium", "american express stadium", "american express community stadium", "falmer", "falmer stadium"] },
      { club: "Chelsea",            stadium: "Stamford Bridge",            accept: ["stamford bridge", "the bridge"] },
      { club: "Coventry City",      stadium: "Coventry Building Society Arena", accept: ["coventry building society arena", "cbs arena", "the cbs arena", "ricoh", "ricoh arena"] },
      { club: "Crystal Palace",     stadium: "Selhurst Park",              accept: ["selhurst park", "selhurst"] },
      { club: "Everton",            stadium: "Hill Dickinson Stadium",     accept: ["hill dickinson", "hill dickinson stadium", "everton stadium", "bramley moore", "bramley moore dock", "bramley moore dock stadium"] },
      { club: "Fulham",             stadium: "Craven Cottage",             accept: ["craven cottage", "the cottage"] },
      { club: "Hull City",          stadium: "MKM Stadium",                accept: ["mkm", "mkm stadium", "kcom", "kcom stadium", "kc stadium"] },
      { club: "Ipswich Town",       stadium: "Portman Road",               accept: ["portman road"] },
      { club: "Leeds United",       stadium: "Elland Road",                accept: ["elland road"] },
      { club: "Liverpool",          stadium: "Anfield",                    accept: ["anfield"] },
      { club: "Man City",           stadium: "Etihad Stadium",             accept: ["etihad", "etihad stadium", "the etihad", "city of manchester stadium", "eastlands"] },
      { club: "Man United",         stadium: "Old Trafford",               accept: ["old trafford"] },
      { club: "Newcastle",          stadium: "St James' Park",             accept: ["st james park", "st james", "saint james park", "st james s park"] },
      { club: "Nottingham Forest",  stadium: "City Ground",                accept: ["city ground", "the city ground"] },
      { club: "Sunderland",         stadium: "Stadium of Light",           accept: ["stadium of light", "the stadium of light"] },
      { club: "Tottenham",          stadium: "Tottenham Hotspur Stadium",  accept: ["tottenham hotspur stadium", "spurs stadium", "tottenham stadium", "new white hart lane"] },
    ],
  },
  // ⚠️ 2026-27 memberships verified 2026-08-20 against each league's
  // Wikipedia season page; venue traps cross-checked against 2025-26 fixture
  // data (Betis at La Cartuja during the Villamarin rebuild, Espanyol's RCDE,
  // Reale Arena, Coliseum). Shared grounds (San Siro, Stadio Olimpico) are
  // two rows with the SAME display name — the matcher fills the first
  // unsolved one, so typing it twice completes both; the tests carve out
  // exactly these pairs from the uniqueness rules.
  {
    id: "la-liga",
    name: "La Liga",
    season: "2026-27",
    clubs: [
      { club: "Alavés",             stadium: "Mendizorroza",            accept: ["mendizorroza", "mendizorrotza", "estadio de mendizorroza"] },
      { club: "Athletic Club",      stadium: "San Mamés",               accept: ["san mames", "la catedral"] },
      { club: "Atlético Madrid",    stadium: "Metropolitano",           accept: ["metropolitano", "civitas metropolitano", "riyadh air metropolitano", "wanda metropolitano", "estadio metropolitano"] },
      { club: "Barcelona",          stadium: "Camp Nou",                accept: ["camp nou", "spotify camp nou", "nou camp"] },
      { club: "Celta Vigo",         stadium: "Balaídos",                accept: ["balaidos", "abanca balaidos", "estadio de balaidos"] },
      { club: "Deportivo",          stadium: "Riazor",                  accept: ["riazor", "estadio de riazor", "abanca riazor"] },
      { club: "Elche",              stadium: "Martínez Valero",         accept: ["martinez valero", "estadio martinez valero", "manuel martinez valero"] },
      { club: "Espanyol",           stadium: "RCDE Stadium",            accept: ["rcde stadium", "rcde", "stage front stadium", "cornella el prat", "cornella"] },
      { club: "Getafe",             stadium: "Coliseum",                accept: ["coliseum", "estadio coliseum", "coliseum alfonso perez"] },
      { club: "Levante",            stadium: "Ciutat de València",      accept: ["ciutat de valencia", "estadi ciutat de valencia", "ciudad de valencia"] },
      { club: "Málaga",             stadium: "La Rosaleda",             accept: ["la rosaleda", "rosaleda", "estadio la rosaleda"] },
      { club: "Osasuna",            stadium: "El Sadar",                accept: ["el sadar", "sadar", "estadio el sadar"] },
      { club: "Racing Santander",   stadium: "El Sardinero",            accept: ["el sardinero", "sardinero", "campos de sport de el sardinero"] },
      { club: "Rayo Vallecano",     stadium: "Vallecas",                accept: ["vallecas", "estadio de vallecas", "campo de futbol de vallecas"] },
      { club: "Real Betis",         stadium: "La Cartuja",              accept: ["la cartuja", "cartuja", "estadio de la cartuja"] },
      { club: "Real Madrid",        stadium: "Santiago Bernabéu",       accept: ["santiago bernabeu", "bernabeu", "the bernabeu", "estadio santiago bernabeu"] },
      { club: "Real Sociedad",      stadium: "Reale Arena",             accept: ["reale arena", "anoeta", "estadio anoeta"] },
      { club: "Sevilla",            stadium: "Ramón Sánchez-Pizjuán",   accept: ["ramon sanchez pizjuan", "sanchez pizjuan", "pizjuan", "estadio ramon sanchez pizjuan"] },
      { club: "Valencia",           stadium: "Mestalla",                accept: ["mestalla", "estadio de mestalla"] },
      { club: "Villarreal",         stadium: "La Cerámica",             accept: ["la ceramica", "estadio de la ceramica", "el madrigal", "madrigal"] },
    ],
  },
  {
    id: "serie-a",
    name: "Serie A",
    season: "2026-27",
    clubs: [
      { club: "Atalanta",       stadium: "Gewiss Stadium",             accept: ["gewiss stadium", "gewiss", "atleti azzurri d italia"] },
      { club: "Bologna",        stadium: "Renato Dall'Ara",            accept: ["renato dall ara", "dall ara", "stadio renato dall ara"] },
      { club: "Cagliari",       stadium: "Unipol Domus",               accept: ["unipol domus", "sardegna arena"] },
      { club: "Como",           stadium: "Giuseppe Sinigaglia",        accept: ["giuseppe sinigaglia", "sinigaglia", "stadio sinigaglia"] },
      { club: "Fiorentina",     stadium: "Artemio Franchi",            accept: ["artemio franchi", "franchi", "stadio artemio franchi"] },
      { club: "Frosinone",      stadium: "Benito Stirpe",              accept: ["benito stirpe", "stirpe", "stadio benito stirpe"] },
      { club: "Genoa",          stadium: "Luigi Ferraris",             accept: ["luigi ferraris", "ferraris", "marassi", "stadio luigi ferraris"] },
      { club: "Inter",          stadium: "San Siro",                   accept: ["san siro", "giuseppe meazza", "meazza", "stadio giuseppe meazza"], shared: "san-siro" },
      { club: "Juventus",       stadium: "Allianz Stadium",            accept: ["allianz stadium", "juventus stadium", "the allianz"] },
      { club: "Lazio",          stadium: "Stadio Olimpico",            accept: ["stadio olimpico", "olimpico", "olympic stadium rome"], shared: "olimpico" },
      { club: "Lecce",          stadium: "Via del Mare",               accept: ["via del mare", "stadio via del mare", "ettore giardiniero"] },
      { club: "AC Milan",       stadium: "San Siro",                   accept: ["san siro", "giuseppe meazza", "meazza", "stadio giuseppe meazza"], shared: "san-siro" },
      { club: "Monza",          stadium: "U-Power Stadium",            accept: ["u power stadium", "u power", "brianteo", "stadio brianteo"] },
      { club: "Napoli",         stadium: "Diego Armando Maradona",     accept: ["diego armando maradona", "maradona", "stadio maradona", "san paolo"] },
      { club: "Parma",          stadium: "Ennio Tardini",              accept: ["ennio tardini", "tardini", "stadio ennio tardini"] },
      { club: "Roma",           stadium: "Stadio Olimpico",            accept: ["stadio olimpico", "olimpico", "olympic stadium rome"], shared: "olimpico" },
      { club: "Sassuolo",       stadium: "Mapei Stadium",              accept: ["mapei stadium", "mapei", "citta del tricolore"] },
      { club: "Torino",         stadium: "Olimpico Grande Torino",     accept: ["olimpico grande torino", "grande torino", "stadio olimpico grande torino"] },
      { club: "Udinese",        stadium: "Bluenergy Stadium",          accept: ["bluenergy stadium", "bluenergy", "friuli", "stadio friuli", "dacia arena"] },
      { club: "Venezia",        stadium: "Pier Luigi Penzo",           accept: ["pier luigi penzo", "penzo", "stadio penzo"] },
    ],
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    season: "2026-27",
    clubs: [
      { club: "Augsburg",           stadium: "WWK Arena",              accept: ["wwk arena", "wwk", "impuls arena", "augsburg arena"] },
      { club: "Union Berlin",       stadium: "Alte Försterei",         accept: ["alte forsterei", "stadion an der alten forsterei", "an der alten forsterei"] },
      { club: "Werder Bremen",      stadium: "Weserstadion",           accept: ["weserstadion", "weser stadion", "wohninvest weserstadion"] },
      { club: "Dortmund",           stadium: "Signal Iduna Park",      accept: ["signal iduna park", "signal iduna", "westfalenstadion"] },
      { club: "Elversberg",         stadium: "Ursapharm-Arena",        accept: ["ursapharm arena", "ursapharm", "kaiserlinde", "an der kaiserlinde", "ursapharm arena an der kaiserlinde"] },
      { club: "Eintracht Frankfurt", stadium: "Deutsche Bank Park",    accept: ["deutsche bank park", "waldstadion", "commerzbank arena"] },
      { club: "Freiburg",           stadium: "Europa-Park Stadion",    accept: ["europa park stadion", "europa park", "europa park stadium"] },
      { club: "Hamburg",            stadium: "Volksparkstadion",       accept: ["volksparkstadion", "volkspark"] },
      { club: "Hoffenheim",         stadium: "PreZero Arena",          accept: ["prezero arena", "prezero", "rhein neckar arena"] },
      { club: "Köln",               stadium: "RheinEnergieStadion",    accept: ["rheinenergiestadion", "rheinenergie stadion", "rheinenergie", "mungersdorfer stadion"] },
      { club: "RB Leipzig",         stadium: "Red Bull Arena",         accept: ["red bull arena", "zentralstadion"] },
      { club: "Leverkusen",         stadium: "BayArena",               accept: ["bayarena", "bay arena"] },
      { club: "Mainz",              stadium: "Mewa Arena",             accept: ["mewa arena", "mewa", "opel arena", "coface arena"] },
      { club: "Gladbach",           stadium: "Borussia-Park",          accept: ["borussia park"] },
      { club: "Bayern Munich",      stadium: "Allianz Arena",          accept: ["allianz arena", "the allianz arena"] },
      { club: "Paderborn",          stadium: "Home Deluxe Arena",      accept: ["home deluxe arena", "home deluxe", "benteler arena"] },
      { club: "Schalke",            stadium: "Veltins-Arena",          accept: ["veltins arena", "veltins", "arena aufschalke", "auf schalke"] },
      { club: "Stuttgart",          stadium: "MHPArena",               accept: ["mhparena", "mhp arena", "mercedes benz arena", "neckarstadion"] },
    ],
  },
  {
    id: "ligue-1",
    name: "Ligue 1",
    season: "2026-27",
    clubs: [
      { club: "Angers",       stadium: "Raymond Kopa",           accept: ["raymond kopa", "stade raymond kopa", "jean bouin angers"] },
      { club: "Auxerre",      stadium: "Abbé-Deschamps",         accept: ["abbe deschamps", "stade de l abbe deschamps", "labbe deschamps"] },
      { club: "Brest",        stadium: "Francis-Le Blé",         accept: ["francis le ble", "le ble", "stade francis le ble"] },
      { club: "Le Havre",     stadium: "Stade Océane",           accept: ["stade oceane", "oceane"] },
      { club: "Le Mans",      stadium: "Marie-Marvingt",         accept: ["marie marvingt", "stade marie marvingt", "mmarena", "mm arena"] },
      { club: "Lens",         stadium: "Bollaert-Delelis",       accept: ["bollaert delelis", "bollaert", "stade bollaert delelis", "felix bollaert"] },
      { club: "Lille",        stadium: "Pierre-Mauroy",          accept: ["pierre mauroy", "stade pierre mauroy", "decathlon arena", "grand stade lille"] },
      { club: "Lyon",         stadium: "Groupama Stadium",       accept: ["groupama stadium", "groupama", "parc ol", "parc olympique lyonnais"] },
      { club: "Lorient",      stadium: "Le Moustoir",            accept: ["le moustoir", "moustoir", "stade du moustoir", "yves allainmat"] },
      { club: "Marseille",    stadium: "Vélodrome",              accept: ["velodrome", "stade velodrome", "orange velodrome", "the velodrome"] },
      { club: "Monaco",       stadium: "Stade Louis II",         accept: ["stade louis ii", "louis ii", "louis 2", "stade louis 2"] },
      { club: "Nice",         stadium: "Allianz Riviera",        accept: ["allianz riviera", "the riviera"] },
      { club: "Paris FC",     stadium: "Jean-Bouin",             accept: ["jean bouin", "stade jean bouin"] },
      { club: "PSG",          stadium: "Parc des Princes",       accept: ["parc des princes", "le parc", "parc de princes"] },
      { club: "Rennes",       stadium: "Roazhon Park",           accept: ["roazhon park", "roazhon", "route de lorient"] },
      { club: "Strasbourg",   stadium: "La Meinau",              accept: ["la meinau", "meinau", "stade de la meinau"] },
      { club: "Toulouse",     stadium: "Stadium de Toulouse",    accept: ["stadium de toulouse", "stadium municipal", "le stadium"] },
      { club: "Troyes",       stadium: "Stade de l'Aube",        accept: ["stade de l aube", "l aube", "aube"] },
    ],
  },
];

// Lowercase, fold diacritics, keep letters/digits as words, collapse spaces.
// "St. James' Park" -> "st james park"; "Câmp Nou" -> "camp nou".
export function normalizeStadiumGuess(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Match a free-typed guess against the league's UNSOLVED clubs. Returns the
// club key or null. Exact normalized match only — with generous accept lists
// per entry, fuzzy matching would create false positives between grounds
// ("city ground" vs "city of manchester stadium" must never collide).
export function matchStadium(league, guess, solvedSet) {
  const g = normalizeStadiumGuess(guess);
  if (!g) return null;
  for (const c of league.clubs) {
    if (solvedSet.has(c.club)) continue;
    if (c.accept.includes(g) || normalizeStadiumGuess(c.stadium) === g) return c.club;
  }
  return null;
}
