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
];
