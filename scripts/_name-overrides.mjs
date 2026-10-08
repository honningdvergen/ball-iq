// Curated corrections to Wikidata player labels, keyed by QID.
//
// ⚠️ WHY THIS FILE EXISTS. src/data/mysteryPool.json is generated from
// Wikidata, and Wikidata labels are the text we render to players. That means
// ANYONE CAN EDIT WHAT OUR APP SAYS. There is no review step between a wiki
// edit and a name on a live daily puzzle, and the same string ships inside the
// iOS and Android binaries.
//
// Found 2026-08-05: Jude Bellingham — the most guessable player at Real
// Madrid, and a scheduled answer — was in the pool as "Jude Belligoal". Not a
// stale snapshot; that is still the live label, with a matching vandalised
// alias ("Jude Victor William Belligoal"). A player typing "Bellingham" was
// told no such player existed. This was mistaken for a MISSING player for two
// days because a search for "Bellingham" found nothing.
//
// A football pun is the benign version. The same path carries anything else.
//
// RULES FOR THIS MAP
//  - Key by QID, never by name — the name is the thing that is wrong.
//  - One line of WHY per entry. An override with no reason is indistinguishable
//    from a typo of our own.
//  - This is a correction layer, not an editorial one. Use it to restore the
//    name a football fan would type, not to pick a preferred nickname.
//  - Re-check periodically: if Wikidata is fixed upstream, the override becomes
//    a no-op, which scripts/fix-pool-names.mjs reports rather than hides.
export const NAME_OVERRIDES = {
  // Vandalised label, live as of 2026-08-05. Real name: Jude Victor William
  // Bellingham. Real Madrid, England, b. 2003-06-29.
  Q66241169: 'Jude Bellingham',

  // Found 2026-10-08 by comparing every pool name with the title of the
  // player's Wikipedia article in six languages, which a label edit does not
  // touch. Each English label below was live on Wikidata that day and every
  // title agreed on the name restored here.
  //
  // Zero for the letter o. Portugal, b. 1986. A SCHEDULED answer: "Moutinho"
  // resolved to nobody, so that day could not have been solved by typing it.
  Q222151: 'João Moutinho',
  // Label was "elpisha" (El Pisha is his nickname). Real Betis, b. 1981.
  Q294204: 'Joaquín',
  // Label was "nisola gaitani". Boca Juniors, Benfica, Atlético Madrid, b. 1988.
  Q372605: 'Nicolás Gaitán',
  // Label was "don panini": his overhead kick is the figure on the Panini
  // sticker packets. Juventus, b. 1921.
  Q1042372: 'Carlo Parola',
  // Zero for the letter o. Ecuador centre-back, b. 1991.
  Q22082660: 'Robert Arboleda',
  // Label was "Cristian Gamboa", ANOTHER Costa Rica international who is in
  // the pool under his own id (Q577471), so the name pointed at two rows.
  // This row is the winger who played for F.C. Copenhagen, b. 1984.
  Q361694: 'Christian Bolaños',
  // Label was "Alfredito Olivas", a Mexican singer. Toluca goalkeeper, b. 1982.
  Q2118086: 'Alfredo Talavera',
  // Label was "Zergio Roquet". Uruguay goalkeeper, b. 1993.
  Q17086753: 'Sergio Rochet',
  // Label was "Kehriba nene". Egypt forward, Zamalek and Al Ahly, b. 1994.
  Q10557534: 'Mahmoud Kahraba',
  // Label was "Miguel Gordillo". Cameroon forward from Barcelona B, b. 1995.
  Q17490: 'Jean Marie Dongou',
};

// Rows where the club under the name is not a club the player played for.
//
// ⚠️ WHY THIS EXISTS. A career on Wikidata is a list of links, and a link can
// point at anything. Found 2026-10-08 by asking Wikidata what sport each
// club in the pool plays: Edwin van der Sar's nine years at Ajax were linked
// to the CITY of Barcelona, so he read "Barcelona" under his name, on a day he
// was the answer too. Milton Casco was a goalkeeper at "Bolivia", the country.
// Andreas Pereira's whole career was a beach soccer club. The pool builder
// takes the longest spell as the label, and a bad link is often the longest.
//
// Each entry corrects the career first and the label follows from it, by the
// builder's own rule: the current club if it is one of the squads we maintain
// in squads.json, otherwise the longest single senior spell. A current club
// outside that file is NOT used as the label: nothing here refreshes it, and
// it would be stale after the next transfer window.
//
//   club / clubId / country   what the pool row carries afterwards
//   drop    [name]            spells that never happened
//   rename  { old: new }      the spell is real, the link was wrong
//   years   { name: [a, b] }  correct a spell's years; b null = still there
//   add     [[name, a, b]]    a missing spell
//   slot / position           only where the row's position was false too
//
// ⚠️ CLUB NAMES ARE COMPARED AS STRINGS. similarity() matches `club` exactly
// and shared spells by the career table's own spelling, so every name below is
// the one other players at that club already carry ("AFC Ajax" in a career,
// "Ajax" as a label). A new spelling would make a team-mate a stranger.
//
// Every career here was checked on 2026-10-08 against Wikipedia in at least
// two languages and a club, league or press source. Spells the checker could
// not confirm were left as they were, not guessed.
export const CLUB_FIXES = {
  // Edwin van der Sar. Ajax 1990-1999 was linked to the city of Barcelona. He
  // never played for FC Barcelona.
  Q482955: { club: 'Ajax', clubId: 'Q81888', country: 'Netherlands',
    rename: { Barcelona: 'AFC Ajax' } },
  // Eran Zahavi. Hapoel Tel Aviv 2006-2011 was linked to the city of Barcelona
  // and Palermo 2011-2013 to Hapoel Hod HaSharon. Retired January 2026.
  Q736391: { club: 'Hapoel Tel Aviv F.C.', clubId: 'Q206585', country: 'Israel',
    rename: { Barcelona: 'Hapoel Tel Aviv F.C.', 'Hapoel Hod HaSharon F.C.': 'Palermo F.C.' },
    add: [['Maccabi Tel Aviv F.C.', 2022, 2025]] },
  // Matteo Gabbia. The only spell was "Villareal", a disambiguation page. AC
  // Milan since 2017, loans at Lucchese and Villarreal.
  Q37893002: { club: 'AC Milan', clubId: 'Q1543', country: 'Italy',
    drop: ['Villareal'],
    add: [['AC Milan', 2017, null], ['Lucchese 1905', 2018, 2019], ['Villarreal CF', 2023, 2024]] },
  // Milton Casco. River Plate 2015-2025 was linked to the country Bolivia, and
  // the row called a left-back a goalkeeper. At Atlético Nacional since 2026.
  Q5676549: { club: 'Club Atlético River Plate', clubId: 'Q15799', country: 'Argentina',
    slot: 'DF', position: 'full-back',
    rename: { Bolivia: 'Club Atlético River Plate' },
    years: { 'Club Atlético River Plate': [2015, 2025] },
    add: [['Atlético Nacional', 2026, null]] },
  // Alberto Quintero. Never played in Newcastle upon Tyne (a city) or for
  // Beşiktaş (linked to the district). Universitario de Deportes 2017-2022.
  Q766988: { club: 'Club Universitario de Deportes', clubId: 'Q19066', country: 'Peru',
    drop: ['Newcastle upon Tyne', 'Beşiktaş'],
    years: { 'Club Universitario de Deportes': [2017, 2022] } },
  // Fabián Estoyanoff. "Centro A" is a place in Italy; the club is Centro
  // Atlético Fénix of Montevideo, where he began and retired.
  Q381787: { club: 'Centro Atlético Fénix', clubId: 'Q978110', country: 'Uruguay',
    rename: { 'Centro A': 'Centro Atlético Fénix' } },
  // Andreas Pereira. Never played for Santos; the link was a beach soccer
  // club. Manchester United 2014-2022 with four loans, Fulham, Palmeiras.
  Q17619350: { club: 'Palmeiras', clubId: 'Q80964', country: 'Brazil',
    drop: ['Santos FC'],
    add: [['Manchester United F.C.', 2014, 2022], ['Granada CF', 2016, 2017], ['Valencia CF', 2017, 2018],
      ['SS Lazio', 2020, 2021], ['Clube de Regatas do Flamengo', 2021, 2022], ['Fulham F.C.', 2022, 2025],
      ['Sociedade Esportiva Palmeiras', 2025, null]] },
  // Ellyse Perry. New South Wales Breakers is her cricket team. Her last
  // football season was 2015-16 at Sydney FC.
  Q600090: { club: 'Sydney FC', clubId: 'Q15649515', country: 'Australia',
    drop: ['New South Wales Breakers'],
    years: { 'Sydney FC': [2012, 2016] } },
  // Cesare Bovo. Pescara Calcio a 5 is a futsal club he never played for; the
  // football club, Delfino Pescara 1936, is already in the career.
  Q367368: { club: 'Torino FC', clubId: 'Q2768', country: 'Italy',
    drop: ['Pescara Calcio a 5'] },
  // Irene Paredes. The Basque Country side is a representative team, the same
  // kind of thing as a national team, which the builder already leaves out.
  Q10524460: { club: 'FC Barcelona Femení', clubId: 'Q522899', country: 'Spain',
    drop: ["Basque Country women's regional association football team"] },
  // Frank Fabra. Never played for Universidad Católica; that spell is Boca
  // Juniors 2016-2025. Back at Independiente Medellín since 2026.
  Q6436974: { club: 'Boca Juniors', clubId: 'Q170703', country: 'Argentina',
    rename: { 'Club Deportivo Universidad Católica': 'Boca Juniors' },
    years: { 'Boca Juniors': [2016, 2025] },
    add: [['Deportivo Independiente Medellín', 2026, null]] },
  // Luan Vieira. "no tiene club actual" is a placeholder; the spell is Grêmio
  // 2014-2019. Without a club since April 2024.
  Q16919481: { club: 'Grêmio FBPA', clubId: 'Q221695', country: 'Brazil',
    rename: { 'no tiene club actual': 'Grêmio FBPA' },
    years: { 'Grêmio FBPA': [2014, 2019] },
    add: [['S.C. Corinthians Paulista', 2020, 2023], ['Santos F.C.', 2022, 2022], ['E.C. Vitória', 2024, 2024]] },
  // Falcão, the futsal player. Grêmio 2020 was seven-a-side. São Paulo FC in
  // 2005 is the only eleven-a-side club he played for, so it is the label; the
  // rest of his career is futsal sections of football clubs and is left alone.
  Q919942: { club: 'São Paulo FC', clubId: 'Q38568', country: 'Brazil',
    drop: ['Grêmio FBPA'] },
  // Nicolás Gaitán. Benfica is right but the spell was open-ended, which
  // scored him as a current Benfica player. He left in 2016.
  Q372605: { club: 'Benfica', clubId: 'Q131499', country: 'Portugal',
    years: { 'S.L. Benfica': [2010, 2016] } },
  // Kristoffer Olsson. Linked to the municipality of Anderlecht, open-ended,
  // which matched him with the current squad. He left in 2023.
  Q14946556: { club: 'R.S.C. Anderlecht', clubId: 'Q187528', country: 'Belgium',
    rename: { Anderlecht: 'R.S.C. Anderlecht' },
    years: { 'R.S.C. Anderlecht': [2021, 2023] } },
  // Carlo Parola. His fifteen years at Juventus were linked to Pro Vercelli,
  // a club he never played for.
  Q1042372: { club: 'Juventus', clubId: 'Q1422', country: 'Italy',
    rename: { 'F.C. Pro Vercelli 1892': 'Juventus FC' } },
  // Alan Pulido. Carries an open-ended Real Madrid membership that never
  // happened, and squads.json still lists him there, so a rebuild labels him
  // Real Madrid. Tigres, Olympiacos, Guadalajara twice, Sporting Kansas City.
  // He used to sit in NOT_IN_SQUAD below, which deletes the row; that was
  // right when the pool was current squads only and wrong now that it is
  // everyone a fan might type. Without a club since April 2026.
  Q2617208: { club: 'Tigres UANL', clubId: 'Q849823', country: 'Mexico',
    drop: ['Real Madrid Club de Fútbol'],
    add: [['Olympiacos F.C.', 2015, 2016], ['C.D. Guadalajara', 2016, 2019],
      ['Sporting Kansas City', 2020, 2024], ['C.D. Guadalajara', 2025, 2026]] },
};

// People in a club's FOOTBALL squad who play another sport for the same club.
// A multi-sport club is one Wikidata item (FC Bayern Munich, FC Barcelona,
// Real Madrid CF), so a basketball or rink hockey player linked to it passes
// fetch-squads' men's-only and football-class filters: the statement is not
// malformed, it is about a different section of the club.
//
// Used twice. fetch-squads.mjs drops these ids from every squad, and
// fix-pool-names.mjs deletes them from the Mystery pool if a rebuild lets one
// in. Found 2026-10-08 by asking Wikidata for the occupation of all 1,545
// squad members; these three are the only ones with no football occupation.
//
// ⚠️ NEVER add a QID that appears in src/data/mysterySchedule.json — the
// schedule is frozen and a removed answer makes that day unplayable. The script
// refuses rather than letting it through.
// ⚠️ NOT FOR A REAL FOOTBALLER IN THE WRONG SQUAD. That is NEVER_AT_CLUB below;
// listing him here would delete him from the pool.
export const NOT_IN_SQUAD = {
  // Basketball. His other teams are Valencia BC, CB Prat, Joventut Badalona
  // and Spain's national BASKETBALL team. Was pickable as a Real Madrid forward.
  Q19845456: 'Alberto Abalde — basketball player, mis-linked to Real Madrid CF',
  // Basketball, b. 2006; position on the row was "shooting guard".
  Q131748678: 'Ivan Volf — basketball player, mis-linked to FC Bayern Munich',
  // Rink hockey: CP Vic, Reus Deportiu, then FC Barcelona's hockey section.
  Q19301771: 'Romà Bancells — rink hockey player, mis-linked to FC Barcelona',
};

// Real footballers with an open-ended membership of a club they were never at.
// fetch-squads.mjs drops the row from that one squad; the player stays in the
// Mystery pool and in the lineup builder under his real club.
export const NEVER_AT_CLUB = {
  // Mexican forward. Tigres, Levadiakos, Olympiacos, Guadalajara, Sporting
  // Kansas City; never signed for Real Madrid. His pool row is corrected by
  // CLUB_FIXES above.
  Q2617208: { squad: 'Real Madrid', why: 'Alan Pulido — never played for Real Madrid' },
};
