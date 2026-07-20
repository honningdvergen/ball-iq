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
  }
];
