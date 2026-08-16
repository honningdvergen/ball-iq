// German club pages — WAVE L1, second language after Italian.
//
// WHY GERMAN
//
// `fußball quiz bundesliga` shows up in GSC at position 48-49 with no German
// page in existence — the same signal Italian gave at 22.8. Demand is real, the
// intent is German, and an English page is answering it.
//
// ⚠️ EXPECT LESS THAN ITALIAN, AND SAY SO UP FRONT. Germany has high English
// proficiency, so the English page genuinely does reach some of this audience —
// which is exactly the argument that killed the naive "localise everything"
// thesis for Turkish club names (see project_localisation_measured: Galatasaray's
// ENGLISH page drew 776 impressions to /tr/'s 11). German is worth building
// because the query is explicitly German-language, not because Germany is big.
//
// THREE CLUBS, NOT FOUR. Bayern, Dortmund and Leverkusen carry Der Klassiker and
// the side that ended Bayern's eleven-year streak, so the cluster tells a story.
// ⚠️ RB LEIPZIG IS DELIBERATELY HELD: only 20 verified questions in the bank,
// below the 22 a full page needs (10 taster + 12 sample). Shipping it would mean
// either a thin page or padding with unverified content, and a thin page on a
// contested term is the /lists mistake. Forge a top-up first, then add it.
//
// ── THE QUESTIONS ARE TRANSLATIONS, NOT NEW WRITING ──────────────────────────
//
// Same contract as clubs-it.mjs / clubs-es.mjs / clubs-pt.mjs / clubs-tr.mjs.
// Every entry carries `id`, the id of the English question it came from, and the
// build enforces that the id resolves and the answer keys still agree.
//
// ⚠️ OPTION ORDER IS PRESERVED EXACTLY so the `a` index still matches. The build
// checks the INDEX, not the text.
// ⚠️ A TRANSLATED PROPER NOUN IN THE ANSWER SLOT NEEDS `en`. German is unusually
// prone to this because it translates competition and club names that English
// leaves alone — Europapokal der Landesmeister, Meister, Mailand.
//
// German register: what the Kurve actually says — Meisterschale, Doppel,
// Klassiker, Revierderby, Werkself, Rekordmeister, "Trainer" not "Manager",
// "Torwart", "Stürmer", "Mittelfeldspieler". Umlauts and ß are load-bearing
// (Mönchengladbach, Säbener Straße, Fußball) — getting them wrong is the tell of
// a machine translation.

export const CLUBS_DE = [
  // ── BAYERN MÜNCHEN ─────────────────────────────────────────────────────────
  {
    club: 'Bayern Munich',
    slug: 'bayern-munich',
    lang: 'de',
    name: 'Bayern München',
    h1: 'Bayern München Quiz',
    title: 'Bayern München Quiz — Der Rekordmeister | Ball IQ',
    description:
      'Kostenloses Bayern-Quiz mit erklärten Antworten: Beckenbauer, Gerd Müller, der Henkelpott-Hattrick, das Triple 2013 und elf Meisterschaften in Folge.',
    kind: 'Vereinsquiz',
    statLine: 'Kostenlos · Bayern-Fragen mit erklärten Antworten · ohne Anmeldung',
    playLabel: 'Quiz starten',
    intro: [
      'Der Rekordmeister, und der Verein, an dem sich in Deutschland alles misst. Dieses kostenlose Quiz führt durch alle Epochen: die verpasste Bundesliga-Gründung 1963, Beckenbauer und der Landesmeister-Hattrick der Siebziger, Gerd Müller, die FC-Hollywood-Jahre, das Wembley-Trauma 1999, das Triple 2013 und elf Meisterschaften nacheinander.',
      'Die Fragen werden wirklich schwer. Wo die Vereinsgeschichte umstritten ist, veröffentlichen wir die Frage lieber gar nicht, als Partei zu ergreifen. Online geht nur, was sich belegen lässt.',
      'Jede Antwort im Bayern-Set hat eine geschriebene Erklärung: Auch wer falsch tippt, lernt etwas darüber, wie der FC Bayern gewonnen hat, was er gewonnen hat.',
    ],
    faq: [
      { q: 'Ist das Bayern-Quiz kostenlos?', a: 'Ja. Es läuft direkt im Browser, ohne Anmeldung und ohne Download. Alle Fragen auf dieser Seite sind kostenlos.' },
      { q: 'Welche Themen deckt das Quiz ab?', a: 'Die Gründung und der verpasste Bundesliga-Start, Beckenbauer, Gerd Müller und Sepp Maier, die drei Landesmeisterpokale in Folge, FC Hollywood, das Finale 1999, Kahn und das Triple 2001, Robbery, das Triple 2013 und 2020, Lewandowski, Kane und die elf Meisterschaften in Folge. Es beginnt leicht und wird richtig schwer.' },
      { q: 'Woher kommen die Fragen?', a: 'Sie werden von Hand geschrieben und von Hand geprüft, nie automatisch erzeugt. Jede Angabe durchläuft vor der Veröffentlichung zwei unabhängige Kontrollen; was sich nicht belegen lässt, erscheint nicht.' },
      { q: 'Gibt es die Ball-IQ-App auf Deutsch?', a: 'Noch nicht: Diese Seite ist auf Deutsch, die App ist auf Englisch. Wir messen erst das Interesse, bevor wir übersetzen — wer bis hierher gelesen hat, hilft uns bei genau dieser Entscheidung.' },
    ],
    taster: [
      { id: 'q_343e60', en: 'Bayern Munich', q: 'Welcher Verein hat mit Abstand die meisten Bundesliga-Meisterschaften gewonnen?', o: ['Borussia Dortmund', 'Bayern München', 'Borussia Mönchengladbach', 'Hamburger SV'], a: 1, hint: 'Bayern hat über 30 deutsche Meisterschaften gesammelt und stellt damit jeden Rivalen in den Schatten.' },
      { id: 'q_6220d2', q: 'Unter welchem furchteinflößenden Spitznamen war Bayerns bester Torjäger aller Zeiten, Gerd Müller, bekannt?', o: ['Der Bomber', 'Der Kaiser', 'Der Titan', 'Die Katze'], a: 0, hint: '«Der Bomber der Nation» traf in den Sechzigern und Siebzigern unerbittlich und ist bis heute Bayerns Rekordtorschütze.' },
      { id: 'q_4c00f0', en: 'Munich\'s slot went to local rivals 1860 Munich', q: 'Bayern wurde 1900 gegründet, war aber bei der Bundesliga-Gründung 1963 nicht dabei. Warum?', o: ['Der Verein war damals zahlungsunfähig', 'Der Münchner Platz ging an den Lokalrivalen 1860 München', 'Er weigerte sich, Profi zu werden', 'Er verbüßte eine Sperre wegen Spielmanipulation'], a: 1, hint: 'Für viele Städte wurde nur ein Verein ausgewählt, und 1860 München war zu der Zeit erfolgreicher — Bayern musste bis 1965 auf den Aufstieg warten.' },
      { id: 'q_02054b', q: 'In den Siebzigern gelang Bayern, was zuvor nur Real Madrid und Ajax geschafft hatten: drei Landesmeisterpokale in Folge. In welchen Jahren?', o: ['1972, 1973, 1974', '1974, 1975, 1976', '1975, 1976, 1977', '1976, 1977, 1978'], a: 1, hint: 'Unter Kapitän Franz Beckenbauer wurde der Hattrick mit einem 1:0 gegen Saint-Étienne in Glasgow perfekt gemacht.' },
      { id: 'q_43ad47', en: 'Der Titan (\'The Titan\')', q: 'Torwart Oliver Kahn war für Bayern so dominant, dass ihm die Presse einen wuchtigen Spitznamen gab. Welchen?', o: ['Der Kaiser', 'Der Titan', 'Der Bomber', 'Die Mauer'], a: 1, hint: 'Er gewann bei der WM 2002 den Goldenen Ball — als einziger Torwart, der je zum besten Spieler eines Turniers gewählt wurde.' },
      { id: 'q_38ebea', en: 'United scored twice in injury time to win 2-1', q: 'Das Champions-League-Finale 1999 ist für Bayern-Fans ein Albtraum. Was geschah in den Schlussminuten gegen Manchester United?', o: ['Bayern verschoss in letzter Minute einen Elfmeter', 'United traf zweimal in der Nachspielzeit und gewann 2:1', 'Das Spiel wurde wegen Ausschreitungen abgebrochen', 'Bayerns Torwart sah Rot'], a: 1, hint: 'Mario Basler hatte Bayern früh in Führung gebracht, doch Sheringham und Solskjær trafen im Camp Nou in der Nachspielzeit.' },
      { id: 'q_9f571e', q: 'Arjen Robbens Treffer in der 89. Minute in Wembley 2013 machte Bayerns erstes Triple perfekt. Wen schlug man in diesem rein deutschen Finale?', o: ['Schalke 04', 'Bayer Leverkusen', 'Borussia Dortmund', 'RB Leipzig'], a: 2, hint: 'Jupp Heynckes’ Mannschaft gewann das Klassiker-Endspiel 2:1; Boateng und Ribéry legten Robben den entscheidenden Treffer auf.' },
      { id: 'q_f58f72', q: 'Welchen Stürmer holte Bayern 2014 ablösefrei und damit ausgerechnet vom Erzrivalen Borussia Dortmund?', o: ['Mario Gómez', 'Robert Lewandowski', 'Mario Mandžukić', 'Miroslav Klose'], a: 1, hint: 'Er ließ seinen Vertrag in Dortmund auslaufen und kam für null Euro — und wurde einer der tödlichsten Torjäger der Bayern-Geschichte.' },
      { id: 'q_d201eb', en: '11 in a row', q: 'Bayern stellte mit wie vielen Meisterschaften in Folge zwischen 2013 und 2023 den Rekord der fünf großen Ligen auf?', o: ['8 in Folge', '9 in Folge', '11 in Folge', '13 in Folge'], a: 2, hint: 'Die Serie lief von 2013 bis 2023 und wurde erst von Xabi Alonsos ungeschlagenem Bayer Leverkusen 2024 beendet.' },
      { id: 'q_6ce680', en: 'Robben and Ribéry', q: 'Das Flügelduo mit dem Spitznamen «Robbery» quälte fast ein Jahrzehnt lang gegnerische Abwehrreihen. Welche zwei Spieler waren das?', o: ['Robben und Ribéry', 'Robben und Rummenigge', 'Robben und Müller', 'Ribéry und Rafinha'], a: 0, hint: 'Der gemeinsame Spitzname ist ein Kofferwort aus beiden Nachnamen; das Duo legte im Finale 2013 den Siegtreffer auf.' },
    ],
    sample: [
      { id: 'q_6cb3a9', en: 'The Olympiastadion', q: 'Vor dem Umzug in die Allianz Arena 2005 spielte Bayern über drei Jahrzehnte in welchem Münchner Stadion?', o: ['Im Westfalenstadion', 'Im Olympiastadion', 'Im Grünwalder Stadion', 'Im Volksparkstadion'], a: 1, hint: 'Für die Olympischen Spiele 1972 mit dem berühmten Zeltdach gebaut, war es 1974 Schauplatz des WM-Finales zwischen der BRD und den Niederlanden.' },
      { id: 'q_adec1a', en: 'Change the colour of its entire exterior', q: 'Als die Allianz Arena 2005 eröffnet wurde, konnte sie etwas, das kein Stadion der Welt zuvor konnte. Was?', o: ['Ein vollständig einfahrbares Dach besitzen', 'Die Farbe der gesamten Außenhülle wechseln', 'Über 100.000 Zuschauer fassen', 'Den kompletten Rasen unter die Erde fahren'], a: 1, hint: 'Die aufgeblasenen ETFE-Kissen leuchten für Bayern rot; die bauchige Form brachte ihr den Münchner Spitznamen «Schlauchboot» ein.' },
      { id: 'q_a2422f', q: 'Bayerns Trainingsgelände und Geschäftsstelle liegen an einer berühmten Münchner Straße, die für den Verein selbst steht. Wie heißt sie?', o: ['Säbener Straße', 'Marienplatz', 'Leopoldstraße', 'Olympiastraße'], a: 0, hint: 'Deutsche Journalisten benutzen den Straßennamen oft als Kürzel für «die Machtzentrale des FC Bayern».' },
      { id: 'q_50a3a4', en: 'Off-pitch drama and scandals dominated the headlines', q: 'In den Neunzigern bekam Bayern den Spitznamen «FC Hollywood». Womit hatte man ihn sich verdient?', o: ['Die Spieler traten in mehreren Filmen auf', 'Dramen und Skandale abseits des Platzes beherrschten die Schlagzeilen', 'Mit amerikanischen Sponsorenverträgen', 'Der Verein kaufte ein Franchise in Los Angeles'], a: 1, hint: 'Fehden wie Matthäus gegen Klinsmann und Effenbergs Boulevard-Affären sorgten dafür, dass die Mannschaft in den Zeitungen lauter war als auf dem Platz.' },
      { id: 'q_c3e323', en: 'A penalty shootout', q: 'Bayerns Champions-League-Finalsieg 2001 gegen Valencia wurde auf welche dramatische Weise entschieden?', o: ['Durch ein Eigentor in der Verlängerung', 'Im Elfmeterschießen', 'Durch ein Golden Goal', 'Durch einen Kopfball in letzter Minute'], a: 1, hint: 'Nach einem 1:1 im Mailänder San Siro wurde Oliver Kahn zum Helden vom Punkt und hielt drei Elfmeter.' },
      { id: 'q_77c2da', q: 'Am 22. September 2015 stellte ein Bayern-Einwechselspieler gegen Wolfsburg in einem Spiel VIER Guinness-Weltrekorde auf. Wer war es?', o: ['Thomas Müller', 'Robert Lewandowski', 'Arjen Robben', 'Mario Mandžukić'], a: 1, hint: 'Er kam beim Stand von 0:1 von der Bank und traf fünfmal in unter neun Minuten — die schnellsten fünf Tore der Bundesliga-Geschichte.' },
      { id: 'q_f529df', en: 'The \'Raumdeuter\' (space interpreter)', q: 'Thomas Müller erfand einen augenzwinkernden Begriff für seinen eigenen, unorthodoxen Spielstil. Wie nannte er sich?', o: ['Der «Raumdeuter»', 'Der «Torjäger»', 'Der «Spielmacher»', 'Der «Libero»'], a: 0, hint: 'Er warf das Wort 2011 in einem Interview hin, um seine Stärke zu erklären: gefährlich zu sein OHNE den Ball.' },
      { id: 'q_d2ea22', en: 'An 8-2 quarter-final demolition of Barcelona', q: 'Auf dem Weg zum Champions-League-Sieg 2019/20 produzierte Bayern eines der schockierendsten K.-o.-Ergebnisse der Wettbewerbsgeschichte. Welches?', o: ['Ein 8:2 im Viertelfinale gegen Barcelona', 'Ein 7:1 gegen Real Madrid', 'Ein 6:0 gegen Liverpool', 'Ein 5:0 gegen PSG'], a: 0, hint: 'Die Abreibung von Lissabon — gekrönt von Ex-Barça-Mann Coutinho, der zweimal gegen seinen Stammverein traf.' },
      { id: 'q_a7066b', q: 'Das Champions-League-Finale 2020, das Triple perfekt machte, gewann Bayern 1:0 gegen PSG — durch einen Spieler aus PSGs eigener Jugend. Wer traf?', o: ['Serge Gnabry', 'Kingsley Coman', 'Leroy Sané', 'Robert Lewandowski'], a: 1, hint: 'Der französische Flügelspieler köpfte gegen den Verein seiner Kindheit ein — eine bittersüße Pointe im leeren Stadion des «Corona-Finales» von Lissabon.' },
      { id: 'q_dac572', q: 'Bayerns Rekordtransfer ist (Stand 2026) ein Stürmer, der 2023 für rund 95 Millionen Euro kam. Wer?', o: ['Harry Kane', 'Sadio Mané', 'Matthijs de Ligt', 'Lucas Hernández'], a: 0, hint: 'Er löste Verteidiger Lucas Hernández als Rekordeinkauf ab und pulverisierte prompt die Torrekorde einer Debütsaison.' },
      { id: 'q_685e2d', en: 'The 1950s', q: 'Bayern ist in seiner Geschichte nur ein einziges Mal aus der obersten Spielklasse abgestiegen. In welchem Jahrzehnt?', o: ['In den 1930ern', 'In den 1950ern', 'In den 1960ern', 'Das ist nie passiert'], a: 1, hint: 'Der Abstieg kam 1955, Jahre bevor es die Bundesliga überhaupt gab — und blieb der einzige der gesamten Vereinsgeschichte.' },
      { id: 'q_ecc04e', en: '\'The Cat from Anzing\'', q: 'Sepp Maier, Bayerns Torwart der goldenen Siebziger, trug einen eigenwilligen Spitznamen, der auf seine Beweglichkeit anspielte. Wie hieß er?', o: ['«Die Katze von Anzing»', '«Die Spinne»', '«Der Krake»', '«Der Panther»'], a: 0, hint: 'Die «Katze von Anzing» war für ihre Reflexe bekannt — und dafür, einmal mitten im Spiel eine Ente über den Platz gejagt zu haben.' },
    ],
    copy: {
      tasterEyebrow: 'Kostenlos testen · Ohne Anmeldung',
      tasterH: 'Wie gut kennst du den FC Bayern wirklich?',
      tasterPh: 'Zehn schnelle Fragen, um deinen Bayern-Ball-IQ zu messen.',
      tasterNote: 'Beispielfragen — im vollständigen Quiz warten viel mehr.',
      playSection: 'Das Bayern-Quiz spielen',
      playSub: 'Tippe auf eine Antwort — sofortige Auflösung und die Geschichte dahinter.',
      faqH: 'Bayern München Quiz — Häufige Fragen',
      aboutQ: 'Über das Bayern-Quiz',
      bandH: 'Du denkst, du kennst den Rekordmeister? Beweise es in der App.',
      bandP: 'Siegesserien, 1-gegen-1 in Echtzeit und eine Wertung von 99 — alle Quizze in einer App. Die App ist auf Englisch.',
      alsoH: 'Dieselbe Seite auf Englisch',
      alsoP: 'Das ist die deutsche Fassung unseres Bayern-Quiz. Alle Fragen im Original:',
      alsoLink: 'Bayern Munich quiz (English)',
      statsLine: 'Die Bayern-Fragen bei Ball IQ verteilen sich auf drei Schwierigkeitsgrade — leicht, mittel und schwer — alle mit Erklärung.',
    },
  },

  // ── BORUSSIA DORTMUND ──────────────────────────────────────────────────────
  {
    club: 'Borussia Dortmund',
    slug: 'borussia-dortmund',
    lang: 'de',
    name: 'Borussia Dortmund',
    h1: 'Borussia Dortmund Quiz',
    title: 'Borussia Dortmund Quiz — BVB und die Gelbe Wand | Ball IQ',
    description:
      'Kostenloses BVB-Quiz mit erklärten Antworten: Echte Liebe, die Gelbe Wand, das Finale 1997, Klopps Heavy Metal, Haaland und Wembley 2024.',
    kind: 'Vereinsquiz',
    statLine: 'Kostenlos · BVB-Fragen mit erklärten Antworten · ohne Anmeldung',
    playLabel: 'Quiz starten',
    intro: [
      'Echte Liebe, und die größte Stehplatztribüne Europas. Dieses kostenlose Quiz führt durch die gesamte BVB-Geschichte: der erste Europapokal für einen deutschen Verein 1966, die drei Alfredos der Fünfziger, Hitzfelds goldene Neunziger und Rickens Heber 1997, die Beinahe-Insolvenz, Klopps Heavy Metal, Haalands Debüt-Hattrick und das Wembley-Finale 2024.',
      'Die Fragen werden wirklich schwer. Wo die Vereinsgeschichte umstritten ist, veröffentlichen wir die Frage lieber gar nicht, als Partei zu ergreifen. Online geht nur, was sich belegen lässt.',
      'Jede Antwort im BVB-Set hat eine geschriebene Erklärung: Auch wer falsch tippt, lernt etwas über den Verein.',
    ],
    faq: [
      { q: 'Ist das BVB-Quiz kostenlos?', a: 'Ja. Es läuft direkt im Browser, ohne Anmeldung und ohne Download. Alle Fragen auf dieser Seite sind kostenlos.' },
      { q: 'Welche Themen deckt das Quiz ab?', a: 'Die Gründung 1909 am Borsigplatz, die drei Alfredos, der Europapokalsieg 1966, das Westfalenstadion und die Gelbe Wand, Hitzfeld und das Finale 1997, die Finanzkrise, Klopp und Gegenpressing, Lewandowski, Götze, Sancho und Haaland, der Anschlag auf den Mannschaftsbus 2017 und Wembley 2024. Es beginnt leicht und wird richtig schwer.' },
      { q: 'Woher kommen die Fragen?', a: 'Sie werden von Hand geschrieben und von Hand geprüft, nie automatisch erzeugt. Jede Angabe durchläuft vor der Veröffentlichung zwei unabhängige Kontrollen; was sich nicht belegen lässt, erscheint nicht.' },
      { q: 'Gibt es die Ball-IQ-App auf Deutsch?', a: 'Noch nicht: Diese Seite ist auf Deutsch, die App ist auf Englisch. Wir messen erst das Interesse, bevor wir übersetzen — wer bis hierher gelesen hat, hilft uns bei genau dieser Entscheidung.' },
    ],
    taster: [
      { id: 'q_fd7d13', en: 'Ballspielverein Borussia', q: 'Borussia Dortmund wird «BVB» genannt. Wofür steht die Abkürzung eigentlich?', o: ['Ballspielverein Borussia', 'Bundesliga Verein Borussia', 'Borussia Vereinsbund', 'Ballklub Verein Borussia'], a: 0, hint: 'BVB = Ballspielverein Borussia 09 e.V. Dortmund; die «09» steht für die Gründung 1909 in der Gaststätte «Zum Wildschütz» am Borsigplatz.' },
      { id: 'q_2bd86f', q: 'Das offizielle Motto von Borussia Dortmund besteht aus zwei Wörtern, die die Bindung zwischen Verein und Fans fassen. Welche?', o: ['Echte Liebe', 'Niemals allein', 'Wahre Treue', 'Schwarz-Gelb'], a: 0, hint: '«Echte Liebe» entstand 2009 aus einer Markenkampagne über Treue, Intensität und bedingungslose Hingabe.' },
      { id: 'q_8504a0', en: 'Largest standing terrace in European football', q: 'Die berühmte Südtribüne trägt den Namen «Die Gelbe Wand» aus einem bestimmten Grund. Welchen Rekord hält sie?', o: ['Größte Stehplatztribüne im europäischen Fußball', 'Steilste Tribüne aller Stadien', 'Lautestes je gemessenes Publikum der Welt', 'Älteste durchgehend genutzte Tribüne Deutschlands'], a: 0, hint: 'Rund 25.000 Stehplätze machen sie zur größten Stehtribüne Europas und zu einem Hauptgrund, warum der Signal Iduna Park so einschüchternd ist.' },
      { id: 'q_58a5d9', q: 'Das hitzige Lokalderby des BVB, das Revierderby, wird gegen welchen benachbarten Ruhrgebietsverein ausgetragen?', o: ['Schalke 04', 'Bayern München', '1. FC Köln', 'Hertha BSC'], a: 0, hint: 'Das Revierderby gegen Schalke 04 ist eine der aufgeladensten Rivalitäten im deutschen Fußball.' },
      { id: 'q_d9d32d', q: 'Wie hieß das Dortmunder Stadion traditionell, bevor es den Sponsorennamen Signal Iduna Park bekam?', o: ['Westfalenstadion', 'Volksparkstadion', 'Olympiastadion', 'Signal Arena'], a: 0, hint: 'Die Spielstätte wurde 1974 als Westfalenstadion eröffnet und wird bis heute überwiegend so genannt.' },
      { id: 'q_577008', en: 'The first German club to win a European trophy', q: '1966 gelang dem BVB mit einem 2:1 nach Verlängerung gegen Liverpool im Hampden Park eine deutsche Premiere. Was machte dieser Sieg aus ihm?', o: ['Den ersten deutschen Verein mit einem Europapokalsieg', 'Den ersten deutschen Verein, der in Wembley spielte', 'Den ersten deutschen Verein im Europapokal der Landesmeister', 'Den ersten deutschen Verein mit einem ausländischen Trainer'], a: 0, hint: 'Der Europapokal der Pokalsieger 1966, gewonnen durch Tore von Sigfried Held und Reinhard Libuda, war der erste europäische Titel für einen deutschen Verein.' },
      { id: 'q_39bd9d', en: 'Juventus', q: 'Im Champions-League-Finale 1997 kam der 20-jährige Lars Ricken von der Bank und lupfte den Ball 16 Sekunden später ins Tor. Welchen Giganten schlug Dortmund an jenem Abend in München 3:1?', o: ['Juventus Turin', 'Real Madrid', 'Manchester United', 'Ajax Amsterdam'], a: 0, hint: 'Dortmund bezwang den Titelverteidiger um Alessandro Del Piero; Karl-Heinz Riedles Doppelpack und Rickens Sofort-Heber entschieden das Spiel.' },
      { id: 'q_eca4da', en: 'Heavy metal', q: 'Jürgen Klopp stellte seinen Stil einmal dem Arsenal von Arsène Wenger gegenüber und nannte dessen Spiel «ein Orchester … ein leises Lied». Was zog er vor?', o: ['Heavy Metal', 'Punkrock', 'Lauten Jazz', 'Eine Blaskapelle'], a: 0, hint: '«Ich mag Heavy Metal lieber. Ich will es immer laut» — das Zitat gab Klopps Gegenpressing-Dortmund seinen Beinamen.' },
      { id: 'q_8d1fe8', q: 'Am 18. Januar 2020 kam ein Teenager bei seinem BVB-Debüt gegen Augsburg von der Bank und traf binnen 23 Minuten dreifach. Wer stellte sich so vor?', o: ['Erling Haaland', 'Youssoufa Moukoko', 'Donyell Malen', 'Karim Adeyemi'], a: 0, hint: 'Es war der erste Debüt-Hattrick eines Einwechselspielers der Bundesliga-Geschichte. Der Norweger traf danach 86-mal in 89 Spielen.' },
      { id: 'q_019c1e', en: 'Bayern Munich', q: 'Welchem Bundesliga-Rivalen schloss sich Torjäger Robert Lewandowski 2014 ablösefrei an, als er Dortmund verließ?', o: ['Bayern München', 'RB Leipzig', 'Bayer Leverkusen', 'Schalke 04'], a: 0, hint: 'Lewandowski ließ seinen Vertrag auslaufen und wechselte 2014 ablösefrei zu Bayern München — was die Rivalität weiter vertiefte.' },
    ],
    sample: [
      { id: 'q_c608fa', en: '1950s', q: 'Die ersten beiden deutschen Meisterschaften des BVB erzielte eine Sturmreihe mit dem Spitznamen «die drei Alfredos» — Preißler, Kelbassa und Niepieklo. In welchem Jahrzehnt kamen diese Titel?', o: ['In den 1950ern', 'In den 1940ern', 'In den 1960ern', 'In den 1930ern'], a: 0, hint: 'Alle drei Stürmer hießen tatsächlich Alfred. Sie führten Dortmund 1956 und 1957 zu aufeinanderfolgenden Titeln.' },
      { id: 'q_ec6d8d', en: 'Cologne', q: 'Das Westfalenstadion wurde nur deshalb zur WM 1974 gebaut, weil eine andere Stadt absprang und Mittel frei wurden. Wessen Rückzug bescherte Dortmund sein Stadion?', o: ['Köln', 'Düsseldorf', 'Essen', 'Wuppertal'], a: 0, hint: 'Das geplante WM-Stadion der Domstadt lag fast beim Vierfachen des Budgets, also stieg sie 1971 aus.' },
      { id: 'q_a097ce', q: 'Welcher Trainer führte Dortmund 1995 und 1996 zu zwei Meisterschaften in Folge und 1997 zum Champions-League-Triumph?', o: ['Ottmar Hitzfeld', 'Nevio Scala', 'Matthias Sammer', 'Udo Lattek'], a: 0, hint: 'Hitzfeld formte die goldene Ära der Mitte der Neunziger: zwei Meisterschaften, dann der Europapokal gegen Juventus 1997.' },
      { id: 'q_e9bed7', q: 'Welche Vereinslegende hält mit 572 Pflichtspielen zwischen 1981 und 1998 den BVB-Rekord für die meisten Einsätze?', o: ['Michael Zorc', 'Lars Ricken', 'Roman Weidenfeller', 'Sebastian Kehl'], a: 0, hint: 'Der gebürtige Dortmunder Zorc, verlässlicher Elfmeterschütze und langjähriger Kapitän, wurde später Sportdirektor des Vereins.' },
      { id: 'q_9722a6', en: 'Bayern Munich', q: 'Anfang der 2000er stand Dortmund mit gemeldeten Schulden von rund 200 Millionen Euro kurz vor der Insolvenz. Welcher Erzrivale lieh laut Uli Hoeneß still zwei Millionen, um die Gehälter zu sichern?', o: ['Bayern München', 'Schalke 04', 'Bayer Leverkusen', 'VfB Stuttgart'], a: 0, hint: 'Hoeneß sagte, Bayern habe das Darlehen ohne Sicherheiten gegeben; BVB-Chef Hans-Joachim Watzke bestritt später, je darum gebeten zu haben.' },
      { id: 'q_722107', q: 'Klopps erste Meisterschaft 2010/11 baute auf einer bemerkenswert jungen Mannschaft. Welchen Mittelfeldspieler aus der eigenen Jugend verlor er 2013 ausgerechnet an Bayern?', o: ['Mario Götze', 'İlkay Gündoğan', 'Nuri Şahin', 'Sven Bender'], a: 0, hint: 'Götzes Ausstiegsklausel über 37 Millionen wurde im April 2013 gezogen, Wochen vor dem rein deutschen Champions-League-Finale der beiden Vereine.' },
      { id: 'q_e2fd06', q: 'Am 11. April 2017 wurde der Mannschaftsbus des BVB auf dem Weg zu einem Champions-League-Viertelfinale von drei Sprengsätzen erschüttert. Welcher Spieler wurde von Glassplittern verletzt?', o: ['Marc Bartra', 'Sokratis Papastathopoulos', 'Łukasz Piszczek', 'Nuri Şahin'], a: 0, hint: 'Bartra musste am Handgelenk operiert werden; der Täter, der auf einen Kurssturz der BVB-Aktie spekuliert hatte, wurde später zu 14 Jahren Haft verurteilt.' },
      { id: 'q_537655', en: 'Barcelona', q: 'Nach nur einer glänzenden Saison verkaufte Dortmund den französischen Flügelspieler Ousmane Dembélé 2017 an welchen Verein, für eine Summe, die über 140 Millionen steigen konnte?', o: ['FC Barcelona', 'Real Madrid', 'Paris Saint-Germain', 'Bayern München'], a: 0, hint: 'Dembélé erzwang 2017 den Wechsel zum FC Barcelona — eine der höchsten Ablösen, die der BVB je erhalten hat.' },
      { id: 'q_53516e', q: 'An welchen Verein verkaufte Dortmund 2021 den englischen Flügelspieler Jadon Sancho für über 70 Millionen Pfund?', o: ['Manchester United', 'Chelsea', 'Liverpool', 'Manchester City'], a: 0, hint: 'Sancho wechselte 2021 zu Manchester United, nachdem er seit seinem Wechsel aus Citys Akademie 2017 beim BVB geglänzt hatte.' },
      { id: 'q_9be600', q: '2024 erreichte Borussia Dortmund das Champions-League-Finale in Wembley und verlor 0:2. Wer verwehrte den Titel und holte den rekordverlängernden fünfzehnten?', o: ['Real Madrid', 'Manchester City', 'Bayern München', 'Paris Saint-Germain'], a: 0, hint: 'Es war Dortmunds drittes Endspiel und der zweite Wembley-Schmerz; Trainer Edin Terzić trat keine zwei Wochen später zurück.' },
      { id: 'q_e08e00', q: 'Marco Reus, der BVB-Fan aus Kindertagen, der Kapitän wurde, beendete 2024 seine zwölf Jahre beim Verein. Wohin ging er?', o: ['LA Galaxy', 'Inter Miami', 'Al-Hilal', 'Toronto FC'], a: 0, hint: 'Reus stand in seiner ersten (2013) und seiner letzten (2024) BVB-Saison im Champions-League-Finale und gewann kurz darauf den MLS Cup mit LA Galaxy.' },
      { id: 'q_aa4ebb', q: 'Nach seinem Abschied von Borussia Dortmund 2015 übernahm Jürgen Klopp im Oktober desselben Jahres welchen englischen Verein?', o: ['Liverpool', 'Chelsea', 'Manchester City', 'Arsenal'], a: 0, hint: 'Klopp ging im Oktober 2015 zu Liverpool und gewann dort später die Champions League und die Premier League.' },
    ],
    copy: {
      tasterEyebrow: 'Kostenlos testen · Ohne Anmeldung',
      tasterH: 'Wie gut kennst du den BVB wirklich?',
      tasterPh: 'Zehn schnelle Fragen, um deinen BVB-Ball-IQ zu messen.',
      tasterNote: 'Beispielfragen — im vollständigen Quiz warten viel mehr.',
      playSection: 'Das BVB-Quiz spielen',
      playSub: 'Tippe auf eine Antwort — sofortige Auflösung und die Geschichte dahinter.',
      faqH: 'Borussia Dortmund Quiz — Häufige Fragen',
      aboutQ: 'Über das BVB-Quiz',
      bandH: 'Du denkst, du kennst die Gelbe Wand? Beweise es in der App.',
      bandP: 'Siegesserien, 1-gegen-1 in Echtzeit und eine Wertung von 99 — alle Quizze in einer App. Die App ist auf Englisch.',
      alsoH: 'Dieselbe Seite auf Englisch',
      alsoP: 'Das ist die deutsche Fassung unseres BVB-Quiz. Alle Fragen im Original:',
      alsoLink: 'Borussia Dortmund quiz (English)',
      statsLine: 'Die BVB-Fragen bei Ball IQ verteilen sich auf drei Schwierigkeitsgrade — leicht, mittel und schwer — alle mit Erklärung.',
    },
  },

  // ── BAYER LEVERKUSEN ───────────────────────────────────────────────────────
  {
    club: 'Bayer Leverkusen',
    slug: 'bayer-leverkusen',
    lang: 'de',
    name: 'Bayer Leverkusen',
    h1: 'Bayer Leverkusen Quiz',
    title: 'Bayer Leverkusen Quiz — Die Werkself | Ball IQ',
    description:
      'Kostenloses Leverkusen-Quiz mit erklärten Antworten: der UEFA-Cup 1988, Neverkusen und 2002, Ulf Kirsten, Ballack, Wirtz und das Double 2024.',
    kind: 'Vereinsquiz',
    statLine: 'Kostenlos · Leverkusen-Fragen mit erklärten Antworten · ohne Anmeldung',
    playLabel: 'Quiz starten',
    intro: [
      'Jahrzehntelang der Verein der zweiten Plätze — bis eine ungeschlagene Saison alles umschrieb. Dieses kostenlose Quiz umfasst die ganze Geschichte der Werkself: der UEFA-Cup 1988 gegen Espanyol, Ulf Kirstens Tore, das Dreifach-Zweiter von 2002 und das Finale gegen Real Madrid, Ballack, Havertz und Son — und schließlich Xabi Alonso, die erste Meisterschale und das Double 2024.',
      'Die Fragen werden wirklich schwer. Wo die Vereinsgeschichte umstritten ist, veröffentlichen wir die Frage lieber gar nicht, als Partei zu ergreifen. Online geht nur, was sich belegen lässt.',
      'Jede Antwort im Leverkusen-Set hat eine geschriebene Erklärung: Auch wer falsch tippt, lernt etwas über den Verein.',
    ],
    faq: [
      { q: 'Ist das Leverkusen-Quiz kostenlos?', a: 'Ja. Es läuft direkt im Browser, ohne Anmeldung und ohne Download. Alle Fragen auf dieser Seite sind kostenlos.' },
      { q: 'Welche Themen deckt das Quiz ab?', a: 'Die Gründung durch Bayer-Werksangehörige, der UEFA-Cup 1988, Ulf Kirsten und Michael Ballack, die Saison 2001/02 mit drei zweiten Plätzen, das Finale gegen Real Madrid, Berbatov, Son und Havertz, Xabi Alonso, die ungeschlagene Meistersaison und das Double 2024. Es beginnt leicht und wird richtig schwer.' },
      { q: 'Woher kommen die Fragen?', a: 'Sie werden von Hand geschrieben und von Hand geprüft, nie automatisch erzeugt. Jede Angabe durchläuft vor der Veröffentlichung zwei unabhängige Kontrollen; was sich nicht belegen lässt, erscheint nicht.' },
      { q: 'Gibt es die Ball-IQ-App auf Deutsch?', a: 'Noch nicht: Diese Seite ist auf Deutsch, die App ist auf Englisch. Wir messen erst das Interesse, bevor wir übersetzen — wer bis hierher gelesen hat, hilft uns bei genau dieser Entscheidung.' },
    ],
    taster: [
      { id: 'q_ef70d5', q: 'In welchem Stadion trägt Bayer Leverkusen seine Heimspiele aus?', o: ['Signal Iduna Park', 'BayArena', 'Allianz Arena', 'Veltins-Arena'], a: 1, hint: 'Die Spielstätte an der Bismarckstraße trägt seit 1998 den Namen BayArena; die drei anderen gehören Dortmund, Bayern und Schalke.' },
      { id: 'q_cf271c', q: 'Unter welchem Spitznamen ist Bayer Leverkusen allgemein bekannt?', o: ['Die Fohlen', 'Die Knappen', 'Die Werkself', 'Die Roten Bullen'], a: 2, hint: '«Die Werkself» verweist auf die Gründung 1904 durch Angestellte des Bayer-Werks. «Die Fohlen» sind Mönchengladbach.' },
      { id: 'q_fb3d9c', en: 'Red and black', q: 'Welches sind die traditionellen Vereinsfarben von Bayer Leverkusen?', o: ['Rot und Schwarz', 'Blau und Weiß', 'Grün und Weiß', 'Gelb und Schwarz'], a: 0, hint: 'Leverkusen spielt seit Jahrzehnten in Rot und Schwarz, mit dem Bayer-Kreuz im Wappen.' },
      { id: 'q_3f420c', en: 'UEFA Cup', q: 'Leverkusen gewann 1988 seinen ersten großen Europapokal. Welchen Wettbewerb?', o: ['Den Europapokal der Landesmeister', 'Den UEFA-Cup', 'Den Europapokal der Pokalsieger', 'Den UEFA-Superpokal'], a: 1, hint: 'Leverkusen holte 1988 den UEFA-Cup — bis heute der einzige Europapokal des Vereins.' },
      { id: 'q_31cbb5', q: 'Unter welchem Trainer gewann Leverkusen 2023/24 die erste Meisterschaft der Vereinsgeschichte?', o: ['Thomas Tuchel', 'Julian Nagelsmann', 'Xabi Alonso', 'Jürgen Klopp'], a: 2, hint: 'Xabi Alonso, im Oktober 2022 verpflichtet, führte Leverkusen in seiner ersten vollen Saison zur Meisterschale.' },
      { id: 'q_4ecb63', q: 'Leverkusen erreichte 2002 das Champions-League-Finale. Welcher Verein gewann?', o: ['Juventus Turin', 'AC Mailand', 'Real Madrid', 'FC Barcelona'], a: 2, hint: 'Real Madrid gewann am 15. Mai 2002 im Hampden Park in Glasgow 2:1 und holte den neunten Europapokal.' },
      { id: 'q_2e6094', en: 'Zinedine Zidane', q: 'Welcher französische Spieler erzielte den spektakulären Volleytreffer mit links, der das Finale 2002 gegen Leverkusen entschied?', o: ['Thierry Henry', 'Zinédine Zidane', 'David Trezeguet', 'Patrick Vieira'], a: 1, hint: 'Zidane nahm die hohe Flanke von Roberto Carlos kurz vor der Pause volley und stellte auf 2:1 für Real Madrid.' },
      { id: 'q_c070ca', q: 'Wer ist Bayer Leverkusens bester Bundesliga-Torschütze aller Zeiten?', o: ['Stefan Kießling', 'Ulf Kirsten', 'Rudi Völler', 'Karim Bellarabi'], a: 1, hint: 'Ulf Kirsten traf zwischen 1990 und 2003 über 180-mal in der Bundesliga für Leverkusen und war dreimal Torschützenkönig.' },
      { id: 'q_f27da0', en: 'Bayern Munich', q: 'Michael Ballack verließ Leverkusen 2002 in Richtung welches Vereins?', o: ['Werder Bremen', 'Schalke 04', 'Borussia Dortmund', 'Bayern München'], a: 3, hint: 'Ballack wechselte im Sommer 2002 nach drei Jahren in Leverkusen zu Bayern München und gewann dort im ersten Jahr das Double.' },
      { id: 'q_4c740d', q: 'Kai Havertz wurde 2020 von Leverkusen an welchen Verein verkauft?', o: ['Chelsea', 'Manchester United', 'Liverpool', 'Manchester City'], a: 0, hint: 'Havertz wechselte im September 2020 zu Chelsea und erzielte in derselben Saison den Siegtreffer im Champions-League-Finale.' },
    ],
    sample: [
      { id: 'q_c6eca8', en: 'Espanyol', q: 'Welchen spanischen Verein bezwang Leverkusen im UEFA-Cup-Finale 1988 im Elfmeterschießen?', o: ['FC Valencia', 'FC Sevilla', 'Espanyol Barcelona', 'Real Betis'], a: 2, hint: 'Espanyol gewann das Hinspiel in Barcelona 3:0, doch Leverkusen gewann das Rückspiel im Ulrich-Haberland-Stadion 3:0 und siegte vom Punkt.' },
      { id: 'q_dee366', q: 'Von welchem ostdeutschen Verein kam Ulf Kirsten 1990 nach Leverkusen?', o: ['Hansa Rostock', 'Carl Zeiss Jena', 'Dynamo Dresden', 'BFC Dynamo'], a: 2, hint: 'Kirsten machte sich bei Dynamo Dresden einen Namen und wechselte kurz nach der Wiedervereinigung nach Leverkusen.' },
      { id: 'q_544c26', q: 'Wer trainierte Leverkusen in der Saison 2001/02, in der man in Bundesliga, DFB-Pokal und Champions League jeweils Zweiter wurde?', o: ['Christoph Daum', 'Erich Ribbeck', 'Klaus Toppmöller', 'Otto Rehhagel'], a: 2, hint: 'Klaus Toppmöller übernahm 2001 und erlebte die Saison der drei zweiten Plätze, die den Beinamen «Neverkusen» zementierte.' },
      { id: 'q_002a1d', q: 'Welchen englischen Verein schaltete Leverkusen im Halbfinale der Champions League 2001/02 aus?', o: ['Arsenal', 'Manchester United', 'Chelsea', 'Leeds United'], a: 1, hint: 'Leverkusen spielte 2:2 im Old Trafford und 1:1 zu Hause und kam durch die Auswärtstorregel gegen Manchester United weiter.' },
      { id: 'q_dd31e4', q: 'Welcher brasilianische Verteidiger erzielte Leverkusens Tor im Champions-League-Finale 2002?', o: ['Roque Júnior', 'Juan', 'Lúcio', 'Cafu'], a: 2, hint: 'Lúcio köpfte den Ausgleich in der ersten Halbzeit, nachdem Raúl Real Madrid schon in den ersten zehn Minuten in Führung gebracht hatte.' },
      { id: 'q_d1de9a', q: 'Am letzten Spieltag der Saison 1999/2000 verlor Leverkusen 0:2 auswärts und schenkte Bayern München die Meisterschaft. Gegen wen?', o: ['SpVgg Unterhaching', 'SC Freiburg', 'MSV Duisburg', 'Arminia Bielefeld'], a: 0, hint: 'Die Niederlage beim Aufsteiger SpVgg Unterhaching, samt Eigentor von Michael Ballack, kostete den Titel per Tordifferenz.' },
      { id: 'q_1210c3', q: 'Von welchem Verein kam Michael Ballack 1999 nach Leverkusen?', o: ['Chemnitzer FC', '1. FC Kaiserslautern', 'Hansa Rostock', 'VfB Stuttgart'], a: 1, hint: 'Ballack gehörte zur Überraschungsmeistermannschaft des 1. FC Kaiserslautern von 1997/98, bevor er 1999 nach Leverkusen wechselte.' },
      { id: 'q_8d8925', en: 'Dimitar Berbatov', q: 'Welcher bulgarische Spieler stand von 2001 bis 2006 in Leverkusen unter Vertrag, bevor er zu Tottenham Hotspur ging?', o: ['Hristo Stoitschkow', 'Martin Petrow', 'Dimitar Berbatow', 'Krassimir Balakow'], a: 2, hint: 'Berbatow kam 2001 von ZSKA Sofia und verbrachte fünf Spielzeiten in der BayArena, ehe er nach England wechselte.' },
      { id: 'q_f38f31', q: 'Welcher südkoreanische Spieler stand zwischen 2013 und 2015 in Leverkusen unter Vertrag, bevor er zu Tottenham Hotspur wechselte?', o: ['Ki Sung-yueng', 'Park Ji-sung', 'Son Heung-min', 'Lee Kang-in'], a: 2, hint: 'Son Heung-min verbrachte zwei Spielzeiten in der BayArena, kam 2013 vom Hamburger SV und ging 2015 zu Tottenham.' },
      { id: 'q_16e412', q: 'Welche Mannschaft trainierte Xabi Alonso unmittelbar vor seinem Amtsantritt in Leverkusen 2022?', o: ['Real Madrid Castilla', 'Athletic Bilbao B', 'Real Sociedad B', 'FC Barcelona B'], a: 2, hint: 'Alonso trainierte Real Sociedad B von 2019 bis 2022 in Spaniens zweiter und dritter Liga.' },
      { id: 'q_b5ab98', q: 'Leverkusen machte die Meisterschaft 2023/24 mit einem 5:0-Heimsieg perfekt, bei dem Florian Wirtz dreifach traf. Gegen welchen Verein?', o: ['Eintracht Frankfurt', 'Werder Bremen', 'VfB Stuttgart', 'FC Augsburg'], a: 1, hint: 'Der 5:0-Sieg über Werder Bremen am 14. April 2024 sicherte den Titel fünf Spieltage vor Schluss.' },
      { id: 'q_98a47d', en: 'Atalanta', q: 'Leverkusens ungeschlagene Serie 2023/24 endete schließlich im Europa-League-Finale gegen welchen italienischen Verein?', o: ['AS Rom', 'AC Florenz', 'Lazio Rom', 'Atalanta Bergamo'], a: 3, hint: 'Atalanta gewann im Mai 2024 in Dublin 3:0, Ademola Lookman gelang ein Hattrick.' },
    ],
    copy: {
      tasterEyebrow: 'Kostenlos testen · Ohne Anmeldung',
      tasterH: 'Wie gut kennst du die Werkself wirklich?',
      tasterPh: 'Zehn schnelle Fragen, um deinen Leverkusen-Ball-IQ zu messen.',
      tasterNote: 'Beispielfragen — im vollständigen Quiz warten viel mehr.',
      playSection: 'Das Leverkusen-Quiz spielen',
      playSub: 'Tippe auf eine Antwort — sofortige Auflösung und die Geschichte dahinter.',
      faqH: 'Bayer Leverkusen Quiz — Häufige Fragen',
      aboutQ: 'Über das Leverkusen-Quiz',
      bandH: 'Du denkst, du kennst die Werkself? Beweise es in der App.',
      bandP: 'Siegesserien, 1-gegen-1 in Echtzeit und eine Wertung von 99 — alle Quizze in einer App. Die App ist auf Englisch.',
      alsoH: 'Dieselbe Seite auf Englisch',
      alsoP: 'Das ist die deutsche Fassung unseres Leverkusen-Quiz. Alle Fragen im Original:',
      alsoLink: 'Bayer Leverkusen quiz (English)',
      statsLine: 'Die Leverkusen-Fragen bei Ball IQ verteilen sich auf drei Schwierigkeitsgrade — leicht, mittel und schwer — alle mit Erklärung.',
    },
  },
];
