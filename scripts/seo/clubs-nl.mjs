// Dutch club pages — WAVE N1, the Netherlands wave.
//
// WHY DUTCH
//
// GSC country read 2026-08-26: the Netherlands is our 4th-largest market by
// impressions — 2,038 — at position 13.3 with NO Dutch page in existence. Ajax,
// PSV and Feyenoord already carry ENGLISH pages, so the demand is proven and
// only the locale is missing. Localisation is measured to work per-market
// (/es/ River Plate: 134 clicks vs 8 for its English page).
//
// ⚠️ EXPECT LESS THAN SPANISH, AND SAY SO UP FRONT. The Netherlands has the
// highest English proficiency in Europe — the German-file caveat applies
// double. Dutch is worth building because 2,038 impressions at position 13
// convert at 1.3%, and a native page on native intent is the cheapest CTR and
// position lever we have there — not because Dutch fans can't read English.
//
// THREE CLUBS, ONE STORY: the traditionele top drie. Ajax's 36 landstitels,
// PSV taking 2024-25 off them, Feyenoord and De Klassieker. The cluster IS
// Dutch football's central rivalry triangle.
//
// ── THE QUESTIONS ARE TRANSLATIONS, NOT NEW WRITING ──────────────────────────
//
// Same contract as clubs-it.mjs / clubs-de.mjs: every entry carries `id`, the
// id of the English bank question it came from; the build enforces that the id
// resolves and the answer INDEX still agrees. Option order preserved exactly.
// A translated proper noun in the answer slot carries `en`.
//
// Dutch register: what the F-side and Zuid actually say — landstitel, dubbel,
// De Klassieker, de Godenzonen, doelman, spits, middenvelder, "trainer" not
// "manager", eredivisie lowercase in prose but Eredivisie as the competition.
// IJ is load-bearing: Cruijff, niet Cruyff, in Dutch prose — the English
// spelling in a Dutch sentence is the tell of a machine translation.

export const CLUBS_NL = [
  // ── AJAX ───────────────────────────────────────────────────────────────────
  {
    club: 'Ajax',
    slug: 'ajax',
    lang: 'nl',
    name: 'Ajax',
    h1: 'Ajax Quiz',
    title: 'Ajax Quiz — de Godenzonen | Ball IQ',
    description:
      'Gratis Ajax-quiz met uitgelegde antwoorden: Cruijff en het totaalvoetbal, drie Europa Cups op rij, Wenen 1995, de lichting van 2019 en 36 landstitels.',
    kind: 'Clubquiz',
    statLine: 'Gratis · Ajax-vragen met uitgelegde antwoorden · zonder account',
    playLabel: 'Start de quiz',
    intro: [
      'De club van nummer 14, van De Toekomst en van het totaalvoetbal. Deze gratis quiz loopt door alle tijdperken: de oprichting in 1900, Cruijff en Michels, drie Europa Cups op rij, Van Basten die inviel voor Cruijff en meteen scoorde, Wenen 1995, de wonderlichting van 2019 en de 36 landstitels waar geen enkele club in Nederland bij in de buurt komt.',
      'De vragen worden echt moeilijk. Waar de clubgeschiedenis omstreden is, publiceren we de vraag liever niet dan dat we partij kiezen. Alleen wat te bewijzen valt, komt online.',
      'Elk antwoord in de Ajax-set heeft een geschreven uitleg: ook wie fout gokt, leert iets over hoe deze club won wat hij won.',
    ],
    faq: [
      { q: 'Is de Ajax-quiz gratis?', a: 'Ja. De quiz draait direct in je browser, zonder account en zonder download. Alle vragen op deze pagina zijn gratis.' },
      { q: 'Welke onderwerpen komen aan bod?', a: 'De oprichting en de Griekse held achter de naam, Cruijff, Michels en het totaalvoetbal, de drie Europa Cups van 1971-1973, Van Basten, Bergkamp en de academie, Van Gaal en Wenen 1995, de Champions League-run van 2019, de recordverkopen van De Jong en Antony, en de landstitels. Het begint makkelijk en wordt echt moeilijk.' },
      { q: 'Waar komen de vragen vandaan?', a: 'Ze worden met de hand geschreven en met de hand gecontroleerd, nooit automatisch gegenereerd. Elke bewering gaat vóór publicatie door twee onafhankelijke controles; wat niet te bewijzen valt, verschijnt niet.' },
      { q: 'Is de Ball IQ-app er ook in het Nederlands?', a: 'Nog niet: deze pagina is Nederlands, de app is Engels. We meten eerst de belangstelling voordat we vertalen — wie tot hier heeft gelezen, helpt ons precies bij die beslissing.' },
    ],
    taster: [
      { id: 'q_0dd0d0', q: 'In welke Nederlandse stad is Ajax thuis, met de beroemde jeugdopleiding De Toekomst?', o: ['Amsterdam', 'Rotterdam', 'Eindhoven', 'Utrecht'], a: 0, hint: 'Ajax is sinds de oprichting in 1900 dé club van Amsterdam.' },
      { id: 'q_b7ceef', en: 'Red', q: 'Het iconische thuisshirt van Ajax is wit met één brede verticale baan over het midden. Welke kleur heeft die baan?', o: ['Rood', 'Blauw', 'Oranje', 'Groen'], a: 0, hint: 'De brede rode baan op een wit shirt is een van de herkenbaarste tenues van het wereldvoetbal.' },
      { id: 'q_91d4b8', q: 'De gouden jaren van Ajax piekten met drie Europa Cups op rij. In welke jaren?', o: ['1969, 1970, 1971', '1971, 1972, 1973', '1972, 1973, 1974', '1973, 1974, 1975'], a: 1, hint: 'Het totaalvoetbal van Cruijff versloeg Panathinaikos, Inter en Juventus in drie opeenvolgende finales — alleen Bayern en Real Madrid deden dat ooit na.' },
      { id: 'q_dfc239', q: 'In de Champions League-finale van 1995 versloeg Ajax AC Milan met 1-0 door een late treffer van een tiener-invaller. Wie scoorde?', o: ['Marc Overmars', 'Patrick Kluivert', 'Jari Litmanen', 'Finidi George'], a: 1, hint: 'Kluivert, 18 jaar en 10 maanden, viel in en maakte in de 85e minuut de winnende — destijds de jongste doelpuntenmaker ooit in een Europa Cup-finale.' },
      { id: 'q_d42545', en: 'Johan Cruyff Arena', q: 'Sinds 2018 draagt het stadion van Ajax de naam van hun grootste speler. Hoe heet het nu?', o: ['Johan Cruijff ArenA', 'Rinus Michels Arena', 'Amsterdam Dome', 'Ajax Stadion'], a: 0, hint: 'De oude Amsterdam ArenA werd in 2018 omgedoopt tot Johan Cruijff ArenA, als eerbetoon aan het clubicoon.' },
      { id: 'q_2b48d0', en: '...playing simple football is the hardest thing there is', q: 'Maak Johan Cruijffs beroemdste voetbalwijsheid af: "Voetballen is heel simpel, maar..."', o: ['...winnen is nog simpeler', '...simpel voetballen is het moeilijkste wat er is', '...alleen de dapperen kunnen het', '...de bal moet altijd bij je terugkomen'], a: 1, hint: 'De uitspraak vangt Cruijffs hele filosofie: voetbal met één aanraking en op positie oogt moeiteloos, maar is duivels moeilijk.' },
      { id: 'q_2dbbe3', q: 'Met welke transfer brak Johan Cruijff in 1983 de harten van alle Ajacieden — naar welke aartsrivaal vertrok hij?', o: ['PSV', 'Feyenoord', 'AZ', 'FC Utrecht'], a: 1, hint: 'Nadat Ajax zijn contract niet wilde verlengen, tekende Cruijff bij aartsrivaal Feyenoord — en pakte daar in zijn enige seizoen meteen de dubbel. De ultieme wraak.' },
      { id: 'q_65376e', q: 'Ajax heeft VEEL meer landstitels dan welke Nederlandse club ook — maar geen enkele sinds 2022. Hoeveel zijn het er, per juni 2026?', o: ['26', '36', '46', '16'], a: 1, hint: 'Ze staan op 36, ver voor PSV (27) en Feyenoord (16) — maar gaven de titelrace van 2024-25 berucht uit handen aan PSV en wachten nog altijd op nummer 37.' },
      { id: 'q_480fa2', q: 'Frenkie de Jong verliet Ajax in 2019, na de run naar de halve finale van de Champions League. Naar welke club?', o: ['Barcelona', 'Bayern München', 'Manchester City', 'Paris Saint-Germain'], a: 0, hint: 'De Jong ging voor zo\'n 86 miljoen euro naar Barcelona, direct na Ajax\' verbluffende Europese campagne van 2018-19.' },
    ],
    sample: [
      { id: 'q_88fb6b', en: 'He remained unconquered, never beaten in battle', q: 'Ajax is vernoemd naar een held uit de Griekse mythologie. Wat sprak de oprichters in 1900 precies aan in deze held?', o: ['Hij was een beroemd hardloper', 'Hij bleef onoverwonnen, nooit verslagen in de strijd', 'Hij was de god van het voetbal', 'Hij versloeg in zijn eentje duizend vijanden'], a: 1, hint: 'Ajax de Grote gold als de grootste Griekse krijger na zijn neef Achilles en stierf onverslagen — hij sloeg liever de hand aan zichzelf dan te verliezen. Die "onoverwinnelijkheid" beviel de oprichters.' },
      { id: 'q_ebc659', q: 'Wie is recordhouder officiële wedstrijden voor Ajax en verdiende in 17 opeenvolgende seizoenen de bijnaam "Mister Ajax"?', o: ['Sjaak Swart', 'Ruud Krol', 'Gerrie Mühren', 'Piet Keizer'], a: 0, hint: 'Swart speelde van 1956 tot 1973 in totaal 603 officiële duels en pakte alle drie de Europa Cups; zijn afscheidswedstrijd was tegen Tottenham.' },
      { id: 'q_db9953', en: 'Johan Cruyff', q: 'De jonge Marco van Basten maakte in 1982 op bijzondere wijze zijn debuut in Ajax 1 — hij viel in voor welke legende?', o: ['Ruud Krol', 'Johan Cruijff', 'Sjaak Swart', 'Frank Rijkaard'], a: 1, hint: 'Een poëtische fakkeloverdracht: de 17-jarige verving Cruijff en scoorde meteen — het begin van 128 goals in 133 competitieduels, tot AC Milan aanklopte.' },
      { id: 'q_fa23a3', q: 'De Champions League-run van 2018-19 eindigde in tranen: uitgeschakeld in blessuretijd van de halve finale door een hattrick van wie?', o: ['Heung-min Son', 'Lucas Moura', 'Dele Alli', 'Christian Eriksen'], a: 1, hint: 'Ajax leidde met 3-2 over twee duels en stond seconden van de finale toen Moura\'s derde treffer Spurs op uitgoals doorstuurde.' },
      { id: 'q_0356e7', en: 'Went the entire league season unbeaten', q: 'Welke opmerkelijke prestatie leverde het Ajax van Louis van Gaal in het Eredivisie-seizoen 1994-95?', o: ['Het hele competitieseizoen ongeslagen', '150 competitiedoelpunten', 'Alle uitwedstrijden gewonnen', 'Thuis altijd de nul gehouden'], a: 0, hint: 'Dat grote Ajax werd in 1994-95 landskampioen zonder één nederlaag.' },
      { id: 'q_1eb9f5', q: 'Welke trainer bezorgde Ajax in 1995 zijn meest recente Champions League-titel?', o: ['Louis van Gaal', 'Johan Cruijff', 'Rinus Michels', 'Marco van Basten'], a: 0, hint: 'Het jonge elftal van Van Gaal versloeg AC Milan met 1-0 in de finale van 1995 in Wenen.' },
      { id: 'q_a2e636', en: 'The King of Ajax', q: 'Welke liefkozende bijnaam kreeg de Finse spelmaker Jari Litmanen, de nummer 10 van de Europa Cup-winst in 1995?', o: ['De Koning van Ajax', 'De Vliegende Fin', 'De IJsman', 'De Tovenaar'], a: 0, hint: 'Litmanen werd in Amsterdam zó vereerd dat de aanhang hem "de Koning van Ajax" doopte.' },
      { id: 'q_45cc3e', q: 'Matthijs de Ligt was aanvoerder van het Ajax van 2018-19. Naar welke club vertrok hij die zomer?', o: ['Juventus', 'Bayern München', 'Barcelona', 'Liverpool'], a: 0, hint: 'De tieneraanvoerder verkaste in 2019 naar Juventus, na de run naar de halve finale van de Champions League.' },
      { id: 'q_2eeb46', q: 'In 2022 verkocht Ajax een vleugelspeler voor zo\'n 95 miljoen euro aan Manchester United — destijds een clubrecord. Wie?', o: ['Hakim Ziyech', 'Antony', 'Steven Bergwijn', 'David Neres'], a: 1, hint: 'Antony werd in Manchester herenigd met Erik ten Hag; de transfer loste Frenkie de Jongs 86 miljoen als grootste verkoop ooit af.' },
      { id: 'q_c01321', en: 'Coach of the Century', q: 'Rinus Michels, architect van het totaalvoetbal en de eerste Europa Cup-trainer van Ajax, kreeg in 1999 welke eer van de FIFA?', o: ['Trainer van de Eeuw', 'FIFA Order of Merit', 'FIFA Presidential Award', 'UEFA-voorzitter'], a: 0, hint: 'De FIFA riep Michels in 1999 uit tot Trainer van de Eeuw, als erkenning voor zijn totaalvoetbalrevolutie.' },
      { id: 'q_af418e', en: 'His standing leg', q: 'Cruijffs iconische schijnbeweging tegen Zweden op het WK 1974 liet Jan Olsson naar een schim happen. Achter welk been trok hij de bal langs?', o: ['Zijn standbeen', 'Zijn schietbeen', 'Het been het dichtst bij de verdediger', 'Beide benen na elkaar'], a: 0, hint: 'Cruijff deed alsof hij ging passen, trok de bal met de binnenkant van de voet achter zijn standbeen terug en draaide 180 graden van Olsson weg.' },
      { id: 'q_606b31', q: 'Zlatan Ibrahimović schitterde bij Ajax en vertrok in 2004 naar welke Italiaanse club?', o: ['Juventus', 'Inter', 'AC Milan', 'Roma'], a: 0, hint: 'Na drie jaar Amsterdam was Juventus in de zomer van 2004 Zlatans volgende halte.' },
    ],
    copy: {
      tasterEyebrow: 'Gratis proberen · Zonder account',
      tasterH: 'Hoe goed ken jij Ajax echt?',
      tasterPh: 'Tien snelle vragen om je Ajax-Ball IQ te meten.',
      tasterNote: 'Voorbeeldvragen — in de volledige quiz wachten er veel meer.',
      playSection: 'Speel de Ajax-quiz',
      playSub: 'Tik een antwoord aan — direct de uitslag en het verhaal erachter.',
      faqH: 'Ajax Quiz — Veelgestelde vragen',
      aboutQ: 'Over de Ajax-quiz',
      bandH: 'Denk je dat je Ajax kent? Bewijs het in de app.',
      bandP: 'Winstreeksen, 1-tegen-1 in realtime en een rating tot 99 — alle quizzen in één app. De app is in het Engels.',
      alsoH: 'Dezelfde pagina in het Engels',
      alsoP: 'Dit is de Nederlandse versie van onze Ajax-quiz. Alle vragen in het origineel:',
      alsoLink: 'Ajax quiz (English)',
      statsLine: 'De Ajax-vragen bij Ball IQ zijn verdeeld over drie niveaus — makkelijk, gemiddeld en moeilijk — allemaal met uitleg.',
    },
  },
  // ── PSV ────────────────────────────────────────────────────────────────────
  {
    club: 'PSV',
    slug: 'psv',
    lang: 'nl',
    name: 'PSV',
    h1: 'PSV Quiz',
    title: 'PSV Quiz — van Philips tot de landstitel | Ball IQ',
    description:
      'Gratis PSV-quiz met uitgelegde antwoorden: de treble van 1988, Van Breukelen, Romário en Ronaldo, Van Nistelrooy, Gakpo en de titel van 2024-25.',
    kind: 'Clubquiz',
    statLine: 'Gratis · PSV-vragen met uitgelegde antwoorden · zonder account',
    playLabel: 'Start de quiz',
    intro: [
      'Begonnen als personeelsclub van Philips, uitgegroeid tot Europees kampioen. Deze gratis quiz loopt van het Philips Stadion en de treble van 1988 — met Van Breukelens gestopte strafschop — via Romário, Ronaldo en Van Nistelrooy naar Robben, Park Ji-sung, Gakpo en de landstitel die in 2024-25 uit Amsterdamse handen werd getrokken.',
      'De vragen worden echt moeilijk. Waar de clubgeschiedenis omstreden is, publiceren we de vraag liever niet dan dat we partij kiezen. Alleen wat te bewijzen valt, komt online.',
      'Elk antwoord in de PSV-set heeft een geschreven uitleg: ook wie fout gokt, leert iets over hoe de Boeren wonnen wat ze wonnen.',
    ],
    faq: [
      { q: 'Is de PSV-quiz gratis?', a: 'Ja. De quiz draait direct in je browser, zonder account en zonder download. Alle vragen op deze pagina zijn gratis.' },
      { q: 'Welke onderwerpen komen aan bod?', a: 'De Philips-oorsprong en de bijnaam Boeren, de treble van 1987-88 met Hiddink, Kieft en Van Breukelen, de verkopen van Gullit, Romário en Ronaldo, Van Nistelrooy en Robben, de Champions League-run van 2005 met Park Ji-sung, en de moderne lichting met Gakpo. Het begint makkelijk en wordt echt moeilijk.' },
      { q: 'Waar komen de vragen vandaan?', a: 'Ze worden met de hand geschreven en met de hand gecontroleerd, nooit automatisch gegenereerd. Elke bewering gaat vóór publicatie door twee onafhankelijke controles; wat niet te bewijzen valt, verschijnt niet.' },
      { q: 'Is de Ball IQ-app er ook in het Nederlands?', a: 'Nog niet: deze pagina is Nederlands, de app is Engels. We meten eerst de belangstelling voordat we vertalen — wie tot hier heeft gelezen, helpt ons precies bij die beslissing.' },
    ],
    taster: [
      { id: 'q_ec963d', en: 'Philips Sport Vereniging', q: 'Waar staat de afkorting "PSV" voor?', o: ['Philips Sport Vereniging', 'Philips Stadion Vereniging', 'Provinciale Sport Vereniging', 'Philips Sportclub Veldhoven'], a: 0, hint: 'PSV staat voor Philips Sport Vereniging — opgericht voor het personeel van de gloeilampenfabriek.' },
      { id: 'q_2ccf98', q: 'In welke Nederlandse stad speelt PSV zijn thuiswedstrijden?', o: ['Eindhoven', 'Rotterdam', 'Amsterdam', 'Utrecht'], a: 0, hint: 'PSV komt uit Eindhoven, in Noord-Brabant.' },
      { id: 'q_a72c34', q: 'Hoe heet het stadion van PSV?', o: ['Philips Stadion', 'De Kuip', 'Johan Cruijff ArenA', 'Galgenwaard'], a: 0, hint: 'De Kuip is van Feyenoord en de Johan Cruijff ArenA van Ajax; PSV speelt in het Philips Stadion.' },
      { id: 'q_ee6c85', en: 'Red and white', q: 'Wat zijn de traditionele clubkleuren van PSV?', o: ['Rood-wit', 'Blauw-wit', 'Rood-zwart', 'Groen-wit'], a: 0, hint: 'PSV speelt in rood-wit sinds de kleuren bij de oprichtingsvergadering van 1913 werden gekozen.' },
      { id: 'q_a3b248', q: 'PSV, Ajax en welke andere club vormen de traditionele "grote drie" van het Nederlandse voetbal?', o: ['Feyenoord', 'AZ', 'FC Twente', 'Vitesse'], a: 0, hint: 'De grote drie van Nederland zijn Ajax, Feyenoord en PSV.' },
      { id: 'q_56fed5', q: 'Onder welke trainer pakte PSV in 1988 de treble, inclusief de Europa Cup?', o: ['Guus Hiddink', 'Bobby Robson', 'Dick Advocaat', 'Ronald Koeman'], a: 0, hint: 'Guus Hiddink loodste PSV in 1987-88 naar de Eredivisie-titel, de KNVB-beker én de Europa Cup.' },
      { id: 'q_066d21', q: 'Welke club versloeg PSV in de finale om de Europa Cup van 1988?', o: ['Benfica', 'Real Madrid', 'Steaua Boekarest', 'Bayern München'], a: 0, hint: 'PSV klopte het Portugese Benfica in de finale; Real Madrid sneuvelde in de halve finale.' },
      { id: 'q_83ad37', q: 'Ronaldo verliet PSV in 1996 voor welke club, in wat destijds een wereldrecordtransfer was?', o: ['Barcelona', 'Inter', 'Real Madrid', 'AC Milan'], a: 0, hint: 'Ronaldo ging in 1996 van PSV naar Barcelona — en een jaar later alweer door naar Inter.' },
      { id: 'q_020d02', q: 'Naar welke Engelse club vertrok Ruud van Nistelrooy in 2001?', o: ['Manchester United', 'Arsenal', 'Liverpool', 'Chelsea'], a: 0, hint: 'Van Nistelrooy ging in 2001 voor een Brits recordbedrag van PSV naar Manchester United.' },
    ],
    sample: [
      { id: 'q_6895fc', q: 'PSV werd opgericht als sportclub voor het personeel van welk bedrijf?', o: ['Philips', 'Shell', 'Heineken', 'DAF Trucks'], a: 0, hint: 'De club ontstond bij Philips, de Eindhovense elektronicafabrikant.' },
      { id: 'q_b33900', en: 'Farmers', q: 'De bijnaam van PSV is "de Boeren". Wat betekent die bijnaam letterlijk?', o: ['Boeren (farmers)', 'Leeuwen', 'Mijnwerkers', 'Zeelieden'], a: 0, hint: '"Boeren" is de al lang bestaande bijnaam van de club — door de aanhang allang met trots omarmd.' },
      { id: 'q_37cc74', en: 'KNVB Cup', q: 'In het treble-seizoen 1988 won PSV de Eredivisie, de Europa Cup en welke nationale prijs?', o: ['De KNVB-beker', 'De Johan Cruijff Schaal', 'De wereldbeker voor clubs', 'De UEFA Super Cup'], a: 0, hint: 'De treble van 1987-88 bestond uit Eredivisie, KNVB-beker en Europa Cup.' },
      { id: 'q_d6ad61', q: 'Welke PSV-doelman stopte de beslissende strafschop in de finale van de Europa Cup 1988?', o: ['Hans van Breukelen', 'Edwin van der Sar', 'Ronald Waterreus', 'Heurelho Gomes'], a: 0, hint: 'Hans van Breukelen keerde de inzet van Antonio Veloso en besliste de shoot-out: 6-5.' },
      { id: 'q_1f7626', q: 'Ronaldo kwam in 1994 als tiener naar PSV, van welke Braziliaanse club?', o: ['Cruzeiro', 'Flamengo', 'Santos', 'Corinthians'], a: 0, hint: 'Ronaldo maakte in 1994 de overstap van Cruzeiro naar PSV.' },
      { id: 'q_3740e6', q: 'Welke Engelse club haalde Arjen Robben in 2004 weg bij PSV?', o: ['Chelsea', 'Manchester United', 'Tottenham', 'Newcastle'], a: 0, hint: 'Robben verruilde PSV in 2004 voor Chelsea.' },
      { id: 'q_772444', q: 'PSV haalde in 2005 de halve finale van de Champions League. Welke Italiaanse club schakelde ze uit?', o: ['AC Milan', 'Juventus', 'Inter', 'Roma'], a: 0, hint: 'AC Milan hield PSV in 2005 op doelsaldo uit de finale.' },
      { id: 'q_eba924', q: 'Welke Zuid-Koreaanse middenvelder schitterde in de Champions League-run van 2005 en vertrok daarna naar Manchester United?', o: ['Park Ji-sung', 'Son Heung-min', 'Cha Bum-kun', 'Kim Min-jae'], a: 0, hint: 'Park Ji-sung speelde onder Hiddink bij PSV en verkaste in 2005 naar Manchester United.' },
      { id: 'q_a4e0de', q: 'Welke PSV-jeugdproduct en Oranje-aanvaller tekende in januari 2023 bij Liverpool?', o: ['Cody Gakpo', 'Donyell Malen', 'Steven Bergwijn', 'Noni Madueke'], a: 0, hint: 'Cody Gakpo maakte in januari 2023 de overstap van PSV naar Liverpool.' },
      { id: 'q_b10040', q: 'Welke Nederlandse ster verkocht PSV in 1987 voor een toenmalig wereldrecordbedrag aan AC Milan?', o: ['Ruud Gullit', 'Marco van Basten', 'Frank Rijkaard', 'Dennis Bergkamp'], a: 0, hint: 'PSV verkocht Ruud Gullit in 1987 aan AC Milan; Van Basten en Rijkaard kwamen daar via andere clubs terecht.' },
      { id: 'q_f7a86a', en: 'Romario', q: 'Welke Braziliaanse spits scoorde van 1988 tot 1993 aan de lopende band voor PSV en vertrok toen naar Barcelona?', o: ['Romário', 'Ronaldinho', 'Rivaldo', 'Bebeto'], a: 0, hint: 'Romário maakte ruim 160 goals voor PSV tussen 1988 en 1993; Ronaldinho speelde nooit voor de club.' },
      { id: 'q_398c52', q: 'Wie werd in het treble-seizoen 1987-88 clubtopscorer met 29 competitiegoals?', o: ['Wim Kieft', 'Ronald Koeman', 'Hans Gillhaus', 'Gerald Vanenburg'], a: 0, hint: 'Wim Kieft was met 29 competitietreffers de topscorer van 1987-88.' },
    ],
    copy: {
      tasterEyebrow: 'Gratis proberen · Zonder account',
      tasterH: 'Hoe goed ken jij PSV echt?',
      tasterPh: 'Tien snelle vragen om je PSV-Ball IQ te meten.',
      tasterNote: 'Voorbeeldvragen — in de volledige quiz wachten er veel meer.',
      playSection: 'Speel de PSV-quiz',
      playSub: 'Tik een antwoord aan — direct de uitslag en het verhaal erachter.',
      faqH: 'PSV Quiz — Veelgestelde vragen',
      aboutQ: 'Over de PSV-quiz',
      bandH: 'Denk je dat je PSV kent? Bewijs het in de app.',
      bandP: 'Winstreeksen, 1-tegen-1 in realtime en een rating tot 99 — alle quizzen in één app. De app is in het Engels.',
      alsoH: 'Dezelfde pagina in het Engels',
      alsoP: 'Dit is de Nederlandse versie van onze PSV-quiz. Alle vragen in het origineel:',
      alsoLink: 'PSV quiz (English)',
      statsLine: 'De PSV-vragen bij Ball IQ zijn verdeeld over drie niveaus — makkelijk, gemiddeld en moeilijk — allemaal met uitleg.',
    },
  },
  // ── FEYENOORD ──────────────────────────────────────────────────────────────
  {
    club: 'Feyenoord',
    slug: 'feyenoord',
    lang: 'nl',
    name: 'Feyenoord',
    h1: 'Feyenoord Quiz',
    title: 'Feyenoord Quiz — geen woorden maar daden | Ball IQ',
    description:
      'Gratis Feyenoord-quiz met uitgelegde antwoorden: De Kuip, de Europa Cup van 1970, Van Hanegem, de UEFA Cups van 1974 en 2002, Kuyt in 2017 en Slot in 2023.',
    kind: 'Clubquiz',
    statLine: 'Gratis · Feyenoord-vragen met uitgelegde antwoorden · zonder account',
    playLabel: 'Start de quiz',
    intro: [
      'De club van Zuid, van De Kuip en van "geen woorden maar daden". Deze gratis quiz loopt door de hele geschiedenis: Happel en de Europa Cup van 1970 — de eerste voor een Nederlandse club — De Kromme en Moulijn, de UEFA Cups van 1974 en 2002 in eigen huis, Kuyts hattrick op de slotdag van 2017 en de titel van 2023 onder Arne Slot.',
      'De vragen worden echt moeilijk. Waar de clubgeschiedenis omstreden is, publiceren we de vraag liever niet dan dat we partij kiezen. Alleen wat te bewijzen valt, komt online.',
      'Elk antwoord in de Feyenoord-set heeft een geschreven uitleg: ook wie fout gokt, leert iets over hoe deze club won wat hij won.',
    ],
    faq: [
      { q: 'Is de Feyenoord-quiz gratis?', a: 'Ja. De quiz draait direct in je browser, zonder account en zonder download. Alle vragen op deze pagina zijn gratis.' },
      { q: 'Welke onderwerpen komen aan bod?', a: 'De wijk Feijenoord en De Kuip, de Europa Cup van 1970 met Happel en Kindvall, Van Hanegem en Moulijn, de UEFA Cup-finales van 1974 en 2002, Van Persie en Kuyt, de titel van 2017 na achttien jaar droogte, en Slots kampioensjaar 2023. Het begint makkelijk en wordt echt moeilijk.' },
      { q: 'Waar komen de vragen vandaan?', a: 'Ze worden met de hand geschreven en met de hand gecontroleerd, nooit automatisch gegenereerd. Elke bewering gaat vóór publicatie door twee onafhankelijke controles; wat niet te bewijzen valt, verschijnt niet.' },
      { q: 'Is de Ball IQ-app er ook in het Nederlands?', a: 'Nog niet: deze pagina is Nederlands, de app is Engels. We meten eerst de belangstelling voordat we vertalen — wie tot hier heeft gelezen, helpt ons precies bij die beslissing.' },
    ],
    taster: [
      { id: 'q_6c6676', q: 'In welke stad is Feyenoord thuis?', o: ['Amsterdam', 'Eindhoven', 'Rotterdam', 'Utrecht'], a: 2, hint: 'Feyenoord is de grootste club van havenstad Rotterdam.' },
      { id: 'q_ae3290', q: 'Onder welke bijnaam kent iedereen Stadion Feijenoord, het thuis van de club?', o: ['De Meer', 'De Kuip', 'Philips Stadion', 'De Arena'], a: 1, hint: 'Stadion Feijenoord heet in de volksmond simpelweg De Kuip.' },
      { id: 'q_879fb1', en: 'Red and white', q: 'Wat zijn de twee hoofdkleuren van het traditionele thuisshirt van Feyenoord?', o: ['Rood-wit', 'Blauw-wit', 'Rood-zwart', 'Groen-wit'], a: 0, hint: 'Feyenoord speelt in een shirt dat over het midden in rood en wit is gedeeld.' },
      { id: 'q_ea846b', q: 'Onder welke naam staat Ajax tegen Feyenoord bekend?', o: ['The Old Firm', 'El Clásico', 'De Klassieker', 'Der Klassiker'], a: 2, hint: 'Ajax-Feyenoord is De Klassieker, dé wedstrijd van het Nederlandse voetbal.' },
      { id: 'q_3ed29d', en: 'No words but deeds', q: 'Feyenoord en Rotterdam delen het motto "Geen woorden maar daden". Wat drukt dat uit?', o: ['Niet praten maar doen', 'Kracht door eenheid', 'Altijd een stap voor', 'Eén hart, één stad'], a: 0, hint: '"Geen woorden maar daden" is het motto dat club en stad delen: Rotterdamse werkersmentaliteit.' },
      { id: 'q_8a535d', q: 'Welke club versloeg Feyenoord in de finale om de Europa Cup van 1970?', o: ['Celtic', 'Leeds United', 'Benfica', 'Inter'], a: 0, hint: 'Feyenoord klopte de Schotse kampioen Celtic met 2-1 na verlenging — de eerste Europa Cup voor een Nederlandse club.' },
      { id: 'q_ee025b', en: 'UEFA Cup', q: 'Welke Europese prijs won Feyenoord in zowel 1974 als 2002?', o: ['De Europa Cup II', 'De UEFA Cup', 'De UEFA Super Cup', 'De Conference League'], a: 1, hint: 'Feyenoord pakte de UEFA Cup in 1974 én in 2002.' },
      { id: 'q_9decad', q: 'Welke trainer werd in 2023 kampioen met Feyenoord en vertrok daarna naar Liverpool?', o: ['Peter Bosz', 'Erik ten Hag', 'Arne Slot', 'John Heitinga'], a: 2, hint: 'Arne Slot pakte de titel van 2023 en verkaste in 2024 naar Liverpool.' },
      { id: 'q_865e21', q: 'Feyenoord verloor de allereerste finale van de Conference League in 2022 van welke club?', o: ['Lazio', 'Roma', 'Fiorentina', 'Napoli'], a: 1, hint: 'Het Roma van José Mourinho won in Tirana met 1-0.' },
    ],
    sample: [
      { id: 'q_9cd5ec', en: 'The Tub', q: 'Wat betekent de stadionbijnaam "De Kuip" eigenlijk?', o: ['De Kathedraal', 'Het Nest', 'De Kuip (een teil)', 'Het Fort'], a: 2, hint: 'Een kuip is een teil of tobbe — een knipoog naar de steile, ronde bak van het stadion.' },
      { id: 'q_6d6072', en: 'A Rotterdam neighbourhood', q: 'Waar komt de clubnaam "Feijenoord" vandaan?', o: ['Een Rotterdamse wijk', 'De eerste aanvoerder van de club', 'Een lokale scheepswerfeigenaar', 'Een rivier bij de stad'], a: 0, hint: 'Feijenoord is de wijk op Zuid waar de club werd opgericht.' },
      { id: 'q_f9ba02', q: 'Wie maakte in de verlenging de winnende goal in de Europa Cup-finale van 1970?', o: ['Coen Moulijn', 'Rinus Israël', 'Ove Kindvall', 'Wim Jansen'], a: 2, hint: 'De Zweedse spits Ove Kindvall scoorde diep in de verlenging tegen Celtic.' },
      { id: 'q_906526', q: 'Welke coach leidde Feyenoord naar de Europa Cup van 1970?', o: ['Rinus Michels', 'Ernst Happel', 'Ștefan Kovács', 'Dettmar Cramer'], a: 1, hint: 'Ernst Happel was de architect van de Europa Cup-winst van 1970.' },
      { id: 'q_d745aa', q: 'Feyenoord won zijn eerste UEFA Cup in 1974 ten koste van welke Engelse club?', o: ['Liverpool', 'Tottenham Hotspur', 'Leeds United', 'Wolverhampton Wanderers'], a: 1, hint: 'Feyenoord versloeg Tottenham Hotspur met 4-2 over twee wedstrijden.' },
      { id: 'q_213399', q: 'Van welke Duitse club won Feyenoord de UEFA Cup-finale van 2002?', o: ['Bayern München', 'Borussia Dortmund', 'Schalke 04', 'Werder Bremen'], a: 1, hint: 'Feyenoord versloeg Borussia Dortmund met 3-2 — in eigen Kuip.' },
      { id: 'q_f85367', q: 'Welke Feyenoord-spits scoorde twee keer in de met 3-2 gewonnen UEFA Cup-finale van 2002?', o: ['Pierre van Hooijdonk', 'Robin van Persie', 'Jon Dahl Tomasson', 'Roy Makaay'], a: 0, hint: 'Van Hooijdonk scoorde tweemaal en werd topscorer van het toernooi.' },
      { id: 'q_0fc4ec', q: 'Wat was de bijnaam van Feyenoord- en Oranje-middenvelder Willem van Hanegem?', o: ['Het Kanon', 'De Kromme', 'De Generaal', 'De Zwarte'], a: 1, hint: 'Van Hanegem heette De Kromme, naar zijn gekrulde passes.' },
      { id: 'q_8a9150', en: 'Left winger', q: 'Op welke positie speelde Feyenoord-icoon Coen Moulijn?', o: ['Linksbuiten', 'Doelman', 'Centrale verdediger', 'Spits'], a: 0, hint: 'Moulijn was een gevierde linksbuiten — dé linksbuiten van Zuid.' },
      { id: 'q_73edee', q: 'Welke spits besliste de titelrace van 2017 met een hattrick op de slotdag?', o: ['Robin van Persie', 'Dirk Kuyt', 'Nicolai Jørgensen', 'Steven Berghuis'], a: 1, hint: 'De 36-jarige Dirk Kuyt schoot Feyenoord met drie goals tegen Heracles naar de titel.' },
      { id: 'q_8dda95', en: '18 years', q: 'De landstitel van 2017 maakte een einde aan een titeldroogte van hoeveel jaar?', o: ['8 jaar', '12 jaar', '18 jaar', '25 jaar'], a: 2, hint: 'De vorige titel dateerde van 1999 — achttien jaar wachten.' },
      { id: 'q_38cf45', q: 'Welke aanvaller verkocht Feyenoord in 2004 aan Arsenal?', o: ['Robin van Persie', 'Salomon Kalou', 'Dirk Kuyt', 'Jon Dahl Tomasson'], a: 0, hint: 'Robin van Persie maakte in 2004 de overstap van Feyenoord naar Arsenal.' },
    ],
    copy: {
      tasterEyebrow: 'Gratis proberen · Zonder account',
      tasterH: 'Hoe goed ken jij Feyenoord echt?',
      tasterPh: 'Tien snelle vragen om je Feyenoord-Ball IQ te meten.',
      tasterNote: 'Voorbeeldvragen — in de volledige quiz wachten er veel meer.',
      playSection: 'Speel de Feyenoord-quiz',
      playSub: 'Tik een antwoord aan — direct de uitslag en het verhaal erachter.',
      faqH: 'Feyenoord Quiz — Veelgestelde vragen',
      aboutQ: 'Over de Feyenoord-quiz',
      bandH: 'Denk je dat je Feyenoord kent? Bewijs het in de app.',
      bandP: 'Winstreeksen, 1-tegen-1 in realtime en een rating tot 99 — alle quizzen in één app. De app is in het Engels.',
      alsoH: 'Dezelfde pagina in het Engels',
      alsoP: 'Dit is de Nederlandse versie van onze Feyenoord-quiz. Alle vragen in het origineel:',
      alsoLink: 'Feyenoord quiz (English)',
      statsLine: 'De Feyenoord-vragen bij Ball IQ zijn verdeeld over drie niveaus — makkelijk, gemiddeld en moeilijk — allemaal met uitleg.',
    },
  },
];
