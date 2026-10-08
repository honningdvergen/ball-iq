// Top 10: the lists, in the order they were written, and the schedule.
//
// Read by scripts/gen-top10.mjs, which writes src/data/top10Lists.json.
//
// A list is either DERIVED from a table in scripts/seo/lists.mjs (already
// fact-checked row by row, so nothing is retyped and nothing can be mistyped),
// or EXPLICIT: ten slots written out here with the source they were checked
// against. Either way a list ships only after an independent check against the
// web on the day it is added: a derived list is only as current as its table.
//
//   id         stable slug; results and shares are keyed on the day number, but
//              the id is what the schedule freezes
//   kind       'player' | 'club' | 'nation': which names the guess box offers
//   title      the question, as the player reads it
//   clueLabel  what the small value beside each rank means
//   derive     { list, cols, mode }   mode 'last-different' walks the table from
//              its newest row and keeps each name the first time it appears;
//              mode 'all-winners' is every distinct name, newest win first, and
//              must come to exactly ten
//   slots      explicit lists: [{ name, clue }] in rank order, exactly ten
//   near       explicit lists: [{ name, note }] the names just outside
//   asOf       explicit lists: the ISO date the ten were checked
//   source     explicit lists: where they were checked
// The league-champions lists carry an `until` in mid-March rather than at the
// last matchday, because a title can be won weeks early.
//
//   checked    ISO date an independent check against the web last passed.
//              gen-top10 refuses to ship or schedule a list without one.
//   until      ISO date of the next final or ceremony that could change the
//              list. It may be scheduled for any day before that, never on or
//              after it. Required once a list is checked.
//   also       { 'Name in the ten': ['Other name', ...] } names that are a fair
//              answer to this list only (Russia for the Soviet Union)
//   cluePrefix text put before every clue ("Euro " makes "Euro 2020")
//   nearMax    how many "just outside" names to keep (default 3)

export const TOP10_SPECS = [
  { id: 'ballon-dor-last-ten', checked: '2026-10-09', until: '2026-10-26', kind: 'player', clueLabel: 'Last won',
    title: "The last 10 different men's Ballon d'Or winners",
    derive: { list: 'ballon-dor-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'champions-league-last-ten', checked: '2026-10-09', until: '2027-06-05', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Champions League',
    derive: { list: 'champions-league-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'pl-golden-boot-last-ten', checked: '2026-10-09', until: '2027-05-30', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Premier League Golden Boot winners',
    derive: { list: 'premier-league-top-scorers', cols: ['Player'], mode: 'last-different' } },
  { id: 'fa-cup-last-ten', checked: '2026-10-09', until: '2027-05-22', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the FA Cup',
    derive: { list: 'fa-cup-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'euro-winning-nations', checked: '2026-10-09', until: '2028-07-09', kind: 'nation', clueLabel: 'Last won',
    title: "Every nation to win the men's Euros", cluePrefix: 'Euro ',
    // UEFA credits both successors with the old states' records, so both are
    // fair answers here, and here only.
    also: { 'Soviet Union': ['Russia'], 'Czechoslovakia': ['Czech Republic', 'Slovakia'] },
    derive: { list: 'euro-winners', cols: ['Winner'], mode: 'all-winners' } },
  { id: 'world-cup-finalists-last-ten', checked: '2026-10-09', until: '2030-07-21', kind: 'nation', clueLabel: 'Last final',
    title: 'The last 10 different nations to play in a World Cup final',
    also: { 'Czechoslovakia': ['Czech Republic', 'Slovakia'] },
    // 13th would be Uruguay in 1950, which had a deciding match and no final.
    // Whether that counts is an argument, so the list stops at 12th.
    nearMax: 2,
    derive: { list: 'world-cup-winners', cols: ['Winner', 'Runner-up'], mode: 'last-different' } },
  { id: 'europa-league-last-ten', checked: '2026-10-09', until: '2027-05-26', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Europa League',
    derive: { list: 'europa-league-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'champions-league-beaten-finalists', checked: '2026-10-09', until: '2027-06-05', kind: 'club', clueLabel: 'Last lost',
    title: 'The last 10 different clubs to lose a Champions League final',
    derive: { list: 'champions-league-winners', cols: ['Runner-up'], mode: 'last-different' } },
  { id: 'league-cup-last-ten', checked: '2026-10-09', until: '2027-03-21', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the English League Cup',
    derive: { list: 'efl-cup-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'la-liga-top-scorer-last-ten', checked: '2026-10-09', until: '2027-05-29', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different La Liga top scorers',
    derive: { list: 'la-liga-top-scorers', cols: ['Player'], mode: 'last-different' } },
  { id: 'serie-a-champions-last-ten', checked: '2026-10-09', until: '2027-03-15', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different Serie A champions',
    derive: { list: 'serie-a-champions', cols: ['Champions'], mode: 'last-different' } },
  { id: 'bundesliga-champions-last-ten', checked: '2026-10-09', until: '2027-03-15', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different Bundesliga champions',
    derive: { list: 'bundesliga-champions', cols: ['Champions'], mode: 'last-different' } },
  { id: 'champions-league-top-scorer-last-ten', checked: '2026-10-09', until: '2027-06-05', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Champions League top scorers',
    derive: { list: 'champions-league-top-scorers', cols: ['Player'], mode: 'last-different' } },
  // HELD 2026-10-09. The 2025 final was won by Senegal on the pitch and awarded
  // to Morocco by the confederation's appeal board; Senegal's appeal was heard
  // by the Court of Arbitration for Sport on 8 Oct 2026 with no award yet. The
  // list is right under one outcome and wrong under the other. Check again once
  // the award is published.
  { id: 'afcon-last-ten', kind: 'nation', clueLabel: 'Last won',
    title: 'The last 10 different nations to win the Africa Cup of Nations',
    derive: { list: 'afcon-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'copa-del-rey-last-ten', checked: '2026-10-09', until: '2027-04-24', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Copa del Rey',
    derive: { list: 'copa-del-rey-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'ligue-1-champions-last-ten', checked: '2026-10-09', until: '2027-03-15', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different Ligue 1 champions',
    derive: { list: 'ligue-1-champions', cols: ['Champions'], mode: 'last-different' } },
  { id: 'bundesliga-top-scorer-last-ten', checked: '2026-10-09', until: '2027-05-22', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Bundesliga top scorers',
    derive: { list: 'bundesliga-top-scorers', cols: ['Player'], mode: 'last-different' } },
  { id: 'copa-libertadores-last-ten', checked: '2026-10-09', until: '2026-11-28', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Copa Libertadores',
    derive: { list: 'copa-libertadores-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'serie-a-top-scorer-last-ten', checked: '2026-10-09', until: '2027-05-30', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Serie A top scorers',
    derive: { list: 'serie-a-top-scorers', cols: ['Player'], mode: 'last-different' } },
  { id: 'dfb-pokal-last-ten', checked: '2026-10-09', until: '2027-05-29', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the DFB-Pokal',
    derive: { list: 'dfb-pokal-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'coppa-italia-last-ten', checked: '2026-10-09', until: '2027-05-19', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Coppa Italia',
    derive: { list: 'coppa-italia-winners', cols: ['Winner'], mode: 'last-different' } },
  // HELD 2026-10-09. Every name and year is right, but FIFA calls the
  // Intercontinental Cup (from 2024) the continuation of the annual Club World
  // Cup, so a fan can fairly argue Paris Saint-Germain belong. An answer that
  // can be argued is not a fair question.
  { id: 'club-world-cup-last-ten', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Club World Cup',
    derive: { list: 'club-world-cup-winners', cols: ['Winner'], mode: 'last-different' } },
  // HELD 2026-10-09. The league names ONE top scorer when players finish level
  // (fewer penalty goals wins), and our table follows that for 2019-20 and
  // 2024-25 but lists both Giroud and Nenê for 2011-12. Fix that row in
  // scripts/seo/lists.mjs first, then check the list again.
  { id: 'ligue-1-top-scorer-last-ten', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Ligue 1 top scorers',
    derive: { list: 'ligue-1-top-scorers', cols: ['Player'], mode: 'last-different' } },
];

// The schedule: TOP10_LOG[n] is Top 10 #(n + 1). ⚠️ APPEND ONLY once the game
// is live. A released native build carries this file; reordering it would have
// two players on the same day arguing about different lists.
export const TOP10_LOG = [];

// One name per club. Keys are folded spellings found in the tables and in
// scripts/seo/leagues.mjs; the value is the name the player sees and picks.
// Only pairs that are certainly the same club belong here: "Inter" is Inter
// Milan in every table we hold, but "Racing", "Nacional" and "Red Star" are
// each several clubs and stay as written.
export const CLUB_CANON = {
  'milan': 'AC Milan',
  'inter': 'Inter Milan',
  'internazionale': 'Inter Milan',
  'ambrosiana inter': 'Inter Milan',
  'tsv 1860 munich': '1860 Munich',
  'az 67': 'AZ',
  'koln': '1. FC Köln',
  'fc schalke 04': 'Schalke 04',
  'schalke': 'Schalke 04',
  'stuttgart': 'VfB Stuttgart',
  'hamburg': 'Hamburger SV',
  'dortmund': 'Borussia Dortmund',
  'leverkusen': 'Bayer Leverkusen',
  'frankfurt': 'Eintracht Frankfurt',
  'freiburg': 'SC Freiburg',
  'sparta': 'Sparta Rotterdam',
  'twente': 'FC Twente',
  'utrecht': 'FC Utrecht',
  'basaksehir': 'İstanbul Başakşehir',
  'tottenham': 'Tottenham Hotspur',
  'newcastle': 'Newcastle United',
  'west ham': 'West Ham United',
  'birmingham': 'Birmingham City',
  'blackburn': 'Blackburn Rovers',
  'bolton': 'Bolton Wanderers',
  'brighton': 'Brighton & Hove Albion',
  'charlton': 'Charlton Athletic',
  'coventry': 'Coventry City',
  'ipswich': 'Ipswich Town',
  'preston': 'Preston North End',
  'newell s': "Newell's Old Boys",
  'velez': 'Vélez Sarsfield',
  'al hilal': 'Al-Hilal',
  'estudiantes': 'Estudiantes',
  'estudiantes lp': 'Estudiantes',
  'vitoria sc': 'Vitória de Guimarães',
  'man city': 'Manchester City',
  'man united': 'Manchester United',
  'psg': 'Paris Saint-Germain',
  'gladbach': 'Borussia Mönchengladbach',
  'athletic club': 'Athletic Bilbao',
  'nott m forest': 'Nottingham Forest',
  'psv eindhoven': 'PSV',
  'sheffield utd': 'Sheffield United',
  'wolves': 'Wolverhampton Wanderers',
  'west brom': 'West Bromwich Albion',
  'qpr': 'Queens Park Rangers',
  'deportivo': 'Deportivo La Coruña',
  'argentinos jrs': 'Argentinos Juniors',
  'racing': 'Racing Club',
  'ny red bulls': 'New York Red Bulls',
  'ne revolution': 'New England Revolution',
  'sporting kc': 'Sporting Kansas City',
  'nycfc': 'New York City FC',
  'lafc': 'Los Angeles FC',
  'dep riestra': 'Deportivo Riestra',
  'indep rivadavia': 'Independiente Rivadavia',
};

// Two footballers, one name: which of them a table means. Keyed by the folded
// name, valued by the pool id. A list that means the other one sets its own
// `pins`. gen-top10 stops on any shared name that is not listed here.
export const PLAYER_PINS = {
  'luis suarez': 'Q26517', // the Uruguayan, born 1987
};

// Extra spellings a player might type for a club, beyond its own name.
export const CLUB_AKA = {
  'Inter Milan': ['Internazionale', 'Inter'],
  'AC Milan': ['Milan'],
  'Paris Saint-Germain': ['PSG'],
  'Manchester United': ['Man Utd', 'Man United'],
  'Manchester City': ['Man City'],
  'Tottenham Hotspur': ['Spurs'],
  'Wolverhampton Wanderers': ['Wolves'],
  'Borussia Dortmund': ['BVB', 'Dortmund'],
  'Borussia Mönchengladbach': ['Gladbach'],
  'Bayern Munich': ['Bayern München', 'FC Bayern'],
  '1. FC Köln': ['Cologne', 'Koln'],
  'Bayer Leverkusen': ['Leverkusen'],
  'Eintracht Frankfurt': ['Frankfurt'],
  'Hamburger SV': ['Hamburg', 'HSV'],
  'Atlético Madrid': ['Atleti'],
  'Athletic Bilbao': ['Athletic Club'],
  'Sporting CP': ['Sporting Lisbon'],
  'Red Star Belgrade': ['Crvena zvezda'],
  'Nottingham Forest': ["Nott'm Forest"],
  'Sheffield Wednesday': ['Sheff Wed'],
  'Sheffield United': ['Sheff Utd'],
  'West Bromwich Albion': ['West Brom', 'WBA'],
  'Queens Park Rangers': ['QPR'],
  'Brighton & Hove Albion': ['Brighton'],
  'Marseille': ['Olympique de Marseille', 'OM'],
  'Lyon': ['Olympique Lyonnais', 'OL'],
  'Saint-Étienne': ['St Etienne', 'ASSE'],
  'PSV': ['PSV Eindhoven'],
  'Steaua București': ['FCSB', 'Steaua Bucharest'],
};

// Nations: one name per team, and the old names people still type.
export const NATION_CANON = {
  'west germany': 'Germany',
  'zaire': 'DR Congo',
};
export const NATION_AKA = {
  'Germany': ['West Germany', 'Deutschland'],
  'Netherlands': ['Holland'],
  'Ivory Coast': ["Côte d'Ivoire", 'Cote d Ivoire'],
  'United States': ['USA', 'America'],
  'South Korea': ['Korea Republic'],
  'Soviet Union': ['USSR'],
  'DR Congo': ['Zaire', 'Congo DR'],
  'Czechoslovakia': ['Czecho-Slovakia'],
  'Türkiye': ['Turkey'],
  'Czech Republic': ['Czechia'],
  'Republic of Ireland': ['Ireland', 'Eire'],
  'England': [],
};

// National teams the guess box offers beyond those that appear in a table, so a
// nations list is not a pick from the seventy sides that ever reached a final.
export const MORE_NATIONS = [
  'Albania', 'Angola', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Burkina Faso',
  'Canada', 'Cape Verde', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Czech Republic',
  'Ecuador', 'Finland', 'Gabon', 'Georgia', 'Guinea', 'Honduras', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Jamaica', 'Jordan', 'Mali', 'Mexico', 'Montenegro', 'New Zealand', 'North Korea',
  'North Macedonia', 'Northern Ireland', 'Norway', 'Panama', 'Paraguay', 'Peru', 'Poland',
  'Republic of Ireland', 'Romania', 'Russia', 'Scotland', 'Senegal', 'Serbia', 'Slovakia',
  'Slovenia', 'Sweden', 'Switzerland', 'Togo', 'Trinidad and Tobago', 'Türkiye', 'Ukraine',
  'United Arab Emirates', 'Uzbekistan', 'Venezuela', 'Wales', 'Yugoslavia', 'Zimbabwe',
];
