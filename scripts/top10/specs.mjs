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
//   note       one line shown under the question: what counts, and how level
//              entries are ordered. A ranked list needs it whenever a fan
//              could fairly ask "since when?" or "why is he above him?"
//              ⚠️ A list with a note needs a SHORT title (one line on a phone).
//              The screen is "Top 10", so the title is only the thing ranked:
//              "Most English league titles", not "The 10 clubs with the most
//              English league titles". Two lines of title plus a note pushed
//              the fifth row of the board under the keyboard (measured 9 Oct:
//              the board ended 496pt down against a limit near 470). The
//              builder enforces the lengths.
//
// RANKED LISTS (from 9 Oct 2026). Alex's rule: a Top 10 is ten different
// things ranked by a number, and the number is shown beside the rank. A ranked
// list is written out here (explicit) with the number as each slot's clue, and
// ships only if the cut is clean: the tenth and the eleventh must differ, or
// "the ten" is a matter of opinion. Each was researched from live sources and
// then re-derived by a second, independent checker told to break it; both
// reports are kept outside the repo (~/ball-iq-audit/2026-10-09/top10-ranked/).

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

  // ── RANKED ─────────────────────────────────────────────────────────────────
  // Arsenal's 2025-26 title is their 14th. Counted season by season in three
  // lists that agree on all 127 titles (RSSSF, Wikipedia, Transfermarkt).
  // ⚠️ `until` is short on purpose. On 29 Sep 2026 the Premier League said an
  // independent commission had upheld its charges against Manchester City for
  // 2009-10 to 2017-18; City appealed on 1 Oct and the sanction is not yet
  // decided. Three of City's ten titles fall in those seasons. Nothing has
  // been taken away, the same ten clubs would remain either way, but City's
  // number could change. Re-check before every scheduling of this list.
  { id: 'english-league-titles', checked: '2026-10-09', until: '2026-11-30', kind: 'club',
    title: 'Most English league titles',
    note: 'Top-flight titles, 1888 to 2026. Clubs level on titles are in the order they got there.',
    asOf: '2026-10-09',
    source: 'RSSSF England champions (14 Jun 2026); Premier League, 19 May 2026; counted season by season',
    slots: [
      { name: 'Manchester United', clue: '20 titles' },
      { name: 'Liverpool', clue: '20 titles' },
      { name: 'Arsenal', clue: '14 titles' },
      { name: 'Manchester City', clue: '10 titles' },
      { name: 'Everton', clue: '9 titles' },
      { name: 'Aston Villa', clue: '7 titles' },
      { name: 'Sunderland', clue: '6 titles' },
      { name: 'Chelsea', clue: '6 titles' },
      { name: 'Newcastle United', clue: '4 titles' },
      { name: 'Sheffield Wednesday', clue: '4 titles' },
    ],
    nearMax: 4,
    near: [
      { name: 'Blackburn Rovers', note: '3 titles, one short' },
      { name: 'Huddersfield Town', note: '3 titles, one short' },
      { name: 'Wolverhampton Wanderers', note: '3 titles, one short' },
      { name: 'Leeds United', note: '3 titles, one short' },
    ] },
  // The league's own count, which is the authority on its own record: both of
  // its data feeds, Opta and NBC agree on all thirteen. Transfermarkt alone has
  // Phil Neville on 504; the league's nineteen season figures for him sum to
  // 505 (Manchester United 263, Everton 242). Milner retired on 1 June 2026,
  // so nobody in the ten is active. The nearest active player is Jordan
  // Henderson on 464, who cannot reach 505 before 2027-28.
  { id: 'premier-league-appearances', checked: '2026-10-09', until: '2027-08-01', kind: 'player',
    title: 'Most Premier League appearances',
    note: 'Premier League games only, 1992 to today, on the league’s own count.',
    asOf: '2026-10-09',
    source: 'premierleague.com all-time appearances (read 9 Oct 2026); Opta Analyst, 1 Jun 2026',
    slots: [
      { name: 'James Milner', clue: '658 games' },
      { name: 'Gareth Barry', clue: '653 games' },
      { name: 'Ryan Giggs', clue: '632 games' },
      { name: 'Frank Lampard', clue: '609 games' },
      { name: 'David James', clue: '572 games' },
      { name: 'Gary Speed', clue: '535 games' },
      { name: 'Emile Heskey', clue: '516 games' },
      { name: 'Mark Schwarzer', clue: '514 games' },
      { name: 'Jamie Carragher', clue: '508 games' },
      { name: 'Phil Neville', clue: '505 games' },
    ],
    near: [
      { name: 'Rio Ferdinand', note: '504 games, one short' },
      { name: 'Steven Gerrard', note: '504 games, one short' },
      { name: 'Sol Campbell', note: '503 games, two short' },
    ] },
  // ── FIXED AT A PAST BOUNDARY ───────────────────────────────────────────────
  // Each of these is worded "to the end of 2025-26" (or of the 2026 World Cup),
  // so nothing an active player does can change it: the owner's preference for
  // lists that hold. `until` is the end of next season all the same, when the
  // wording would start to read as stale and a fresh list should replace it.
  // One outside source has Defoe on 163; the league, Opta and Wikipedia say 162.
  // Nobody in the ten played in the Premier League after May 2026 (Salah left).
  { id: 'premier-league-goals', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Most Premier League goals',
    note: 'Premier League goals only, to the end of 2025-26, on the league’s own count.',
    asOf: '2026-10-09',
    source: 'premierleague.com all-time goals (read 9 Oct 2026); Opta Analyst, 18 May 2026',
    slots: [
      { name: 'Alan Shearer', clue: '260 goals' },
      { name: 'Harry Kane', clue: '213 goals' },
      { name: 'Wayne Rooney', clue: '208 goals' },
      { name: 'Mohamed Salah', clue: '193 goals' },
      { name: 'Andy Cole', clue: '187 goals' },
      { name: 'Sergio Agüero', clue: '184 goals' },
      { name: 'Frank Lampard', clue: '177 goals' },
      { name: 'Thierry Henry', clue: '175 goals' },
      { name: 'Robbie Fowler', clue: '163 goals' },
      { name: 'Jermain Defoe', clue: '162 goals' },
    ],
    near: [
      { name: 'Michael Owen', note: '150 goals, 12 short' },
      { name: 'Les Ferdinand', note: '149 goals, 13 short' },
      { name: 'Teddy Sheringham', note: '146 goals, 16 short' },
    ] },
  // Fixed at the World Cup on purpose. Kane has won four caps since and drew
  // level with Shilton on 125 on 6 Oct 2026; a list "as of today" would expire
  // at England's next match (12 Nov). He did not play the third-place match,
  // which is why he ended the tournament on 121.
  { id: 'england-caps', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Most England caps (men)',
    note: 'England men’s caps at the end of the 2026 World Cup. Level players in the order they got there.',
    asOf: '2026-10-09',
    source: 'Englandstats.com, every cap numbered; the FA, 6 Oct 2026; RSSSF',
    slots: [
      { name: 'Peter Shilton', clue: '125 caps' },
      { name: 'Harry Kane', clue: '121 caps' },
      { name: 'Wayne Rooney', clue: '120 caps' },
      { name: 'David Beckham', clue: '115 caps' },
      { name: 'Steven Gerrard', clue: '114 caps' },
      { name: 'Bobby Moore', clue: '108 caps' },
      { name: 'Ashley Cole', clue: '107 caps' },
      { name: 'Bobby Charlton', clue: '106 caps' },
      { name: 'Frank Lampard', clue: '106 caps' },
      { name: 'Billy Wright', clue: '105 caps' },
    ],
    nearMax: 4,
    near: [
      { name: 'Kyle Walker', note: '96 caps, 9 short' },
      { name: 'John Stones', note: '94 caps, 11 short' },
      { name: 'Jordan Pickford', note: '91 caps, 14 short' },
      { name: 'Jordan Henderson', note: '91 caps, 14 short' },
    ] },
  // The boundary is needed: Rashford is back at United on 138. Giggs is level
  // with Spence only because one Charity Shield goal counts (all competitions).
  { id: 'manchester-united-top-scorers', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Manchester United’s top scorers',
    note: 'All competitions, to the end of 2025-26. Level players in the order they got there.',
    asOf: '2026-10-09',
    source: 'MUFCinfo all players, all goals; Wikipedia records page (26 Aug 2026)',
    slots: [
      { name: 'Wayne Rooney', clue: '253 goals' },
      { name: 'Bobby Charlton', clue: '249 goals' },
      { name: 'Denis Law', clue: '237 goals' },
      { name: 'Jack Rowley', clue: '211 goals' },
      { name: 'Dennis Viollet', clue: '179 goals' },
      { name: 'George Best', clue: '179 goals' },
      { name: 'Joe Spence', clue: '168 goals' },
      { name: 'Ryan Giggs', clue: '168 goals' },
      { name: 'Mark Hughes', clue: '163 goals' },
      { name: 'Paul Scholes', clue: '155 goals' },
    ],
    nearMax: 4,
    near: [
      { name: 'Ruud van Nistelrooy', note: '150 goals, 5 short' },
      { name: 'Stan Pearson', note: '148 goals, 7 short' },
      { name: 'David Herd', note: '145 goals, 10 short' },
      { name: 'Cristiano Ronaldo', note: '145 goals, 10 short' },
    ] },
  // Salah left in the summer of 2026 on 257.
  { id: 'liverpool-top-scorers', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Liverpool’s top scorers',
    note: 'All competitions, to the end of 2025-26.',
    asOf: '2026-10-09',
    source: 'liverpoolfc.com and LFChistory.net, which agree on the top 25',
    slots: [
      { name: 'Ian Rush', clue: '346 goals' },
      { name: 'Roger Hunt', clue: '285 goals' },
      { name: 'Mohamed Salah', clue: '257 goals' },
      { name: 'Gordon Hodgson', clue: '241 goals' },
      { name: 'Billy Liddell', clue: '228 goals' },
      { name: 'Steven Gerrard', clue: '186 goals' },
      { name: 'Robbie Fowler', clue: '183 goals' },
      { name: 'Kenny Dalglish', clue: '172 goals' },
      { name: 'Michael Owen', clue: '158 goals' },
      { name: 'Harry Chambers', clue: '151 goals' },
    ],
    near: [
      { name: 'Sam Raybould', note: '130 goals, 21 short' },
      { name: 'Jack Parkinson', note: '128 goals, 23 short' },
      { name: 'Dick Forshaw', note: '124 goals, 27 short' },
    ] },
  // Brain and Drake are level on 139. "Got there first" puts Brain first, as
  // the club prints it; a fewer-games rule would put Drake first.
  { id: 'arsenal-top-scorers', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Arsenal’s top scorers',
    note: 'All competitions, to the end of 2025-26. Level players in the order they got there.',
    asOf: '2026-10-09',
    source: 'arsenal.com goalscorers; Wikipedia records page (4 Sep 2026)',
    slots: [
      { name: 'Thierry Henry', clue: '228 goals' },
      { name: 'Ian Wright', clue: '185 goals' },
      { name: 'Cliff Bastin', clue: '178 goals' },
      { name: 'John Radford', clue: '149 goals' },
      { name: 'Jimmy Brain', clue: '139 goals' },
      { name: 'Ted Drake', clue: '139 goals' },
      { name: 'Doug Lishman', clue: '137 goals' },
      { name: 'Robin van Persie', clue: '132 goals' },
      { name: 'Joe Hulme', clue: '125 goals' },
      { name: 'David Jack', clue: '124 goals' },
    ],
    near: [
      { name: 'Dennis Bergkamp', note: '120 goals, 4 short' },
      { name: 'Reg Lewis', note: '118 goals, 6 short' },
      { name: 'Alan Smith', pin: 'Q703932', note: '115 goals, 9 short' }, // Arsenal's, born 1962; not the one born 1980
    ] },
  // Bentley is level with Osgood only because the club counts one Charity
  // Shield goal for him.
  { id: 'chelsea-top-scorers', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Chelsea’s top scorers',
    note: 'All competitions, to the end of 2025-26. Level players in the order they got there.',
    asOf: '2026-10-09',
    source: 'chelseafc.com all-time record goalscorers (11 May 2026); Wikipedia records page',
    slots: [
      { name: 'Frank Lampard', clue: '211 goals' },
      { name: 'Bobby Tambling', clue: '202 goals' },
      { name: 'Kerry Dixon', clue: '193 goals' },
      { name: 'Didier Drogba', clue: '164 goals' },
      { name: 'Roy Bentley', clue: '150 goals' },
      { name: 'Peter Osgood', clue: '150 goals' },
      { name: 'Jimmy Greaves', clue: '132 goals' },
      { name: 'George Mills', clue: '125 goals' },
      { name: 'Eden Hazard', clue: '110 goals' },
      { name: 'George Hilsdon', clue: '108 goals' },
    ],
    near: [
      { name: 'Barry Bridges', note: '93 goals, 15 short' },
      { name: 'Tommy Baldwin', note: '92 goals, 16 short' },
      { name: 'Jimmy Floyd Hasselbaink', note: '87 goals, 21 short' },
    ] },
  // Greaves is 266 on the club's count (League 220, FA Cup 32, League Cup 5,
  // Europe 9). The 268 seen elsewhere adds two Charity Shield goals the club
  // does not count; counting them would move no place and not the cut. Five
  // of the lower numbers rest on the club's ledger alone.
  { id: 'tottenham-top-scorers', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Tottenham’s top scorers',
    note: 'The club’s own count, Charity Shield not included, to the end of 2025-26.',
    asOf: '2026-10-09',
    source: 'tottenhamhotspur.com all-time top goalscorers and player pages; Wikipedia records page (2 Oct 2026)',
    slots: [
      { name: 'Harry Kane', clue: '280 goals' },
      { name: 'Jimmy Greaves', clue: '266 goals' },
      { name: 'Bobby Smith', clue: '208 goals' },
      { name: 'Martin Chivers', clue: '174 goals' },
      { name: 'Son Heung-min', clue: '173 goals' },
      { name: 'Cliff Jones', clue: '159 goals' },
      { name: 'Jermain Defoe', clue: '143 goals' },
      { name: 'George Hunt', clue: '138 goals' },
      { name: 'Len Duquemin', clue: '134 goals' },
      { name: 'Alan Gilzean', clue: '133 goals' },
    ],
    near: [
      { name: 'Teddy Sheringham', note: '124 goals, 9 short' },
      { name: 'Robbie Keane', note: '122 goals, 11 short' },
      { name: 'Les Bennett', note: '117 goals, 16 short' },
    ] },
  // ⚠️ Short `until`, for the same reason as english-league-titles: the
  // sanction in the Manchester City case is undecided and could take points
  // from past seasons. The ten could not change (City would need to lose more
  // than 858, and earned 714 in the seasons charged), but City's number and
  // the order of places 6 to 10 could.
  { id: 'premier-league-points', checked: '2026-10-09', until: '2026-11-30', kind: 'club',
    title: 'Most Premier League points ever',
    note: 'Every Premier League season from 1992-93 to 2025-26, added up.',
    asOf: '2026-10-09',
    source: 'The 34 final tables on premierleague.com, summed; Wikipedia season pages, 686 club-seasons, no mismatch',
    slots: [
      { name: 'Manchester United', clue: '2,614 points' },
      { name: 'Arsenal', clue: '2,473 points' },
      { name: 'Liverpool', clue: '2,402 points' },
      { name: 'Chelsea', clue: '2,366 points' },
      { name: 'Tottenham Hotspur', clue: '1,992 points' },
      { name: 'Manchester City', clue: '1,958 points' },
      { name: 'Everton', clue: '1,747 points' },
      { name: 'Newcastle United', clue: '1,656 points' },
      { name: 'Aston Villa', clue: '1,618 points' },
      { name: 'West Ham United', clue: '1,432 points' },
    ],
    near: [
      { name: 'Southampton', note: '1,100 points, 332 short' },
      { name: 'Blackburn Rovers', note: '970 points, 462 short' },
      { name: 'Leeds United', note: '867 points, 565 short' },
    ] },
  // "Completed" matters: one page counts the abandoned 1939-40 season for
  // Sunderland alone (88). Counted for nobody, as every club's own season list
  // has it, Sunderland are on 87. No body owns this number; it was counted.
  { id: 'english-top-flight-seasons', checked: '2026-10-09', until: '2027-06-01', kind: 'club',
    title: 'Most English top-flight seasons',
    note: 'Completed top-flight seasons, 1888-89 to 2025-26. Level clubs by who started there first.',
    asOf: '2026-10-09',
    source: 'Counted club by club over all 127 completed seasons; MyFootballFacts (5 Oct 2026)',
    slots: [
      { name: 'Everton', clue: '123 seasons' },
      { name: 'Aston Villa', clue: '112 seasons' },
      { name: 'Liverpool', clue: '111 seasons' },
      { name: 'Arsenal', clue: '109 seasons' },
      { name: 'Manchester United', clue: '101 seasons' },
      { name: 'Manchester City', clue: '97 seasons' },
      { name: 'Newcastle United', clue: '94 seasons' },
      { name: 'Chelsea', clue: '91 seasons' },
      { name: 'Tottenham Hotspur', clue: '91 seasons' },
      { name: 'Sunderland', clue: '87 seasons' },
    ],
    near: [
      { name: 'West Bromwich Albion', note: '81 seasons, 6 short' },
      { name: 'Bolton Wanderers', note: '73 seasons, 14 short' },
      { name: 'Blackburn Rovers', note: '72 seasons, 15 short' },
    ] },
  // Cannot change before the 2030 tournament opens on 8 June 2030. Sweden is
  // 21 in one table that counts a 1938 walkover; it is outside the ten either
  // way. Germany includes West Germany.
  { id: 'world-cup-matches-won', checked: '2026-10-09', until: '2030-06-08', kind: 'nation',
    title: 'Most World Cup matches won',
    note: 'World Cup matches won, 1930 to 2026. A shoot-out is a draw. Level nations by all-time points.',
    asOf: '2026-10-09',
    source: 'Wikipedia World Cup records, overall team records (6 Oct 2026); Transfermarkt all-time table; all 104 matches of 2026 tallied',
    slots: [
      { name: 'Brazil', clue: '79 wins' },
      { name: 'Germany', clue: '70 wins' },
      { name: 'Argentina', clue: '54 wins' },
      { name: 'Italy', clue: '45 wins' },
      { name: 'France', clue: '45 wins' },
      { name: 'England', clue: '38 wins' },
      { name: 'Spain', clue: '38 wins' },
      { name: 'Netherlands', clue: '32 wins' },
      { name: 'Uruguay', clue: '25 wins' },
      { name: 'Belgium', clue: '24 wins' },
    ],
    near: [
      { name: 'Mexico', note: '21 wins, 3 short' },
      { name: 'Sweden', note: '20 wins, 4 short' },
    ] },
  // Schwarzer 151 and Seaman 140: an older feed of the league's says 152 and
  // 141, each one match too many in 2001-02 (all 38 games of both clubs that
  // season were gone through). The league's website and Opta have it right.
  { id: 'premier-league-clean-sheets', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Most Premier League clean sheets',
    note: 'Goalkeepers, Premier League only, to the end of 2025-26. Level keepers by fewer games.',
    asOf: '2026-10-09',
    source: 'premierleague.com clean sheets, goalkeepers (read 9 Oct 2026); Opta Analyst, 7 Aug 2026',
    slots: [
      { name: 'Petr Čech', clue: '202 clean sheets' },
      { name: 'David James', clue: '169 clean sheets' },
      { name: 'Mark Schwarzer', clue: '151 clean sheets' },
      { name: 'David de Gea', clue: '147 clean sheets' },
      { name: 'David Seaman', clue: '140 clean sheets' },
      { name: 'Nigel Martyn', clue: '137 clean sheets' },
      { name: 'Pepe Reina', clue: '136 clean sheets' },
      { name: 'Edwin van der Sar', clue: '132 clean sheets' },
      { name: 'Tim Howard', clue: '132 clean sheets' },
      { name: 'Brad Friedel', clue: '132 clean sheets' },
    ],
    near: [
      { name: 'Peter Schmeichel', note: '128 clean sheets, 4 short' },
      { name: 'Joe Hart', note: '127 clean sheets, 5 short' },
      { name: 'Hugo Lloris', note: '127 clean sheets, 5 short' },
    ] },
];

// Days since epoch of Top 10 #1 (the shared day index: local calendar date as a
// UTC day number, lib/date.js). ⚠️ Set once, on the day the game first ships,
// and never moved: every share text and every recorded result carries the
// number that falls out of it. Monday 12 October 2026, by Alex's word on
// 9 Oct. From the first second of that day this number is fixed for good.
export const TOP10_ANCHOR_DAY = 20738;

// The schedule: TOP10_LOG[n] is Top 10 #(n + 1). ⚠️ APPEND ONLY once the game
// is live. A released native build carries this file; reordering it would have
// two players on the same day arguing about different lists.
//
// The first thirteen days, 12 to 24 October 2026. The opening list is the one
// most players can finish (ten famous names), because the first day decides
// whether anyone comes back for the second; the lists with pre-war names in
// their last slots are spaced out, and clubs, players and nations alternate.
// ⚠️ THIRTEEN DAYS IS ALL THERE IS. On the day after the last entry the game
// goes quiet and Mystery Player returns to Today by itself. More lists must be
// appended before 24 October, and a native build must not ship to the stores
// on this schedule alone: it would run dry days after release. The lists have
// to reach the app from the server first (see docs/TODO.md).
export const TOP10_LOG = [
  'premier-league-goals',            // Mon 12 Oct  #1
  'english-league-titles',           // Tue 13
  'england-caps',                    // Wed 14
  'world-cup-matches-won',           // Thu 15
  'liverpool-top-scorers',           // Fri 16
  'premier-league-appearances',      // Sat 17
  'manchester-united-top-scorers',   // Sun 18
  'premier-league-points',           // Mon 19
  'arsenal-top-scorers',             // Tue 20
  'premier-league-clean-sheets',     // Wed 21
  'chelsea-top-scorers',             // Thu 22
  'english-top-flight-seasons',      // Fri 23
  'tottenham-top-scorers',           // Sat 24
];

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
  'athletico pr': 'Athletico Paranaense',
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
  'frank lampard': 'Q41533', // the son, born 1978; his father (born 1948) is in the pool too
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
