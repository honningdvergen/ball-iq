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

// P3 (the 7 league/topic categories) live in drafts-p3.mjs and were fact-checked
// (currency-as-of-today, adversarially re-verified) before going live here.
import { P3_CATEGORIES } from './drafts-p3.mjs';

export const SITE = {
  base: 'https://balliq.app',
  name: 'Ball IQ',
  tagline: 'The ultimate football quiz',
  ogImage: 'https://balliq.app/og-image.png',
  appStore: 'https://apps.apple.com/us/app/ball-iq-football-trivia/id6775975961',
  // Google Play listing — LIVE since 2026-07-27. Package is app.balliq
  // (build.gradle applicationId); the reversed com.balliq.app form 404s.
  playStore: 'https://play.google.com/store/apps/details?id=app.balliq',
  // NOTE: `playUrl` is the PLAY-IN-BROWSER url, not the Play Store. Badly
  // named, kept for call-site compatibility. Use `playStore` for the store.
  playUrl: 'https://balliq.app/',
  // Platform-aware store redirect (api/get.js). Sends iOS → App Store,
  // Android → Play, everything else → the web app. Use this for any SINGLE
  // "Get the app" CTA, where showing two badges would be clutter — a static
  // page cannot sniff the platform, and hardcoding one store dead-ends half
  // the visitors now that both platforms are live.
  getApp: 'https://balliq.app/get',
};

// ── HUB PAGE ────────────────────────────────────────────────────────────────
export const HUB = {
  slug: 'quiz',
  h1: 'Football Quizzes',
  // ⚠️ KEEP "Football Quiz" AS AN UNBROKEN PHRASE AT THE FRONT.
  // This is the only page targeting "football quiz" — our single highest-value
  // query (GSC 2026-07-30: position 41, and a top-10 finish is worth a 10-20x
  // impression multiplier). The title read "Football (Soccer) Quiz" for a while:
  // the parenthetical was added for the US-localisation thesis, which we later
  // DISPROVED (see the US/Egypt GSC read — Egypt is 100% brand traffic and the
  // US ranks us for our own name because "ball IQ" is basketball jargon there).
  // So it split the exact phrase on our most important term in exchange for
  // nothing. "Soccer" still earns its place further along, where it catches
  // soccer searches without interrupting the phrase.
  title: 'Football Quiz — Free Soccer Trivia, No Sign-Up | Ball IQ',
  // "with explained answers" implied ALL of them. Measured 2026-07-30: 4,970 of
  // 6,402 MCQs carry a hint = 77.6%. This is the same false claim we already
  // corrected in the store listings; it was still live here, on the page we care
  // about most. "Most" is both true and still a strong differentiator.
  description:
    'Play free football and soccer quizzes — World Cup, Premier League, Champions League and more. Thousands of questions, most answers explained. No sign-up.',
  intro: [
    `Ball IQ is a football quiz built for people who actually argue about football. Not the surface-level "name the striker" stuff — real questions about the moments, records and managers that shaped the game, most with a short explanation so you walk away knowing something you didn't before. Whether you call it football or soccer, it's the same game and the same obsession — and the same free quizzes here.`,
    `Every quiz below is free, runs straight in your browser, and needs no sign-up. Pick a topic and play: the FIFA World Cup, from Uruguay 1930 to Argentina's penalty-shootout win in Qatar; the Premier League, from the 1992 breakaway to Manchester City's 100-point season; the UEFA Champions League, from Real Madrid's early European Cup dynasty to Liverpool's 4-0 comeback against Barcelona. There are also dedicated quizzes on La Liga, Serie A, the Bundesliga, the Euros, football's great managers, and the all-time records that settle pub arguments.`,
    `What makes Ball IQ different is the explanations. Most online quizzes just tell you "wrong, the answer was Spain." Ours tell you Spain beat the Netherlands 1-0 in Johannesburg with Andrés Iniesta's extra-time winner — context that makes the next question easier and the whole thing feel like learning rather than guessing. Questions are graded easy, medium and hard, so casual fans and obsessives both get a proper test.`,
    `Ball IQ started as a mobile app and grew into a full football trivia platform with a daily challenge, a Wordle-style "Footle" guessing game, and live multiplayer where you go head-to-head with friends. The quizzes on this page are a free taste of the question bank. Find a topic you love below, play a round, and if you want the daily streak, the leaderboards and the multiplayer, the full game is a tap away.`,
  ],
};

// ── ABOUT PAGE ──────────────────────────────────────────────────────────────
export const ABOUT = {
  slug: 'about',
  h1: 'About Ball IQ',
  title: 'About Ball IQ — The Football Quiz Built on Explanations',
  description:
    'Ball IQ is an independent football quiz game with thousands of hand-curated questions and an explanation behind most answers. Learn what it is and who makes it.',
  lede: 'An independent football trivia game, made for fans who love the details.',
  body: [
    `Ball IQ is a football quiz game for people who love the details — the moments, records, managers and matches that define the sport. It began with a simple frustration: almost every football quiz online is shallow, and when you get one wrong it just says "wrong" and moves on. Ball IQ explains the answer on most questions, so playing feels less like a test and more like learning something each round.`,
    `The game is built on thousands of hand-curated questions spanning the FIFA World Cup, the Premier League, the UEFA Champions League, La Liga, Serie A, the Bundesliga and the European Championship, plus dedicated sets on football's great managers, its legends, and the all-time records that settle arguments. Difficulty runs from gentle warm-ups to genuinely hard deep cuts, so a casual fan and a die-hard both get a real test. Beyond the quizzes there's a daily challenge, a Wordle-style guessing game called Footle, an IQ test that scores your football knowledge, and live online multiplayer where you go head-to-head with friends in real time.`,
    `Ball IQ is an independent project, built and maintained in Norway. It's available as a free app on the App Store and Google Play, and as a web app you can play in any browser — no sign-up required to start. New questions are added regularly, and the whole thing is made by someone who genuinely cares about getting the football right.`,
    `That accuracy matters to us. Questions are researched, most answers carry a short factual explanation, and the bank is reviewed continuously. If you ever spot a mistake or a question that reads wrong, we want to know — corrections get fixed fast. Football history is detailed and occasionally contested, and we'd rather get it right than get it quickly.`,
    `Here is what that looks like in practice. Every question is written by hand and then checked twice before it reaches the game: once against the claim it makes, and once against the wrong answers offered alongside it. That second check matters more than it sounds. A question is only as good as its wrong options — if three of the four can be dismissed without knowing any football, it is not really a question. Sets that fail either check are rewritten or dropped rather than padded out, which is why some clubs have fewer questions than others. We would rather a smaller set that is right.`,
    `The game is organised around how people actually argue about football. There are quizzes for individual clubs — 72 of them, from Liverpool and Real Madrid down to Hajduk Split and Bournemouth — as well as leagues, tournaments, eras and individual players. Alongside them sit reference lists: every Ballon d'Or winner, every European Cup final, the top scorers and record holders, kept as plain tables you can check rather than quiz formats. Some people come for the game and stay for the tables; some do the reverse.`,
    `Ball IQ is free, and free in the ordinary sense — you can play the daily games and every quiz without an account, without a trial, and without a paywall appearing three questions in. Creating an account only adds things that need one: saved streaks, friends, and multiplayer rooms. We do not sell player data, and the native apps carry no advertising or analytics at all.`,
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
    `Question corrections are the ones we most want to receive. The bank runs to thousands of questions covering a century of football, and some of it is genuinely contested — a transfer fee reported three different ways, a goal credited to two players, a record that changed hands last season. Players catch these faster than any review process does, and a correction that arrives with a source attached usually goes live the same week. If you disagree with an answer, say so; being told we are wrong is more useful than being told the app is nice.`,
    `A few things we get asked often. The game is free to play with no account required, and the daily games reset at midnight in your own timezone. Progress is stored on the device unless you sign in, so clearing your browser data will clear your streak — signing in is the way to keep it across devices. The native apps for iPhone and Android carry no ads and no analytics. If you want to know exactly what is stored and why, the <a href="/privacy.html">privacy policy</a> spells it out in plain language.`,
    `We're a small independent operation, so replies may take a day or two — but they do come. Thanks for playing, and for helping make Ball IQ better.`,
  ],
};

// ── TERMS OF SERVICE ────────────────────────────────────────────────────────
// Ball IQ has accounts, multiplayer rooms and user-chosen display names, so a
// ToS is a genuine legal gap and not only an AdSense checkbox. Written in the
// same plain register as the privacy policy — a document nobody can read is
// not a document. NOT drafted by a lawyer; review before relying on it.
export const TERMS = {
  slug: 'terms',
  h1: 'Terms of Service',
  title: 'Terms of Service — Ball IQ',
  description:
    'The terms that apply when you use Ball IQ — accounts, acceptable use, multiplayer conduct, content ownership and liability. Plain language, updated July 2026.',
  lede: 'The rules for using Ball IQ. Short, and in plain language.',
  body: [
    `<strong>Last updated: 31 July 2026.</strong> By using Ball IQ — the website at balliq.app, or the iOS and Android apps — you agree to these terms. If you do not agree with them, please do not use the service. We have tried to keep this readable rather than exhaustive; if something here is unclear, ask us at <a href="mailto:hello@balliq.app">hello@balliq.app</a> and we will explain it in ordinary words.`,
    `<strong>Who can use it.</strong> Ball IQ is intended for a general audience and is free to play. You do not need an account to play the daily games or any quiz. If you are under the age at which your country considers you able to agree to terms like these, you should have a parent or guardian agree on your behalf. We do not knowingly collect personal information from children — see the <a href="/privacy.html">privacy policy</a> for what is stored and why.`,
    `<strong>Accounts and display names.</strong> Creating an account adds saved streaks, friends and multiplayer rooms. You are responsible for what happens under your account, and for keeping access to your email or sign-in provider secure. Display names are visible to other players in multiplayer and on leaderboards, so choose one you are comfortable being seen. We may change or remove a name that impersonates someone, is designed to harass, or is obscene — and we may do so without notice.`,
    `<strong>Acceptable use.</strong> Play the game as it is meant to be played. Do not attempt to break, overload or reverse-engineer the service; do not automate play, manipulate scores or leaderboards, or interfere with other players' games; do not use multiplayer rooms to harass, threaten or abuse anyone. We may suspend or remove access for any of these, and we will generally do so without a warning where other players are being harmed.`,
    `<strong>The questions and the content.</strong> The question bank, explanations, written prose, reference lists and design are ours, and are provided for personal, non-commercial use. You are welcome to share a score, a screenshot or a link. You may not scrape, bulk-copy or republish the question bank, in whole or in substantial part, including to train a model or to populate a competing quiz. Club names, competition names and trademarks referenced in questions belong to their respective owners; Ball IQ is an independent project and is not affiliated with, endorsed by or licensed by any club, league or competition.`,
    `<strong>Accuracy.</strong> We check every question before it is published, and most answers carry a written explanation. Football history is detailed and occasionally contested, and we will sometimes be wrong. Nothing in the game is offered as authoritative fact for any purpose that matters — if you are settling a bet, check a primary source. If you find a mistake, tell us: corrections from players are the fastest route to fixing the bank.`,
    `<strong>Availability.</strong> Ball IQ is provided as it is, without warranty of any kind. It is an independent project run by one person, so there is no uptime guarantee, no support commitment and no promise that any particular feature will continue to exist. We may change, suspend or discontinue any part of the service, including multiplayer, at any time. Progress stored only on your device — which is the default when you are not signed in — will be lost if you clear your browser data or remove the app.`,
    `<strong>Liability.</strong> To the extent the law allows, Ball IQ is not liable for indirect or consequential loss arising from your use of the service, or for lost progress, lost streaks or unavailability. Nothing here limits liability that cannot be limited by law, including for death or personal injury caused by negligence, or for fraud.`,
    `<strong>The apps and the app stores.</strong> The iOS and Android apps are distributed through the App Store and Google Play, and your use of them is also subject to those stores' own terms. The native apps carry no advertising and no analytics. This website does carry advertising, which is how the free web version is paid for.`,
    `<strong>Changes and contact.</strong> We may update these terms as the product changes; the date at the top will change with them, and continuing to use Ball IQ after an update means you accept the revised version. These terms are governed by Norwegian law, and Ball IQ is operated from Norway. Questions, complaints or anything else: <a href="mailto:hello@balliq.app">hello@balliq.app</a>.`,
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
    title: 'World Cup Quiz — FIFA World Cup Trivia | Ball IQ',
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
    title: 'Premier League Quiz — Football Trivia | Ball IQ',
    description:
      'Free Premier League quiz, most answers explained — the 1992 breakaway, the Invincibles and City’s 100-point season. Test your knowledge.',
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
    title: 'Champions League Quiz — UEFA Trivia | Ball IQ',
    description:
      'Free UEFA Champions League quiz with explained answers — from Real Madrid’s European Cup dynasty to Istanbul 2005 and Liverpool’s comeback against Barcelona.',
    about: 'UEFA Champions League',
    sample: 20,
    intro: [
      `The European Cup became the Champions League in 1992, but the competition's history stretches back to the 1950s and the Real Madrid side that won the first five editions in a row. This free Champions League quiz spans the whole story — the dynasties, the comebacks, the shoot-outs and the nights that get replayed forever.`,
      `Real Madrid run through it like a thread: from Alfredo Di Stéfano's era to a record fifteen titles and counting. But the quiz lives just as much on the great upsets and turnarounds. Liverpool 3-0 down at half-time to AC Milan in Istanbul in 2005, then winning on penalties. Liverpool again in 2019, overturning a 3-0 first-leg deficit to beat Lionel Messi's Barcelona 4-0 at Anfield, Divock Origi poking in the fourth. Chelsea winning the 2012 final on Bayern Munich's own ground, on penalties, after Didier Drogba's late header. And the young Ajax team of 2019 knocking out both Real Madrid and Juventus before losing to Spurs in the last seconds of the semi-final.`,
      `You'll be asked about all-time top scorers (Cristiano Ronaldo leads the list), winning managers, final venues and the specific goals that decided ties. The questions climb from easy — who did Liverpool beat in the 2019 final? — to hard ones about shoot-out heroes and the exact minute a famous goal went in. It's a proper test of how closely you've actually watched Europe's biggest club competition.`,
      // ⚠️ This page renders cat 'UCL', which is 74% explained — NOT the 100%
      // 'ChampionsLeague' cat. It claimed "every answer" until 2026-07-31.
      // Club and player packs ARE 100%, so their claims stay; category pages
      // must say "most". Re-measure before ever strengthening this back.
      `Most answers come with the story behind them, so you finish the quiz knowing more than you started. Try the free sample below, then play the full Champions League bank in the Ball IQ app.`,
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
  ...P3_CATEGORIES,
];

// ── LISTICLE PAGES ────────────────────────────────────────────────────────────
// Cross-cutting "questions and answers" article pages that target high-volume
// head terms (e.g. "football trivia questions and answers"). Unlike category
// pages they pin a hand-picked, CROSS-TOPIC set of questions by id. Every id
// here has been run through the 3-lens currency fact-check before publishing.
export const LISTICLES = [
  {
    slug: 'football-trivia-questions',
    h1: 'Football Trivia Questions and Answers',
    title: 'Football Trivia Questions and Answers (Hard) | Ball IQ',
    description:
      'Hard football trivia questions and answers — World Cup, Premier League, Champions League, Euros, records and legends, most with the story behind them.',
    about: 'Association football trivia',
    lede: 'A hand-picked set of harder football trivia questions — with answers and the story behind each one.',
    intro: [
      `Think you know football? These are the questions that separate the diehards from the casuals — a hand-picked set of harder football trivia questions spanning the World Cup, the Premier League, the Champions League, the Euros and the game's all-time records and legends. Every one comes with the answer and a short explanation, so it works as much for learning as for testing yourself.`,
      `They're pulled straight from the Ball IQ question bank — the same questions our players face in the app — and kept deliberately tough. You'll find the famous moments (Liverpool's 4-0 comeback against Barcelona, Denmark's 1992 fairytale) next to the deep cuts (who managed Blackburn to the title, which club Ronaldo left to join Barcelona in 1996). Get most of these and you genuinely know your football.`,
      `Read them as a quiz or just for the stories behind the answers. When you want more — thousands of questions, a daily challenge, a Wordle-style football guessing game and live multiplayer — the full Ball IQ game is free.`,
    ],
    faq: [
      { q: 'Are these football trivia questions hard?', a: 'Yes — this set is pitched at the harder end on purpose, so it tests even serious fans. For an easier warm-up, try our World Cup or Premier League quizzes.' },
      { q: 'Do the questions come with answers?', a: 'Every question reveals the correct answer plus a short explanation of the story behind it — so you finish knowing something new, even on the ones you miss.' },
      { q: 'Where do the questions come from?', a: 'From the Ball IQ question bank — hand-curated and fact-checked, the same questions our players face in the app.' },
      { q: 'Is it free?', a: 'Yes — play right here in your browser with no sign-up, or get the free Ball IQ app for the full question bank, daily challenges and multiplayer.' },
    ],
    // Pruned to verified-clean ids after the 3-lens fact-check.
    questionIds: [
      'q_864355', 'q_e40932', 'q_919497', 'q_525a8f', 'q_fc472e', 'q_d51cd2',
      'q_0accea', 'q_63c770', 'q_90effe', 'q_0a2ab8', 'q_c93bc3', 'q_7cb21d',
      'q_23692a', 'q_4c0913', 'q_1d815f', 'q_a1278c', 'q_d5cd97', 'q_7b7413',
      'q_cd169c', 'q_1baa06', 'q_6a3e53', 'q_c0963c', 'q_08e349', 'q_490e08',
    ],
  },
  {
    // 2026-07-06: targets the spiking "world cup quiz questions and answers"
    // cluster (GSC already shows an impression for the fifa variant). Prose is
    // deliberately time-safe — only permanently-true tournament facts — so the
    // page converts to evergreen nostalgia traffic after the July 19 final.
    slug: 'world-cup-2026-quiz-questions',
    h1: 'World Cup 2026 Quiz Questions and Answers',
    title: 'World Cup Quiz Questions and Answers (2026) | Ball IQ',
    description:
      '55+ World Cup quiz questions with answers — from Uruguay 1930 to the 48-team 2026 tournament in the USA, Canada and Mexico. Free to play.',
    about: 'FIFA World Cup trivia',
    lede: 'Big set of World Cup quiz questions with answers — graded easy to hard, with most answers explained.',
    intro: [
      `The summer of the 2026 World Cup — the first 48-team edition, hosted across the United States, Canada and Mexico, with the final at MetLife Stadium in New Jersey on July 19 — is the perfect excuse to find out how much World Cup history you actually know. This is a big, hand-picked set of World Cup quiz questions and answers pulled from the Ball IQ question bank: nearly a century of tournaments, from Uruguay lifting the first trophy in 1930 to Argentina's shoot-out win over France in Qatar in 2022.`,
      `The set is graded from easy to hard. The warm-ups ask things any fan should get — who won in 2010, which country has lifted the trophy five times. The middle band digs into the famous moments: Maradona's 1986, the headbutt final of 2006, Germany 7-1 Brazil. And the hard end is for the obsessives — controversial penalties in extra time, golden goals, and the scorers everyone forgets. Whether you're building a pub-quiz round, testing your mates during the group stage, or just settling an argument, there's a difficulty band for it.`,
      `Every question comes with the answer and a short explanation of the story behind it, so you learn something even on the ones you miss — that's the Ball IQ way. Play the interactive sample below free in your browser, no sign-up needed. And when you want more than one round, the full Ball IQ game is free: thousands of fact-checked questions, a World Cup category, a daily challenge and Footle, our Wordle-style daily footballer game.`,
    ],
    faq: [
      { q: 'How many questions are in this World Cup quiz?', a: 'Over 55 on this page, graded easy to hard, each with the answer and a short explanation. The Ball IQ app has a full World Cup category on top of that, plus thousands of questions across other competitions.' },
      { q: 'Does it cover the 2026 World Cup?', a: 'The 2026 tournament — the first with 48 teams, hosted by the USA, Canada and Mexico with the final at MetLife Stadium on July 19, 2026 — is the occasion, but the questions cover all of World Cup history, so the quiz never goes stale.' },
      { q: 'Can I use these for a pub quiz?', a: 'Absolutely — that’s what the difficulty grading is for. Take ten easy ones for a warm-up round and ten hard ones for the tie-breaker, and the explanations double as the quizmaster’s answer notes.' },
      { q: 'Is it free?', a: 'Yes — read and play everything on this page free in your browser with no sign-up. The free Ball IQ app adds the full question bank, daily challenges and live multiplayer.' },
    ],
    // Curated 2026-07-06 from the wc2026-tagged, hint-bearing, fact-checked
    // pool (historical questions only — nothing that references 2026 results).
    questionIds: [
      'q_6a89c9', 'q_1d0d44', 'q_8b2c96', 'q_94bd1f', 'q_91885b', 'q_daec22',
      'q_4e8571', 'q_6e1c7f', 'q_54d598', 'q_c57cdf', 'q_a71513', 'q_e64f49',
      'q_91f758', 'q_e268d2', 'q_81df70', 'q_5a4947', 'q_05402a', 'q_167a08',
      'q_c13e37', 'q_2598ad', 'q_e56652', 'q_dbf430', 'q_8291b6', 'q_79e93e',
      'q_d516d2', 'q_3e6f2c', 'q_ae4e7e', 'q_77bde8', 'q_644bb4', 'q_ed5b17',
      'q_2423c6', 'q_1e635a', 'q_16a635', 'q_e0ce8a', 'q_58c84a', 'q_4b68dd',
      'q_2bd2a8', 'q_bc44c2', 'q_0e64df', 'q_b6cbaa', 'q_ea9ba9', 'q_e86d23',
      'q_149194', 'q_a1996c', 'q_864355', 'q_919497', 'q_5a274f', 'q_bd10c6',
      'q_066e80', 'q_57fa25', 'q_02acbb', 'q_5dde99', 'q_d8cb2f', 'q_0c0f40',
      'q_1ba67b', 'q_ead8d3', 'q_079e01', 'q_2c1747', 'q_c35d5d', 'q_3862ba',
    ],
  },
];

// ── FOOTLE LANDING PAGE ───────────────────────────────────────────────────────
// /football-wordle/ — game-name SEO ("football wordle", "footle"). Ball IQ was
// absent from that SERP even though Footle IS the product (2026-07 growth
// research). Product facts only — nothing time-fragile. The CTA deep-links
// straight into the playable no-login game (src/App.jsx's deep-link handler
// reads ?game=footle at /play).
export const FOOTLE_PAGE = {
  slug: 'football-wordle',
  h1: 'Footle — the Football Wordle',
  title: 'Footle — The Free Daily Football Wordle | Ball IQ',
  description:
    "Footle by Ball IQ is the football Wordle — guess the footballer's surname in 6 tries. A new player every day. Free, in your browser, no sign-up.",
  lede: 'Guess the footballer in 6 tries. New player every day — free, no sign-up.',
  how: [
    ["Guess a footballer's surname", "Legends or current stars — type any footballer's surname of the right length and hit enter."],
    ['Read the colours', "Green: right letter, right spot. Yellow: in the name, different spot. Grey: not in the name at all."],
    ['Solve it in six', "Surnames vary in length — the grid shows how many letters today's player has. You get six guesses."],
    ['Come back tomorrow', 'One Footle per day, the same player for everyone. Share your emoji grid and protect your streak.'],
  ],
  body: [
    `Footle is Ball IQ's daily football word game — Wordle, but the answer is always a footballer. Every day there is one footballer to find, the same for everyone, and six guesses to find them. The tiles tell you how close you are: green for a letter in the right place, yellow for a letter that is in the surname but somewhere else, grey for a miss. Unlike classic Wordle, the surnames are not locked to five letters — SALAH is a very different puzzle from LEWANDOWSKI — so the size of the grid is itself a clue.`,
    `It is free, plays right in the browser, and needs no account. When you solve it (or run out of guesses), you get the shareable emoji grid — "⚽ Ball IQ Footle #64 3/6" — to compare with your friends. In the free Ball IQ app, Footle also tracks your solve streak, and sits alongside the daily quiz challenge, thousands of fact-checked trivia questions and live multiplayer.`,
  ],
  faq: [
    { q: 'What is Footle?', a: "Footle is a daily football version of Wordle by Ball IQ: guess the footballer's surname in six tries, with green, yellow and grey tiles guiding you. One puzzle per day, the same player for everyone." },
    { q: 'Is Footle free? Do I need an account?', a: 'Completely free and no account needed — it runs in your browser. The free Ball IQ app adds solve streaks, daily quiz challenges and live multiplayer.' },
    { q: 'When does a new Footle come out?', a: 'At midnight, local time. Everyone playing on the same calendar day gets the same footballer.' },
    { q: 'How is Footle different from Wordle?', a: "The answer is always a footballer's surname — legends and current stars alike — and the length varies from puzzle to puzzle, so the grid size is your first clue." },
    { q: 'Is this the same as other football Wordle games?', a: 'There are a few football guessing games out there — this one is Footle by Ball IQ, part of the Ball IQ football quiz game. If a friend shared a "⚽ Ball IQ Footle" emoji grid, this is where it came from.' },
  ],
};

// ── /mystery-player/ and /transfer-trail/ — the two newest daily games ────────
//
// WHY THESE PAGES EXIST. Both games shipped and were then INVISIBLE: live,
// finished, playable, and with no page pointing at them. That already cost us
// once — the Transfer Trail sat done-and-dark for days because nothing linked
// to it. Footle has /football-wordle/ and it is our most-played mode; these two
// had nothing.
//
// ⚠️ SEARCH INTENT IS THE GENRE, NOT OUR NAME. Nobody searches "Mystery Player"
// or "Transfer Trail" — those are our names for them, with no volume behind
// them yet. People search the MECHANIC: "guess the footballer", "football
// player guessing game", "guess the player from their transfers". So the h1 and
// title lead with our name (brand) but the description, lede and body carry the
// genre language a fan would actually type. Same trick that got
// /football-wordle/ onto the "football wordle" SERP.
//
// ⚠️ We name no competitor and imitate no competitor's branding. The genre
// descriptions below are plain English for what the game does.
//
// ⚠️ NEVER state the exact question count in this copy. Binding product rule,
// gated by scripts/audit-no-question-count.mjs.
export const MYSTERY_PAGE = {
  slug: 'mystery-player',
  game: 'Mystery Player',
  alternateName: ['Guess the footballer', 'Football player guessing game'],
  gameParam: 'mystery',
  emoji: '🔍',
  h1: 'Mystery Player — guess the secret footballer',
  title: 'Mystery Player — Guess the Footballer Daily | Ball IQ',
  description:
    'Guess the secret footballer. Every guess is ranked by how close it is — club, league, position, nationality, age. Unlimited guesses, one a day, free.',
  lede: 'One secret footballer a day. Every guess tells you how close you are — unlimited tries.',
  statLine: 'Free · no sign-up · new player every day',
  how: [
    ['Name any player', 'Type any footballer from a top-club squad. There is no penalty for a wild first guess — it is information either way.'],
    ['Read the rank', 'Every guess comes back with a number. That is where your player sits against the whole squad list for closeness to the secret one. The secret player is 1.'],
    ['Use the colours', 'Green means you are hot — inside the top handful. Amber is warm. Grey means nothing in common worth chasing.'],
    ['Narrow it down', 'Closeness weighs current club most, then clubs they have played for, league, nationality, position and age. A team-mate scores high; a keeper in another country does not.'],
  ],
  body: [
    `Mystery Player is a daily football guessing game. There is one secret footballer, the same for everyone, and no limit on how many guesses you take to find them. What makes it work is the feedback: instead of a plain right or wrong, every name you try comes back with a rank showing how close that player is to the answer.`,
    `Closeness is not a vibe — it is computed from things a football fan already thinks in. Playing for the same club counts for most. Sharing a club somewhere earlier in a career counts next. Then the league, the nationality, the position and how close in age the two players are. So guessing a team-mate of the answer lands you in the top ten immediately, while a goalkeeper in a different country tells you almost nothing except that you can rule out a whole direction.`,
    `Everyone gets the same player on the same day, which is the point — a result is worth comparing. Solve it and you get a spoiler-safe grid to share that shows how your guesses ran hot and cold without giving the answer away. It is free, plays in the browser with no account, and the Ball IQ app keeps your solve streak.`,
  ],
  faq: [
    { q: 'What is Mystery Player?', a: 'A daily football guessing game: one secret footballer, unlimited guesses, and every guess ranked by how similar that player is to the answer. The secret player is rank 1.' },
    { q: 'How is the closeness ranked?', a: 'By attributes a fan already reasons about — current club first, then clubs the two players have both played for, league, nationality, position and age. Team-mates rank very high; a player with nothing in common ranks very low.' },
    { q: 'How many guesses do I get?', a: 'As many as you want. There is no fail state, so a wild opening guess costs you nothing and usually tells you something.' },
    { q: 'Is it free? Do I need an account?', a: 'Free and no account needed — it runs in your browser. The free Ball IQ app adds your solve streak alongside Footle, the Transfer Trail and the daily quiz.' },
  ],
};

export const TRAIL_PAGE = {
  slug: 'transfer-trail',
  game: 'Transfer Trail',
  alternateName: ['Guess the player from their career path', 'Football transfer history game'],
  gameParam: 'trail',
  emoji: '🧭',
  h1: 'Transfer Trail — name the player from his clubs',
  title: 'Transfer Trail — Guess the Player by Transfers | Ball IQ',
  description:
    "Name the footballer from his career path, one club at a time. Fewer clubs revealed means more points. A new career trail every day — free, no sign-up.",
  lede: 'A career path, revealed one club at a time. Name the player before it runs out.',
  statLine: 'Free · no sign-up · new career every day',
  how: [
    ['Start with one club', "You get the first club of a footballer's career and nothing else. Sometimes that is enough."],
    ['Guess or reveal', 'Name the player, or reveal the next club on the trail. Every reveal makes it easier and costs you points.'],
    ['Fewer clubs, more points', 'Getting it from two clubs is worth far more than getting it from six. The scoring rewards the early call.'],
    ['One trail a day', 'The same career for everyone, every day. Share your result and compare how few clubs you needed.'],
  ],
  body: [
    `Transfer Trail is a daily football guessing game built on career paths. You are shown the clubs a footballer played for, in order, starting with just the first one — and your job is to name him before the trail gives it away. Every club you reveal makes the answer more obvious and your score smaller.`,
    `It rewards the kind of knowledge that quizzes usually miss. Plenty of people can name a Ballon d'Or winner; far fewer can look at a first club in the Belgian league and know where that career went next. Loan spells are marked as loans, and a return to a former club appears as its own step, because that is how a career actually reads.`,
    `One trail a day, the same for everyone, so scores are worth comparing. Free, no account, plays in the browser — and in the Ball IQ app it sits alongside Footle, Mystery Player and the daily quiz, with your streak tracked across all of them.`,
  ],
  faq: [
    { q: 'What is Transfer Trail?', a: "A daily football game where you name a player from his career path. You start with only his first club and can reveal the rest one at a time — the fewer you need, the higher you score." },
    { q: 'How does the scoring work?', a: 'You score most for naming the player from as few clubs as possible. Every club you reveal reduces the points available, so an early correct call beats a safe late one.' },
    { q: 'Are loan spells included?', a: 'Yes, and they are marked as loans rather than hidden — a loan is part of the career. A player returning to a club he had already played for appears as its own step on the trail.' },
    { q: 'Is it free? Do I need an account?', a: 'Free, no account, straight in the browser. The free Ball IQ app keeps your streak and adds Footle, Mystery Player and the daily quiz.' },
  ],
};
