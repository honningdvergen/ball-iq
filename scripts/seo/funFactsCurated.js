// CURATED football facts — chosen for SURPRISE first, then verified.
//
// ⚠️ WHY THIS FILE REPLACED THE MINED ONE. The first /fun-facts/ build mined
// `hint` fields out of the question bank. That guaranteed accuracy and
// guaranteed tedium: a hint exists to EXPLAIN an answer, so the selection
// optimised for "verifiable", never for "worth telling someone". Alex, on the
// live page: "those fun facts are not fun at all, they are just facts."
// Accuracy was never the problem. Selection was.
//
// ⚠️ RESEARCHED FROM THE WEB, BUT NOT COPIED FROM IT. A fact is not
// copyrightable; a list's wording and its selection are. So published lists
// were used as LEADS ONLY — every entry below was then confirmed against a
// reliable source and rewritten from scratch. No sentence here is anyone
// else's prose.
//
// ⚠️ LEADS ARE OFTEN WRONG. Spot-checking the lists that seeded this file
// killed several popular "facts" outright:
//   · "San Marino have only ever won once" — STALE. They won again in Sept
//     2024, beating Liechtenstein for a second time, 20 years after the first.
//     The corrected version is a better fact, which is the lesson.
//   · Yashin's "four packets of cigarettes a day" — folklore, repeated
//     everywhere, sourced nowhere. Dropped.
//   · A referee "scoring a goal" in a 1986 Dutch match — no reliable source.
//     Dropped.
//   · Man Utd buying a player "for a freezer of ice cream" — embellished in
//     every retelling. Dropped.
// Anything that could not be stood behind was DROPPED, never softened into a
// hedge. A hedged fun fact is not fun and not a fact.
//
// `src` is the confirming source, kept so the next person can re-check rather
// than re-trust. Facts with a shelf life carry their date IN the sentence, so
// they cannot rot silently (see scripts/audit-season-rot.mjs).
export const CURATED_FACTS = [
  {
    theme: 'Scorelines that should not exist',
    facts: [
      { t: 'The heaviest defeat in football history was entirely self-inflicted. In 2002, Madagascar’s SO l’Emyrne protested a refereeing decision by kicking the ball into their own net from every restart. They lost 149–0, and every single goal was an own goal.', src: 'https://www.theguardian.com/football/2002/nov/01/newsstory.sport' },
      { t: 'Australia beat American Samoa 31–0 in a 2001 World Cup qualifier. Archie Thompson scored 13 of them, which is still the record for goals by one player in an international.', src: 'https://en.wikipedia.org/wiki/Australia_31%E2%80%930_American_Samoa' },
      { t: 'Barbados once deliberately scored an own goal to reach extra time. A 1994 Caribbean Cup rule made golden goals count double, so with a two-goal margin needed, equalising against themselves was the smart play. It worked.', src: 'https://en.wikipedia.org/wiki/Barbados_v_Grenada_(1994_Caribbean_Cup_qualification)' },
      { t: 'In the closing minutes of that same match, Grenada tried to score in either goal — because either would eliminate Barbados — while Barbados defended both ends at once.', src: 'https://en.wikipedia.org/wiki/Barbados_v_Grenada_(1994_Caribbean_Cup_qualification)' },
      { t: 'Spain won the 2010 World Cup scoring eight goals in seven games. Every single knockout match finished 1–0.', src: 'https://en.wikipedia.org/wiki/2010_FIFA_World_Cup' },
      { t: 'Switzerland went out of the 2006 World Cup without conceding a goal in open play all tournament. They lost a shootout to Ukraine without scoring a single penalty.', src: 'https://en.wikipedia.org/wiki/2006_FIFA_World_Cup' },
      { t: 'New Zealand were the only unbeaten team at the 2010 World Cup. Three draws, and they still went home in the group stage.', src: 'https://en.wikipedia.org/wiki/2010_FIFA_World_Cup' },
      { t: 'Australia went through 1998 World Cup qualifying without losing a match — and did not qualify. They beat the Solomon Islands 13–0 along the way, with their goalkeeper on the scoresheet.', src: 'https://en.wikipedia.org/wiki/1998_FIFA_World_Cup_qualification_(OFC)' },
      { t: 'San Marino have won two matches in their history. Both were against Liechtenstein, both finished 1–0, and they came twenty years apart — 2004 and September 2024.', src: 'https://theanalyst.com/articles/san-marino-first-competitive-win' },
      { t: 'The scorer of that 2024 winner, Nicko Sensoli, had not been born the last time San Marino won a game.', src: 'https://www.cbssports.com/soccer/news/san-marino-win-first-match-in-20-years-as-fifas-lowest-ranked-team-edges-lichtenstein-for-historic-feat/' },
      { t: 'Dundee United have played Barcelona four times in Europe and won all four, home and away, in 1966 and 1987. No club has a better record against them.', src: 'https://thesefootballtimes.co/2018/11/16/how-dundee-united-overcame-barcelona-to-reach-the-uefa-cup-final-in-1987/' },
    ],
  },
  {
    theme: 'Referees, rules and red cards',
    facts: [
      { t: 'A Sunday-league player named Lee Todd was sent off two seconds into a match. The referee blew the opening whistle behind him, Todd swore in surprise, and that was that.', src: 'https://www.theguardian.com/football/2000/jan/24/newsstory.sport3' },
      { t: 'Gary Lineker played his entire professional career — including two World Cups and 80 England caps — without receiving a single yellow card.', src: 'https://en.wikipedia.org/wiki/Gary_Lineker' },
      { t: 'Ryan Giggs was never sent off in 963 appearances for Manchester United across 24 seasons. His only red card came playing for Wales.', src: 'https://www.premierleague.com/players/335/Ryan-Giggs/stats' },
      { t: 'Zinedine Zidane’s headbutt in the 2006 World Cup final was missed by the referee live. It became the first sending-off in football given after an official consulted video footage — eleven years before VAR existed.', src: 'https://en.wikipedia.org/wiki/2006_FIFA_World_Cup_final' },
      { t: 'A goal has been awarded in the Premier League after the ball hit a beach ball. Darren Bent’s shot for Sunderland in 2009 struck an inflatable thrown by away fans, wrong-footed Pepe Reina, and stood.', src: 'https://en.wikipedia.org/wiki/Beach_ball_goal' },
      { t: 'World Cup group matches all kick off simultaneously because of one game. In 1982 West Germany and Austria played out a result that suited both and eliminated Algeria; the rule changed by the next tournament.', src: 'https://en.wikipedia.org/wiki/Disgrace_of_Gij%C3%B3n' },
      { t: 'Asmir Begović scored from 91.9 metres for Stoke in 2013 — the longest goal ever recorded. It took thirteen seconds and he had touched the ball once.', src: 'https://www.guinnessworldrecords.com/world-records/longest-goal-scored-in-football-(soccer)' },
      { t: 'An Irish trophy has been decided on corners. The 1969 President’s Cup finished 0–0, so Shamrock Rovers took it 14–7 on corner kicks.', src: 'https://en.wikipedia.org/wiki/Shamrock_Rovers_F.C.' },
    ],
  },
  {
    theme: 'Contracts, transfers and paperwork',
    facts: [
      { t: 'Sunderland once wrote a space-travel clause into a contract. Stefan Schwarz’s adviser had put a deposit down on a commercial spaceflight, so the club specified that leaving Earth’s atmosphere would void the deal.', src: 'https://en.wikipedia.org/wiki/Stefan_Schwarz' },
      { t: 'Southampton once gave a Premier League debut to a man who had faked his own career. In 1996 "Ali Dia" was recommended by a caller impersonating George Weah, came off the bench against Leeds — and was substituted before the end.', src: 'https://en.wikipedia.org/wiki/Ali_Dia' },
      { t: 'Michael Owen played nine times for Stoke City and started none of them. He is the only Ballon d’Or winner to appear for the club, entirely as a substitute.', src: 'https://en.wikipedia.org/wiki/Michael_Owen' },
      { t: 'The world transfer record has been broken by a Scottish club. In 1922 Falkirk paid West Ham £5,000 for Syd Puddefoot, the highest fee anyone had ever paid.', src: 'https://en.wikipedia.org/wiki/Syd_Puddefoot' },
      { t: 'Zlatan Ibrahimović played for six clubs that have won the European Cup — Ajax, Juventus, Internazionale, Barcelona, Milan and Manchester United — and never won it himself.', src: 'https://en.wikipedia.org/wiki/Zlatan_Ibrahimovi%C4%87' },
    ],
  },
  {
    theme: 'Players who ignored the odds',
    facts: [
      { t: 'Bert Trautmann broke his neck in the 1956 FA Cup final and played the last seventeen minutes anyway. Manchester City won 3–1; the fracture was only found three days later.', src: 'https://en.wikipedia.org/wiki/Bert_Trautmann' },
      { t: 'Trautmann had arrived in England as a German prisoner of war, stayed after release, and went on to be voted Footballer of the Year.', src: 'https://en.wikipedia.org/wiki/Bert_Trautmann' },
      { t: 'A goalkeeper has scored 131 competitive goals. Rogério Ceni took São Paulo’s free kicks and penalties for two decades and out-scored most strikers of his era.', src: 'https://en.wikipedia.org/wiki/Rog%C3%A9rio_Ceni' },
      { t: 'Garrincha, a two-time World Cup winner and arguably the best dribbler who ever lived, had legs of different lengths and a curved spine from childhood polio.', src: 'https://en.wikipedia.org/wiki/Garrincha' },
      { t: 'Robert Schlienz lost an arm in a car crash in 1948, returned to football four months later, and captained Stuttgart to two German championships.', src: 'https://de.wikipedia.org/wiki/Robert_Schlienz' },
      { t: 'Harald Bohr won an Olympic silver medal for Denmark in 1908 and later became a distinguished mathematician. His brother Niels won the Nobel Prize in Physics.', src: 'https://en.wikipedia.org/wiki/Harald_Bohr' },
      { t: 'William "Fatty" Foulke kept goal for England while weighing around 140kg. He won the league and two FA Cups with Sheffield United.', src: 'https://en.wikipedia.org/wiki/William_Foulke_(footballer)' },
      { t: 'Guillermo Stábile was the top scorer at the first World Cup in 1930 despite never having played for Argentina before the tournament. He never played for them again either.', src: 'https://en.wikipedia.org/wiki/Guillermo_St%C3%A1bile' },
    ],
  },
  {
    theme: 'Records with a twist in them',
    facts: [
      { t: 'Nottingham Forest have won the European Cup more times than they have won their own league. Two European titles, one English championship.', src: 'https://en.wikipedia.org/wiki/Nottingham_Forest_F.C._in_European_football' },
      { t: 'Forest are also the only European champions to be relegated two divisions afterwards.', src: 'https://en.wikipedia.org/wiki/Nottingham_Forest_F.C.' },
      { t: 'Paolo Maldini lifted the European Cup at a ground in England exactly forty years after his father Cesare captained Milan to the same trophy, also in England.', src: 'https://en.wikipedia.org/wiki/Paolo_Maldini' },
      { t: 'The last club to win three consecutive FA Cups did it in the 1880s. Blackburn Rovers managed it between 1884 and 1886, and nobody has since.', src: 'https://en.wikipedia.org/wiki/Blackburn_Rovers_F.C.' },
      { t: 'José Mourinho went more than nine years without losing a home league match, across Porto, Chelsea, Internazionale and Real Madrid — around 150 games.', src: 'https://en.wikipedia.org/wiki/Jos%C3%A9_Mourinho' },
      { t: 'France arrived at the 2002 World Cup with the reigning top scorers of the Premier League, Serie A and Ligue 1 in their squad. They went out in the group stage without scoring a goal.', src: 'https://en.wikipedia.org/wiki/2002_FIFA_World_Cup' },
      { t: 'The first fifty Premier League goals scored by Bosnian players were all scored by the same man, Edin Džeko.', src: 'https://en.wikipedia.org/wiki/Edin_D%C5%BEeko' },
      { t: 'Pelé’s own career goal count of 1,283 includes friendlies, youth games and army matches. His total in official competitive football is 757 — still extraordinary, just a different number.', src: 'https://en.wikipedia.org/wiki/Pel%C3%A9' },
      { t: 'A version of football was played in China more than two thousand years ago. FIFA recognises cuju as the earliest known form of the game.', src: 'https://en.wikipedia.org/wiki/Cuju' },
      { t: 'India withdrew from the 1950 World Cup after qualifying. The reasons were mostly cost and travel — the popular story that FIFA banned them for playing barefoot is a myth their own federation has denied.', src: 'https://en.wikipedia.org/wiki/India_at_the_FIFA_World_Cup' },
    ],
  },
];
