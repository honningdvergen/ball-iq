// NATION SEO PAGE CONTENT — original prose, web-researched then adversarially
// web-fact-checked (currency as of the 2025-26 season / 2026-07) by the
// nation-seo-prose workflow. Consumed by scripts/gen-seo-pages.mjs
// (buildNationPage), which pulls sample Q&A from src/questions.js by
// TEXT-MATCHING the nation via `match` (no `nation` field on questions — a
// question is "about" a nation if `match` appears in the stem or correct answer).
//   - `match`     case-insensitive alternatives that filter the question bank.
//   - `slug`      -> /quiz/<slug>/ (matches "<nation> football quiz" searches).
//   - `initials`  3-letter FIFA badge code.
// World-Cup-timed: nation/host search peaks every 4 years; the 2026 World Cup is live.
// Every entry clears MIN_HINTS=15 (England 169 ... Uruguay 15).
export const NATIONS = [
  {
    "slug": "england",
    "match": [
      "England",
      "English"
    ],
    "name": "England",
    "initials": "ENG",
    "h1": "England Football Quiz",
    "title": "England Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your England football knowledge: 1966 World Cup glory, Euro final heartbreaks, Kane and the Three Lions. Explained answers, play free in your browser.",
    "intro": [
      "England gave the world football — the first international, the oldest laws of the game, the sport's deepest club culture — yet the national team's story is one long ache for a second act. The Three Lions have lifted the World Cup exactly once, on home soil in 1966, and have spent the six decades since chasing that summer down. There have been golden generations that flattered and faded, penalty shootouts that broke a nation's heart, and, lately, a fearless young side that has dragged England back to the sport's biggest stages. It is a history measured in \"so close\": semi-finals lost on spot-kicks, finals surrendered late, a country that sings \"it's coming home\" and means it every single time. This quiz walks that whole arc, from Wembley 1966 to a squad chasing history at the 2026 World Cup.",
      "The triumph is 1966, and it still defines them. On 30 July at Wembley, England beat West Germany 4-2 after extra time, with Geoff Hurst becoming the only man to score a hat-trick in a World Cup final — a feat unmatched until Kylian Mbappé did it in 2022 — and captain Bobby Moore lifting the Jules Rimet Trophy. That side, built around Moore, Bobby Charlton and goalkeeper Gordon Banks, remains the source of England's only major trophy. The nearest they have come since is a pair of European Championship finals: runners-up to Italy on penalties at Wembley in the Euro 2020 final (played in July 2021), then beaten 2-1 by Spain in Berlin in 2024, Cole Palmer's equaliser undone by Mikel Oyarzabal's late winner. Two finals, two defeats — the wait for a second trophy goes on.",
      "Expect the full spread. Harry Kane is the modern colossus — England's all-time leading scorer with more than 80 goals, past Wayne Rooney's 53 and Bobby Charlton's 49, and now the country's record World Cup marksman too. Peter Shilton holds the appearance record with 125 caps. But the quiz digs into the pain as much as the glory: Italia '90 and the tears of Turin, Gareth Southgate's decisive miss when England hosted Euro '96, and the \"Golden Generation\" of Beckham, Gerrard, Lampard and Rooney who never got past a quarter-final. There is the 2018 run to the semis, Kane's Golden Boot, and the current core — Jude Bellingham, Bukayo Saka, Phil Foden, Declan Rice and Cole Palmer — now managed by Thomas Tuchel after Southgate's two-final tenure. Icons, near-misses and records all get their turn.",
      "Every question comes with a short, explained answer, so you finish each round knowing why 1966 still stands alone, how the penalty ghosts of Turin, Wembley and Berlin piled up, and exactly where this young generation fits in the story. With the 2026 World Cup now underway across the United States, Canada and Mexico — and England once again among the contenders — there has never been a sharper time to test how well you really know the Three Lions. Play the sample set below free in your browser: no sign-up, no download, just tap and go. And when you want more — 4,000+ questions spanning the World Cup, the Premier League and European football, plus a daily football word game and live multiplayer matches against your mates — it's all waiting in the free Ball IQ app."
    ],
    "faq": [
      {
        "q": "How many World Cups has England won?",
        "a": "England has won the FIFA World Cup once, in 1966, beating West Germany 4-2 after extra time at Wembley. It remains their only major international trophy — they have never won the European Championship, though they finished runners-up in 2020 and 2024."
      },
      {
        "q": "Is the England football quiz free?",
        "a": "Yes. You can play the sample England quiz below free in your browser, with no sign-up and no download. For the full experience — 4,000+ questions, a daily football word game and multiplayer — download the free Ball IQ app on iOS or Android."
      },
      {
        "q": "How hard is the England quiz?",
        "a": "It scales. There are gentle openers about 1966 and Harry Kane alongside deep cuts on penalty shootouts, golden-generation line-ups and obscure records, so casual fans and hardcore supporters both get a genuine test."
      },
      {
        "q": "Who is England's all-time top scorer?",
        "a": "Harry Kane is England's all-time leading goalscorer with more than 80 goals, having overtaken Wayne Rooney's 53 in March 2023. Peter Shilton holds the appearance record with 125 caps."
      }
    ]
  },
  {
    "slug": "brazil",
    "match": [
      "Brazil",
      "Brazilian"
    ],
    "name": "Brazil",
    "initials": "BRA",
    "h1": "Brazil Football Quiz",
    "title": "Brazil Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your knowledge of Brazil's five World Cups, from Pelé to Vinícius Júnior. Football trivia with explained answers — play free in your browser on Ball IQ.",
    "intro": [
      "Brazil are football's crown jewel — the only nation to play at every World Cup and the most decorated of them all. The Seleção turned the game into art: the jogo bonito, the yellow shirt, the samba rhythm that made neutrals fall in love. From Pelé bursting onto the world stage as a teenager to the peerless side of 1970, from Romário and Ronaldo to Ronaldinho, Kaká and now Vinícius Júnior, Brazil has produced more icons than any country on earth. Five stars sit above the badge, and each one is a story. This quiz walks the whole arc — the triumphs and the traumas, the Maracanazo and the Mineirazo included — because Brazilian football is defined as much by its heartbreaks as by its glory. If you think you know the Seleção, this is where you prove it.",
      "The trophies came in waves. It began in Sweden in 1958, a 17-year-old Pelé scoring twice in a 5-2 final win over the hosts. Brazil retained the crown in Chile in 1962, then produced what many call the greatest team ever in 1970, beating Italy 4-1 in the Azteca and sealing it with Carlos Alberto's iconic goal — a third title that let them keep the Jules Rimet trophy for good. After a 24-year drought came the tetra: a grinding 0-0 with Italy at the 1994 final in Pasadena, won 3-2 on penalties when Roberto Baggio ballooned his over the bar. Eight years later the penta arrived in Yokohama, Ronaldo scoring both goals in a 2-0 win over Germany to complete his redemption. Five World Cups — 1958, 1962, 1970, 1994 and 2002 — a record no one has matched.",
      "Expect the full spread. There are nine Copa América titles to place, the latest a 3-1 win over Peru at the Maracanã in 2019, plus a record four Confederations Cups. Pelé remains the only man to win three World Cups; Neymar has since passed his tally to become Brazil's all-time leading scorer, while Cafu holds the caps record at 142 and played in three straight finals. You will be asked about the men of 1970 and the strikers Romário and Bebeto, about Ronaldo's eight goals in 2002 and Ronaldinho's free-kick against England. And you will be asked about the wounds too — the 1950 Maracanazo against Uruguay, the 1998 final in Paris lost amid the mystery of Ronaldo's pre-match fit, and the 7-1 to Germany in Belo Horizonte in 2014. It is all fair game.",
      "Every question comes with a short, explained answer, so each round teaches you something — why Carlos Alberto's goal capped the perfect team move, or how the 1994 shoot-out actually unfolded. You can play the sample set below free in your browser, no sign-up required. When you want more — over 4,000 questions spanning World Cups, the Copa América, clubs and legends, plus Footle, a daily football word game, and live multiplayer against your friends — it's all in the Ball IQ app. With the 2026 World Cup under way across the USA, Canada and Mexico, and Carlo Ancelotti's Brazil chasing an overdue sixth star behind Vinícius Júnior, there has never been a better time to test how much you really know about the Seleção."
    ],
    "faq": [
      {
        "q": "How many World Cups has Brazil won?",
        "a": "Brazil has won a record five World Cups: in 1958, 1962, 1970, 1994 and 2002. They are also the only nation to have appeared at every tournament, and the most successful team in the competition's history."
      },
      {
        "q": "Is the Brazil football quiz free?",
        "a": "Yes. You can play the sample Brazil questions on this page free in your browser with no sign-up. For the full experience — 4,000+ questions, the daily Footle word game and live multiplayer — download the free Ball IQ app."
      },
      {
        "q": "How hard is the Brazil quiz?",
        "a": "It scales. Early questions cover the famous stuff — the five stars, Pelé, the 2002 final — while later ones dig into Copa América years, the 1970 line-up and Neymar's scoring record. Every answer comes with a short explanation, so you learn as you play."
      },
      {
        "q": "Who is Brazil's all-time top scorer?",
        "a": "Neymar is Brazil's record scorer, having passed Pelé's tally of 77 goals in 2023. Pelé, the only player ever to win three World Cups, had held the mark for more than half a century."
      }
    ]
  },
  {
    "slug": "argentina",
    "match": [
      "Argentina",
      "Argentine",
      "Argentinian"
    ],
    "name": "Argentina",
    "initials": "ARG",
    "h1": "Argentina Football Quiz",
    "title": "Argentina Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Free Argentina football quiz with explained answers — three World Cups, Maradona, Messi and a record 16 Copa Américas. Play free in your browser, no sign-up.",
    "intro": [
      "Argentina is football's nation of romance and torment — the sky-blue-and-white that has produced two of the greatest players who ever lived and turned every World Cup into a national drama. This free Argentina quiz runs the whole arc: the host-nation triumph of 1978, Diego Maradona dragging the country to glory almost single-handedly in 1986, the decades of near-misses and heartbreak that followed, and the perfect ending in Qatar in 2022, when Lionel Messi finally lifted the trophy that had eluded him for four tournaments. Add a world-record 16 Copa América titles, back-to-back Olympic golds and a golden production line of strikers, and you have one of the sport's true superpowers. If you know the two captains — Maradona and Messi — who led the Albiceleste to World Cup glory, this quiz is for you.",
      "The three stars on the shirt tell the story. In 1978 Argentina won at home, César Luis Menotti's side beating the Netherlands 3–1 after extra time with Mario Kempes taking the Golden Boot. In 1986 came the tournament that belongs to Maradona: the 'Hand of God' and the 'Goal of the Century' inside four minutes against England in the quarter-final, then Jorge Burruchaga's late winner to beat West Germany 3–2 in the final. And in 2022, thirty-six years later, Messi's Argentina beat France in one of the greatest finals ever played — 3–3 after extra time, won 4–2 on penalties, with Emiliano 'Dibu' Martínez's saves and Ángel Di María's goal as vital as Messi's brace. Three World Cups, three unforgettable nights.",
      "Expect the full spread. Argentina's 16 Copa América crowns are a record for any nation, and the quiz digs into the recent two — the 1–0 win over Brazil at the Maracanã in 2021, Di María's chip the difference, and Lautaro Martínez's extra-time winner against Colombia in 2024. There's the 2022 Finalissima, a 3–0 rout of European champions Italy at Wembley; the 1992 King Fahd Cup; and Olympic football gold in 2004 and 2008. There are the heartbreaks too — runners-up in 1930, 1990 and the 2014 final Mario Götze settled for Germany. And the icons: Kempes, Passarella, Batistuta, Crespo, Di María and, above all, Messi, the country's record scorer and most-capped player with more than 100 international goals. Difficulty climbs from easy to genuinely hard.",
      "Every question comes with a short explained answer, so even a miss leaves you knowing more — why 1986 still defines the rivalry with England, or how Messi's redemption arc finally closed in Qatar. And it lands at the perfect moment: Argentina go into the 2026 World Cup, co-hosted by the United States, Canada and Mexico, as the reigning champions with Messi still leading them. Play the sample set below free in your browser, no sign-up. When you want more — 4,000+ questions, a daily word game and multiplayer — it's all in the Ball IQ app."
    ],
    "faq": [
      {
        "q": "How many World Cups has Argentina won?",
        "a": "Three — in 1978 (3–1 over the Netherlands as hosts), 1986 (3–2 over West Germany, inspired by Maradona) and 2022 (beating France on penalties after a 3–3 draw). Argentina have also been runners-up three times, in 1930, 1990 and 2014."
      },
      {
        "q": "How many Copa América titles has Argentina won?",
        "a": "A record 16 — more than any other nation — most recently in 2021 (1–0 over Brazil at the Maracanã) and 2024 (1–0 over Colombia in extra time). The 2021 win was Messi's first senior international trophy."
      },
      {
        "q": "Who is Argentina's all-time top scorer?",
        "a": "Lionel Messi, who is both Argentina's record goalscorer with more than 100 international goals and their most-capped player. Gabriel Batistuta is the second-highest scorer in the nation's history."
      },
      {
        "q": "Is the Argentina quiz free to play?",
        "a": "Yes — the sample questions are free in your browser with no sign-up, and the full Ball IQ app has 4,000+ football questions plus a daily word game and multiplayer."
      }
    ]
  },
  {
    "slug": "france",
    "match": [
      "France",
      "French"
    ],
    "name": "France",
    "initials": "FRA",
    "h1": "France Football Quiz",
    "title": "France Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your knowledge of France football — World Cup winners in 1998 and 2018, Zidane, Mbappé and more. Explained answers, play free in your browser.",
    "intro": [
      "France — Les Bleus — sit among the true heavyweights of world football, a nation whose story swings between silk and steel. It runs from the champagne passing of Michel Platini's mid-1980s side, through the multicultural 1998 team that finally delivered the trophy at home, to a modern machine that reached the World Cup final in 2006, 2018 and 2022. No country produces talent quite like France: the Clairefontaine academy and the suburbs of Paris feed an endless conveyor of forwards, and the national side has spent three decades either winning tournaments or losing them by the width of a crossbar. This quiz traces the whole arc — the golden generations, the icons, the heartbreaks and the comebacks. If you can name the goalscorers, the managers and the famous finals, Les Bleus have a place waiting for you.",
      "The defining chapter opens in July 1998. Hosting the World Cup, France beat Brazil 3–0 in the final at the Stade de France, Zinedine Zidane heading in twice before Emmanuel Petit sealed it in stoppage time — a first world title, captained by a young Didier Deschamps. Two years later the same core added Euro 2000, coming from behind to beat Italy 2–1 as Sylvain Wiltord equalised in the last minute and David Trezeguet struck the golden-goal winner. Then came 2018 in Russia: a new generation led by a 19-year-old Kylian Mbappé beat Croatia 4–2 in Moscow for a second star, with Deschamps now the manager — one of only three men to lift the World Cup as both player and coach. Few nations can point to triumphs so cleanly bookending a golden era.",
      "Expect the full spread. There's the origin story — Platini's France winning Euro 1984 on home soil, beating Spain 2–0 as he top-scored the tournament with nine goals. There are the near-misses that still hurt: the 2006 final lost to Italy on penalties after Zidane's infamous headbutt, the Euro 2016 final surrendered to Portugal 1–0 on home turf through Éder's extra-time strike, and the 2022 epic in Qatar — a Mbappé hat-trick, 3–3 with Argentina, then defeat on penalties. You'll be asked about the 2021 Nations League title won 2–1 over Spain, the back-to-back Confederations Cups of 2001 and 2003, Hugo Lloris's record 145 caps, and the scoring charts, where Mbappé overtook Olivier Giroud during the 2026 World Cup to become France's all-time leading marksman, with Thierry Henry's 51 now third. Managers, transfers, one-cap wonders — it all comes up.",
      "Every question comes with a short, explained answer, so you're not just testing what you know — you're picking up the context behind each result, each record and each famous night. Play the sample set below free in your browser, no sign-up required. When you want more — over 4,000 questions spanning the World Cup, the Euros, club football and the greats, plus a daily football word game and live multiplayer against friends — it's all in the Ball IQ app. Whether you grew up on Zidane's volleys or you've only ever known the Mbappé era, there's a level here for you, from gentle warm-ups to questions that will test even a lifelong follower of Les Bleus. Start with the free set and see how deep your France knowledge really runs."
    ],
    "faq": [
      {
        "q": "How many World Cups has France won?",
        "a": "France has won two World Cups — in 1998, as hosts, beating Brazil 3–0, and in 2018, beating Croatia 4–2 in Russia. They have also finished runners-up twice since, losing the 2006 final to Italy and the 2022 final to Argentina, both on penalties."
      },
      {
        "q": "Is the France quiz free?",
        "a": "Yes. You can play the sample set of France questions free right here in your browser, with no sign-up. For the full experience — over 4,000 questions, a daily football word game and live multiplayer — download the free Ball IQ app."
      },
      {
        "q": "Who is France's all-time top scorer?",
        "a": "As of 2026 it's Kylian Mbappé, who overtook Olivier Giroud (57 goals) during the 2026 World Cup. Giroud had previously passed Thierry Henry, whose 51 goals now rank third on France's all-time list."
      },
      {
        "q": "How hard is the France quiz?",
        "a": "It scales. There are gentle questions any fan can answer — like who France beat in the 1998 final — alongside deep cuts on golden goals, squad numbers and one-cap internationals. Enjoy it as a casual player or push yourself as a serious Les Bleus expert."
      }
    ]
  },
  {
    "slug": "germany",
    "match": [
      "Germany",
      "German",
      "West Germany"
    ],
    "name": "Germany",
    "initials": "GER",
    "h1": "Germany Football Quiz",
    "title": "Germany Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your knowledge of German football — four World Cups, the Euros and icons like Klose and Beckenbauer. Explained answers, play free in your browser.",
    "intro": [
      "Few nations have turned football into a science quite like Germany. Four-time world champions and relentless in the moments that matter, Die Mannschaft built a reputation for arriving at every major tournament and refusing to leave early — the team you never counted out until the final whistle. From the black-and-white era of the 1950s to the sky-blue brilliance of the 2010s, Germany has reached a record eight World Cup finals and lifted the trophy in four different decades. Theirs is a story of engineering and nerve: penalty shootouts won on cold logic, comebacks conjured from nothing, and a production line of talent that never seems to run dry. This quiz walks the full arc — the miracles, the dynasties, the golden goals and the humbling exits. If you think you know German football, here is where you prove it.",
      "The trophies begin in Bern, 1954, where a West German side written off as outsiders stunned Hungary's Mighty Magyars 3-2 in a final still known as the Miracle of Bern — the win that gave a rebuilding nation its identity. Twenty years later, on home soil in Munich, Franz Beckenbauer's Germany edged Johan Cruyff's Netherlands 2-1 to claim the 1974 crown. In 1990, Beckenbauer returned as manager and beat Argentina 1-0 in Rome, completing a rare player-and-coach double. Then came Brazil 2014: a 7-1 demolition of the hosts in the semi-final — the most brutal scoreline in World Cup knockout history — before Mario Götze's exquisite extra-time volley beat Argentina 1-0 in the final. Four titles, in 1954, 1974, 1990 and 2014, leave Germany level with Italy and one behind Brazil at the top of the all-time list.",
      "Expect the full spread. On the continental stage, Germany are three-time European champions — 1972, 1980 and 1996 — with Oliver Bierhoff's golden goal against the Czech Republic settling the last of them, the first major final ever decided that way. They added the 2017 Confederations Cup in Russia for good measure. The record books are just as rich: Miroslav Klose is the all-time leading scorer with 71 goals, and his 16 World Cup goals — which carried him past Gerd 'Der Bomber' Müller — led the tournament's all-time charts until Lionel Messi and Kylian Mbappé went beyond him at the 2026 finals. Lothar Matthäus holds the cap record with 150 appearances and played 25 World Cup matches across a then-record five tournaments. You'll also field the darker chapters — the shock 2018 and 2022 group-stage exits and the extra-time Euro 2024 quarter-final defeat to Spain. Beckenbauer, Müller, Matthäus, Klose, Neuer: the names a real fan is expected to know.",
      "Every question comes with a short, explained answer, so you finish each round knowing a little more than when you started — the score behind the score, the year behind the name. Play the sample set below free in your browser, no sign-up required. It's a natural time to test yourself: Germany head to the 2026 World Cup in the USA, Canada and Mexico under Julian Nagelsmann, drawn in Group E alongside Ecuador, Ivory Coast and Curaçao, with Florian Wirtz, Kai Havertz and captain Joshua Kimmich carrying the load. When you want more — over 4,000 questions spanning clubs, countries and competitions, a daily football word game and live multiplayer against your mates — it's all in the Ball IQ app. Start with Germany, then see how your Ball IQ stacks up against the rest of the world."
    ],
    "faq": [
      {
        "q": "How many World Cups has Germany won?",
        "a": "Germany has won the FIFA World Cup four times — in 1954, 1974, 1990 and 2014. That leaves them level with Italy and one behind Brazil's five, from a record eight World Cup final appearances."
      },
      {
        "q": "Is the Germany football quiz free?",
        "a": "Yes. You can play the sample Germany quiz right here in your browser with no sign-up and no payment. For the full experience — over 4,000 questions, a daily football word game and multiplayer — download the free Ball IQ app."
      },
      {
        "q": "How hard is the Germany quiz?",
        "a": "There's a spread. Some questions are gentle, like who lifted the 2014 World Cup, while others reward the die-hards, from the Miracle of Bern to golden goals and squad records. Every answer comes with a short explanation, so you learn as you play."
      },
      {
        "q": "Who is Germany's all-time top scorer?",
        "a": "Miroslav Klose, with 71 goals for Germany between 2001 and 2014. His 16 goals across four World Cups — which took him past the legendary Gerd Müller — led the tournament's all-time scoring charts until Lionel Messi and Kylian Mbappé overtook him at the 2026 finals."
      }
    ]
  },
  {
    "slug": "spain",
    "match": [
      "Spain",
      "Spanish"
    ],
    "name": "Spain",
    "initials": "ESP",
    "h1": "Spain Football Quiz",
    "title": "Spain Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your knowledge of Spain's football — the 2010 World Cup, four European titles and La Roja's icons — with explained answers. Play free in your browser.",
    "intro": [
      "Spain's football story is one of the great transformations in the sport — from nearly-men who flattered to deceive at tournament after tournament to the most dominant international side of a generation. Known as La Roja, they perfected a passing philosophy, tiki-taka, that mesmerised opponents and rewrote how the game could be won. For decades their gifted club players never translated to the national stage; then, in the span of four years, they collected everything worth collecting. This is a nation whose golden era set records that still stand, whose academies keep producing generational talent, and whose 2024 European crown proved the well has not run dry. From the Santiago Bernabéu to Soccer City to Berlin, few countries offer a richer, more quizzable arc — triumph, philosophy, and a conveyor belt of icons from Iniesta to Lamine Yamal.",
      "The heart of the story is the run from 2008 to 2012, when Spain became the first team to win three consecutive major titles. It began at Euro 2008 in Vienna, where Fernando Torres' 33rd-minute goal beat Germany 1-0 and ended a 44-year trophy drought. Two years later came the summit: at the 2010 World Cup in South Africa, Andrés Iniesta's 116th-minute strike sank the Netherlands 1-0 after extra time, delivering Spain's first and only world title. Then Euro 2012 sealed the dynasty with the most emphatic final in the tournament's history, a 4-0 dismantling of Italy in Kyiv, with goals from Silva, Alba, Torres and Mata. Three finals, three trophies, one unmistakable identity — a team that owned the ball and, with it, the world.",
      "Expect the full spread. Spain's four European Championships — 1964, 2008, 2012 and 2024 — are a record they now hold alone, and the quiz mines all of them, from Marcelino's header against the USSR to Mikel Oyarzabal's 86th-minute winner over England in Berlin. You'll be asked about David Villa, the all-time top scorer on 59 goals, and Sergio Ramos, the most-capped player with 180 appearances. There's Rodri's 2024 Ballon d'Or, the 2023 Nations League won on penalties against Croatia, the tiki-taka architects Xavi and Iniesta, and the new wave — Lamine Yamal, Nico Williams, Pedri — driving La Roja into the 2026 World Cup, co-hosted by the USA, Canada and Mexico, as reigning European champions and among the favourites.",
      "Every question comes with a short, explained answer, so you're not just testing what you know — you're picking up the context behind each fact, from why 2010 mattered to how the tiki-taka era reshaped the game. Play the sample set below free in your browser, no sign-up required. When you want more — 4,000+ questions spanning every nation, club and competition, a daily football word game, and multiplayer modes to test friends in real time — it's all in the Ball IQ app. Whether you lived through Iniesta's winner or you're discovering Lamine Yamal for the first time, there's a level here for every kind of Spain fan, from the casual supporter to the encyclopedia who still remembers Marcelino in 1964."
    ],
    "faq": [
      {
        "q": "How many World Cups has Spain won?",
        "a": "Spain has won the FIFA World Cup once, in 2010, beating the Netherlands 1-0 after extra time in the final in South Africa thanks to Andrés Iniesta's goal in the 116th minute. It remains their only World Cup title to date."
      },
      {
        "q": "Is the Spain quiz free?",
        "a": "Yes. You can play the sample Spain quiz right here in your browser with no sign-up. For the full experience — 4,000+ questions, a daily football word game and multiplayer modes — download the free Ball IQ app."
      },
      {
        "q": "How hard is the Spain quiz?",
        "a": "It scales from friendly to fiendish. Casual fans will know the 2010 World Cup and the Euro 2024 win, while the deeper questions reward those who remember the Euro 1964 final, David Villa's goal tallies and the tiki-taka era's finer details. Every answer is explained, so you learn as you play."
      },
      {
        "q": "Who is Spain's all-time top scorer?",
        "a": "David Villa is Spain's all-time leading scorer with 59 goals, including his Golden Boot-winning haul at Euro 2008 and five goals at the 2010 World Cup. Sergio Ramos holds the appearance record with 180 caps."
      }
    ]
  },
  {
    "slug": "italy",
    "match": [
      "Italy",
      "Italian"
    ],
    "name": "Italy",
    "initials": "ITA",
    "h1": "Italy Football Quiz",
    "title": "Italy Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your Azzurri knowledge — Italy's four World Cups, Euro glory and legends, every question with an explained answer. Play free in your browser, no sign-up.",
    "intro": [
      "Few nations wear football history like Italy. The Azzurri — the Blues — sit second only to Brazil on the all-time World Cup roll, four gold stars stitched above the badge and a defensive tradition, catenaccio, that shaped how the game is coached everywhere. From the 1930s dynasties to the ice-cool champions of Berlin, Italy has turned tournament football into an art of patience, timing and nerve. They have lifted the World Cup across seven decades — every one of their four titles won on European soil — produced some of the greatest goalkeepers and defenders who ever lived, and made a habit of peaking exactly when they have been written off. This quiz walks that whole arc — the triumphs, the heartbreaks and the icons — one question at a time. Whether you grew up on Baggio or on Buffon, it will find the edges of what you think you know.",
      "The trophies come with unforgettable detail. Vittorio Pozzo built the first dynasty, beating Czechoslovakia 2-1 after extra time in 1934 and Hungary 4-2 in 1938 — still the only manager to win back-to-back World Cups. In 1982 Paolo Rossi authored the great redemption story, returning from a ban to score six goals, sink Brazil with a hat-trick and beat West Germany 3-1 in the Madrid final, sweeping the Golden Boot, the Golden Ball and the Ballon d'Or. Then came Berlin 2006: Fabio Cannavaro's side drew 1-1 with France, watched Zinedine Zidane sent off for headbutting Marco Materazzi, and won 5-3 on penalties for a fourth star. On the continental stage Italy won the 1968 European Championship at home and, most gloriously, Euro 2020, beating England 3-2 on penalties at Wembley after a 1-1 draw.",
      "Expect the full spread. You will meet Gigi Riva, still the all-time top scorer on 35 goals, and Gianluigi Buffon, the record cap-holder with 176 appearances across a career that spanned five World Cups. There is the 1970 'Game of the Century', Italy's 4-3 extra-time win over West Germany, and the Brazil final that followed; Roberto Baggio's skied penalty in the 1994 shootout; the golden-goal agony of the Euro 2000 final and the 4-0 loss to Spain in 2012. And there is the modern wound: after Euro 2020, Italy failed to reach the World Cup for a third time running, losing a 2026 play-off to Bosnia and Herzegovina on penalties — so the four-time champions sit at home as the USA, Canada and Mexico co-host. Gennaro Gattuso now rebuilds around Donnarumma, Barella, Bastoni and Moise Kean.",
      "Every question comes with a short, explained answer, so each round teaches you something — the year, the scoreline, the name behind the moment — not just whether you got it right. You can play the sample set below free in your browser, with no sign-up, and see how deep your Azzurri knowledge really runs, from the Pozzo era to the class of Berlin. When you want more, it is all in the Ball IQ app: over 4,000 questions spanning every major nation, club and competition, a daily football word game to keep your streak alive, and live multiplayer where you go head-to-head with friends and strangers. Start with Italy's story here, then take on the rest of the football world — one explained answer at a time."
    ],
    "faq": [
      {
        "q": "How many World Cups has Italy won?",
        "a": "Italy has won the FIFA World Cup four times — in 1934, 1938, 1982 and 2006 — second only to Brazil's five. Vittorio Pozzo's team won the first two back-to-back, and the 2006 triumph in Berlin came on penalties against France."
      },
      {
        "q": "Is the Italy football quiz free?",
        "a": "Yes. You can play the sample Italy quiz right here in your browser, free and with no sign-up. For the full experience — over 4,000 questions, a daily football word game and live multiplayer — download the free Ball IQ app."
      },
      {
        "q": "How hard is the Italy quiz?",
        "a": "It scales from friendly to fiendish. Casual fans will know the four World Cups and Euro 2020, while tougher questions dig into the 1930s finals, catenaccio-era defenders and recent qualifying dramas. Every question includes a short explained answer, so you learn as you play."
      },
      {
        "q": "Who is Italy's all-time top scorer?",
        "a": "Gigi Riva is Italy's record scorer with 35 goals. Gianluigi Buffon holds the appearance record with 176 caps, while legends like Paolo Rossi, Roberto Baggio and Fabio Cannavaro define the country's World Cup story."
      }
    ]
  },
  {
    "slug": "portugal",
    "match": [
      "Portugal",
      "Portuguese"
    ],
    "name": "Portugal",
    "initials": "POR",
    "h1": "Portugal Football Quiz",
    "title": "Portugal Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Free Portugal football quiz with explained answers — Euro 2016, Eusébio, Ronaldo and every World Cup. Play free in your browser, no sign-up.",
    "intro": [
      "Portugal are football's great late bloomers — a nation that produced sublime footballers for half a century before it finally learned how to win. This free Portugal quiz runs the whole arc: Eusébio, the Mozambique-born 'Black Panther', dragging a debutant side to third place at the 1966 World Cup; the 'Golden Generation' of Luís Figo and Rui Costa who reached a home European Championship final in 2004 only to be stunned; and the Cristiano Ronaldo era that at last turned all that flair into silverware. It is a story of near-misses redeemed — of a proud football country long called the best team never to win anything, until one night in Paris it wasn't. If you can name the substitute whose extra-time thunderbolt won Euro 2016, this quiz is for you.",
      "The breakthrough came in France. At Euro 2016 Portugal lost their talisman to injury inside half an hour of the final — Ronaldo carried off in tears — yet held firm and won it in extra time, substitute Éder drilling a low shot past Hugo Lloris in the 109th minute to beat the hosts 1-0 for the country's first major trophy. Three years later they lifted the inaugural UEFA Nations League on home soil in 2019, Gonçalo Guedes' strike settling the final against the Netherlands in Porto. Then, in June 2025, they became the first nation to win the Nations League twice, edging Spain 5-3 on penalties in Munich after a breathless 2-2 draw. Three finals, three trophies — the reward for a generation that finally refused to lose the big one.",
      "Expect the full spread. Records — Cristiano Ronaldo is the all-time leading scorer in men's international football, with more than 140 goals and more caps than anyone in the men's game, while Eusébio's nine-goal Golden Boot at the 1966 World Cup, four of them in a 5-3 comeback over North Korea, remains one of the sport's great individual tournaments. Heartbreaks you'll be quizzed on — the shock 1-0 home defeat to unfancied Greece in the Euro 2004 final, and the 2006 semi-final loss to France that left Portugal fourth. Icons across the eras, from Luís Figo's 2000 world-record move and Pauleta's old scoring record to today's side under Roberto Martínez: Bruno Fernandes, Bernardo Silva, Rafael Leão and Vitinha. Difficulty climbs from easy (who is Portugal's all-time top scorer?) to genuinely hard (name the goalkeeper Éder beat in the Euro 2016 final).",
      "Every question comes with a short explained answer, so even a miss teaches you the detail that makes it stick — why Éder, of all people, became a national hero, or how Ronaldo overtook Eusébio as Portugal's all-time World Cup scorer. And with the tournament unfolding now — Portugal arriving at the 2026 World Cup as reigning Nations League champions, Ronaldo past his 41st birthday and chasing the one prize that has eluded him — there has never been a better moment to test what you know. Play the sample set below free in your browser, no sign-up. When you want more football trivia — 4,000+ questions, a daily word game and multiplayer — it's all in the Ball IQ app."
    ],
    "faq": [
      {
        "q": "How many World Cups has Portugal won?",
        "a": "None — Portugal have never won the World Cup. Their best finish is third place in 1966, inspired by Eusébio's nine-goal Golden Boot, with a fourth-place run in 2006. Their major titles are Euro 2016 and the UEFA Nations League in 2019 and 2025."
      },
      {
        "q": "Is the Portugal quiz free to play?",
        "a": "Yes — the sample questions are free in your browser with no sign-up, and the full Ball IQ app has 4,000+ football questions plus a daily word game and multiplayer."
      },
      {
        "q": "How hard is the Portugal quiz?",
        "a": "It runs from easy (who is Portugal's all-time top scorer?) to hard (specific finals, scorelines and transfer fees). Every answer comes with a short explanation, so you learn even when you miss."
      },
      {
        "q": "Who is Portugal's all-time top scorer?",
        "a": "Cristiano Ronaldo, with more than 140 goals for Portugal — he is also the all-time leading goalscorer in men's international football and his country's most-capped player. He passed Pauleta's mark of 47 goals back in 2014."
      }
    ]
  },
  {
    "slug": "netherlands",
    "match": [
      "Netherlands",
      "Dutch",
      "Holland"
    ],
    "name": "Netherlands",
    "initials": "NED",
    "h1": "Netherlands Football Quiz",
    "title": "Netherlands Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your knowledge of Netherlands football — World Cup finals, Euro 1988, Cruyff and Van Dijk — with explained answers. Play free in your browser on Ball IQ.",
    "intro": [
      "No nation has shaped the way football is played more than the Netherlands, and none has come closer to the World Cup without ever lifting it. In the 1970s, Rinus Michels and Johan Cruyff unleashed Total Football, a fluid, positionless revolution in bright Oranje that dazzled the planet and reached back-to-back World Cup finals in 1974 and 1978. Both ended in defeat, the first losses in a trilogy of final heartbreaks. Yet the Dutch remain one of the sport's great romantic powers: a country of barely eighteen million that has out-thought and out-played giants for half a century. From Cruyff to Van Basten, Bergkamp to Robben, Van Dijk to Gakpo, few nations produce icons at this rate. This quiz walks the whole arc — the genius, the near-misses, and the one golden summer when the Netherlands finally got its trophy.",
      "That golden summer came at UEFA Euro 1988 in West Germany, the Netherlands' only major international title. Michels' side, built around the AC Milan trio of Marco van Basten, Ruud Gullit and Frank Rijkaard, lost their opener to the Soviet Union, then caught fire. Van Basten answered with a hat-trick against England and a late winner to beat the hosts West Germany 2-1 in the semi-final, sweet revenge for the 1974 final defeat. In the final in Munich on 25 June 1988, Gullit headed the Oranje in front before Van Basten struck the goal of a lifetime: an impossible dipping volley from the tightest angle over Soviet keeper Rinat Dasayev. It sealed a 2-0 win and the trophy. Van Basten finished as the tournament's top scorer with five goals, and that volley remains the most famous moment in Dutch football history.",
      "Expect the full spread. You'll be tested on the three lost World Cup finals — 2-1 to West Germany in 1974, 3-1 to Argentina after extra time in 1978, and 1-0 to Spain in Johannesburg in 2010, when Andrés Iniesta broke Dutch hearts in the 116th minute. There's the redemption of 2014, when the Netherlands hammered defending champions Spain 5-1 (Robin van Persie's flying header and all), finished third by beating Brazil 3-0, and lost yet another semi-final on penalties. Expect questions on Cruyff's turn and Total Football, the 2019 Nations League final, Wesley Sneijder's record 134 caps, and Memphis Depay overtaking Van Persie in 2025 to become the nation's all-time leading scorer with more than 50 goals. Modern names feature too — captain Virgil van Dijk, Frenkie de Jong, Cody Gakpo and Xavi Simons — as Ronald Koeman's side competes at the 2026 World Cup across the USA, Canada and Mexico.",
      "Every question comes with a short explained answer, so you're not just testing what you know — you're learning the story behind each result, record and famous night. Play the sample set below free in your browser, no sign-up needed. When you want more — 4,000+ questions spanning every nation, club and competition, plus a daily football word game and multiplayer modes to challenge your friends — it's all in the Ball IQ app. Whether you lived through the 1988 volley or you're discovering the Oranje through Gakpo and Van Dijk, there's a level of difficulty here for every kind of Dutch football fan. Start with the free questions below, see how your Ball IQ stacks up, and then dive into the full experience."
    ],
    "faq": [
      {
        "q": "How many World Cups has the Netherlands won?",
        "a": "None. The Netherlands is famously the best team never to win the World Cup, finishing runners-up three times — losing the 1974 final to West Germany, the 1978 final to Argentina, and the 2010 final to Spain. Their one major international trophy is UEFA Euro 1988."
      },
      {
        "q": "Is the Netherlands football quiz free?",
        "a": "Yes. You can play the sample set of Netherlands questions right here in your browser, free and with no sign-up. For the full experience — 4,000+ questions across every nation, club and competition, plus a daily football word game and multiplayer modes — download the free Ball IQ app."
      },
      {
        "q": "How hard is the Netherlands quiz?",
        "a": "It ranges from easy to genuinely tough, so casual fans and Oranje diehards both get a challenge. Questions span from Van Basten's 1988 volley to the 2010 final and today's Van Dijk-led squad, and every one comes with a short explained answer so you learn as you play."
      },
      {
        "q": "Who is the Netherlands' all-time top scorer?",
        "a": "Memphis Depay, who overtook Robin van Persie (50 goals) in September 2025 to become the nation's leading scorer with more than 50 international goals. Wesley Sneijder holds the appearance record with 134 caps."
      }
    ]
  },
  {
    "slug": "usa",
    "match": [
      "USA",
      "United States",
      "USMNT"
    ],
    "name": "USA",
    "initials": "USA",
    "h1": "USA Football Quiz",
    "title": "USA Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your USA soccer knowledge — from the USWNT's four World Cups to the men's 2026 home tournament. Explained answers, play free in your browser.",
    "intro": [
      "American soccer tells two stories at once, and both belong on the same quiz. On the women's side, the United States is the most decorated team the sport has ever produced — four World Cups, five Olympic golds, and a run of dominance no other nation has come close to matching. On the men's side, the tale is one of stubborn, steady climb: from a shock third place at the very first World Cup in 1930 to a modern generation now co-hosting the biggest tournament football has ever staged. In the summer of 2026 the United States opens its doors to the World Cup alongside Canada and Mexico, and home crowds will carry a program that has waited its entire history for this stage. This quiz walks through all of it — the legends, the upsets, the heartbreaks and the icons who built the American game.",
      "The heart of the story is the women's team. They won the very first Women's World Cup in 1991, then delivered the moment that changed the sport at home: the 1999 final at a sold-out Rose Bowl, 0-0 against China, settled on penalties when Brandi Chastain buried the winner and ripped off her shirt in celebration. They did it again in 2015, beating Japan 5-2 with a Carli Lloyd hat-trick, and once more in 2019 in France, where Megan Rapinoe collected both the Golden Boot and the Golden Ball. Four World Cup crowns — 1991, 1999, 2015 and 2019 — sit alongside five Olympic golds in 1996, 2004, 2008, 2012 and 2024. Abby Wambach's 184 international goals and Kristine Lilly's 354 caps, a world record for appearances, are woven right through that golden era.",
      "Expect the full spread. The men's program has its own landmark days: the 2002 quarter-final run, when the U.S. beat Portugal 3-2 and knocked out Mexico 2-0 before falling 1-0 to Germany; and the 2009 Confederations Cup, where they ended Spain's 35-match unbeaten streak in the semi-final and led Brazil 2-0 in the final before losing 3-2. Seven CONCACAF Gold Cups and three Nations League titles fill the regional trophy case. You'll be asked about Clint Dempsey and Landon Donovan, tied as the men's record scorers on 57 goals, and Cobi Jones's 164 caps. And you'll meet the current side — Christian Pulisic at AC Milan, Weston McKennie, Tyler Adams and Folarin Balogun — the players carrying American hopes as co-hosts of the 2026 World Cup on home soil.",
      "Every question comes with a short explained answer, so you're building real knowledge even as you test it — why the 1999 final still resonates, how the 2002 quarter-final run unfolded, and where each record sits. Play the sample set below free in your browser, with no sign-up and nothing to install. When you want more, the full Ball IQ app has 4,000+ questions spanning national teams, clubs and competitions, a daily football word game to keep your streak alive, and live multiplayer matches where you can go head-to-head with friends. Whether you followed the USWNT's golden era, watched Pulisic grow into the men's talisman, or you're brushing up before the home World Cup this summer, the American football story is all right here — start with the free questions below and see how much you really know."
    ],
    "faq": [
      {
        "q": "How many World Cups has the USA won?",
        "a": "The men's team has never won a World Cup — its best finishes are third at the inaugural 1930 tournament and a quarter-final in 2002. The U.S. women's team, however, is the most successful side in Women's World Cup history with four titles, won in 1991, 1999, 2015 and 2019."
      },
      {
        "q": "Is the USA football quiz free?",
        "a": "Yes. You can play the sample USA questions right here in your browser, free and with no sign-up. For the full experience — 4,000+ questions, a daily football word game and multiplayer matches — download the Ball IQ app on iOS or Android."
      },
      {
        "q": "How hard is the USA quiz?",
        "a": "It scales from easy to genuinely tough. Some questions are gentle — like who co-hosts the 2026 World Cup — while others reward real depth, from the 1930 semi-final to the 2009 Confederations Cup run and the all-time record holders. Every answer is explained, so you learn as you play."
      },
      {
        "q": "Who is the USA's all-time top scorer?",
        "a": "For the men, Clint Dempsey and Landon Donovan are tied on 57 international goals. For the women, Abby Wambach leads with 184 goals, one of the highest totals in the history of the international game."
      }
    ]
  },
  {
    "slug": "mexico",
    "match": [
      "Mexico",
      "Mexican"
    ],
    "name": "Mexico",
    "initials": "MEX",
    "h1": "Mexico Football Quiz",
    "title": "Mexico Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your knowledge of El Tri — Mexico's World Cups, the 1999 Confederations Cup and their icons. Trivia with explained answers, play free in your browser.",
    "intro": [
      "Mexico — El Tri — is the heartbeat of CONCACAF and one of the most fervent footballing nations on earth, its green shirts and the roar of the Estadio Azteca instantly recognisable across the game. Few countries carry a longer World Cup pedigree: Mexico has reached 18 finals tournaments and qualified for every edition since 1994, a run of consistency matched by only a handful of nations. Yet the story is defined as much by a ceiling as by the appearances — seven times running between 1994 and 2018, El Tri reached the last sixteen and seven times went out, the elusive 'quinto partido', the fifth game and a quarter-final place, becoming a national obsession. In 2026 the wait takes on a new charge: Mexico co-hosts the World Cup alongside the United States and Canada, chasing history on home soil once again.",
      "For all that near-miss narrative, Mexico owns silverware no other CONCACAF side can claim. In 1999 El Tri lifted the FIFA Confederations Cup on home soil, beating Brazil 4–3 in a breathless Azteca final settled by Cuauhtémoc Blanco — still the only time a team from outside Europe or South America has won a senior FIFA men's global tournament. At London 2012, a golden generation stunned Brazil 2–1 in the Olympic final at Wembley, Oribe Peralta scoring inside the first minute and again after the break to bring home Mexico's first football gold. Regionally they are simply dominant: a record ten CONCACAF Gold Cups, from 1993 through to 2025, sit in the cabinet. And twice, in 1993 and 2001, Mexico reached the Copa América final as invitees — the only non-South American nation ever to do so.",
      "Expect the full spread. There are the two home World Cups — 1970 and 1986 — when Mexico twice reached the quarter-finals, still their high-water mark, and when the Estadio Azteca became the only stadium to stage two World Cup finals; it hosts the 2026 opener to make it three. There's Javier 'Chicharito' Hernández, the all-time leading scorer with 52 international goals, and Andrés Guardado, the record cap-holder with more than 180 appearances before retiring from international duty in 2024. There are the icons — Hugo Sánchez, Rafael Márquez, Cuauhtémoc Blanco, Jared Borgetti — and Guillermo Ochoa, who in 2026 became the first goalkeeper named to six World Cup squads. And there's the present: AC Milan striker Santiago Giménez, captain Edson Álvarez and the veteran Raúl Jiménez leading El Tri into a home tournament with everything to prove.",
      "Every question comes with a short, explained answer, so you finish the round knowing not just the result but the story behind it — why Blanco's goal mattered, how Peralta's minute-one strike set the tone, what the 'quinto partido' really means. Play the sample set below free in your browser, no sign-up and nothing to install: just tap in and see how deep your Mexico knowledge runs. When you want more — 4,000+ questions spanning World Cups, the Gold Cup, Liga MX and the global game, plus a daily football word game and multiplayer matches against friends — it's all in the Ball IQ app. Whether you grew up on El Tri or you're brushing up before 2026, there's a question here that will catch you out."
    ],
    "faq": [
      {
        "q": "Has Mexico ever won the World Cup?",
        "a": "No. Mexico has never won the World Cup; their best finishes are quarter-final runs in 1970 and 1986, both as hosts. They have, however, won a senior FIFA title — the 1999 Confederations Cup — and Olympic gold in 2012."
      },
      {
        "q": "Is the Mexico quiz free?",
        "a": "Yes. You can play the sample Mexico set right here in your browser, free and with no sign-up. For the full experience — 4,000+ questions, a daily word game and multiplayer — download the free Ball IQ app."
      },
      {
        "q": "How hard is the Mexico quiz?",
        "a": "There's a mix. Casual fans will recognise Chicharito, the Azteca and the 2026 co-hosting, while the deeper cuts — the 1999 Confederations Cup final, Gold Cup years and cap records — will test lifelong El Tri supporters. Every answer is explained, so you learn as you play."
      },
      {
        "q": "Who is Mexico's all-time top scorer?",
        "a": "Javier 'Chicharito' Hernández, with 52 international goals, is Mexico's all-time leading scorer, ahead of Jared Borgetti. Andrés Guardado holds the appearance record with more than 180 caps."
      }
    ]
  },
  {
    "slug": "uruguay",
    "match": [
      "Uruguay",
      "Uruguayan"
    ],
    "name": "Uruguay",
    "initials": "URU",
    "h1": "Uruguay Football Quiz",
    "title": "Uruguay Football Quiz — World Cup Trivia Questions & Answers | Ball IQ",
    "description": "Test your knowledge of Uruguay's football story — two World Cups, the Maracanazo, Suárez and Bielsa's Celeste. Explained answers, play free in your browser.",
    "intro": [
      "No country tells a bigger football story from a smaller footprint than Uruguay. A nation of barely three and a half million people, La Celeste stand among the game's founding royalty — the four stars above their crest marking two World Cups and two Olympic golds from an era when the Games crowned the world's best. This is the birthplace of garra charrúa, the never-say-die grit that turns underdogs into champions, and the home of the Estadio Centenario, the arena built to host the very first World Cup in 1930. From the Montevideo docks that produced their early stars to the silence they once forced on the Maracanã, Uruguay has spent a century proving that heart, organisation and sheer bloody-mindedness can topple giants many times their size. No one has ever punched further above their weight.",
      "The triumphs are the stuff of legend. In 1930 Uruguay hosted the inaugural FIFA World Cup and won it, beating neighbours Argentina 4-2 in front of a roaring Centenario crowd. Twenty years later came the Maracanazo — perhaps the greatest shock the sport has ever seen. Needing only a draw, hosts Brazil were overwhelming favourites in front of nearly 200,000 fans, yet Uruguay fought back to win 2-1, Alcides Ghiggia's late strike silencing the Maracanã forever. Add the Olympic golds of 1924 and 1928, claimed when that tournament effectively decided the world champions, and Uruguay's cabinet holds four global titles. Layer on 15 Copa América crowns — a haul bettered only by Argentina — and you have one of the most decorated national sides the game has ever produced, with a record tally of official senior honours to match.",
      "Expect the full spread. The quiz roams from the Ghiggia and Obdulio Varela heroes of 1950 to the epic 1954 semi-final defeat to Hungary, from the golden generation of 2010 — Diego Forlán's Golden Ball, a fourth-place finish and the 2011 Copa América title — to today's Celeste under Marcelo Bielsa. You'll be tested on Luis Suárez, the all-time top scorer with 69 international goals, and Diego Godín, the record cap-holder on 161. There are questions on Edinson Cavani and Forlán, on the 15 Copa titles and the years they were won, and on the modern core of Federico Valverde, Darwin Núñez, Ronald Araújo and Rodrigo Bentancur. And there's 2026: qualification for a fifth straight World Cup, at a tournament co-hosted by the USA, Canada and Mexico.",
      "Every question comes with a short, explained answer, so you don't just score a point — you learn the story behind the scoreline. Why the Maracanazo still stings in Rio, why those four stars sit above the crest, when Uruguay last lifted the Copa América, and how a nation so small stayed so fearsome for a hundred years. Play the sample set below free in your browser — no sign-up, no download, just tap and go. When you want more, the full Ball IQ app packs over 4,000 questions spanning clubs, countries and competitions, a daily football word game to keep your streak alive, and live multiplayer to settle once and for all who really knows La Celeste best."
    ],
    "faq": [
      {
        "q": "How many World Cups has Uruguay won?",
        "a": "Uruguay have won the FIFA World Cup twice — in 1930 and 1950. They lifted the very first tournament on home soil in 1930, beating Argentina 4-2, then stunned hosts Brazil 2-1 at the Maracanã in the decisive 1950 final-round match, the game forever known as the Maracanazo."
      },
      {
        "q": "Is the Uruguay quiz free?",
        "a": "Yes. You can play the sample Uruguay questions right here in your browser, completely free and with no sign-up. For the full experience — over 4,000 questions, a daily football word game and live multiplayer — download the free Ball IQ app on iOS and Android."
      },
      {
        "q": "How hard is the Uruguay football quiz?",
        "a": "It's built for every level. Early questions cover the headline glories — the two World Cups, Suárez, the sky-blue shirt — while later ones dig into Copa América years, the 1950 heroes and modern squad details that will test even lifelong Celeste fans. Every answer is explained, so you learn as you go."
      },
      {
        "q": "Who is Uruguay's all-time top scorer?",
        "a": "Luis Suárez is Uruguay's all-time leading scorer with 69 international goals, ahead of Edinson Cavani and Diego Forlán. The record for most caps belongs to defender Diego Godín, who made 161 appearances for La Celeste."
      }
    ]
  }
];
