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
  }
];
