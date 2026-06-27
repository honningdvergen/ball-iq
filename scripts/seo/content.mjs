// ─────────────────────────────────────────────────────────────────────────────
// HAND-WRITTEN SEO CONTENT — the load-bearing original prose.
//
// This file is the difference between a safe content site and a "scaled
// content" / "low value" rejection. Every intro and FAQ here is written by a
// human (not spun, not templated). The generator (scripts/gen-seo-pages.mjs)
// pulls REAL questions from src/questions.js for the sample sets; the prose
// below is what makes each page original and genuinely useful.
//
// RULES when editing / adding categories:
//   - Intro: 250–400 words of ORIGINAL prose, referencing real moments the
//     bank actually covers. Do NOT spin or paraphrase another page.
//   - FAQ: 4–6 Q&A, framing UNIQUE to the category (don't reuse another page's
//     questions). 1–2 sentences each.
//   - Never state a hardcoded question count in prose (it drifts). The generator
//     injects the live count into the stats line. Refer to events, not counts.
//   - No club crests, kits, or player photos anywhere — text references only
//     (nominative fair use). The footer carries the non-affiliation disclaimer.
//
// Only categories with prose defined here get a page emitted. The pilot ships
// hub + World Cup + Premier League + Champions League; the remaining 7 + the
// listicle get added here once GSC confirms indexation (plan phase P3).
// ─────────────────────────────────────────────────────────────────────────────

export const SITE = {
  base: 'https://balliq.app',
  name: 'Ball IQ',
  tagline: 'The ultimate football quiz',
  ogImage: 'https://balliq.app/og-image.png',
  appStore: 'https://apps.apple.com/app/id6775975961',
  playUrl: 'https://balliq.app/',
};

// ── HUB PAGE ────────────────────────────────────────────────────────────────
export const HUB = {
  slug: 'quiz',
  h1: 'Football Quizzes',
  title: 'Football Quiz — Free Trivia Questions & Answers | Ball IQ',
  description:
    'Play free football quizzes covering the World Cup, Premier League, Champions League and more. Thousands of trivia questions with explained answers — no sign-up needed.',
  intro: [
    `Ball IQ is a football quiz built for people who actually argue about football. Not the surface-level "name the striker" stuff — real questions about the moments, records and managers that shaped the game, each one with a short explanation so you walk away knowing something you didn't before.`,
    `Every quiz below is free, runs straight in your browser, and needs no sign-up. Pick a topic and play: the FIFA World Cup, from Uruguay 1930 to Argentina's penalty-shootout win in Qatar; the Premier League, from the 1992 breakaway to Manchester City's 100-point season; the UEFA Champions League, from Real Madrid's early European Cup dynasty to Liverpool's 4-0 comeback against Barcelona. There are also dedicated quizzes on La Liga, Serie A, the Bundesliga, the Euros, football's great managers, and the all-time records that settle pub arguments.`,
    `What makes Ball IQ different is the explanations. Most online quizzes just tell you "wrong, the answer was Spain." Ours tell you Spain beat the Netherlands 1-0 in Johannesburg with Andrés Iniesta's extra-time winner — context that makes the next question easier and the whole thing feel like learning rather than guessing. Questions are graded easy, medium and hard, so casual fans and obsessives both get a proper test.`,
    `Ball IQ started as a mobile app and grew into a full football trivia platform with a daily challenge, a Wordle-style "Footle" guessing game, and live multiplayer where you go head-to-head with friends. The quizzes on this page are a free taste of the question bank. Find a topic you love below, play a round, and if you want the daily streak, the leaderboards and the multiplayer, the full game is a tap away.`,
  ],
};

// ── ABOUT PAGE ──────────────────────────────────────────────────────────────
export const ABOUT = {
  slug: 'about',
  h1: 'About Ball IQ',
  title: 'About Ball IQ — The Football Quiz That Explains Every Answer',
  description:
    'Ball IQ is an independent football quiz game with thousands of hand-curated questions and an explanation behind every answer. Learn what it is and who makes it.',
  lede: 'An independent football trivia game, made for fans who love the details.',
  body: [
    `Ball IQ is a football quiz game for people who love the details — the moments, records, managers and matches that define the sport. It began with a simple frustration: almost every football quiz online is shallow, and when you get one wrong it just says "wrong" and moves on. Ball IQ explains every answer, so playing feels less like a test and more like learning something each round.`,
    `The game is built on thousands of hand-curated questions spanning the FIFA World Cup, the Premier League, the UEFA Champions League, La Liga, Serie A, the Bundesliga and the European Championship, plus dedicated sets on football's great managers, its legends, and the all-time records that settle arguments. Difficulty runs from gentle warm-ups to genuinely hard deep cuts, so a casual fan and a die-hard both get a real test. Beyond the quizzes there's a daily challenge, a Wordle-style guessing game called Footle, an IQ test that scores your football knowledge, and live online multiplayer where you go head-to-head with friends in real time.`,
    `Ball IQ is an independent project, built and maintained in Norway. It's available as a free app on the App Store and as a web app you can play in any browser — no sign-up required to start. New questions are added regularly, and the whole thing is made by someone who genuinely cares about getting the football right.`,
    `That accuracy matters to us. Questions are researched, every answer carries a short factual explanation, and the bank is reviewed continuously. If you ever spot a mistake or a question that reads wrong, we want to know — corrections get fixed fast. Football history is detailed and occasionally contested, and we'd rather get it right than get it quickly.`,
  ],
};

// ── CONTACT PAGE ────────────────────────────────────────────────────────────
export const CONTACT = {
  slug: 'contact',
  h1: 'Contact Ball IQ',
  title: 'Contact Ball IQ — Feedback, Bug Reports & Enquiries',
  description:
    'Get in touch with Ball IQ — feedback, bug reports, question corrections, press and partnership enquiries. Email hello@balliq.app.',
  lede: 'Questions, feedback, or spotted a wrong answer? We read everything.',
  body: [
    `The best way to reach Ball IQ is by email: <a href="mailto:hello@balliq.app">hello@balliq.app</a>. It goes straight to the person who makes the game, and we read every message.`,
    `For bug reports, it helps to tell us your device and what you were doing when it happened. For question corrections, include the question and what's wrong with it — we review and fix the bank quickly, and we genuinely appreciate the catch. For press, partnership or anything else, the same address works.`,
    `We're a small independent operation, so replies may take a day or two — but they do come. Thanks for playing, and for helping make Ball IQ better.`,
  ],
};

// ── CATEGORY PAGES ──────────────────────────────────────────────────────────
// `cat` matches the `cat` field in src/questions.js. `sample` = number of
// hint-bearing Q&A the generator renders. `about` feeds the JSON-LD Quiz.about.
export const CATEGORIES = [
  {
    cat: 'WorldCup',
    slug: 'world-cup',
    name: 'World Cup',
    h1: 'World Cup Quiz',
    title: 'World Cup Quiz — FIFA World Cup Trivia Questions & Answers | Ball IQ',
    description:
      'Test your FIFA World Cup knowledge with free trivia questions and explained answers — from 1930 to Qatar 2022. Every answer comes with the story behind it.',
    about: 'FIFA World Cup',
    sample: 20,
    intro: [
      `The FIFA World Cup is the biggest single-sport event on the planet, and almost a century of it gives you a lot to be quizzed on. This free World Cup quiz runs from the very first tournament — Uruguay 1930, won by the hosts — right through to Qatar 2022, where Argentina and Lionel Messi finally lifted the trophy after beating France on penalties in one of the greatest finals ever played.`,
      `In between sit all the moments that define the competition. Brazil's golden era, with a 17-year-old Pelé announcing himself in 1958. England's only triumph, at Wembley in 1966. Diego Maradona's twin moments against England in 1986 — the Hand of God and then the goal of the century four minutes later. Zinedine Zidane's two headers to beat Brazil in 1998, and his red-card headbutt eight years later. Spain's tiki-taka peak in 2010, Germany's astonishing 7-1 demolition of Brazil on home soil in 2014, and Kylian Mbappé's emergence as a teenager in 2018.`,
      `The questions cover winners and hosts, top scorers and Golden Glove keepers, famous finals and infamous upsets. You'll get asked who scored France's third goal in the 1998 final, which goalkeeper saved Coman's penalty in the 2022 shoot-out, and how Croatia kept grinding their way to the 2018 final through three straight extra-time knockouts. Answers are graded easy to hard, so you can warm up on the obvious champions before the deep cuts about 1930s qualifying and stoppage-time third-place play-offs.`,
      `Every question below comes with a short explanation, so even when you miss one you pick up the detail that makes it stick. Play the sample set here for free, then jump into the full World Cup quiz in the app for hundreds more.`,
    ],
    faq: [
      {
        q: 'Which country has won the most World Cups?',
        a: 'Brazil, with five titles (1958, 1962, 1970, 1994 and 2002) — the only nation to play in every tournament and the most successful side in World Cup history.',
      },
      {
        q: 'Who won the 2022 World Cup?',
        a: 'Argentina, beating France on penalties in Qatar after a 3-3 draw. Lionel Messi finally won the trophy, and Kylian Mbappé scored a hat-trick in the final yet still ended on the losing side.',
      },
      {
        q: 'Is the World Cup quiz free to play?',
        a: 'Yes. You can play the sample questions free in your browser with no sign-up, or download the Ball IQ app for the full World Cup question bank plus daily challenges.',
      },
      {
        q: 'How hard are the questions?',
        a: 'They range from easy (which country won 2010?) to hard (who scored in stoppage time of the 1998 final?). The quiz mixes difficulty so casual fans and obsessives both get a real test.',
      },
    ],
  },

  {
    cat: 'PL',
    slug: 'premier-league',
    name: 'Premier League',
    h1: 'Premier League Quiz',
    title: 'Premier League Quiz — Football Trivia Questions & Answers | Ball IQ',
    description:
      'Free Premier League quiz with explained answers — from the 1992 breakaway and the Invincibles to City’s 100-point season. Test your English football knowledge.',
    about: 'Premier League',
    sample: 20,
    intro: [
      `The Premier League rebranded English football in 1992, and three decades on it's the most-watched league in the world. This free Premier League quiz covers the lot — the title races, the records, the managers and the moments that became shorthand the second they happened.`,
      `It starts with the era of Manchester United dominance under Sir Alex Ferguson, runs through Arsène Wenger's Arsenal "Invincibles" of 2003-04 — the only side to go a full 38-game season unbeaten — and lands on the modern superpowers. Sergio Agüero's stoppage-time goal to win City the 2012 title off the very last kick. Leicester City's 5,000-1 fairy tale in 2016. Jürgen Klopp's Liverpool finally ending a 30-year wait for the league in 2020. And Pep Guardiola's City hitting 100 points in 2017-18, the first team ever to reach the century mark.`,
      `The records get their own questions too: Alan Shearer's 260 goals, the all-time scoring mark that still stands; Mohamed Salah's 32 in a 38-game season, since beaten by Erling Haaland's 36; the 95-point and 98-point title-winning totals; and the red cards, captains and one-season wonders that fans love to argue about. Difficulty climbs from gentle openers about famous champions to genuinely hard questions about specific seasons, points tallies and squad details.`,
      `As with every Ball IQ quiz, each answer carries a one-line explanation, so a question you get wrong teaches you the fact behind it. Play the sample below for free, then open the app for the full Premier League bank and the daily challenge.`,
    ],
    faq: [
      {
        q: 'Who has scored the most Premier League goals?',
        a: 'Alan Shearer, with 260 goals for Blackburn Rovers and Newcastle United. He has held the all-time record since the league began and no active player is close.',
      },
      {
        q: 'Which team won the Premier League with 100 points?',
        a: 'Manchester City, in the 2017-18 season under Pep Guardiola. They were the first English top-flight side to reach 100 points, finishing 19 points clear.',
      },
      {
        q: 'What were the Arsenal Invincibles?',
        a: 'The Arsenal side that won the 2003-04 Premier League without losing a single game — 26 wins and 12 draws across all 38 matches, a feat no other team has matched.',
      },
      {
        q: 'Is the Premier League quiz free?',
        a: 'Yes — play the sample questions free in your browser, or get the Ball IQ app for the full Premier League question bank and daily streaks.',
      },
    ],
  },

  {
    cat: 'UCL',
    slug: 'champions-league',
    name: 'Champions League',
    h1: 'Champions League Quiz',
    title: 'Champions League Quiz — UEFA Trivia Questions & Answers | Ball IQ',
    description:
      'Free UEFA Champions League quiz with explained answers — from Real Madrid’s European Cup dynasty to Istanbul 2005 and Liverpool’s comeback against Barcelona.',
    about: 'UEFA Champions League',
    sample: 20,
    intro: [
      `The European Cup became the Champions League in 1992, but the competition's history stretches back to the 1950s and the Real Madrid side that won the first five editions in a row. This free Champions League quiz spans the whole story — the dynasties, the comebacks, the shoot-outs and the nights that get replayed forever.`,
      `Real Madrid run through it like a thread: from Alfredo Di Stéfano's era to a record fifteen titles and counting. But the quiz lives just as much on the great upsets and turnarounds. Liverpool 3-0 down at half-time to AC Milan in Istanbul in 2005, then winning on penalties. Liverpool again in 2019, overturning a 3-0 first-leg deficit to beat Lionel Messi's Barcelona 4-0 at Anfield, Divock Origi poking in the fourth. Chelsea winning the 2012 final on Bayern Munich's own ground, on penalties, after Didier Drogba's late header. And the young Ajax team of 2019 knocking out both Real Madrid and Juventus before losing to Spurs in the last seconds of the semi-final.`,
      `You'll be asked about all-time top scorers (Cristiano Ronaldo leads the list), winning managers, final venues and the specific goals that decided ties. The questions climb from easy — who did Liverpool beat in the 2019 final? — to hard ones about shoot-out heroes and the exact minute a famous goal went in. It's a proper test of how closely you've actually watched Europe's biggest club competition.`,
      `As always, every answer comes with the story behind it, so you finish the quiz knowing more than you started. Try the free sample below, then play the full Champions League bank in the Ball IQ app.`,
    ],
    faq: [
      {
        q: 'Who has won the most Champions League titles?',
        a: 'Real Madrid, by a distance — fifteen European Cup / Champions League titles, including the first five editions of the competition in the 1950s.',
      },
      {
        q: 'Who is the all-time top scorer in the Champions League?',
        a: 'Cristiano Ronaldo, with over 140 goals in the competition across spells at Manchester United, Real Madrid and Juventus — comfortably ahead of Lionel Messi in second.',
      },
      {
        q: 'What happened in the 2005 final in Istanbul?',
        a: 'Liverpool were 3-0 down to AC Milan at half-time, scored three goals in six second-half minutes to draw 3-3, and then won the penalty shoot-out — the greatest comeback in a European Cup final.',
      },
      {
        q: 'Is the Champions League quiz free to play?',
        a: 'Yes — the sample set is free in your browser with no sign-up, and the full question bank is in the Ball IQ app.',
      },
    ],
  },
];
