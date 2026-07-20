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
  },
  {
    "slug": "most-ligue-1-titles",
    "h1": "Clubs With the Most Ligue 1 Titles",
    "title": "Most Ligue 1 Titles: Clubs Ranked | Ball IQ",
    "description": "Which club has won the most Ligue 1 titles? Paris Saint-Germain lead the all-time ranking. Every French champion since 1932, ranked by titles.",
    "intro": [
      "French football's top flight has crowned champions since 1932, and its history splits neatly into two eras: a long spell where the title moved freely between the country's great clubs, and the recent age of Paris Saint-Germain dominance. This page ranks every Ligue 1 champion by number of titles.",
      "PSG now lead the all-time list with 14, having pulled clear during the Qatari-ownership era. Saint-Étienne's 10 titles, most from a golden 1960s and 70s, keep them second, just ahead of Marseille. Note that Marseille were stripped of the 1992-93 title amid a match-fixing scandal, so it does not count toward their total."
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
        "Paris Saint-Germain",
        "14",
        "1985, 1993, 2012, 2013, 2014, 2015, 2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025"
      ],
      [
        "2",
        "Saint-Étienne",
        "10",
        "1956, 1963, 1966, 1967, 1968, 1969, 1973, 1974, 1975, 1980"
      ],
      [
        "3",
        "Marseille",
        "9",
        "1936, 1947, 1970, 1971, 1988, 1989, 1990, 1991, 2009"
      ],
      [
        "4",
        "Monaco",
        "8",
        "1960, 1962, 1977, 1981, 1987, 1996, 1999, 2016"
      ],
      [
        "4",
        "Nantes",
        "8",
        "1964, 1965, 1972, 1976, 1979, 1982, 1994, 2000"
      ],
      [
        "6",
        "Lyon",
        "7",
        "2001, 2002, 2003, 2004, 2005, 2006, 2007"
      ],
      [
        "7",
        "Bordeaux",
        "6",
        "1949, 1983, 1984, 1986, 1998, 2008"
      ],
      [
        "7",
        "Reims",
        "6",
        "1948, 1952, 1954, 1957, 1959, 1961"
      ],
      [
        "9",
        "Lille",
        "4",
        "1945, 1953, 2010, 2020"
      ],
      [
        "9",
        "Nice",
        "4",
        "1950, 1951, 1955, 1958"
      ],
      [
        "11",
        "Sète",
        "2",
        "1933, 1938"
      ],
      [
        "11",
        "Sochaux",
        "2",
        "1934, 1937"
      ],
      [
        "13",
        "Auxerre",
        "1",
        "1995"
      ],
      [
        "13",
        "Lens",
        "1",
        "1997"
      ],
      [
        "13",
        "Montpellier",
        "1",
        "2011"
      ],
      [
        "13",
        "Olympique Lillois",
        "1",
        "1932"
      ],
      [
        "13",
        "RC Paris",
        "1",
        "1935"
      ],
      [
        "13",
        "Roubaix-Tourcoing",
        "1",
        "1946"
      ],
      [
        "13",
        "Strasbourg",
        "1",
        "1978"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Ligue 1 titles?",
        "a": "Paris Saint-Germain have won the most, with 14. Saint-Étienne are second with 10, and Marseille third."
      },
      {
        "q": "Why is the 1992-93 Ligue 1 title not counted?",
        "a": "Marseille finished top in 1992-93 but were stripped of the title following a match-fixing scandal, and it was not reassigned. It is the only season with no official champion."
      },
      {
        "q": "Is this every Ligue 1 champion?",
        "a": "This page ranks clubs by titles. For the full season-by-season list, see our Ligue 1 champions list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "Ligue 1"
  },
  {
    "slug": "most-europa-league-titles",
    "h1": "Clubs With the Most Europa League Titles",
    "title": "Most Europa League Titles: Clubs Ranked (UEFA Cup) | Ball IQ",
    "description": "Which club has won the most Europa League / UEFA Cup titles? Sevilla lead by a distance. Every winner ranked, with the years they lifted it.",
    "intro": [
      "Europe's second-tier club competition — the UEFA Cup until 2009, the Europa League since — has been won by clubs from across the continent since 1972. This page ranks every winner by number of titles.",
      "One club stands far above the rest: Sevilla have made the competition their own with 7 triumphs, all since 2006, a record no one else comes close to. Behind them, a cluster of clubs including Juventus, Inter, Liverpool, Atlético Madrid and Tottenham share three apiece."
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
        "Sevilla",
        "7",
        "2005, 2006, 2013, 2014, 2015, 2019, 2022"
      ],
      [
        "2",
        "Atletico Madrid",
        "3",
        "2009, 2011, 2017"
      ],
      [
        "2",
        "Inter Milan",
        "3",
        "1990, 1993, 1997"
      ],
      [
        "2",
        "Juventus",
        "3",
        "1976, 1989, 1992"
      ],
      [
        "2",
        "Liverpool",
        "3",
        "1972, 1975, 2000"
      ],
      [
        "2",
        "Tottenham Hotspur",
        "3",
        "1971, 1983, 2024"
      ],
      [
        "7",
        "Borussia Monchengladbach",
        "2",
        "1974, 1978"
      ],
      [
        "7",
        "Chelsea",
        "2",
        "2012, 2018"
      ],
      [
        "7",
        "Eintracht Frankfurt",
        "2",
        "1979, 2021"
      ],
      [
        "7",
        "Feyenoord",
        "2",
        "1973, 2001"
      ],
      [
        "7",
        "IFK Goteborg",
        "2",
        "1981, 1986"
      ],
      [
        "7",
        "Parma",
        "2",
        "1994, 1998"
      ],
      [
        "7",
        "Porto",
        "2",
        "2002, 2010"
      ],
      [
        "7",
        "Real Madrid",
        "2",
        "1984, 1985"
      ],
      [
        "15",
        "Ajax",
        "1",
        "1991"
      ],
      [
        "15",
        "Anderlecht",
        "1",
        "1982"
      ],
      [
        "15",
        "Aston Villa",
        "1",
        "2025"
      ],
      [
        "15",
        "Atalanta",
        "1",
        "2023"
      ],
      [
        "15",
        "Bayer Leverkusen",
        "1",
        "1987"
      ],
      [
        "15",
        "Bayern Munich",
        "1",
        "1995"
      ],
      [
        "15",
        "CSKA Moscow",
        "1",
        "2004"
      ],
      [
        "15",
        "Galatasaray",
        "1",
        "1999"
      ],
      [
        "15",
        "Ipswich Town",
        "1",
        "1980"
      ],
      [
        "15",
        "Manchester United",
        "1",
        "2016"
      ],
      [
        "15",
        "Napoli",
        "1",
        "1988"
      ],
      [
        "15",
        "PSV Eindhoven",
        "1",
        "1977"
      ],
      [
        "15",
        "Schalke 04",
        "1",
        "1996"
      ],
      [
        "15",
        "Shakhtar Donetsk",
        "1",
        "2008"
      ],
      [
        "15",
        "Valencia",
        "1",
        "2003"
      ],
      [
        "15",
        "Villarreal",
        "1",
        "2020"
      ],
      [
        "15",
        "Zenit St Petersburg",
        "1",
        "2007"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Europa League titles?",
        "a": "Sevilla have won the most, with 7 — all since 2006. No other club has more than three UEFA Cup / Europa League titles."
      },
      {
        "q": "What was the Europa League called before?",
        "a": "It was the UEFA Cup from its start in 1971-72 until 2008-09, when it was rebranded as the UEFA Europa League and absorbed the old competition's history."
      },
      {
        "q": "Is this every Europa League winner?",
        "a": "This page ranks clubs by titles. For the full season-by-season list of every final, see our Europa League winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Europa League"
  },
  {
    "slug": "most-copa-america-titles",
    "h1": "Countries With the Most Copa América Titles",
    "title": "Most Copa América Titles: Countries Ranked | Ball IQ",
    "description": "Which country has won the most Copa América titles? Argentina and Uruguay lead the oldest international tournament. Every winner ranked by titles.",
    "intro": [
      "The Copa América, first held in 1916, is the oldest international football tournament in the world. This page ranks every winner by number of titles — a race led, as ever, by South America's two grand old rivals.",
      "Argentina lead the all-time count with 16, having edged clear of Uruguay (15) with their 2021 and 2024 triumphs. Brazil are third with 9, and only a handful of other nations — Peru, Paraguay, Chile, Bolivia and Colombia — have ever lifted the trophy."
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
        "Argentina",
        "16",
        "1921, 1925, 1927, 1929, 1937, 1941, 1945, 1946, 1947, 1955, 1957, 1959, 1991, 1993, 2021, 2024"
      ],
      [
        "2",
        "Uruguay",
        "15",
        "1916, 1917, 1920, 1923, 1924, 1926, 1935, 1942, 1956, 1959, 1967, 1983, 1987, 1995, 2011"
      ],
      [
        "3",
        "Brazil",
        "9",
        "1919, 1922, 1949, 1989, 1997, 1999, 2004, 2007, 2019"
      ],
      [
        "4",
        "Chile",
        "2",
        "2015, 2016"
      ],
      [
        "4",
        "Paraguay",
        "2",
        "1953, 1979"
      ],
      [
        "4",
        "Peru",
        "2",
        "1939, 1975"
      ],
      [
        "7",
        "Bolivia",
        "1",
        "1963"
      ],
      [
        "7",
        "Colombia",
        "1",
        "2001"
      ]
    ],
    "faq": [
      {
        "q": "Which country has won the most Copa América titles?",
        "a": "Argentina have won the most, with 16, just ahead of Uruguay on 15. Brazil are third with 9."
      },
      {
        "q": "What is the oldest international football tournament?",
        "a": "The Copa América, first played in 1916, is the oldest continental championship in international football — older than both the World Cup and the European Championship."
      },
      {
        "q": "Is this every Copa América winner?",
        "a": "This page ranks countries by titles. For the full year-by-year list of every winner, runner-up and host, see our Copa América winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "Copa América"
  },
  {
    "slug": "most-afcon-titles",
    "h1": "Countries With the Most AFCON Titles",
    "title": "Most AFCON Titles: Africa Cup of Nations Winners Ranked | Ball IQ",
    "description": "Which country has won the most Africa Cup of Nations titles? Egypt lead with a record haul. Every AFCON winner ranked by titles, with the years.",
    "intro": [
      "The Africa Cup of Nations has crowned the continent's champions since 1957. This page ranks every winner by number of titles — a list headed, emphatically, by one nation.",
      "Egypt are the kings of African football with 7 titles, more than any other country. Cameroon follow on 5 and Ghana on 4, while a broad group of nations from across the continent have all had their moment lifting the trophy."
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
        "Egypt",
        "7",
        "1957, 1959, 1986, 1998, 2006, 2008, 2010"
      ],
      [
        "2",
        "Cameroon",
        "5",
        "1984, 1988, 2000, 2002, 2017"
      ],
      [
        "3",
        "Ghana",
        "4",
        "1963, 1965, 1978, 1982"
      ],
      [
        "4",
        "Ivory Coast",
        "3",
        "1992, 2015, 2023"
      ],
      [
        "4",
        "Nigeria",
        "3",
        "1980, 1994, 2013"
      ],
      [
        "6",
        "Algeria",
        "2",
        "1990, 2019"
      ],
      [
        "6",
        "Morocco",
        "2",
        "1976, 2025"
      ],
      [
        "8",
        "Congo",
        "1",
        "1972"
      ],
      [
        "8",
        "DR Congo",
        "1",
        "1968"
      ],
      [
        "8",
        "Ethiopia",
        "1",
        "1962"
      ],
      [
        "8",
        "Senegal",
        "1",
        "2021"
      ],
      [
        "8",
        "South Africa",
        "1",
        "1996"
      ],
      [
        "8",
        "Sudan",
        "1",
        "1970"
      ],
      [
        "8",
        "Tunisia",
        "1",
        "2004"
      ],
      [
        "8",
        "Zaire",
        "1",
        "1974"
      ],
      [
        "8",
        "Zambia",
        "1",
        "2012"
      ]
    ],
    "faq": [
      {
        "q": "Which country has won the most AFCON titles?",
        "a": "Egypt have won the most Africa Cup of Nations titles, with 7 — a record. Cameroon are second with 5 and Ghana third with 4."
      },
      {
        "q": "Who won the most recent AFCON?",
        "a": "Morocco won the most recent Africa Cup of Nations, held on home soil, beating Senegal in the final."
      },
      {
        "q": "Is this every AFCON winner?",
        "a": "This page ranks countries by titles. For the full tournament-by-tournament list of every winner, runner-up and host, see our AFCON winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Africa Cup of Nations"
  },
  {
    "slug": "fa-cup-winners",
    "h1": "Every FA Cup Winner by Season (1872–2026)",
    "title": "FA Cup Winners: Every Final 1872–2026 | Ball IQ",
    "description": "The complete list of FA Cup winners by season, from the first final in 1871-72 to Manchester City's 2025-26 triumph, with runners-up and scores.",
    "intro": [
      "The Football Association Challenge Cup is the oldest national football competition in the world. First contested in the 1871-72 season, when Wanderers beat Royal Engineers 1-0 at the Kennington Oval, it predates the Football League by 16 years and has crowned a champion nearly every season since — pausing only for the two World Wars.",
      "Its history spans amateur gentlemen's sides like the Old Etonians and Oxford University, the rise of the northern professional clubs, and the modern dominance of the game's biggest names. The final moved to the original Wembley in 1923, decamped to Cardiff's Millennium Stadium while the new Wembley was built, and returned in 2007. For decades a drawn final meant a replay; the last one came in 1993, and finals level after extra time are now settled on penalties.",
      "The table below lists every FA Cup final winner by season, alongside the runner-up and the score. Where a final needed a replay, went to extra time, or was decided from the penalty spot, that is noted in the Score column. No rows are shown for the seasons the competition was not held during World War I and World War II."
    ],
    "columns": [
      "Season",
      "Winner",
      "Runner-up",
      "Score"
    ],
    "rows": [
      [
        "1871-72",
        "Wanderers",
        "Royal Engineers",
        "1-0"
      ],
      [
        "1872-73",
        "Wanderers",
        "Oxford University",
        "2-0"
      ],
      [
        "1873-74",
        "Oxford University",
        "Royal Engineers",
        "2-0"
      ],
      [
        "1874-75",
        "Royal Engineers",
        "Old Etonians",
        "2-0 (replay; 1-1 aet)"
      ],
      [
        "1875-76",
        "Wanderers",
        "Old Etonians",
        "3-0 (replay; 1-1)"
      ],
      [
        "1876-77",
        "Wanderers",
        "Oxford University",
        "2-1 (aet)"
      ],
      [
        "1877-78",
        "Wanderers",
        "Royal Engineers",
        "3-1"
      ],
      [
        "1878-79",
        "Old Etonians",
        "Clapham Rovers",
        "1-0"
      ],
      [
        "1879-80",
        "Clapham Rovers",
        "Oxford University",
        "1-0"
      ],
      [
        "1880-81",
        "Old Carthusians",
        "Old Etonians",
        "3-0"
      ],
      [
        "1881-82",
        "Old Etonians",
        "Blackburn Rovers",
        "1-0"
      ],
      [
        "1882-83",
        "Blackburn Olympic",
        "Old Etonians",
        "2-1 (aet)"
      ],
      [
        "1883-84",
        "Blackburn Rovers",
        "Queen's Park",
        "2-1"
      ],
      [
        "1884-85",
        "Blackburn Rovers",
        "Queen's Park",
        "2-0"
      ],
      [
        "1885-86",
        "Blackburn Rovers",
        "West Bromwich Albion",
        "2-0 (replay; 0-0)"
      ],
      [
        "1886-87",
        "Aston Villa",
        "West Bromwich Albion",
        "2-0"
      ],
      [
        "1887-88",
        "West Bromwich Albion",
        "Preston North End",
        "2-1"
      ],
      [
        "1888-89",
        "Preston North End",
        "Wolverhampton Wanderers",
        "3-0"
      ],
      [
        "1889-90",
        "Blackburn Rovers",
        "Sheffield Wednesday",
        "6-1"
      ],
      [
        "1890-91",
        "Blackburn Rovers",
        "Notts County",
        "3-1"
      ],
      [
        "1891-92",
        "West Bromwich Albion",
        "Aston Villa",
        "3-0"
      ],
      [
        "1892-93",
        "Wolverhampton Wanderers",
        "Everton",
        "1-0"
      ],
      [
        "1893-94",
        "Notts County",
        "Bolton Wanderers",
        "4-1"
      ],
      [
        "1894-95",
        "Aston Villa",
        "West Bromwich Albion",
        "1-0"
      ],
      [
        "1895-96",
        "Sheffield Wednesday",
        "Wolverhampton Wanderers",
        "2-1"
      ],
      [
        "1896-97",
        "Aston Villa",
        "Everton",
        "3-2"
      ],
      [
        "1897-98",
        "Nottingham Forest",
        "Derby County",
        "3-1"
      ],
      [
        "1898-99",
        "Sheffield United",
        "Derby County",
        "4-1"
      ],
      [
        "1899-1900",
        "Bury",
        "Southampton",
        "4-0"
      ],
      [
        "1900-01",
        "Tottenham Hotspur",
        "Sheffield United",
        "3-1 (replay; 2-2)"
      ],
      [
        "1901-02",
        "Sheffield United",
        "Southampton",
        "2-1 (replay; 1-1)"
      ],
      [
        "1902-03",
        "Bury",
        "Derby County",
        "6-0"
      ],
      [
        "1903-04",
        "Manchester City",
        "Bolton Wanderers",
        "1-0"
      ],
      [
        "1904-05",
        "Aston Villa",
        "Newcastle United",
        "2-0"
      ],
      [
        "1905-06",
        "Everton",
        "Newcastle United",
        "1-0"
      ],
      [
        "1906-07",
        "Sheffield Wednesday",
        "Everton",
        "2-1"
      ],
      [
        "1907-08",
        "Wolverhampton Wanderers",
        "Newcastle United",
        "3-1"
      ],
      [
        "1908-09",
        "Manchester United",
        "Bristol City",
        "1-0"
      ],
      [
        "1909-10",
        "Newcastle United",
        "Barnsley",
        "2-0 (replay; 1-1)"
      ],
      [
        "1910-11",
        "Bradford City",
        "Newcastle United",
        "1-0 (replay; 0-0)"
      ],
      [
        "1911-12",
        "Barnsley",
        "West Bromwich Albion",
        "1-0 (replay aet; 0-0)"
      ],
      [
        "1912-13",
        "Aston Villa",
        "Sunderland",
        "1-0"
      ],
      [
        "1913-14",
        "Burnley",
        "Liverpool",
        "1-0"
      ],
      [
        "1914-15",
        "Sheffield United",
        "Chelsea",
        "3-0"
      ],
      [
        "1919-20",
        "Aston Villa",
        "Huddersfield Town",
        "1-0 (aet)"
      ],
      [
        "1920-21",
        "Tottenham Hotspur",
        "Wolverhampton Wanderers",
        "1-0"
      ],
      [
        "1921-22",
        "Huddersfield Town",
        "Preston North End",
        "1-0"
      ],
      [
        "1922-23",
        "Bolton Wanderers",
        "West Ham United",
        "2-0"
      ],
      [
        "1923-24",
        "Newcastle United",
        "Aston Villa",
        "2-0"
      ],
      [
        "1924-25",
        "Sheffield United",
        "Cardiff City",
        "1-0"
      ],
      [
        "1925-26",
        "Bolton Wanderers",
        "Manchester City",
        "1-0"
      ],
      [
        "1926-27",
        "Cardiff City",
        "Arsenal",
        "1-0"
      ],
      [
        "1927-28",
        "Blackburn Rovers",
        "Huddersfield Town",
        "3-1"
      ],
      [
        "1928-29",
        "Bolton Wanderers",
        "Portsmouth",
        "2-0"
      ],
      [
        "1929-30",
        "Arsenal",
        "Huddersfield Town",
        "2-0"
      ],
      [
        "1930-31",
        "West Bromwich Albion",
        "Birmingham",
        "2-1"
      ],
      [
        "1931-32",
        "Newcastle United",
        "Arsenal",
        "2-1"
      ],
      [
        "1932-33",
        "Everton",
        "Manchester City",
        "3-0"
      ],
      [
        "1933-34",
        "Manchester City",
        "Portsmouth",
        "2-1"
      ],
      [
        "1934-35",
        "Sheffield Wednesday",
        "West Bromwich Albion",
        "4-2"
      ],
      [
        "1935-36",
        "Arsenal",
        "Sheffield United",
        "1-0"
      ],
      [
        "1936-37",
        "Sunderland",
        "Preston North End",
        "3-1"
      ],
      [
        "1937-38",
        "Preston North End",
        "Huddersfield Town",
        "1-0 (aet)"
      ],
      [
        "1938-39",
        "Portsmouth",
        "Wolverhampton Wanderers",
        "4-1"
      ],
      [
        "1945-46",
        "Derby County",
        "Charlton Athletic",
        "4-1 (aet)"
      ],
      [
        "1946-47",
        "Charlton Athletic",
        "Burnley",
        "1-0 (aet)"
      ],
      [
        "1947-48",
        "Manchester United",
        "Blackpool",
        "4-2"
      ],
      [
        "1948-49",
        "Wolverhampton Wanderers",
        "Leicester City",
        "3-1"
      ],
      [
        "1949-50",
        "Arsenal",
        "Liverpool",
        "2-0"
      ],
      [
        "1950-51",
        "Newcastle United",
        "Blackpool",
        "2-0"
      ],
      [
        "1951-52",
        "Newcastle United",
        "Arsenal",
        "1-0"
      ],
      [
        "1952-53",
        "Blackpool",
        "Bolton Wanderers",
        "4-3"
      ],
      [
        "1953-54",
        "West Bromwich Albion",
        "Preston North End",
        "3-2"
      ],
      [
        "1954-55",
        "Newcastle United",
        "Manchester City",
        "3-1"
      ],
      [
        "1955-56",
        "Manchester City",
        "Birmingham City",
        "3-1"
      ],
      [
        "1956-57",
        "Aston Villa",
        "Manchester United",
        "2-1"
      ],
      [
        "1957-58",
        "Bolton Wanderers",
        "Manchester United",
        "2-0"
      ],
      [
        "1958-59",
        "Nottingham Forest",
        "Luton Town",
        "2-1"
      ],
      [
        "1959-60",
        "Wolverhampton Wanderers",
        "Blackburn Rovers",
        "3-0"
      ],
      [
        "1960-61",
        "Tottenham Hotspur",
        "Leicester City",
        "2-0"
      ],
      [
        "1961-62",
        "Tottenham Hotspur",
        "Burnley",
        "3-1"
      ],
      [
        "1962-63",
        "Manchester United",
        "Leicester City",
        "3-1"
      ],
      [
        "1963-64",
        "West Ham United",
        "Preston North End",
        "3-2"
      ],
      [
        "1964-65",
        "Liverpool",
        "Leeds United",
        "2-1 (aet)"
      ],
      [
        "1965-66",
        "Everton",
        "Sheffield Wednesday",
        "3-2"
      ],
      [
        "1966-67",
        "Tottenham Hotspur",
        "Chelsea",
        "2-1"
      ],
      [
        "1967-68",
        "West Bromwich Albion",
        "Everton",
        "1-0 (aet)"
      ],
      [
        "1968-69",
        "Manchester City",
        "Leicester City",
        "1-0"
      ],
      [
        "1969-70",
        "Chelsea",
        "Leeds United",
        "2-1 (replay aet; 2-2)"
      ],
      [
        "1970-71",
        "Arsenal",
        "Liverpool",
        "2-1 (aet)"
      ],
      [
        "1971-72",
        "Leeds United",
        "Arsenal",
        "1-0"
      ],
      [
        "1972-73",
        "Sunderland",
        "Leeds United",
        "1-0"
      ],
      [
        "1973-74",
        "Liverpool",
        "Newcastle United",
        "3-0"
      ],
      [
        "1974-75",
        "West Ham United",
        "Fulham",
        "2-0"
      ],
      [
        "1975-76",
        "Southampton",
        "Manchester United",
        "1-0"
      ],
      [
        "1976-77",
        "Manchester United",
        "Liverpool",
        "2-1"
      ],
      [
        "1977-78",
        "Ipswich Town",
        "Arsenal",
        "1-0"
      ],
      [
        "1978-79",
        "Arsenal",
        "Manchester United",
        "3-2"
      ],
      [
        "1979-80",
        "West Ham United",
        "Arsenal",
        "1-0"
      ],
      [
        "1980-81",
        "Tottenham Hotspur",
        "Manchester City",
        "3-2 (replay aet; 1-1)"
      ],
      [
        "1981-82",
        "Tottenham Hotspur",
        "Queens Park Rangers",
        "1-0 (replay; 1-1 aet)"
      ],
      [
        "1982-83",
        "Manchester United",
        "Brighton & Hove Albion",
        "4-0 (replay; 2-2 aet)"
      ],
      [
        "1983-84",
        "Everton",
        "Watford",
        "2-0"
      ],
      [
        "1984-85",
        "Manchester United",
        "Everton",
        "1-0 (aet)"
      ],
      [
        "1985-86",
        "Liverpool",
        "Everton",
        "3-1"
      ],
      [
        "1986-87",
        "Coventry City",
        "Tottenham Hotspur",
        "3-2 (aet)"
      ],
      [
        "1987-88",
        "Wimbledon",
        "Liverpool",
        "1-0"
      ],
      [
        "1988-89",
        "Liverpool",
        "Everton",
        "3-2 (aet)"
      ],
      [
        "1989-90",
        "Manchester United",
        "Crystal Palace",
        "1-0 (replay; 3-3 aet)"
      ],
      [
        "1990-91",
        "Tottenham Hotspur",
        "Nottingham Forest",
        "2-1 (aet)"
      ],
      [
        "1991-92",
        "Liverpool",
        "Sunderland",
        "2-0"
      ],
      [
        "1992-93",
        "Arsenal",
        "Sheffield Wednesday",
        "2-1 (replay aet; 1-1 aet)"
      ],
      [
        "1993-94",
        "Manchester United",
        "Chelsea",
        "4-0"
      ],
      [
        "1994-95",
        "Everton",
        "Manchester United",
        "1-0"
      ],
      [
        "1995-96",
        "Manchester United",
        "Liverpool",
        "1-0"
      ],
      [
        "1996-97",
        "Chelsea",
        "Middlesbrough",
        "2-0"
      ],
      [
        "1997-98",
        "Arsenal",
        "Newcastle United",
        "2-0"
      ],
      [
        "1998-99",
        "Manchester United",
        "Newcastle United",
        "2-0"
      ],
      [
        "1999-2000",
        "Chelsea",
        "Aston Villa",
        "1-0"
      ],
      [
        "2000-01",
        "Liverpool",
        "Arsenal",
        "2-1"
      ],
      [
        "2001-02",
        "Arsenal",
        "Chelsea",
        "2-0"
      ],
      [
        "2002-03",
        "Arsenal",
        "Southampton",
        "1-0"
      ],
      [
        "2003-04",
        "Manchester United",
        "Millwall",
        "3-0"
      ],
      [
        "2004-05",
        "Arsenal",
        "Manchester United",
        "0-0 (Arsenal won 5-4 pens)"
      ],
      [
        "2005-06",
        "Liverpool",
        "West Ham United",
        "3-3 (Liverpool won 3-1 pens, aet)"
      ],
      [
        "2006-07",
        "Chelsea",
        "Manchester United",
        "1-0 (aet)"
      ],
      [
        "2007-08",
        "Portsmouth",
        "Cardiff City",
        "1-0"
      ],
      [
        "2008-09",
        "Chelsea",
        "Everton",
        "2-1"
      ],
      [
        "2009-10",
        "Chelsea",
        "Portsmouth",
        "1-0"
      ],
      [
        "2010-11",
        "Manchester City",
        "Stoke City",
        "1-0"
      ],
      [
        "2011-12",
        "Chelsea",
        "Liverpool",
        "2-1"
      ],
      [
        "2012-13",
        "Wigan Athletic",
        "Manchester City",
        "1-0"
      ],
      [
        "2013-14",
        "Arsenal",
        "Hull City",
        "3-2 (aet)"
      ],
      [
        "2014-15",
        "Arsenal",
        "Aston Villa",
        "4-0"
      ],
      [
        "2015-16",
        "Manchester United",
        "Crystal Palace",
        "2-1 (aet)"
      ],
      [
        "2016-17",
        "Arsenal",
        "Chelsea",
        "2-1"
      ],
      [
        "2017-18",
        "Chelsea",
        "Manchester United",
        "1-0"
      ],
      [
        "2018-19",
        "Manchester City",
        "Watford",
        "6-0"
      ],
      [
        "2019-20",
        "Arsenal",
        "Chelsea",
        "2-1"
      ],
      [
        "2020-21",
        "Leicester City",
        "Chelsea",
        "1-0"
      ],
      [
        "2021-22",
        "Liverpool",
        "Chelsea",
        "0-0 (Liverpool won 6-5 pens, aet)"
      ],
      [
        "2022-23",
        "Manchester City",
        "Manchester United",
        "2-1"
      ],
      [
        "2023-24",
        "Manchester United",
        "Manchester City",
        "2-1"
      ],
      [
        "2024-25",
        "Crystal Palace",
        "Manchester City",
        "1-0"
      ],
      [
        "2025-26",
        "Manchester City",
        "Chelsea",
        "1-0"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most FA Cups?",
        "a": "Arsenal has won the FA Cup a record 14 times, most recently in 2020. Manchester United are second with 13 titles, followed by Tottenham Hotspur and Chelsea. Manchester City reached eight wins with their 2025-26 victory over Chelsea."
      },
      {
        "q": "What is the oldest football competition in the world?",
        "a": "The FA Cup is the oldest national football competition. It was first contested in the 1871-72 season, when Wanderers beat Royal Engineers 1-0 in the final at the Kennington Oval in London."
      },
      {
        "q": "Has a club from outside England ever won the FA Cup?",
        "a": "Yes. Cardiff City, based in Wales, won the FA Cup in 1927, beating Arsenal 1-0. They remain the only club from outside England to lift the trophy. Cardiff also reached the finals of 1925 and 2008 as runners-up."
      },
      {
        "q": "When was the last FA Cup final replay?",
        "a": "The last final decided by a replay was in 1993, when Arsenal beat Sheffield Wednesday 2-1 after extra time in the replay. Finals level after extra time have since been settled by a penalty shoot-out, as in 2005, 2006 and 2022."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the FA Cup"
  },
  {
    "slug": "efl-cup-winners",
    "h1": "Every EFL Cup (League Cup) Winner by Season",
    "title": "EFL Cup Winners: Full List by Season (1961–2026) | Ball IQ",
    "description": "Every EFL Cup / League Cup winner by season from 1960-61 to 2025-26, with runners-up and final scores. The complete Carabao Cup roll of honour.",
    "intro": [
      "The EFL Cup is England's second domestic knockout competition, born in 1960 as a midweek tournament for Football League clubs. Aston Villa lifted the first trophy in 1961, edging Rotherham United over a two-legged final — a format the cup kept until 1966, when it switched to the familiar single showpiece match.",
      "Few competitions have changed their name as often. Sponsorship has rebadged the same trophy as the Milk Cup, Littlewoods Cup, Rumbelows Cup, Coca-Cola Cup, Worthington Cup, Carling Cup, Capital One Cup and, since 2017, the Carabao Cup. Through every rebrand the prize has stayed the same: silverware, a strong run of cup nights, and in most eras a place in European competition for the winner.",
      "Liverpool are the record holders, and Manchester City have dominated the modern era, but the League Cup has always left room for surprises — Swindon Town, Oxford United, Luton Town and Bradford City have all reached finals. The table below lists every champion by season, with the runner-up and final score for each edition through 2025-26."
    ],
    "columns": [
      "Season",
      "Winner",
      "Runner-up",
      "Score"
    ],
    "rows": [
      [
        "1960-61",
        "Aston Villa",
        "Rotherham United",
        "3-2 (agg)"
      ],
      [
        "1961-62",
        "Norwich City",
        "Rochdale",
        "4-0 (agg)"
      ],
      [
        "1962-63",
        "Birmingham City",
        "Aston Villa",
        "3-1 (agg)"
      ],
      [
        "1963-64",
        "Leicester City",
        "Stoke City",
        "4-3 (agg)"
      ],
      [
        "1964-65",
        "Chelsea",
        "Leicester City",
        "3-2 (agg)"
      ],
      [
        "1965-66",
        "West Bromwich Albion",
        "West Ham United",
        "5-3 (agg)"
      ],
      [
        "1966-67",
        "Queens Park Rangers",
        "West Bromwich Albion",
        "3-2"
      ],
      [
        "1967-68",
        "Leeds United",
        "Arsenal",
        "1-0"
      ],
      [
        "1968-69",
        "Swindon Town",
        "Arsenal",
        "3-1 (a.e.t.)"
      ],
      [
        "1969-70",
        "Manchester City",
        "West Bromwich Albion",
        "2-1 (a.e.t.)"
      ],
      [
        "1970-71",
        "Tottenham Hotspur",
        "Aston Villa",
        "2-0"
      ],
      [
        "1971-72",
        "Stoke City",
        "Chelsea",
        "2-1"
      ],
      [
        "1972-73",
        "Tottenham Hotspur",
        "Norwich City",
        "1-0"
      ],
      [
        "1973-74",
        "Wolverhampton Wanderers",
        "Manchester City",
        "2-1"
      ],
      [
        "1974-75",
        "Aston Villa",
        "Norwich City",
        "1-0"
      ],
      [
        "1975-76",
        "Manchester City",
        "Newcastle United",
        "2-1"
      ],
      [
        "1976-77",
        "Aston Villa",
        "Everton",
        "3-2 (2nd replay)"
      ],
      [
        "1977-78",
        "Nottingham Forest",
        "Liverpool",
        "1-0 (replay)"
      ],
      [
        "1978-79",
        "Nottingham Forest",
        "Southampton",
        "3-2"
      ],
      [
        "1979-80",
        "Wolverhampton Wanderers",
        "Nottingham Forest",
        "1-0"
      ],
      [
        "1980-81",
        "Liverpool",
        "West Ham United",
        "2-1 (replay)"
      ],
      [
        "1981-82",
        "Liverpool",
        "Tottenham Hotspur",
        "3-1 (a.e.t.)"
      ],
      [
        "1982-83",
        "Liverpool",
        "Manchester United",
        "2-1 (a.e.t.)"
      ],
      [
        "1983-84",
        "Liverpool",
        "Everton",
        "1-0 (replay)"
      ],
      [
        "1984-85",
        "Norwich City",
        "Sunderland",
        "1-0"
      ],
      [
        "1985-86",
        "Oxford United",
        "Queens Park Rangers",
        "3-0"
      ],
      [
        "1986-87",
        "Arsenal",
        "Liverpool",
        "2-1"
      ],
      [
        "1987-88",
        "Luton Town",
        "Arsenal",
        "3-2"
      ],
      [
        "1988-89",
        "Nottingham Forest",
        "Luton Town",
        "3-1"
      ],
      [
        "1989-90",
        "Nottingham Forest",
        "Oldham Athletic",
        "1-0"
      ],
      [
        "1990-91",
        "Sheffield Wednesday",
        "Manchester United",
        "1-0"
      ],
      [
        "1991-92",
        "Manchester United",
        "Nottingham Forest",
        "1-0"
      ],
      [
        "1992-93",
        "Arsenal",
        "Sheffield Wednesday",
        "2-1"
      ],
      [
        "1993-94",
        "Aston Villa",
        "Manchester United",
        "3-1"
      ],
      [
        "1994-95",
        "Liverpool",
        "Bolton Wanderers",
        "2-1"
      ],
      [
        "1995-96",
        "Aston Villa",
        "Leeds United",
        "3-0"
      ],
      [
        "1996-97",
        "Leicester City",
        "Middlesbrough",
        "1-0 (replay, a.e.t.)"
      ],
      [
        "1997-98",
        "Chelsea",
        "Middlesbrough",
        "2-0 (a.e.t.)"
      ],
      [
        "1998-99",
        "Tottenham Hotspur",
        "Leicester City",
        "1-0"
      ],
      [
        "1999-2000",
        "Leicester City",
        "Tranmere Rovers",
        "2-1"
      ],
      [
        "2000-01",
        "Liverpool",
        "Birmingham City",
        "1-1 (5-4 pens)"
      ],
      [
        "2001-02",
        "Blackburn Rovers",
        "Tottenham Hotspur",
        "2-1"
      ],
      [
        "2002-03",
        "Liverpool",
        "Manchester United",
        "2-0"
      ],
      [
        "2003-04",
        "Middlesbrough",
        "Bolton Wanderers",
        "2-1"
      ],
      [
        "2004-05",
        "Chelsea",
        "Liverpool",
        "3-2 (a.e.t.)"
      ],
      [
        "2005-06",
        "Manchester United",
        "Wigan Athletic",
        "4-0"
      ],
      [
        "2006-07",
        "Chelsea",
        "Arsenal",
        "2-1"
      ],
      [
        "2007-08",
        "Tottenham Hotspur",
        "Chelsea",
        "2-1 (a.e.t.)"
      ],
      [
        "2008-09",
        "Manchester United",
        "Tottenham Hotspur",
        "0-0 (4-1 pens)"
      ],
      [
        "2009-10",
        "Manchester United",
        "Aston Villa",
        "2-1"
      ],
      [
        "2010-11",
        "Birmingham City",
        "Arsenal",
        "2-1"
      ],
      [
        "2011-12",
        "Liverpool",
        "Cardiff City",
        "2-2 (3-2 pens)"
      ],
      [
        "2012-13",
        "Swansea City",
        "Bradford City",
        "5-0"
      ],
      [
        "2013-14",
        "Manchester City",
        "Sunderland",
        "3-1"
      ],
      [
        "2014-15",
        "Chelsea",
        "Tottenham Hotspur",
        "2-0"
      ],
      [
        "2015-16",
        "Manchester City",
        "Liverpool",
        "1-1 (3-1 pens)"
      ],
      [
        "2016-17",
        "Manchester United",
        "Southampton",
        "3-2"
      ],
      [
        "2017-18",
        "Manchester City",
        "Arsenal",
        "3-0"
      ],
      [
        "2018-19",
        "Manchester City",
        "Chelsea",
        "0-0 (4-3 pens)"
      ],
      [
        "2019-20",
        "Manchester City",
        "Aston Villa",
        "2-1"
      ],
      [
        "2020-21",
        "Manchester City",
        "Tottenham Hotspur",
        "1-0"
      ],
      [
        "2021-22",
        "Liverpool",
        "Chelsea",
        "0-0 (11-10 pens)"
      ],
      [
        "2022-23",
        "Manchester United",
        "Newcastle United",
        "2-0"
      ],
      [
        "2023-24",
        "Liverpool",
        "Chelsea",
        "1-0 (a.e.t.)"
      ],
      [
        "2024-25",
        "Newcastle United",
        "Liverpool",
        "2-1"
      ],
      [
        "2025-26",
        "Manchester City",
        "Arsenal",
        "2-0"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most EFL Cups?",
        "a": "Liverpool are the record holders with 10 League Cup titles (1981, 1982, 1983, 1984, 1995, 2001, 2003, 2012, 2022 and 2024). Manchester City are second with nine, including four in a row between 2018 and 2021."
      },
      {
        "q": "Who won the 2025-26 EFL Cup (Carabao Cup)?",
        "a": "Manchester City won the 2025-26 Carabao Cup, beating Arsenal 2-0 in the final at Wembley. It was City's ninth League Cup title and their first since the 2020-21 season."
      },
      {
        "q": "Why does the EFL Cup keep changing its name?",
        "a": "The trophy itself has not changed, but the competition takes the name of its sponsor. Over the years it has been the Milk Cup, Littlewoods Cup, Rumbelows Cup, Coca-Cola Cup, Worthington Cup, Carling Cup, Capital One Cup and, since 2017, the Carabao Cup."
      },
      {
        "q": "What was the first League Cup final?",
        "a": "The first final was played in 1961, when Aston Villa beat Rotherham United 3-2 on aggregate over two legs. The competition used a two-legged final until 1966, when it moved to a single match, later staged at Wembley."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the League Cup"
  },
  {
    "slug": "copa-del-rey-winners",
    "h1": "Copa del Rey Winners (1902–2026)",
    "title": "Copa del Rey Winners: Every Champion by Season (1902–2026) | Ball IQ",
    "description": "The complete list of Copa del Rey winners from 1902 to 2025-26 — every Spanish cup final's champion, runner-up and score in one table.",
    "intro": [
      "The Copa del Rey is Spanish football's oldest national competition, a single-elimination knockout open to clubs from every tier of the Spanish league system. First contested in 1903 — with a 1902 pre-tournament, the Copa de la Coronación, staged to mark the coronation of King Alfonso XIII — it predates La Liga by nearly three decades and has crowned a champion in all but a handful of interrupted years.",
      "Barcelona are the most successful club in the tournament's history, extending their record to 32 titles with a dramatic extra-time win over Real Madrid in 2024-25. Athletic Bilbao sit second on 24, a tally swollen by their dominance of the early decades and topped up by their penalty-shootout triumph in 2023-24, while Real Madrid have lifted the trophy 20 times. The competition's romance, though, comes from the outsiders who have snatched it: Deportivo, Mallorca, Real Betis and Real Sociedad have all had their day.",
      "The table below lists every final in chronological order, from the 1902 precursor through the 2025-26 edition, in which Real Sociedad beat Atlético Madrid on penalties in Seville. Where a final was settled from the spot the score column shows the result after extra time followed by \"(pen.)\"; the 1937 and 1938 editions are omitted as no competition was held during the Spanish Civil War."
    ],
    "columns": [
      "Season",
      "Winner",
      "Runner-up",
      "Score"
    ],
    "rows": [
      [
        "1902",
        "Club Bizcaya",
        "Barcelona",
        "2–1"
      ],
      [
        "1903",
        "Athletic Bilbao",
        "Real Madrid",
        "3–2"
      ],
      [
        "1904",
        "Athletic Bilbao",
        "Español de Madrid",
        "Walkover"
      ],
      [
        "1905",
        "Real Madrid",
        "Athletic Bilbao",
        "1–0"
      ],
      [
        "1906",
        "Real Madrid",
        "Athletic Bilbao",
        "4–1"
      ],
      [
        "1907",
        "Real Madrid",
        "Bizcaya",
        "1–0"
      ],
      [
        "1908",
        "Real Madrid",
        "Real Vigo Sporting",
        "2–1"
      ],
      [
        "1909",
        "Club Ciclista",
        "Español de Madrid",
        "3–1"
      ],
      [
        "1910 (UECF)",
        "Athletic Bilbao",
        "Vasconia",
        "1–0"
      ],
      [
        "1910 (FECF)",
        "Barcelona",
        "Español de Madrid",
        "3–2"
      ],
      [
        "1911",
        "Athletic Bilbao",
        "Español de Madrid",
        "3–1"
      ],
      [
        "1912",
        "Barcelona",
        "Gimnástica",
        "2–0"
      ],
      [
        "1913 (UECF)",
        "Barcelona",
        "Real Sociedad",
        "2–1"
      ],
      [
        "1913 (FECF)",
        "Racing de Irún",
        "Athletic Bilbao",
        "1–0"
      ],
      [
        "1914",
        "Athletic Bilbao",
        "España de Barcelona",
        "2–1"
      ],
      [
        "1915",
        "Athletic Bilbao",
        "Español de Madrid",
        "5–0"
      ],
      [
        "1916",
        "Athletic Bilbao",
        "Real Madrid",
        "4–0"
      ],
      [
        "1917",
        "Real Madrid",
        "Arenas",
        "2–1"
      ],
      [
        "1918",
        "Real Unión",
        "Real Madrid",
        "2–0"
      ],
      [
        "1919",
        "Arenas",
        "Barcelona",
        "5–2"
      ],
      [
        "1920",
        "Barcelona",
        "Athletic Bilbao",
        "2–0"
      ],
      [
        "1921",
        "Athletic Bilbao",
        "Atlético Madrid",
        "4–1"
      ],
      [
        "1922",
        "Barcelona",
        "Real Unión",
        "5–1"
      ],
      [
        "1923",
        "Athletic Bilbao",
        "Europa",
        "1–0"
      ],
      [
        "1924",
        "Real Unión",
        "Real Madrid",
        "1–0"
      ],
      [
        "1925",
        "Barcelona",
        "Arenas",
        "2–0"
      ],
      [
        "1926",
        "Barcelona",
        "Atlético Madrid",
        "3–2"
      ],
      [
        "1927",
        "Real Unión",
        "Arenas",
        "1–0"
      ],
      [
        "1928",
        "Barcelona",
        "Real Sociedad",
        "3–1"
      ],
      [
        "1928-29",
        "Espanyol",
        "Real Madrid",
        "2–1"
      ],
      [
        "1930",
        "Athletic Bilbao",
        "Real Madrid",
        "3–2"
      ],
      [
        "1931",
        "Athletic Bilbao",
        "Real Betis",
        "3–1"
      ],
      [
        "1932",
        "Athletic Bilbao",
        "Barcelona",
        "1–0"
      ],
      [
        "1933",
        "Athletic Bilbao",
        "Real Madrid",
        "2–1"
      ],
      [
        "1934",
        "Real Madrid",
        "Valencia",
        "2–1"
      ],
      [
        "1935",
        "Sevilla",
        "Sabadell",
        "3–0"
      ],
      [
        "1936",
        "Real Madrid",
        "Barcelona",
        "2–1"
      ],
      [
        "1939",
        "Sevilla",
        "Racing de Ferrol",
        "6–2"
      ],
      [
        "1940",
        "Espanyol",
        "Real Madrid",
        "3–2"
      ],
      [
        "1941",
        "Valencia",
        "Espanyol",
        "3–1"
      ],
      [
        "1942",
        "Barcelona",
        "Athletic Bilbao",
        "4–3"
      ],
      [
        "1943",
        "Athletic Bilbao",
        "Real Madrid",
        "1–0"
      ],
      [
        "1944",
        "Athletic Bilbao",
        "Valencia",
        "2–0"
      ],
      [
        "1944-45",
        "Athletic Bilbao",
        "Valencia",
        "3–2"
      ],
      [
        "1946",
        "Real Madrid",
        "Valencia",
        "3–1"
      ],
      [
        "1947",
        "Real Madrid",
        "Espanyol",
        "2–0"
      ],
      [
        "1947-48",
        "Sevilla",
        "Celta Vigo",
        "4–1"
      ],
      [
        "1948-49",
        "Valencia",
        "Athletic Bilbao",
        "1–0"
      ],
      [
        "1949-50",
        "Athletic Bilbao",
        "Valladolid",
        "4–1"
      ],
      [
        "1951",
        "Barcelona",
        "Real Sociedad",
        "3–0"
      ],
      [
        "1952",
        "Barcelona",
        "Valencia",
        "4–2"
      ],
      [
        "1952-53",
        "Barcelona",
        "Athletic Bilbao",
        "2–1"
      ],
      [
        "1954",
        "Valencia",
        "Barcelona",
        "3–0"
      ],
      [
        "1955",
        "Athletic Bilbao",
        "Sevilla",
        "1–0"
      ],
      [
        "1956",
        "Athletic Bilbao",
        "Atlético Madrid",
        "2–1"
      ],
      [
        "1957",
        "Barcelona",
        "Espanyol",
        "1–0"
      ],
      [
        "1958",
        "Athletic Bilbao",
        "Real Madrid",
        "2–0"
      ],
      [
        "1958-59",
        "Barcelona",
        "Granada",
        "4–1"
      ],
      [
        "1959-60",
        "Atlético Madrid",
        "Real Madrid",
        "3–1"
      ],
      [
        "1960-61",
        "Atlético Madrid",
        "Real Madrid",
        "3–2"
      ],
      [
        "1961-62",
        "Real Madrid",
        "Sevilla",
        "2–1"
      ],
      [
        "1962-63",
        "Barcelona",
        "Zaragoza",
        "3–1"
      ],
      [
        "1963-64",
        "Zaragoza",
        "Atlético Madrid",
        "2–1"
      ],
      [
        "1964-65",
        "Atlético Madrid",
        "Zaragoza",
        "1–0"
      ],
      [
        "1965-66",
        "Zaragoza",
        "Athletic Bilbao",
        "2–0"
      ],
      [
        "1966-67",
        "Valencia",
        "Athletic Bilbao",
        "2–1"
      ],
      [
        "1967-68",
        "Barcelona",
        "Real Madrid",
        "1–0"
      ],
      [
        "1969",
        "Athletic Bilbao",
        "Elche",
        "1–0"
      ],
      [
        "1969-70",
        "Real Madrid",
        "Valencia",
        "3–1"
      ],
      [
        "1970-71",
        "Barcelona",
        "Valencia",
        "4–3"
      ],
      [
        "1971-72",
        "Atlético Madrid",
        "Valencia",
        "2–1"
      ],
      [
        "1972-73",
        "Athletic Bilbao",
        "Castellón",
        "2–0"
      ],
      [
        "1973-74",
        "Real Madrid",
        "Barcelona",
        "4–0"
      ],
      [
        "1974-75",
        "Real Madrid",
        "Atlético Madrid",
        "0–0 (pen.)"
      ],
      [
        "1975-76",
        "Atlético Madrid",
        "Zaragoza",
        "1–0"
      ],
      [
        "1976-77",
        "Real Betis",
        "Athletic Bilbao",
        "2–2 (pen.)"
      ],
      [
        "1977-78",
        "Barcelona",
        "Las Palmas",
        "3–1"
      ],
      [
        "1978-79",
        "Valencia",
        "Real Madrid",
        "2–0"
      ],
      [
        "1979-80",
        "Real Madrid",
        "Castilla",
        "6–1"
      ],
      [
        "1980-81",
        "Barcelona",
        "Sporting Gijón",
        "3–1"
      ],
      [
        "1981-82",
        "Real Madrid",
        "Sporting Gijón",
        "2–1"
      ],
      [
        "1982-83",
        "Barcelona",
        "Real Madrid",
        "2–1"
      ],
      [
        "1983-84",
        "Athletic Bilbao",
        "Barcelona",
        "1–0"
      ],
      [
        "1984-85",
        "Atlético Madrid",
        "Athletic Bilbao",
        "2–1"
      ],
      [
        "1985-86",
        "Zaragoza",
        "Barcelona",
        "1–0"
      ],
      [
        "1986-87",
        "Real Sociedad",
        "Atlético Madrid",
        "2–2 (pen.)"
      ],
      [
        "1987-88",
        "Barcelona",
        "Real Sociedad",
        "1–0"
      ],
      [
        "1988-89",
        "Real Madrid",
        "Valladolid",
        "1–0"
      ],
      [
        "1989-90",
        "Barcelona",
        "Real Madrid",
        "2–0"
      ],
      [
        "1990-91",
        "Atlético Madrid",
        "Mallorca",
        "1–0"
      ],
      [
        "1991-92",
        "Atlético Madrid",
        "Real Madrid",
        "2–0"
      ],
      [
        "1992-93",
        "Real Madrid",
        "Zaragoza",
        "2–0"
      ],
      [
        "1993-94",
        "Zaragoza",
        "Celta Vigo",
        "0–0 (pen.)"
      ],
      [
        "1994-95",
        "Deportivo La Coruña",
        "Valencia",
        "2–1"
      ],
      [
        "1995-96",
        "Atlético Madrid",
        "Barcelona",
        "1–0"
      ],
      [
        "1996-97",
        "Barcelona",
        "Real Betis",
        "3–2"
      ],
      [
        "1997-98",
        "Barcelona",
        "Mallorca",
        "1–1 (pen.)"
      ],
      [
        "1998-99",
        "Valencia",
        "Atlético Madrid",
        "3–0"
      ],
      [
        "1999-2000",
        "Espanyol",
        "Atlético Madrid",
        "2–1"
      ],
      [
        "2000-01",
        "Zaragoza",
        "Celta Vigo",
        "3–1"
      ],
      [
        "2001-02",
        "Deportivo La Coruña",
        "Real Madrid",
        "2–1"
      ],
      [
        "2002-03",
        "Mallorca",
        "Recreativo",
        "3–0"
      ],
      [
        "2003-04",
        "Zaragoza",
        "Real Madrid",
        "3–2"
      ],
      [
        "2004-05",
        "Real Betis",
        "Osasuna",
        "2–1"
      ],
      [
        "2005-06",
        "Espanyol",
        "Zaragoza",
        "4–1"
      ],
      [
        "2006-07",
        "Sevilla",
        "Getafe",
        "1–0"
      ],
      [
        "2007-08",
        "Valencia",
        "Getafe",
        "3–1"
      ],
      [
        "2008-09",
        "Barcelona",
        "Athletic Bilbao",
        "4–1"
      ],
      [
        "2009-10",
        "Sevilla",
        "Atlético Madrid",
        "2–0"
      ],
      [
        "2010-11",
        "Real Madrid",
        "Barcelona",
        "1–0"
      ],
      [
        "2011-12",
        "Barcelona",
        "Athletic Bilbao",
        "3–0"
      ],
      [
        "2012-13",
        "Atlético Madrid",
        "Real Madrid",
        "2–1"
      ],
      [
        "2013-14",
        "Real Madrid",
        "Barcelona",
        "2–1"
      ],
      [
        "2014-15",
        "Barcelona",
        "Athletic Bilbao",
        "3–1"
      ],
      [
        "2015-16",
        "Barcelona",
        "Sevilla",
        "2–0"
      ],
      [
        "2016-17",
        "Barcelona",
        "Alavés",
        "3–1"
      ],
      [
        "2017-18",
        "Barcelona",
        "Sevilla",
        "5–0"
      ],
      [
        "2018-19",
        "Valencia",
        "Barcelona",
        "2–1"
      ],
      [
        "2019-20",
        "Real Sociedad",
        "Athletic Bilbao",
        "1–0"
      ],
      [
        "2020-21",
        "Barcelona",
        "Athletic Bilbao",
        "4–0"
      ],
      [
        "2021-22",
        "Real Betis",
        "Valencia",
        "1–1 (pen.)"
      ],
      [
        "2022-23",
        "Real Madrid",
        "Osasuna",
        "2–1"
      ],
      [
        "2023-24",
        "Athletic Bilbao",
        "Mallorca",
        "1–1 (pen.)"
      ],
      [
        "2024-25",
        "Barcelona",
        "Real Madrid",
        "3–2 (a.e.t.)"
      ],
      [
        "2025-26",
        "Real Sociedad",
        "Atlético Madrid",
        "2–2 (pen.)"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Copa del Rey titles?",
        "a": "Barcelona are the record holders with 32 Copa del Rey titles, most recently beating Real Madrid 3–2 after extra time in the 2024-25 final. Athletic Bilbao are second with 24 and Real Madrid third with 20."
      },
      {
        "q": "How many Copa del Rey titles has Athletic Bilbao won?",
        "a": "Athletic Bilbao have won the Copa del Rey 24 times, the second-highest total behind Barcelona. Their most recent triumph came in 2023-24, when they beat Mallorca on penalties in Seville to end a 40-year wait for a major trophy."
      },
      {
        "q": "Who won the 2025-26 Copa del Rey?",
        "a": "Real Sociedad won the 2025-26 Copa del Rey, defeating Atlético Madrid 4–3 on penalties after a 2–2 draw in the final at Estadio de La Cartuja in Seville on 18 April 2026. It was the Basque club's fourth cup title."
      },
      {
        "q": "When was the first Copa del Rey held?",
        "a": "The first officially recognised Copa del Rey was contested in 1903 and won by Athletic Bilbao. A precursor tournament, the 1902 Copa de la Coronación, was staged a year earlier and won by Club Bizcaya, but it is not counted in the official honours."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Copa del Rey"
  },
  {
    "slug": "coppa-italia-winners",
    "h1": "Coppa Italia Winners: Every Final From 1922 to 2025-26",
    "title": "Coppa Italia Winners: Every Final 1922–2026 | Ball IQ",
    "description": "The complete list of Coppa Italia winners from 1922 to 2025-26, with every final's runner-up and score. Juventus lead with 15 titles; Inter won the latest.",
    "intro": [
      "The Coppa Italia is Italian football's premier knockout cup, first contested in 1922 and run almost every season since 1935. Over that span it has crowned clubs from every corner of the peninsula, from tiny Ligurian side Vado, who won the very first edition, to the Serie A giants who dominate the modern honours list.",
      "Juventus stand alone at the top with 15 triumphs, followed by Inter Milan and Roma. But the cup has always kept room for surprises: Napoli lifted it in 1962 while still a Serie B side, Vicenza stunned the country in 1997, and in 2025 Bologna ended a 51-year wait for a major trophy. The competition's format has shifted over the decades too — from a single final, to two-legged home-and-away deciders, to a final round-robin group in the late 1960s, before settling back into today's one-off showpiece.",
      "Below is the full chronological roll of winners, runners-up and scores. Every recent final has been cross-checked, including Juventus' 2023-24 win, Bologna's 2024-25 breakthrough, and Inter Milan's 2025-26 victory that sealed a domestic double."
    ],
    "columns": [
      "Season",
      "Winner",
      "Runner-up",
      "Score"
    ],
    "rows": [
      [
        "1922",
        "Vado",
        "Udinese",
        "1–0 (a.e.t.)"
      ],
      [
        "1935–36",
        "Torino",
        "Alessandria",
        "5–1"
      ],
      [
        "1936–37",
        "Genoa",
        "Roma",
        "1–0"
      ],
      [
        "1937–38",
        "Juventus",
        "Torino",
        "5–2 (agg.)"
      ],
      [
        "1938–39",
        "Inter Milan",
        "Novara",
        "2–1"
      ],
      [
        "1939–40",
        "Fiorentina",
        "Genoa",
        "1–0"
      ],
      [
        "1940–41",
        "Venezia",
        "Roma",
        "4–3 (agg.)"
      ],
      [
        "1941–42",
        "Juventus",
        "AC Milan",
        "5–2 (agg.)"
      ],
      [
        "1942–43",
        "Torino",
        "Venezia",
        "4–0"
      ],
      [
        "1958",
        "Lazio",
        "Fiorentina",
        "1–0"
      ],
      [
        "1958–59",
        "Juventus",
        "Inter Milan",
        "4–1"
      ],
      [
        "1959–60",
        "Juventus",
        "Fiorentina",
        "3–2 (a.e.t.)"
      ],
      [
        "1960–61",
        "Fiorentina",
        "Lazio",
        "2–0"
      ],
      [
        "1961–62",
        "Napoli",
        "SPAL",
        "2–1"
      ],
      [
        "1962–63",
        "Atalanta",
        "Torino",
        "3–1"
      ],
      [
        "1963–64",
        "Roma",
        "Torino",
        "1–0 (replay)"
      ],
      [
        "1964–65",
        "Juventus",
        "Inter Milan",
        "1–0"
      ],
      [
        "1965–66",
        "Fiorentina",
        "Catanzaro",
        "2–1 (a.e.t.)"
      ],
      [
        "1966–67",
        "AC Milan",
        "Padova",
        "1–0"
      ],
      [
        "1967–68",
        "Torino",
        "AC Milan",
        "Final round-robin group"
      ],
      [
        "1968–69",
        "Roma",
        "Cagliari",
        "Final round-robin group"
      ],
      [
        "1969–70",
        "Bologna",
        "Torino",
        "Final round-robin group"
      ],
      [
        "1970–71",
        "Torino",
        "AC Milan",
        "Final round-robin group"
      ],
      [
        "1971–72",
        "AC Milan",
        "Napoli",
        "2–0"
      ],
      [
        "1972–73",
        "AC Milan",
        "Juventus",
        "1–1 (pens)"
      ],
      [
        "1973–74",
        "Bologna",
        "Palermo",
        "1–1 (pens)"
      ],
      [
        "1974–75",
        "Fiorentina",
        "AC Milan",
        "3–2"
      ],
      [
        "1975–76",
        "Napoli",
        "Hellas Verona",
        "4–0"
      ],
      [
        "1976–77",
        "AC Milan",
        "Inter Milan",
        "2–0"
      ],
      [
        "1977–78",
        "Inter Milan",
        "Napoli",
        "2–1"
      ],
      [
        "1978–79",
        "Juventus",
        "Palermo",
        "2–1"
      ],
      [
        "1979–80",
        "Roma",
        "Torino",
        "0–0 (pens)"
      ],
      [
        "1980–81",
        "Roma",
        "Torino",
        "2–2 (agg., 4–2 pens)"
      ],
      [
        "1981–82",
        "Inter Milan",
        "Torino",
        "2–1 (agg.)"
      ],
      [
        "1982–83",
        "Juventus",
        "Hellas Verona",
        "3–2 (agg.)"
      ],
      [
        "1983–84",
        "Roma",
        "Hellas Verona",
        "2–1 (agg.)"
      ],
      [
        "1984–85",
        "Sampdoria",
        "AC Milan",
        "3–1 (agg.)"
      ],
      [
        "1985–86",
        "Roma",
        "Sampdoria",
        "3–2 (agg.)"
      ],
      [
        "1986–87",
        "Napoli",
        "Atalanta",
        "4–0 (agg.)"
      ],
      [
        "1987–88",
        "Sampdoria",
        "Torino",
        "3–2 (agg.)"
      ],
      [
        "1988–89",
        "Sampdoria",
        "Napoli",
        "4–1 (agg.)"
      ],
      [
        "1989–90",
        "Juventus",
        "AC Milan",
        "1–0 (agg.)"
      ],
      [
        "1990–91",
        "Roma",
        "Sampdoria",
        "4–2 (agg.)"
      ],
      [
        "1991–92",
        "Parma",
        "Juventus",
        "2–1 (agg.)"
      ],
      [
        "1992–93",
        "Torino",
        "Roma",
        "5–5 (agg., away goals)"
      ],
      [
        "1993–94",
        "Sampdoria",
        "Ancona",
        "6–1 (agg.)"
      ],
      [
        "1994–95",
        "Juventus",
        "Parma",
        "3–0 (agg.)"
      ],
      [
        "1995–96",
        "Fiorentina",
        "Atalanta",
        "3–0 (agg.)"
      ],
      [
        "1996–97",
        "Vicenza",
        "Napoli",
        "3–1 (agg.)"
      ],
      [
        "1997–98",
        "Lazio",
        "AC Milan",
        "3–2 (agg.)"
      ],
      [
        "1998–99",
        "Parma",
        "Fiorentina",
        "3–3 (agg., away goals)"
      ],
      [
        "1999–2000",
        "Lazio",
        "Inter Milan",
        "2–1 (agg.)"
      ],
      [
        "2000–01",
        "Fiorentina",
        "Parma",
        "2–1 (agg.)"
      ],
      [
        "2001–02",
        "Parma",
        "Juventus",
        "2–2 (agg., away goals)"
      ],
      [
        "2002–03",
        "AC Milan",
        "Roma",
        "6–3 (agg.)"
      ],
      [
        "2003–04",
        "Lazio",
        "Juventus",
        "4–2 (agg.)"
      ],
      [
        "2004–05",
        "Inter Milan",
        "Roma",
        "3–0 (agg.)"
      ],
      [
        "2005–06",
        "Inter Milan",
        "Roma",
        "4–2 (agg.)"
      ],
      [
        "2006–07",
        "Roma",
        "Inter Milan",
        "7–4 (agg.)"
      ],
      [
        "2007–08",
        "Roma",
        "Inter Milan",
        "2–1"
      ],
      [
        "2008–09",
        "Lazio",
        "Sampdoria",
        "1–1 (pens)"
      ],
      [
        "2009–10",
        "Inter Milan",
        "Roma",
        "1–0"
      ],
      [
        "2010–11",
        "Inter Milan",
        "Palermo",
        "3–1"
      ],
      [
        "2011–12",
        "Napoli",
        "Juventus",
        "2–0"
      ],
      [
        "2012–13",
        "Lazio",
        "Roma",
        "1–0"
      ],
      [
        "2013–14",
        "Napoli",
        "Fiorentina",
        "3–1"
      ],
      [
        "2014–15",
        "Juventus",
        "Lazio",
        "2–1 (a.e.t.)"
      ],
      [
        "2015–16",
        "Juventus",
        "AC Milan",
        "1–0 (a.e.t.)"
      ],
      [
        "2016–17",
        "Juventus",
        "Lazio",
        "2–0"
      ],
      [
        "2017–18",
        "Juventus",
        "AC Milan",
        "4–0"
      ],
      [
        "2018–19",
        "Lazio",
        "Atalanta",
        "2–0"
      ],
      [
        "2019–20",
        "Napoli",
        "Juventus",
        "0–0 (pens)"
      ],
      [
        "2020–21",
        "Juventus",
        "Atalanta",
        "2–1"
      ],
      [
        "2021–22",
        "Inter Milan",
        "Juventus",
        "4–2 (a.e.t.)"
      ],
      [
        "2022–23",
        "Inter Milan",
        "Fiorentina",
        "2–1"
      ],
      [
        "2023–24",
        "Juventus",
        "Atalanta",
        "1–0"
      ],
      [
        "2024–25",
        "Bologna",
        "AC Milan",
        "1–0"
      ],
      [
        "2025–26",
        "Inter Milan",
        "Lazio",
        "2–0"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Coppa Italia titles?",
        "a": "Juventus have won the Coppa Italia a record 15 times, most recently in 2023-24. Inter Milan are next with 10, ahead of Roma on 9 and Lazio on 7."
      },
      {
        "q": "Who won the 2025-26 Coppa Italia?",
        "a": "Inter Milan won the 2025-26 Coppa Italia, beating Lazio 2–0 in the final on 13 May 2026 to complete a domestic double alongside their Serie A title."
      },
      {
        "q": "Who won the 2024-25 Coppa Italia?",
        "a": "Bologna won the 2024-25 Coppa Italia, defeating AC Milan 1–0 through a Dan Ndoye goal. It was their first major trophy since the 1973-74 edition, a 51-year wait."
      },
      {
        "q": "When was the first Coppa Italia and who won it?",
        "a": "The first Coppa Italia was held in 1922 and won by Vado, a small club from Liguria, who beat Udinese 1–0 after extra time. The competition then paused before becoming a regular fixture from 1935-36."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Coppa Italia"
  },
  {
    "slug": "dfb-pokal-winners",
    "h1": "DFB-Pokal Winners: Every German Cup Champion by Season (1935–2026)",
    "title": "DFB-Pokal Winners: Every German Cup Champion by Season | Ball IQ",
    "description": "Complete list of DFB-Pokal (German Cup) winners by season from 1935 to 2025-26, with runners-up and final scores. Bayern Munich lead with 21 titles.",
    "intro": [
      "The DFB-Pokal is Germany's premier knockout cup competition, and one of the toughest in Europe to win because every round is a single tie played at the lower-ranked club's ground. It began in 1935 as the Tschammerpokal, named after Reich sports leader Hans von Tschammer und Osten, ran until 1943, and was then dormant through the war years before returning under the German Football Association as the DFB-Pokal for the 1952-53 season. Since 1985 the final has been staged as a permanent showpiece at Berlin's Olympiastadion.",
      "Bayern Munich are the record holders, sealing their 21st title in 2026 with a 3-0 win over VfB Stuttgart powered by a Harry Kane hat-trick. Behind them, Werder Bremen and a cluster of clubs including Borussia Dortmund, Schalke 04 and Eintracht Frankfurt make up the next tier. The cup has also been a stage for shocks and underdog runs, from Bayer Uerdingen's 1985 upset of Bayern to lower-division finalists like Kaiserslautern reaching the 2024 final.",
      "The table below lists every winner by season, the beaten finalist, and the final score, including finals settled by a replay or penalty shootout. Where a competition year is missing, the tournament was not contested."
    ],
    "columns": [
      "Season",
      "Winner",
      "Runner-up",
      "Score"
    ],
    "rows": [
      [
        "1935",
        "1. FC Nürnberg",
        "Schalke 04",
        "2–0"
      ],
      [
        "1936",
        "VfB Leipzig",
        "Schalke 04",
        "2–1"
      ],
      [
        "1937",
        "Schalke 04",
        "Fortuna Düsseldorf",
        "2–1"
      ],
      [
        "1938",
        "Rapid Wien",
        "FSV Frankfurt",
        "3–1"
      ],
      [
        "1939",
        "1. FC Nürnberg",
        "Waldhof Mannheim",
        "2–0"
      ],
      [
        "1940",
        "Dresdner SC",
        "1. FC Nürnberg",
        "2–1 (a.e.t.)"
      ],
      [
        "1941",
        "Dresdner SC",
        "Schalke 04",
        "2–1"
      ],
      [
        "1942",
        "1860 Munich",
        "Schalke 04",
        "2–0"
      ],
      [
        "1943",
        "First Vienna",
        "LSV Hamburg",
        "3–2 (a.e.t.)"
      ],
      [
        "1952–53",
        "Rot-Weiss Essen",
        "Alemannia Aachen",
        "2–1"
      ],
      [
        "1953–54",
        "VfB Stuttgart",
        "1. FC Köln",
        "1–0 (a.e.t.)"
      ],
      [
        "1954–55",
        "Karlsruher SC",
        "Schalke 04",
        "3–2"
      ],
      [
        "1955–56",
        "Karlsruher SC",
        "Hamburger SV",
        "3–1"
      ],
      [
        "1956–57",
        "Bayern Munich",
        "Fortuna Düsseldorf",
        "1–0"
      ],
      [
        "1957–58",
        "VfB Stuttgart",
        "Fortuna Düsseldorf",
        "4–3 (a.e.t.)"
      ],
      [
        "1958–59",
        "Schwarz-Weiß Essen",
        "Borussia Neunkirchen",
        "5–2"
      ],
      [
        "1959–60",
        "Borussia Mönchengladbach",
        "Karlsruher SC",
        "3–2"
      ],
      [
        "1960–61",
        "Werder Bremen",
        "1. FC Kaiserslautern",
        "2–0"
      ],
      [
        "1961–62",
        "1. FC Nürnberg",
        "Fortuna Düsseldorf",
        "2–1 (a.e.t.)"
      ],
      [
        "1962–63",
        "Hamburger SV",
        "Borussia Dortmund",
        "3–0"
      ],
      [
        "1963–64",
        "1860 Munich",
        "Eintracht Frankfurt",
        "2–0"
      ],
      [
        "1964–65",
        "Borussia Dortmund",
        "Alemannia Aachen",
        "2–0"
      ],
      [
        "1965–66",
        "Bayern Munich",
        "Meidericher SV",
        "4–2"
      ],
      [
        "1966–67",
        "Bayern Munich",
        "Hamburger SV",
        "4–0"
      ],
      [
        "1967–68",
        "1. FC Köln",
        "VfL Bochum",
        "4–1"
      ],
      [
        "1968–69",
        "Bayern Munich",
        "Schalke 04",
        "2–1"
      ],
      [
        "1969–70",
        "Kickers Offenbach",
        "1. FC Köln",
        "2–1"
      ],
      [
        "1970–71",
        "Bayern Munich",
        "1. FC Köln",
        "2–1 (a.e.t.)"
      ],
      [
        "1971–72",
        "Schalke 04",
        "1. FC Kaiserslautern",
        "5–0"
      ],
      [
        "1972–73",
        "Borussia Mönchengladbach",
        "1. FC Köln",
        "2–1 (a.e.t.)"
      ],
      [
        "1973–74",
        "Eintracht Frankfurt",
        "Hamburger SV",
        "3–1 (a.e.t.)"
      ],
      [
        "1974–75",
        "Eintracht Frankfurt",
        "MSV Duisburg",
        "1–0"
      ],
      [
        "1975–76",
        "Hamburger SV",
        "1. FC Kaiserslautern",
        "2–0"
      ],
      [
        "1976–77",
        "1. FC Köln",
        "Hertha BSC",
        "1–1 (a.e.t.), 1–0 (replay)"
      ],
      [
        "1977–78",
        "1. FC Köln",
        "Fortuna Düsseldorf",
        "2–0"
      ],
      [
        "1978–79",
        "Fortuna Düsseldorf",
        "Hertha BSC",
        "1–0 (a.e.t.)"
      ],
      [
        "1979–80",
        "Fortuna Düsseldorf",
        "1. FC Köln",
        "2–1"
      ],
      [
        "1980–81",
        "Eintracht Frankfurt",
        "1. FC Kaiserslautern",
        "3–1"
      ],
      [
        "1981–82",
        "Bayern Munich",
        "1. FC Nürnberg",
        "4–2"
      ],
      [
        "1982–83",
        "1. FC Köln",
        "Fortuna Köln",
        "1–0"
      ],
      [
        "1983–84",
        "Bayern Munich",
        "Borussia Mönchengladbach",
        "1–1 (7–6 pen.)"
      ],
      [
        "1984–85",
        "Bayer Uerdingen",
        "Bayern Munich",
        "2–1"
      ],
      [
        "1985–86",
        "Bayern Munich",
        "VfB Stuttgart",
        "5–2"
      ],
      [
        "1986–87",
        "Hamburger SV",
        "Stuttgarter Kickers",
        "3–1"
      ],
      [
        "1987–88",
        "Eintracht Frankfurt",
        "VfL Bochum",
        "1–0"
      ],
      [
        "1988–89",
        "Borussia Dortmund",
        "Werder Bremen",
        "4–1"
      ],
      [
        "1989–90",
        "1. FC Kaiserslautern",
        "Werder Bremen",
        "3–2"
      ],
      [
        "1990–91",
        "Werder Bremen",
        "1. FC Köln",
        "1–1 (4–3 pen.)"
      ],
      [
        "1991–92",
        "Hannover 96",
        "Borussia Mönchengladbach",
        "0–0 (4–3 pen.)"
      ],
      [
        "1992–93",
        "Bayer Leverkusen",
        "Hertha BSC Amateure",
        "1–0"
      ],
      [
        "1993–94",
        "Werder Bremen",
        "Rot-Weiss Essen",
        "3–1"
      ],
      [
        "1994–95",
        "Borussia Mönchengladbach",
        "VfL Wolfsburg",
        "3–0"
      ],
      [
        "1995–96",
        "1. FC Kaiserslautern",
        "Karlsruher SC",
        "1–0"
      ],
      [
        "1996–97",
        "VfB Stuttgart",
        "Energie Cottbus",
        "2–0"
      ],
      [
        "1997–98",
        "Bayern Munich",
        "MSV Duisburg",
        "2–1"
      ],
      [
        "1998–99",
        "Werder Bremen",
        "Bayern Munich",
        "1–1 (5–4 pen.)"
      ],
      [
        "1999–2000",
        "Bayern Munich",
        "Werder Bremen",
        "3–0"
      ],
      [
        "2000–01",
        "Schalke 04",
        "Union Berlin",
        "2–0"
      ],
      [
        "2001–02",
        "Schalke 04",
        "Bayer Leverkusen",
        "4–2"
      ],
      [
        "2002–03",
        "Bayern Munich",
        "1. FC Kaiserslautern",
        "3–1"
      ],
      [
        "2003–04",
        "Werder Bremen",
        "Alemannia Aachen",
        "3–2"
      ],
      [
        "2004–05",
        "Bayern Munich",
        "Schalke 04",
        "2–1"
      ],
      [
        "2005–06",
        "Bayern Munich",
        "Eintracht Frankfurt",
        "1–0"
      ],
      [
        "2006–07",
        "1. FC Nürnberg",
        "VfB Stuttgart",
        "3–2 (a.e.t.)"
      ],
      [
        "2007–08",
        "Bayern Munich",
        "Borussia Dortmund",
        "2–1 (a.e.t.)"
      ],
      [
        "2008–09",
        "Werder Bremen",
        "Bayer Leverkusen",
        "1–0"
      ],
      [
        "2009–10",
        "Bayern Munich",
        "Werder Bremen",
        "4–0"
      ],
      [
        "2010–11",
        "Schalke 04",
        "MSV Duisburg",
        "5–0"
      ],
      [
        "2011–12",
        "Borussia Dortmund",
        "Bayern Munich",
        "5–2"
      ],
      [
        "2012–13",
        "Bayern Munich",
        "VfB Stuttgart",
        "3–2"
      ],
      [
        "2013–14",
        "Bayern Munich",
        "Borussia Dortmund",
        "2–0 (a.e.t.)"
      ],
      [
        "2014–15",
        "VfL Wolfsburg",
        "Borussia Dortmund",
        "3–1"
      ],
      [
        "2015–16",
        "Bayern Munich",
        "Borussia Dortmund",
        "0–0 (4–3 pen.)"
      ],
      [
        "2016–17",
        "Borussia Dortmund",
        "Eintracht Frankfurt",
        "2–1"
      ],
      [
        "2017–18",
        "Eintracht Frankfurt",
        "Bayern Munich",
        "3–1"
      ],
      [
        "2018–19",
        "Bayern Munich",
        "RB Leipzig",
        "3–0"
      ],
      [
        "2019–20",
        "Bayern Munich",
        "Bayer Leverkusen",
        "4–2"
      ],
      [
        "2020–21",
        "Borussia Dortmund",
        "RB Leipzig",
        "4–1"
      ],
      [
        "2021–22",
        "RB Leipzig",
        "SC Freiburg",
        "1–1 (4–2 pen.)"
      ],
      [
        "2022–23",
        "RB Leipzig",
        "Eintracht Frankfurt",
        "2–0"
      ],
      [
        "2023–24",
        "Bayer Leverkusen",
        "1. FC Kaiserslautern",
        "1–0"
      ],
      [
        "2024–25",
        "VfB Stuttgart",
        "Arminia Bielefeld",
        "4–2"
      ],
      [
        "2025–26",
        "Bayern Munich",
        "VfB Stuttgart",
        "3–0"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most DFB-Pokal titles?",
        "a": "Bayern Munich are the record winners with 21 DFB-Pokal titles, the most recent coming in 2026 with a 3-0 win over VfB Stuttgart. No other club is close: Werder Bremen and Borussia Dortmund are the next most successful."
      },
      {
        "q": "When did the DFB-Pokal start?",
        "a": "The competition began in 1935 as the Tschammerpokal, won by 1. FC Nürnberg. It was suspended after 1943 during and after World War II, then relaunched by the German Football Association as the DFB-Pokal for the 1952-53 season."
      },
      {
        "q": "Who won the DFB-Pokal in 2026?",
        "a": "Bayern Munich won the 2025-26 DFB-Pokal, beating VfB Stuttgart 3-0 in the final at Berlin's Olympiastadion on 23 May 2026, with Harry Kane scoring a hat-trick. It was Bayern's record 21st title."
      },
      {
        "q": "Where is the DFB-Pokal final played?",
        "a": "Since 1985 the DFB-Pokal final has been held every year at the Olympiastadion in Berlin, giving the competition a fixed showpiece venue regardless of which clubs reach the final."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the DFB-Pokal"
  },
  {
    "slug": "copa-libertadores-winners",
    "h1": "Copa Libertadores Winners: Every Champion by Year (1960–2025)",
    "title": "Copa Libertadores Winners by Year (1960–2025) | Ball IQ",
    "description": "The complete list of Copa Libertadores winners from 1960 to 2025, with runner-up and country for every final. Independiente lead with seven titles.",
    "intro": [
      "The Copa Libertadores is South America's premier club competition, the continental equivalent of Europe's Champions League. Contested since 1960 and named after the liberators who freed Latin America from colonial rule, it pits the best sides from CONMEBOL's ten member nations against each other every year, with the champion earning a place at the FIFA Club World Cup.",
      "For its first four decades the trophy was an Argentine and Uruguayan preserve. Independiente of Avellaneda turned dominance into an art form, winning seven titles including four in a row from 1972 to 1975, a run that has never been matched. Boca Juniors, Peñarol, Estudiantes and Nacional built the tournament's early mythology, and the fierce two-legged finals became notorious for their intensity.",
      "The balance of power has shifted decisively toward Brazil in the modern era. Since 2019 every final has been won by a Brazilian club, and in 2025 Flamengo beat Palmeiras in Lima to claim a fourth crown. The table below lists every champion, runner-up and winning nation across the full history of the competition."
    ],
    "columns": [
      "Year",
      "Winner",
      "Runner-up",
      "Country"
    ],
    "rows": [
      [
        "1960",
        "Peñarol",
        "Olimpia",
        "Uruguay"
      ],
      [
        "1961",
        "Peñarol",
        "Palmeiras",
        "Uruguay"
      ],
      [
        "1962",
        "Santos",
        "Peñarol",
        "Brazil"
      ],
      [
        "1963",
        "Santos",
        "Boca Juniors",
        "Brazil"
      ],
      [
        "1964",
        "Independiente",
        "Nacional",
        "Argentina"
      ],
      [
        "1965",
        "Independiente",
        "Peñarol",
        "Argentina"
      ],
      [
        "1966",
        "Peñarol",
        "River Plate",
        "Uruguay"
      ],
      [
        "1967",
        "Racing",
        "Nacional",
        "Argentina"
      ],
      [
        "1968",
        "Estudiantes",
        "Palmeiras",
        "Argentina"
      ],
      [
        "1969",
        "Estudiantes",
        "Nacional",
        "Argentina"
      ],
      [
        "1970",
        "Estudiantes",
        "Peñarol",
        "Argentina"
      ],
      [
        "1971",
        "Nacional",
        "Estudiantes",
        "Uruguay"
      ],
      [
        "1972",
        "Independiente",
        "Universitario",
        "Argentina"
      ],
      [
        "1973",
        "Independiente",
        "Colo-Colo",
        "Argentina"
      ],
      [
        "1974",
        "Independiente",
        "São Paulo",
        "Argentina"
      ],
      [
        "1975",
        "Independiente",
        "Unión Española",
        "Argentina"
      ],
      [
        "1976",
        "Cruzeiro",
        "River Plate",
        "Brazil"
      ],
      [
        "1977",
        "Boca Juniors",
        "Cruzeiro",
        "Argentina"
      ],
      [
        "1978",
        "Boca Juniors",
        "Deportivo Cali",
        "Argentina"
      ],
      [
        "1979",
        "Olimpia",
        "Boca Juniors",
        "Paraguay"
      ],
      [
        "1980",
        "Nacional",
        "Internacional",
        "Uruguay"
      ],
      [
        "1981",
        "Flamengo",
        "Cobreloa",
        "Brazil"
      ],
      [
        "1982",
        "Peñarol",
        "Cobreloa",
        "Uruguay"
      ],
      [
        "1983",
        "Grêmio",
        "Peñarol",
        "Brazil"
      ],
      [
        "1984",
        "Independiente",
        "Grêmio",
        "Argentina"
      ],
      [
        "1985",
        "Argentinos Juniors",
        "América de Cali",
        "Argentina"
      ],
      [
        "1986",
        "River Plate",
        "América de Cali",
        "Argentina"
      ],
      [
        "1987",
        "Peñarol",
        "América de Cali",
        "Uruguay"
      ],
      [
        "1988",
        "Nacional",
        "Newell's Old Boys",
        "Uruguay"
      ],
      [
        "1989",
        "Atlético Nacional",
        "Olimpia",
        "Colombia"
      ],
      [
        "1990",
        "Olimpia",
        "Barcelona",
        "Paraguay"
      ],
      [
        "1991",
        "Colo-Colo",
        "Olimpia",
        "Chile"
      ],
      [
        "1992",
        "São Paulo",
        "Newell's Old Boys",
        "Brazil"
      ],
      [
        "1993",
        "São Paulo",
        "Universidad Católica",
        "Brazil"
      ],
      [
        "1994",
        "Vélez Sarsfield",
        "São Paulo",
        "Argentina"
      ],
      [
        "1995",
        "Grêmio",
        "Atlético Nacional",
        "Brazil"
      ],
      [
        "1996",
        "River Plate",
        "América de Cali",
        "Argentina"
      ],
      [
        "1997",
        "Cruzeiro",
        "Sporting Cristal",
        "Brazil"
      ],
      [
        "1998",
        "Vasco da Gama",
        "Barcelona",
        "Brazil"
      ],
      [
        "1999",
        "Palmeiras",
        "Deportivo Cali",
        "Brazil"
      ],
      [
        "2000",
        "Boca Juniors",
        "Palmeiras",
        "Argentina"
      ],
      [
        "2001",
        "Boca Juniors",
        "Cruz Azul",
        "Argentina"
      ],
      [
        "2002",
        "Olimpia",
        "São Caetano",
        "Paraguay"
      ],
      [
        "2003",
        "Boca Juniors",
        "Santos",
        "Argentina"
      ],
      [
        "2004",
        "Once Caldas",
        "Boca Juniors",
        "Colombia"
      ],
      [
        "2005",
        "São Paulo",
        "Atlético Paranaense",
        "Brazil"
      ],
      [
        "2006",
        "Internacional",
        "São Paulo",
        "Brazil"
      ],
      [
        "2007",
        "Boca Juniors",
        "Grêmio",
        "Argentina"
      ],
      [
        "2008",
        "LDU Quito",
        "Fluminense",
        "Ecuador"
      ],
      [
        "2009",
        "Estudiantes",
        "Cruzeiro",
        "Argentina"
      ],
      [
        "2010",
        "Internacional",
        "Guadalajara",
        "Brazil"
      ],
      [
        "2011",
        "Santos",
        "Peñarol",
        "Brazil"
      ],
      [
        "2012",
        "Corinthians",
        "Boca Juniors",
        "Brazil"
      ],
      [
        "2013",
        "Atlético Mineiro",
        "Olimpia",
        "Brazil"
      ],
      [
        "2014",
        "San Lorenzo",
        "Nacional",
        "Argentina"
      ],
      [
        "2015",
        "River Plate",
        "Tigres UANL",
        "Argentina"
      ],
      [
        "2016",
        "Atlético Nacional",
        "Independiente del Valle",
        "Colombia"
      ],
      [
        "2017",
        "Grêmio",
        "Lanús",
        "Brazil"
      ],
      [
        "2018",
        "River Plate",
        "Boca Juniors",
        "Argentina"
      ],
      [
        "2019",
        "Flamengo",
        "River Plate",
        "Brazil"
      ],
      [
        "2020",
        "Palmeiras",
        "Santos",
        "Brazil"
      ],
      [
        "2021",
        "Palmeiras",
        "Flamengo",
        "Brazil"
      ],
      [
        "2022",
        "Flamengo",
        "Athletico Paranaense",
        "Brazil"
      ],
      [
        "2023",
        "Fluminense",
        "Boca Juniors",
        "Brazil"
      ],
      [
        "2024",
        "Botafogo",
        "Atlético Mineiro",
        "Brazil"
      ],
      [
        "2025",
        "Flamengo",
        "Palmeiras",
        "Brazil"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Copa Libertadores titles?",
        "a": "Independiente of Argentina hold the record with seven titles (1964, 1965, 1972, 1973, 1974, 1975 and 1984), earning the nickname 'Rey de Copas' (King of Cups). Their four consecutive wins from 1972 to 1975 remain unmatched. Boca Juniors are second with six."
      },
      {
        "q": "Who won the 2025 Copa Libertadores?",
        "a": "Flamengo won the 2025 Copa Libertadores, beating fellow Brazilian side Palmeiras 1–0 in the final in Lima, Peru, on 29 November 2025. A Danilo header settled the match and gave Flamengo their fourth continental title."
      },
      {
        "q": "Which country has produced the most Copa Libertadores winners?",
        "a": "Argentina and Brazil are the two most successful nations. Argentine clubs led for decades, but Brazil has surged ahead in recent years — every final since 2019 has been won by a Brazilian club, including Flamengo, Palmeiras, Fluminense and Botafogo."
      },
      {
        "q": "Has a club ever won the Copa Libertadores three years in a row?",
        "a": "No. Independiente's four straight titles from 1972 to 1975 is the longest winning streak. Several clubs have gone back-to-back, including Peñarol, Estudiantes, Boca Juniors and, most recently, Palmeiras in 2020 and 2021, but no side has taken three consecutive editions."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Copa Libertadores"
  },
  {
    "slug": "club-world-cup-winners",
    "h1": "Every FIFA Club World Cup Winner (2000–2025)",
    "title": "FIFA Club World Cup Winners by Year: Full List 2000–2025 | Ball IQ",
    "description": "The complete list of FIFA Club World Cup winners from 2000 to 2025, with runner-up and host nation for every edition — including the new 32-team format.",
    "intro": [
      "The FIFA Club World Cup crowns the best club side on the planet by pitting the champions of each continent against one another. It began in 2000 with Corinthians lifting the inaugural trophy on home soil in Brazil, went dormant for four years, then returned in 2005 as an annual fixture that ran through 2023.",
      "For most of its history the tournament was a compact, single-host event decided over a week or so, and it became a showcase for European dominance in particular — Real Madrid alone claimed five titles between 2014 and 2022. South American giants and the occasional underdog, like DR Congo's TP Mazembe reaching the 2010 final, added the drama.",
      "In 2025 the competition was reborn in a radically expanded format: 32 clubs across a month-long tournament staged in the United States, a dry run for the following year's World Cup. Chelsea beat Paris Saint-Germain 3–0 in the New Jersey final to become the first champions of the new era. The table below lists every winner, runner-up and host from 2000 through 2025."
    ],
    "columns": [
      "Year",
      "Winner",
      "Runner-up",
      "Host"
    ],
    "rows": [
      [
        "2000",
        "Corinthians",
        "Vasco da Gama",
        "Brazil"
      ],
      [
        "2005",
        "São Paulo",
        "Liverpool",
        "Japan"
      ],
      [
        "2006",
        "Internacional",
        "Barcelona",
        "Japan"
      ],
      [
        "2007",
        "AC Milan",
        "Boca Juniors",
        "Japan"
      ],
      [
        "2008",
        "Manchester United",
        "LDU Quito",
        "Japan"
      ],
      [
        "2009",
        "Barcelona",
        "Estudiantes",
        "United Arab Emirates"
      ],
      [
        "2010",
        "Inter Milan",
        "TP Mazembe",
        "United Arab Emirates"
      ],
      [
        "2011",
        "Barcelona",
        "Santos",
        "Japan"
      ],
      [
        "2012",
        "Corinthians",
        "Chelsea",
        "Japan"
      ],
      [
        "2013",
        "Bayern Munich",
        "Raja Casablanca",
        "Morocco"
      ],
      [
        "2014",
        "Real Madrid",
        "San Lorenzo",
        "Morocco"
      ],
      [
        "2015",
        "Barcelona",
        "River Plate",
        "Japan"
      ],
      [
        "2016",
        "Real Madrid",
        "Kashima Antlers",
        "Japan"
      ],
      [
        "2017",
        "Real Madrid",
        "Grêmio",
        "United Arab Emirates"
      ],
      [
        "2018",
        "Real Madrid",
        "Al-Ain",
        "United Arab Emirates"
      ],
      [
        "2019",
        "Liverpool",
        "Flamengo",
        "Qatar"
      ],
      [
        "2020",
        "Bayern Munich",
        "Tigres UANL",
        "Qatar"
      ],
      [
        "2021",
        "Chelsea",
        "Palmeiras",
        "United Arab Emirates"
      ],
      [
        "2022",
        "Real Madrid",
        "Al-Hilal",
        "Morocco"
      ],
      [
        "2023",
        "Manchester City",
        "Fluminense",
        "Saudi Arabia"
      ],
      [
        "2025",
        "Chelsea",
        "Paris Saint-Germain",
        "United States"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most FIFA Club World Cups?",
        "a": "Real Madrid have won the most FIFA Club World Cups with five titles, claimed in 2014, 2016, 2017, 2018 and 2022. Barcelona are next with three."
      },
      {
        "q": "Who won the first expanded 32-team Club World Cup in 2025?",
        "a": "Chelsea won the first 32-team FIFA Club World Cup, beating Paris Saint-Germain 3–0 in the final at MetLife Stadium in New Jersey on 13 July 2025. It was Chelsea's second Club World Cup title."
      },
      {
        "q": "Why was there no Club World Cup winner in 2024?",
        "a": "The original annual format ended with Manchester City's win in 2023. FIFA then relaunched the competition as a month-long 32-team tournament, held for the first time in 2025, so no edition was contested in 2024."
      },
      {
        "q": "Why is there a gap between 2000 and 2005 in the winners list?",
        "a": "After the inaugural 2000 tournament, the competition was suspended amid the collapse of FIFA's marketing partner ISL and a fixture clash with the Intercontinental Cup. It returned in 2005 and ran annually until 2023."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Club World Cup"
  },
  {
    "slug": "eredivisie-top-scorers",
    "h1": "Eredivisie Top Scorer Every Season (1956-57 to 2025-26)",
    "title": "Eredivisie Top Scorer Every Season (1956-2026) | Ball IQ",
    "description": "Complete list of the Eredivisie top scorer for every season from 1956-57 to 2025-26, with player, club and goal tally.",
    "intro": [
      "Since the Dutch top flight turned fully professional in 1956, the Eredivisie has produced a golden boot winner every single season. The very first belonged to PSV's Coen Dillen, whose 43 goals in 1956-57 remain the highest single-season total the league has ever seen, a record that has stood untouched for seven decades.",
      "The roll call reads like a history of Dutch football greatness. Johan Cruyff, Marco van Basten, Dennis Bergkamp, Ruud van Nistelrooy and Luis Suarez all topped the charts before moving on to conquer Europe, while imports like Romario, Ronaldo and Wilfried Bony announced themselves in the Netherlands. Ajax, PSV and Feyenoord players dominate the list, though provincial clubs such as Heerenveen, AZ and Vitesse have regularly gatecrashed the party. Since 2020-21 the award has carried the name of the Willy van der Kuijlen Trophy, honouring the Eredivisie's all-time leading scorer.",
      "The table below lists the leading scorer for every season from 1956-57 through 2025-26. Where two players finished level on goals the season is shared, as happened most recently in 2023-24 when Luuk de Jong and Vangelis Pavlidis both reached 29."
    ],
    "columns": [
      "Season",
      "Player",
      "Club",
      "Goals"
    ],
    "rows": [
      [
        "1956-57",
        "Coen Dillen",
        "PSV",
        "43"
      ],
      [
        "1957-58",
        "Leen Canjels",
        "NAC",
        "32"
      ],
      [
        "1958-59",
        "Leen Canjels",
        "NAC",
        "34"
      ],
      [
        "1959-60",
        "Henk Groot",
        "Ajax",
        "38"
      ],
      [
        "1960-61",
        "Henk Groot",
        "Ajax",
        "41"
      ],
      [
        "1961-62",
        "Dick Tol",
        "Volendam",
        "27"
      ],
      [
        "1962-63",
        "Pierre Kerkhoffs",
        "PSV",
        "22"
      ],
      [
        "1963-64",
        "Frans Geurtsen",
        "DWS",
        "28"
      ],
      [
        "1964-65",
        "Frans Geurtsen",
        "DWS",
        "23"
      ],
      [
        "1965-66",
        "Willy van der Kuijlen / Piet Kruiver",
        "PSV / Feyenoord",
        "23"
      ],
      [
        "1966-67",
        "Johan Cruyff",
        "Ajax",
        "33"
      ],
      [
        "1967-68",
        "Ove Kindvall",
        "Feyenoord",
        "28"
      ],
      [
        "1968-69",
        "Dick van Dijk / Ove Kindvall",
        "FC Twente / Feyenoord",
        "30"
      ],
      [
        "1969-70",
        "Willy van der Kuijlen",
        "PSV",
        "26"
      ],
      [
        "1970-71",
        "Ove Kindvall",
        "Feyenoord",
        "24"
      ],
      [
        "1971-72",
        "Johan Cruyff",
        "Ajax",
        "25"
      ],
      [
        "1972-73",
        "Willy Janssens / Willy Brokamp",
        "NEC / MVV",
        "18"
      ],
      [
        "1973-74",
        "Willy van der Kuijlen",
        "PSV",
        "27"
      ],
      [
        "1974-75",
        "Ruud Geels",
        "Ajax",
        "30"
      ],
      [
        "1975-76",
        "Ruud Geels",
        "Ajax",
        "29"
      ],
      [
        "1976-77",
        "Ruud Geels",
        "Ajax",
        "34"
      ],
      [
        "1977-78",
        "Ruud Geels",
        "Ajax",
        "30"
      ],
      [
        "1978-79",
        "Kees Kist",
        "AZ'67",
        "34"
      ],
      [
        "1979-80",
        "Kees Kist",
        "AZ'67",
        "27"
      ],
      [
        "1980-81",
        "Ruud Geels",
        "Sparta Rotterdam",
        "22"
      ],
      [
        "1981-82",
        "Wim Kieft",
        "Ajax",
        "32"
      ],
      [
        "1982-83",
        "Peter Houtman",
        "Feyenoord",
        "30"
      ],
      [
        "1983-84",
        "Marco van Basten",
        "Ajax",
        "28"
      ],
      [
        "1984-85",
        "Marco van Basten",
        "Ajax",
        "22"
      ],
      [
        "1985-86",
        "Marco van Basten",
        "Ajax",
        "37"
      ],
      [
        "1986-87",
        "Marco van Basten",
        "Ajax",
        "31"
      ],
      [
        "1987-88",
        "Wim Kieft",
        "PSV",
        "29"
      ],
      [
        "1988-89",
        "Romario",
        "PSV",
        "19"
      ],
      [
        "1989-90",
        "Romario",
        "PSV",
        "23"
      ],
      [
        "1990-91",
        "Romario / Dennis Bergkamp",
        "PSV / Ajax",
        "25"
      ],
      [
        "1991-92",
        "Dennis Bergkamp",
        "Ajax",
        "24"
      ],
      [
        "1992-93",
        "Dennis Bergkamp",
        "Ajax",
        "26"
      ],
      [
        "1993-94",
        "Jari Litmanen",
        "Ajax",
        "26"
      ],
      [
        "1994-95",
        "Ronaldo",
        "PSV",
        "30"
      ],
      [
        "1995-96",
        "Luc Nilis",
        "PSV",
        "21"
      ],
      [
        "1996-97",
        "Luc Nilis",
        "PSV",
        "21"
      ],
      [
        "1997-98",
        "Nikos Machlas",
        "Vitesse",
        "34"
      ],
      [
        "1998-99",
        "Ruud van Nistelrooy",
        "PSV",
        "31"
      ],
      [
        "1999-00",
        "Ruud van Nistelrooy",
        "PSV",
        "29"
      ],
      [
        "2000-01",
        "Mateja Kezman",
        "PSV",
        "24"
      ],
      [
        "2001-02",
        "Pierre van Hooijdonk",
        "Feyenoord",
        "24"
      ],
      [
        "2002-03",
        "Mateja Kezman",
        "PSV",
        "35"
      ],
      [
        "2003-04",
        "Mateja Kezman",
        "PSV",
        "31"
      ],
      [
        "2004-05",
        "Dirk Kuyt",
        "Feyenoord",
        "29"
      ],
      [
        "2005-06",
        "Klaas-Jan Huntelaar",
        "Heerenveen / Ajax",
        "33"
      ],
      [
        "2006-07",
        "Afonso Alves",
        "Heerenveen",
        "34"
      ],
      [
        "2007-08",
        "Klaas-Jan Huntelaar",
        "Ajax",
        "33"
      ],
      [
        "2008-09",
        "Mounir El Hamdaoui",
        "AZ",
        "23"
      ],
      [
        "2009-10",
        "Luis Suarez",
        "Ajax",
        "35"
      ],
      [
        "2010-11",
        "Bjorn Vleminckx",
        "NEC",
        "23"
      ],
      [
        "2011-12",
        "Bas Dost",
        "Heerenveen",
        "32"
      ],
      [
        "2012-13",
        "Wilfried Bony",
        "Vitesse",
        "31"
      ],
      [
        "2013-14",
        "Alfred Finnbogason",
        "Heerenveen",
        "29"
      ],
      [
        "2014-15",
        "Memphis Depay",
        "PSV",
        "22"
      ],
      [
        "2015-16",
        "Vincent Janssen",
        "AZ",
        "27"
      ],
      [
        "2016-17",
        "Nicolai Jorgensen",
        "Feyenoord",
        "21"
      ],
      [
        "2017-18",
        "Alireza Jahanbakhsh",
        "AZ",
        "21"
      ],
      [
        "2018-19",
        "Luuk de Jong / Dusan Tadic",
        "PSV / Ajax",
        "28"
      ],
      [
        "2019-20",
        "Steven Berghuis / Cyriel Dessers",
        "Feyenoord / Heracles Almelo",
        "15"
      ],
      [
        "2020-21",
        "Georgios Giakoumakis",
        "VVV-Venlo",
        "26"
      ],
      [
        "2021-22",
        "Sebastien Haller",
        "Ajax",
        "21"
      ],
      [
        "2022-23",
        "Anastasios Douvikas / Xavi Simons",
        "FC Utrecht / PSV",
        "19"
      ],
      [
        "2023-24",
        "Luuk de Jong / Vangelis Pavlidis",
        "PSV / AZ",
        "29"
      ],
      [
        "2024-25",
        "Sem Steijn",
        "Twente",
        "24"
      ],
      [
        "2025-26",
        "Ayase Ueda",
        "Feyenoord",
        "25"
      ]
    ],
    "faq": [
      {
        "q": "Who has the most goals in a single Eredivisie season?",
        "a": "Coen Dillen holds the record with 43 goals for PSV in the inaugural 1956-57 season. No player has come close since, and the mark has stood for nearly 70 years."
      },
      {
        "q": "Who was the 2025-26 Eredivisie top scorer?",
        "a": "Ayase Ueda of Feyenoord finished as the 2025-26 Eredivisie top scorer with 25 goals, winning the Willy van der Kuijlen Trophy by a clear margin under manager Robin van Persie."
      },
      {
        "q": "What is the Willy van der Kuijlen Trophy?",
        "a": "It is the award given to the Eredivisie's leading scorer each season, introduced under that name in 2020-21. It honours Willy van der Kuijlen, the competition's all-time top scorer with 311 goals for PSV."
      },
      {
        "q": "Which players have won the Eredivisie top scorer award most often?",
        "a": "Ruud Geels topped the charts five times (four with Ajax, once with Sparta). Marco van Basten won four straight with Ajax, and Willy van der Kuijlen and Johan Cruyff also feature multiple times."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Eredivisie"
  },
  {
    "slug": "primeira-liga-top-scorers",
    "h1": "Primeira Liga Top Scorers — Every Season (1934–35 to 2025–26)",
    "title": "Primeira Liga Top Scorers by Season (Bola de Prata) | Ball IQ",
    "description": "The Primeira Liga top scorer for every season since 1934–35 — the full Bola de Prata roll call of players, clubs and goal tallies from Peyroteo to Suárez.",
    "intro": [
      "Portugal's top flight has crowned a leading marksman every season since 1934–35, an honour recognised today by the Bola de Prata (\"Silver Ball\"), awarded by the newspaper A Bola. This table gathers the whole run of winners in one place, from Sporting's Manuel Soeiro in the inaugural campaign to the present day.",
      "The list is dominated by the \"Big Three\" — Benfica, Porto and Sporting CP — whose forwards have claimed the vast majority of titles. Legends leap off the page: Fernando Peyroteo's post-war avalanches for Sporting, Eusébio's seven awards for Benfica, Fernando Gomes' six for Porto, and Mário Jardel's five, including a staggering 42-goal haul in 2001–02.",
      "The modern era has produced its own record-chasers. Viktor Gyökeres poured in 29 and then 39 league goals in back-to-back Sporting seasons before his move to the Premier League, the highest single-season tally since Jardel. Yet Héctor Yazalde's 46 goals for Sporting in 1973–74 remains the competition's all-time single-season benchmark."
    ],
    "columns": [
      "Season",
      "Player",
      "Club",
      "Goals"
    ],
    "rows": [
      [
        "1934–35",
        "Manuel Soeiro",
        "Sporting CP",
        "14"
      ],
      [
        "1935–36",
        "Pinga",
        "Porto",
        "21"
      ],
      [
        "1936–37",
        "Manuel Soeiro",
        "Sporting CP",
        "24"
      ],
      [
        "1937–38",
        "Fernando Peyroteo",
        "Sporting CP",
        "34"
      ],
      [
        "1938–39",
        "Costuras",
        "Porto",
        "18"
      ],
      [
        "1939–40",
        "Fernando Peyroteo / Slavko Kodrnja",
        "Sporting CP / Porto",
        "29"
      ],
      [
        "1940–41",
        "Fernando Peyroteo",
        "Sporting CP",
        "29"
      ],
      [
        "1941–42",
        "Correia Dias",
        "Porto",
        "36"
      ],
      [
        "1942–43",
        "Julinho",
        "Benfica",
        "24"
      ],
      [
        "1943–44",
        "Francisco Rodrigues",
        "Vitória de Setúbal",
        "28"
      ],
      [
        "1944–45",
        "Francisco Rodrigues",
        "Vitória de Setúbal",
        "21"
      ],
      [
        "1945–46",
        "Fernando Peyroteo",
        "Sporting CP",
        "39"
      ],
      [
        "1946–47",
        "Fernando Peyroteo",
        "Sporting CP",
        "33"
      ],
      [
        "1947–48",
        "António Araújo",
        "Porto",
        "36"
      ],
      [
        "1948–49",
        "Fernando Peyroteo",
        "Sporting CP",
        "30"
      ],
      [
        "1949–50",
        "Julinho",
        "Benfica",
        "28"
      ],
      [
        "1950–51",
        "Manuel Vasques",
        "Sporting CP",
        "29"
      ],
      [
        "1951–52",
        "José Águas",
        "Benfica",
        "28"
      ],
      [
        "1952–53",
        "Matateu",
        "Belenenses",
        "29"
      ],
      [
        "1953–54",
        "João Martins",
        "Sporting CP",
        "31"
      ],
      [
        "1954–55",
        "Matateu",
        "Belenenses",
        "32"
      ],
      [
        "1955–56",
        "José Águas",
        "Benfica",
        "28"
      ],
      [
        "1956–57",
        "José Águas",
        "Benfica",
        "30"
      ],
      [
        "1957–58",
        "Arsénio Duarte",
        "CUF",
        "23"
      ],
      [
        "1958–59",
        "José Águas",
        "Benfica",
        "26"
      ],
      [
        "1959–60",
        "Edmur Ribeiro",
        "Vitória de Guimarães",
        "25"
      ],
      [
        "1960–61",
        "José Águas",
        "Benfica",
        "27"
      ],
      [
        "1961–62",
        "Azumir Veríssimo",
        "Porto",
        "23"
      ],
      [
        "1962–63",
        "José Augusto Torres",
        "Benfica",
        "26"
      ],
      [
        "1963–64",
        "Eusébio",
        "Benfica",
        "28"
      ],
      [
        "1964–65",
        "Eusébio",
        "Benfica",
        "28"
      ],
      [
        "1965–66",
        "Eusébio / Ernesto Figueiredo",
        "Benfica / Sporting CP",
        "25"
      ],
      [
        "1966–67",
        "Eusébio",
        "Benfica",
        "31"
      ],
      [
        "1967–68",
        "Eusébio",
        "Benfica",
        "42"
      ],
      [
        "1968–69",
        "Manuel António",
        "Académica de Coimbra",
        "19"
      ],
      [
        "1969–70",
        "Eusébio",
        "Benfica",
        "20"
      ],
      [
        "1970–71",
        "Artur Jorge",
        "Benfica",
        "23"
      ],
      [
        "1971–72",
        "Artur Jorge",
        "Benfica",
        "27"
      ],
      [
        "1972–73",
        "Eusébio",
        "Benfica",
        "40"
      ],
      [
        "1973–74",
        "Héctor Yazalde",
        "Sporting CP",
        "46"
      ],
      [
        "1974–75",
        "Héctor Yazalde",
        "Sporting CP",
        "30"
      ],
      [
        "1975–76",
        "Rui Jordão",
        "Benfica",
        "30"
      ],
      [
        "1976–77",
        "Fernando Gomes",
        "Porto",
        "26"
      ],
      [
        "1977–78",
        "Fernando Gomes",
        "Porto",
        "25"
      ],
      [
        "1978–79",
        "Fernando Gomes",
        "Porto",
        "27"
      ],
      [
        "1979–80",
        "Rui Jordão",
        "Sporting CP",
        "31"
      ],
      [
        "1980–81",
        "Nené",
        "Benfica",
        "20"
      ],
      [
        "1981–82",
        "Jacques Pereira",
        "Porto",
        "27"
      ],
      [
        "1982–83",
        "Fernando Gomes",
        "Porto",
        "36"
      ],
      [
        "1983–84",
        "Fernando Gomes / Nené",
        "Porto / Benfica",
        "21"
      ],
      [
        "1984–85",
        "Fernando Gomes",
        "Porto",
        "39"
      ],
      [
        "1985–86",
        "Manuel Fernandes",
        "Sporting CP",
        "30"
      ],
      [
        "1986–87",
        "Paulinho Cascavel",
        "Vitória de Guimarães",
        "22"
      ],
      [
        "1987–88",
        "Paulinho Cascavel",
        "Sporting CP",
        "23"
      ],
      [
        "1988–89",
        "Vata",
        "Benfica",
        "16"
      ],
      [
        "1989–90",
        "Mats Magnusson",
        "Benfica",
        "33"
      ],
      [
        "1990–91",
        "Rui Águas",
        "Benfica",
        "25"
      ],
      [
        "1991–92",
        "Ricky",
        "Boavista",
        "30"
      ],
      [
        "1992–93",
        "Jorge Cadete",
        "Sporting CP",
        "18"
      ],
      [
        "1993–94",
        "Rashidi Yekini",
        "Vitória de Setúbal",
        "21"
      ],
      [
        "1994–95",
        "Hassan Nader",
        "Farense",
        "21"
      ],
      [
        "1995–96",
        "Domingos",
        "Porto",
        "25"
      ],
      [
        "1996–97",
        "Mário Jardel",
        "Porto",
        "30"
      ],
      [
        "1997–98",
        "Mário Jardel",
        "Porto",
        "26"
      ],
      [
        "1998–99",
        "Mário Jardel",
        "Porto",
        "36"
      ],
      [
        "1999–2000",
        "Mário Jardel",
        "Porto",
        "37"
      ],
      [
        "2000–01",
        "Pena",
        "Porto",
        "22"
      ],
      [
        "2001–02",
        "Mário Jardel",
        "Sporting CP",
        "42"
      ],
      [
        "2002–03",
        "Fary Faye / Simão Sabrosa",
        "Beira-Mar / Benfica",
        "18"
      ],
      [
        "2003–04",
        "Benni McCarthy",
        "Porto",
        "20"
      ],
      [
        "2004–05",
        "Liédson",
        "Sporting CP",
        "25"
      ],
      [
        "2005–06",
        "Albert Meyong",
        "Belenenses",
        "17"
      ],
      [
        "2006–07",
        "Liédson",
        "Sporting CP",
        "15"
      ],
      [
        "2007–08",
        "Lisandro López",
        "Porto",
        "24"
      ],
      [
        "2008–09",
        "Nenê",
        "Nacional",
        "20"
      ],
      [
        "2009–10",
        "Óscar Cardozo",
        "Benfica",
        "26"
      ],
      [
        "2010–11",
        "Hulk",
        "Porto",
        "23"
      ],
      [
        "2011–12",
        "Óscar Cardozo / Lima",
        "Benfica / Braga",
        "20"
      ],
      [
        "2012–13",
        "Jackson Martínez",
        "Porto",
        "26"
      ],
      [
        "2013–14",
        "Jackson Martínez",
        "Porto",
        "20"
      ],
      [
        "2014–15",
        "Jackson Martínez",
        "Porto",
        "21"
      ],
      [
        "2015–16",
        "Jonas",
        "Benfica",
        "32"
      ],
      [
        "2016–17",
        "Bas Dost",
        "Sporting CP",
        "34"
      ],
      [
        "2017–18",
        "Jonas",
        "Benfica",
        "34"
      ],
      [
        "2018–19",
        "Haris Seferović",
        "Benfica",
        "23"
      ],
      [
        "2019–20",
        "Carlos Vinícius / Mehdi Taremi / Pizzi",
        "Benfica / Rio Ave / Benfica",
        "18"
      ],
      [
        "2020–21",
        "Pedro Gonçalves",
        "Sporting CP",
        "23"
      ],
      [
        "2021–22",
        "Darwin Núñez",
        "Benfica",
        "26"
      ],
      [
        "2022–23",
        "Mehdi Taremi",
        "Porto",
        "22"
      ],
      [
        "2023–24",
        "Viktor Gyökeres",
        "Sporting CP",
        "29"
      ],
      [
        "2024–25",
        "Viktor Gyökeres",
        "Sporting CP",
        "39"
      ],
      [
        "2025–26",
        "Luis Suárez",
        "Sporting CP",
        "28"
      ]
    ],
    "faq": [
      {
        "q": "Who is the all-time top scorer in a single Primeira Liga season?",
        "a": "Héctor Yazalde holds the record with 46 goals for Sporting CP in 1973–74. It earned him the European Golden Boot and remains the highest single-season tally in Portuguese top-flight history, ahead of Eusébio's 42 (1967–68) and Mário Jardel's 42 (2001–02)."
      },
      {
        "q": "Who has won the Bola de Prata the most times?",
        "a": "Eusébio leads with seven Primeira Liga top-scorer awards for Benfica between 1964 and 1973. Fernando Peyroteo (Sporting) and Fernando Gomes (Porto) each won it six times, with Gomes also collecting two European Golden Boots."
      },
      {
        "q": "Who was the Primeira Liga top scorer in 2025–26?",
        "a": "Luis Suárez of Sporting CP won the Bola de Prata for 2025–26 with 28 league goals, taking over as Sporting's leading marksman after Viktor Gyökeres departed for the Premier League."
      },
      {
        "q": "How many goals did Viktor Gyökeres score in the Primeira Liga?",
        "a": "Gyökeres won back-to-back Bola de Prata awards for Sporting CP, scoring 29 league goals in 2023–24 and 39 in 2024–25. His 39-goal season was the most in the Portuguese top flight since Mário Jardel's 42 in 2001–02."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Primeira Liga"
  },
  {
    "slug": "super-lig-top-scorers",
    "h1": "Süper Lig Top Scorers (Gol Kralı) — Every Season, 1959 to 2025-26",
    "title": "Süper Lig Top Scorers by Season (1959–2026) — Gol Kralı | Ball IQ",
    "description": "The Turkish Süper Lig top scorer (Gol Kralı) for every season from 1959 to 2025-26 — player, club and goal tally in one complete, verified list.",
    "intro": [
      "Turkey crowns a Gol Kralı — literally 'goal king' — at the end of every Süper Lig season, and the honour roll reads like a history of Turkish football itself. It opens with Metin Oktay, the Galatasaray idol who topped the charts six times and still holds a share of the early scoring records, and runs all the way to the imported goal machines of the modern era.",
      "The list below covers every campaign from the league's 1959 debut through 2025-26. A handful of seasons ended in a tie, with two players sharing the crown on equal goals — those are shown together on a single row. Tanju Çolak's 39 goals in 1987-88 remains the single-season benchmark, a mark that even prolific recent kings like Mauro Icardi and Victor Osimhen have not threatened.",
      "Lately the award has followed the money and firepower of Galatasaray and Fenerbahçe, but the 2025-26 season bucked the trend: Trabzonspor's Paul Onuachu and Başakşehir's Eldor Shomurodov tied on 22 goals apiece. Think you can name the Gol Kralı from your era? Test yourself with a Turkish football quiz on Ball IQ."
    ],
    "columns": [
      "Season",
      "Player",
      "Club",
      "Goals"
    ],
    "rows": [
      [
        "1959",
        "Metin Oktay",
        "Galatasaray",
        "11"
      ],
      [
        "1959-60",
        "Metin Oktay",
        "Galatasaray",
        "33"
      ],
      [
        "1960-61",
        "Metin Oktay",
        "Galatasaray",
        "36"
      ],
      [
        "1961-62",
        "Fikri Elma",
        "Ankara Demirspor",
        "21"
      ],
      [
        "1962-63",
        "Metin Oktay",
        "Galatasaray",
        "38"
      ],
      [
        "1963-64",
        "Güven Önüt",
        "Beşiktaş",
        "19"
      ],
      [
        "1964-65",
        "Metin Oktay",
        "Galatasaray",
        "17"
      ],
      [
        "1965-66",
        "Ertan Adatepe",
        "Ankaragücü",
        "20"
      ],
      [
        "1966-67",
        "Ertan Adatepe",
        "Ankaragücü",
        "18"
      ],
      [
        "1967-68",
        "Fevzi Zemzem",
        "Göztepe",
        "19"
      ],
      [
        "1968-69",
        "Metin Oktay",
        "Galatasaray",
        "17"
      ],
      [
        "1969-70",
        "Fethi Heper",
        "Eskişehirspor",
        "13"
      ],
      [
        "1970-71",
        "Ogün Altıparmak",
        "Fenerbahçe",
        "16"
      ],
      [
        "1971-72",
        "Fethi Heper",
        "Eskişehirspor",
        "20"
      ],
      [
        "1972-73",
        "Osman Arpacıoğlu",
        "Fenerbahçe",
        "16"
      ],
      [
        "1973-74",
        "Cemil Turan",
        "Fenerbahçe",
        "14"
      ],
      [
        "1974-75",
        "Ömer Kaner",
        "Eskişehirspor",
        "14"
      ],
      [
        "1975-76",
        "Cemil Turan / Ali Osman Renklibay",
        "Fenerbahçe / Ankaragücü",
        "17"
      ],
      [
        "1976-77",
        "Necmi Perekli",
        "Trabzonspor",
        "18"
      ],
      [
        "1977-78",
        "Cemil Turan",
        "Fenerbahçe",
        "17"
      ],
      [
        "1978-79",
        "Özer Umdu",
        "Adanaspor",
        "15"
      ],
      [
        "1979-80",
        "Mustafa Denizli / Bahtiyar Yorulmaz",
        "Altay / Bursaspor",
        "12"
      ],
      [
        "1980-81",
        "Bora Öztürk",
        "Adanaspor",
        "15"
      ],
      [
        "1981-82",
        "Selçuk Yula",
        "Fenerbahçe",
        "16"
      ],
      [
        "1982-83",
        "Selçuk Yula",
        "Fenerbahçe",
        "19"
      ],
      [
        "1983-84",
        "Tarik Hodžić",
        "Galatasaray",
        "16"
      ],
      [
        "1984-85",
        "Aykut Yiğit",
        "Sakaryaspor",
        "20"
      ],
      [
        "1985-86",
        "Tanju Çolak",
        "Samsunspor",
        "33"
      ],
      [
        "1986-87",
        "Tanju Çolak",
        "Samsunspor",
        "25"
      ],
      [
        "1987-88",
        "Tanju Çolak",
        "Galatasaray",
        "39"
      ],
      [
        "1988-89",
        "Aykut Kocaman",
        "Fenerbahçe",
        "29"
      ],
      [
        "1989-90",
        "Feyyaz Uçar",
        "Beşiktaş",
        "28"
      ],
      [
        "1990-91",
        "Tanju Çolak",
        "Galatasaray",
        "31"
      ],
      [
        "1991-92",
        "Aykut Kocaman",
        "Fenerbahçe",
        "25"
      ],
      [
        "1992-93",
        "Tanju Çolak",
        "Fenerbahçe",
        "27"
      ],
      [
        "1993-94",
        "Bülent Uygun",
        "Fenerbahçe",
        "22"
      ],
      [
        "1994-95",
        "Aykut Kocaman",
        "Fenerbahçe",
        "27"
      ],
      [
        "1995-96",
        "Shota Arveladze",
        "Trabzonspor",
        "25"
      ],
      [
        "1996-97",
        "Hakan Şükür",
        "Galatasaray",
        "38"
      ],
      [
        "1997-98",
        "Hakan Şükür",
        "Galatasaray",
        "33"
      ],
      [
        "1998-99",
        "Hakan Şükür",
        "Galatasaray",
        "19"
      ],
      [
        "1999-2000",
        "Serkan Aykut",
        "Samsunspor",
        "30"
      ],
      [
        "2000-01",
        "Okan Yılmaz",
        "Bursaspor",
        "23"
      ],
      [
        "2001-02",
        "Arif Erdem / İlhan Mansız",
        "Galatasaray / Beşiktaş",
        "21"
      ],
      [
        "2002-03",
        "Okan Yılmaz",
        "Bursaspor",
        "24"
      ],
      [
        "2003-04",
        "Zafer Biryol",
        "Konyaspor",
        "25"
      ],
      [
        "2004-05",
        "Fatih Tekke",
        "Trabzonspor",
        "31"
      ],
      [
        "2005-06",
        "Gökhan Ünal",
        "Kayserispor",
        "25"
      ],
      [
        "2006-07",
        "Alex",
        "Fenerbahçe",
        "19"
      ],
      [
        "2007-08",
        "Semih Şentürk",
        "Fenerbahçe",
        "17"
      ],
      [
        "2008-09",
        "Milan Baroš",
        "Galatasaray",
        "20"
      ],
      [
        "2009-10",
        "Ariza Makukula",
        "Kayserispor",
        "21"
      ],
      [
        "2010-11",
        "Alex",
        "Fenerbahçe",
        "28"
      ],
      [
        "2011-12",
        "Burak Yılmaz",
        "Trabzonspor",
        "33"
      ],
      [
        "2012-13",
        "Burak Yılmaz",
        "Galatasaray",
        "24"
      ],
      [
        "2013-14",
        "Aatif Chahechouhe",
        "Sivasspor",
        "17"
      ],
      [
        "2014-15",
        "Fernandão",
        "Bursaspor",
        "22"
      ],
      [
        "2015-16",
        "Mario Gómez",
        "Beşiktaş",
        "26"
      ],
      [
        "2016-17",
        "Vágner Love",
        "Alanyaspor",
        "23"
      ],
      [
        "2017-18",
        "Bafétimbi Gomis",
        "Galatasaray",
        "29"
      ],
      [
        "2018-19",
        "Mbaye Diagne",
        "Kasımpaşa",
        "30"
      ],
      [
        "2019-20",
        "Alexander Sørloth",
        "Trabzonspor",
        "24"
      ],
      [
        "2020-21",
        "Aaron Boupendza",
        "Hatayspor",
        "22"
      ],
      [
        "2021-22",
        "Umut Bozok",
        "Kasımpaşa",
        "20"
      ],
      [
        "2022-23",
        "Enner Valencia",
        "Fenerbahçe",
        "29"
      ],
      [
        "2023-24",
        "Mauro Icardi",
        "Galatasaray",
        "25"
      ],
      [
        "2024-25",
        "Victor Osimhen",
        "Galatasaray",
        "26"
      ],
      [
        "2025-26",
        "Paul Onuachu / Eldor Shomurodov",
        "Trabzonspor / İstanbul Başakşehir",
        "22"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the Süper Lig Gol Kralı the most times?",
        "a": "Metin Oktay tops the list with six Gol Kralı titles for Galatasaray between 1959 and 1969. Tanju Çolak (four) and Aykut Kocaman (three) are the next most decorated in the award's history."
      },
      {
        "q": "What is the most goals scored in a single Süper Lig season?",
        "a": "Tanju Çolak's 39 goals for Galatasaray in 1987-88 is the highest single-season total by any Süper Lig top scorer. Hakan Şükür's 38 in 1996-97 and Metin Oktay's 38 in 1962-63 are the closest challengers."
      },
      {
        "q": "Who was the Süper Lig top scorer in 2025-26?",
        "a": "The 2025-26 Gol Kralı was shared: Paul Onuachu of Trabzonspor and Eldor Shomurodov of İstanbul Başakşehir each finished on 22 goals."
      },
      {
        "q": "Who was the 2024-25 Süper Lig top scorer?",
        "a": "Victor Osimhen won the 2024-25 Gol Kralı with 26 goals for Galatasaray while on loan from Napoli, edging out a competitive field of imported strikers."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Süper Lig"
  },
  {
    "slug": "coupe-de-france-winners",
    "h1": "Coupe de France Winners: Every Final from 1918 to 2026",
    "title": "Coupe de France Winners: Full List of Every Final | Ball IQ",
    "description": "Every Coupe de France winner from 1918 to 2026 — full list of finals with runners-up and scores. PSG lead the all-time roll; Lens won the 2026 final.",
    "intro": [
      "The Coupe de France is French football's oldest and most open knockout competition, first contested in the 1917-18 season and playable by clubs from every tier of the pyramid. That open format is why the final has pitted amateurs against giants, and why each spring a single decider — long staged at the Stade de France — settles the whole tournament.",
      "Red Star and the early Paris clubs dominated the opening decades, but the modern era belongs to Paris Saint-Germain, whose 16 triumphs are a record. Marseille sit next on the all-time list, with Lille, Saint-Étienne and Monaco among the other clubs to have lifted the trophy multiple times.",
      "The table below lists every final by season, with the runner-up and the score, from Olympique de Pantin's inaugural win to RC Lens claiming their first-ever title in 2026. The 1991-92 edition is the only blank on the roll: it was abandoned without a winner after the Furiani stand collapse."
    ],
    "columns": [
      "Season",
      "Winner",
      "Runner-up",
      "Score"
    ],
    "rows": [
      [
        "1917-18",
        "Olympique de Pantin",
        "FC Lyon",
        "3–0"
      ],
      [
        "1918-19",
        "CASG Paris",
        "Olympique de Pantin",
        "3–2 (a.e.t.)"
      ],
      [
        "1919-20",
        "CA Paris",
        "Le Havre",
        "2–1"
      ],
      [
        "1920-21",
        "Red Star",
        "Olympique de Pantin",
        "2–1"
      ],
      [
        "1921-22",
        "Red Star",
        "Rennes",
        "2–0"
      ],
      [
        "1922-23",
        "Red Star",
        "Sète",
        "4–2"
      ],
      [
        "1923-24",
        "Marseille",
        "Sète",
        "3–2 (a.e.t.)"
      ],
      [
        "1924-25",
        "CASG Paris",
        "FC Rouen",
        "3–2 (replay)"
      ],
      [
        "1925-26",
        "Marseille",
        "AS Valentigney",
        "4–1"
      ],
      [
        "1926-27",
        "Marseille",
        "US Quevilly",
        "3–0"
      ],
      [
        "1927-28",
        "Red Star",
        "CA Paris",
        "3–1"
      ],
      [
        "1928-29",
        "Montpellier",
        "Sète",
        "2–0"
      ],
      [
        "1929-30",
        "Sète",
        "RC Paris",
        "3–1 (a.e.t.)"
      ],
      [
        "1930-31",
        "Club Français",
        "Montpellier",
        "3–0"
      ],
      [
        "1931-32",
        "Cannes",
        "RC Roubaix",
        "1–0"
      ],
      [
        "1932-33",
        "Excelsior AC Roubaix",
        "RC Roubaix",
        "3–1"
      ],
      [
        "1933-34",
        "Sète",
        "Marseille",
        "2–1"
      ],
      [
        "1934-35",
        "Marseille",
        "Rennes",
        "3–0"
      ],
      [
        "1935-36",
        "RC Paris",
        "FCO Charleville",
        "1–0"
      ],
      [
        "1936-37",
        "Sochaux",
        "Strasbourg",
        "2–1"
      ],
      [
        "1937-38",
        "Marseille",
        "Metz",
        "2–1 (a.e.t.)"
      ],
      [
        "1938-39",
        "RC Paris",
        "Olympique Lillois",
        "3–1"
      ],
      [
        "1939-40",
        "RC Paris",
        "Marseille",
        "2–1"
      ],
      [
        "1940-41",
        "Bordeaux",
        "SC Fives",
        "2–0"
      ],
      [
        "1941-42",
        "Red Star",
        "Sète",
        "2–0"
      ],
      [
        "1942-43",
        "Marseille",
        "Bordeaux",
        "4–0 (replay)"
      ],
      [
        "1943-44",
        "ÉF Nancy-Lorraine",
        "ÉF Reims-Champagne",
        "4–0"
      ],
      [
        "1944-45",
        "RC Paris",
        "Lille",
        "3–0"
      ],
      [
        "1945-46",
        "Lille",
        "Red Star",
        "4–2"
      ],
      [
        "1946-47",
        "Lille",
        "Strasbourg",
        "2–0"
      ],
      [
        "1947-48",
        "Lille",
        "Lens",
        "3–2"
      ],
      [
        "1948-49",
        "RC Paris",
        "Lille",
        "5–2"
      ],
      [
        "1949-50",
        "Reims",
        "RC Paris",
        "2–0"
      ],
      [
        "1950-51",
        "Strasbourg",
        "Valenciennes",
        "3–0"
      ],
      [
        "1951-52",
        "Nice",
        "Bordeaux",
        "5–3"
      ],
      [
        "1952-53",
        "Lille",
        "Nancy",
        "2–1"
      ],
      [
        "1953-54",
        "Nice",
        "Marseille",
        "2–1"
      ],
      [
        "1954-55",
        "Lille",
        "Bordeaux",
        "5–2"
      ],
      [
        "1955-56",
        "Sedan",
        "Troyes",
        "3–1"
      ],
      [
        "1956-57",
        "Toulouse",
        "Angers",
        "6–3"
      ],
      [
        "1957-58",
        "Reims",
        "Nîmes",
        "3–1"
      ],
      [
        "1958-59",
        "Le Havre",
        "Sochaux",
        "3–0 (replay)"
      ],
      [
        "1959-60",
        "Monaco",
        "Saint-Étienne",
        "4–2 (a.e.t.)"
      ],
      [
        "1960-61",
        "Sedan",
        "Nîmes",
        "3–1"
      ],
      [
        "1961-62",
        "Saint-Étienne",
        "Nancy",
        "1–0"
      ],
      [
        "1962-63",
        "Monaco",
        "Lyon",
        "2–0 (replay)"
      ],
      [
        "1963-64",
        "Lyon",
        "Bordeaux",
        "2–0"
      ],
      [
        "1964-65",
        "Rennes",
        "Sedan",
        "3–1 (replay)"
      ],
      [
        "1965-66",
        "Strasbourg",
        "Nantes",
        "1–0"
      ],
      [
        "1966-67",
        "Lyon",
        "Sochaux",
        "3–1"
      ],
      [
        "1967-68",
        "Saint-Étienne",
        "Bordeaux",
        "2–1"
      ],
      [
        "1968-69",
        "Marseille",
        "Bordeaux",
        "2–0"
      ],
      [
        "1969-70",
        "Saint-Étienne",
        "Nantes",
        "5–0"
      ],
      [
        "1970-71",
        "Rennes",
        "Lyon",
        "1–0"
      ],
      [
        "1971-72",
        "Marseille",
        "Bastia",
        "2–1"
      ],
      [
        "1972-73",
        "Lyon",
        "Nantes",
        "2–1"
      ],
      [
        "1973-74",
        "Saint-Étienne",
        "Monaco",
        "2–1"
      ],
      [
        "1974-75",
        "Saint-Étienne",
        "Lens",
        "2–0"
      ],
      [
        "1975-76",
        "Marseille",
        "Lyon",
        "2–0"
      ],
      [
        "1976-77",
        "Saint-Étienne",
        "Reims",
        "2–1"
      ],
      [
        "1977-78",
        "Nancy",
        "Nice",
        "1–0"
      ],
      [
        "1978-79",
        "Nantes",
        "Auxerre",
        "4–1 (a.e.t.)"
      ],
      [
        "1979-80",
        "Monaco",
        "Orléans",
        "3–1"
      ],
      [
        "1980-81",
        "Bastia",
        "Saint-Étienne",
        "2–1"
      ],
      [
        "1981-82",
        "Paris Saint-Germain",
        "Saint-Étienne",
        "2–2 (a.e.t., 6–5 pens)"
      ],
      [
        "1982-83",
        "Paris Saint-Germain",
        "Nantes",
        "3–2"
      ],
      [
        "1983-84",
        "Metz",
        "Monaco",
        "2–0 (a.e.t.)"
      ],
      [
        "1984-85",
        "Monaco",
        "Paris Saint-Germain",
        "1–0"
      ],
      [
        "1985-86",
        "Bordeaux",
        "Marseille",
        "2–1 (a.e.t.)"
      ],
      [
        "1986-87",
        "Bordeaux",
        "Marseille",
        "2–0"
      ],
      [
        "1987-88",
        "Metz",
        "Sochaux",
        "1–1 (a.e.t., 5–4 pens)"
      ],
      [
        "1988-89",
        "Marseille",
        "Monaco",
        "4–3"
      ],
      [
        "1989-90",
        "Montpellier",
        "RC Paris",
        "2–1 (a.e.t.)"
      ],
      [
        "1990-91",
        "Monaco",
        "Marseille",
        "1–0"
      ],
      [
        "1991-92",
        "No competition",
        "—",
        "Cancelled — Furiani disaster"
      ],
      [
        "1992-93",
        "Paris Saint-Germain",
        "Nantes",
        "3–0"
      ],
      [
        "1993-94",
        "Auxerre",
        "Montpellier",
        "3–0"
      ],
      [
        "1994-95",
        "Paris Saint-Germain",
        "Strasbourg",
        "1–0"
      ],
      [
        "1995-96",
        "Auxerre",
        "Nîmes",
        "2–1"
      ],
      [
        "1996-97",
        "Nice",
        "Guingamp",
        "1–1 (a.e.t., 4–3 pens)"
      ],
      [
        "1997-98",
        "Paris Saint-Germain",
        "Lens",
        "2–1"
      ],
      [
        "1998-99",
        "Nantes",
        "Sedan",
        "1–0"
      ],
      [
        "1999-00",
        "Nantes",
        "Calais RUFC",
        "2–1"
      ],
      [
        "2000-01",
        "Strasbourg",
        "Amiens",
        "0–0 (a.e.t., 5–4 pens)"
      ],
      [
        "2001-02",
        "Lorient",
        "Bastia",
        "1–0"
      ],
      [
        "2002-03",
        "Auxerre",
        "Paris Saint-Germain",
        "2–1"
      ],
      [
        "2003-04",
        "Paris Saint-Germain",
        "Châteauroux",
        "1–0"
      ],
      [
        "2004-05",
        "Auxerre",
        "Sedan",
        "2–1"
      ],
      [
        "2005-06",
        "Paris Saint-Germain",
        "Marseille",
        "2–1"
      ],
      [
        "2006-07",
        "Sochaux",
        "Marseille",
        "2–2 (a.e.t., 5–4 pens)"
      ],
      [
        "2007-08",
        "Lyon",
        "Paris Saint-Germain",
        "1–0"
      ],
      [
        "2008-09",
        "Guingamp",
        "Rennes",
        "2–1"
      ],
      [
        "2009-10",
        "Paris Saint-Germain",
        "Monaco",
        "1–0 (a.e.t.)"
      ],
      [
        "2010-11",
        "Lille",
        "Paris Saint-Germain",
        "1–0"
      ],
      [
        "2011-12",
        "Lyon",
        "US Quevilly",
        "1–0"
      ],
      [
        "2012-13",
        "Bordeaux",
        "Evian",
        "3–2"
      ],
      [
        "2013-14",
        "Guingamp",
        "Rennes",
        "2–0"
      ],
      [
        "2014-15",
        "Paris Saint-Germain",
        "Auxerre",
        "1–0"
      ],
      [
        "2015-16",
        "Paris Saint-Germain",
        "Marseille",
        "4–2"
      ],
      [
        "2016-17",
        "Paris Saint-Germain",
        "Angers",
        "1–0"
      ],
      [
        "2017-18",
        "Paris Saint-Germain",
        "Les Herbiers",
        "2–0"
      ],
      [
        "2018-19",
        "Rennes",
        "Paris Saint-Germain",
        "2–2 (a.e.t., 6–5 pens)"
      ],
      [
        "2019-20",
        "Paris Saint-Germain",
        "Saint-Étienne",
        "1–0"
      ],
      [
        "2020-21",
        "Paris Saint-Germain",
        "Monaco",
        "2–0"
      ],
      [
        "2021-22",
        "Nantes",
        "Nice",
        "1–0"
      ],
      [
        "2022-23",
        "Toulouse",
        "Nantes",
        "5–1"
      ],
      [
        "2023-24",
        "Paris Saint-Germain",
        "Lyon",
        "2–1"
      ],
      [
        "2024-25",
        "Paris Saint-Germain",
        "Reims",
        "3–0"
      ],
      [
        "2025-26",
        "Lens",
        "Nice",
        "3–1"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most Coupe de France titles?",
        "a": "Paris Saint-Germain are the record holders with 16 wins, having lifted the trophy again in 2025. Marseille are next on the all-time list with 10, followed by Saint-Étienne on six and clubs such as Lille and Monaco."
      },
      {
        "q": "Who won the 2026 Coupe de France?",
        "a": "RC Lens won the 2025-26 Coupe de France, beating Nice 3–1 in the final at the Stade de France on 22 May 2026. It was Lens's first-ever Coupe de France title, at their fourth final after losing in 1948, 1975 and 1998."
      },
      {
        "q": "Why was there no Coupe de France winner in 1992?",
        "a": "The 1991-92 edition was abandoned without a winner after the Furiani stadium disaster on 5 May 1992, when a temporary stand collapsed before a semi-final between Bastia and Marseille. The French federation cancelled the rest of the tournament."
      },
      {
        "q": "What is the Coupe de France?",
        "a": "The Coupe de France is French football's premier domestic cup, a single-elimination knockout first held in 1917-18. It is open to clubs from every level of the football pyramid, from amateur sides to Ligue 1 giants, which is why lower-league teams occasionally reach the final."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Coupe de France"
  },
  {
    "slug": "asian-cup-winners",
    "h1": "Every AFC Asian Cup Winner (1956–2023)",
    "title": "AFC Asian Cup Winners: Full List 1956–2023 | Ball IQ",
    "description": "The complete list of AFC Asian Cup winners from 1956 to 2023, with runner-up and host for every edition. Japan lead with four titles; Qatar are back-to-back holders.",
    "intro": [
      "The AFC Asian Cup is the top prize in men's international football across Asia, first contested in 1956 in Hong Kong with just four teams playing a round-robin. It has since grown into a 24-nation tournament and ranks among the oldest continental championships in the world, predating the European Championship by four years.",
      "No single country has dominated the way some nations have in other regions. Japan sit top of the roll of honour with four titles, all won since 1992, while Iran and Saudi Arabia have three each and South Korea — winners of the first two editions — have not lifted it since 1960. Iran are the only side to win three in a row, taking the trophy in 1968, 1972 and 1976.",
      "The most recent edition was the 2023 Asian Cup, which was played in Qatar in January and February 2024 after being moved from its original host, China. Qatar beat Jordan 3–1 in the Lusail final to retain the trophy they first won in 2019, becoming the fifth nation to win consecutive Asian Cups and the first to do so since Japan in 2000 and 2004. The next tournament, in 2027, is scheduled for Saudi Arabia."
    ],
    "columns": [
      "Year",
      "Winner",
      "Runner-up",
      "Host"
    ],
    "rows": [
      [
        "1956",
        "South Korea",
        "Israel",
        "Hong Kong"
      ],
      [
        "1960",
        "South Korea",
        "Israel",
        "South Korea"
      ],
      [
        "1964",
        "Israel",
        "India",
        "Israel"
      ],
      [
        "1968",
        "Iran",
        "Burma",
        "Iran"
      ],
      [
        "1972",
        "Iran",
        "South Korea",
        "Thailand"
      ],
      [
        "1976",
        "Iran",
        "Kuwait",
        "Iran"
      ],
      [
        "1980",
        "Kuwait",
        "South Korea",
        "Kuwait"
      ],
      [
        "1984",
        "Saudi Arabia",
        "China",
        "Singapore"
      ],
      [
        "1988",
        "Saudi Arabia",
        "South Korea",
        "Qatar"
      ],
      [
        "1992",
        "Japan",
        "Saudi Arabia",
        "Japan"
      ],
      [
        "1996",
        "Saudi Arabia",
        "United Arab Emirates",
        "United Arab Emirates"
      ],
      [
        "2000",
        "Japan",
        "Saudi Arabia",
        "Lebanon"
      ],
      [
        "2004",
        "Japan",
        "China",
        "China"
      ],
      [
        "2007",
        "Iraq",
        "Saudi Arabia",
        "Indonesia, Malaysia, Thailand & Vietnam"
      ],
      [
        "2011",
        "Japan",
        "Australia",
        "Qatar"
      ],
      [
        "2015",
        "Australia",
        "South Korea",
        "Australia"
      ],
      [
        "2019",
        "Qatar",
        "Japan",
        "United Arab Emirates"
      ],
      [
        "2023",
        "Qatar",
        "Jordan",
        "Qatar"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most AFC Asian Cup titles?",
        "a": "Japan are the most successful nation with four titles (1992, 2000, 2004 and 2011). Iran and Saudi Arabia follow with three each, while South Korea and Qatar have two apiece."
      },
      {
        "q": "Who won the 2023 AFC Asian Cup?",
        "a": "Qatar won the 2023 AFC Asian Cup, beating Jordan 3–1 in the final in Lusail. The tournament was hosted by Qatar and played in January and February 2024 after being moved from the original host, China."
      },
      {
        "q": "Has any country won the Asian Cup back-to-back?",
        "a": "Yes. Qatar won consecutive titles in 2019 and 2023, becoming the fifth nation to do so after South Korea, Iran, Saudi Arabia and Japan. Iran went furthest, winning three in a row in 1968, 1972 and 1976 — the only nation to achieve a three-peat."
      },
      {
        "q": "Where will the next AFC Asian Cup be held?",
        "a": "The 2027 AFC Asian Cup is scheduled to be hosted by Saudi Arabia. As of July 2026 it has not yet been played, so Qatar remain the reigning champions."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Asian Cup"
  },
  {
    "slug": "concacaf-gold-cup-winners",
    "h1": "Every CONCACAF Gold Cup Winner (1963–2025)",
    "title": "Every CONCACAF Gold Cup Winner (1963–2025) | Ball IQ",
    "description": "Complete list of every CONCACAF Gold Cup winner and its predecessor the CONCACAF Championship, from 1963 to 2025, with runners-up and hosts.",
    "intro": [
      "The CONCACAF Gold Cup is the championship of North America, Central America and the Caribbean, contested every two years by the region's national teams. It took its current name and knockout format in 1991, but its lineage runs back to 1963, when the tournament was played as the CONCACAF Championship. Both eras are included below for the complete continental record.",
      "Two nations tower over the competition. Mexico and the United States have shared almost every Gold Cup trophy since 1991, with Mexico moving to a record ten titles after beating the USA in the 2025 final. Canada is the only other side to break their grip, winning as a surprise in 2000. The earlier Championship years were far more open, with Costa Rica, Guatemala, Haiti and Honduras all lifting the trophy.",
      "The table lists every edition from 1963 to 2025. Note that several early Championship tournaments were decided by a final round-robin group rather than a single final, so the 'runner-up' for those years is the team that finished second in the standings. Recent editions have been co-hosted, most often by the United States and Canada."
    ],
    "columns": [
      "Year",
      "Winner",
      "Runner-up",
      "Host"
    ],
    "rows": [
      [
        "1963",
        "Costa Rica",
        "El Salvador",
        "El Salvador"
      ],
      [
        "1965",
        "Mexico",
        "Guatemala",
        "Guatemala"
      ],
      [
        "1967",
        "Guatemala",
        "Mexico",
        "Honduras"
      ],
      [
        "1969",
        "Costa Rica",
        "Guatemala",
        "Costa Rica"
      ],
      [
        "1971",
        "Mexico",
        "Haiti",
        "Trinidad and Tobago"
      ],
      [
        "1973",
        "Haiti",
        "Trinidad and Tobago",
        "Haiti"
      ],
      [
        "1977",
        "Mexico",
        "Haiti",
        "Mexico"
      ],
      [
        "1981",
        "Honduras",
        "El Salvador",
        "Honduras"
      ],
      [
        "1985",
        "Canada",
        "Honduras",
        "Various (qualifying)"
      ],
      [
        "1989",
        "Costa Rica",
        "United States",
        "Various (qualifying)"
      ],
      [
        "1991",
        "United States",
        "Honduras",
        "United States"
      ],
      [
        "1993",
        "Mexico",
        "United States",
        "Mexico & United States"
      ],
      [
        "1996",
        "Mexico",
        "Brazil",
        "United States"
      ],
      [
        "1998",
        "Mexico",
        "United States",
        "United States"
      ],
      [
        "2000",
        "Canada",
        "Colombia",
        "United States"
      ],
      [
        "2002",
        "United States",
        "Costa Rica",
        "United States"
      ],
      [
        "2003",
        "Mexico",
        "Brazil",
        "Mexico & United States"
      ],
      [
        "2005",
        "United States",
        "Panama",
        "United States"
      ],
      [
        "2007",
        "United States",
        "Mexico",
        "United States"
      ],
      [
        "2009",
        "Mexico",
        "United States",
        "United States"
      ],
      [
        "2011",
        "Mexico",
        "United States",
        "United States"
      ],
      [
        "2013",
        "United States",
        "Panama",
        "United States"
      ],
      [
        "2015",
        "Mexico",
        "Jamaica",
        "Canada & United States"
      ],
      [
        "2017",
        "United States",
        "Jamaica",
        "United States"
      ],
      [
        "2019",
        "Mexico",
        "United States",
        "United States (with Costa Rica & Jamaica)"
      ],
      [
        "2021",
        "United States",
        "Mexico",
        "United States"
      ],
      [
        "2023",
        "Mexico",
        "Panama",
        "Canada & United States"
      ],
      [
        "2025",
        "Mexico",
        "United States",
        "Canada & United States"
      ]
    ],
    "faq": [
      {
        "q": "Who has won the most CONCACAF Gold Cups?",
        "a": "Mexico is the most successful nation with 10 Gold Cup titles, followed by the United States with 7. Counting the CONCACAF Championship era (1963–1989), Mexico and Costa Rica each added three earlier titles as well."
      },
      {
        "q": "Who won the 2025 CONCACAF Gold Cup?",
        "a": "Mexico won the 2025 Gold Cup, beating the United States 2–1 in the final at NRG Stadium in Houston on July 6, 2025. It was Mexico's record-extending tenth title and a second in a row after their 2023 win."
      },
      {
        "q": "Has any team other than Mexico or the USA won the Gold Cup?",
        "a": "Yes. Canada won the Gold Cup in 2000, defeating Colombia in the final. It remains the only Gold Cup title (since 1991) not won by Mexico or the United States."
      },
      {
        "q": "What was the CONCACAF Championship?",
        "a": "The CONCACAF Championship was the tournament's original name from 1963 to 1989, before it was rebranded as the Gold Cup in 1991. Costa Rica won the first edition in 1963, and nations like Guatemala, Haiti and Honduras also lifted the trophy during that era."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Gold Cup"
  },
  {
    "slug": "most-serie-a-titles",
    "h1": "Clubs With the Most Serie A Titles (Scudetti)",
    "title": "Clubs With the Most Serie A Titles, Ranked | Ball IQ",
    "description": "The clubs with the most Serie A titles, ranked by official FIGC-recognised Scudetti — from Juventus and Inter down to every one-time Italian champion.",
    "intro": [
      "Italy's league champions wear the Scudetto, the small tricolour shield sewn onto the following season's shirt, and only sixteen clubs have earned the right to do so since the national championship began in 1898. The competition took its modern round-robin \"Serie A\" form in 1929, but the honours roll is counted continuously from those earliest pioneer-era titles, which is why clubs like Genoa and Pro Vercelli sit high on the all-time list despite not having won in a century.",
      "Three clubs tower over the rest. Juventus lead the way, followed by the two Milan giants, Internazionale and AC Milan — Inter's total stretching back to their 1908 founding and the Ambrosiana-Inter years of the 1930s. Below them, a cluster of historic names from the game's formative decades (Torino, Bologna, Pro Vercelli) share seven apiece, while a modern chasing pack led by Napoli reflects how the balance of power keeps shifting.",
      "One stretch of the record book carries an asterisk. The 2006 Calciopoli scandal saw Juventus stripped of their 2004-05 title, which was left unassigned, and their 2005-06 title, which was reassigned to Inter. Both clubs dispute aspects of the outcome to this day, so the figures below use the counts officially recognised by the FIGC, the Italian federation, with the controversy explained in full."
    ],
    "columns": [
      "Rank",
      "Club",
      "Titles",
      "Notable years"
    ],
    "rows": [
      [
        "1",
        "Juventus",
        "36",
        "First title 1905; five straight 1930–31 to 1934–35; a record nine in a row from 2011–12 to 2019–20. Two further titles (2004–05, 2005–06) were revoked in Calciopoli."
      ],
      [
        "2",
        "Internazionale (Inter)",
        "21",
        "1909–10; the Grande Inter era 1962–66; Ambrosiana-Inter titles of the 1930s; awarded 2005–06; plus 2020–21, 2023–24 and 2025–26."
      ],
      [
        "3",
        "AC Milan",
        "19",
        "1901; the Sacchi–Capello dynasty of the late 1980s and 1990s; 2003–04; 2010–11; most recently 2021–22."
      ],
      [
        "4",
        "Genoa",
        "9",
        "Won six of the first seven Italian championships (1898–1904); last crowned in 1923–24."
      ],
      [
        "5",
        "Torino",
        "7",
        "Il Grande Torino claimed five Scudetti in the 1940s; last title in 1975–76."
      ],
      [
        "5",
        "Bologna",
        "7",
        "A power of the pre-war game, winning from 1924–25 through 1940–41; last in 1963–64."
      ],
      [
        "5",
        "Pro Vercelli",
        "7",
        "Seven titles between 1908 and 1922, one of the sport's original Italian dynasties."
      ],
      [
        "8",
        "Napoli",
        "4",
        "1986–87 and 1989–90 with Diego Maradona; then 2022–23 and 2024–25."
      ],
      [
        "9",
        "Roma",
        "3",
        "1941–42; 1982–83; 2000–01."
      ],
      [
        "10",
        "Fiorentina",
        "2",
        "1955–56 and 1968–69."
      ],
      [
        "10",
        "Lazio",
        "2",
        "1973–74 and 1999–2000."
      ],
      [
        "12",
        "Cagliari",
        "1",
        "1969–70, inspired by Gigi Riva."
      ],
      [
        "12",
        "Casale",
        "1",
        "1913–14."
      ],
      [
        "12",
        "Hellas Verona",
        "1",
        "1984–85, one of the great Serie A upsets."
      ],
      [
        "12",
        "Novese",
        "1",
        "1921–22."
      ],
      [
        "12",
        "Sampdoria",
        "1",
        "1990–91."
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Serie A titles?",
        "a": "Juventus, with 36 Scudetti officially recognised by the FIGC — comfortably ahead of Internazionale on 21 and AC Milan on 19. Juventus also hold the record for the longest winning streak, nine consecutive titles from 2011–12 to 2019–20."
      },
      {
        "q": "What happened to Juventus's 2004-05 and 2005-06 titles?",
        "a": "Following the 2006 Calciopoli refereeing scandal, the FIGC revoked both. The 2004-05 Scudetto was cancelled and left unassigned, so no club holds it. The 2005-06 title was stripped from Juventus and awarded to Inter. Juventus won both on the pitch and still claim the 2004-05 crown, but neither counts toward their recognised total of 36 — hence the difference between Juventus's own tally and the federation's figure used here."
      },
      {
        "q": "Who won the most recent Serie A title?",
        "a": "Inter won the 2025-26 Scudetto, their 21st, finishing clear of Napoli. Before that, Napoli took the 2024-25 title (their fourth) and Inter won 2023-24 (their 20th)."
      },
      {
        "q": "Why does Inter's total include the Ambrosiana-Inter era?",
        "a": "Under Italy's Fascist regime, Inter were forced to merge and play as Ambrosiana (later Ambrosiana-Inter) from 1928 to 1945, winning titles in 1929–30 and the late 1930s under that name. The club is legally continuous, so those Scudetti count toward Inter's all-time total of 21."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "Serie A"
  },
  {
    "slug": "most-fa-cups",
    "h1": "Clubs With the Most FA Cups",
    "title": "Most FA Cups: Clubs Ranked | Ball IQ",
    "description": "Which club has won the most FA Cups? The full ranking of every FA Cup winner by number of titles, from the record holders down.",
    "intro": [
      "The FA Cup, first contested in 1871-72, is the oldest football competition in the world — and over 150 years it has been lifted by dozens of clubs. This page ranks them all by number of wins.",
      "Arsenal lead the way with 14 FA Cups, narrowly ahead of Manchester United on 13. A cluster of historic names — Tottenham, Liverpool, Aston Villa, Chelsea and Manchester City among them — fill out the top of a roll of honour that stretches back to Victorian amateur sides."
    ],
    "columns": [
      "Rank",
      "Club",
      "FA Cups",
      "Years won"
    ],
    "rows": [
      [
        "1",
        "Arsenal",
        "14",
        "1929, 1935, 1949, 1970, 1978, 1992, 1997, 2001, 2002, 2004, 2013, 2014, 2016, 2019"
      ],
      [
        "2",
        "Manchester United",
        "13",
        "1908, 1947, 1962, 1976, 1982, 1984, 1989, 1993, 1995, 1998, 2003, 2015, 2023"
      ],
      [
        "3",
        "Chelsea",
        "8",
        "1969, 1996, 1999, 2006, 2008, 2009, 2011, 2017"
      ],
      [
        "3",
        "Liverpool",
        "8",
        "1964, 1973, 1985, 1988, 1991, 2000, 2005, 2021"
      ],
      [
        "3",
        "Manchester City",
        "8",
        "1903, 1933, 1955, 1968, 2010, 2018, 2022, 2025"
      ],
      [
        "3",
        "Tottenham Hotspur",
        "8",
        "1900, 1920, 1960, 1961, 1966, 1980, 1981, 1990"
      ],
      [
        "7",
        "Aston Villa",
        "7",
        "1886, 1894, 1896, 1904, 1912, 1919, 1956"
      ],
      [
        "8",
        "Blackburn Rovers",
        "6",
        "1883, 1884, 1885, 1889, 1890, 1927"
      ],
      [
        "8",
        "Newcastle United",
        "6",
        "1909, 1923, 1931, 1950, 1951, 1954"
      ],
      [
        "10",
        "Everton",
        "5",
        "1905, 1932, 1965, 1983, 1994"
      ],
      [
        "10",
        "Wanderers",
        "5",
        "1871, 1872, 1875, 1876, 1877"
      ],
      [
        "10",
        "West Bromwich Albion",
        "5",
        "1887, 1891, 1930, 1953, 1967"
      ],
      [
        "13",
        "Bolton Wanderers",
        "4",
        "1922, 1925, 1928, 1957"
      ],
      [
        "13",
        "Sheffield United",
        "4",
        "1898, 1901, 1914, 1924"
      ],
      [
        "13",
        "Wolverhampton Wanderers",
        "4",
        "1892, 1907, 1948, 1959"
      ],
      [
        "16",
        "Sheffield Wednesday",
        "3",
        "1895, 1906, 1934"
      ],
      [
        "16",
        "West Ham United",
        "3",
        "1963, 1974, 1979"
      ],
      [
        "18",
        "Bury",
        "2",
        "1899, 1902"
      ],
      [
        "18",
        "Nottingham Forest",
        "2",
        "1897, 1958"
      ],
      [
        "18",
        "Old Etonians",
        "2",
        "1878, 1881"
      ],
      [
        "18",
        "Portsmouth",
        "2",
        "1938, 2007"
      ],
      [
        "18",
        "Preston North End",
        "2",
        "1888, 1937"
      ],
      [
        "18",
        "Sunderland",
        "2",
        "1936, 1972"
      ],
      [
        "24",
        "Barnsley",
        "1",
        "1911"
      ],
      [
        "24",
        "Blackburn Olympic",
        "1",
        "1882"
      ],
      [
        "24",
        "Blackpool",
        "1",
        "1952"
      ],
      [
        "24",
        "Bradford City",
        "1",
        "1910"
      ],
      [
        "24",
        "Burnley",
        "1",
        "1913"
      ],
      [
        "24",
        "Cardiff City",
        "1",
        "1926"
      ],
      [
        "24",
        "Charlton Athletic",
        "1",
        "1946"
      ],
      [
        "24",
        "Clapham Rovers",
        "1",
        "1879"
      ],
      [
        "24",
        "Coventry City",
        "1",
        "1986"
      ],
      [
        "24",
        "Crystal Palace",
        "1",
        "2024"
      ],
      [
        "24",
        "Derby County",
        "1",
        "1945"
      ],
      [
        "24",
        "Huddersfield Town",
        "1",
        "1921"
      ],
      [
        "24",
        "Ipswich Town",
        "1",
        "1977"
      ],
      [
        "24",
        "Leeds United",
        "1",
        "1971"
      ],
      [
        "24",
        "Leicester City",
        "1",
        "2020"
      ],
      [
        "24",
        "Notts County",
        "1",
        "1893"
      ],
      [
        "24",
        "Old Carthusians",
        "1",
        "1880"
      ],
      [
        "24",
        "Oxford University",
        "1",
        "1873"
      ],
      [
        "24",
        "Royal Engineers",
        "1",
        "1874"
      ],
      [
        "24",
        "Southampton",
        "1",
        "1975"
      ],
      [
        "24",
        "Wigan Athletic",
        "1",
        "2012"
      ],
      [
        "24",
        "Wimbledon",
        "1",
        "1987"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most FA Cups?",
        "a": "Arsenal have won the most FA Cups, with 14, just ahead of Manchester United on 13."
      },
      {
        "q": "How old is the FA Cup?",
        "a": "The FA Cup is the oldest national football competition in the world, first played in the 1871-72 season — 16 years before the Football League existed."
      },
      {
        "q": "Is this every FA Cup winner?",
        "a": "This page ranks clubs by number of wins. For the full season-by-season list of every final, winner, runner-up and score, see our FA Cup winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the FA Cup"
  },
  {
    "slug": "most-copa-libertadores",
    "h1": "Clubs With the Most Copa Libertadores Titles",
    "title": "Most Copa Libertadores Titles: Clubs Ranked | Ball IQ",
    "description": "Which club has won the most Copa Libertadores titles? The full ranking of South America's greatest clubs by continental crowns.",
    "intro": [
      "The Copa Libertadores is South America's premier club competition, the continent's equivalent of the Champions League, contested since 1960. This page ranks every winner by number of titles.",
      "Independiente of Argentina set the benchmark with 7, the most in the tournament's history. Fellow Argentine giants Boca Juniors and Uruguay's Peñarol lead the chase, ahead of the great Brazilian clubs who have dominated the modern era."
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
        "Independiente",
        "7",
        "1964, 1965, 1972, 1973, 1974, 1975, 1984"
      ],
      [
        "2",
        "Boca Juniors",
        "6",
        "1977, 1978, 2000, 2001, 2003, 2007"
      ],
      [
        "3",
        "Peñarol",
        "5",
        "1960, 1961, 1966, 1982, 1987"
      ],
      [
        "4",
        "Estudiantes",
        "4",
        "1968, 1969, 1970, 2009"
      ],
      [
        "4",
        "Flamengo",
        "4",
        "1981, 2019, 2022, 2025"
      ],
      [
        "4",
        "River Plate",
        "4",
        "1986, 1996, 2015, 2018"
      ],
      [
        "7",
        "Grêmio",
        "3",
        "1983, 1995, 2017"
      ],
      [
        "7",
        "Nacional",
        "3",
        "1971, 1980, 1988"
      ],
      [
        "7",
        "Olimpia",
        "3",
        "1979, 1990, 2002"
      ],
      [
        "7",
        "Palmeiras",
        "3",
        "1999, 2020, 2021"
      ],
      [
        "7",
        "Santos",
        "3",
        "1962, 1963, 2011"
      ],
      [
        "7",
        "São Paulo",
        "3",
        "1992, 1993, 2005"
      ],
      [
        "13",
        "Atlético Nacional",
        "2",
        "1989, 2016"
      ],
      [
        "13",
        "Cruzeiro",
        "2",
        "1976, 1997"
      ],
      [
        "13",
        "Internacional",
        "2",
        "2006, 2010"
      ],
      [
        "16",
        "Argentinos Juniors",
        "1",
        "1985"
      ],
      [
        "16",
        "Atlético Mineiro",
        "1",
        "2013"
      ],
      [
        "16",
        "Botafogo",
        "1",
        "2024"
      ],
      [
        "16",
        "Colo-Colo",
        "1",
        "1991"
      ],
      [
        "16",
        "Corinthians",
        "1",
        "2012"
      ],
      [
        "16",
        "Fluminense",
        "1",
        "2023"
      ],
      [
        "16",
        "LDU Quito",
        "1",
        "2008"
      ],
      [
        "16",
        "Once Caldas",
        "1",
        "2004"
      ],
      [
        "16",
        "Racing",
        "1",
        "1967"
      ],
      [
        "16",
        "San Lorenzo",
        "1",
        "2014"
      ],
      [
        "16",
        "Vasco da Gama",
        "1",
        "1998"
      ],
      [
        "16",
        "Vélez Sarsfield",
        "1",
        "1994"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Copa Libertadores titles?",
        "a": "Independiente have won the most, with 7 Copa Libertadores titles."
      },
      {
        "q": "What is the Copa Libertadores?",
        "a": "It is South America's top club competition, played since 1960 — the continental championship whose winner represents CONMEBOL, comparable to the UEFA Champions League in Europe."
      },
      {
        "q": "Is this every Copa Libertadores winner?",
        "a": "This page ranks clubs by titles. For the full year-by-year list, see our Copa Libertadores winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Copa Libertadores"
  },
  {
    "slug": "most-coupe-de-france-titles",
    "h1": "Clubs With the Most Coupe de France Titles",
    "title": "Most Coupe de France Titles: Clubs Ranked | Ball IQ",
    "description": "Which club has won the most Coupe de France titles? The full ranking of every French Cup winner by number of trophies.",
    "intro": [
      "The Coupe de France, France's premier knockout cup, has been contested since 1917-18. This page ranks every winner by number of titles.",
      "Paris Saint-Germain lead the all-time count with 16, having made the competition their own in the modern era. Marseille and a host of historic French clubs make up a deep and varied roll of honour."
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
        "Paris Saint-Germain",
        "16",
        "1981, 1982, 1992, 1994, 1997, 2003, 2005, 2009, 2014, 2015, 2016, 2017, 2019, 2020, 2023, 2024"
      ],
      [
        "2",
        "Marseille",
        "10",
        "1923, 1925, 1926, 1934, 1937, 1942, 1968, 1971, 1975, 1988"
      ],
      [
        "3",
        "Lille",
        "6",
        "1945, 1946, 1947, 1952, 1954, 2010"
      ],
      [
        "3",
        "Saint-Étienne",
        "6",
        "1961, 1967, 1969, 1973, 1974, 1976"
      ],
      [
        "5",
        "Lyon",
        "5",
        "1963, 1966, 1972, 2007, 2011"
      ],
      [
        "5",
        "Monaco",
        "5",
        "1959, 1962, 1979, 1984, 1990"
      ],
      [
        "5",
        "RC Paris",
        "5",
        "1935, 1938, 1939, 1944, 1948"
      ],
      [
        "5",
        "Red Star",
        "5",
        "1920, 1921, 1922, 1927, 1941"
      ],
      [
        "9",
        "Auxerre",
        "4",
        "1993, 1995, 2002, 2004"
      ],
      [
        "9",
        "Bordeaux",
        "4",
        "1940, 1985, 1986, 2012"
      ],
      [
        "9",
        "Nantes",
        "4",
        "1978, 1998, 1999, 2021"
      ],
      [
        "12",
        "Nice",
        "3",
        "1951, 1953, 1996"
      ],
      [
        "12",
        "Rennes",
        "3",
        "1964, 1970, 2018"
      ],
      [
        "12",
        "Strasbourg",
        "3",
        "1950, 1965, 2000"
      ],
      [
        "15",
        "CASG Paris",
        "2",
        "1918, 1924"
      ],
      [
        "15",
        "Guingamp",
        "2",
        "2008, 2013"
      ],
      [
        "15",
        "Metz",
        "2",
        "1983, 1987"
      ],
      [
        "15",
        "Montpellier",
        "2",
        "1928, 1989"
      ],
      [
        "15",
        "Reims",
        "2",
        "1949, 1957"
      ],
      [
        "15",
        "Sedan",
        "2",
        "1955, 1960"
      ],
      [
        "15",
        "Sète",
        "2",
        "1929, 1933"
      ],
      [
        "15",
        "Sochaux",
        "2",
        "1936, 2006"
      ],
      [
        "15",
        "Toulouse",
        "2",
        "1956, 2022"
      ],
      [
        "24",
        "Bastia",
        "1",
        "1980"
      ],
      [
        "24",
        "CA Paris",
        "1",
        "1919"
      ],
      [
        "24",
        "Cannes",
        "1",
        "1931"
      ],
      [
        "24",
        "Club Français",
        "1",
        "1930"
      ],
      [
        "24",
        "ÉF Nancy-Lorraine",
        "1",
        "1943"
      ],
      [
        "24",
        "Excelsior AC Roubaix",
        "1",
        "1932"
      ],
      [
        "24",
        "Le Havre",
        "1",
        "1958"
      ],
      [
        "24",
        "Lens",
        "1",
        "2025"
      ],
      [
        "24",
        "Lorient",
        "1",
        "2001"
      ],
      [
        "24",
        "Nancy",
        "1",
        "1977"
      ],
      [
        "24",
        "No competition",
        "1",
        "1991"
      ],
      [
        "24",
        "Olympique de Pantin",
        "1",
        "1917"
      ]
    ],
    "faq": [
      {
        "q": "Which club has won the most Coupe de France titles?",
        "a": "Paris Saint-Germain have won the most Coupe de France titles, with 16."
      },
      {
        "q": "What is the Coupe de France?",
        "a": "It is France's main domestic knockout cup competition, open to clubs from every level of the French football pyramid, first played in 1917-18."
      },
      {
        "q": "Is this every Coupe de France winner?",
        "a": "This page ranks clubs by titles. For the full season-by-season list, see our Coupe de France winners list."
      }
    ],
    "updated": "2026-07-20",
    "ctaName": "the Coupe de France"
  }
];
