// PLAYER SEO PAGE CONTENT — original prose, fact-checked (currency as of the
// 2025-26 season / 2026-07). Consumed by scripts/gen-seo-pages.mjs
// (buildPlayerPage), which pulls the sample Q&A from src/questions.js by
// TEXT-MATCHING the player (there is no `player` field on questions — a
// question is "about" a player if `match` appears in the stem or the correct
// answer). Mirrors the club-page shape (intro = 3-4 paras, faq = 4 Q&As) plus:
//   - `match`  case-insensitive alternatives used to filter the question bank.
//   - `slug`   → /quiz/<slug>/ (short, matches "<name> quiz" searches).
//   - `initials` badge text (no player photos — identification/editorial only).
//
// Pilot: the two highest-coverage players. Scale = add entries here; the
// generator + routing are data-driven. Every claim below was web-verified.
export const PLAYERS = [
  {
    slug: 'ronaldo',
    match: ['Ronaldo'],
    name: 'Cristiano Ronaldo',
    initials: 'CR7',
    h1: 'Cristiano Ronaldo Quiz',
    title: 'Cristiano Ronaldo Quiz — CR7 Trivia Questions & Answers | Ball IQ',
    description: "Free Cristiano Ronaldo quiz with explained answers — Sporting to Al-Nassr, five Ballon d'Ors, and the all-time goal records. Play in your browser.",
    intro: [
      "Cristiano Ronaldo is football's great record-hunter — the man who turned relentless self-improvement into the longest sustained peak the game has seen. This free Ronaldo quiz runs the whole arc: the skinny Sporting Lisbon winger Alex Ferguson signed in 2003, the Manchester United treble-chaser who left as a Ballon d'Or winner, the Real Madrid machine who scored 450 goals in nine seasons, the Juventus gamble, the emotional 2021 return to Old Trafford, and the move to Al-Nassr that opened Saudi football to the world. Five Ballon d'Ors, a European Championship with Portugal in 2016, and — as of 2026 — the status of the all-time top scorer in both men's international football and the recognised game. If you can name the club he scored his 900th goal against, this quiz is for you.",
      "The record book is the story. He is the only player to win league titles in England, Spain and Italy; the only man to reach 100 goals for four different clubs, a milestone he hit at Al-Nassr; and, in February 2026, the first player in history to score 500 career goals after turning 30. He led Al-Nassr to the 2026 Saudi Pro League title and finished the league's top scorer in 2024 and 2025. For Portugal he has more caps and more goals than anyone in men's international history, capped by that header against France in the Euro 2016 final and the 2019 Nations League.",
      "Expect the full spread. Transfers — the then-world-record £80m to Real Madrid in 2009, the £99.2m to Juventus in 2018, the free return to United in 2021. Records — his five Champions League titles, the Ballon d'Or years (2008, and four in five seasons at Madrid), the Champions League all-time scoring mark. And the moments only diehards carry: the bicycle kick against Juventus that earned a standing ovation from the home crowd, the hat-trick against Spain at the 2018 World Cup, the free-kick that opened it. Difficulty climbs from easy (which country does he play for?) to genuinely hard (who did Madrid beat in his first Champions League final there, and where?).",
      "Every question comes with a short explained answer, so even a miss teaches you the detail that makes it stick — why 2016 meant so much despite him limping off injured, or how a release clause set the Juventus move in motion. Play the sample set below free in your browser, no sign-up. When you want more football trivia — 4,000+ questions, a daily word game and multiplayer — it's all in the Ball IQ app.",
    ],
    faq: [
      { q: 'Which clubs has Cristiano Ronaldo played for?', a: 'Sporting Lisbon (2002-03), Manchester United (2003-09), Real Madrid (2009-18), Juventus (2018-21), Manchester United again (2021-22) and Al-Nassr (since January 2023). He is the only player to win league titles in England, Spain and Italy.' },
      { q: "How many Ballon d'Or awards has Ronaldo won?", a: "Five — in 2008 (at Manchester United) and 2013, 2014, 2016 and 2017 at Real Madrid. Only Lionel Messi, with eight, has won more." },
      { q: 'Is the Ronaldo quiz free to play?', a: 'Yes — the sample questions are free in your browser with no sign-up, and the full Ball IQ app has 4,000+ football questions plus daily challenges and multiplayer.' },
      { q: 'How hard is the Ronaldo quiz?', a: 'It runs from easy (which national team he captains) to hard (specific finals, transfer fees and scoring records). Every answer is explained, so you learn even when you miss.' },
    ],
  },
  {
    slug: 'messi',
    match: ['Messi'],
    name: 'Lionel Messi',
    initials: 'LM10',
    h1: 'Lionel Messi Quiz',
    title: 'Lionel Messi Quiz — Trivia Questions & Answers | Ball IQ',
    description: 'Free Lionel Messi quiz with explained answers — Barcelona, the 2022 World Cup, eight Ballon d\'Ors and Inter Miami. Play free in your browser.',
    intro: [
      "Lionel Messi is, by most measures, the most decorated footballer who has ever lived — and the one whose story finally found its perfect ending. This free Messi quiz spans all of it: the Rosario boy whose growth-hormone treatment Barcelona famously agreed to fund on a napkin, the teenager who broke into Frank Rijkaard's side, the heart of Pep Guardiola's 2009-11 team widely called the greatest of all, the all-time top scorer for a single club with 672 goals for Barcelona, the shock 2021 exit to Paris Saint-Germain, and the move to Inter Miami in 2023 that turned MLS upside down. Eight Ballon d'Ors, four Champions Leagues, and — at last — the 2022 World Cup. If you know which country Barcelona signed him from, this quiz is for you.",
      "The defining night came in Qatar. On 18 December 2022, Messi captained Argentina to the World Cup, scoring twice in the final and converting in the shoot-out to beat France in one of the greatest finals ever played — the trophy that had eluded Diego Maradona's heir for four tournaments. It brought his eighth Ballon d'Or in 2023. And the story kept giving: at Inter Miami he won the 2025 MLS Cup and back-to-back league MVP awards, and at the 2026 World Cup, aged 38, he scored a record-setting hat-trick against Algeria to become the oldest man to do so, on his way to overtaking Miroslav Klose as the tournament's all-time top scorer.",
      "Expect the full spread. Records — his 672 Barcelona goals, the six Ballon d'Ors he had before anyone else reached five, the 91 goals in the calendar year 2012. Transfers — the free move to PSG in 2021, the Inter Miami deal in 2023 he has since extended through 2028. Moments — the solo goal against Getafe that echoed Maradona's 1986 run, the chip against Real Madrid, the last-minute winner in the Clásico he celebrated by holding his shirt up to the Bernabéu. Difficulty climbs from easy (how many Ballon d'Ors?) to hard (who Argentina beat in the 2021 Copa América final that started the run).",
      "Every question comes with a short explained answer, so even a miss leaves you knowing more — why 2022 meant everything, or how a napkin became folklore. Play the sample set below free in your browser, no sign-up. When you want more — 4,000+ questions, a daily word game and multiplayer — it lives in the Ball IQ app.",
    ],
    faq: [
      { q: "How many Ballon d'Or awards has Lionel Messi won?", a: "Eight — the most in history: 2009, 2010, 2011, 2012, 2015, 2019, 2021 and 2023 (after winning the 2022 World Cup). Cristiano Ronaldo is next with five." },
      { q: 'Which clubs has Messi played for?', a: 'Barcelona (2004-21), where he is the all-time top scorer with 672 goals, then Paris Saint-Germain (2021-23) and Inter Miami (since 2023, under contract through 2028).' },
      { q: 'Did Lionel Messi win the World Cup?', a: 'Yes — he captained Argentina to the 2022 World Cup in Qatar, scoring twice in the final and in the shoot-out to beat France. It was widely seen as the trophy that completed his career.' },
      { q: 'Is the Messi quiz free to play?', a: 'Yes — the sample questions are free in your browser with no sign-up, and the full Ball IQ app has 4,000+ football questions plus daily challenges and multiplayer.' },
    ],
  },
  {
    "slug": "zidane",
    "match": [
      "Zidane"
    ],
    "name": "Zinedine Zidane",
    "initials": "ZZ5",
    "h1": "Zinedine Zidane Quiz",
    "title": "Zinedine Zidane Quiz — Trivia Questions & Answers | Ball IQ",
    "description": "Test your Zinedine Zidane knowledge — clubs, the €77.5m Madrid move, the Hampden volley, 1998 and 2006. Free to play in your browser, no sign-up.",
    "intro": [
      "Zinedine Zidane is football's great artist — the languid, unbothered genius who made the game look like it was happening at his own tempo while everyone else scrambled. This free Zidane quiz runs the whole arc: the kid from La Castellane in Marseille who broke through at Cannes, the elegant playmaker who became a star at Bordeaux, the Juventus No. 21 who won back-to-back Scudetti in 1997 and 1998, and the €77.5m Galactico Real Madrid made the most expensive player on earth in 2001. He was crowned the 1998 Ballon d'Or winner and named FIFA World Player of the Year three times, in 1998, 2000 and 2003. If you can name the club Madrid signed him from for that world-record fee, this quiz is for you.",
      "His two defining nights sit at opposite ends of the emotional spectrum. On 12 July 1998 he rose twice to head France to their first World Cup, two goals in the final against Brazil at the Stade de France that turned him into a national monument. Then, on 15 May 2002 at Hampden Park, came the goal they still show on loop: a left-footed volley on the stroke of half-time against Bayer Leverkusen to win La Novena, Madrid's ninth European Cup, later voted the greatest goal in Champions League history. And there is the other bookend — 9 July 2006, his final act as a player, the headbutt on Marco Materazzi and a red card in extra time of a World Cup final France would lose on penalties. He still won the Golden Ball as the tournament's best player.",
      "Expect the full spread. Some questions are gentle — which country did Zidane win the 1998 World Cup with? Others reward the real students: the £46m/€77.5m Madrid transfer that stood as a world record for eight years, his 108 caps and 31 goals for France, the two Serie A titles at Juventus set against two lost Champions League finals, and his second life in the dugout, where he became the first manager to win the Champions League three times in a row with Real Madrid. As of 2026, he is out of club management and widely reported to have agreed to take charge of France after the 2026 World Cup.",
      "Every question comes with a short explained answer, so you learn the story behind the moment, not just the result. Play the sample set below free in your browser, no sign-up. If it grabs you, the full Ball IQ app has 4,000+ questions plus daily challenges and multiplayer."
    ],
    "faq": [
      {
        "q": "Which clubs did Zinedine Zidane play for?",
        "a": "Zidane came through at Cannes before establishing himself at Bordeaux (1992–96). He then joined Juventus, where he won two Serie A titles, and in 2001 moved to Real Madrid for a world-record fee, staying until he retired after the 2006 World Cup."
      },
      {
        "q": "What did Zidane win — Ballon d'Ors, trophies and records?",
        "a": "As a player he won the 1998 Ballon d'Or and was FIFA World Player of the Year in 1998, 2000 and 2003. He lifted the 1998 World Cup and Euro 2000 with France, plus the 2002 Champions League with Madrid (that Hampden volley). As a manager he became the first to win the Champions League three seasons running with Real Madrid."
      },
      {
        "q": "Is the Zidane quiz free to play?",
        "a": "Yes. The sample set runs free in your browser with no sign-up. The full Ball IQ app adds 4,000+ questions across players, clubs and competitions, plus daily challenges and multiplayer modes."
      },
      {
        "q": "How hard is the Zidane quiz?",
        "a": "It climbs from easy to hard — starting with the headline facts any fan knows and building to the deep cuts on transfer fees, caps and records. Every answer comes with a short explanation, so you pick up the stories even on the ones you miss."
      }
    ]
  },
  {
    "slug": "maradona",
    "match": [
      "Maradona"
    ],
    "name": "Diego Maradona",
    "initials": "D10",
    "h1": "Diego Maradona Quiz",
    "title": "Diego Maradona Quiz — Trivia Questions & Answers | Ball IQ",
    "description": "Free Diego Maradona quiz: Boca, Barcelona, Napoli, the Hand of God and Goal of the Century, 1986 and more. Play the sample set in your browser, no sign-up.",
    "intro": [
      "Diego Maradona is football's ultimate lightning rod — the flawed, fearless genius who dragged whole teams to glory on the strength of his left foot alone. This free Maradona quiz runs the whole arc: the teenage prodigy who broke into the Argentinos Juniors side ten days before his 16th birthday, the Boca Juniors idol who won the 1981 Metropolitano, the record-breaking move to Barcelona in 1982, the seven unforgettable years at Napoli where he turned a mid-table southern club into champions of Italy, and the late stops at Sevilla, Newell's Old Boys and a homecoming at Boca. Crowning it all: dragging Argentina to the 1986 World Cup almost single-handedly. If you know which club Barcelona signed him from, this quiz is for you.",
      "The defining hour came on 22 June 1986 at the Azteca, in a World Cup quarter-final against England charged with post-Falklands tension. Within four minutes Maradona produced both the sublime and the scandalous — first the 'Hand of God', punched past Peter Shilton, then the 'Goal of the Century', a 60-yard slalom past half the England team that FIFA's own 2002 poll would crown the greatest goal in World Cup history. He lifted the trophy and the Golden Ball as the tournament's finest player. At Napoli he was even more transformative: two Serie A titles (1986-87 and 1989-90), the 1989 UEFA Cup and a Coppa Italia — the only league titles in the club's history until 2023. Note one quirk of the era: Maradona never won a competitive Ballon d'Or, which stayed European-only for most of his peak; France Football handed him an honorary Golden Ball in 1995 to correct the record.",
      "Expect the full spread. Easy opener: which country did Maradona captain to World Cup glory in 1986? Mid-range: name the two clubs he broke the world transfer record with, first in 1982 and again in 1984. Harder: the quiz digs into the fees, the managers, the numbers — his 34 goals in 91 caps across four World Cups, the 1990 final defeat to West Germany, his second spell at Boca, and the shirt number that became inseparable from his name. Transfers, records, iconic moments and the men who built the teams around him all get their turn.",
      "Every question comes with a short explained answer, so you finish knowing more than when you started — the story behind the fee, the date, the record. Play the sample set below free in your browser, no sign-up. And if it grabs you, the full Ball IQ app has 4,000+ questions plus daily challenges and multiplayer."
    ],
    "faq": [
      {
        "q": "Which clubs did Diego Maradona play for?",
        "a": "Maradona began at Argentinos Juniors (1976-81), then Boca Juniors (1981-82), before a world-record move to Barcelona (1982-84). His most storied spell came at Napoli (1984-91), where he won two Serie A titles and the UEFA Cup. He later played for Sevilla (1992-93), Newell's Old Boys (1993) and returned to Boca Juniors (1995-97) to close out his career."
      },
      {
        "q": "What did Maradona win, and did he win a Ballon d'Or?",
        "a": "His crowning achievement was the 1986 World Cup, where he also took the Golden Ball as the tournament's best player, plus a runners-up medal in 1990. At Napoli he won two Serie A titles (1986-87, 1989-90), the 1989 UEFA Cup, a Coppa Italia and a Supercoppa. He never won a competitive Ballon d'Or — it was European-players-only through his peak — but France Football awarded him an honorary Golden Ball in 1995."
      },
      {
        "q": "Is the Maradona quiz free to play?",
        "a": "Yes. The sample set on this page is completely free to play in your browser with no sign-up and no download. If you want more, the full Ball IQ app has 4,000+ questions across players, clubs and competitions, plus daily challenges and multiplayer modes."
      },
      {
        "q": "How hard is the Maradona quiz?",
        "a": "It climbs from easy to hard. Openers cover the headlines — the 1986 World Cup, Napoli, the Hand of God — while later questions test transfer fees, dates, cap and goal totals and the finer details of his managers and era. Every answer comes with a short explanation, so it rewards you whether you're a casual fan or a completist."
      }
    ]
  },
  {
    "slug": "pele",
    "match": [
      "Pel[eé]"
    ],
    "name": "Pelé",
    "initials": "P10",
    "h1": "Pelé Quiz",
    "title": "Pelé Quiz — Trivia Questions & Answers | Ball IQ",
    "description": "Test yourself on Pelé: Santos, the New York Cosmos, three World Cups and 1,000-plus goals. A free Pelé quiz with every answer explained — play in your browser.",
    "intro": [
      "Pelé is the man against whom every debate about football's greatest still begins — the teenager who won a World Cup and never really stopped. This free Pelé quiz runs the whole arc: the 15-year-old Waldemar de Brito delivered to Santos in 1956, the phenomenon who tore up Brazilian football through the 1960s and made Santos world champions, the three-time World Cup winner, and the ageing king who crossed the Atlantic in 1975 to launch the game in America with the New York Cosmos. Only two professional clubs in a career that spanned two decades and, by FIFA's count, well over a thousand goals. If you can name the club he scored his 1,000th goal against, this quiz is for you.",
      "The defining moments arrived early and never stopped. At the 1958 World Cup in Sweden he became the youngest man ever to win the tournament, at 17, and scored a brace in the final against the hosts — still the youngest player to score in a World Cup final. He won again in 1962, then produced perhaps his masterpiece in Mexico 1970, opening the scoring in the final against Italy and setting up two more as Brazil kept the Jules Rimet Trophy for good. He remains, as of 2026, the only man to win three World Cups. In between came the landmarks: 643 goals for Santos — the most for a single club until Lionel Messi passed it in December 2020 — the two Copa Libertadores and Intercontinental Cups of 1962 and 1963, and the 1,000th goal, a penalty at a packed Maracanã against Vasco da Gama in November 1969.",
      "Expect the full spread. Some of it you'll know cold — the country he won all three World Cups for, say — but the quiz climbs fast. It digs into the Santos golden era and the managers around him, his 77 goals in 92 games for Brazil, the reported $7 million the Cosmos paid to bring him out of retirement in 1975, and the finer print: the opponent in his 1956 Santos debut, the honours he collected in the NASL, and just how Brazil kept a global superstar from ever leaving for Europe.",
      "Every question comes with a short explained answer, so you finish the set knowing more than when you started. Play the sample set below free in your browser, no sign-up. And if it grips you, the full Ball IQ app has 4,000+ questions plus daily challenges and multiplayer."
    ],
    "faq": [
      {
        "q": "Which clubs did Pelé play for?",
        "a": "Remarkably for a player of his stature, Pelé turned out for only two professional clubs. He spent nearly two decades at Santos in Brazil (1956–1974), the club where he scored 643 official goals and won two Copa Libertadores and two Intercontinental Cups, before joining the New York Cosmos of the North American Soccer League in 1975, where he played until retiring in 1977. He famously never played club football in Europe."
      },
      {
        "q": "What did Pelé win, and what records does he hold?",
        "a": "Pelé is the only player in history to win three World Cups — 1958, 1962 and 1970 — and, at 17 in 1958, the youngest to win the tournament and the youngest to score in a final. With Santos he won six Brazilian championships, two Copa Libertadores and two Intercontinental Cups, and with the Cosmos he lifted the 1977 Soccer Bowl. He scored 77 goals in 92 games for Brazil and was named FIFA Player of the Century in 2000. Note he never won a competitive Ballon d'Or — the award was restricted to European players for most of his career."
      },
      {
        "q": "Is the Pelé quiz free to play?",
        "a": "Yes. The sample Pelé quiz runs free in your browser with no sign-up — just start answering. If you want more, the full Ball IQ app carries 4,000+ questions across players, clubs and competitions, plus daily challenges and multiplayer modes."
      },
      {
        "q": "How hard is the Pelé quiz?",
        "a": "It's built to climb from easy to hard. Openers reward anyone who knows the broad strokes of his career, then it works up to Santos-era detail, his international record and the story behind the Cosmos move. Every question comes with a short explained answer, so it doubles as a way to learn the fuller Pelé story."
      }
    ]
  },
  {
    "slug": "mbappe",
    "match": [
      "Mbapp"
    ],
    "name": "Kylian Mbappé",
    "initials": "KM",
    "h1": "Kylian Mbappé Quiz",
    "title": "Kylian Mbappé Quiz — Trivia Questions & Answers | Ball IQ",
    "description": "Free Kylian Mbappé quiz: Monaco, PSG and Real Madrid, the 2018 World Cup, that 2022 final hat-trick and his records. Play the sample set free, no sign-up.",
    "intro": [
      "Kylian Mbappé is the phenomenon who arrived fully formed and never slowed down — the teenager who looked like a finished superstar before he could legally sign his own contracts. This free Mbappé quiz runs the whole arc: the 16-year-old who became Monaco's youngest-ever debutant and tore Europe apart on the way to their first Ligue 1 title in 17 years, the €180m move to Paris Saint-Germain in 2017 that made him the second-most-expensive footballer on earth, the seven trophy-laden seasons that left him PSG's all-time top scorer, and the free transfer to Real Madrid in 2024 that he'd chased for years. And through it all, a World Cup winner at 19. If you know which club Real Madrid prised him away from — and for what fee — this quiz is for you.",
      "The defining moments come thick and fast. On 15 July 2018, aged 19, he scored in the World Cup final against Croatia to become the second teenager after Pelé to find the net in the showpiece, and left Russia with a winner's medal and the Best Young Player award. Four years later, on 18 December 2022, he produced one of the great individual performances in a losing cause — a hat-trick in the final against Argentina, the first treble in a World Cup final since Geoff Hurst in 1966 — only for France to fall on penalties. He still took the Golden Boot. Then the cruellest twist of all: he left Paris in 2024, and the very next season PSG won their first-ever Champions League, thrashing Inter 5-0, before retaining it in 2026. As of 2026 the biggest prize in club football still eludes him — even as he swept the Pichichi and the European Golden Shoe in his debut Madrid campaign and finished the 2025-26 season as the Champions League's top scorer.",
      "Expect the full spread. The quiz climbs from the gentle — which country does he play for, which Spanish giant signed him in 2024 — through the era-defining transfers and fees, the managers and the trophies, right up to the deep cuts: the exact margin of his record-breaking free transfer, the club he became all-time leading scorer for and the goal tally he set there, the tournament records, and the moment he overtook Olivier Giroud to become France's all-time top scorer. If you can place the dates on the two World Cup finals and name the opponents, you're already ahead of most.",
      "Every question comes with a short explained answer, so you learn the story behind the record rather than just ticking a box. Play the sample set below free in your browser, no sign-up. If you want more, the full Ball IQ app has 4,000+ questions plus daily challenges and multiplayer."
    ],
    "faq": [
      {
        "q": "Which clubs did Kylian Mbappé play for?",
        "a": "He came through at Monaco, where he made his debut at 16 and won the 2016-17 Ligue 1 title, before a €180m move to Paris Saint-Germain in 2017. After seven seasons in Paris — finishing as the club's all-time top scorer with six Ligue 1 titles — he joined Real Madrid on a free transfer in 2024, where he remains as of 2026."
      },
      {
        "q": "What has Mbappé won, and does he have a Ballon d'Or?",
        "a": "The headline honour is the 2018 World Cup, won at 19, plus the 2022 Golden Boot for his final hat-trick against Argentina. Domestically he has six Ligue 1 titles with PSG and, at Real Madrid, the Pichichi and European Golden Shoe in 2024-25. He is France's all-time top scorer. As of 2026, though, he has never won the Ballon d'Or — his best finish was third in 2023 — and is still chasing his first Champions League."
      },
      {
        "q": "Is the Mbappé quiz free to play?",
        "a": "Yes. The sample set runs free in your browser with no sign-up. The full Ball IQ app goes further with 4,000+ questions across players, clubs and competitions, plus daily challenges and multiplayer."
      },
      {
        "q": "How hard is the Mbappé quiz?",
        "a": "It scales from easy to hard — openers anyone can name, building to transfer fees, record dates and tournament deep cuts. Every answer comes with a short explanation, so it rewards the curious as much as the expert."
      }
    ]
  },
  {
    "slug": "ibrahimovic",
    "match": [
      "Ibrahimovi[cć]"
    ],
    "name": "Zlatan Ibrahimović",
    "initials": "IZ",
    "h1": "Zlatan Ibrahimović Quiz",
    "title": "Zlatan Ibrahimović Quiz — Trivia Questions & Answers | Ball IQ",
    "description": "Free Zlatan Ibrahimović quiz: Malmö to Milan, the bicycle kick, 62 Sweden goals and 34 trophies. Play the sample set in your browser, no sign-up.",
    "intro": [
      "Zlatan Ibrahimović is football's great swaggering nomad — the striker who treated every dressing room in Europe as his own and left most of them with a title on the wall. This free Zlatan quiz runs the whole arc: the teenage Malmö FF forward who left for Ajax in 2001, the Juventus and Inter years where he became a Serie A monster, the single crackling season under Guardiola at Barcelona, the return to AC Milan, the four-year reign at PSG, the Manchester United gamble, the Hollywood swansong at LA Galaxy, and the improbable second act back at Milan that ended with him retiring in 2023 at 41. Thirty-four trophies, Sweden's all-time top scorer, and yet — famously — never a Champions League winner. If you can name the club that swapped Samuel Eto'o and a pile of cash to sign him in 2009, this quiz is for you.",
      "The defining Zlatan moment needs no context. On 14 November 2012, in the very first match at Stockholm's new Friends Arena, he scored all four goals in a 4-2 win over England — and the last was an audacious back-pedalling bicycle kick from distance, over the stranded Joe Hart. It won the 2013 Puskás Award and remains the reference point for the audacious-goal argument. But the numbers around it are just as absurd: 62 goals in 122 caps for Sweden, twelve Guldbollen as national player of the year, and league titles in the Netherlands, Italy, Spain and France. His Juventus title-winning years were later stripped in the Calciopoli scandal, so he simply moved to Inter and won three more on the pitch. He is one of the few to score in four consecutive decades.",
      "Expect the full spread. Some of it is gentle — which Scandinavian club did he leave to join Ajax as a teenager? Some of it rewards the real watcher: the era-by-era manager clashes (that \"you bought a Ferrari and drive it like a Fiat\" jab at Guardiola), the record transfer fees that made him one of the most expensive players of his time, the free transfers that took him to Old Trafford and back to Milan, and the deep cuts — the exact scoreline the night he broke Sven Rydell's 82-year Sweden scoring record. Transfers and fees, records, the managers and eras, the iconic moments: it climbs from warm-up to genuinely hard.",
      "Every question comes with a short explained answer, so you finish knowing more than when you started — the story behind the transfer, the date, the record. Play the sample set below free in your browser, no sign-up. And if it gets its hooks in you, the full Ball IQ app has 4,000+ questions plus daily challenges and multiplayer to test yourself against friends."
    ],
    "faq": [
      {
        "q": "Which clubs did Zlatan Ibrahimović play for?",
        "a": "In order: Malmö FF (1999–2001), Ajax (2001–2004), Juventus (2004–2006), Inter (2006–2009), Barcelona (2009–2011), AC Milan (2010–2012), Paris Saint-Germain (2012–2016), Manchester United (2016–2018), LA Galaxy (2018–2019) and a return to AC Milan (2020–2023), where he retired. Nine clubs across seven countries — and for his native Sweden, he remains the all-time leading scorer."
      },
      {
        "q": "What did Zlatan Ibrahimović win, and did he ever win the Ballon d'Or or Champions League?",
        "a": "He never won either — a famous quirk of his career, given he played for Juventus, Inter, Barcelona, Milan and PSG. His Ballon d'Or best was fourth in 2013. But he won roughly 34 trophies, including league titles in the Netherlands, Italy, Spain and France, a Europa League and EFL Cup at Manchester United, the 2013 Puskás Award for his bicycle kick against England, and twelve Guldbollen as Sweden's player of the year. As of 2026 he is Sweden's record scorer with 62 goals."
      },
      {
        "q": "Is the Zlatan Ibrahimović quiz free to play?",
        "a": "Yes. The sample set on this page is completely free and runs right in your browser — no sign-up, no download. It is a taster of the full Ball IQ app, which has 4,000+ questions across players, clubs and competitions, plus daily challenges and multiplayer modes."
      },
      {
        "q": "How hard is the Zlatan Ibrahimović quiz?",
        "a": "It scales from easy to hard. Early questions cover the headline career beats — clubs, big goals, trophies — while later ones dig into transfer fees, manager-era detail and record-breaking nights that only close followers will nail. Every answer comes with a short explanation, so it doubles as a way to learn the full Zlatan story."
      }
    ]
  },
  {
    "slug": "haaland",
    "match": [
      "Haaland"
    ],
    "name": "Erling Haaland",
    "initials": "EH9",
    "h1": "Erling Haaland Quiz",
    "title": "Erling Haaland Quiz — Trivia Questions & Answers | Ball IQ",
    "description": "The free Erling Haaland quiz — from Salzburg's teen sensation to Manchester City's record-breaker and Norway's talisman. Easy to hard, every answer explained.",
    "intro": [
      "Erling Haaland is the most ruthless goal machine of his generation — a giant, left-footed Norwegian who turned scoring into something close to a mechanical certainty. This free Haaland quiz runs the whole arc: the Bryne boy who moved to Molde under Ole Gunnar Solskjær, the teenager who detonated at RB Salzburg, the Borussia Dortmund phenomenon, and the 2022 switch to Manchester City that handed Pep Guardiola the final piece of a treble. In his very first season at the Etihad he scored 36 Premier League goals — a single-season record for the competition — and 52 across all competitions. If you know which release clause City triggered to sign him from Dortmund, this quiz is for you.",
      "The defining images arrive early and never let up. On 17 September 2019, a 19-year-old making his Champions League debut for Salzburg scored a first-half hat-trick against Genk — still the only player to manage that on his debut in the competition. Three years later he tore up the Premier League record book, reaching 100 goals in just 111 appearances in December 2025 — faster than Alan Shearer's 124, the quickest century the competition has ever seen. He is Norway's all-time leading scorer, and at the 2026 World Cup — his first — his two late goals sank Brazil in the last 16 and carried Norway to their first-ever quarter-final.",
      "Expect the full spread. Easy openers — which country he plays for, which club signed him in 2022 — climb toward the detail that separates the fans from the fanatics: the €20m clause that took him from Salzburg to Dortmund, the three Premier League Golden Boots he had gathered by the 2025-26 season, the manager who gave him his breakthrough at Molde, the night he brought up his 300th career goal against Juventus. Transfers and fees, records, era and managers, iconic moments — it is all in here.",
      "Every question comes with a short explained answer, so you pick up the story behind the stat as you play. Play the sample set below free in your browser, no sign-up — and if you want the deep end, the full Ball IQ app has 4,000+ questions plus daily challenges and multiplayer."
    ],
    "faq": [
      {
        "q": "Which clubs has Erling Haaland played for?",
        "a": "Haaland came through Bryne in Norway before moving to Molde, where Ole Gunnar Solskjær managed him. From there he joined RB Salzburg in January 2019, then Borussia Dortmund in January 2020 via a €20m release clause, and finally Manchester City in 2022 for a £51.2m clause fee — where he remains as of 2026, tied to the club on a deal running to 2034. The quiz walks through every step of that path in order."
      },
      {
        "q": "What has Haaland won, and which records does he hold?",
        "a": "In his debut 2022-23 season he won the treble with Manchester City — Premier League, FA Cup and Champions League — and set the single-season Premier League scoring record with 36 goals (52 in all competitions). He is the fastest player to 100 Premier League goals and to 50 Champions League goals, and by the 2025-26 season he had collected three Premier League Golden Boots. He is also Norway's all-time top scorer. No Ballon d'Or yet as of 2026, and the quiz gets into exactly why the debate rages."
      },
      {
        "q": "Is the Haaland quiz free to play?",
        "a": "Yes. The sample set on this page is completely free to play in your browser with no sign-up and no download. If you want more, the full Ball IQ app carries 4,000+ questions across players, clubs and competitions, plus daily challenges and multiplayer modes to play against friends."
      },
      {
        "q": "How hard is the Haaland quiz?",
        "a": "It scales from easy to hard. Early questions are gentle — his club, his country, his signature season — before ramping up to release-clause fees, exact records and the finer points of his Salzburg and Dortmund years. Every answer comes with a short explanation, so even the tough ones teach you something whether you get them right or wrong."
      }
    ]
  },
  {
    "slug": "beckham",
    "match": [
      "Beckham"
    ],
    "name": "David Beckham",
    "initials": "DB7",
    "h1": "David Beckham Quiz",
    "title": "David Beckham Quiz — Trivia Questions & Answers | Ball IQ",
    "description": "Free David Beckham quiz: Man United treble, Galáctico years, LA Galaxy, that Greece free-kick and more. Play the sample set in your browser, no sign-up.",
    "intro": [
      "David Beckham is the boy from Leytonstone who became football's first true global brand — a right foot so precise it rewrote what a dead-ball specialist could be, wrapped inside one of the most photographed lives the game has known. This free Beckham quiz runs the whole arc: the Manchester United academy graduate who lobbed Neil Sullivan from the halfway line on the opening day of 1996, the treble-winner of 1999, the £25m Galáctico Real Madrid prised from Old Trafford in 2003, the man who took Major League Soccer seriously at LA Galaxy, the two winter loans back to AC Milan, and the Ligue 1 farewell with Paris Saint-Germain in 2013. He remains the only Englishman to win league titles in four different countries — England, Spain, the United States and France. If you can name the club he joined on loan from LA Galaxy, this quiz is for you.",
      "The defining moments arrive thick and fast. There is the crown-of-thorns villainy of Saint-Étienne in 1998, sent off for a petulant flick at Diego Simeone as ten-man England went out to Argentina — and the redemption two years in the making, that swerving injury-time free-kick against Greece at Old Trafford in October 2001 that dragged England to the 2002 World Cup single-handedly. He captained his country 59 times across two World Cups and Euro 2004, finishing with 115 caps and 17 goals, most of them curled in from distance. At United he won six Premier League titles and the 1999 Champions League; at Madrid he lifted La Liga in his final season under Fabio Capello, having started it frozen out of the side.",
      "Expect the full spread. The quiz covers the transfers and fees, the trophies across four leagues, the managers who shaped him — Ferguson, Capello, Ancelotti — and the iconic moments that made him a household name. Questions climb from the gentle (which club did he spend his entire youth and early senior career at?) to the genuinely tricky (which lower-league side did he go to on loan from United in 1995, or which two Milan winters interrupted his LA Galaxy spell?). Whether you lived through the 1998 backlash and the 2002 catharsis or you know him first as the co-owner who brought Lionel Messi to Inter Miami, there is a rung here to test you.",
      "Every question comes with a short explained answer, so you learn the story behind the fact — the context, the date, the why. Play the sample set below free in your browser, no sign-up. If you want the deep game, the full Ball IQ app has 4,000+ questions plus daily challenges and multiplayer to test yourself against friends."
    ],
    "faq": [
      {
        "q": "Which clubs did David Beckham play for?",
        "a": "Beckham came through the Manchester United academy and played there from 1992 to 2003 (with a brief 1995 loan at Preston North End), winning six Premier League titles and the 1999 Champions League. He then joined Real Madrid (2003–2007), LA Galaxy (2007–2012, with two winter loan spells at AC Milan), and finished his career at Paris Saint-Germain in 2013. As of 2026 he is president and co-owner of Inter Miami."
      },
      {
        "q": "What did David Beckham win, and what records does he hold?",
        "a": "Beckham won major honours in every country he played in: six Premier League titles, the 1999 Champions League and treble with Manchester United, La Liga with Real Madrid in 2007, two MLS Cups with LA Galaxy and Ligue 1 with PSG. He never won a Ballon d'Or, but he is the only English player to win league titles in four different countries. He earned 115 England caps and captained his country 59 times. He was knighted by King Charles III in 2025, becoming Sir David Beckham."
      },
      {
        "q": "Is the David Beckham quiz free to play?",
        "a": "Yes. The sample set on this page is completely free and runs right in your browser with no sign-up or download. If you want more, the full Ball IQ app has 4,000+ questions across players, clubs and competitions, plus daily challenges and multiplayer."
      },
      {
        "q": "How hard is the David Beckham quiz?",
        "a": "It scales from easy to hard. Early questions cover the headline facts — his boyhood club, the treble, the Real Madrid move — while later ones dig into loan spells, specific fees, dates and lesser-known moments. Every answer comes with a short explanation, so you pick up the story even on the ones you miss."
      }
    ]
  },
  {
    "slug": "cruyff",
    "match": [
      "Cruyff"
    ],
    "name": "Johan Cruyff",
    "initials": "JC14",
    "h1": "Johan Cruyff Quiz",
    "title": "Johan Cruyff Quiz: Ajax, Barcelona, Total Football | Ball IQ",
    "description": "Free Johan Cruyff quiz — play in your browser, no sign-up. Every answer explained, from Ajax and Total Football to the Barcelona Dream Team.",
    "intro": [
      "Johan Cruyff was the Dutch genius who didn't just play football — he rewired how the whole sport thinks about it. He rose through Ajax's academy to become the face of Total Football, moved to Barcelona in a world-record deal, wound down his playing days across the United States, Levante, a second Ajax spell and a final title-winning year at Feyenoord, then came back as the manager who built Barcelona's Dream Team. If you can picture the Cruyff Turn against Sweden, hum along to \"Clockwork Orange,\" and argue that the 1974 Netherlands side was better than the team that beat them, this quiz is built for you.",
      "The numbers behind the mythology hold up. Cruyff won the Ballon d'Or three times — in 1971, 1973 and 1974 — a haul only a handful of players have ever matched. At Ajax he scored 193 goals in 245 games and lifted three straight European Cups; at the 1974 World Cup he dragged the Netherlands to the final and took home the Golden Ball as the tournament's best player, even in defeat to West Germany. Then he did it all again from the dugout: his Barcelona won four consecutive La Liga titles from 1991 to 1994 and the club's first-ever European Cup in 1992.",
      "Expect the full spread. Questions run from his eight Eredivisie titles at Ajax and that first Barcelona La Liga in 1973-74, through the record transfer fees of the era, the Total Football tactics he embodied under Rinus Michels, the Dream Team he assembled as a coach, and the way his philosophy passed down to Pep Guardiola and modern Barcelona. Difficulty scales from gentle openers any fan will nail up to deep cuts that separate the students of the game from the casuals.",
      "Every answer comes with a short explanation, so you finish the quiz knowing more than when you started. It's completely free, runs right in your browser, and needs no sign-up. If it hooks you, the Ball IQ app goes deeper — over 4,000 football questions, a daily football word game, and multiplayer modes where you can test your knowledge against friends in real time."
    ],
    "faq": [
      {
        "q": "Which clubs did Johan Cruyff play for?",
        "a": "Cruyff came through Ajax, where he became a star between 1964 and 1973, then joined Barcelona in a world-record transfer. He later played for the Los Angeles Aztecs and Washington Diplomats in the United States and for Levante in Spain, before returning to Ajax and finishing his playing career with a title-winning season at rivals Feyenoord in 1983-84."
      },
      {
        "q": "What did Johan Cruyff win, and which records does he hold?",
        "a": "As a player Cruyff won three Ballon d'Or awards (1971, 1973, 1974), three consecutive European Cups and eight Eredivisie titles with Ajax, La Liga with Barcelona, and the Golden Ball at the 1974 World Cup. As Barcelona's manager he built the Dream Team, winning four straight La Liga titles (1991-1994) and the club's first European Cup in 1992 — making him Barcelona's most successful manager until Guardiola."
      },
      {
        "q": "Is the Johan Cruyff quiz free to play?",
        "a": "Yes. The Johan Cruyff quiz is completely free and plays right in your browser with no sign-up required. If you want more, the Ball IQ app offers over 4,000 football questions, a daily football word game, and multiplayer modes."
      },
      {
        "q": "How hard is the Johan Cruyff quiz?",
        "a": "It scales from easy to hard. Early questions cover the basics any fan knows — his clubs, his Ballon d'Or wins, Total Football — while later ones dig into specific seasons, transfer details, and his managerial career. Every answer is explained, so you learn as you play."
      }
    ]
  },
  {
    "slug": "drogba",
    "match": [
      "Drogba"
    ],
    "name": "Didier Drogba",
    "initials": "DD11",
    "h1": "Didier Drogba Quiz",
    "title": "Didier Drogba Quiz — Test Your IQ | Ball IQ",
    "description": "Free Didier Drogba quiz — play in your browser, no sign-up. Every answer explained. Test your knowledge of the Chelsea and Ivory Coast legend.",
    "intro": [
      "Didier Drogba is the Ivorian centre-forward who turned power, presence and an unshakeable sense of the big occasion into one of the finest striking careers of his generation. He came late and worked upward — Le Mans and Guingamp in the French lower reaches, a breakout season at Marseille, then the 2004 move to Chelsea that made his name — before later chapters at Shanghai Shenhua, Galatasaray, a title-winning return to Chelsea, Montreal Impact and Phoenix Rising, where he hung up his boots in 2018. If you can still picture him bullying centre-backs at Stamford Bridge and dragging the Ivory Coast to their first World Cups, this quiz is built for you.",
      "His defining night came in Munich in May 2012. With Chelsea a goal down and minutes from defeat in the Champions League final, Drogba rose to head an 88th-minute equaliser against Bayern, then buried the winning penalty in the shootout to deliver the club's first European Cup. It fit a career-long pattern: a knack for scoring when the stakes were highest earned him the reputation as the ultimate big-game player. He finished as Chelsea's all-time leading foreign scorer with 164 goals in 381 appearances, won four Premier League titles, and was twice named African Footballer of the Year.",
      "Expect the full spread. The quiz moves through his transfers and fees, his two Premier League Golden Boots, his knack for scoring in finals, and his standing as Ivory Coast's all-time top scorer with 65 goals in 105 caps — including the appeal for peace that helped pause a civil war back home. Questions scale from gentle openers any Chelsea fan will nod at to deep cuts that reward people who followed every step from Le Mans to Munich and beyond.",
      "Every answer comes with an explanation, so you finish knowing more than you started — and it's completely free in your browser with no sign-up. If it leaves you wanting more, the Ball IQ app has 4,000+ football questions, a daily football word game, and multiplayer modes to test your knowledge against friends."
    ],
    "faq": [
      {
        "q": "Which clubs did Didier Drogba play for?",
        "a": "Drogba came up through Le Mans and Guingamp in France before a breakout year at Marseille. He joined Chelsea in 2004, then moved on to Shanghai Shenhua and Galatasaray, returned to Chelsea for a title-winning 2014-15 season, and finished his career in North America with Montreal Impact and Phoenix Rising, retiring in 2018."
      },
      {
        "q": "What did Didier Drogba win, and which records does he hold?",
        "a": "With Chelsea he won the 2012 Champions League — heading the late equaliser and scoring the winning penalty against Bayern — plus four Premier League titles, four FA Cups and two League Cups. He also won the Turkish Süper Lig with Galatasaray, took two Premier League Golden Boots, and was twice African Footballer of the Year. He remains Chelsea's all-time top foreign scorer and Ivory Coast's all-time leading scorer."
      },
      {
        "q": "Is the Didier Drogba quiz free to play?",
        "a": "Yes — it's completely free and runs right in your browser with no sign-up required. For more, the Ball IQ app carries 4,000+ football questions, a daily football word game, and multiplayer modes."
      },
      {
        "q": "How hard is the Didier Drogba quiz?",
        "a": "It scales from easy to hard. Early questions are friendly for any Chelsea or Ivory Coast fan, while later ones dig into transfer fees, finals and career totals that reward the real diehards. Every answer is explained, so you learn as you go."
      }
    ]
  },
  {
    "slug": "lewandowski",
    "match": [
      "Lewandowski"
    ],
    "name": "Robert Lewandowski",
    "initials": "RL9",
    "h1": "Robert Lewandowski Quiz",
    "title": "Robert Lewandowski Quiz: Test Your Knowledge | Ball IQ",
    "description": "Free Robert Lewandowski quiz — play in your browser, no sign-up. Dortmund, Bayern, Barça and Chicago Fire, every answer explained. Test your Lewy IQ.",
    "intro": [
      "Robert Lewandowski is the most complete penalty-box striker of his generation, a goalscorer whose career reads like a tour of European football's biggest stages. From humble beginnings at Znicz Pruszków and Lech Poznań in Poland, he broke out at Borussia Dortmund, became a record-shattering machine at Bayern Munich, led the line at Barcelona for four seasons, and in the summer of 2026 crossed the Atlantic to join Chicago Fire in MLS as a free agent. If you can recite his goal tallies season by season and know exactly which records he took off Gerd Müller, this quiz is built for you.",
      "The defining chapter came in 2019-20, when Lewandowski drove Bayern to a Champions League triumph and became the first player to finish as the sole top scorer in the league, domestic cup and Champions League in the same treble-winning campaign. He followed it the next season by scoring 41 Bundesliga goals in 2020-21 — beating Müller's 49-year-old single-season record of 40 with a last-gasp strike on the final day — and was twice named The Best FIFA Men's Player, in 2020 and 2021. Across his career he has scored more than 600 club goals and remains Poland's all-time leading scorer with more than 80 international goals.",
      "Expect the full spread. The quiz moves from his free transfer from Dortmund to Bayern and his 2022 move to Barcelona, through the individual honours — European Golden Shoes, a Pichichi Trophy, back-to-back FIFA awards — and into the moments only devoted fans remember, like his five goals in nine minutes off the bench against Wolfsburg. There are questions on his three La Liga titles and Copa del Rey with Barça, his Bundesliga dominance, and his Poland captaincy. Difficulty scales from gentle openers to deep cuts that will stretch even the most obsessive Lewy watcher.",
      "Every answer comes with a short explanation, so you finish knowing more than when you started — this is a quiz that teaches as much as it tests. It is completely free and runs right in your browser with no sign-up required. If you enjoy it, the Ball IQ app goes further with more than 4,000 football questions, a daily football word game, and multiplayer modes where you can go head-to-head with friends."
    ],
    "faq": [
      {
        "q": "Which clubs has Robert Lewandowski played for?",
        "a": "Lewandowski came through Znicz Pruszków and Lech Poznań in Poland before moving to Borussia Dortmund in 2010. He joined Bayern Munich on a free transfer in 2014, signed for Barcelona in 2022, and after his contract expired in 2026 he joined Chicago Fire in MLS as a free agent."
      },
      {
        "q": "What has Robert Lewandowski won and which records does he hold?",
        "a": "He won the 2019-20 Champions League and multiple Bundesliga titles with Bayern Munich, plus Bundesliga crowns and the 2013 Champions League final appearance with Dortmund, and three La Liga titles and the Copa del Rey with Barcelona. He holds the Bundesliga single-season record of 41 goals (2020-21), won multiple European Golden Shoes, and was named The Best FIFA Men's Player in 2020 and 2021. He is also Poland's all-time top scorer."
      },
      {
        "q": "Is the Robert Lewandowski quiz free to play?",
        "a": "Yes. The Lewandowski quiz is completely free and plays straight in your browser with no sign-up or download. If you want more, the Ball IQ app offers over 4,000 football questions, a daily football word game, and multiplayer modes."
      },
      {
        "q": "How hard is the Robert Lewandowski quiz?",
        "a": "It scales from easy to hard. Early questions cover the headline facts of his career, while later ones dig into specific goal records, transfer details and career moments. Every answer is explained, so you learn as you play whatever your level."
      }
    ]
  },
  {
    "slug": "salah",
    "match": [
      "Salah"
    ],
    "name": "Mohamed Salah",
    "initials": "MS11",
    "h1": "Mohamed Salah Quiz",
    "title": "Mohamed Salah Quiz: Liverpool & Egypt Trivia | Ball IQ",
    "description": "Free Mohamed Salah quiz — Liverpool, Roma, Egypt, the Golden Boots and records. Play in your browser, no sign-up, every answer explained.",
    "intro": [
      "Mohamed Salah is one of the defining forwards of the Premier League era, an Egyptian winger who turned a slow start in Europe into nine record-breaking years at the very top. His path ran from Cairo's Arab Contractors to Basel in Switzerland, through a frustrating first crack at the Premier League with Chelsea, into a reinvention in Italy with Fiorentina and then Roma, and finally to Liverpool, where from 2017 he became one of the most feared attackers on the planet. That spell ended in the summer of 2026, closing a chapter that reshaped how the club scored goals. If you can trace the arc from El Mokawloon to Anfield — and you have an opinion on where he belongs among the all-time greats — this quiz is built for you.",
      "Salah's 2024-25 season is the case for the defence in any greatest-of-his-generation argument. He scored 29 Premier League goals and laid on 18 assists, becoming the first player in the competition's history to win the Golden Boot and the Playmaker award in the same campaign, and dragging Liverpool to the title in Arne Slot's first season. It earned him a record third PFA Players' Player of the Year award. That fourth Golden Boot also drew him level with Thierry Henry at the top of the all-time list, and it was no flash in the pan: back in 2017-18 he had scored 32 goals in a 38-game season, still the benchmark for a single top-flight year. He finished as Liverpool's third-highest scorer of all time with more than 250 goals for the club, and their leading Premier League marksman.",
      "Expect the full spread. The questions move through his transfers — the Basel breakout, the false start at Chelsea, the Roma resurrection and the 2017 move to Liverpool — and on to the trophies: the 2019 Champions League, two Premier League titles, the FA Cup, League Cup, Club World Cup and Super Cup. There are the records (four Golden Boots, most goals by an African in Champions League history), the landmark moments, and his Egypt career — national captain, one of the highest scorers in the nation's history, two AFCON finals, and leading the Pharaohs out at the 2026 World Cup. Difficulty scales from easy openers any Liverpool fan will nod at, up to deep cuts that separate the genuine Salah obsessives from the crowd.",
      "Every answer comes with a short explanation, so you finish the quiz knowing more than when you started — the year, the number, the context behind each one. It is completely free, runs right here in your browser, and needs no sign-up. If you enjoy it, Ball IQ has more than 4,000 football questions across clubs, leagues and legends, a daily football word game, and multiplayer modes where you can put your knowledge up against friends. Salah is only the beginning."
    ],
    "faq": [
      {
        "q": "Which clubs has Mohamed Salah played for?",
        "a": "Salah began with the Arab Contractors (El Mokawloon) in Egypt before moving to Basel in Switzerland in 2012. He joined Chelsea in 2014, then had loan spells at Fiorentina and Roma, making the Roma move permanent. In 2017 he signed for Liverpool, where he spent nine years and became one of the club's greatest ever forwards before leaving as a free agent in the summer of 2026."
      },
      {
        "q": "What has Mohamed Salah won and which records does he hold?",
        "a": "With Liverpool he won the 2019 Champions League, two Premier League titles (2019-20 and 2024-25), the FA Cup, League Cup, Club World Cup and UEFA Super Cup. Individually he has four Premier League Golden Boots, level with Thierry Henry, plus a record three PFA Players' Player of the Year awards. He is Liverpool's all-time leading Premier League scorer, the highest-scoring African in Champions League history, and Egypt's captain and one of its all-time leading scorers."
      },
      {
        "q": "Is the Mohamed Salah quiz free to play?",
        "a": "Yes. The Mohamed Salah quiz is completely free, plays directly in your browser, and needs no sign-up or download. If you want more, the full Ball IQ app has over 4,000 football questions spanning clubs, leagues and legends, a daily football word game, and multiplayer modes to play against friends."
      },
      {
        "q": "How hard is the Mohamed Salah quiz?",
        "a": "It scales. Early questions are friendly for any Liverpool or Premier League fan, then the difficulty climbs toward deep cuts on his early career, exact numbers, transfer details and Egypt exploits that only serious Salah followers will know. Every answer is explained, so even the ones you miss teach you something."
      }
    ]
  },
  {
    "slug": "henry",
    "match": [
      "Thierry Henry",
      "Henry"
    ],
    "name": "Thierry Henry",
    "initials": "TH14",
    "h1": "Thierry Henry Quiz",
    "title": "Thierry Henry Quiz: Test Your Knowledge | Ball IQ",
    "description": "Free Thierry Henry quiz you can play in your browser, no sign-up. From Monaco to Arsenal's Invincibles to Barcelona's treble — every answer explained.",
    "intro": [
      "Thierry Henry is one of the most complete forwards the game has produced, a striker whose blend of pace, poise and finishing rewrote what a modern number nine could be. His career arc ran from AS Monaco, where Arsène Wenger first shaped him, through a difficult spell at Juventus, into the Arsenal years that made him a legend, then on to Barcelona, before he closed out his playing days at New York Red Bulls in Major League Soccer. If you can picture the swerve of a left-footed finish curled inside the far post, this quiz is for you.",
      "The Arsenal chapter is where the legend was built. Henry became the club's all-time leading scorer with 228 goals and finished as the Premier League's top scorer four times, winning four Golden Boots — a total since matched by Mohamed Salah. In the 2003-04 Invincibles season he scored 30 league goals; the year before, in 2002-03, he became the only player in Premier League history to record at least 20 goals and 20 assists in a single campaign, with 24 goals and 20 assists. At Barcelona he completed the picture, winning the 2009 treble of La Liga, Copa del Rey and Champions League, and internationally he won the 1998 World Cup and Euro 2000 with France, finishing his national-team career with 51 goals in 123 caps.",
      "Expect the full spread. The questions cover his transfers and the moves between Monaco, Juventus, Arsenal, Barcelona and New York; the individual records and Golden Boots; the defining moments from the Invincibles run to the Barcelona treble; and the France trophies. Difficulty scales from easy openers most fans will know to deep cuts that reward people who followed every season — the kind of detail that separates the casual viewer from the obsessive.",
      "Every answer comes with an explanation, so you learn the story behind the stat as you play. It is completely free in your browser with no sign-up required. If you want more, the Ball IQ app has over 4,000 football questions, a daily football word game, and multiplayer modes to test yourself against friends."
    ],
    "faq": [
      {
        "q": "Which clubs has Thierry Henry played for?",
        "a": "Henry began at AS Monaco, then moved to Juventus, before joining Arsenal where he became the club's all-time leading scorer. He later played for Barcelona, winning the 2009 treble, and finished his career at New York Red Bulls in MLS, with a short loan back to Arsenal in 2012."
      },
      {
        "q": "What has Thierry Henry won and which records does he hold?",
        "a": "Henry won the 1998 World Cup and Euro 2000 with France, and the 2009 treble (La Liga, Copa del Rey, Champions League) with Barcelona. He is Arsenal's all-time top scorer with 228 goals, won four Premier League Golden Boots (a total since matched by Mohamed Salah), and is the only player in Premier League history with 20+ goals and 20+ assists in a single season, achieved in 2002-03."
      },
      {
        "q": "Is the Thierry Henry quiz free to play?",
        "a": "Yes. The Thierry Henry quiz is completely free to play in your browser with no sign-up required. For more, the Ball IQ app has over 4,000 football questions across clubs, players and competitions, plus a daily word game and multiplayer."
      },
      {
        "q": "How hard is the Thierry Henry quiz?",
        "a": "It scales from easy to hard. Early questions cover the basics most fans know, then it works up to deep career detail on transfers, records and specific moments. Every answer is explained, so you pick up the full story as you go."
      }
    ]
  },
  {
    "slug": "rooney",
    "match": [
      "Rooney"
    ],
    "name": "Wayne Rooney",
    "initials": "WR10",
    "h1": "The Wayne Rooney Quiz",
    "title": "Wayne Rooney Quiz: Test Your Knowledge | Ball IQ",
    "description": "Free Wayne Rooney quiz you can play right in your browser, no sign-up. Clubs, goals, records and big moments, with every answer explained.",
    "intro": [
      "Wayne Rooney is the Croxteth teenager who grew into English football's defining forward of his generation, a player whose career ran from a wonder goal at 16 to the top of two record books. He burst out of Everton's academy, moved to Manchester United in 2004 for a fee that made him the most expensive teenager in the world, spent thirteen trophy-laden seasons at Old Trafford, then closed the loop with a final Everton spell before playing out his career at DC United and Derby County. If you can still picture the scruffy kid curling one past David Seaman to end Arsenal's unbeaten run, this quiz is built for you.",
      "The numbers are the kind fans quote from memory. Rooney is Manchester United's all-time leading goalscorer with 253 goals across 559 appearances, a tally that edged him past Sir Bobby Charlton. For England he won 120 caps and scored 53 goals, and for the best part of a decade he stood as his country's all-time top scorer before Harry Kane finally passed the mark. Add it all up and his senior career cleared 360 goals for club and country.",
      "Expect the full spread. There are questions on the record-breaking 2004 transfer to United and the hat-trick debut against Fenerbahce that announced it, on his five Premier League titles and the 2008 Champions League, on the overhead kick against Manchester City that still tops best-goal polls, and on the England years from Euro 2004 breakthrough to captaincy. The difficulty scales from gentle openers any fan will nail up to deep cuts on his Everton return, his DC United and Derby County chapters, and his later move into management. ",
      "Every answer comes with a short explanation, so you finish knowing more than when you started, and the whole thing is free to play right in your browser with no sign-up. If it leaves you wanting more, the Ball IQ app carries over 4,000 football questions, a daily football word game, and multiplayer modes where you can put your knowledge up against friends."
    ],
    "faq": [
      {
        "q": "Which clubs did Wayne Rooney play for?",
        "a": "Rooney came through at Everton and made his senior debut there in 2002. He joined Manchester United in 2004, where he spent thirteen seasons and became the club's all-time top scorer, before returning to Everton in 2017. He finished his playing career with DC United in Major League Soccer and then as player-coach at Derby County, retiring in 2021."
      },
      {
        "q": "What did Wayne Rooney win, and which records does he hold?",
        "a": "With Manchester United he won five Premier League titles, the Champions League in 2008, the Europa League, an FA Cup, four League Cups and the Club World Cup. He is United's all-time record goalscorer with 253 goals, and he was England's all-time leading scorer with 53 goals until Harry Kane surpassed the mark."
      },
      {
        "q": "Is the Wayne Rooney quiz free to play?",
        "a": "Yes. The Wayne Rooney quiz is completely free and plays right in your browser with no sign-up and no download. If you want more, the Ball IQ app adds over 4,000 football questions, a daily football word game and multiplayer modes."
      },
      {
        "q": "How hard is the Wayne Rooney quiz?",
        "a": "It scales from easy to hard. Early questions cover the headline facts most fans know, then it works up to deeper detail on his transfers, his Everton return, his MLS and Derby spells and his England career. Every answer is explained, so you learn the story behind each one as you go."
      }
    ]
  },
  {
    "slug": "gerrard",
    "match": [
      "Gerrard"
    ],
    "name": "Steven Gerrard",
    "initials": "SG8",
    "h1": "Steven Gerrard Quiz",
    "title": "Steven Gerrard Quiz: Test Your Knowledge | Ball IQ",
    "description": "Free Steven Gerrard quiz you can play in your browser, no sign-up. Liverpool, England and LA Galaxy questions with every answer explained.",
    "intro": [
      "Steven Gerrard is the one-club talisman who carried Liverpool for the better part of two decades, a driving central midfielder who could tackle, pass, run and — above all — score the kind of goals that decided finals. He came through Liverpool's academy, made his debut in 1998, wore the armband for more than a decade, and stayed until 2015 before a farewell spell at LA Galaxy in Major League Soccer closed out his playing days. Add 114 England caps on top, and you have one of the defining British midfielders of his generation. If you can still picture him arriving late into the box with the outside of his right boot cocked, this quiz is built for you.",
      "His masterpiece came in Istanbul on 25 May 2005. Liverpool were 3-0 down to AC Milan at half-time in the Champions League final; Gerrard's header just after the hour started the comeback, the Reds drew level at 3-3, and they won the shoot-out to lift the European Cup as captain. It remains the single most famous night of his career, but it sits alongside a 2006 FA Cup final so dominated by him it is simply called \"the Gerrard final,\" and a 2001 season in which he helped Liverpool win the UEFA Cup, FA Cup and League Cup treble. For England he won 114 caps and scored 21 goals, captaining his country 38 times.",
      "Expect the full spread. The quiz moves from the gentle openers — his boyhood club, his shirt number, the city he never left — through to the deep cuts: the 2013-14 Premier League title that slipped away, his goal tallies, his three World Cups and three European Championships, and the second act in the dugout at Rangers, Aston Villa and Al-Ettifaq, including the unbeaten Scottish Premiership title he delivered at Ibrox in 2021. Questions scale from easy to hard, so casual fans get a foothold and lifers get properly tested.",
      "Every answer comes with a short explanation, so you finish the round knowing more than when you started — the fee, the date, the final, the context. It is completely free to play in your browser with no sign-up required. If you want more, the Ball IQ app has over 4,000 football questions, a daily football word game, and multiplayer modes to take on your mates head to head."
    ],
    "faq": [
      {
        "q": "Which clubs has Steven Gerrard played for?",
        "a": "Gerrard was a genuine one-club man in Europe, spending his entire top-level career at Liverpool from his 1998 debut until 2015, where he made more than 700 appearances and captained the side for over a decade. He then finished his playing days with a two-season spell at LA Galaxy in Major League Soccer in 2015 and 2016 before retiring."
      },
      {
        "q": "What has Steven Gerrard won, and which records does he hold?",
        "a": "With Liverpool, Gerrard won the 2005 Champions League as captain, the 2001 UEFA Cup, two FA Cups (2001 and 2006), three League Cups and the 2005 UEFA Super Cup. He never won the Premier League, famously falling short in 2013-14. He earned 114 England caps — among the most in the nation's history — scoring 21 goals. As a manager he later won the 2020-21 Scottish Premiership title with Rangers, unbeaten in the league."
      },
      {
        "q": "Is the Steven Gerrard quiz free to play?",
        "a": "Yes. The Steven Gerrard quiz is completely free and runs right in your browser with no sign-up and no download. If you want to keep going, the Ball IQ app packs in over 4,000 football questions, a daily football word game, and multiplayer modes."
      },
      {
        "q": "How hard is the Steven Gerrard quiz?",
        "a": "It scales from easy to hard. Early questions cover the basics any Liverpool fan knows — his club, his number, Istanbul — before ramping up to goal totals, trophy dates, England appearances and his managerial career. Every answer is explained, so it rewards knowledge and teaches you something whether you score full marks or not."
      }
    ]
  },
  {
    "slug": "ronaldinho",
    "match": [
      "Ronaldinho"
    ],
    "name": "Ronaldinho",
    "initials": "R10",
    "h1": "The Ronaldinho Quiz",
    "title": "Ronaldinho Quiz: Test Your Knowledge | Ball IQ",
    "description": "Free Ronaldinho quiz you can play in your browser, no sign-up. Every answer explained — from Grêmio and PSG to Barcelona, Milan and the 2002 World Cup.",
    "intro": [
      "Ronaldinho is the Brazilian playmaker who made football look like joy, and this quiz is built for the fans who still watch his highlight reels on repeat. His path ran from Grêmio in his native Porto Alegre to Paris Saint-Germain, then to the Barcelona side he dragged back to the top of Europe, on to AC Milan, and home again to Brazil with Flamengo, Atlético Mineiro, Querétaro in Mexico and finally Fluminense. If you can name the club where he lifted the Copa Libertadores, or you remember the night the Bernabéu stood to applaud an opponent, this one is for you.",
      "At Barcelona he was the centre of everything, scoring 94 goals in 207 appearances and winning back-to-back La Liga titles in 2004-05 and 2005-06 before capping it with the 2005-06 Champions League. In 2005 he won the Ballon d'Or, adding to the FIFA World Player of the Year awards he took in both 2004 and 2005 — the years he was, by common consent, the best footballer on the planet. Before all of it, aged 22, he had already won the 2002 World Cup with Brazil, scoring the audacious long-range free kick that beat England in the quarter-final.",
      "Expect the full spread. The quiz moves through his transfers and fees — the roughly €30m move from PSG to Barcelona in 2003, the switch to Milan in 2008 — his trophies from the 1999 Copa América and 2002 World Cup to the 2013 Copa Libertadores with Atlético Mineiro, and the moments that defined him: the toe-poke against Chelsea, the no-look passes, the smile. Questions scale from easy openers any fan will get to deep cuts that separate the casual viewer from the true student of O Bruxo.",
      "Every answer comes with an explanation, so you finish knowing more than when you started. It is completely free, playable right here in your browser with no sign-up required. If you enjoy it, the Ball IQ app goes further — over 4,000 football questions, a daily football word game, and multiplayer modes where you can test your knowledge against friends."
    ],
    "faq": [
      {
        "q": "Which clubs has Ronaldinho played for?",
        "a": "Ronaldinho came through Grêmio in Brazil, then moved to Paris Saint-Germain in 2001, Barcelona in 2003, and AC Milan in 2008. He returned to Brazil with Flamengo and then Atlético Mineiro, had a spell at Querétaro in Mexico, and finished his top-level career at Fluminense in 2015. In 2026, aged 46, he joined Serie C side Ravenna, initially in an ambassador role with a possible cameo appearance not ruled out."
      },
      {
        "q": "What has Ronaldinho won, and which records does he hold?",
        "a": "Ronaldinho won the 2002 World Cup and 1999 Copa América with Brazil, two La Liga titles (2004-05, 2005-06) and the 2005-06 Champions League with Barcelona, and the 2013 Copa Libertadores with Atlético Mineiro. Individually he won the 2005 Ballon d'Or and was named FIFA World Player of the Year in both 2004 and 2005."
      },
      {
        "q": "Is the Ronaldinho quiz free to play?",
        "a": "Yes. The Ronaldinho quiz is completely free and runs right in your browser with no sign-up or download needed. If you want more, the Ball IQ app offers over 4,000 football questions, a daily football word game, and multiplayer modes to challenge your friends."
      },
      {
        "q": "How hard is the Ronaldinho quiz?",
        "a": "It scales from easy to hard. Early questions welcome casual fans with his best-known clubs and trophies, then it ramps up to transfer fees, specific seasons, goal tallies and career details that reward true devotees. Every answer is explained, so you learn something whether you ace it or get caught out."
      }
    ]
  },
  {
    "slug": "neymar",
    "match": [
      "Neymar"
    ],
    "name": "Neymar",
    "initials": "NJR",
    "h1": "Neymar Quiz",
    "title": "Neymar Quiz: Test Your Knowledge | Ball IQ",
    "description": "Free Neymar quiz you can play in your browser, no sign-up. Every answer explained, from Santos and Barcelona to PSG and Brazil. How high is your Ball IQ?",
    "intro": [
      "Neymar is the most gifted Brazilian forward of his generation, a player whose career carried him from the beaches of Santos to the very top of the European game and back again. He broke through as a teenage phenomenon at Santos, moved to Barcelona in 2013 to form one third of the fearsome MSN attack, became the most expensive footballer in history when Paris Saint-Germain paid his release clause in 2017, spent a season and a half in Saudi Arabia with Al-Hilal, and returned to his boyhood club Santos in 2025. If you can name the trophies, the transfers and the trademark moments across all four of those chapters, this quiz is built for you.",
      "The defining stretch came at Barcelona. In 2014-15 Neymar was central to a treble-winning side, sharing the front line with Lionel Messi and Luis Suarez and scoring in the Champions League final against Juventus in Berlin as Barcelona became the first club to complete the continental treble twice. For his country he went further still: he overtook Pele to become Brazil's all-time leading goalscorer, won the Golden Ball at the 2013 Confederations Cup, and captained the side to Olympic gold on home soil in 2016. He announced his retirement from international football after Brazil's 2026 World Cup campaign, finishing as the Selecao's record scorer.",
      "Expect the full spread. There are questions on the world-record fee that took him to PSG in 2017, the La Liga, Copa del Rey and Ligue 1 titles, the treble in Spain, his more than 450 career goals for club and country, and the individual moments only real fans remember. The difficulty scales from easy openers any Neymar fan will nod at, up to deep cuts on specific finals, scorelines and squad numbers that will separate the casual watcher from the obsessive.",
      "Every answer comes with an explanation, so you finish the quiz knowing more than when you started. It is completely free, plays right in your browser, and needs no sign-up. If you enjoy it, the Ball IQ app goes deeper still, with more than 4,000 football questions, a daily football word game, and multiplayer modes where you can test your knowledge against friends."
    ],
    "faq": [
      {
        "q": "Which clubs has Neymar played for?",
        "a": "Neymar came through at Santos in Brazil before joining Barcelona in 2013, moving to Paris Saint-Germain in 2017 in a world-record transfer, signing for Al-Hilal in Saudi Arabia in 2023, and returning to Santos in 2025. He also became Brazil's all-time leading goalscorer before retiring from international football after the 2026 World Cup."
      },
      {
        "q": "What has Neymar won and which records does he hold?",
        "a": "Neymar won a treble with Barcelona in 2014-15 (La Liga, Copa del Rey and the Champions League), along with multiple Ligue 1 titles at PSG and the Saudi Pro League with Al-Hilal in 2023-24; with Santos he lifted the 2011 Copa Libertadores. Internationally he won Olympic gold in 2016, a silver in 2012, and the 2013 Confederations Cup Golden Ball, and he overtook Pele as Brazil's all-time top scorer."
      },
      {
        "q": "Is the Neymar quiz free to play?",
        "a": "Yes. The Neymar quiz is completely free, plays directly in your browser, and needs no sign-up or download. If you want more, the Ball IQ app has over 4,000 football questions, a daily football word game, and multiplayer modes."
      },
      {
        "q": "How hard is the Neymar quiz?",
        "a": "The quiz scales from easy to hard. It opens with questions most fans will know and builds toward deeper ones on specific finals, transfer fees, trophies and career numbers. Every answer is explained, so you learn as you play whether you are a casual fan or a Neymar obsessive."
      }
    ]
  },
  {
    "slug": "modric",
    "match": [
      "Modrić",
      "Modric"
    ],
    "name": "Luka Modrić",
    "initials": "LM10",
    "h1": "The Luka Modrić Quiz",
    "title": "Luka Modrić Quiz: Test Your Knowledge | Ball IQ",
    "description": "Free Luka Modrić quiz, playable in your browser with no sign-up. Every answer explained, from Dinamo Zagreb to Real Madrid to AC Milan.",
    "intro": [
      "Luka Modrić is the midfield metronome who redefined what a small, unhurried playmaker could win at the very top of the game. His path runs from Dinamo Zagreb, where he came through the academy and survived a hardening loan spell in the Bosnian league, to Tottenham Hotspur, and then to Real Madrid in 2012 — the move that turned a gifted passer into a serial European champion. In the summer of 2025 he closed his 13-year Madrid chapter and joined AC Milan on a free transfer, still starting at 40. If you can picture the drop of the shoulder, the outside-of-the-boot switch of play, and the way he glided through a decade of Clásicos, this quiz is built for you.",
      "The defining year was 2018. Modrić anchored Real Madrid to a third straight Champions League title, then captained Croatia to their first World Cup final, winning the Golden Ball as the tournament's best player along the way. That autumn he was awarded the Ballon d'Or, ending a ten-year run in which only Lionel Messi and Cristiano Ronaldo had claimed it — and he swept the Best FIFA Men's Player and UEFA Men's Player of the Year awards in the same season. At Madrid he lifted the Champions League six times across his career; for Croatia he became the nation's most-capped player, passing 200 international appearances at the 2026 World Cup — his fifth — on his way to 202 caps and 29 goals.",
      "Expect the full spread. The quiz walks his transfers and the fees that carried him, his six European Cups, his back-to-back World Cup medals — silver in 2018, bronze in 2022 — and the individual honours that piled up late in his career. There are the small details true fans hoard: the loan to Zrinjski Mostar, the Croatian league titles at Dinamo, his shirt numbers, the managers he played under. Difficulty scales from gentle openers any follower will nod at up to deep cuts that separate the diehards from the rest.",
      "Every answer comes with an explanation, so you finish knowing more than when you started — not just whether you were right. It is completely free, plays instantly in your browser, and needs no sign-up. If it sparks something, the Ball IQ app goes further: over 4,000 football questions across clubs and competitions, a daily football word game, and multiplayer modes where you can test your knowledge head-to-head against friends."
    ],
    "faq": [
      {
        "q": "Which clubs has Luka Modrić played for?",
        "a": "Modrić came through Dinamo Zagreb (with loan spells at Zrinjski Mostar and Inter Zaprešić), then signed for Tottenham Hotspur in 2008, moved to Real Madrid in 2012, and joined AC Milan on a free transfer in 2025, where he continues to play."
      },
      {
        "q": "What has Luka Modrić won, and which records does he hold?",
        "a": "He won the 2018 Ballon d'Or along with the Best FIFA Men's Player and UEFA Men's Player of the Year awards that same year, lifted the Champions League six times with Real Madrid, and won multiple La Liga titles. He is Croatia's most-capped player with 202 appearances, led them to the 2018 World Cup final, and took the 2018 Golden Ball."
      },
      {
        "q": "Is the Luka Modrić quiz free to play?",
        "a": "Yes. The Modrić quiz is completely free, runs in your browser, and needs no sign-up. If you want more, the Ball IQ app has over 4,000 football questions, a daily word game, and multiplayer modes."
      },
      {
        "q": "How hard is the Luka Modrić quiz?",
        "a": "It scales from easy to hard — gentle openers about his major clubs and trophies, then deeper questions on early loans, fees, shirt numbers, and international milestones. Every answer is explained, so it doubles as a way to learn his career, not just test it."
      }
    ]
  }
];
