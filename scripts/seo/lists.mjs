// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE-LIST PAGE CONTENT — settled football facts as SEO/AI-answer pages.
// Consumed by scripts/gen-seo-pages.mjs (buildListPage) → /lists/<slug>/.
//
// STRATEGY (see memory project_lists_content_type): win the LONG TAIL, not the
// head. Settled + specific (a past season/year never changes) beats all-time
// head terms that Wikipedia/official sites own and that drift every week.
// Every row is forge-verified (generate → adversarial web fact-check), same bar
// as the question bank — a single wrong cell fails the whole page.
//
//   - `slug`     → /lists/<slug>/
//   - `h1`,`title`,`description` — page + SEO metadata
//   - `intro`    2-3 original context paragraphs
//   - `columns`  table header cells, in order
//   - `rows`     array of rows; each row = array of cell strings in column order
//   - `faq`      3-4 Q&As answering what people actually search
//   - `updated`  ISO date the data was last verified (shown as "as of")
//
// buildListPage auto-interlinks each list into matching /quiz/ club + player
// pages by scanning the rows for known entities — strengthening the internal
// mesh and funnelling readers into "test yourself" quizzes.
// ─────────────────────────────────────────────────────────────────────────────

export const LISTS = [
  {
    "slug": "ballon-dor-winners",
    "h1": "Every Ballon d'Or Winner (1956–2025)",
    "title": "Ballon d'Or Winners: Complete List 1956–2025 | Ball IQ",
    "description": "The complete list of every men's Ballon d'Or winner from 1956 to 2025, with the club and nationality of each winner, year by year.",
    "intro": [
      "The Ballon d'Or is football's most prestigious individual prize, first handed to England winger Stanley Matthews in 1956. Originally awarded by France Football to the best player in Europe, it later opened up to players worldwide and, from 2010 to 2015, merged with FIFA's award to become the FIFA Ballon d'Or before returning to France Football control. This page lists every men's winner in order, alongside the club they were at when they lifted the trophy and their nationality.",
      "The modern era belongs to two players: Lionel Messi holds the record with eight Ballons d'Or, while Cristiano Ronaldo has won five. Between 2008 and 2023 the pair claimed the award 13 times in 16 years — the run broken only by Luka Modrić (2018), Karim Benzema (2022) and the cancelled 2020 edition. Kaká (2007) was the last winner before the duopoly took hold, and Rodri (2024) the first to follow it. No award was given in 2020, when the ceremony was cancelled during the COVID-19 pandemic — the only blank year in the award's history.",
      "A few names stand out for rarity: Lev Yashin remains the only goalkeeper ever to win it, in 1963, and Michel Platini, Johan Cruyff and Marco van Basten are the three players to have won it three times each. The most recent winner is Ousmane Dembélé, who took the 2025 award after leading Paris Saint-Germain to their first Champions League title."
    ],
    "columns": [
      "Year",
      "Winner",
      "Club(s)",
      "Nationality"
    ],
    "rows": [
      [
        "1956",
        "Stanley Matthews",
        "Blackpool",
        "England"
      ],
      [
        "1957",
        "Alfredo Di Stéfano",
        "Real Madrid",
        "Spain"
      ],
      [
        "1958",
        "Raymond Kopa",
        "Real Madrid",
        "France"
      ],
      [
        "1959",
        "Alfredo Di Stéfano",
        "Real Madrid",
        "Spain"
      ],
      [
        "1960",
        "Luis Suárez",
        "Barcelona",
        "Spain"
      ],
      [
        "1961",
        "Omar Sívori",
        "Juventus",
        "Italy"
      ],
      [
        "1962",
        "Josef Masopust",
        "Dukla Prague",
        "Czechoslovakia"
      ],
      [
        "1963",
        "Lev Yashin",
        "Dynamo Moscow",
        "Soviet Union"
      ],
      [
        "1964",
        "Denis Law",
        "Manchester United",
        "Scotland"
      ],
      [
        "1965",
        "Eusébio",
        "Benfica",
        "Portugal"
      ],
      [
        "1966",
        "Bobby Charlton",
        "Manchester United",
        "England"
      ],
      [
        "1967",
        "Flórián Albert",
        "Ferencváros",
        "Hungary"
      ],
      [
        "1968",
        "George Best",
        "Manchester United",
        "Northern Ireland"
      ],
      [
        "1969",
        "Gianni Rivera",
        "AC Milan",
        "Italy"
      ],
      [
        "1970",
        "Gerd Müller",
        "Bayern Munich",
        "West Germany"
      ],
      [
        "1971",
        "Johan Cruyff",
        "Ajax",
        "Netherlands"
      ],
      [
        "1972",
        "Franz Beckenbauer",
        "Bayern Munich",
        "West Germany"
      ],
      [
        "1973",
        "Johan Cruyff",
        "Barcelona",
        "Netherlands"
      ],
      [
        "1974",
        "Johan Cruyff",
        "Barcelona",
        "Netherlands"
      ],
      [
        "1975",
        "Oleg Blokhin",
        "Dynamo Kyiv",
        "Soviet Union"
      ],
      [
        "1976",
        "Franz Beckenbauer",
        "Bayern Munich",
        "West Germany"
      ],
      [
        "1977",
        "Allan Simonsen",
        "Borussia Mönchengladbach",
        "Denmark"
      ],
      [
        "1978",
        "Kevin Keegan",
        "Hamburger SV",
        "England"
      ],
      [
        "1979",
        "Kevin Keegan",
        "Hamburger SV",
        "England"
      ],
      [
        "1980",
        "Karl-Heinz Rummenigge",
        "Bayern Munich",
        "West Germany"
      ],
      [
        "1981",
        "Karl-Heinz Rummenigge",
        "Bayern Munich",
        "West Germany"
      ],
      [
        "1982",
        "Paolo Rossi",
        "Juventus",
        "Italy"
      ],
      [
        "1983",
        "Michel Platini",
        "Juventus",
        "France"
      ],
      [
        "1984",
        "Michel Platini",
        "Juventus",
        "France"
      ],
      [
        "1985",
        "Michel Platini",
        "Juventus",
        "France"
      ],
      [
        "1986",
        "Igor Belanov",
        "Dynamo Kyiv",
        "Soviet Union"
      ],
      [
        "1987",
        "Ruud Gullit",
        "AC Milan",
        "Netherlands"
      ],
      [
        "1988",
        "Marco van Basten",
        "AC Milan",
        "Netherlands"
      ],
      [
        "1989",
        "Marco van Basten",
        "AC Milan",
        "Netherlands"
      ],
      [
        "1990",
        "Lothar Matthäus",
        "Inter Milan",
        "West Germany"
      ],
      [
        "1991",
        "Jean-Pierre Papin",
        "Marseille",
        "France"
      ],
      [
        "1992",
        "Marco van Basten",
        "AC Milan",
        "Netherlands"
      ],
      [
        "1993",
        "Roberto Baggio",
        "Juventus",
        "Italy"
      ],
      [
        "1994",
        "Hristo Stoichkov",
        "Barcelona",
        "Bulgaria"
      ],
      [
        "1995",
        "George Weah",
        "AC Milan",
        "Liberia"
      ],
      [
        "1996",
        "Matthias Sammer",
        "Borussia Dortmund",
        "Germany"
      ],
      [
        "1997",
        "Ronaldo",
        "Inter Milan",
        "Brazil"
      ],
      [
        "1998",
        "Zinédine Zidane",
        "Juventus",
        "France"
      ],
      [
        "1999",
        "Rivaldo",
        "Barcelona",
        "Brazil"
      ],
      [
        "2000",
        "Luís Figo",
        "Real Madrid",
        "Portugal"
      ],
      [
        "2001",
        "Michael Owen",
        "Liverpool",
        "England"
      ],
      [
        "2002",
        "Ronaldo",
        "Real Madrid",
        "Brazil"
      ],
      [
        "2003",
        "Pavel Nedvěd",
        "Juventus",
        "Czech Republic"
      ],
      [
        "2004",
        "Andriy Shevchenko",
        "AC Milan",
        "Ukraine"
      ],
      [
        "2005",
        "Ronaldinho",
        "Barcelona",
        "Brazil"
      ],
      [
        "2006",
        "Fabio Cannavaro",
        "Real Madrid",
        "Italy"
      ],
      [
        "2007",
        "Kaká",
        "AC Milan",
        "Brazil"
      ],
      [
        "2008",
        "Cristiano Ronaldo",
        "Manchester United",
        "Portugal"
      ],
      [
        "2009",
        "Lionel Messi",
        "Barcelona",
        "Argentina"
      ],
      [
        "2010",
        "Lionel Messi",
        "Barcelona",
        "Argentina"
      ],
      [
        "2011",
        "Lionel Messi",
        "Barcelona",
        "Argentina"
      ],
      [
        "2012",
        "Lionel Messi",
        "Barcelona",
        "Argentina"
      ],
      [
        "2013",
        "Cristiano Ronaldo",
        "Real Madrid",
        "Portugal"
      ],
      [
        "2014",
        "Cristiano Ronaldo",
        "Real Madrid",
        "Portugal"
      ],
      [
        "2015",
        "Lionel Messi",
        "Barcelona",
        "Argentina"
      ],
      [
        "2016",
        "Cristiano Ronaldo",
        "Real Madrid",
        "Portugal"
      ],
      [
        "2017",
        "Cristiano Ronaldo",
        "Real Madrid",
        "Portugal"
      ],
      [
        "2018",
        "Luka Modrić",
        "Real Madrid",
        "Croatia"
      ],
      [
        "2019",
        "Lionel Messi",
        "Barcelona",
        "Argentina"
      ],
      [
        "2020",
        "Not awarded (cancelled, COVID-19)",
        "—",
        "—"
      ],
      [
        "2021",
        "Lionel Messi",
        "Paris Saint-Germain",
        "Argentina"
      ],
      [
        "2022",
        "Karim Benzema",
        "Real Madrid",
        "France"
      ],
      [
        "2023",
        "Lionel Messi",
        "Inter Miami",
        "Argentina"
      ],
      [
        "2024",
        "Rodri",
        "Manchester City",
        "Spain"
      ],
      [
        "2025",
        "Ousmane Dembélé",
        "Paris Saint-Germain",
        "France"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most Ballon d'Or awards?",
        "a": "Lionel Messi has won the most with eight (2009, 2010, 2011, 2012, 2015, 2019, 2021 and 2023). Cristiano Ronaldo is second with five, and Michel Platini, Johan Cruyff and Marco van Basten each won three."
      },
      {
        "q": "Who won the first Ballon d'Or?",
        "a": "England winger Stanley Matthews of Blackpool won the inaugural Ballon d'Or in 1956, at the age of 41 — still the oldest winner in the award's history."
      },
      {
        "q": "Why was there no Ballon d'Or winner in 2020?",
        "a": "France Football cancelled the 2020 award because of the COVID-19 pandemic, which disrupted the football calendar. It is the only year since 1956 that no winner was crowned."
      },
      {
        "q": "Who won the 2024 and 2025 Ballon d'Or?",
        "a": "Rodri of Manchester City won the 2024 award, becoming the first Spanish men's winner since 1960. Ousmane Dembélé of Paris Saint-Germain won in 2025 after leading PSG to the Champions League title."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "football's greatest players"
  },
  {
    "slug": "champions-league-winners",
    "h1": "Every Champions League Winner (1956–2025)",
    "title": "Champions League Winners: Every Season 1956–2025 | Ball IQ",
    "description": "Complete list of every European Cup and UEFA Champions League winner by season from 1955-56 to 2024-25, with runners-up and final scores.",
    "intro": [
      "Europe's premier club competition began in 1955-56 as the European Cup, a straight knockout for national champions, and was rebranded the UEFA Champions League in 1992-93 with the addition of group stages and, later, entry for multiple clubs from the strongest leagues. This table lists every winner from the very first final through 2024-25, alongside the runners-up and the score in the final.",
      "A handful of names dominate the honours board. Real Madrid stand alone with 15 titles, including the first five in a row from 1956 to 1960 and a modern run of six between 2014 and 2024. AC Milan follow on seven, with Bayern Munich, Liverpool and Barcelona among the other multiple winners. Eleven finals have been settled by a penalty shootout, and a single replay decided the 1974 final between Bayern and Atlético Madrid.",
      "The most recent entry marks a first: Paris Saint-Germain lifted the trophy for the first time in 2024-25, thrashing Inter Milan 5-0 in Munich for the biggest winning margin in the history of the final. Use the list to see how the roll of champions has shifted from the early Spanish and Italian era to today's cross-continental contenders."
    ],
    "columns": [
      "Season",
      "Winner",
      "Runner-up",
      "Score"
    ],
    "rows": [
      [
        "1955–56",
        "Real Madrid",
        "Reims",
        "4–3"
      ],
      [
        "1956–57",
        "Real Madrid",
        "Fiorentina",
        "2–0"
      ],
      [
        "1957–58",
        "Real Madrid",
        "Milan",
        "3–2 (aet)"
      ],
      [
        "1958–59",
        "Real Madrid",
        "Reims",
        "2–0"
      ],
      [
        "1959–60",
        "Real Madrid",
        "Eintracht Frankfurt",
        "7–3"
      ],
      [
        "1960–61",
        "Benfica",
        "Barcelona",
        "3–2"
      ],
      [
        "1961–62",
        "Benfica",
        "Real Madrid",
        "5–3"
      ],
      [
        "1962–63",
        "Milan",
        "Benfica",
        "2–1"
      ],
      [
        "1963–64",
        "Inter Milan",
        "Real Madrid",
        "3–1"
      ],
      [
        "1964–65",
        "Inter Milan",
        "Benfica",
        "1–0"
      ],
      [
        "1965–66",
        "Real Madrid",
        "Partizan",
        "2–1"
      ],
      [
        "1966–67",
        "Celtic",
        "Inter Milan",
        "2–1"
      ],
      [
        "1967–68",
        "Manchester United",
        "Benfica",
        "4–1 (aet)"
      ],
      [
        "1968–69",
        "Milan",
        "Ajax",
        "4–1"
      ],
      [
        "1969–70",
        "Feyenoord",
        "Celtic",
        "2–1 (aet)"
      ],
      [
        "1970–71",
        "Ajax",
        "Panathinaikos",
        "2–0"
      ],
      [
        "1971–72",
        "Ajax",
        "Inter Milan",
        "2–0"
      ],
      [
        "1972–73",
        "Ajax",
        "Juventus",
        "1–0"
      ],
      [
        "1973–74",
        "Bayern Munich",
        "Atlético Madrid",
        "1–1 (aet), 4–0 replay"
      ],
      [
        "1974–75",
        "Bayern Munich",
        "Leeds United",
        "2–0"
      ],
      [
        "1975–76",
        "Bayern Munich",
        "Saint-Étienne",
        "1–0"
      ],
      [
        "1976–77",
        "Liverpool",
        "Borussia Mönchengladbach",
        "3–1"
      ],
      [
        "1977–78",
        "Liverpool",
        "Club Brugge",
        "1–0"
      ],
      [
        "1978–79",
        "Nottingham Forest",
        "Malmö FF",
        "1–0"
      ],
      [
        "1979–80",
        "Nottingham Forest",
        "Hamburger SV",
        "1–0"
      ],
      [
        "1980–81",
        "Liverpool",
        "Real Madrid",
        "1–0"
      ],
      [
        "1981–82",
        "Aston Villa",
        "Bayern Munich",
        "1–0"
      ],
      [
        "1982–83",
        "Hamburger SV",
        "Juventus",
        "1–0"
      ],
      [
        "1983–84",
        "Liverpool",
        "Roma",
        "1–1 (aet, 4–2 pens)"
      ],
      [
        "1984–85",
        "Juventus",
        "Liverpool",
        "1–0"
      ],
      [
        "1985–86",
        "Steaua București",
        "Barcelona",
        "0–0 (aet, 2–0 pens)"
      ],
      [
        "1986–87",
        "Porto",
        "Bayern Munich",
        "2–1"
      ],
      [
        "1987–88",
        "PSV Eindhoven",
        "Benfica",
        "0–0 (aet, 6–5 pens)"
      ],
      [
        "1988–89",
        "Milan",
        "Steaua București",
        "4–0"
      ],
      [
        "1989–90",
        "Milan",
        "Benfica",
        "1–0"
      ],
      [
        "1990–91",
        "Red Star Belgrade",
        "Marseille",
        "0–0 (aet, 5–3 pens)"
      ],
      [
        "1991–92",
        "Barcelona",
        "Sampdoria",
        "1–0 (aet)"
      ],
      [
        "1992–93",
        "Marseille",
        "Milan",
        "1–0"
      ],
      [
        "1993–94",
        "Milan",
        "Barcelona",
        "4–0"
      ],
      [
        "1994–95",
        "Ajax",
        "Milan",
        "1–0"
      ],
      [
        "1995–96",
        "Juventus",
        "Ajax",
        "1–1 (aet, 4–2 pens)"
      ],
      [
        "1996–97",
        "Borussia Dortmund",
        "Juventus",
        "3–1"
      ],
      [
        "1997–98",
        "Real Madrid",
        "Juventus",
        "1–0"
      ],
      [
        "1998–99",
        "Manchester United",
        "Bayern Munich",
        "2–1"
      ],
      [
        "1999–2000",
        "Real Madrid",
        "Valencia",
        "3–0"
      ],
      [
        "2000–01",
        "Bayern Munich",
        "Valencia",
        "1–1 (aet, 5–4 pens)"
      ],
      [
        "2001–02",
        "Real Madrid",
        "Bayer Leverkusen",
        "2–1"
      ],
      [
        "2002–03",
        "Milan",
        "Juventus",
        "0–0 (aet, 3–2 pens)"
      ],
      [
        "2003–04",
        "Porto",
        "Monaco",
        "3–0"
      ],
      [
        "2004–05",
        "Liverpool",
        "Milan",
        "3–3 (aet, 3–2 pens)"
      ],
      [
        "2005–06",
        "Barcelona",
        "Arsenal",
        "2–1"
      ],
      [
        "2006–07",
        "Milan",
        "Liverpool",
        "2–1"
      ],
      [
        "2007–08",
        "Manchester United",
        "Chelsea",
        "1–1 (aet, 6–5 pens)"
      ],
      [
        "2008–09",
        "Barcelona",
        "Manchester United",
        "2–0"
      ],
      [
        "2009–10",
        "Inter Milan",
        "Bayern Munich",
        "2–0"
      ],
      [
        "2010–11",
        "Barcelona",
        "Manchester United",
        "3–1"
      ],
      [
        "2011–12",
        "Chelsea",
        "Bayern Munich",
        "1–1 (aet, 4–3 pens)"
      ],
      [
        "2012–13",
        "Bayern Munich",
        "Borussia Dortmund",
        "2–1"
      ],
      [
        "2013–14",
        "Real Madrid",
        "Atlético Madrid",
        "4–1 (aet)"
      ],
      [
        "2014–15",
        "Barcelona",
        "Juventus",
        "3–1"
      ],
      [
        "2015–16",
        "Real Madrid",
        "Atlético Madrid",
        "1–1 (aet, 5–3 pens)"
      ],
      [
        "2016–17",
        "Real Madrid",
        "Juventus",
        "4–1"
      ],
      [
        "2017–18",
        "Real Madrid",
        "Liverpool",
        "3–1"
      ],
      [
        "2018–19",
        "Liverpool",
        "Tottenham Hotspur",
        "2–0"
      ],
      [
        "2019–20",
        "Bayern Munich",
        "Paris Saint-Germain",
        "1–0"
      ],
      [
        "2020–21",
        "Chelsea",
        "Manchester City",
        "1–0"
      ],
      [
        "2021–22",
        "Real Madrid",
        "Liverpool",
        "1–0"
      ],
      [
        "2022–23",
        "Manchester City",
        "Inter Milan",
        "1–0"
      ],
      [
        "2023–24",
        "Real Madrid",
        "Borussia Dortmund",
        "2–0"
      ],
      [
        "2024–25",
        "Paris Saint-Germain",
        "Inter Milan",
        "5–0"
      ],
      [
        "2025–26",
        "Paris Saint-Germain",
        "Arsenal",
        "1–1 (a.e.t., 4–3 pen.)"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Champions League / European Cup titles?",
        "a": "Real Madrid, with 15 titles. That includes the first five European Cups (1956–1960) and six more in the modern Champions League era between 2014 and 2024. AC Milan are next with seven."
      },
      {
        "q": "Who won the 2025 Champions League final?",
        "a": "Paris Saint-Germain won their first-ever title, beating Inter Milan 5-0 in Munich on 31 May 2025 — the largest winning margin in the history of the final."
      },
      {
        "q": "When did the European Cup become the Champions League?",
        "a": "The competition was renamed for the 1992-93 season, which introduced a group stage. Marseille were the first winners under the new Champions League branding."
      },
      {
        "q": "How many Champions League finals have been decided by a penalty shootout?",
        "a": "Eleven, starting with Liverpool's win over Roma in 1984. The most recent was Real Madrid beating Atlético Madrid on penalties in 2016."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Champions League"
  },
  {
    "slug": "premier-league-top-scorers",
    "h1": "Every Premier League Golden Boot Winner (1992-93 to 2024-25)",
    "title": "Premier League Golden Boot Winners: Every Season's Top Scorer | Ball IQ",
    "description": "The complete list of Premier League Golden Boot winners and top scorers for every season from 1992-93 to 2024-25, with clubs and goal tallies.",
    "intro": [
      "The Premier League Golden Boot goes to the division's leading goalscorer at the end of each 38-game campaign. Since the competition's first season in 1992-93, the award has traced the careers of the game's most feared strikers — from Alan Shearer's mid-90s dominance to Thierry Henry's Arsenal peak, and on to the record-breaking hauls of Mohamed Salah and Erling Haaland.",
      "This table lists the top scorer for every completed Premier League season, along with the club they scored for and their final goal tally. Where the Boot was shared, all joint winners are listed together — the award has been split five times, most notably the three-way ties of 1997-98 and 1998-99, both settled on 18 goals.",
      "A few numbers stand out. Haaland's 36 goals in 2022-23 is the highest total ever recorded by a Golden Boot winner across a 38-game season. Salah and Henry share the record for most wins with four apiece, while Shearer is the only player to claim the award in three consecutive seasons. Robin van Persie remains the only man to win back-to-back Boots with different clubs."
    ],
    "columns": [
      "Season",
      "Player",
      "Club",
      "Goals"
    ],
    "rows": [
      [
        "1992-93",
        "Teddy Sheringham",
        "Tottenham Hotspur",
        "22"
      ],
      [
        "1993-94",
        "Andy Cole",
        "Newcastle United",
        "34"
      ],
      [
        "1994-95",
        "Alan Shearer",
        "Blackburn Rovers",
        "34"
      ],
      [
        "1995-96",
        "Alan Shearer",
        "Blackburn Rovers",
        "31"
      ],
      [
        "1996-97",
        "Alan Shearer",
        "Newcastle United",
        "25"
      ],
      [
        "1997-98",
        "Chris Sutton, Dion Dublin, Michael Owen",
        "Blackburn Rovers, Coventry City, Liverpool",
        "18"
      ],
      [
        "1998-99",
        "Jimmy Floyd Hasselbaink, Michael Owen, Dwight Yorke",
        "Leeds United, Liverpool, Manchester United",
        "18"
      ],
      [
        "1999-2000",
        "Kevin Phillips",
        "Sunderland",
        "30"
      ],
      [
        "2000-01",
        "Jimmy Floyd Hasselbaink",
        "Chelsea",
        "23"
      ],
      [
        "2001-02",
        "Thierry Henry",
        "Arsenal",
        "24"
      ],
      [
        "2002-03",
        "Ruud van Nistelrooy",
        "Manchester United",
        "25"
      ],
      [
        "2003-04",
        "Thierry Henry",
        "Arsenal",
        "30"
      ],
      [
        "2004-05",
        "Thierry Henry",
        "Arsenal",
        "25"
      ],
      [
        "2005-06",
        "Thierry Henry",
        "Arsenal",
        "27"
      ],
      [
        "2006-07",
        "Didier Drogba",
        "Chelsea",
        "20"
      ],
      [
        "2007-08",
        "Cristiano Ronaldo",
        "Manchester United",
        "31"
      ],
      [
        "2008-09",
        "Nicolas Anelka",
        "Chelsea",
        "19"
      ],
      [
        "2009-10",
        "Didier Drogba",
        "Chelsea",
        "29"
      ],
      [
        "2010-11",
        "Dimitar Berbatov, Carlos Tevez",
        "Manchester United, Manchester City",
        "20"
      ],
      [
        "2011-12",
        "Robin van Persie",
        "Arsenal",
        "30"
      ],
      [
        "2012-13",
        "Robin van Persie",
        "Manchester United",
        "26"
      ],
      [
        "2013-14",
        "Luis Suarez",
        "Liverpool",
        "31"
      ],
      [
        "2014-15",
        "Sergio Aguero",
        "Manchester City",
        "26"
      ],
      [
        "2015-16",
        "Harry Kane",
        "Tottenham Hotspur",
        "25"
      ],
      [
        "2016-17",
        "Harry Kane",
        "Tottenham Hotspur",
        "29"
      ],
      [
        "2017-18",
        "Mohamed Salah",
        "Liverpool",
        "32"
      ],
      [
        "2018-19",
        "Mohamed Salah, Sadio Mane, Pierre-Emerick Aubameyang",
        "Liverpool, Liverpool, Arsenal",
        "22"
      ],
      [
        "2019-20",
        "Jamie Vardy",
        "Leicester City",
        "23"
      ],
      [
        "2020-21",
        "Harry Kane",
        "Tottenham Hotspur",
        "23"
      ],
      [
        "2021-22",
        "Mohamed Salah, Son Heung-min",
        "Liverpool, Tottenham Hotspur",
        "23"
      ],
      [
        "2022-23",
        "Erling Haaland",
        "Manchester City",
        "36"
      ],
      [
        "2023-24",
        "Erling Haaland",
        "Manchester City",
        "27"
      ],
      [
        "2024-25",
        "Mohamed Salah",
        "Liverpool",
        "29"
      ],
      [
        "2025-26",
        "Erling Haaland",
        "Manchester City",
        "27"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most Premier League Golden Boots?",
        "a": "Mohamed Salah and Thierry Henry share the record with four Golden Boots each. Henry won in 2001-02, 2003-04, 2004-05 and 2005-06; Salah won in 2017-18, 2018-19, 2021-22 and 2024-25."
      },
      {
        "q": "What is the most goals scored by a Golden Boot winner in a season?",
        "a": "Erling Haaland holds the record with 36 goals for Manchester City in 2022-23, the most ever in a 38-game Premier League season. Andy Cole (1993-94) and Alan Shearer (1994-95) previously held the mark with 34 each."
      },
      {
        "q": "Has the Premier League Golden Boot ever been shared?",
        "a": "Yes, five times. It was split three ways in both 1997-98 and 1998-99 (all on 18 goals), and shared in 2010-11 (Berbatov and Tevez, 20), 2018-19 (Salah, Mane and Aubameyang, 22) and 2021-22 (Salah and Son, 23)."
      },
      {
        "q": "Who won the first Premier League Golden Boot?",
        "a": "Teddy Sheringham won the inaugural Golden Boot in 1992-93 with 22 goals, scored mostly for Tottenham Hotspur after an early-season move from Nottingham Forest."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Premier League"
  },
  {
    "slug": "world-cup-winners",
    "h1": "Every World Cup Winner (1930-2026)",
    "title": "World Cup Winners: Full List 1930-2026 | Ball IQ",
    "description": "The complete list of every FIFA World Cup winner from 1930 to 2026 — champions, runners-up, final scores and host nations in one chronological table.",
    "intro": [
      "Since Uruguay lifted the very first trophy on home soil in 1930, the FIFA World Cup has crowned a champion every four years — pausing only in 1942 and 1946 as the world went to war. Across 23 tournaments, just eight nations have ever gotten their hands on the trophy, a club so exclusive that reaching a final is itself a piece of history.",
      "Brazil remain the benchmark with five titles and the distinction of being the only side to appear at every finals. Germany and Italy sit on four apiece, while Argentina's 2022 triumph in Qatar and Spain's breakthrough in 2010 rounded out the modern era. The table below tracks every final in order, including the host nation and whether the decisive match needed extra time or penalties.",
      "The 2026 edition — the first ever co-hosted by three countries, the United States, Canada and Mexico, and the first with 48 teams — ended with a new chapter: Spain edged Argentina 1-0 after extra time on July 19, 2026, to claim their second World Cup and deny Lionel Messi a farewell repeat."
    ],
    "columns": [
      "Year",
      "Winner",
      "Runner-up",
      "Score",
      "Host"
    ],
    "rows": [
      [
        "1930",
        "Uruguay",
        "Argentina",
        "4-2",
        "Uruguay"
      ],
      [
        "1934",
        "Italy",
        "Czechoslovakia",
        "2-1 (a.e.t.)",
        "Italy"
      ],
      [
        "1938",
        "Italy",
        "Hungary",
        "4-2",
        "France"
      ],
      [
        "1950",
        "Uruguay",
        "Brazil",
        "2-1",
        "Brazil"
      ],
      [
        "1954",
        "West Germany",
        "Hungary",
        "3-2",
        "Switzerland"
      ],
      [
        "1958",
        "Brazil",
        "Sweden",
        "5-2",
        "Sweden"
      ],
      [
        "1962",
        "Brazil",
        "Czechoslovakia",
        "3-1",
        "Chile"
      ],
      [
        "1966",
        "England",
        "West Germany",
        "4-2 (a.e.t.)",
        "England"
      ],
      [
        "1970",
        "Brazil",
        "Italy",
        "4-1",
        "Mexico"
      ],
      [
        "1974",
        "West Germany",
        "Netherlands",
        "2-1",
        "West Germany"
      ],
      [
        "1978",
        "Argentina",
        "Netherlands",
        "3-1 (a.e.t.)",
        "Argentina"
      ],
      [
        "1982",
        "Italy",
        "West Germany",
        "3-1",
        "Spain"
      ],
      [
        "1986",
        "Argentina",
        "West Germany",
        "3-2",
        "Mexico"
      ],
      [
        "1990",
        "West Germany",
        "Argentina",
        "1-0",
        "Italy"
      ],
      [
        "1994",
        "Brazil",
        "Italy",
        "0-0 (a.e.t., 3-2 pen.)",
        "United States"
      ],
      [
        "1998",
        "France",
        "Brazil",
        "3-0",
        "France"
      ],
      [
        "2002",
        "Brazil",
        "Germany",
        "2-0",
        "South Korea / Japan"
      ],
      [
        "2006",
        "Italy",
        "France",
        "1-1 (a.e.t., 5-3 pen.)",
        "Germany"
      ],
      [
        "2010",
        "Spain",
        "Netherlands",
        "1-0 (a.e.t.)",
        "South Africa"
      ],
      [
        "2014",
        "Germany",
        "Argentina",
        "1-0 (a.e.t.)",
        "Brazil"
      ],
      [
        "2018",
        "France",
        "Croatia",
        "4-2",
        "Russia"
      ],
      [
        "2022",
        "Argentina",
        "France",
        "3-3 (a.e.t., 4-2 pen.)",
        "Qatar"
      ],
      [
        "2026",
        "Spain",
        "Argentina",
        "1-0 (a.e.t.)",
        "United States / Canada / Mexico"
      ]
    ],
    "faq": [
      {
        "q": "Which country has won the most World Cups?",
        "a": "Brazil have won the most, with five titles (1958, 1962, 1970, 1994 and 2002). They are also the only nation to have played at every World Cup finals in history."
      },
      {
        "q": "Who won the 2026 World Cup?",
        "a": "Spain won the 2026 World Cup, beating Argentina 1-0 after extra time in the final on July 19, 2026. Ferran Torres scored the only goal in the 106th minute. It was Spain's second world title after 2010."
      },
      {
        "q": "How many different countries have won the World Cup?",
        "a": "Eight nations have won it: Brazil (5), Germany/West Germany (4), Italy (4), Argentina (3), France (2), Uruguay (2), Spain (2) and England (1)."
      },
      {
        "q": "Why were there no World Cups in 1942 and 1946?",
        "a": "The tournaments scheduled for 1942 and 1946 were not held because of World War II. The competition resumed in 1950 in Brazil, when Uruguay won their second title."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "World Cup history"
  },
  {
    "slug": "euro-winners",
    "h1": "Every UEFA European Championship Winner (1960-2024)",
    "title": "Euro Winners: Every European Championship Winner (1960-2024) | Ball IQ",
    "description": "The complete list of every UEFA European Championship winner from 1960 to 2024, with finals, runners-up, scores and host nations for all 17 tournaments.",
    "intro": [
      "The UEFA European Championship, universally known as the Euros, is the continent's premier national-team tournament, held every four years since 1960. Fewer nations have lifted it than you might expect: across 17 editions from 1960 to 2024, only 10 different countries have been crowned champions of Europe, making the trophy one of the hardest in football to win.",
      "Spain now stands alone at the top. Their 2-1 win over England in Berlin in 2024 delivered a record fourth title, moving them clear of Germany, who have three. The competition has also produced some of football's greatest shocks, none bigger than Denmark's 1992 triumph after being called up as late replacements, and Greece's stunning 2004 run as rank outsiders.",
      "This table lists every Euros winner in chronological order, along with the beaten finalist, the score in the final (noting extra time and penalty shootouts where relevant) and the host nation. Note that Euro 2020 was postponed by the COVID-19 pandemic and actually played in the summer of 2021, though it kept its original name."
    ],
    "columns": [
      "Year",
      "Winner",
      "Runner-up",
      "Score",
      "Host"
    ],
    "rows": [
      [
        "1960",
        "Soviet Union",
        "Yugoslavia",
        "2-1 (a.e.t.)",
        "France"
      ],
      [
        "1964",
        "Spain",
        "Soviet Union",
        "2-1",
        "Spain"
      ],
      [
        "1968",
        "Italy",
        "Yugoslavia",
        "2-0 (replay, after 1-1 a.e.t.)",
        "Italy"
      ],
      [
        "1972",
        "West Germany",
        "Soviet Union",
        "3-0",
        "Belgium"
      ],
      [
        "1976",
        "Czechoslovakia",
        "West Germany",
        "2-2 (5-3 pens)",
        "Yugoslavia"
      ],
      [
        "1980",
        "West Germany",
        "Belgium",
        "2-1",
        "Italy"
      ],
      [
        "1984",
        "France",
        "Spain",
        "2-0",
        "France"
      ],
      [
        "1988",
        "Netherlands",
        "Soviet Union",
        "2-0",
        "West Germany"
      ],
      [
        "1992",
        "Denmark",
        "Germany",
        "2-0",
        "Sweden"
      ],
      [
        "1996",
        "Germany",
        "Czech Republic",
        "2-1 (golden goal, a.e.t.)",
        "England"
      ],
      [
        "2000",
        "France",
        "Italy",
        "2-1 (golden goal, a.e.t.)",
        "Belgium & Netherlands"
      ],
      [
        "2004",
        "Greece",
        "Portugal",
        "1-0",
        "Portugal"
      ],
      [
        "2008",
        "Spain",
        "Germany",
        "1-0",
        "Austria & Switzerland"
      ],
      [
        "2012",
        "Spain",
        "Italy",
        "4-0",
        "Poland & Ukraine"
      ],
      [
        "2016",
        "Portugal",
        "France",
        "1-0 (a.e.t.)",
        "France"
      ],
      [
        "2020",
        "Italy",
        "England",
        "1-1 (3-2 pens)",
        "Europe (11 host cities; final at Wembley, England)"
      ],
      [
        "2024",
        "Spain",
        "England",
        "2-1",
        "Germany"
      ]
    ],
    "faq": [
      {
        "q": "Which country has won the most Euros?",
        "a": "Spain has won the most European Championships with four titles (1964, 2008, 2012 and 2024). Germany/West Germany is second with three (1972, 1980 and 1996)."
      },
      {
        "q": "Who won Euro 2024?",
        "a": "Spain won Euro 2024, beating England 2-1 in the final at the Olympiastadion in Berlin on 14 July 2024. Goals from Nico Williams and Mikel Oyarzabal sealed a record fourth title, and Spain won all seven of their matches at the tournament."
      },
      {
        "q": "Why was Euro 2020 played in 2021?",
        "a": "Euro 2020 was postponed by a year because of the COVID-19 pandemic and was played in the summer of 2021, but UEFA kept the 'Euro 2020' name. Italy won it, beating England on penalties at Wembley."
      },
      {
        "q": "Has England ever won the Euros?",
        "a": "No. England has reached two Euros finals, losing to Italy on penalties in 2020 (played 2021) and to Spain 2-1 in 2024, but has never won the tournament."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Euros"
  },
  {
    "slug": "la-liga-champions",
    "h1": "Every La Liga Champion by Season (1928-29 to 2024-25)",
    "title": "La Liga Champions: Every Winner by Season (1929-2025) | Ball IQ",
    "description": "The complete list of Spanish La Liga champions and runners-up, season by season from 1928-29 through 2024-25. Every winner in one chronological table.",
    "intro": [
      "Spain's Primera Division kicked off in 1928-29 with just ten clubs, and Barcelona edged Real Madrid by two points to claim the very first title. Nearly a century later, the same two names still tower over the record books, but the story in between is richer than the modern rivalry suggests.",
      "The competition paused for three seasons between 1936 and 1939 during the Spanish Civil War, and the early decades saw Athletic Bilbao, Valencia, Atletico Madrid (as Atletico Aviacion) and even Sevilla and Real Betis lift the trophy. Real Sociedad's back-to-back titles in the early 1980s and Deportivo La Coruna's famous 1999-2000 triumph remain the last time the crown escaped the traditional big three for long stretches.",
      "This table lists every champion and runner-up in order, so you can trace the shifts in Spanish football power from the pre-war era through the Galactico years to Barcelona and Real Madrid trading the title year after year into the 2020s."
    ],
    "columns": [
      "Season",
      "Champions",
      "Runner-up"
    ],
    "rows": [
      [
        "1928-29",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "1929-30",
        "Athletic Bilbao",
        "Barcelona"
      ],
      [
        "1930-31",
        "Athletic Bilbao",
        "Racing Santander"
      ],
      [
        "1931-32",
        "Real Madrid",
        "Athletic Bilbao"
      ],
      [
        "1932-33",
        "Real Madrid",
        "Athletic Bilbao"
      ],
      [
        "1933-34",
        "Athletic Bilbao",
        "Real Madrid"
      ],
      [
        "1934-35",
        "Real Betis",
        "Real Madrid"
      ],
      [
        "1935-36",
        "Athletic Bilbao",
        "Real Madrid"
      ],
      [
        "1939-40",
        "Atletico Madrid",
        "Sevilla"
      ],
      [
        "1940-41",
        "Atletico Madrid",
        "Athletic Bilbao"
      ],
      [
        "1941-42",
        "Valencia",
        "Real Madrid"
      ],
      [
        "1942-43",
        "Athletic Bilbao",
        "Sevilla"
      ],
      [
        "1943-44",
        "Valencia",
        "Atletico Madrid"
      ],
      [
        "1944-45",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "1945-46",
        "Sevilla",
        "Barcelona"
      ],
      [
        "1946-47",
        "Valencia",
        "Athletic Bilbao"
      ],
      [
        "1947-48",
        "Barcelona",
        "Valencia"
      ],
      [
        "1948-49",
        "Barcelona",
        "Valencia"
      ],
      [
        "1949-50",
        "Atletico Madrid",
        "Deportivo La Coruna"
      ],
      [
        "1950-51",
        "Atletico Madrid",
        "Sevilla"
      ],
      [
        "1951-52",
        "Barcelona",
        "Athletic Bilbao"
      ],
      [
        "1952-53",
        "Barcelona",
        "Valencia"
      ],
      [
        "1953-54",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1954-55",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1955-56",
        "Athletic Bilbao",
        "Barcelona"
      ],
      [
        "1956-57",
        "Real Madrid",
        "Sevilla"
      ],
      [
        "1957-58",
        "Real Madrid",
        "Atletico Madrid"
      ],
      [
        "1958-59",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "1959-60",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "1960-61",
        "Real Madrid",
        "Atletico Madrid"
      ],
      [
        "1961-62",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1962-63",
        "Real Madrid",
        "Atletico Madrid"
      ],
      [
        "1963-64",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1964-65",
        "Real Madrid",
        "Atletico Madrid"
      ],
      [
        "1965-66",
        "Atletico Madrid",
        "Real Madrid"
      ],
      [
        "1966-67",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1967-68",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1968-69",
        "Real Madrid",
        "Las Palmas"
      ],
      [
        "1969-70",
        "Atletico Madrid",
        "Athletic Bilbao"
      ],
      [
        "1970-71",
        "Valencia",
        "Barcelona"
      ],
      [
        "1971-72",
        "Real Madrid",
        "Valencia"
      ],
      [
        "1972-73",
        "Atletico Madrid",
        "Barcelona"
      ],
      [
        "1973-74",
        "Barcelona",
        "Atletico Madrid"
      ],
      [
        "1974-75",
        "Real Madrid",
        "Zaragoza"
      ],
      [
        "1975-76",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1976-77",
        "Atletico Madrid",
        "Barcelona"
      ],
      [
        "1977-78",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1978-79",
        "Real Madrid",
        "Sporting Gijon"
      ],
      [
        "1979-80",
        "Real Madrid",
        "Real Sociedad"
      ],
      [
        "1980-81",
        "Real Sociedad",
        "Real Madrid"
      ],
      [
        "1981-82",
        "Real Sociedad",
        "Barcelona"
      ],
      [
        "1982-83",
        "Athletic Bilbao",
        "Real Madrid"
      ],
      [
        "1983-84",
        "Athletic Bilbao",
        "Real Madrid"
      ],
      [
        "1984-85",
        "Barcelona",
        "Atletico Madrid"
      ],
      [
        "1985-86",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1986-87",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1987-88",
        "Real Madrid",
        "Real Sociedad"
      ],
      [
        "1988-89",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1989-90",
        "Real Madrid",
        "Valencia"
      ],
      [
        "1990-91",
        "Barcelona",
        "Atletico Madrid"
      ],
      [
        "1991-92",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "1992-93",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "1993-94",
        "Barcelona",
        "Deportivo La Coruna"
      ],
      [
        "1994-95",
        "Real Madrid",
        "Deportivo La Coruna"
      ],
      [
        "1995-96",
        "Atletico Madrid",
        "Valencia"
      ],
      [
        "1996-97",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "1997-98",
        "Barcelona",
        "Athletic Bilbao"
      ],
      [
        "1998-99",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "1999-2000",
        "Deportivo La Coruna",
        "Barcelona"
      ],
      [
        "2000-01",
        "Real Madrid",
        "Deportivo La Coruna"
      ],
      [
        "2001-02",
        "Valencia",
        "Deportivo La Coruna"
      ],
      [
        "2002-03",
        "Real Madrid",
        "Real Sociedad"
      ],
      [
        "2003-04",
        "Valencia",
        "Barcelona"
      ],
      [
        "2004-05",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2005-06",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2006-07",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "2007-08",
        "Real Madrid",
        "Villarreal"
      ],
      [
        "2008-09",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2009-10",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2010-11",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2011-12",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "2012-13",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2013-14",
        "Atletico Madrid",
        "Barcelona"
      ],
      [
        "2014-15",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2015-16",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2016-17",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "2017-18",
        "Barcelona",
        "Atletico Madrid"
      ],
      [
        "2018-19",
        "Barcelona",
        "Atletico Madrid"
      ],
      [
        "2019-20",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "2020-21",
        "Atletico Madrid",
        "Real Madrid"
      ],
      [
        "2021-22",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "2022-23",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2023-24",
        "Real Madrid",
        "Barcelona"
      ],
      [
        "2024-25",
        "Barcelona",
        "Real Madrid"
      ],
      [
        "2025-26",
        "Barcelona",
        "Real Madrid"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most La Liga titles?",
        "a": "Real Madrid is the most successful club in La Liga history with 36 titles, followed by Barcelona on 28 (through 2024-25). Atletico Madrid is third with 11, ahead of Athletic Bilbao (8) and Valencia (6)."
      },
      {
        "q": "Who won the first La Liga title?",
        "a": "Barcelona won the inaugural 1928-29 Primera Division, finishing two points ahead of Real Madrid in a ten-team league."
      },
      {
        "q": "Why are there no La Liga champions between 1936 and 1939?",
        "a": "La Liga was suspended for three seasons during the Spanish Civil War, so no championship was contested from 1936-37 through 1938-39. Play resumed in 1939-40."
      },
      {
        "q": "Has any club outside Real Madrid and Barcelona won La Liga recently?",
        "a": "Yes. Atletico Madrid are the most recent club to break the duopoly, winning the title in 2020-21. Before that, Atletico also won in 2013-14, the last time either Madrid or Barcelona did not finish top."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "La Liga"
  },
  {
    "slug": "serie-a-champions",
    "h1": "Every Serie A Champion by Season (1929–2025)",
    "title": "Serie A Champions by Season: Every Scudetto Winner 1929–2025 | Ball IQ",
    "description": "The complete list of Italian Serie A champions and runners-up by season, from 1929-30 to 2024-25 — every Scudetto winner, including the Calciopoli revocation.",
    "intro": [
      "Since Italy's top division was unified into a single national round-robin in 1929, the Scudetto — the small tricolour shield champions wear the following season — has been the ultimate prize in Italian football. This page lists every Serie A champion and runner-up by season, from Ambrosiana-Inter's inaugural 1929-30 crown through Napoli's 2024-25 triumph.",
      "A handful of seasons carry footnotes. No championship was contested during 1943-44 and 1944-45 because of the Second World War, so those years are absent from the list. And the 2004-05 and 2005-06 titles were reshaped by the 2006 Calciopoli scandal: the 2004-05 Scudetto was stripped from Juventus and never reassigned, while the 2005-06 title was taken from Juventus and awarded to Internazionale by the courts. Both are shown here exactly as the record stands.",
      "Juventus dominate the honours board, but the story is far richer than one club — Torino's post-war Grande Torino side, provincial shocks from Cagliari, Hellas Verona and Sampdoria, and the modern resurgence of Napoli and Inter all sit within these rows."
    ],
    "columns": [
      "Season",
      "Champions",
      "Runner-up"
    ],
    "rows": [
      [
        "1929–30",
        "Ambrosiana-Inter",
        "Genoa"
      ],
      [
        "1930–31",
        "Juventus",
        "Roma"
      ],
      [
        "1931–32",
        "Juventus",
        "Bologna"
      ],
      [
        "1932–33",
        "Juventus",
        "Ambrosiana-Inter"
      ],
      [
        "1933–34",
        "Juventus",
        "Ambrosiana-Inter"
      ],
      [
        "1934–35",
        "Juventus",
        "Ambrosiana-Inter"
      ],
      [
        "1935–36",
        "Bologna",
        "Roma"
      ],
      [
        "1936–37",
        "Bologna",
        "Lazio"
      ],
      [
        "1937–38",
        "Ambrosiana-Inter",
        "Juventus"
      ],
      [
        "1938–39",
        "Bologna",
        "Torino"
      ],
      [
        "1939–40",
        "Ambrosiana-Inter",
        "Bologna"
      ],
      [
        "1940–41",
        "Bologna",
        "Ambrosiana-Inter"
      ],
      [
        "1941–42",
        "Roma",
        "Torino"
      ],
      [
        "1942–43",
        "Torino",
        "Livorno"
      ],
      [
        "1945–46",
        "Torino",
        "Juventus"
      ],
      [
        "1946–47",
        "Torino",
        "Juventus"
      ],
      [
        "1947–48",
        "Torino",
        "Milan"
      ],
      [
        "1948–49",
        "Torino",
        "Internazionale"
      ],
      [
        "1949–50",
        "Juventus",
        "Milan"
      ],
      [
        "1950–51",
        "Milan",
        "Internazionale"
      ],
      [
        "1951–52",
        "Juventus",
        "Milan"
      ],
      [
        "1952–53",
        "Internazionale",
        "Juventus"
      ],
      [
        "1953–54",
        "Internazionale",
        "Juventus"
      ],
      [
        "1954–55",
        "Milan",
        "Udinese"
      ],
      [
        "1955–56",
        "Fiorentina",
        "Milan"
      ],
      [
        "1956–57",
        "Milan",
        "Fiorentina"
      ],
      [
        "1957–58",
        "Juventus",
        "Fiorentina"
      ],
      [
        "1958–59",
        "Milan",
        "Fiorentina"
      ],
      [
        "1959–60",
        "Juventus",
        "Fiorentina"
      ],
      [
        "1960–61",
        "Juventus",
        "Milan"
      ],
      [
        "1961–62",
        "Milan",
        "Internazionale"
      ],
      [
        "1962–63",
        "Internazionale",
        "Juventus"
      ],
      [
        "1963–64",
        "Bologna",
        "Internazionale"
      ],
      [
        "1964–65",
        "Internazionale",
        "Milan"
      ],
      [
        "1965–66",
        "Internazionale",
        "Bologna"
      ],
      [
        "1966–67",
        "Juventus",
        "Internazionale"
      ],
      [
        "1967–68",
        "Milan",
        "Napoli"
      ],
      [
        "1968–69",
        "Fiorentina",
        "Cagliari"
      ],
      [
        "1969–70",
        "Cagliari",
        "Internazionale"
      ],
      [
        "1970–71",
        "Internazionale",
        "Milan"
      ],
      [
        "1971–72",
        "Juventus",
        "Milan"
      ],
      [
        "1972–73",
        "Juventus",
        "Milan"
      ],
      [
        "1973–74",
        "Lazio",
        "Juventus"
      ],
      [
        "1974–75",
        "Juventus",
        "Napoli"
      ],
      [
        "1975–76",
        "Torino",
        "Juventus"
      ],
      [
        "1976–77",
        "Juventus",
        "Torino"
      ],
      [
        "1977–78",
        "Juventus",
        "Vicenza and Torino"
      ],
      [
        "1978–79",
        "Milan",
        "Perugia"
      ],
      [
        "1979–80",
        "Internazionale",
        "Juventus"
      ],
      [
        "1980–81",
        "Juventus",
        "Roma"
      ],
      [
        "1981–82",
        "Juventus",
        "Fiorentina"
      ],
      [
        "1982–83",
        "Roma",
        "Juventus"
      ],
      [
        "1983–84",
        "Juventus",
        "Roma"
      ],
      [
        "1984–85",
        "Hellas Verona",
        "Torino"
      ],
      [
        "1985–86",
        "Juventus",
        "Roma"
      ],
      [
        "1986–87",
        "Napoli",
        "Juventus"
      ],
      [
        "1987–88",
        "Milan",
        "Napoli"
      ],
      [
        "1988–89",
        "Internazionale",
        "Napoli"
      ],
      [
        "1989–90",
        "Napoli",
        "Milan"
      ],
      [
        "1990–91",
        "Sampdoria",
        "Milan"
      ],
      [
        "1991–92",
        "Milan",
        "Juventus"
      ],
      [
        "1992–93",
        "Milan",
        "Internazionale"
      ],
      [
        "1993–94",
        "Milan",
        "Juventus"
      ],
      [
        "1994–95",
        "Juventus",
        "Parma"
      ],
      [
        "1995–96",
        "Milan",
        "Juventus"
      ],
      [
        "1996–97",
        "Juventus",
        "Parma"
      ],
      [
        "1997–98",
        "Juventus",
        "Internazionale"
      ],
      [
        "1998–99",
        "Milan",
        "Lazio"
      ],
      [
        "1999–2000",
        "Lazio",
        "Juventus"
      ],
      [
        "2000–01",
        "Roma",
        "Juventus"
      ],
      [
        "2001–02",
        "Juventus",
        "Roma"
      ],
      [
        "2002–03",
        "Juventus",
        "Internazionale"
      ],
      [
        "2003–04",
        "Milan",
        "Roma"
      ],
      [
        "2004–05",
        "Not awarded — stripped from Juventus (Calciopoli)",
        "Milan (2nd on the pitch)"
      ],
      [
        "2005–06",
        "Internazionale (awarded after Calciopoli)",
        "Roma"
      ],
      [
        "2006–07",
        "Internazionale",
        "Roma"
      ],
      [
        "2007–08",
        "Internazionale",
        "Roma"
      ],
      [
        "2008–09",
        "Internazionale",
        "Juventus"
      ],
      [
        "2009–10",
        "Internazionale",
        "Roma"
      ],
      [
        "2010–11",
        "Milan",
        "Internazionale"
      ],
      [
        "2011–12",
        "Juventus",
        "Milan"
      ],
      [
        "2012–13",
        "Juventus",
        "Napoli"
      ],
      [
        "2013–14",
        "Juventus",
        "Roma"
      ],
      [
        "2014–15",
        "Juventus",
        "Roma"
      ],
      [
        "2015–16",
        "Juventus",
        "Napoli"
      ],
      [
        "2016–17",
        "Juventus",
        "Roma"
      ],
      [
        "2017–18",
        "Juventus",
        "Napoli"
      ],
      [
        "2018–19",
        "Juventus",
        "Napoli"
      ],
      [
        "2019–20",
        "Juventus",
        "Internazionale"
      ],
      [
        "2020–21",
        "Internazionale",
        "Milan"
      ],
      [
        "2021–22",
        "Milan",
        "Internazionale"
      ],
      [
        "2022–23",
        "Napoli",
        "Lazio"
      ],
      [
        "2023–24",
        "Internazionale",
        "Milan"
      ],
      [
        "2024–25",
        "Napoli",
        "Internazionale"
      ],
      [
        "2025–26",
        "Internazionale",
        "Napoli"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Serie A titles?",
        "a": "Juventus is the most successful club in Italian league history with 36 recognised Scudetti. Note that two further titles from the Calciopoli era are not counted: the 2004-05 crown was revoked and the 2005-06 crown was reassigned to Internazionale. Inter are next with 20 titles, followed by Milan with 19."
      },
      {
        "q": "What happened to the 2004-05 Serie A title?",
        "a": "Juventus finished top of the table on the pitch, but in the wake of the 2006 Calciopoli match-fixing scandal the Italian federation stripped Juventus of the 2004-05 Scudetto and left it unassigned. It remains the only Serie A season with no recognised champion. The 2005-06 title was also taken from Juventus and awarded to Inter."
      },
      {
        "q": "Who won Serie A in 2025?",
        "a": "Napoli won the 2024-25 Serie A title, finishing one point ahead of Internazionale. It was Napoli's fourth league championship and their second in three seasons, sealed under head coach Antonio Conte."
      },
      {
        "q": "How many Serie A titles has Napoli won?",
        "a": "Napoli have won four Serie A titles: 1986-87 and 1989-90 during the Diego Maradona era, then 2022-23 and 2024-25 in the modern era."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "Serie A"
  },
  {
    "slug": "bundesliga-champions",
    "h1": "Every Bundesliga Champion by Season (1963-64 to 2024-25)",
    "title": "Bundesliga Champions: Full List of Winners by Season | Ball IQ",
    "description": "The complete list of German Bundesliga champions and runners-up for every season from the competition's 1963-64 debut through to 2024-25.",
    "intro": [
      "The Bundesliga launched in 1963-64, replacing Germany's old regional-league playoff system with a single national top flight. Its very first champions were 1. FC Koln, and in the six decades since, the title has told the story of German football's shifting powers - from the Borussia Monchengladbach and Hamburger SV sides of the 1970s to the era of near-total Bayern Munich dominance.",
      "Bayern Munich are comfortably the record holders, having lifted the Meisterschale more than 30 times, including an unbroken run of eleven consecutive titles between 2012-13 and 2022-23. That streak was finally ended by Bayer Leverkusen, who went the entire 2023-24 season unbeaten to win their first-ever German championship under Xabi Alonso.",
      "Bayern reclaimed the crown in 2024-25 with Leverkusen as runners-up, restoring the familiar order at the top. This page lists every champion and the side that finished second, season by season, so you can trace the full sweep of Bundesliga history in one place."
    ],
    "columns": [
      "Season",
      "Champions",
      "Runner-up"
    ],
    "rows": [
      [
        "1963-64",
        "1. FC Koln",
        "Meidericher SV"
      ],
      [
        "1964-65",
        "Werder Bremen",
        "1. FC Koln"
      ],
      [
        "1965-66",
        "TSV 1860 Munich",
        "Borussia Dortmund"
      ],
      [
        "1966-67",
        "Eintracht Braunschweig",
        "TSV 1860 Munich"
      ],
      [
        "1967-68",
        "1. FC Nurnberg",
        "Werder Bremen"
      ],
      [
        "1968-69",
        "Bayern Munich",
        "Alemannia Aachen"
      ],
      [
        "1969-70",
        "Borussia Monchengladbach",
        "Bayern Munich"
      ],
      [
        "1970-71",
        "Borussia Monchengladbach",
        "Bayern Munich"
      ],
      [
        "1971-72",
        "Bayern Munich",
        "Schalke 04"
      ],
      [
        "1972-73",
        "Bayern Munich",
        "1. FC Koln"
      ],
      [
        "1973-74",
        "Bayern Munich",
        "Borussia Monchengladbach"
      ],
      [
        "1974-75",
        "Borussia Monchengladbach",
        "Hertha BSC"
      ],
      [
        "1975-76",
        "Borussia Monchengladbach",
        "Hamburger SV"
      ],
      [
        "1976-77",
        "Borussia Monchengladbach",
        "Schalke 04"
      ],
      [
        "1977-78",
        "1. FC Koln",
        "Borussia Monchengladbach"
      ],
      [
        "1978-79",
        "Hamburger SV",
        "VfB Stuttgart"
      ],
      [
        "1979-80",
        "Bayern Munich",
        "Hamburger SV"
      ],
      [
        "1980-81",
        "Bayern Munich",
        "Hamburger SV"
      ],
      [
        "1981-82",
        "Hamburger SV",
        "1. FC Koln"
      ],
      [
        "1982-83",
        "Hamburger SV",
        "Werder Bremen"
      ],
      [
        "1983-84",
        "VfB Stuttgart",
        "Hamburger SV"
      ],
      [
        "1984-85",
        "Bayern Munich",
        "Werder Bremen"
      ],
      [
        "1985-86",
        "Bayern Munich",
        "Werder Bremen"
      ],
      [
        "1986-87",
        "Bayern Munich",
        "Hamburger SV"
      ],
      [
        "1987-88",
        "Werder Bremen",
        "Bayern Munich"
      ],
      [
        "1988-89",
        "Bayern Munich",
        "1. FC Koln"
      ],
      [
        "1989-90",
        "Bayern Munich",
        "1. FC Koln"
      ],
      [
        "1990-91",
        "1. FC Kaiserslautern",
        "Bayern Munich"
      ],
      [
        "1991-92",
        "VfB Stuttgart",
        "Borussia Dortmund"
      ],
      [
        "1992-93",
        "Werder Bremen",
        "Bayern Munich"
      ],
      [
        "1993-94",
        "Bayern Munich",
        "1. FC Kaiserslautern"
      ],
      [
        "1994-95",
        "Borussia Dortmund",
        "Werder Bremen"
      ],
      [
        "1995-96",
        "Borussia Dortmund",
        "Bayern Munich"
      ],
      [
        "1996-97",
        "Bayern Munich",
        "Bayer Leverkusen"
      ],
      [
        "1997-98",
        "1. FC Kaiserslautern",
        "Bayern Munich"
      ],
      [
        "1998-99",
        "Bayern Munich",
        "Bayer Leverkusen"
      ],
      [
        "1999-2000",
        "Bayern Munich",
        "Bayer Leverkusen"
      ],
      [
        "2000-01",
        "Bayern Munich",
        "Schalke 04"
      ],
      [
        "2001-02",
        "Borussia Dortmund",
        "Bayer Leverkusen"
      ],
      [
        "2002-03",
        "Bayern Munich",
        "VfB Stuttgart"
      ],
      [
        "2003-04",
        "Werder Bremen",
        "Bayern Munich"
      ],
      [
        "2004-05",
        "Bayern Munich",
        "Schalke 04"
      ],
      [
        "2005-06",
        "Bayern Munich",
        "Werder Bremen"
      ],
      [
        "2006-07",
        "VfB Stuttgart",
        "Schalke 04"
      ],
      [
        "2007-08",
        "Bayern Munich",
        "Werder Bremen"
      ],
      [
        "2008-09",
        "VfL Wolfsburg",
        "Bayern Munich"
      ],
      [
        "2009-10",
        "Bayern Munich",
        "Schalke 04"
      ],
      [
        "2010-11",
        "Borussia Dortmund",
        "Bayer Leverkusen"
      ],
      [
        "2011-12",
        "Borussia Dortmund",
        "Bayern Munich"
      ],
      [
        "2012-13",
        "Bayern Munich",
        "Borussia Dortmund"
      ],
      [
        "2013-14",
        "Bayern Munich",
        "Borussia Dortmund"
      ],
      [
        "2014-15",
        "Bayern Munich",
        "VfL Wolfsburg"
      ],
      [
        "2015-16",
        "Bayern Munich",
        "Borussia Dortmund"
      ],
      [
        "2016-17",
        "Bayern Munich",
        "RB Leipzig"
      ],
      [
        "2017-18",
        "Bayern Munich",
        "Schalke 04"
      ],
      [
        "2018-19",
        "Bayern Munich",
        "Borussia Dortmund"
      ],
      [
        "2019-20",
        "Bayern Munich",
        "Borussia Dortmund"
      ],
      [
        "2020-21",
        "Bayern Munich",
        "RB Leipzig"
      ],
      [
        "2021-22",
        "Bayern Munich",
        "Borussia Dortmund"
      ],
      [
        "2022-23",
        "Bayern Munich",
        "Borussia Dortmund"
      ],
      [
        "2023-24",
        "Bayer Leverkusen",
        "VfB Stuttgart"
      ],
      [
        "2024-25",
        "Bayern Munich",
        "Bayer Leverkusen"
      ],
      [
        "2025-26",
        "Bayern Munich",
        "Borussia Dortmund"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Bundesliga titles?",
        "a": "Bayern Munich are by far the most successful club in Bundesliga history, with more than 30 titles - including eleven in a row from 2012-13 to 2022-23. No other club comes close; Borussia Monchengladbach and Borussia Dortmund are next with five league titles each in the Bundesliga era."
      },
      {
        "q": "Who won the first-ever Bundesliga season?",
        "a": "1. FC Koln won the inaugural 1963-64 Bundesliga, finishing ahead of runners-up Meidericher SV (now known as MSV Duisburg). It remains one of only three top-flight German titles Koln has ever won."
      },
      {
        "q": "Who ended Bayern Munich's eleven-year title streak?",
        "a": "Bayer Leverkusen ended Bayern's run of eleven consecutive titles by winning the 2023-24 Bundesliga. Under Xabi Alonso they went the entire league season unbeaten - the first team to do so in Bundesliga history - claiming their first German championship."
      },
      {
        "q": "Who won the 2024-25 Bundesliga?",
        "a": "Bayern Munich won the 2024-25 Bundesliga, reclaiming the title from Bayer Leverkusen, who finished as runners-up. It was Bayern's record-extending title of the Bundesliga era, sealed with two games to spare."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Bundesliga"
  },
  {
    "slug": "super-lig-champions",
    "h1": "Every Süper Lig Champion (1959-2025)",
    "title": "Süper Lig Champions: Every Turkish Title Winner (1959-2025) | Ball IQ",
    "description": "The complete list of Turkish Süper Lig champions and runners-up, season by season from 1959 to 2024-25. Every title from Galatasaray to Fenerbahçe, verified.",
    "intro": [
      "Turkey's top flight was founded in 1959 as the Milli Lig, uniting the strongest clubs from Istanbul, Ankara and Izmir into a single national league for the first time. Fenerbahçe claimed that inaugural title, and for decades the competition has been dominated by a familiar core of giants. Galatasaray, Fenerbahçe and Beşiktaş, the three great Istanbul clubs, have shared the overwhelming majority of championships since day one.",
      "Only two sides have broken the big-three grip on the trophy. Trabzonspor stormed to six titles between 1976 and 1984, becoming the first champion from outside Istanbul and earning their place among the historic powers. Decades later, Bursaspor (2009-10) and İstanbul Başakşehir (2019-20) each managed a single surprise crown, brief interruptions in an otherwise metropolitan story.",
      "The table below lists every Süper Lig champion and runner-up in chronological order, from the 1959 season through 2024-25. Galatasaray enter the modern era as the dominant force, sealing a run of consecutive titles and pulling clear at the top of Turkey's all-time honours list."
    ],
    "columns": [
      "Season",
      "Champions",
      "Runner-up"
    ],
    "rows": [
      [
        "1959",
        "Fenerbahçe",
        "Galatasaray"
      ],
      [
        "1959-60",
        "Beşiktaş",
        "Fenerbahçe"
      ],
      [
        "1960-61",
        "Fenerbahçe",
        "Galatasaray"
      ],
      [
        "1961-62",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "1962-63",
        "Galatasaray",
        "Beşiktaş"
      ],
      [
        "1963-64",
        "Fenerbahçe",
        "Beşiktaş"
      ],
      [
        "1964-65",
        "Fenerbahçe",
        "Beşiktaş"
      ],
      [
        "1965-66",
        "Beşiktaş",
        "Galatasaray"
      ],
      [
        "1966-67",
        "Beşiktaş",
        "Fenerbahçe"
      ],
      [
        "1967-68",
        "Fenerbahçe",
        "Beşiktaş"
      ],
      [
        "1968-69",
        "Galatasaray",
        "Eskişehirspor"
      ],
      [
        "1969-70",
        "Fenerbahçe",
        "Eskişehirspor"
      ],
      [
        "1970-71",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "1971-72",
        "Galatasaray",
        "Eskişehirspor"
      ],
      [
        "1972-73",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "1973-74",
        "Fenerbahçe",
        "Beşiktaş"
      ],
      [
        "1974-75",
        "Fenerbahçe",
        "Galatasaray"
      ],
      [
        "1975-76",
        "Trabzonspor",
        "Fenerbahçe"
      ],
      [
        "1976-77",
        "Trabzonspor",
        "Fenerbahçe"
      ],
      [
        "1977-78",
        "Fenerbahçe",
        "Trabzonspor"
      ],
      [
        "1978-79",
        "Trabzonspor",
        "Galatasaray"
      ],
      [
        "1979-80",
        "Trabzonspor",
        "Fenerbahçe"
      ],
      [
        "1980-81",
        "Trabzonspor",
        "Adanaspor"
      ],
      [
        "1981-82",
        "Beşiktaş",
        "Trabzonspor"
      ],
      [
        "1982-83",
        "Fenerbahçe",
        "Trabzonspor"
      ],
      [
        "1983-84",
        "Trabzonspor",
        "Fenerbahçe"
      ],
      [
        "1984-85",
        "Fenerbahçe",
        "Beşiktaş"
      ],
      [
        "1985-86",
        "Beşiktaş",
        "Galatasaray"
      ],
      [
        "1986-87",
        "Galatasaray",
        "Beşiktaş"
      ],
      [
        "1987-88",
        "Galatasaray",
        "Beşiktaş"
      ],
      [
        "1988-89",
        "Fenerbahçe",
        "Beşiktaş"
      ],
      [
        "1989-90",
        "Beşiktaş",
        "Fenerbahçe"
      ],
      [
        "1990-91",
        "Beşiktaş",
        "Galatasaray"
      ],
      [
        "1991-92",
        "Beşiktaş",
        "Fenerbahçe"
      ],
      [
        "1992-93",
        "Galatasaray",
        "Beşiktaş"
      ],
      [
        "1993-94",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "1994-95",
        "Beşiktaş",
        "Trabzonspor"
      ],
      [
        "1995-96",
        "Fenerbahçe",
        "Trabzonspor"
      ],
      [
        "1996-97",
        "Galatasaray",
        "Beşiktaş"
      ],
      [
        "1997-98",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "1998-99",
        "Galatasaray",
        "Beşiktaş"
      ],
      [
        "1999-2000",
        "Galatasaray",
        "Beşiktaş"
      ],
      [
        "2000-01",
        "Fenerbahçe",
        "Galatasaray"
      ],
      [
        "2001-02",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2002-03",
        "Beşiktaş",
        "Galatasaray"
      ],
      [
        "2003-04",
        "Fenerbahçe",
        "Trabzonspor"
      ],
      [
        "2004-05",
        "Fenerbahçe",
        "Trabzonspor"
      ],
      [
        "2005-06",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2006-07",
        "Fenerbahçe",
        "Beşiktaş"
      ],
      [
        "2007-08",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2008-09",
        "Beşiktaş",
        "Sivasspor"
      ],
      [
        "2009-10",
        "Bursaspor",
        "Fenerbahçe"
      ],
      [
        "2010-11",
        "Fenerbahçe",
        "Trabzonspor"
      ],
      [
        "2011-12",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2012-13",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2013-14",
        "Fenerbahçe",
        "Galatasaray"
      ],
      [
        "2014-15",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2015-16",
        "Beşiktaş",
        "Fenerbahçe"
      ],
      [
        "2016-17",
        "Beşiktaş",
        "İstanbul Başakşehir"
      ],
      [
        "2017-18",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2018-19",
        "Galatasaray",
        "İstanbul Başakşehir"
      ],
      [
        "2019-20",
        "İstanbul Başakşehir",
        "Trabzonspor"
      ],
      [
        "2020-21",
        "Beşiktaş",
        "Galatasaray"
      ],
      [
        "2021-22",
        "Trabzonspor",
        "Fenerbahçe"
      ],
      [
        "2022-23",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2023-24",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2024-25",
        "Galatasaray",
        "Fenerbahçe"
      ],
      [
        "2025-26",
        "Galatasaray",
        "Fenerbahçe"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Süper Lig titles?",
        "a": "Galatasaray are the most successful club in Süper Lig history. They sealed their 25th league title in 2024-25, pulling clear of Fenerbahçe and Beşiktaş at the top of Turkey's all-time honours list."
      },
      {
        "q": "Who won the first Turkish Süper Lig title?",
        "a": "Fenerbahçe won the inaugural championship in 1959, the first season of Turkey's unified national league (then called the Milli Lig). They finished ahead of Galatasaray."
      },
      {
        "q": "Has any club outside the big three ever won the Süper Lig?",
        "a": "Yes. Trabzonspor broke the Istanbul monopoly with six titles between 1976 and 1984. Bursaspor (2009-10) and İstanbul Başakşehir (2019-20) have each won the league once as well."
      },
      {
        "q": "Who won the Süper Lig in 2024-25?",
        "a": "Galatasaray won the 2024-25 Süper Lig, their third consecutive title, finishing 11 points clear of runners-up Fenerbahçe (95 points to 84). The title made them the first Turkish club to earn a fifth star for reaching 25 championships."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Süper Lig"
  },
  {
    "slug": "premier-league-champions",
    "h1": "Every Premier League Champion (1992-2025)",
    "title": "Premier League Champions: Every Winner by Season (1992-2025) | Ball IQ",
    "description": "The complete list of Premier League champions and runners-up for every season from 1992-93 to 2024-25, with title winners in full chronological order.",
    "intro": [
      "The Premier League launched in 1992-93, breaking away from the old Football League First Division to become English football's top tier. Since then, only a handful of clubs have managed to get their hands on the trophy, and the roll of honour tells the story of shifting eras of dominance across more than three decades.",
      "Manchester United set the early pace, racking up title after title through the 1990s and 2000s. The last fifteen years, though, belong largely to Manchester City, whose spending and squad depth produced an unprecedented run of championships, including four in a row. Only two clubs, Blackburn Rovers and Leicester City, have ever crashed the party as unexpected one-off winners.",
      "This page lists every Premier League champion and runner-up, season by season, from the inaugural 1992-93 campaign through to 2024-25 — the year Liverpool reclaimed the crown under Arne Slot. Note that these are Premier League era titles only; earlier First Division championships are counted separately."
    ],
    "columns": [
      "Season",
      "Champions",
      "Runner-up"
    ],
    "rows": [
      [
        "1992-93",
        "Manchester United",
        "Aston Villa"
      ],
      [
        "1993-94",
        "Manchester United",
        "Blackburn Rovers"
      ],
      [
        "1994-95",
        "Blackburn Rovers",
        "Manchester United"
      ],
      [
        "1995-96",
        "Manchester United",
        "Newcastle United"
      ],
      [
        "1996-97",
        "Manchester United",
        "Newcastle United"
      ],
      [
        "1997-98",
        "Arsenal",
        "Manchester United"
      ],
      [
        "1998-99",
        "Manchester United",
        "Arsenal"
      ],
      [
        "1999-2000",
        "Manchester United",
        "Arsenal"
      ],
      [
        "2000-01",
        "Manchester United",
        "Arsenal"
      ],
      [
        "2001-02",
        "Arsenal",
        "Liverpool"
      ],
      [
        "2002-03",
        "Manchester United",
        "Arsenal"
      ],
      [
        "2003-04",
        "Arsenal",
        "Chelsea"
      ],
      [
        "2004-05",
        "Chelsea",
        "Arsenal"
      ],
      [
        "2005-06",
        "Chelsea",
        "Manchester United"
      ],
      [
        "2006-07",
        "Manchester United",
        "Chelsea"
      ],
      [
        "2007-08",
        "Manchester United",
        "Chelsea"
      ],
      [
        "2008-09",
        "Manchester United",
        "Liverpool"
      ],
      [
        "2009-10",
        "Chelsea",
        "Manchester United"
      ],
      [
        "2010-11",
        "Manchester United",
        "Chelsea"
      ],
      [
        "2011-12",
        "Manchester City",
        "Manchester United"
      ],
      [
        "2012-13",
        "Manchester United",
        "Manchester City"
      ],
      [
        "2013-14",
        "Manchester City",
        "Liverpool"
      ],
      [
        "2014-15",
        "Chelsea",
        "Manchester City"
      ],
      [
        "2015-16",
        "Leicester City",
        "Arsenal"
      ],
      [
        "2016-17",
        "Chelsea",
        "Tottenham Hotspur"
      ],
      [
        "2017-18",
        "Manchester City",
        "Manchester United"
      ],
      [
        "2018-19",
        "Manchester City",
        "Liverpool"
      ],
      [
        "2019-20",
        "Liverpool",
        "Manchester City"
      ],
      [
        "2020-21",
        "Manchester City",
        "Manchester United"
      ],
      [
        "2021-22",
        "Manchester City",
        "Liverpool"
      ],
      [
        "2022-23",
        "Manchester City",
        "Arsenal"
      ],
      [
        "2023-24",
        "Manchester City",
        "Arsenal"
      ],
      [
        "2024-25",
        "Liverpool",
        "Arsenal"
      ],
      [
        "2025-26",
        "Arsenal",
        "Manchester City"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Premier League titles?",
        "a": "Manchester United has won the most Premier League titles with 13, all under manager Sir Alex Ferguson between 1993 and 2013. Manchester City is second with a rapidly growing tally, having dominated the competition since 2011-12."
      },
      {
        "q": "Who won the first ever Premier League title?",
        "a": "Manchester United won the inaugural Premier League title in 1992-93, finishing ten points clear of runners-up Aston Villa. It ended the club's 26-year wait for an English top-flight championship."
      },
      {
        "q": "Have any 'underdog' clubs won the Premier League?",
        "a": "Yes. Blackburn Rovers won in 1994-95, and Leicester City pulled off one of sport's greatest shocks by winning the 2015-16 title as 5000-1 pre-season outsiders. They remain the only two clubs outside the traditional powers to lift the trophy."
      },
      {
        "q": "Who won the 2024-25 Premier League?",
        "a": "Liverpool won the 2024-25 Premier League, their second title of the Premier League era, in Arne Slot's first season as manager. Arsenal finished as runners-up for the third season in a row."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Premier League"
  },
  {
    "slug": "ligue-1-champions",
    "h1": "Every Ligue 1 Champion (1932-2025)",
    "title": "Ligue 1 Champions: Full Winners List by Season (1932-2025) | Ball IQ",
    "description": "The complete list of French Ligue 1 champions and runners-up for every season from 1932-33 to 2024-25, from Olympique Lillois to PSG's modern dynasty.",
    "intro": [
      "France's top flight kicked off as a professional league in 1932, and its roll of honour reads like a tour of the country's football heartlands: the northern mill towns of Lille and Roubaix, the Mediterranean giants of Marseille and Nice, and the green wave of Saint-Étienne, whose 10 titles set the early benchmark. For decades no single club could keep a grip on the trophy for long.",
      "That changed with the Qatari takeover of Paris Saint-Germain. Since 2013 PSG have turned the Ligue 1 title into an almost annual formality, assembling the most dominant era any French club has known and pushing their tally past Saint-Étienne and Marseille to lead the all-time count. Only Montpellier, Monaco and Lille have interrupted the run.",
      "This table lists every champion and runner-up from the inaugural 1932-33 season through 2024-25. Note the 1992-93 line: Marseille finished top on the pitch but were stripped of the title amid a match-fixing scandal, and no champion was officially awarded that year."
    ],
    "columns": [
      "Season",
      "Champions",
      "Runner-up"
    ],
    "rows": [
      [
        "1932-33",
        "Olympique Lillois",
        "Cannes"
      ],
      [
        "1933-34",
        "Sète",
        "Fives"
      ],
      [
        "1934-35",
        "Sochaux",
        "Strasbourg"
      ],
      [
        "1935-36",
        "RC Paris",
        "Olympique Lillois"
      ],
      [
        "1936-37",
        "Marseille",
        "Sochaux"
      ],
      [
        "1937-38",
        "Sochaux",
        "Marseille"
      ],
      [
        "1938-39",
        "Sète",
        "Marseille"
      ],
      [
        "1939-45",
        "Not contested (World War II)",
        "—"
      ],
      [
        "1945-46",
        "Lille",
        "Saint-Étienne"
      ],
      [
        "1946-47",
        "Roubaix-Tourcoing",
        "Reims"
      ],
      [
        "1947-48",
        "Marseille",
        "Lille"
      ],
      [
        "1948-49",
        "Reims",
        "Lille"
      ],
      [
        "1949-50",
        "Bordeaux",
        "Lille"
      ],
      [
        "1950-51",
        "Nice",
        "Lille"
      ],
      [
        "1951-52",
        "Nice",
        "Bordeaux"
      ],
      [
        "1952-53",
        "Reims",
        "Sochaux"
      ],
      [
        "1953-54",
        "Lille",
        "Reims"
      ],
      [
        "1954-55",
        "Reims",
        "Toulouse"
      ],
      [
        "1955-56",
        "Nice",
        "Lens"
      ],
      [
        "1956-57",
        "Saint-Étienne",
        "Lens"
      ],
      [
        "1957-58",
        "Reims",
        "Nîmes"
      ],
      [
        "1958-59",
        "Nice",
        "Nîmes"
      ],
      [
        "1959-60",
        "Reims",
        "Nîmes"
      ],
      [
        "1960-61",
        "Monaco",
        "RC Paris"
      ],
      [
        "1961-62",
        "Reims",
        "RC Paris"
      ],
      [
        "1962-63",
        "Monaco",
        "Reims"
      ],
      [
        "1963-64",
        "Saint-Étienne",
        "Monaco"
      ],
      [
        "1964-65",
        "Nantes",
        "Bordeaux"
      ],
      [
        "1965-66",
        "Nantes",
        "Bordeaux"
      ],
      [
        "1966-67",
        "Saint-Étienne",
        "Nantes"
      ],
      [
        "1967-68",
        "Saint-Étienne",
        "Nice"
      ],
      [
        "1968-69",
        "Saint-Étienne",
        "Bordeaux"
      ],
      [
        "1969-70",
        "Saint-Étienne",
        "Marseille"
      ],
      [
        "1970-71",
        "Marseille",
        "Saint-Étienne"
      ],
      [
        "1971-72",
        "Marseille",
        "Nîmes"
      ],
      [
        "1972-73",
        "Nantes",
        "Nice"
      ],
      [
        "1973-74",
        "Saint-Étienne",
        "Nantes"
      ],
      [
        "1974-75",
        "Saint-Étienne",
        "Marseille"
      ],
      [
        "1975-76",
        "Saint-Étienne",
        "Nice"
      ],
      [
        "1976-77",
        "Nantes",
        "Lens"
      ],
      [
        "1977-78",
        "Monaco",
        "Nantes"
      ],
      [
        "1978-79",
        "Strasbourg",
        "Nantes"
      ],
      [
        "1979-80",
        "Nantes",
        "Sochaux"
      ],
      [
        "1980-81",
        "Saint-Étienne",
        "Nantes"
      ],
      [
        "1981-82",
        "Monaco",
        "Saint-Étienne"
      ],
      [
        "1982-83",
        "Nantes",
        "Bordeaux"
      ],
      [
        "1983-84",
        "Bordeaux",
        "Monaco"
      ],
      [
        "1984-85",
        "Bordeaux",
        "Nantes"
      ],
      [
        "1985-86",
        "Paris Saint-Germain",
        "Nantes"
      ],
      [
        "1986-87",
        "Bordeaux",
        "Marseille"
      ],
      [
        "1987-88",
        "Monaco",
        "Bordeaux"
      ],
      [
        "1988-89",
        "Marseille",
        "Paris Saint-Germain"
      ],
      [
        "1989-90",
        "Marseille",
        "Bordeaux"
      ],
      [
        "1990-91",
        "Marseille",
        "Monaco"
      ],
      [
        "1991-92",
        "Marseille",
        "Monaco"
      ],
      [
        "1992-93",
        "Not awarded (Marseille stripped of title)",
        "Paris Saint-Germain"
      ],
      [
        "1993-94",
        "Paris Saint-Germain",
        "Marseille"
      ],
      [
        "1994-95",
        "Nantes",
        "Lyon"
      ],
      [
        "1995-96",
        "Auxerre",
        "Paris Saint-Germain"
      ],
      [
        "1996-97",
        "Monaco",
        "Paris Saint-Germain"
      ],
      [
        "1997-98",
        "Lens",
        "Metz"
      ],
      [
        "1998-99",
        "Bordeaux",
        "Marseille"
      ],
      [
        "1999-2000",
        "Monaco",
        "Paris Saint-Germain"
      ],
      [
        "2000-01",
        "Nantes",
        "Lyon"
      ],
      [
        "2001-02",
        "Lyon",
        "Lens"
      ],
      [
        "2002-03",
        "Lyon",
        "Monaco"
      ],
      [
        "2003-04",
        "Lyon",
        "Paris Saint-Germain"
      ],
      [
        "2004-05",
        "Lyon",
        "Lille"
      ],
      [
        "2005-06",
        "Lyon",
        "Bordeaux"
      ],
      [
        "2006-07",
        "Lyon",
        "Marseille"
      ],
      [
        "2007-08",
        "Lyon",
        "Bordeaux"
      ],
      [
        "2008-09",
        "Bordeaux",
        "Marseille"
      ],
      [
        "2009-10",
        "Marseille",
        "Lyon"
      ],
      [
        "2010-11",
        "Lille",
        "Marseille"
      ],
      [
        "2011-12",
        "Montpellier",
        "Paris Saint-Germain"
      ],
      [
        "2012-13",
        "Paris Saint-Germain",
        "Marseille"
      ],
      [
        "2013-14",
        "Paris Saint-Germain",
        "Monaco"
      ],
      [
        "2014-15",
        "Paris Saint-Germain",
        "Lyon"
      ],
      [
        "2015-16",
        "Paris Saint-Germain",
        "Lyon"
      ],
      [
        "2016-17",
        "Monaco",
        "Paris Saint-Germain"
      ],
      [
        "2017-18",
        "Paris Saint-Germain",
        "Monaco"
      ],
      [
        "2018-19",
        "Paris Saint-Germain",
        "Lille"
      ],
      [
        "2019-20",
        "Paris Saint-Germain",
        "Marseille"
      ],
      [
        "2020-21",
        "Lille",
        "Paris Saint-Germain"
      ],
      [
        "2021-22",
        "Paris Saint-Germain",
        "Marseille"
      ],
      [
        "2022-23",
        "Paris Saint-Germain",
        "Lens"
      ],
      [
        "2023-24",
        "Paris Saint-Germain",
        "Monaco"
      ],
      [
        "2024-25",
        "Paris Saint-Germain",
        "Marseille"
      ],
      [
        "2025-26",
        "Paris Saint-Germain",
        "Lens"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Ligue 1 titles?",
        "a": "Paris Saint-Germain lead the all-time list. Fuelled by their Qatari ownership since 2011, PSG have overtaken Saint-Étienne (10 titles) and Marseille (nine recognised titles) to become France's most successful club, winning nearly every season since 2013."
      },
      {
        "q": "Why is there no champion for the 1992-93 season?",
        "a": "Marseille finished top of the table on the pitch but were stripped of the title after a match-fixing scandal involving a bribed opponent late in the campaign. French authorities declined to award the championship to anyone else, so 1992-93 has no official winner. Runner-up PSG were not promoted to champions."
      },
      {
        "q": "Who won Ligue 1 in 2024-25?",
        "a": "Paris Saint-Germain won the 2024-25 title, sealing it with six games to spare in April 2025. Marseille finished second, well behind PSG's total, as Luis Enrique's side cruised to another dominant French championship."
      },
      {
        "q": "Which clubs have broken PSG's title run since 2013?",
        "a": "Only three sides have interrupted PSG since their dynasty began. Monaco won in 2016-17 and Lille in 2020-21, while Montpellier's shock 2011-12 triumph came just before the Qatari-era dominance fully took hold."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "Ligue 1"
  },
  {
    "slug": "eredivisie-champions",
    "h1": "Every Eredivisie Champion (1956-57 to 2024-25)",
    "title": "Eredivisie Champions: Full List of Dutch League Winners by Season | Ball IQ",
    "description": "The complete list of Eredivisie champions and runners-up, season by season from 1956-57 through 2024-25. Every Dutch top-flight title winner in one table.",
    "intro": [
      "The Eredivisie has crowned a champion of Dutch football every season since 1956-57, when the country's regional leagues were folded into a single national professional division. Ajax lifted that inaugural title, setting the tone for nearly seven decades in which one of three clubs would claim the trophy far more often than not.",
      "Ajax, PSV Eindhoven and Feyenoord form the league's traditional 'big three', and between them they have won the overwhelming majority of Eredivisie titles. Only a handful of outsiders have broken through: DOS, Sparta and DWS in the early years, and AZ (as AZ '67) and Twente in the modern era. That concentration of success makes the Dutch title race one of European football's most predictable at the top and most fiercely contested just beneath it.",
      "The table below lists every Eredivisie champion and runner-up from the first 1956-57 season to the most recent 2024-25 campaign, in which PSV edged Ajax to retain their crown. The 2019-20 season is included but was declared void with no champion awarded after play was halted by the COVID-19 pandemic."
    ],
    "columns": [
      "Season",
      "Champions",
      "Runner-up"
    ],
    "rows": [
      [
        "1956-57",
        "Ajax",
        "Fortuna '54"
      ],
      [
        "1957-58",
        "DOS",
        "SC Enschede"
      ],
      [
        "1958-59",
        "Sparta",
        "Rapid JC"
      ],
      [
        "1959-60",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1960-61",
        "Feyenoord",
        "Ajax"
      ],
      [
        "1961-62",
        "Feyenoord",
        "PSV"
      ],
      [
        "1962-63",
        "PSV",
        "Ajax"
      ],
      [
        "1963-64",
        "DWS",
        "PSV"
      ],
      [
        "1964-65",
        "Feyenoord",
        "DWS"
      ],
      [
        "1965-66",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1966-67",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1967-68",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1968-69",
        "Feyenoord",
        "Ajax"
      ],
      [
        "1969-70",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1970-71",
        "Feyenoord",
        "Ajax"
      ],
      [
        "1971-72",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1972-73",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1973-74",
        "Feyenoord",
        "Twente"
      ],
      [
        "1974-75",
        "PSV",
        "Feyenoord"
      ],
      [
        "1975-76",
        "PSV",
        "Feyenoord"
      ],
      [
        "1976-77",
        "Ajax",
        "PSV"
      ],
      [
        "1977-78",
        "PSV",
        "Ajax"
      ],
      [
        "1978-79",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1979-80",
        "Ajax",
        "AZ '67"
      ],
      [
        "1980-81",
        "AZ '67",
        "Ajax"
      ],
      [
        "1981-82",
        "Ajax",
        "PSV"
      ],
      [
        "1982-83",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1983-84",
        "Feyenoord",
        "PSV"
      ],
      [
        "1984-85",
        "Ajax",
        "PSV"
      ],
      [
        "1985-86",
        "PSV",
        "Ajax"
      ],
      [
        "1986-87",
        "PSV",
        "Ajax"
      ],
      [
        "1987-88",
        "PSV",
        "Ajax"
      ],
      [
        "1988-89",
        "PSV",
        "Ajax"
      ],
      [
        "1989-90",
        "Ajax",
        "PSV"
      ],
      [
        "1990-91",
        "PSV",
        "Ajax"
      ],
      [
        "1991-92",
        "PSV",
        "Ajax"
      ],
      [
        "1992-93",
        "Feyenoord",
        "PSV"
      ],
      [
        "1993-94",
        "Ajax",
        "Feyenoord"
      ],
      [
        "1994-95",
        "Ajax",
        "Roda JC"
      ],
      [
        "1995-96",
        "Ajax",
        "PSV"
      ],
      [
        "1996-97",
        "PSV",
        "Feyenoord"
      ],
      [
        "1997-98",
        "Ajax",
        "PSV"
      ],
      [
        "1998-99",
        "Feyenoord",
        "Willem II"
      ],
      [
        "1999-2000",
        "PSV",
        "Heerenveen"
      ],
      [
        "2000-01",
        "PSV",
        "Feyenoord"
      ],
      [
        "2001-02",
        "Ajax",
        "PSV"
      ],
      [
        "2002-03",
        "PSV",
        "Ajax"
      ],
      [
        "2003-04",
        "Ajax",
        "PSV"
      ],
      [
        "2004-05",
        "PSV",
        "Ajax"
      ],
      [
        "2005-06",
        "PSV",
        "Ajax"
      ],
      [
        "2006-07",
        "PSV",
        "Ajax"
      ],
      [
        "2007-08",
        "PSV",
        "Twente"
      ],
      [
        "2008-09",
        "AZ",
        "Twente"
      ],
      [
        "2009-10",
        "Twente",
        "Ajax"
      ],
      [
        "2010-11",
        "Ajax",
        "Twente"
      ],
      [
        "2011-12",
        "Ajax",
        "Feyenoord"
      ],
      [
        "2012-13",
        "Ajax",
        "PSV"
      ],
      [
        "2013-14",
        "Ajax",
        "Feyenoord"
      ],
      [
        "2014-15",
        "PSV",
        "Ajax"
      ],
      [
        "2015-16",
        "PSV",
        "Ajax"
      ],
      [
        "2016-17",
        "Feyenoord",
        "Ajax"
      ],
      [
        "2017-18",
        "PSV",
        "Ajax"
      ],
      [
        "2018-19",
        "Ajax",
        "PSV"
      ],
      [
        "2019-20",
        "No title awarded (season abandoned, COVID-19)",
        "—"
      ],
      [
        "2020-21",
        "Ajax",
        "PSV"
      ],
      [
        "2021-22",
        "Ajax",
        "PSV"
      ],
      [
        "2022-23",
        "Feyenoord",
        "PSV"
      ],
      [
        "2023-24",
        "PSV",
        "Feyenoord"
      ],
      [
        "2024-25",
        "PSV",
        "Ajax"
      ],
      [
        "2025-26",
        "PSV",
        "Feyenoord"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Eredivisie titles?",
        "a": "Ajax has won the most Eredivisie titles, with well over 30 championships since the league began in 1956-57 — comfortably ahead of PSV Eindhoven and Feyenoord, the other two members of Dutch football's 'big three'."
      },
      {
        "q": "Who won the Eredivisie in 2024-25?",
        "a": "PSV Eindhoven won the 2024-25 Eredivisie, finishing ahead of Ajax to retain the title they had also won in 2023-24."
      },
      {
        "q": "Which clubs have won the Eredivisie besides Ajax, PSV and Feyenoord?",
        "a": "Only five other clubs have been champions: DOS (1957-58), Sparta Rotterdam (1958-59), DWS (1963-64), AZ — as AZ '67 in 1980-81 and again in 2008-09 — and Twente (2009-10)."
      },
      {
        "q": "Why is there no Eredivisie champion for 2019-20?",
        "a": "The 2019-20 season was ended early and declared void because of the COVID-19 pandemic. The KNVB decided not to award the title, so no champion was crowned that year, even though Ajax led on goal difference when play stopped."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Eredivisie"
  },
  {
    "slug": "primeira-liga-champions",
    "h1": "Every Primeira Liga Champion (1934-35 to 2024-25)",
    "title": "Primeira Liga Champions: Every Portuguese League Winner by Season | Ball IQ",
    "description": "The complete list of Portuguese Primeira Liga champions and runners-up, season by season from 1934-35 to 2024-25 — Benfica, Porto and Sporting CP's title history.",
    "intro": [
      "Portugal's top flight has crowned a champion every season since Porto lifted the very first title in 1934-35. Nine decades later the story is still written almost entirely by three clubs — Benfica, Porto and Sporting CP, the 'três grandes' who between them have taken all but two championships in league history.",
      "Only Os Belenenses (1945-46) and Boavista (2000-01) have ever broken the monopoly, each managing a single, celebrated title. Everything else has been a Lisbon-versus-Porto tug of war, from Benfica's Eusébio-era dominance in the 1960s to Porto's run of six titles in seven seasons in the 2000s.",
      "The table below lists every champion and runner-up in full, from 1934-35 through Sporting CP's back-to-back triumphs in 2023-24 and 2024-25 — the Lions' first successive titles since the 1950s."
    ],
    "columns": [
      "Season",
      "Champions",
      "Runner-up"
    ],
    "rows": [
      [
        "1934-35",
        "Porto",
        "Sporting CP"
      ],
      [
        "1935-36",
        "Benfica",
        "Porto"
      ],
      [
        "1936-37",
        "Benfica",
        "Belenenses"
      ],
      [
        "1937-38",
        "Benfica",
        "Porto"
      ],
      [
        "1938-39",
        "Porto",
        "Sporting CP"
      ],
      [
        "1939-40",
        "Porto",
        "Sporting CP"
      ],
      [
        "1940-41",
        "Sporting CP",
        "Porto"
      ],
      [
        "1941-42",
        "Benfica",
        "Sporting CP"
      ],
      [
        "1942-43",
        "Benfica",
        "Sporting CP"
      ],
      [
        "1943-44",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1944-45",
        "Benfica",
        "Belenenses"
      ],
      [
        "1945-46",
        "Belenenses",
        "Benfica"
      ],
      [
        "1946-47",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1947-48",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1948-49",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1949-50",
        "Benfica",
        "Sporting CP"
      ],
      [
        "1950-51",
        "Sporting CP",
        "Porto"
      ],
      [
        "1951-52",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1952-53",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1953-54",
        "Sporting CP",
        "Porto"
      ],
      [
        "1954-55",
        "Benfica",
        "Belenenses"
      ],
      [
        "1955-56",
        "Porto",
        "Benfica"
      ],
      [
        "1956-57",
        "Benfica",
        "Porto"
      ],
      [
        "1957-58",
        "Sporting CP",
        "Porto"
      ],
      [
        "1958-59",
        "Porto",
        "Benfica"
      ],
      [
        "1959-60",
        "Benfica",
        "Sporting CP"
      ],
      [
        "1960-61",
        "Benfica",
        "Sporting CP"
      ],
      [
        "1961-62",
        "Sporting CP",
        "Porto"
      ],
      [
        "1962-63",
        "Benfica",
        "Porto"
      ],
      [
        "1963-64",
        "Benfica",
        "Porto"
      ],
      [
        "1964-65",
        "Benfica",
        "Porto"
      ],
      [
        "1965-66",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1966-67",
        "Benfica",
        "Académica de Coimbra"
      ],
      [
        "1967-68",
        "Benfica",
        "Sporting CP"
      ],
      [
        "1968-69",
        "Benfica",
        "Porto"
      ],
      [
        "1969-70",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1970-71",
        "Benfica",
        "Sporting CP"
      ],
      [
        "1971-72",
        "Benfica",
        "Vitória de Setúbal"
      ],
      [
        "1972-73",
        "Benfica",
        "Belenenses"
      ],
      [
        "1973-74",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1974-75",
        "Benfica",
        "Porto"
      ],
      [
        "1975-76",
        "Benfica",
        "Boavista"
      ],
      [
        "1976-77",
        "Benfica",
        "Sporting CP"
      ],
      [
        "1977-78",
        "Porto",
        "Benfica"
      ],
      [
        "1978-79",
        "Porto",
        "Benfica"
      ],
      [
        "1979-80",
        "Sporting CP",
        "Porto"
      ],
      [
        "1980-81",
        "Benfica",
        "Porto"
      ],
      [
        "1981-82",
        "Sporting CP",
        "Benfica"
      ],
      [
        "1982-83",
        "Benfica",
        "Porto"
      ],
      [
        "1983-84",
        "Benfica",
        "Porto"
      ],
      [
        "1984-85",
        "Porto",
        "Sporting CP"
      ],
      [
        "1985-86",
        "Porto",
        "Benfica"
      ],
      [
        "1986-87",
        "Benfica",
        "Porto"
      ],
      [
        "1987-88",
        "Porto",
        "Benfica"
      ],
      [
        "1988-89",
        "Benfica",
        "Porto"
      ],
      [
        "1989-90",
        "Porto",
        "Benfica"
      ],
      [
        "1990-91",
        "Benfica",
        "Porto"
      ],
      [
        "1991-92",
        "Porto",
        "Benfica"
      ],
      [
        "1992-93",
        "Porto",
        "Benfica"
      ],
      [
        "1993-94",
        "Benfica",
        "Porto"
      ],
      [
        "1994-95",
        "Porto",
        "Sporting CP"
      ],
      [
        "1995-96",
        "Porto",
        "Benfica"
      ],
      [
        "1996-97",
        "Porto",
        "Sporting CP"
      ],
      [
        "1997-98",
        "Porto",
        "Benfica"
      ],
      [
        "1998-99",
        "Porto",
        "Boavista"
      ],
      [
        "1999-2000",
        "Sporting CP",
        "Porto"
      ],
      [
        "2000-01",
        "Boavista",
        "Porto"
      ],
      [
        "2001-02",
        "Sporting CP",
        "Boavista"
      ],
      [
        "2002-03",
        "Porto",
        "Benfica"
      ],
      [
        "2003-04",
        "Porto",
        "Benfica"
      ],
      [
        "2004-05",
        "Benfica",
        "Porto"
      ],
      [
        "2005-06",
        "Porto",
        "Sporting CP"
      ],
      [
        "2006-07",
        "Porto",
        "Sporting CP"
      ],
      [
        "2007-08",
        "Porto",
        "Sporting CP"
      ],
      [
        "2008-09",
        "Porto",
        "Sporting CP"
      ],
      [
        "2009-10",
        "Benfica",
        "Braga"
      ],
      [
        "2010-11",
        "Porto",
        "Benfica"
      ],
      [
        "2011-12",
        "Porto",
        "Benfica"
      ],
      [
        "2012-13",
        "Porto",
        "Benfica"
      ],
      [
        "2013-14",
        "Benfica",
        "Sporting CP"
      ],
      [
        "2014-15",
        "Benfica",
        "Porto"
      ],
      [
        "2015-16",
        "Benfica",
        "Sporting CP"
      ],
      [
        "2016-17",
        "Benfica",
        "Porto"
      ],
      [
        "2017-18",
        "Porto",
        "Benfica"
      ],
      [
        "2018-19",
        "Benfica",
        "Porto"
      ],
      [
        "2019-20",
        "Porto",
        "Benfica"
      ],
      [
        "2020-21",
        "Sporting CP",
        "Porto"
      ],
      [
        "2021-22",
        "Porto",
        "Sporting CP"
      ],
      [
        "2022-23",
        "Benfica",
        "Porto"
      ],
      [
        "2023-24",
        "Sporting CP",
        "Benfica"
      ],
      [
        "2024-25",
        "Sporting CP",
        "Benfica"
      ],
      [
        "2025-26",
        "Porto",
        "Sporting CP"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Primeira Liga titles?",
        "a": "Benfica are the most successful club in Primeira Liga history with 38 titles, ahead of Porto on 31 and Sporting CP on 21 (as of the 2024-25 season)."
      },
      {
        "q": "Have any clubs outside the 'três grandes' won the Primeira Liga?",
        "a": "Only two. Os Belenenses won the title in 1945-46 and Boavista won it in 2000-01. Every other championship since 1934-35 has gone to Benfica, Porto or Sporting CP."
      },
      {
        "q": "Who won the Primeira Liga in 2024-25?",
        "a": "Sporting CP were champions in 2024-25, finishing ahead of runners-up Benfica. It completed back-to-back titles for Sporting after their 2023-24 win — their first successive championships since the 1950s."
      },
      {
        "q": "Who was the first-ever Primeira Liga champion?",
        "a": "Porto won the inaugural Portuguese championship in 1934-35, finishing ahead of Sporting CP."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Primeira Liga"
  },
  {
    "slug": "scottish-premiership-champions",
    "h1": "Every Scottish Premiership Champion (1998-2025)",
    "title": "Scottish Premiership Champions: Full Winners List 1998-2025 | Ball IQ",
    "description": "Every Scottish top-flight champion by season from 1998-99 to 2024-25, with runners-up. Celtic and Rangers's grip on the SPL and SPFL Premiership title, in full.",
    "intro": [
      "Scotland's top flight rebranded twice across this era. The Scottish Premier League broke away from the old Premier Division in 1998, then merged with the Scottish Football League in 2013 to form the SPFL, whose top tier became the Premiership. Through every name change, one truth held: the trophy almost never left Glasgow.",
      "Since 1998-99 the title has gone to Celtic or Rangers in every single season. The pattern swings in blocks — Rangers opened the era, Celtic answered, and the two traded three- and four-year runs of dominance. Rangers's 2012 financial collapse and demotion to the fourth tier handed Celtic an uninterrupted nine-in-a-row stretch, broken only when a rebuilt Rangers took the 2020-21 crown.",
      "The runner-up column tells the more interesting story. Beyond the Old Firm, clubs like Hearts, Motherwell and — most persistently — Aberdeen have pushed into second, chasing a gap that has often stretched past ten or even seventeen points. This list runs every season from 1998-99 through 2024-25."
    ],
    "columns": [
      "Season",
      "Champions",
      "Runner-up"
    ],
    "rows": [
      [
        "1998-99",
        "Rangers",
        "Celtic"
      ],
      [
        "1999-2000",
        "Rangers",
        "Celtic"
      ],
      [
        "2000-01",
        "Celtic",
        "Rangers"
      ],
      [
        "2001-02",
        "Celtic",
        "Rangers"
      ],
      [
        "2002-03",
        "Rangers",
        "Celtic"
      ],
      [
        "2003-04",
        "Celtic",
        "Rangers"
      ],
      [
        "2004-05",
        "Rangers",
        "Celtic"
      ],
      [
        "2005-06",
        "Celtic",
        "Heart of Midlothian"
      ],
      [
        "2006-07",
        "Celtic",
        "Rangers"
      ],
      [
        "2007-08",
        "Celtic",
        "Rangers"
      ],
      [
        "2008-09",
        "Rangers",
        "Celtic"
      ],
      [
        "2009-10",
        "Rangers",
        "Celtic"
      ],
      [
        "2010-11",
        "Rangers",
        "Celtic"
      ],
      [
        "2011-12",
        "Celtic",
        "Rangers"
      ],
      [
        "2012-13",
        "Celtic",
        "Motherwell"
      ],
      [
        "2013-14",
        "Celtic",
        "Motherwell"
      ],
      [
        "2014-15",
        "Celtic",
        "Aberdeen"
      ],
      [
        "2015-16",
        "Celtic",
        "Aberdeen"
      ],
      [
        "2016-17",
        "Celtic",
        "Aberdeen"
      ],
      [
        "2017-18",
        "Celtic",
        "Aberdeen"
      ],
      [
        "2018-19",
        "Celtic",
        "Rangers"
      ],
      [
        "2019-20",
        "Celtic",
        "Rangers"
      ],
      [
        "2020-21",
        "Rangers",
        "Celtic"
      ],
      [
        "2021-22",
        "Celtic",
        "Rangers"
      ],
      [
        "2022-23",
        "Celtic",
        "Rangers"
      ],
      [
        "2023-24",
        "Celtic",
        "Rangers"
      ],
      [
        "2024-25",
        "Celtic",
        "Rangers"
      ],
      [
        "2025-26",
        "Celtic",
        "Heart of Midlothian"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Scottish Premiership titles?",
        "a": "In the SPL/SPFL Premiership era from 1998-99, Celtic have won the most with 19 titles, compared to Rangers's 8. Across all of Scottish top-flight history the two are much closer, with both clubs on 55 top-division titles after Celtic's 2024-25 win."
      },
      {
        "q": "Has any club other than Celtic or Rangers won the Scottish Premiership since 1998?",
        "a": "No. Every single title from 1998-99 through 2024-25 has gone to either Celtic or Rangers. The last club outside the Old Firm to win Scotland's top flight was Aberdeen in 1984-85."
      },
      {
        "q": "Why did Rangers not win any titles between 2011 and 2021?",
        "a": "Rangers were liquidated in 2012 following financial trouble and the newco club had to restart in the fourth tier. They climbed back to the top flight by 2016 but did not win the Premiership again until 2020-21, allowing Celtic to complete nine titles in a row."
      },
      {
        "q": "Who finished as runner-up most often behind the Old Firm?",
        "a": "Aberdeen were the most persistent challengers, finishing second in four consecutive seasons from 2014-15 to 2017-18. Motherwell (2012-13, 2013-14) and Hearts (2005-06) also claimed runner-up spots during the era."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "Scottish football"
  },
  {
    "slug": "most-champions-league-titles",
    "h1": "Clubs With the Most Champions League Titles",
    "title": "Most Champions League Titles: Clubs Ranked | Ball IQ",
    "description": "Which clubs have won the most European Cup / Champions League titles? Real Madrid lead the all-time ranking — every winner, ranked by titles.",
    "intro": [
      "The European Cup, rebranded the UEFA Champions League in 1992, is the most prestigious prize in club football — and a handful of clubs have made it their own. This page ranks every club to have won it, by number of titles, from Real Madrid's record haul down to the one-time winners.",
      "Real Madrid stand far clear at the top: they won the first five editions in a row from 1956 and have kept adding to the tally ever since, more than doubling the count of their nearest rivals. AC Milan are the most successful of the chasing pack, ahead of the modern powerhouses of Bayern Munich and Liverpool."
    ],
    "columns": [
      "Rank",
      "Team",
      "Titles",
      "Years won"
    ],
    "rows": [
      [
        "1",
        "Real Madrid",
        "15",
        "1955, 1956, 1957, 1958, 1959, 1965, 1997, 1999, 2001, 2013, 2015, 2016, 2017, 2021, 2023"
      ],
      [
        "2",
        "AC Milan",
        "7",
        "1962, 1968, 1988, 1989, 1993, 2002, 2006"
      ],
      [
        "3",
        "Bayern Munich",
        "6",
        "1973, 1974, 1975, 2000, 2012, 2019"
      ],
      [
        "3",
        "Liverpool",
        "6",
        "1976, 1977, 1980, 1983, 2004, 2018"
      ],
      [
        "5",
        "Barcelona",
        "5",
        "1991, 2005, 2008, 2010, 2014"
      ],
      [
        "6",
        "Ajax",
        "4",
        "1970, 1971, 1972, 1994"
      ],
      [
        "7",
        "Inter Milan",
        "3",
        "1963, 1964, 2009"
      ],
      [
        "7",
        "Manchester United",
        "3",
        "1967, 1998, 2007"
      ],
      [
        "9",
        "Benfica",
        "2",
        "1960, 1961"
      ],
      [
        "9",
        "Chelsea",
        "2",
        "2011, 2020"
      ],
      [
        "9",
        "Juventus",
        "2",
        "1984, 1995"
      ],
      [
        "9",
        "Nottingham Forest",
        "2",
        "1978, 1979"
      ],
      [
        "9",
        "Paris Saint-Germain",
        "2",
        "2024, 2025"
      ],
      [
        "9",
        "Porto",
        "2",
        "1986, 2003"
      ],
      [
        "15",
        "Aston Villa",
        "1",
        "1981"
      ],
      [
        "15",
        "Borussia Dortmund",
        "1",
        "1996"
      ],
      [
        "15",
        "Celtic",
        "1",
        "1966"
      ],
      [
        "15",
        "Feyenoord",
        "1",
        "1969"
      ],
      [
        "15",
        "Hamburger SV",
        "1",
        "1982"
      ],
      [
        "15",
        "Manchester City",
        "1",
        "2022"
      ],
      [
        "15",
        "Marseille",
        "1",
        "1992"
      ],
      [
        "15",
        "PSV Eindhoven",
        "1",
        "1987"
      ],
      [
        "15",
        "Red Star Belgrade",
        "1",
        "1990"
      ],
      [
        "15",
        "Steaua București",
        "1",
        "1985"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Champions League titles?",
        "a": "Real Madrid have won the most, with 15 European Cup / Champions League titles — comfortably a record. They won the first five editions from 1956 to 1960 and have led the all-time count ever since."
      },
      {
        "q": "Which club has won the second-most Champions League titles?",
        "a": "AC Milan are second on the all-time list with seven, ahead of Bayern Munich and Liverpool, who are level on six each."
      },
      {
        "q": "Is this a complete list of Champions League winners?",
        "a": "This page ranks clubs by number of titles. For the full season-by-season list of every final, winner, runner-up and score, see our Champions League winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Champions League"
  },
  {
    "slug": "most-ballon-dors",
    "h1": "Players With the Most Ballon d'Or Awards",
    "title": "Most Ballon d'Ors: Players Ranked (Messi, Ronaldo…) | Ball IQ",
    "description": "Who has won the most Ballon d'Or awards? Lionel Messi leads with a record eight. Every multiple winner, ranked, with the years they won.",
    "intro": [
      "The Ballon d'Or has gone to the best player in the world (in Europe, until 2007) every year since 1956. This page ranks the players who have won it more than once — the small club of true greats who dominated their eras.",
      "Lionel Messi stands alone at the top with a record eight, ahead of Cristiano Ronaldo on five. Behind that modern duopoly sit three of the game's all-time icons — Johan Cruyff, Michel Platini and Marco van Basten — each a three-time winner."
    ],
    "columns": [
      "Rank",
      "Player",
      "Ballon d'Ors",
      "Years won"
    ],
    "rows": [
      [
        "1",
        "Lionel Messi",
        "8",
        "2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023"
      ],
      [
        "2",
        "Cristiano Ronaldo",
        "5",
        "2008, 2013, 2014, 2016, 2017"
      ],
      [
        "3",
        "Johan Cruyff",
        "3",
        "1971, 1973, 1974"
      ],
      [
        "3",
        "Marco van Basten",
        "3",
        "1988, 1989, 1992"
      ],
      [
        "3",
        "Michel Platini",
        "3",
        "1983, 1984, 1985"
      ],
      [
        "6",
        "Alfredo Di Stéfano",
        "2",
        "1957, 1959"
      ],
      [
        "6",
        "Franz Beckenbauer",
        "2",
        "1972, 1976"
      ],
      [
        "6",
        "Karl-Heinz Rummenigge",
        "2",
        "1980, 1981"
      ],
      [
        "6",
        "Kevin Keegan",
        "2",
        "1978, 1979"
      ],
      [
        "6",
        "Ronaldo",
        "2",
        "1997, 2002"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most Ballon d'Or awards?",
        "a": "Lionel Messi has won the most, with 8 — in 2009, 2010, 2011, 2012, 2015, 2019, 2021 and 2023. Cristiano Ronaldo is next with five."
      },
      {
        "q": "Who has won three Ballon d'Ors?",
        "a": "Three players have won it three times each: Johan Cruyff, Michel Platini and Marco van Basten."
      },
      {
        "q": "Is this every Ballon d'Or winner?",
        "a": "This page ranks the multiple winners. For the full year-by-year list of every Ballon d'Or winner since 1956, with their club and nationality, see our Ballon d'Or winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Ballon d'Or"
  },
  {
    "slug": "most-world-cups",
    "h1": "Countries With the Most World Cup Wins",
    "title": "Most World Cup Wins: Countries Ranked | Ball IQ",
    "description": "Which country has won the most World Cups? Brazil lead with five. Every nation to win the FIFA World Cup, ranked by titles, with the years.",
    "intro": [
      "Only eight nations have ever won the FIFA World Cup since it began in 1930. This page ranks them by number of titles, from Brazil's record five down to England's single triumph in 1966.",
      "Brazil are the benchmark with five, the only side to have played at every finals. Italy and Germany follow on four apiece — Germany's tally combining their three wins as West Germany with the 2014 title won as a reunified nation."
    ],
    "columns": [
      "Rank",
      "Country",
      "Titles",
      "Years won"
    ],
    "rows": [
      [
        "1",
        "Brazil",
        "5",
        "1958, 1962, 1970, 1994, 2002"
      ],
      [
        "2",
        "Germany",
        "4",
        "1954, 1974, 1990, 2014"
      ],
      [
        "2",
        "Italy",
        "4",
        "1934, 1938, 1982, 2006"
      ],
      [
        "4",
        "Argentina",
        "3",
        "1978, 1986, 2022"
      ],
      [
        "5",
        "France",
        "2",
        "1998, 2018"
      ],
      [
        "5",
        "Spain",
        "2",
        "2010, 2026"
      ],
      [
        "5",
        "Uruguay",
        "2",
        "1930, 1950"
      ],
      [
        "8",
        "England",
        "1",
        "1966"
      ]
    ],
    "faq": [
      {
        "q": "Which country has won the most World Cups?",
        "a": "Brazil have won the most, with five titles (1958, 1962, 1970, 1994 and 2002). They are also the only nation to have appeared at every World Cup finals."
      },
      {
        "q": "How many World Cups have Germany won?",
        "a": "Four — in 1954, 1974 and 1990 as West Germany, and in 2014 as a reunified Germany. That puts them level with Italy on four, behind Brazil."
      },
      {
        "q": "Is this every World Cup winner?",
        "a": "This page ranks countries by titles. For the full year-by-year list of every final, winner, runner-up, score and host, see our World Cup winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the World Cup"
  },
  {
    "slug": "most-premier-league-titles",
    "h1": "Clubs With the Most Premier League Titles",
    "title": "Most Premier League Titles: Clubs Ranked | Ball IQ",
    "description": "Which club has won the most Premier League titles? Manchester United lead with 13. Every Premier League winner since 1992, ranked by titles.",
    "intro": [
      "Since the Premier League began in 1992-93, only seven clubs have won it. This page ranks them by number of titles, from Manchester United's early dominance to Manchester City's modern dynasty.",
      "Manchester United set the pace with 13 titles, all under Sir Alex Ferguson. Manchester City have closed fast since 2011-12, while Blackburn Rovers and Leicester City remain the only one-off winners to have crashed the established order."
    ],
    "columns": [
      "Rank",
      "Club",
      "Titles",
      "Seasons won"
    ],
    "rows": [
      [
        "1",
        "Manchester United",
        "13",
        "1992, 1993, 1995, 1996, 1998, 1999, 2000, 2002, 2006, 2007, 2008, 2010, 2012"
      ],
      [
        "2",
        "Manchester City",
        "8",
        "2011, 2013, 2017, 2018, 2020, 2021, 2022, 2023"
      ],
      [
        "3",
        "Chelsea",
        "5",
        "2004, 2005, 2009, 2014, 2016"
      ],
      [
        "4",
        "Arsenal",
        "4",
        "1997, 2001, 2003, 2025"
      ],
      [
        "5",
        "Liverpool",
        "2",
        "2019, 2024"
      ],
      [
        "6",
        "Blackburn Rovers",
        "1",
        "1994"
      ],
      [
        "6",
        "Leicester City",
        "1",
        "2015"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Premier League titles?",
        "a": "Manchester United have won the most, with 13 — all under Sir Alex Ferguson between 1993 and 2013. Manchester City are second and closing."
      },
      {
        "q": "Which clubs have won the Premier League only once?",
        "a": "Blackburn Rovers (1994-95) and Leicester City (2015-16) are the only clubs to have won the Premier League exactly once — Leicester's 5000-1 title is regarded as the greatest shock in the competition's history."
      },
      {
        "q": "Is this every Premier League champion?",
        "a": "This page ranks clubs by titles. For the full season-by-season list of every champion and runner-up since 1992-93, see our Premier League champions list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Premier League"
  },
  {
    "slug": "la-liga-top-scorers",
    "h1": "La Liga Top Scorers: Every Pichichi Trophy Winner (1928–29 to 2024–25)",
    "title": "La Liga Top Scorers: Every Pichichi Winner by Season | Ball IQ",
    "description": "The complete list of La Liga Pichichi Trophy winners, season by season, from 1928–29 to 2024–25 — every top scorer, their club, and their goal tally.",
    "intro": [
      "The Pichichi Trophy, awarded each year by Spanish sports daily Marca, honours the top goalscorer in La Liga. Named after Athletic Bilbao legend Rafael 'Pichichi' Moreno, the award has crowned Spain's most lethal finishers since the league's inaugural 1928–29 season. This table gathers every winner in one place, from Paco Bienzobas's modest 14-goal haul to the record-shattering seasons of the modern era.",
      "No name looms larger than Lionel Messi, who claimed a record eight Pichichis for Barcelona, including the astonishing 50-goal campaign of 2011–12 that still stands as the single-season La Liga record. Telmo Zarra and Hugo Sánchez each won it five times, while the Messi–Cristiano Ronaldo duopoly defined the 2010s before newcomers began breaking through again.",
      "Recent seasons have reopened the race. Robert Lewandowski took the 2022–23 award in his debut Barcelona campaign, Girona's Artem Dovbyk stunned the giants in 2023–24, and Kylian Mbappé announced his Real Madrid arrival by topping the charts with 31 goals in 2024–25."
    ],
    "columns": [
      "Season",
      "Player",
      "Club",
      "Goals"
    ],
    "rows": [
      [
        "1928–29",
        "Paco Bienzobas",
        "Real Sociedad",
        "14"
      ],
      [
        "1929–30",
        "Guillermo Gorostiza",
        "Athletic Bilbao",
        "19"
      ],
      [
        "1930–31",
        "Bata",
        "Athletic Bilbao",
        "27"
      ],
      [
        "1931–32",
        "Guillermo Gorostiza",
        "Athletic Bilbao",
        "12"
      ],
      [
        "1932–33",
        "Manuel Olivares",
        "Real Madrid",
        "16"
      ],
      [
        "1933–34",
        "Isidro Lángara",
        "Oviedo",
        "27"
      ],
      [
        "1934–35",
        "Isidro Lángara",
        "Oviedo",
        "26"
      ],
      [
        "1935–36",
        "Isidro Lángara",
        "Oviedo",
        "28"
      ],
      [
        "1939–40",
        "Victorio Unamuno",
        "Athletic Bilbao",
        "20"
      ],
      [
        "1940–41",
        "Pruden",
        "Atlético Madrid",
        "30"
      ],
      [
        "1941–42",
        "Mundo",
        "Valencia",
        "27"
      ],
      [
        "1942–43",
        "Mariano Martín",
        "Barcelona",
        "32"
      ],
      [
        "1943–44",
        "Mundo",
        "Valencia",
        "27"
      ],
      [
        "1944–45",
        "Telmo Zarra",
        "Athletic Bilbao",
        "19"
      ],
      [
        "1945–46",
        "Telmo Zarra",
        "Athletic Bilbao",
        "24"
      ],
      [
        "1946–47",
        "Telmo Zarra",
        "Athletic Bilbao",
        "34"
      ],
      [
        "1947–48",
        "Pahiño",
        "Celta Vigo",
        "23"
      ],
      [
        "1948–49",
        "César Rodríguez",
        "Barcelona",
        "28"
      ],
      [
        "1949–50",
        "Telmo Zarra",
        "Athletic Bilbao",
        "25"
      ],
      [
        "1950–51",
        "Telmo Zarra",
        "Athletic Bilbao",
        "38"
      ],
      [
        "1951–52",
        "Pahiño",
        "Real Madrid",
        "28"
      ],
      [
        "1952–53",
        "Telmo Zarra",
        "Athletic Bilbao",
        "24"
      ],
      [
        "1953–54",
        "Alfredo Di Stéfano",
        "Real Madrid",
        "27"
      ],
      [
        "1954–55",
        "Juan Arza",
        "Sevilla",
        "28"
      ],
      [
        "1955–56",
        "Alfredo Di Stéfano",
        "Real Madrid",
        "24"
      ],
      [
        "1956–57",
        "Alfredo Di Stéfano",
        "Real Madrid",
        "31"
      ],
      [
        "1957–58",
        "Alfredo Di Stéfano (shared)",
        "Real Madrid",
        "19"
      ],
      [
        "1958–59",
        "Alfredo Di Stéfano",
        "Real Madrid",
        "23"
      ],
      [
        "1959–60",
        "Ferenc Puskás",
        "Real Madrid",
        "26"
      ],
      [
        "1960–61",
        "Ferenc Puskás",
        "Real Madrid",
        "27"
      ],
      [
        "1961–62",
        "Juan Seminario",
        "Zaragoza",
        "25"
      ],
      [
        "1962–63",
        "Ferenc Puskás",
        "Real Madrid",
        "26"
      ],
      [
        "1963–64",
        "Ferenc Puskás",
        "Real Madrid",
        "20"
      ],
      [
        "1964–65",
        "Cayetano Ré",
        "Barcelona",
        "25"
      ],
      [
        "1965–66",
        "Vavá II",
        "Elche",
        "19"
      ],
      [
        "1966–67",
        "Waldo",
        "Valencia",
        "24"
      ],
      [
        "1967–68",
        "Fidel Uriarte",
        "Athletic Bilbao",
        "22"
      ],
      [
        "1968–69",
        "José Eulogio Gárate (shared)",
        "Atlético Madrid",
        "14"
      ],
      [
        "1969–70",
        "José Eulogio Gárate (shared)",
        "Atlético Madrid",
        "16"
      ],
      [
        "1970–71",
        "José Eulogio Gárate (shared)",
        "Atlético Madrid",
        "17"
      ],
      [
        "1971–72",
        "Enrique Porta",
        "Granada",
        "20"
      ],
      [
        "1972–73",
        "Marianín",
        "Oviedo",
        "19"
      ],
      [
        "1973–74",
        "Quini",
        "Sporting Gijón",
        "20"
      ],
      [
        "1974–75",
        "Carlos",
        "Athletic Bilbao",
        "19"
      ],
      [
        "1975–76",
        "Quini",
        "Sporting Gijón",
        "18"
      ],
      [
        "1976–77",
        "Mario Kempes",
        "Valencia",
        "24"
      ],
      [
        "1977–78",
        "Mario Kempes",
        "Valencia",
        "28"
      ],
      [
        "1978–79",
        "Hans Krankl",
        "Barcelona",
        "29"
      ],
      [
        "1979–80",
        "Quini",
        "Sporting Gijón",
        "24"
      ],
      [
        "1980–81",
        "Quini",
        "Barcelona",
        "20"
      ],
      [
        "1981–82",
        "Quini",
        "Barcelona",
        "26"
      ],
      [
        "1982–83",
        "Poli Rincón",
        "Real Betis",
        "20"
      ],
      [
        "1983–84",
        "Jorge da Silva (shared)",
        "Valladolid",
        "17"
      ],
      [
        "1984–85",
        "Hugo Sánchez",
        "Atlético Madrid",
        "19"
      ],
      [
        "1985–86",
        "Hugo Sánchez",
        "Real Madrid",
        "22"
      ],
      [
        "1986–87",
        "Hugo Sánchez",
        "Real Madrid",
        "34"
      ],
      [
        "1987–88",
        "Hugo Sánchez",
        "Real Madrid",
        "29"
      ],
      [
        "1988–89",
        "Baltazar",
        "Atlético Madrid",
        "35"
      ],
      [
        "1989–90",
        "Hugo Sánchez",
        "Real Madrid",
        "38"
      ],
      [
        "1990–91",
        "Emilio Butragueño",
        "Real Madrid",
        "19"
      ],
      [
        "1991–92",
        "Manolo",
        "Atlético Madrid",
        "27"
      ],
      [
        "1992–93",
        "Bebeto",
        "Deportivo La Coruña",
        "29"
      ],
      [
        "1993–94",
        "Romário",
        "Barcelona",
        "30"
      ],
      [
        "1994–95",
        "Iván Zamorano",
        "Real Madrid",
        "28"
      ],
      [
        "1995–96",
        "Juan Antonio Pizzi",
        "Tenerife",
        "31"
      ],
      [
        "1996–97",
        "Ronaldo",
        "Barcelona",
        "34"
      ],
      [
        "1997–98",
        "Christian Vieri",
        "Atlético Madrid",
        "24"
      ],
      [
        "1998–99",
        "Raúl",
        "Real Madrid",
        "25"
      ],
      [
        "1999–2000",
        "Salva Ballesta",
        "Racing Santander",
        "27"
      ],
      [
        "2000–01",
        "Raúl",
        "Real Madrid",
        "24"
      ],
      [
        "2001–02",
        "Diego Tristán",
        "Deportivo La Coruña",
        "21"
      ],
      [
        "2002–03",
        "Roy Makaay",
        "Deportivo La Coruña",
        "29"
      ],
      [
        "2003–04",
        "Ronaldo",
        "Real Madrid",
        "25"
      ],
      [
        "2004–05",
        "Diego Forlán",
        "Villarreal",
        "25"
      ],
      [
        "2005–06",
        "Samuel Eto'o",
        "Barcelona",
        "26"
      ],
      [
        "2006–07",
        "Ruud van Nistelrooy",
        "Real Madrid",
        "25"
      ],
      [
        "2007–08",
        "Dani Güiza",
        "Mallorca",
        "27"
      ],
      [
        "2008–09",
        "Diego Forlán",
        "Atlético Madrid",
        "32"
      ],
      [
        "2009–10",
        "Lionel Messi",
        "Barcelona",
        "34"
      ],
      [
        "2010–11",
        "Cristiano Ronaldo",
        "Real Madrid",
        "40"
      ],
      [
        "2011–12",
        "Lionel Messi",
        "Barcelona",
        "50"
      ],
      [
        "2012–13",
        "Lionel Messi",
        "Barcelona",
        "46"
      ],
      [
        "2013–14",
        "Cristiano Ronaldo",
        "Real Madrid",
        "31"
      ],
      [
        "2014–15",
        "Cristiano Ronaldo",
        "Real Madrid",
        "48"
      ],
      [
        "2015–16",
        "Luis Suárez",
        "Barcelona",
        "40"
      ],
      [
        "2016–17",
        "Lionel Messi",
        "Barcelona",
        "37"
      ],
      [
        "2017–18",
        "Lionel Messi",
        "Barcelona",
        "34"
      ],
      [
        "2018–19",
        "Lionel Messi",
        "Barcelona",
        "36"
      ],
      [
        "2019–20",
        "Lionel Messi",
        "Barcelona",
        "25"
      ],
      [
        "2020–21",
        "Lionel Messi",
        "Barcelona",
        "30"
      ],
      [
        "2021–22",
        "Karim Benzema",
        "Real Madrid",
        "27"
      ],
      [
        "2022–23",
        "Robert Lewandowski",
        "Barcelona",
        "23"
      ],
      [
        "2023–24",
        "Artem Dovbyk",
        "Girona",
        "24"
      ],
      [
        "2024–25",
        "Kylian Mbappé",
        "Real Madrid",
        "31"
      ],
      [
        "2025–26",
        "Kylian Mbappé",
        "Real Madrid",
        "25"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most Pichichi Trophies?",
        "a": "Lionel Messi holds the record with eight Pichichi Trophies, all with Barcelona (2009–10, 2011–12, 2012–13, and every season from 2016–17 to 2020–21). Telmo Zarra and Hugo Sánchez each won it five times."
      },
      {
        "q": "What is the most goals scored in a single La Liga season?",
        "a": "Lionel Messi set the record with 50 goals in the 2011–12 season. His 46 goals in 2012–13 and Cristiano Ronaldo's 48 in 2014–15 are the next-highest single-season Pichichi totals."
      },
      {
        "q": "Who won the Pichichi in the 2024–25 season?",
        "a": "Kylian Mbappé won the 2024–25 Pichichi in his debut season for Real Madrid, scoring 31 La Liga goals — six clear of runner-up Robert Lewandowski — and also claiming the European Golden Boot."
      },
      {
        "q": "Has any player outside Barcelona or Real Madrid won the Pichichi recently?",
        "a": "Yes. Girona's Artem Dovbyk won the 2023–24 Pichichi with 24 goals, the first winner from outside the two giants since Diego Forlán of Atlético Madrid in 2008–09."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "La Liga"
  },
  {
    "slug": "serie-a-top-scorers",
    "h1": "Serie A Top Scorers: Every Capocannoniere Since 1929-30",
    "title": "Serie A Top Scorers (Capocannoniere) by Season, 1929-2025 | Ball IQ",
    "description": "The complete list of Serie A top scorers (Capocannoniere) for every season from 1929-30 to 2024-25 — player, club and goal tally, with joint winners.",
    "intro": [
      "The Capocannoniere is the award given to the leading goalscorer in Italy's Serie A each season. Since the league adopted its single-division round-robin format in 1929-30, the title has traced the arc of Italian football — from the marksmen of the pre-war Ambrosiana-Inter and Juventus sides to the imported goal machines of the modern game.",
      "No footballer has dominated the charts quite like Gunnar Nordahl, the Swedish AC Milan striker who claimed the honour five times between 1949 and 1955 and set benchmarks that stood for decades. Later eras produced their own serial winners, from Michel Platini's hat-trick of titles at Juventus in the mid-1980s to Ciro Immobile, whose four crowns for Lazio include a record-equalling 36-goal haul in 2019-20.",
      "This table lists every Capocannoniere from 1929-30 through 2024-25, with the winning club and goal total. Seasons are shared where two or more players finished level, and the wartime years of 1943-44 and 1944-45 are omitted because no official top-flight championship or scoring title was contested."
    ],
    "columns": [
      "Season",
      "Player",
      "Club",
      "Goals"
    ],
    "rows": [
      [
        "1929-30",
        "Giuseppe Meazza",
        "Ambrosiana-Inter",
        "31"
      ],
      [
        "1930-31",
        "Rodolfo Volk",
        "Roma",
        "29"
      ],
      [
        "1931-32",
        "Angelo Schiavio / Pedro Petrone",
        "Bologna / Fiorentina",
        "25"
      ],
      [
        "1932-33",
        "Felice Borel",
        "Juventus",
        "29"
      ],
      [
        "1933-34",
        "Felice Borel",
        "Juventus",
        "32"
      ],
      [
        "1934-35",
        "Enrique Guaita",
        "Roma",
        "28"
      ],
      [
        "1935-36",
        "Giuseppe Meazza",
        "Ambrosiana-Inter",
        "25"
      ],
      [
        "1936-37",
        "Silvio Piola",
        "Lazio",
        "21"
      ],
      [
        "1937-38",
        "Giuseppe Meazza",
        "Ambrosiana-Inter",
        "20"
      ],
      [
        "1938-39",
        "Aldo Boffi / Ettore Puricelli",
        "AC Milan / Bologna",
        "19"
      ],
      [
        "1939-40",
        "Aldo Boffi",
        "AC Milan",
        "24"
      ],
      [
        "1940-41",
        "Ettore Puricelli",
        "Bologna",
        "22"
      ],
      [
        "1941-42",
        "Aldo Boffi",
        "AC Milan",
        "22"
      ],
      [
        "1942-43",
        "Silvio Piola",
        "Lazio",
        "21"
      ],
      [
        "1945-46",
        "Guglielmo Gabetto",
        "Torino",
        "22"
      ],
      [
        "1946-47",
        "Valentino Mazzola",
        "Torino",
        "29"
      ],
      [
        "1947-48",
        "Giampiero Boniperti",
        "Juventus",
        "27"
      ],
      [
        "1948-49",
        "István Nyers",
        "Inter",
        "26"
      ],
      [
        "1949-50",
        "Gunnar Nordahl",
        "AC Milan",
        "35"
      ],
      [
        "1950-51",
        "Gunnar Nordahl",
        "AC Milan",
        "34"
      ],
      [
        "1951-52",
        "John Hansen",
        "Juventus",
        "30"
      ],
      [
        "1952-53",
        "Gunnar Nordahl",
        "AC Milan",
        "26"
      ],
      [
        "1953-54",
        "Gunnar Nordahl",
        "AC Milan",
        "23"
      ],
      [
        "1954-55",
        "Gunnar Nordahl",
        "AC Milan",
        "27"
      ],
      [
        "1955-56",
        "Gino Pivatelli",
        "Bologna",
        "29"
      ],
      [
        "1956-57",
        "Dino da Costa",
        "Roma",
        "22"
      ],
      [
        "1957-58",
        "John Charles",
        "Juventus",
        "28"
      ],
      [
        "1958-59",
        "Antonio Angelillo",
        "Inter",
        "33"
      ],
      [
        "1959-60",
        "Omar Sívori",
        "Juventus",
        "28"
      ],
      [
        "1960-61",
        "Sergio Brighenti",
        "Sampdoria",
        "27"
      ],
      [
        "1961-62",
        "José Altafini / Aurelio Milani",
        "AC Milan / Fiorentina",
        "22"
      ],
      [
        "1962-63",
        "Harald Nielsen / Pedro Manfredini",
        "Bologna / Roma",
        "19"
      ],
      [
        "1963-64",
        "Harald Nielsen",
        "Bologna",
        "21"
      ],
      [
        "1964-65",
        "Sandro Mazzola / Alberto Orlando",
        "Inter / Fiorentina",
        "17"
      ],
      [
        "1965-66",
        "Luís Vinício",
        "Vicenza",
        "25"
      ],
      [
        "1966-67",
        "Gigi Riva",
        "Cagliari",
        "18"
      ],
      [
        "1967-68",
        "Pierino Prati",
        "AC Milan",
        "15"
      ],
      [
        "1968-69",
        "Gigi Riva",
        "Cagliari",
        "21"
      ],
      [
        "1969-70",
        "Gigi Riva",
        "Cagliari",
        "21"
      ],
      [
        "1970-71",
        "Roberto Boninsegna",
        "Inter",
        "24"
      ],
      [
        "1971-72",
        "Roberto Boninsegna",
        "Inter",
        "22"
      ],
      [
        "1972-73",
        "Giuseppe Savoldi / Paolino Pulici / Gianni Rivera",
        "Bologna / Torino / AC Milan",
        "17"
      ],
      [
        "1973-74",
        "Giorgio Chinaglia",
        "Lazio",
        "24"
      ],
      [
        "1974-75",
        "Paolino Pulici",
        "Torino",
        "18"
      ],
      [
        "1975-76",
        "Paolino Pulici",
        "Torino",
        "21"
      ],
      [
        "1976-77",
        "Francesco Graziani",
        "Torino",
        "21"
      ],
      [
        "1977-78",
        "Paolo Rossi",
        "Vicenza",
        "24"
      ],
      [
        "1978-79",
        "Bruno Giordano",
        "Lazio",
        "19"
      ],
      [
        "1979-80",
        "Roberto Bettega",
        "Juventus",
        "16"
      ],
      [
        "1980-81",
        "Roberto Pruzzo",
        "Roma",
        "18"
      ],
      [
        "1981-82",
        "Roberto Pruzzo",
        "Roma",
        "15"
      ],
      [
        "1982-83",
        "Michel Platini",
        "Juventus",
        "16"
      ],
      [
        "1983-84",
        "Michel Platini",
        "Juventus",
        "20"
      ],
      [
        "1984-85",
        "Michel Platini",
        "Juventus",
        "18"
      ],
      [
        "1985-86",
        "Roberto Pruzzo",
        "Roma",
        "19"
      ],
      [
        "1986-87",
        "Pietro Paolo Virdis",
        "AC Milan",
        "17"
      ],
      [
        "1987-88",
        "Diego Maradona",
        "Napoli",
        "15"
      ],
      [
        "1988-89",
        "Aldo Serena",
        "Inter",
        "22"
      ],
      [
        "1989-90",
        "Marco van Basten",
        "AC Milan",
        "19"
      ],
      [
        "1990-91",
        "Gianluca Vialli",
        "Sampdoria",
        "19"
      ],
      [
        "1991-92",
        "Marco van Basten",
        "AC Milan",
        "25"
      ],
      [
        "1992-93",
        "Giuseppe Signori",
        "Lazio",
        "26"
      ],
      [
        "1993-94",
        "Giuseppe Signori",
        "Lazio",
        "23"
      ],
      [
        "1994-95",
        "Gabriel Batistuta",
        "Fiorentina",
        "26"
      ],
      [
        "1995-96",
        "Igor Protti / Giuseppe Signori",
        "Bari / Lazio",
        "24"
      ],
      [
        "1996-97",
        "Filippo Inzaghi",
        "Atalanta",
        "24"
      ],
      [
        "1997-98",
        "Oliver Bierhoff",
        "Udinese",
        "27"
      ],
      [
        "1998-99",
        "Márcio Amoroso",
        "Udinese",
        "22"
      ],
      [
        "1999-2000",
        "Andriy Shevchenko",
        "AC Milan",
        "24"
      ],
      [
        "2000-01",
        "Hernán Crespo",
        "Lazio",
        "26"
      ],
      [
        "2001-02",
        "David Trezeguet / Dario Hübner",
        "Juventus / Piacenza",
        "24"
      ],
      [
        "2002-03",
        "Christian Vieri",
        "Inter",
        "24"
      ],
      [
        "2003-04",
        "Andriy Shevchenko",
        "AC Milan",
        "24"
      ],
      [
        "2004-05",
        "Cristiano Lucarelli",
        "Livorno",
        "24"
      ],
      [
        "2005-06",
        "Luca Toni",
        "Fiorentina",
        "31"
      ],
      [
        "2006-07",
        "Francesco Totti",
        "Roma",
        "26"
      ],
      [
        "2007-08",
        "Alessandro Del Piero",
        "Juventus",
        "21"
      ],
      [
        "2008-09",
        "Zlatan Ibrahimović",
        "Inter",
        "25"
      ],
      [
        "2009-10",
        "Antonio Di Natale",
        "Udinese",
        "29"
      ],
      [
        "2010-11",
        "Antonio Di Natale",
        "Udinese",
        "28"
      ],
      [
        "2011-12",
        "Zlatan Ibrahimović",
        "AC Milan",
        "28"
      ],
      [
        "2012-13",
        "Edinson Cavani",
        "Napoli",
        "29"
      ],
      [
        "2013-14",
        "Ciro Immobile",
        "Torino",
        "22"
      ],
      [
        "2014-15",
        "Mauro Icardi / Luca Toni",
        "Inter / Hellas Verona",
        "22"
      ],
      [
        "2015-16",
        "Gonzalo Higuaín",
        "Napoli",
        "36"
      ],
      [
        "2016-17",
        "Edin Džeko",
        "Roma",
        "29"
      ],
      [
        "2017-18",
        "Mauro Icardi / Ciro Immobile",
        "Inter / Lazio",
        "29"
      ],
      [
        "2018-19",
        "Fabio Quagliarella",
        "Sampdoria",
        "26"
      ],
      [
        "2019-20",
        "Ciro Immobile",
        "Lazio",
        "36"
      ],
      [
        "2020-21",
        "Cristiano Ronaldo",
        "Juventus",
        "29"
      ],
      [
        "2021-22",
        "Ciro Immobile",
        "Lazio",
        "27"
      ],
      [
        "2022-23",
        "Victor Osimhen",
        "Napoli",
        "26"
      ],
      [
        "2023-24",
        "Lautaro Martínez",
        "Inter",
        "24"
      ],
      [
        "2024-25",
        "Mateo Retegui",
        "Atalanta",
        "25"
      ],
      [
        "2025-26",
        "Lautaro Martínez",
        "Inter",
        "17"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the Serie A Capocannoniere the most times?",
        "a": "Gunnar Nordahl holds the record with five Capocannoniere titles, all with AC Milan between 1949-50 and 1954-55. Giuseppe Meazza, Silvio Piola, Michel Platini, Roberto Pruzzo and Ciro Immobile are among those who have won it multiple times."
      },
      {
        "q": "What is the record for most goals in a single Serie A season?",
        "a": "In the modern era, Gonzalo Higuaín (2015-16) and Ciro Immobile (2019-20) share the record with 36 goals each, both achieved across a 38-game season. Higuaín's total broke Gino Rossetti's long-standing single-season mark from the 1920s."
      },
      {
        "q": "Who was the Serie A top scorer in 2024-25?",
        "a": "Mateo Retegui of Atalanta won the 2024-25 Capocannoniere with 25 goals, finishing six clear of Juventus and Fiorentina forward Moise Kean. He was only the second Atalanta player to top the Serie A charts, after Filippo Inzaghi in 1996-97."
      },
      {
        "q": "Why are some seasons missing from the list?",
        "a": "The 1943-44 and 1944-45 seasons are omitted because World War II halted the official national championship; a regional wartime tournament in 1943-44 is not recognised as an official Serie A title. The league resumed in 1945-46."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "Serie A"
  },
  {
    "slug": "bundesliga-top-scorers",
    "h1": "Bundesliga Top Scorers by Season (1963-64 to 2024-25)",
    "title": "Bundesliga Top Scorers by Season: Every Torschützenkönig | Ball IQ",
    "description": "The complete list of Bundesliga top scorers (Torschützenkönig) for every season from 1963-64 to 2024-25, with player, club and goal tally.",
    "intro": [
      "Since the Bundesliga kicked off in 1963-64, the league's leading marksman has been crowned Torschützenkönig — and from 1966 onward handed the Kicker Torjägerkanone, the miniature cannon trophy that remains German football's most coveted individual prize for a striker. This table tracks every winner across more than six decades, from Uwe Seeler's opening-season 30 goals to Harry Kane's back-to-back cannons in Bavaria.",
      "Two names tower over the rest. Gerd Müller bagged the award seven times for Bayern Munich, including a staggering 40-goal haul in 1971-72 that stood as the single-season record for nearly half a century. Robert Lewandowski matched Müller's seven titles and finally broke that record with 41 goals in 2020-21, capping a run of five straight cannons that no one had managed before.",
      "Ties are part of the story too: several seasons ended with two players sharing top billing, from Lothar Emmerich and a young Gerd Müller in 1966-67 to Niclas Füllkrug and Christopher Nkunku splitting the honour in a low-scoring 2022-23. Every shared crown is listed below exactly as the record stands."
    ],
    "columns": [
      "Season",
      "Player",
      "Club",
      "Goals"
    ],
    "rows": [
      [
        "1963-64",
        "Uwe Seeler",
        "Hamburger SV",
        "30"
      ],
      [
        "1964-65",
        "Rudolf Brunnenmeier",
        "1860 Munich",
        "24"
      ],
      [
        "1965-66",
        "Lothar Emmerich",
        "Borussia Dortmund",
        "31"
      ],
      [
        "1966-67",
        "Lothar Emmerich / Gerd Müller",
        "Borussia Dortmund / Bayern Munich",
        "28"
      ],
      [
        "1967-68",
        "Johannes Löhr",
        "1. FC Köln",
        "27"
      ],
      [
        "1968-69",
        "Gerd Müller",
        "Bayern Munich",
        "30"
      ],
      [
        "1969-70",
        "Gerd Müller",
        "Bayern Munich",
        "38"
      ],
      [
        "1970-71",
        "Lothar Kobluhn",
        "Rot-Weiß Oberhausen",
        "24"
      ],
      [
        "1971-72",
        "Gerd Müller",
        "Bayern Munich",
        "40"
      ],
      [
        "1972-73",
        "Gerd Müller",
        "Bayern Munich",
        "36"
      ],
      [
        "1973-74",
        "Jupp Heynckes / Gerd Müller",
        "Borussia Mönchengladbach / Bayern Munich",
        "30"
      ],
      [
        "1974-75",
        "Jupp Heynckes",
        "Borussia Mönchengladbach",
        "27"
      ],
      [
        "1975-76",
        "Klaus Fischer",
        "FC Schalke 04",
        "29"
      ],
      [
        "1976-77",
        "Dieter Müller",
        "1. FC Köln",
        "34"
      ],
      [
        "1977-78",
        "Dieter Müller / Gerd Müller",
        "1. FC Köln / Bayern Munich",
        "24"
      ],
      [
        "1978-79",
        "Klaus Allofs",
        "Fortuna Düsseldorf",
        "22"
      ],
      [
        "1979-80",
        "Karl-Heinz Rummenigge",
        "Bayern Munich",
        "26"
      ],
      [
        "1980-81",
        "Karl-Heinz Rummenigge",
        "Bayern Munich",
        "29"
      ],
      [
        "1981-82",
        "Horst Hrubesch",
        "Hamburger SV",
        "27"
      ],
      [
        "1982-83",
        "Rudi Völler",
        "Werder Bremen",
        "23"
      ],
      [
        "1983-84",
        "Karl-Heinz Rummenigge",
        "Bayern Munich",
        "26"
      ],
      [
        "1984-85",
        "Klaus Allofs",
        "1. FC Köln",
        "26"
      ],
      [
        "1985-86",
        "Stefan Kuntz",
        "VfL Bochum",
        "22"
      ],
      [
        "1986-87",
        "Uwe Rahn",
        "Borussia Mönchengladbach",
        "24"
      ],
      [
        "1987-88",
        "Jürgen Klinsmann",
        "VfB Stuttgart",
        "19"
      ],
      [
        "1988-89",
        "Thomas Allofs / Roland Wohlfarth",
        "1. FC Köln / Bayern Munich",
        "17"
      ],
      [
        "1989-90",
        "Jørn Andersen",
        "Eintracht Frankfurt",
        "18"
      ],
      [
        "1990-91",
        "Roland Wohlfarth",
        "Bayern Munich",
        "21"
      ],
      [
        "1991-92",
        "Fritz Walter",
        "VfB Stuttgart",
        "22"
      ],
      [
        "1992-93",
        "Ulf Kirsten / Tony Yeboah",
        "Bayer Leverkusen / Eintracht Frankfurt",
        "20"
      ],
      [
        "1993-94",
        "Stefan Kuntz / Tony Yeboah",
        "1. FC Kaiserslautern / Eintracht Frankfurt",
        "18"
      ],
      [
        "1994-95",
        "Mario Basler / Heiko Herrlich",
        "Werder Bremen / Borussia Mönchengladbach",
        "20"
      ],
      [
        "1995-96",
        "Fredi Bobic",
        "VfB Stuttgart",
        "17"
      ],
      [
        "1996-97",
        "Ulf Kirsten",
        "Bayer Leverkusen",
        "22"
      ],
      [
        "1997-98",
        "Ulf Kirsten",
        "Bayer Leverkusen",
        "22"
      ],
      [
        "1998-99",
        "Michael Preetz",
        "Hertha BSC",
        "23"
      ],
      [
        "1999-2000",
        "Martin Max",
        "1860 Munich",
        "19"
      ],
      [
        "2000-01",
        "Sergej Barbarez / Ebbe Sand",
        "Hamburger SV / FC Schalke 04",
        "22"
      ],
      [
        "2001-02",
        "Márcio Amoroso / Martin Max",
        "Borussia Dortmund / 1860 Munich",
        "18"
      ],
      [
        "2002-03",
        "Thomas Christiansen / Giovane Élber",
        "VfL Bochum / Bayern Munich",
        "21"
      ],
      [
        "2003-04",
        "Aílton",
        "Werder Bremen",
        "28"
      ],
      [
        "2004-05",
        "Marek Mintál",
        "1. FC Nürnberg",
        "24"
      ],
      [
        "2005-06",
        "Miroslav Klose",
        "Werder Bremen",
        "25"
      ],
      [
        "2006-07",
        "Theofanis Gekas",
        "VfL Bochum",
        "20"
      ],
      [
        "2007-08",
        "Luca Toni",
        "Bayern Munich",
        "24"
      ],
      [
        "2008-09",
        "Grafite",
        "VfL Wolfsburg",
        "28"
      ],
      [
        "2009-10",
        "Edin Džeko",
        "VfL Wolfsburg",
        "22"
      ],
      [
        "2010-11",
        "Mario Gómez",
        "Bayern Munich",
        "28"
      ],
      [
        "2011-12",
        "Klaas-Jan Huntelaar",
        "FC Schalke 04",
        "29"
      ],
      [
        "2012-13",
        "Stefan Kießling",
        "Bayer Leverkusen",
        "25"
      ],
      [
        "2013-14",
        "Robert Lewandowski",
        "Borussia Dortmund",
        "20"
      ],
      [
        "2014-15",
        "Alexander Meier",
        "Eintracht Frankfurt",
        "19"
      ],
      [
        "2015-16",
        "Robert Lewandowski",
        "Bayern Munich",
        "30"
      ],
      [
        "2016-17",
        "Pierre-Emerick Aubameyang",
        "Borussia Dortmund",
        "31"
      ],
      [
        "2017-18",
        "Robert Lewandowski",
        "Bayern Munich",
        "29"
      ],
      [
        "2018-19",
        "Robert Lewandowski",
        "Bayern Munich",
        "22"
      ],
      [
        "2019-20",
        "Robert Lewandowski",
        "Bayern Munich",
        "34"
      ],
      [
        "2020-21",
        "Robert Lewandowski",
        "Bayern Munich",
        "41"
      ],
      [
        "2021-22",
        "Robert Lewandowski",
        "Bayern Munich",
        "35"
      ],
      [
        "2022-23",
        "Niclas Füllkrug / Christopher Nkunku",
        "Werder Bremen / RB Leipzig",
        "16"
      ],
      [
        "2023-24",
        "Harry Kane",
        "Bayern Munich",
        "36"
      ],
      [
        "2024-25",
        "Harry Kane",
        "Bayern Munich",
        "26"
      ],
      [
        "2025-26",
        "Harry Kane",
        "Bayern Munich",
        "36"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most Bundesliga top scorer awards?",
        "a": "Gerd Müller and Robert Lewandowski share the record with seven Torschützenkönig titles each. Müller won his for Bayern Munich between 1967 and 1978, while Lewandowski claimed his with Borussia Dortmund and Bayern between 2014 and 2022, including a record five in a row."
      },
      {
        "q": "What is the most goals scored in a single Bundesliga season?",
        "a": "Robert Lewandowski holds the record with 41 goals for Bayern Munich in 2020-21, breaking Gerd Müller's long-standing mark of 40, set for Bayern in 1971-72."
      },
      {
        "q": "Who was the Bundesliga top scorer in 2024-25?",
        "a": "Harry Kane of Bayern Munich topped the charts with 26 goals, winning the Torjägerkanone for the second season running after his 36-goal debut campaign in 2023-24."
      },
      {
        "q": "Can two players share the Bundesliga top scorer title?",
        "a": "Yes. When two players finish level on goals, both are named Torschützenkönig. It has happened several times, including Lothar Emmerich and Gerd Müller in 1966-67 and Niclas Füllkrug and Christopher Nkunku in 2022-23."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Bundesliga"
  },
  {
    "slug": "ligue-1-top-scorers",
    "h1": "Ligue 1 Top Scorer Every Season (1932–33 to 2024–25)",
    "title": "Ligue 1 Top Scorers by Season: Every Golden Boot Winner | Ball IQ",
    "description": "The complete list of Ligue 1 top scorers for every season from 1932–33 to 2024–25 — player, club and goals, from Just Fontaine and Josip Skoblar to Kylian Mbappé.",
    "intro": [
      "France's top flight has crowned a leading marksman every season since its 1932–33 debut, and the roll call doubles as a history of European goalscoring. The early decades belonged to prolific imports and homegrown talents alike — Roger Courtois, Just Fontaine and the astonishing Josip Skoblar, whose 44 goals for Marseille in 1970–71 remain the single-season Ligue 1 record that no one has come close to touching since.",
      "A handful of names recur like a drumbeat. Carlos Bianchi topped the charts five times in the 1970s across Reims and Paris Saint-Germain, Delio Onnis piled up goals for Monaco, Tours and Toulon, and Jean-Pierre Papin strung together five straight Golden Boots for Marseille from 1988 to 1992 — a run only Kylian Mbappé has since rivalled. Ties were common in the amateur and early professional eras, when two or even three players finished level and shared the honour.",
      "The modern era is defined by Mbappé, who led the division in six of seven seasons before leaving for Real Madrid, twice edging Wissam Ben Yedder and once posting 33 goals. His departure blew the race open: in 2024–25 Ousmane Dembélé and Mason Greenwood both finished on 21, with Dembélé taking the Golden Boot on the penalties tiebreak. The table below lists every season's leading scorer, the club they scored for, and their final tally."
    ],
    "columns": [
      "Season",
      "Player",
      "Club",
      "Goals"
    ],
    "rows": [
      [
        "1932–33",
        "Walter Kaiser / Robert Mercier",
        "Rennes / Club Français",
        "15"
      ],
      [
        "1933–34",
        "István Lukács",
        "Sète",
        "28"
      ],
      [
        "1934–35",
        "André Abegglen",
        "Sochaux",
        "30"
      ],
      [
        "1935–36",
        "Roger Courtois",
        "Sochaux",
        "34"
      ],
      [
        "1936–37",
        "Oskar Rohr",
        "Strasbourg",
        "30"
      ],
      [
        "1937–38",
        "Jean Nicolas",
        "Rouen",
        "26"
      ],
      [
        "1938–39",
        "Roger Courtois / Désiré Koranyi",
        "Sochaux / Sète",
        "27"
      ],
      [
        "1945–46",
        "René Bihel",
        "Lille",
        "28"
      ],
      [
        "1946–47",
        "Pierre Sinibaldi",
        "Reims",
        "33"
      ],
      [
        "1947–48",
        "Jean Baratte",
        "Lille",
        "31"
      ],
      [
        "1948–49",
        "Jean Baratte / Josef Humpál",
        "Lille / Sochaux",
        "26"
      ],
      [
        "1949–50",
        "Jean Grumellon",
        "Rennes",
        "25"
      ],
      [
        "1950–51",
        "Roger Piantoni / Jean Courteaux",
        "Nancy / Nice",
        "27"
      ],
      [
        "1951–52",
        "Gunnar Andersson",
        "Marseille",
        "31"
      ],
      [
        "1952–53",
        "Gunnar Andersson",
        "Marseille",
        "35"
      ],
      [
        "1953–54",
        "Édouard Kargu",
        "Bordeaux",
        "27"
      ],
      [
        "1954–55",
        "René Bliard",
        "Reims",
        "30"
      ],
      [
        "1955–56",
        "Thadée Cisowski",
        "Racing Paris",
        "31"
      ],
      [
        "1956–57",
        "Thadée Cisowski",
        "Racing Paris",
        "33"
      ],
      [
        "1957–58",
        "Just Fontaine",
        "Reims",
        "34"
      ],
      [
        "1958–59",
        "Thadée Cisowski",
        "Racing Paris",
        "30"
      ],
      [
        "1959–60",
        "Just Fontaine",
        "Reims",
        "28"
      ],
      [
        "1960–61",
        "Roger Piantoni",
        "Reims",
        "28"
      ],
      [
        "1961–62",
        "Sékou Touré",
        "Montpellier",
        "25"
      ],
      [
        "1962–63",
        "Serge Masnaghetti",
        "Valenciennes",
        "35"
      ],
      [
        "1963–64",
        "Ahmed Oudjani",
        "Lens",
        "30"
      ],
      [
        "1964–65",
        "Jacques Simon",
        "Nantes",
        "24"
      ],
      [
        "1965–66",
        "Philippe Gondet",
        "Nantes",
        "36"
      ],
      [
        "1966–67",
        "Hervé Revelli",
        "Saint-Étienne",
        "31"
      ],
      [
        "1967–68",
        "Étienne Sansonetti",
        "Ajaccio",
        "26"
      ],
      [
        "1968–69",
        "André Guy",
        "Lyon",
        "25"
      ],
      [
        "1969–70",
        "Hervé Revelli",
        "Saint-Étienne",
        "28"
      ],
      [
        "1970–71",
        "Josip Skoblar",
        "Marseille",
        "44"
      ],
      [
        "1971–72",
        "Josip Skoblar",
        "Marseille",
        "30"
      ],
      [
        "1972–73",
        "Josip Skoblar",
        "Marseille",
        "26"
      ],
      [
        "1973–74",
        "Carlos Bianchi",
        "Reims",
        "30"
      ],
      [
        "1974–75",
        "Delio Onnis",
        "Monaco",
        "30"
      ],
      [
        "1975–76",
        "Carlos Bianchi",
        "Reims",
        "34"
      ],
      [
        "1976–77",
        "Carlos Bianchi",
        "Reims",
        "28"
      ],
      [
        "1977–78",
        "Carlos Bianchi",
        "Paris Saint-Germain",
        "37"
      ],
      [
        "1978–79",
        "Carlos Bianchi",
        "Paris Saint-Germain",
        "27"
      ],
      [
        "1979–80",
        "Erwin Kostedde / Delio Onnis",
        "Laval / Monaco",
        "21"
      ],
      [
        "1980–81",
        "Delio Onnis",
        "Tours",
        "24"
      ],
      [
        "1981–82",
        "Delio Onnis",
        "Tours",
        "29"
      ],
      [
        "1982–83",
        "Vahid Halilhodžić",
        "Nantes",
        "27"
      ],
      [
        "1983–84",
        "Patrice Garande / Delio Onnis",
        "Auxerre / Toulon",
        "21"
      ],
      [
        "1984–85",
        "Vahid Halilhodžić",
        "Nantes",
        "28"
      ],
      [
        "1985–86",
        "Jules Bocandé",
        "Metz",
        "23"
      ],
      [
        "1986–87",
        "Bernard Zénier",
        "Metz",
        "18"
      ],
      [
        "1987–88",
        "Jean-Pierre Papin",
        "Marseille",
        "19"
      ],
      [
        "1988–89",
        "Jean-Pierre Papin",
        "Marseille",
        "22"
      ],
      [
        "1989–90",
        "Jean-Pierre Papin",
        "Marseille",
        "30"
      ],
      [
        "1990–91",
        "Jean-Pierre Papin",
        "Marseille",
        "23"
      ],
      [
        "1991–92",
        "Jean-Pierre Papin",
        "Marseille",
        "27"
      ],
      [
        "1992–93",
        "Alen Bokšić",
        "Marseille",
        "23"
      ],
      [
        "1993–94",
        "Roger Boli / Youri Djorkaeff / Nicolas Ouédec",
        "Lens / Monaco / Nantes",
        "20"
      ],
      [
        "1994–95",
        "Patrice Loko",
        "Nantes",
        "22"
      ],
      [
        "1995–96",
        "Sonny Anderson",
        "Monaco",
        "21"
      ],
      [
        "1996–97",
        "Stéphane Guivarc'h",
        "Rennes",
        "21"
      ],
      [
        "1997–98",
        "Stéphane Guivarc'h",
        "Auxerre",
        "21"
      ],
      [
        "1998–99",
        "Sylvain Wiltord",
        "Bordeaux",
        "22"
      ],
      [
        "1999–2000",
        "Sonny Anderson",
        "Lyon",
        "23"
      ],
      [
        "2000–01",
        "Sonny Anderson",
        "Lyon",
        "22"
      ],
      [
        "2001–02",
        "Djibril Cissé / Pauleta",
        "Auxerre / Bordeaux",
        "22"
      ],
      [
        "2002–03",
        "Shabani Nonda",
        "Monaco",
        "26"
      ],
      [
        "2003–04",
        "Djibril Cissé",
        "Auxerre",
        "26"
      ],
      [
        "2004–05",
        "Alexander Frei",
        "Rennes",
        "20"
      ],
      [
        "2005–06",
        "Pauleta",
        "Paris Saint-Germain",
        "21"
      ],
      [
        "2006–07",
        "Pauleta",
        "Paris Saint-Germain",
        "15"
      ],
      [
        "2007–08",
        "Karim Benzema",
        "Lyon",
        "20"
      ],
      [
        "2008–09",
        "André-Pierre Gignac",
        "Toulouse",
        "24"
      ],
      [
        "2009–10",
        "Mamadou Niang",
        "Marseille",
        "18"
      ],
      [
        "2010–11",
        "Moussa Sow",
        "Lille",
        "25"
      ],
      [
        "2011–12",
        "Olivier Giroud / Nenê",
        "Montpellier / Paris Saint-Germain",
        "21"
      ],
      [
        "2012–13",
        "Zlatan Ibrahimović",
        "Paris Saint-Germain",
        "30"
      ],
      [
        "2013–14",
        "Zlatan Ibrahimović",
        "Paris Saint-Germain",
        "26"
      ],
      [
        "2014–15",
        "Alexandre Lacazette",
        "Lyon",
        "27"
      ],
      [
        "2015–16",
        "Zlatan Ibrahimović",
        "Paris Saint-Germain",
        "38"
      ],
      [
        "2016–17",
        "Edinson Cavani",
        "Paris Saint-Germain",
        "35"
      ],
      [
        "2017–18",
        "Edinson Cavani",
        "Paris Saint-Germain",
        "28"
      ],
      [
        "2018–19",
        "Kylian Mbappé",
        "Paris Saint-Germain",
        "33"
      ],
      [
        "2019–20",
        "Kylian Mbappé",
        "Paris Saint-Germain",
        "18"
      ],
      [
        "2020–21",
        "Kylian Mbappé",
        "Paris Saint-Germain",
        "27"
      ],
      [
        "2021–22",
        "Kylian Mbappé",
        "Paris Saint-Germain",
        "28"
      ],
      [
        "2022–23",
        "Kylian Mbappé",
        "Paris Saint-Germain",
        "29"
      ],
      [
        "2023–24",
        "Kylian Mbappé",
        "Paris Saint-Germain",
        "27"
      ],
      [
        "2024–25",
        "Ousmane Dembélé",
        "Paris Saint-Germain",
        "21"
      ],
      [
        "2025–26",
        "Esteban Lepaul",
        "Rennes",
        "21"
      ]
    ],
    "faq": [
      {
        "q": "Who has scored the most goals in a single Ligue 1 season?",
        "a": "Josip Skoblar holds the record with 44 goals for Marseille in 1970–71, a tally no player has matched since. Zlatan Ibrahimović's 38 for PSG in 2015–16 is the highest of the modern era."
      },
      {
        "q": "Who has won the most Ligue 1 top-scorer titles?",
        "a": "Carlos Bianchi and Delio Onnis lead the all-time list. Bianchi topped the charts five times in the 1970s, while Jean-Pierre Papin won five in a row from 1988 to 1992 and Kylian Mbappé led the division in six of seven seasons before 2024."
      },
      {
        "q": "Who was the Ligue 1 top scorer in 2024–25?",
        "a": "Ousmane Dembélé of Paris Saint-Germain won the Golden Boot with 21 goals. He finished level with Marseille's Mason Greenwood, who also scored 21, but took the award on the penalties-scored tiebreak."
      },
      {
        "q": "Why is there no Ligue 1 top scorer between 1939 and 1945?",
        "a": "The French Championship was suspended during the Second World War, so no official league title or top-scorer award was contested from the 1939–40 season through 1944–45. Play resumed in 1945–46."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "Ligue 1"
  },
  {
    "slug": "champions-league-top-scorers",
    "h1": "Champions League Top Scorer Every Season (1955-56 to 2024-25)",
    "title": "Champions League Top Scorers by Season: Complete List | Ball IQ",
    "description": "The top scorer of every European Cup and UEFA Champions League season from 1955-56 to 2024-25, with player, club and goal tally for each year.",
    "intro": [
      "Since the European Cup kicked off in 1955, one player has finished ahead of the rest in front of goal almost every season. This complete list runs from Miloš Milutinović's eight goals in that debut 1955-56 campaign, through the 1992 rebrand to the UEFA Champions League, all the way to the 2024-25 final. In the early decades the leading tallies were modest — often five, six or seven goals — and ties at the top were common, reflecting a straight knockout format with far fewer matches than today's expanded league phase.",
      "The modern era belongs to two names above all others. Cristiano Ronaldo topped the scoring charts a record seven times and set the single-season benchmark of 17 goals in 2013-14, while Lionel Messi led or shared the lead five times, peaking at 14 in 2011-12. Between them they dominated a remarkable twelve-year stretch until Robert Lewandowski broke the streak with 15 goals for Bayern Munich in 2019-20.",
      "More recently the crown has spread around. Erling Haaland announced himself in 2020-21 and again in 2022-23, Karim Benzema drove Real Madrid's 2021-22 triumph, and the last two seasons ended in ties — Harry Kane and Kylian Mbappé sharing 2023-24, then Raphinha and Serhou Guirassy each hitting 13 in 2024-25. Where a season ended level, every joint-top scorer is listed together in the same row."
    ],
    "columns": [
      "Season",
      "Player",
      "Club",
      "Goals"
    ],
    "rows": [
      [
        "1955-56",
        "Miloš Milutinović",
        "Partizan",
        "8"
      ],
      [
        "1956-57",
        "Dennis Viollet",
        "Manchester United",
        "9"
      ],
      [
        "1957-58",
        "Alfredo Di Stéfano",
        "Real Madrid",
        "10"
      ],
      [
        "1958-59",
        "Just Fontaine",
        "Reims",
        "10"
      ],
      [
        "1959-60",
        "Ferenc Puskás",
        "Real Madrid",
        "12"
      ],
      [
        "1960-61",
        "José Águas",
        "Benfica",
        "11"
      ],
      [
        "1961-62",
        "Heinz Strehl",
        "1. FC Nürnberg",
        "8"
      ],
      [
        "1962-63",
        "José Altafini",
        "AC Milan",
        "14"
      ],
      [
        "1963-64",
        "Vladica Kovačević / Sandro Mazzola / Ferenc Puskás",
        "Partizan / Inter Milan / Real Madrid",
        "7"
      ],
      [
        "1964-65",
        "José Torres",
        "Benfica",
        "11"
      ],
      [
        "1965-66",
        "Flórián Albert / Eusébio",
        "Ferencváros / Benfica",
        "7"
      ],
      [
        "1966-67",
        "Jürgen Piepenburg / Paul Van Himst",
        "Vorwärts Berlin / Anderlecht",
        "6"
      ],
      [
        "1967-68",
        "Eusébio",
        "Benfica",
        "6"
      ],
      [
        "1968-69",
        "Denis Law",
        "Manchester United",
        "9"
      ],
      [
        "1969-70",
        "Mick Jones",
        "Leeds United",
        "8"
      ],
      [
        "1970-71",
        "Antonis Antoniadis",
        "Panathinaikos",
        "10"
      ],
      [
        "1971-72",
        "Johan Cruyff / Antal Dunai / Lou Macari / Silvester Takač",
        "Ajax / Újpest / Celtic / Standard Liège",
        "5"
      ],
      [
        "1972-73",
        "Gerd Müller",
        "Bayern Munich",
        "11"
      ],
      [
        "1973-74",
        "Gerd Müller",
        "Bayern Munich",
        "8"
      ],
      [
        "1974-75",
        "Gerd Müller / Eduard Markarov",
        "Bayern Munich / Ararat Yerevan",
        "5"
      ],
      [
        "1975-76",
        "Jupp Heynckes",
        "Borussia Mönchengladbach",
        "6"
      ],
      [
        "1976-77",
        "Gerd Müller / Franco Cucinotta",
        "Bayern Munich / FC Zürich",
        "5"
      ],
      [
        "1977-78",
        "Allan Simonsen",
        "Borussia Mönchengladbach",
        "5"
      ],
      [
        "1978-79",
        "Claudio Sulser",
        "Grasshopper",
        "11"
      ],
      [
        "1979-80",
        "Søren Lerby",
        "Ajax",
        "10"
      ],
      [
        "1980-81",
        "Terry McDermott / Graeme Souness / Karl-Heinz Rummenigge",
        "Liverpool / Liverpool / Bayern Munich",
        "6"
      ],
      [
        "1981-82",
        "Dieter Hoeneß",
        "Bayern Munich",
        "7"
      ],
      [
        "1982-83",
        "Paolo Rossi",
        "Juventus",
        "6"
      ],
      [
        "1983-84",
        "Viktor Sokol",
        "Dinamo Minsk",
        "6"
      ],
      [
        "1984-85",
        "Torbjörn Nilsson / Michel Platini",
        "IFK Göteborg / Juventus",
        "7"
      ],
      [
        "1985-86",
        "Torbjörn Nilsson",
        "IFK Göteborg",
        "6"
      ],
      [
        "1986-87",
        "Borislav Cvetković",
        "Red Star Belgrade",
        "7"
      ],
      [
        "1987-88",
        "Gheorghe Hagi / Rabah Madjer / Ally McCoist / Míchel / Rui Águas / Petar Novák / René van der Gijp",
        "Multiple clubs",
        "4"
      ],
      [
        "1988-89",
        "Marco van Basten",
        "AC Milan",
        "10"
      ],
      [
        "1989-90",
        "Romário / Jean-Pierre Papin",
        "PSV Eindhoven / Marseille",
        "6"
      ],
      [
        "1990-91",
        "Peter Pacult / Jean-Pierre Papin",
        "Tirol Innsbruck / Marseille",
        "6"
      ],
      [
        "1991-92",
        "Sergei Yuran / Jean-Pierre Papin",
        "Benfica / Marseille",
        "7"
      ],
      [
        "1992-93",
        "Romário",
        "PSV Eindhoven",
        "7"
      ],
      [
        "1993-94",
        "Ronald Koeman / Wynton Rufer",
        "Barcelona / Werder Bremen",
        "8"
      ],
      [
        "1994-95",
        "George Weah",
        "Paris Saint-Germain",
        "7"
      ],
      [
        "1995-96",
        "Jari Litmanen",
        "Ajax",
        "9"
      ],
      [
        "1996-97",
        "Milinko Pantić",
        "Atlético Madrid",
        "5"
      ],
      [
        "1997-98",
        "Alessandro Del Piero",
        "Juventus",
        "10"
      ],
      [
        "1998-99",
        "Andriy Shevchenko / Dwight Yorke",
        "Dynamo Kyiv / Manchester United",
        "8"
      ],
      [
        "1999-2000",
        "Mário Jardel / Rivaldo / Raúl",
        "Porto / Barcelona / Real Madrid",
        "10"
      ],
      [
        "2000-01",
        "Raúl",
        "Real Madrid",
        "7"
      ],
      [
        "2001-02",
        "Ruud van Nistelrooy",
        "Manchester United",
        "10"
      ],
      [
        "2002-03",
        "Ruud van Nistelrooy",
        "Manchester United",
        "12"
      ],
      [
        "2003-04",
        "Fernando Morientes",
        "Monaco",
        "9"
      ],
      [
        "2004-05",
        "Ruud van Nistelrooy",
        "Manchester United",
        "8"
      ],
      [
        "2005-06",
        "Andriy Shevchenko",
        "AC Milan",
        "9"
      ],
      [
        "2006-07",
        "Kaká",
        "AC Milan",
        "10"
      ],
      [
        "2007-08",
        "Cristiano Ronaldo",
        "Manchester United",
        "8"
      ],
      [
        "2008-09",
        "Lionel Messi",
        "Barcelona",
        "9"
      ],
      [
        "2009-10",
        "Lionel Messi",
        "Barcelona",
        "8"
      ],
      [
        "2010-11",
        "Lionel Messi",
        "Barcelona",
        "12"
      ],
      [
        "2011-12",
        "Lionel Messi",
        "Barcelona",
        "14"
      ],
      [
        "2012-13",
        "Cristiano Ronaldo",
        "Real Madrid",
        "12"
      ],
      [
        "2013-14",
        "Cristiano Ronaldo",
        "Real Madrid",
        "17"
      ],
      [
        "2014-15",
        "Neymar / Cristiano Ronaldo / Lionel Messi",
        "Barcelona / Real Madrid / Barcelona",
        "10"
      ],
      [
        "2015-16",
        "Cristiano Ronaldo",
        "Real Madrid",
        "16"
      ],
      [
        "2016-17",
        "Cristiano Ronaldo",
        "Real Madrid",
        "12"
      ],
      [
        "2017-18",
        "Cristiano Ronaldo",
        "Real Madrid",
        "15"
      ],
      [
        "2018-19",
        "Lionel Messi",
        "Barcelona",
        "12"
      ],
      [
        "2019-20",
        "Robert Lewandowski",
        "Bayern Munich",
        "15"
      ],
      [
        "2020-21",
        "Erling Haaland",
        "Borussia Dortmund",
        "10"
      ],
      [
        "2021-22",
        "Karim Benzema",
        "Real Madrid",
        "15"
      ],
      [
        "2022-23",
        "Erling Haaland",
        "Manchester City",
        "12"
      ],
      [
        "2023-24",
        "Harry Kane / Kylian Mbappé",
        "Bayern Munich / Paris Saint-Germain",
        "8"
      ],
      [
        "2024-25",
        "Raphinha / Serhou Guirassy",
        "Barcelona / Borussia Dortmund",
        "13"
      ],
      [
        "2025-26",
        "Kylian Mbappé",
        "Real Madrid",
        "15"
      ]
    ],
    "faq": [
      {
        "q": "Who has been the Champions League top scorer the most times?",
        "a": "Cristiano Ronaldo has finished as the top scorer in a single season a record seven times. Lionel Messi led or shared the scoring charts five times, and between them they topped the standings for twelve consecutive seasons until Robert Lewandowski broke the run in 2019-20."
      },
      {
        "q": "What is the most goals scored in a single Champions League season?",
        "a": "Cristiano Ronaldo holds the record with 17 goals for Real Madrid in the 2013-14 season, when Madrid won 'La Décima'. He also scored 16 in 2015-16, the next-highest single-season tally in the competition's history."
      },
      {
        "q": "Who was the Champions League top scorer in 2024-25?",
        "a": "Barcelona's Raphinha and Borussia Dortmund's Serhou Guirassy each scored 13 goals in the 2024-25 UEFA Champions League. UEFA awarded the Golden Boot to Guirassy on the fewer-minutes tie-breaker, but both are recognised as the season's joint-top scorers on 13."
      },
      {
        "q": "Why do some seasons list more than one top scorer?",
        "a": "Especially in the earlier knockout era, several players often finished level on goals with no additional tie-breaker applied. Every player who shared the lead is listed together in that season's row — as with the 1971-72 four-way tie on five goals or the 2024-25 tie on 13."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Champions League"
  },
  {
    "slug": "europa-league-winners",
    "h1": "Every UEFA Cup & Europa League Winner (1971-72 to 2024-25)",
    "title": "Europa League Winners: Full List by Season | Ball IQ",
    "description": "Complete season-by-season list of every UEFA Cup and UEFA Europa League winner from 1971-72 to 2024-25, with runners-up and final scores.",
    "intro": [
      "Europe's second-tier club competition began life as the UEFA Cup in 1971-72, replacing the old Inter-Cities Fairs Cup. For its first 26 seasons the final was played over two legs, home and away, with the trophy decided on aggregate score. From the 1997-98 edition onwards it switched to a single showpiece match at a neutral venue.",
      "In 2009-10 the tournament was rebranded as the UEFA Europa League and folded in the former UEFA Cup and Intertoto strands, expanding to a group-stage format. The competition has become a Spanish stronghold in the modern era: Sevilla alone have lifted the trophy a record seven times, while Italian, German and English clubs have all enjoyed sustained runs of success.",
      "The table below lists every champion by season, from Tottenham's inaugural 1972 win through to their 2025 triumph in Bilbao. Aggregate scores are given for the two-legged finals up to 1996-97; single-match results follow, with penalty shootouts and extra time noted where relevant."
    ],
    "columns": [
      "Season",
      "Winner",
      "Runner-up",
      "Score"
    ],
    "rows": [
      [
        "1971-72",
        "Tottenham Hotspur",
        "Wolverhampton Wanderers",
        "3-2 agg"
      ],
      [
        "1972-73",
        "Liverpool",
        "Borussia Monchengladbach",
        "3-2 agg"
      ],
      [
        "1973-74",
        "Feyenoord",
        "Tottenham Hotspur",
        "4-2 agg"
      ],
      [
        "1974-75",
        "Borussia Monchengladbach",
        "Twente",
        "5-1 agg"
      ],
      [
        "1975-76",
        "Liverpool",
        "Club Brugge",
        "4-3 agg"
      ],
      [
        "1976-77",
        "Juventus",
        "Athletic Bilbao",
        "2-2 agg (won on away goals)"
      ],
      [
        "1977-78",
        "PSV Eindhoven",
        "Bastia",
        "3-0 agg"
      ],
      [
        "1978-79",
        "Borussia Monchengladbach",
        "Red Star Belgrade",
        "2-1 agg"
      ],
      [
        "1979-80",
        "Eintracht Frankfurt",
        "Borussia Monchengladbach",
        "3-3 agg (won on away goals)"
      ],
      [
        "1980-81",
        "Ipswich Town",
        "AZ Alkmaar",
        "5-4 agg"
      ],
      [
        "1981-82",
        "IFK Goteborg",
        "Hamburg",
        "4-0 agg"
      ],
      [
        "1982-83",
        "Anderlecht",
        "Benfica",
        "2-1 agg"
      ],
      [
        "1983-84",
        "Tottenham Hotspur",
        "Anderlecht",
        "2-2 agg (4-3 pens)"
      ],
      [
        "1984-85",
        "Real Madrid",
        "Videoton",
        "3-1 agg"
      ],
      [
        "1985-86",
        "Real Madrid",
        "Koln",
        "5-3 agg"
      ],
      [
        "1986-87",
        "IFK Goteborg",
        "Dundee United",
        "2-1 agg"
      ],
      [
        "1987-88",
        "Bayer Leverkusen",
        "Espanyol",
        "3-3 agg (3-2 pens)"
      ],
      [
        "1988-89",
        "Napoli",
        "Stuttgart",
        "5-4 agg"
      ],
      [
        "1989-90",
        "Juventus",
        "Fiorentina",
        "3-1 agg"
      ],
      [
        "1990-91",
        "Inter Milan",
        "Roma",
        "2-1 agg"
      ],
      [
        "1991-92",
        "Ajax",
        "Torino",
        "2-2 agg (won on away goals)"
      ],
      [
        "1992-93",
        "Juventus",
        "Borussia Dortmund",
        "6-1 agg"
      ],
      [
        "1993-94",
        "Inter Milan",
        "Salzburg",
        "2-0 agg"
      ],
      [
        "1994-95",
        "Parma",
        "Juventus",
        "2-1 agg"
      ],
      [
        "1995-96",
        "Bayern Munich",
        "Bordeaux",
        "5-1 agg"
      ],
      [
        "1996-97",
        "Schalke 04",
        "Inter Milan",
        "1-1 agg (4-1 pens)"
      ],
      [
        "1997-98",
        "Inter Milan",
        "Lazio",
        "3-0"
      ],
      [
        "1998-99",
        "Parma",
        "Marseille",
        "3-0"
      ],
      [
        "1999-2000",
        "Galatasaray",
        "Arsenal",
        "0-0 (4-1 pens)"
      ],
      [
        "2000-01",
        "Liverpool",
        "Alaves",
        "5-4 (golden goal)"
      ],
      [
        "2001-02",
        "Feyenoord",
        "Borussia Dortmund",
        "3-2"
      ],
      [
        "2002-03",
        "Porto",
        "Celtic",
        "3-2 (aet)"
      ],
      [
        "2003-04",
        "Valencia",
        "Marseille",
        "2-0"
      ],
      [
        "2004-05",
        "CSKA Moscow",
        "Sporting CP",
        "3-1"
      ],
      [
        "2005-06",
        "Sevilla",
        "Middlesbrough",
        "4-0"
      ],
      [
        "2006-07",
        "Sevilla",
        "Espanyol",
        "2-2 (3-1 pens)"
      ],
      [
        "2007-08",
        "Zenit St Petersburg",
        "Rangers",
        "2-0"
      ],
      [
        "2008-09",
        "Shakhtar Donetsk",
        "Werder Bremen",
        "2-1 (aet)"
      ],
      [
        "2009-10",
        "Atletico Madrid",
        "Fulham",
        "2-1 (aet)"
      ],
      [
        "2010-11",
        "Porto",
        "Braga",
        "1-0"
      ],
      [
        "2011-12",
        "Atletico Madrid",
        "Athletic Bilbao",
        "3-0"
      ],
      [
        "2012-13",
        "Chelsea",
        "Benfica",
        "2-1"
      ],
      [
        "2013-14",
        "Sevilla",
        "Benfica",
        "0-0 (4-2 pens)"
      ],
      [
        "2014-15",
        "Sevilla",
        "Dnipro",
        "3-2"
      ],
      [
        "2015-16",
        "Sevilla",
        "Liverpool",
        "3-1"
      ],
      [
        "2016-17",
        "Manchester United",
        "Ajax",
        "2-0"
      ],
      [
        "2017-18",
        "Atletico Madrid",
        "Marseille",
        "3-0"
      ],
      [
        "2018-19",
        "Chelsea",
        "Arsenal",
        "4-1"
      ],
      [
        "2019-20",
        "Sevilla",
        "Inter Milan",
        "3-2"
      ],
      [
        "2020-21",
        "Villarreal",
        "Manchester United",
        "1-1 (11-10 pens)"
      ],
      [
        "2021-22",
        "Eintracht Frankfurt",
        "Rangers",
        "1-1 (5-4 pens)"
      ],
      [
        "2022-23",
        "Sevilla",
        "Roma",
        "1-1 (4-1 pens)"
      ],
      [
        "2023-24",
        "Atalanta",
        "Bayer Leverkusen",
        "3-0"
      ],
      [
        "2024-25",
        "Tottenham Hotspur",
        "Manchester United",
        "1-0"
      ],
      [
        "2025-26",
        "Aston Villa",
        "SC Freiburg",
        "3-0"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the Europa League the most times?",
        "a": "Sevilla are the record holders with seven titles, all won since 2006. Their haul (2006, 2007, 2014, 2015, 2016, 2020 and 2023) dwarfs every other club; no one else has more than three UEFA Cup/Europa League crowns."
      },
      {
        "q": "When did the UEFA Cup become the Europa League?",
        "a": "The competition was rebranded as the UEFA Europa League for the 2009-10 season, when it absorbed the old UEFA Cup and Intertoto Cup formats. Atletico Madrid were the first winners under the new name, beating Fulham 2-1 after extra time."
      },
      {
        "q": "Who won the 2025 Europa League final?",
        "a": "Tottenham Hotspur won the 2024-25 Europa League, beating Manchester United 1-0 in the final in Bilbao on 21 May 2025. Brennan Johnson's first-half goal ended Spurs' 17-year trophy drought and secured Champions League qualification."
      },
      {
        "q": "Why were early UEFA Cup finals played over two legs?",
        "a": "From 1971-72 until 1996-97 the final was contested across two matches, one at each finalist's home ground, with the winner decided on aggregate score (and away goals or penalties if level). The single-match neutral-venue final was introduced in 1997-98."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Europa League"
  },
  {
    "slug": "afcon-winners",
    "h1": "Every AFCON Winner: Africa Cup of Nations Champions (1957–2025)",
    "title": "AFCON Winners: Every Africa Cup of Nations Champion (1957–2025) | Ball IQ",
    "description": "The complete list of Africa Cup of Nations winners from 1957 to 2025 — every champion, runner-up and host, with Egypt the record seven-time winners.",
    "intro": [
      "The Africa Cup of Nations is the continent's oldest and most prestigious international football tournament, first contested in 1957 with just three teams: Egypt, Sudan and Ethiopia. From those modest beginnings it has grown into a 24-nation showpiece watched by hundreds of millions, staged every two years and long regarded as the toughest trophy to win outside the World Cup itself.",
      "Egypt are the undisputed kings of the competition. The Pharaohs claimed the very first edition in 1957 and have gone on to lift the trophy a record seven times, including a hat-trick of titles in 2006, 2008 and 2010. Cameroon follow with five crowns, while Ghana and Nigeria have each been champions on multiple occasions. Powerhouses from every corner of the continent — from Zambia's fairytale 2012 triumph to Algeria, Senegal and Ivory Coast in the modern era — have all had their moment.",
      "The three most recent editions each carried a quirk of the calendar and, in one case, of the courtroom. AFCON 2021 was played in early 2022 in Cameroon and won by Senegal; AFCON 2023 was played in early 2024 in Ivory Coast, where the host nation recovered from a group-stage scare to be crowned champions; and AFCON 2025, held in Morocco, ended in a contested final. Below is the full roll of honour, one row per tournament, from 1957 to the present day."
    ],
    "columns": [
      "Year",
      "Winner",
      "Runner-up",
      "Host"
    ],
    "rows": [
      [
        "1957",
        "Egypt",
        "Ethiopia",
        "Sudan"
      ],
      [
        "1959",
        "Egypt",
        "Sudan",
        "Egypt"
      ],
      [
        "1962",
        "Ethiopia",
        "Egypt",
        "Ethiopia"
      ],
      [
        "1963",
        "Ghana",
        "Sudan",
        "Ghana"
      ],
      [
        "1965",
        "Ghana",
        "Tunisia",
        "Tunisia"
      ],
      [
        "1968",
        "DR Congo",
        "Ghana",
        "Ethiopia"
      ],
      [
        "1970",
        "Sudan",
        "Ghana",
        "Sudan"
      ],
      [
        "1972",
        "Congo",
        "Mali",
        "Cameroon"
      ],
      [
        "1974",
        "Zaire",
        "Zambia",
        "Egypt"
      ],
      [
        "1976",
        "Morocco",
        "Guinea",
        "Ethiopia"
      ],
      [
        "1978",
        "Ghana",
        "Uganda",
        "Ghana"
      ],
      [
        "1980",
        "Nigeria",
        "Algeria",
        "Nigeria"
      ],
      [
        "1982",
        "Ghana",
        "Libya",
        "Libya"
      ],
      [
        "1984",
        "Cameroon",
        "Nigeria",
        "Ivory Coast"
      ],
      [
        "1986",
        "Egypt",
        "Cameroon",
        "Egypt"
      ],
      [
        "1988",
        "Cameroon",
        "Nigeria",
        "Morocco"
      ],
      [
        "1990",
        "Algeria",
        "Nigeria",
        "Algeria"
      ],
      [
        "1992",
        "Ivory Coast",
        "Ghana",
        "Senegal"
      ],
      [
        "1994",
        "Nigeria",
        "Zambia",
        "Tunisia"
      ],
      [
        "1996",
        "South Africa",
        "Tunisia",
        "South Africa"
      ],
      [
        "1998",
        "Egypt",
        "South Africa",
        "Burkina Faso"
      ],
      [
        "2000",
        "Cameroon",
        "Nigeria",
        "Ghana & Nigeria"
      ],
      [
        "2002",
        "Cameroon",
        "Senegal",
        "Mali"
      ],
      [
        "2004",
        "Tunisia",
        "Morocco",
        "Tunisia"
      ],
      [
        "2006",
        "Egypt",
        "Ivory Coast",
        "Egypt"
      ],
      [
        "2008",
        "Egypt",
        "Cameroon",
        "Ghana"
      ],
      [
        "2010",
        "Egypt",
        "Ghana",
        "Angola"
      ],
      [
        "2012",
        "Zambia",
        "Ivory Coast",
        "Gabon & Equatorial Guinea"
      ],
      [
        "2013",
        "Nigeria",
        "Burkina Faso",
        "South Africa"
      ],
      [
        "2015",
        "Ivory Coast",
        "Ghana",
        "Equatorial Guinea"
      ],
      [
        "2017",
        "Cameroon",
        "Egypt",
        "Gabon"
      ],
      [
        "2019",
        "Algeria",
        "Senegal",
        "Egypt"
      ],
      [
        "2021",
        "Senegal",
        "Egypt",
        "Cameroon"
      ],
      [
        "2023",
        "Ivory Coast",
        "Nigeria",
        "Ivory Coast"
      ],
      [
        "2025",
        "Morocco",
        "Senegal",
        "Morocco"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most AFCON titles?",
        "a": "Egypt are the record winners with seven titles (1957, 1959, 1986, 1998, 2006, 2008 and 2010), including a unique three-in-a-row between 2006 and 2010. Cameroon are next with five, ahead of Ghana on four and Nigeria on three."
      },
      {
        "q": "Who won AFCON 2025 in Morocco?",
        "a": "Morocco are the official champions of AFCON 2025, staged on home soil. The final against Senegal was marred by controversy after Senegal briefly walked off the pitch, and the CAF Appeal Board awarded Morocco a 3-0 win by forfeit in March 2026. Senegal lodged an appeal with the Court of Arbitration for Sport, but no ruling had overturned the result as of July 2026, meaning Morocco's title stands."
      },
      {
        "q": "Why was AFCON 2021 played in 2022?",
        "a": "The tournament kept its official '2021' name but was pushed into January and February 2022 in Cameroon, partly because of the COVID-19 pandemic and the difficulty of staging it during the northern-hemisphere summer. The same calendar quirk applied to AFCON 2023, which was actually played in early 2024 in Ivory Coast."
      },
      {
        "q": "Which countries have hosted the Africa Cup of Nations more than once?",
        "a": "Egypt and Ghana are among the most frequent hosts, having staged the tournament several times each. Ethiopia hosted three of the early editions, while more recent host nations include Angola (2010), Gabon (2017), Cameroon (2021), Ivory Coast (2023) and Morocco (2025)."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Africa Cup of Nations"
  },
  {
    "slug": "copa-america-winners",
    "h1": "Every Copa América Winner (1916–2024)",
    "title": "Copa América Winners: Full List by Year (1916–2024) | Ball IQ",
    "description": "The complete list of Copa América winners from 1916 to 2024, with the runner-up and host nation for every edition of South America's oldest trophy.",
    "intro": [
      "The Copa América is the oldest international football tournament in the world, first contested in 1916 as the South American Championship. Run by CONMEBOL, it has crowned a champion of the continent for more than a century, and since 1993 has regularly invited guest nations from CONCACAF and beyond to complete the field.",
      "Two nations tower over the rest. Uruguay dominated the early decades and Argentina surged ahead in the modern era, and after Argentina's 2024 triumph the two sit at the top of the roll of honour — Argentina on 16 titles, Uruguay on 15. Brazil, despite its global stature, trails on nine, a reminder that continental supremacy has never been a straight line.",
      "This table lists every edition of the tournament in chronological order, including the two separately organised championships of 1959 and the host-less, rotating editions of 1975, 1979 and 1983. Two of the most recent finals are worth flagging: Argentina beat Brazil at the Maracanã in 2021 to end a long trophy drought, then edged Colombia in extra time in the United States in 2024."
    ],
    "columns": [
      "Year",
      "Winner",
      "Runner-up",
      "Host"
    ],
    "rows": [
      [
        "1916",
        "Uruguay",
        "Argentina",
        "Argentina"
      ],
      [
        "1917",
        "Uruguay",
        "Argentina",
        "Uruguay"
      ],
      [
        "1919",
        "Brazil",
        "Uruguay",
        "Brazil"
      ],
      [
        "1920",
        "Uruguay",
        "Argentina",
        "Chile"
      ],
      [
        "1921",
        "Argentina",
        "Brazil",
        "Argentina"
      ],
      [
        "1922",
        "Brazil",
        "Paraguay",
        "Brazil"
      ],
      [
        "1923",
        "Uruguay",
        "Argentina",
        "Uruguay"
      ],
      [
        "1924",
        "Uruguay",
        "Argentina",
        "Uruguay"
      ],
      [
        "1925",
        "Argentina",
        "Brazil",
        "Argentina"
      ],
      [
        "1926",
        "Uruguay",
        "Argentina",
        "Chile"
      ],
      [
        "1927",
        "Argentina",
        "Uruguay",
        "Peru"
      ],
      [
        "1929",
        "Argentina",
        "Paraguay",
        "Argentina"
      ],
      [
        "1935",
        "Uruguay",
        "Argentina",
        "Peru"
      ],
      [
        "1937",
        "Argentina",
        "Brazil",
        "Argentina"
      ],
      [
        "1939",
        "Peru",
        "Uruguay",
        "Peru"
      ],
      [
        "1941",
        "Argentina",
        "Uruguay",
        "Chile"
      ],
      [
        "1942",
        "Uruguay",
        "Argentina",
        "Uruguay"
      ],
      [
        "1945",
        "Argentina",
        "Brazil",
        "Chile"
      ],
      [
        "1946",
        "Argentina",
        "Brazil",
        "Argentina"
      ],
      [
        "1947",
        "Argentina",
        "Paraguay",
        "Ecuador"
      ],
      [
        "1949",
        "Brazil",
        "Paraguay",
        "Brazil"
      ],
      [
        "1953",
        "Paraguay",
        "Brazil",
        "Peru"
      ],
      [
        "1955",
        "Argentina",
        "Chile",
        "Chile"
      ],
      [
        "1956",
        "Uruguay",
        "Chile",
        "Uruguay"
      ],
      [
        "1957",
        "Argentina",
        "Brazil",
        "Peru"
      ],
      [
        "1959",
        "Argentina",
        "Brazil",
        "Argentina"
      ],
      [
        "1959",
        "Uruguay",
        "Argentina",
        "Ecuador"
      ],
      [
        "1963",
        "Bolivia",
        "Paraguay",
        "Bolivia"
      ],
      [
        "1967",
        "Uruguay",
        "Argentina",
        "Uruguay"
      ],
      [
        "1975",
        "Peru",
        "Colombia",
        "Various venues"
      ],
      [
        "1979",
        "Paraguay",
        "Chile",
        "Various venues"
      ],
      [
        "1983",
        "Uruguay",
        "Brazil",
        "Various venues"
      ],
      [
        "1987",
        "Uruguay",
        "Chile",
        "Argentina"
      ],
      [
        "1989",
        "Brazil",
        "Uruguay",
        "Brazil"
      ],
      [
        "1991",
        "Argentina",
        "Brazil",
        "Chile"
      ],
      [
        "1993",
        "Argentina",
        "Mexico",
        "Ecuador"
      ],
      [
        "1995",
        "Uruguay",
        "Brazil",
        "Uruguay"
      ],
      [
        "1997",
        "Brazil",
        "Bolivia",
        "Bolivia"
      ],
      [
        "1999",
        "Brazil",
        "Uruguay",
        "Paraguay"
      ],
      [
        "2001",
        "Colombia",
        "Mexico",
        "Colombia"
      ],
      [
        "2004",
        "Brazil",
        "Argentina",
        "Peru"
      ],
      [
        "2007",
        "Brazil",
        "Argentina",
        "Venezuela"
      ],
      [
        "2011",
        "Uruguay",
        "Paraguay",
        "Argentina"
      ],
      [
        "2015",
        "Chile",
        "Argentina",
        "Chile"
      ],
      [
        "2016",
        "Chile",
        "Argentina",
        "United States"
      ],
      [
        "2019",
        "Brazil",
        "Peru",
        "Brazil"
      ],
      [
        "2021",
        "Argentina",
        "Brazil",
        "Brazil"
      ],
      [
        "2024",
        "Argentina",
        "Colombia",
        "United States"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most Copa América titles?",
        "a": "Argentina holds the record with 16 titles, having overtaken Uruguay with their 2024 win. Uruguay is second on 15, and Brazil third on 9. No other nation has won more than two."
      },
      {
        "q": "Who won the 2024 Copa América?",
        "a": "Argentina won the 2024 Copa América, beating Colombia 1–0 after extra time in the final at Hard Rock Stadium in Miami. Lautaro Martínez scored the decisive goal in the 112th minute, sealing Argentina's record 16th title."
      },
      {
        "q": "Why are there two Copa América editions in 1959?",
        "a": "In 1959 two separate South American Championships were held. The first, hosted by Argentina in the first half of the year, was won by the hosts; the second, an extraordinary edition hosted by Ecuador in December, was won by Uruguay."
      },
      {
        "q": "Has a non-South American country ever won the Copa América?",
        "a": "No. Although guest nations such as Mexico, the United States, Japan and Qatar have taken part, only CONMEBOL members have won the trophy. Mexico came closest, finishing runner-up in 1993 and 2001."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "Copa América"
  },
  {
    "slug": "most-la-liga-titles",
    "h1": "Clubs With the Most La Liga Titles",
    "title": "Most La Liga Titles: Clubs Ranked | Ball IQ",
    "description": "Which club has won the most La Liga titles? Real Madrid lead the all-time ranking. Every Spanish league champion since 1929, ranked by titles.",
    "intro": [
      "Spain's top flight has been dominated by two clubs since it began in 1929, but the full roll of honour runs deeper. This page ranks every La Liga champion by number of titles, from Real Madrid's record haul down to the one-off winners.",
      "Real Madrid lead the way with 36 titles, ahead of great rivals Barcelona on 29. Atlético Madrid are comfortably the third force, while Athletic Bilbao and Valencia head the chasing pack of clubs who have broken the duopoly over the decades."
    ],
    "columns": [
      "Rank",
      "Club",
      "Titles",
      "Years won"
    ],
    "rows": [
      [
        "1",
        "Real Madrid",
        "36",
        "1931, 1932, 1953, 1954, 1956, 1957, 1960, 1961, 1962, 1963, 1964, 1966, 1967, 1968, 1971, 1974, 1975, 1977, 1978, 1979, 1985, 1986, 1987, 1988, 1989, 1994, 1996, 2000, 2002, 2006, 2007, 2011, 2016, 2019, 2021, 2023"
      ],
      [
        "2",
        "Barcelona",
        "29",
        "1928, 1944, 1947, 1948, 1951, 1952, 1958, 1959, 1973, 1984, 1990, 1991, 1992, 1993, 1997, 1998, 2004, 2005, 2008, 2009, 2010, 2012, 2014, 2015, 2017, 2018, 2022, 2024, 2025"
      ],
      [
        "3",
        "Atletico Madrid",
        "11",
        "1939, 1940, 1949, 1950, 1965, 1969, 1972, 1976, 1995, 2013, 2020"
      ],
      [
        "4",
        "Athletic Bilbao",
        "8",
        "1929, 1930, 1933, 1935, 1942, 1955, 1982, 1983"
      ],
      [
        "5",
        "Valencia",
        "6",
        "1941, 1943, 1946, 1970, 2001, 2003"
      ],
      [
        "6",
        "Real Sociedad",
        "2",
        "1980, 1981"
      ],
      [
        "7",
        "Deportivo La Coruna",
        "1",
        "1999"
      ],
      [
        "7",
        "Real Betis",
        "1",
        "1934"
      ],
      [
        "7",
        "Sevilla",
        "1",
        "1945"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most La Liga titles?",
        "a": "Real Madrid have won the most La Liga titles, with 36. Barcelona are second with 29, and Atlético Madrid third with 11."
      },
      {
        "q": "Which clubs have won La Liga besides Real Madrid and Barcelona?",
        "a": "Nine clubs in total have won La Liga. Beyond Real Madrid and Barcelona, Atlético Madrid, Athletic Bilbao, Valencia, Real Sociedad, Deportivo La Coruña, Sevilla and Real Betis have all been champions of Spain."
      },
      {
        "q": "Is this every La Liga champion?",
        "a": "This page ranks clubs by number of titles. For the full season-by-season list of every La Liga champion and runner-up, see our La Liga champions list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "La Liga"
  },
  {
    "slug": "most-bundesliga-titles",
    "h1": "Clubs With the Most Bundesliga Titles",
    "title": "Most Bundesliga Titles: Clubs Ranked | Ball IQ",
    "description": "Which club has won the most Bundesliga titles? Bayern Munich dominate the all-time ranking. Every German champion since 1963, ranked by titles.",
    "intro": [
      "Germany's Bundesliga was founded in 1963, and while one club has towered over it, the title has still travelled widely across the country. This page ranks every Bundesliga champion by number of titles.",
      "Bayern Munich's dominance is without parallel in Europe's big leagues: they hold 34 Bundesliga titles, many times more than anyone else. Behind them, Borussia Mönchengladbach and Borussia Dortmund lead a competitive chasing group that also includes Werder Bremen, Hamburg and Stuttgart."
    ],
    "columns": [
      "Rank",
      "Club",
      "Titles",
      "Years won"
    ],
    "rows": [
      [
        "1",
        "Bayern Munich",
        "34",
        "1968, 1971, 1972, 1973, 1979, 1980, 1984, 1985, 1986, 1988, 1989, 1993, 1996, 1998, 1999, 2000, 2002, 2004, 2005, 2007, 2009, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2024, 2025"
      ],
      [
        "2",
        "Borussia Dortmund",
        "5",
        "1994, 1995, 2001, 2010, 2011"
      ],
      [
        "2",
        "Borussia Monchengladbach",
        "5",
        "1969, 1970, 1974, 1975, 1976"
      ],
      [
        "4",
        "Werder Bremen",
        "4",
        "1964, 1987, 1992, 2003"
      ],
      [
        "5",
        "Hamburger SV",
        "3",
        "1978, 1981, 1982"
      ],
      [
        "5",
        "VfB Stuttgart",
        "3",
        "1983, 1991, 2006"
      ],
      [
        "7",
        "1. FC Kaiserslautern",
        "2",
        "1990, 1997"
      ],
      [
        "7",
        "1. FC Koln",
        "2",
        "1963, 1977"
      ],
      [
        "9",
        "1. FC Nurnberg",
        "1",
        "1967"
      ],
      [
        "9",
        "Bayer Leverkusen",
        "1",
        "2023"
      ],
      [
        "9",
        "Eintracht Braunschweig",
        "1",
        "1966"
      ],
      [
        "9",
        "TSV 1860 Munich",
        "1",
        "1965"
      ],
      [
        "9",
        "VfL Wolfsburg",
        "1",
        "2008"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Bundesliga titles?",
        "a": "Bayern Munich have won the most Bundesliga titles by a huge margin, with 34. No other club has more than five."
      },
      {
        "q": "Who has won the Bundesliga besides Bayern Munich?",
        "a": "Borussia Mönchengladbach and Borussia Dortmund are next with five each, followed by Werder Bremen, Hamburger SV, VfB Stuttgart and others. Bayer Leverkusen won their first title in 2023-24."
      },
      {
        "q": "Is this every Bundesliga champion?",
        "a": "This page ranks clubs by titles. For the full season-by-season list since 1963-64, see our Bundesliga champions list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Bundesliga"
  },
  {
    "slug": "most-euros-wins",
    "h1": "Countries With the Most European Championship Wins",
    "title": "Most Euros Wins: Countries Ranked | Ball IQ",
    "description": "Which country has won the most European Championships? Spain lead with four. Every nation to win the Euros, ranked by titles, with the years.",
    "intro": [
      "The UEFA European Championship has been held every four years since 1960, and only a handful of nations have ever conquered the continent. This page ranks every Euros winner by number of titles.",
      "Spain stand alone at the top with 4, having pulled clear with their 2024 triumph. Germany follow with three (two as West Germany, one after reunification), while Italy and France are the only other multiple winners."
    ],
    "columns": [
      "Rank",
      "Country",
      "Titles",
      "Years won"
    ],
    "rows": [
      [
        "1",
        "Spain",
        "4",
        "1964, 2008, 2012, 2024"
      ],
      [
        "2",
        "Germany",
        "3",
        "1972, 1980, 1996"
      ],
      [
        "3",
        "France",
        "2",
        "1984, 2000"
      ],
      [
        "3",
        "Italy",
        "2",
        "1968, 2020"
      ],
      [
        "5",
        "Czechoslovakia",
        "1",
        "1976"
      ],
      [
        "5",
        "Denmark",
        "1",
        "1992"
      ],
      [
        "5",
        "Greece",
        "1",
        "2004"
      ],
      [
        "5",
        "Netherlands",
        "1",
        "1988"
      ],
      [
        "5",
        "Portugal",
        "1",
        "2016"
      ],
      [
        "5",
        "Soviet Union",
        "1",
        "1960"
      ]
    ],
    "faq": [
      {
        "q": "Which country has won the most Euros?",
        "a": "Spain have won the most European Championships, with 4 (1964, 2008, 2012 and 2024). Germany are second with three."
      },
      {
        "q": "How many Euros have Germany won?",
        "a": "Three — in 1972 and 1980 as West Germany, and in 1996 as a reunified Germany. That puts them second behind Spain."
      },
      {
        "q": "Is this every Euros winner?",
        "a": "This page ranks countries by titles. For the full year-by-year list of every final, winner, runner-up, score and host, see our European Championship winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Euros"
  }
];
