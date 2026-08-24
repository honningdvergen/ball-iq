// Italian club pages — WAVE L1, the first localisation wave sized by MEASURED
// demand rather than by fanbase.
//
// WHY ITALIAN, AND WHY NOW
//
// `quiz calcio serie a` already sits at position 22.8 in GSC with NO Italian
// page in existence — an English page limping into an Italian SERP. That is the
// cleanest possible signal: the demand is real, the intent is Italian, and we
// are answering it in the wrong language. Turkish was a market experiment;
// Italian is a measured gap.
//
// ⚠️ THE HUB SHIPS WITH THIS FILE, NOT BEFORE IT. `/it/quiz/` only exists
// because these club pages exist beneath it. A head-term page with nothing
// under it is exactly the /lists mistake — 47% of impressions, 4% of clicks.
//
// THREE CLUBS, NOT EIGHT. Juventus, Inter and Milan carry the two derbies that
// define Italian football (Derby d'Italia, Derby della Madonnina) so the cluster
// is internally coherent from day one. Napoli, Roma, Lazio, Fiorentina and
// Atalanta all have packs ready (42/37/47/47/33 questions) and are the next
// batch — deliberately held so this wave ships COMPLETE rather than eight
// half-finished pages.
//
// ── THE QUESTIONS ARE TRANSLATIONS, NOT NEW WRITING ──────────────────────────
//
// Same contract as clubs-es.mjs / clubs-pt.mjs / clubs-tr.mjs. Every entry
// carries `id`, the id of the English question in src/questions.js it came from,
// and gen-seo-pages.mjs enforces at build time that the id still resolves and
// that the answer keys still agree. Where the CORRECT option is a translated
// phrase rather than a proper noun, `en` declares the exact English string — the
// tripwire that fires if the original is ever reworded.
//
// So this file asserts NO new facts. Every one already survived the three-stage
// forge in English; translating preserves a fact rather than inventing one.
//
// ⚠️ OPTION ORDER IS PRESERVED EXACTLY so the `a` index still matches the
// English original. Reordering options to read better in Italian would silently
// break the answer key — the build checks the index, not the text.
//
// Italian register: the language the tifosi actually use — Scudetto, Coppa dei
// Campioni (not "Champions League" for the pre-1992 wins), Capocannoniere,
// rosanero/bianconeri/nerazzurri/rossoneri, "allenatore" not "manager",
// "portiere", "centrocampista", "difensore". Accents are load-bearing
// (Nerazzurri, Città, perché) — getting them wrong is the tell of a machine
// translation.

export const CLUBS_IT = [
  // ── JUVENTUS ───────────────────────────────────────────────────────────────
  {
    club: 'Juventus',
    slug: 'juventus',
    lang: 'it',
    name: 'Juventus',
    h1: 'Quiz Juventus',
    title: 'Quiz Juventus — La Vecchia Signora | Ball IQ',
    description:
      'Quiz sulla Juventus gratuito, con risposte spiegate: Platini, Del Piero, i 102 punti di Conte, la Coppa dei Campioni 1996 e la dinastia dei nove Scudetti.',
    kind: 'Quiz di club',
    statLine: 'Gratis · Domande sulla Juve con risposte spiegate · senza registrazione',
    playLabel: 'Inizia il quiz',
    intro: [
      'Il club più titolato d’Italia, e quello che divide di più. Questo quiz gratuito attraversa tutte le epoche bianconere: le strisce arrivate da Notts County, il triennio di Platini con tre Palloni d’Oro di fila, Baggio e Del Piero, la Coppa dei Campioni 1996 vinta ai rigori con Ajax, i 102 punti di Conte e i nove Scudetti consecutivi.',
      'Le domande diventano davvero difficili. Dove la storia del club è controversa — e in parte lo è — preferiamo non pubblicare la domanda piuttosto che prendere posizione. Va online solo ciò che si può verificare.',
      'Ogni risposta del set Juventus ha una spiegazione scritta: anche sbagliando si impara qualcosa su come la Juve ha vinto quello che ha vinto.',
    ],
    faq: [
      {
        q: 'Il quiz sulla Juventus è gratuito?',
        a: 'Sì. Si gioca direttamente nel browser, senza registrarsi e senza scaricare nulla. Tutte le domande di questa pagina sono gratuite.',
      },
      {
        q: 'Quali argomenti copre il quiz?',
        a: 'Le origini e le strisce bianconere, l’era Agnelli, Platini e gli anni Ottanta, Baggio e Del Piero, la Coppa dei Campioni 1996, Zidane e Nedvěd, il ritorno dopo Calciopoli, i nove Scudetti consecutivi e gli anni di Cristiano Ronaldo. Si parte dal facile e si arriva a domande davvero toste.',
      },
      {
        q: 'Da dove vengono le domande?',
        a: 'Sono scritte e verificate a mano, mai generate automaticamente. Ogni informazione passa due controlli indipendenti prima di essere pubblicata; se un dato non si riesce a verificare, la domanda non esce.',
      },
      {
        q: 'L’app Ball IQ è in italiano?',
        a: 'Non ancora: questa pagina è in italiano, ma l’app è in inglese. Stiamo misurando l’interesse prima di tradurla — se sei arrivato fin qui, ci stai già aiutando a decidere.',
      },
    ],
    taster: [
      { id: 'q_fec56e', en: 'Turin', q: 'In quale città del Nord Italia ha sede la Juventus?', o: ['Milano', 'Torino', 'Genova', 'Bologna'], a: 1, hint: 'La Juventus ha sede a Torino dalla fondazione e condivide la città con i rivali del Torino.' },
      { id: 'q_7ea05e', q: 'Le iconiche strisce bianconere furono copiate da un club inglese, dopo che le maglie rosa originali continuavano a stingersi in lavanderia. Da quale club?', o: ['Newcastle United', 'Notts County', 'Fulham', 'West Bromwich Albion'], a: 1, hint: 'Un inglese del club, Tom Savage, si fece spedire da un conoscente un set di maglie del Notts County — il più antico club professionistico del mondo — intorno al 1903, e le strisce rimasero.' },
      { id: 'q_111d7e', en: 'The Latin name \'Juventus\' literally means \'youth\'', q: 'Il soprannome «La Vecchia Signora» contiene un’ironia di fondo. Quale?', o: ['È il più giovane fra i grandi club italiani', 'In latino «Juventus» significa letteralmente «gioventù»', 'Fu fondato da adolescenti su una panchina di un parco', 'Il primo presidente aveva solo 19 anni'], a: 1, hint: '«Juventus» in latino vuol dire gioventù: un club che porta il nome dei giovani è diventato affettuosamente la Vecchia Signora, soprannome cresciuto negli anni Trenta quando la squadra si appoggiava a campioni ormai avanti con l’età.' },
      { id: 'q_44d13f', q: 'Quale regista della Juventus vinse tre Palloni d’Oro consecutivi nel 1983, 1984 e 1985?', o: ['Michel Platini', 'Zinedine Zidane', 'Roberto Baggio', 'Pavel Nedvěd'], a: 0, hint: 'Il tris di Platini, vinto interamente da giocatore della Juventus, ne fece il calciatore dominante in Europa a metà anni Ottanta.' },
      { id: 'q_3a09d9', q: 'Roberto Baggio, stella bianconera dei primi anni Novanta, aveva un soprannome poetico legato alla pettinatura e alla fede buddhista. Quale?', o: ['Il Fenomeno', 'Il Divin Codino', 'Re Leone', 'Il Pinturicchio'], a: 1, hint: '«Il Divin Codino» univa il taglio di capelli e la devozione quasi religiosa che ispirava; «Il Pinturicchio» era invece il soprannome di Del Piero.' },
      { id: 'q_68211c', q: 'La Juventus vinse la Coppa dei Campioni 1996 contro l’Ajax ai rigori, a Roma. Quale portiere fu l’eroe, parando due tiri dal dischetto?', o: ['Gianluigi Buffon', 'Angelo Peruzzi', 'Stefano Tacconi', 'Edwin van der Sar'], a: 1, hint: 'Peruzzi respinse i tiri di Davids e Silooy, e Vladimir Jugović trasformò il rigore decisivo che diede alla Juve la seconda — e finora ultima — Coppa dei Campioni.' },
      { id: 'q_3cae82', q: 'A fine anni Novanta un futuro Galactico del Real Madrid brillò alla Juventus con Marcello Lippi, prima di un trasferimento record. Chi?', o: ['Luís Figo', 'Zinedine Zidane', 'Ronaldo', 'Roberto Carlos'], a: 1, hint: 'Zidane vinse due Scudetti a Torino prima del trasferimento record mondiale al Real Madrid nel 2001, dove un anno dopo segnò quella famosa volée in finale di Champions.' },
      { id: 'q_75b2b4', en: '102 points in a single season', q: 'Nel 2013-14 la Juventus di Antonio Conte stabilì un record di Serie A che resiste ancora. Quale?', o: ['Una stagione da imbattuti senza pareggi', '102 punti in una sola stagione', '100 gol e zero subiti in casa', 'Vincere tutte le trasferte'], a: 1, hint: 'I 102 punti (33 vittorie su 38) superarono il precedente primato dell’Inter di 97; quell’estate Conte sorprese tutti dimettendosi.' },
      { id: 'q_604e72', en: 'Inter Milan', q: 'La rivalità della Juventus con quale club non cittadino è conosciuta come «Derby d’Italia»?', o: ['Torino', 'Milan', 'Inter', 'Roma'], a: 2, hint: 'Il giornalista Gianni Brera coniò «Derby d’Italia» per Juventus-Inter, all’epoca le uniche due squadre mai retrocesse (prima della penalizzazione bianconera del 2006).' },
      { id: 'q_ba7cac', en: 'The Champions League', q: 'Gianluigi Buffon ha passato gran parte della carriera come portiere e capitano della Juventus, ma un trofeo importante gli è sempre sfuggito lì. Quale?', o: ['Lo Scudetto', 'La Coppa Italia', 'La Champions League', 'Il premio di miglior portiere italiano'], a: 2, hint: 'Buffon raggiunse la finale di Champions con la Juve nel 2003, 2015 e 2017 — perdendole tutte e tre — e si ritirò senza l’unico trofeo di club che desiderava di più.' },
    ],
    sample: [
      { id: 'q_9e57c3', q: 'Quale attaccante soprannominato «Pablito», capocannoniere del Mondiale 1982, era in quel momento un giocatore della Juventus?', o: ['Paolo Rossi', 'Roberto Bettega', 'Franco Causio', 'Bruno Conti'], a: 0, hint: 'Rossi trascinò l’Italia al Mondiale 1982 e vinse il Pallone d’Oro di quell’anno mentre giocava nella Juventus.' },
      { id: 'q_c47489', q: 'Chi guidò la Juventus al trionfo in Coppa dei Campioni nel 1996 e in seguito vinse il Mondiale 2006 con l’Italia?', o: ['Giovanni Trapattoni', 'Marcello Lippi', 'Fabio Capello', 'Carlo Ancelotti'], a: 1, hint: 'Lippi portò la Juve alla Coppa dei Campioni 1996 e raggiunse altre due finali, prima di guidare l’Italia al Mondiale 2006.' },
      { id: 'q_da2f6f', en: 'He arrived on a free transfer, discarded by AC Milan', q: 'L’arrivo di Andrea Pirlo nel 2011 è spesso considerato la scintilla della dinastia dei nove Scudetti. Cosa rese quel trasferimento così clamoroso?', o: ['Costò una cifra record per l’Italia', 'Arrivò a parametro zero, scartato dal Milan', 'Uscì dal ritiro per firmare', 'Fu scambiato con un giocatore della Primavera'], a: 1, hint: 'Il Milan lasciò partire il regista gratis pensando che fosse finito; con Conte rinacque e orchestrò lo Scudetto che chiuse il digiuno post-Calciopoli.' },
      { id: 'q_fb20d4', q: 'Quale ex capitano bianconero tornò da allenatore e vinse i primi tre dei nove Scudetti consecutivi (2012-2014)?', o: ['Antonio Conte', 'Massimiliano Allegri', 'Didier Deschamps', 'Andrea Pirlo'], a: 0, hint: 'Conte, grande centrocampista della Juve da giocatore, avviò la dinastia del nove di fila con tre titoli consecutivi prima di dimettersi nel 2014.' },
      { id: 'q_bc8718', en: 'Furia Ceca (The Czech Fury)', q: 'Pavel Nedvěd, icona del centrocampo bianconero, ebbe un soprannome che celebrava insieme la nazionalità e la corsa incessante. Quale?', o: ['Il Cannone Ceco', 'Furia Ceca', 'Il Treno di Praga', 'Il Tornado'], a: 1, hint: '«Furia Ceca» descriveva il motore instancabile di Nedvěd; vinse il Pallone d’Oro 2003 ma era squalificato per la finale di Champions persa dalla Juve quell’anno.' },
      { id: 'q_57500c', q: 'Quale prolifico attaccante francese formò una coppia letale con Del Piero e detiene un primato realizzativo bianconero degli anni Duemila?', o: ['Thierry Henry', 'David Trezeguet', 'Nicolas Anelka', 'Djibril Cissé'], a: 1, hint: 'Trezeguet segnò 171 gol con la Juve (miglior marcatore straniero del club, superando Sívori) e restò celebremente anche nella stagione di Serie B dopo Calciopoli, aiutando la risalita immediata.' },
      { id: 'q_bcec61', q: 'Nel 2018 la Juventus battè il record di trasferimento della Serie A prelevando dal Real Madrid uno dei migliori al mondo per oltre 100 milioni. Chi?', o: ['Gonzalo Higuaín', 'Cristiano Ronaldo', 'Paulo Dybala', 'Matthijs de Ligt'], a: 1, hint: 'A 33 anni, il trasferimento da oltre 100 milioni di Ronaldo doveva portare la Champions; non arrivò mai, ma fu capocannoniere della Serie A nel 2020-21.' },
      { id: 'q_e39699', q: 'Quale soprannome si guadagnò l’attaccante argentino Paulo Dybala nella sua carriera bianconera?', o: ['El Pibe', 'La Joya', 'El Flaco', 'La Pulga'], a: 1, hint: '«La Joya» (Il Gioiello) si adattava al talento di Dybala a Torino; «La Pulga» è di Messi e «El Pibe» di Maradona.' },
      { id: 'q_55775a', q: 'Quale centrocampista francese arrivò a parametro zero dal Manchester United nel 2012, per poi essere rivenduto allo stesso club a cifre enormi nel 2016?', o: ['N’Golo Kanté', 'Paul Pogba', 'Blaise Matuidi', 'Adrien Rabiot'], a: 1, hint: 'Pogba arrivò gratis, divenne una stella a Torino e tornò allo United nel 2016 per circa 105 milioni — un affare eccellente per la Juve.' },
      { id: 'q_6586f9', en: 'A running track left fans far from the pitch', q: 'Lo Stadio delle Alpi, casa bianconera dal 1990 al 2006, era così detestato che il club finì per demolirlo. Qual era il difetto principale?', o: ['Non aveva copertura', 'La pista d’atletica teneva i tifosi lontani dal campo', 'Era fuori dai confini della città', 'Conteneva meno di 10.000 spettatori'], a: 1, hint: 'Costruito per il Mondiale 1990 con pista d’atletica e visuali pessime, creava un’atmosfera fredda; la Juve lo sostituì nel 2011 con lo Juventus Stadium di proprietà (dal 2017 Allianz Stadium).' },
      { id: 'q_3c99b9', en: 'The UEFA Cup', q: 'La Juventus fu il primo club al mondo a vincere tutte e tre le maggiori competizioni UEFA della sua epoca — Coppa dei Campioni, Coppa delle Coppe e quale altra?', o: ['La Coppa UEFA', 'La Coppa Intertoto', 'Solo la Supercoppa', 'La Coppa Latina'], a: 0, hint: 'Entro il 1985 la Juve aveva completato l’insieme di Coppa dei Campioni, Coppa delle Coppe e Coppa UEFA — prima squadra di sempre (riconosciuta con la Targa UEFA nel 1988), aggiungendo poi Supercoppa e Intercontinentale.' },
    ],
    copy: {
      tasterEyebrow: 'Prova gratis · Senza registrazione',
      tasterH: 'Quanto conosci davvero la Juve?',
      tasterPh: 'Dieci domande veloci per misurare il tuo Ball IQ bianconero.',
      tasterNote: 'Domande di esempio — nel quiz completo ce ne sono molte altre.',
      playSection: 'Gioca il quiz sulla Juventus',
      playSub: 'Tocca una risposta per controllare — esito immediato e la storia che c’è dietro.',
      faqH: 'Quiz Juventus — Domande frequenti',
      aboutQ: 'Informazioni sul quiz Juventus',
      bandH: 'Pensi di conoscere la Vecchia Signora? Dimostralo nell’app.',
      bandP: 'Serie di vittorie, 1v1 dal vivo, un punteggio su 99 — e tutti i quiz in un’unica app. L’app è in inglese.',
      alsoH: 'La stessa pagina in inglese',
      alsoP: 'Questa è la versione italiana del nostro quiz sulla Juventus. Tutte le domande in originale:',
      alsoLink: 'Juventus quiz (English)',
      statsLine: 'Le domande sulla Juventus in Ball IQ coprono tre livelli di difficoltà — facile, medio e difficile — tutte con spiegazione.',
    },
  },

  // ── INTER ──────────────────────────────────────────────────────────────────
  {
    club: 'Inter Milan',
    slug: 'inter-milan',
    lang: 'it',
    name: 'Inter',
    h1: 'Quiz Inter',
    title: 'Quiz Inter — I Nerazzurri e il Biscione | Ball IQ',
    description:
      'Quiz sull’Inter gratuito, con risposte spiegate: la Grande Inter di Herrera, il Triplete 2010, Ronaldo il Fenomeno, Meazza e la seconda stella.',
    kind: 'Quiz di club',
    statLine: 'Gratis · Domande sull’Inter con risposte spiegate · senza registrazione',
    playLabel: 'Inizia il quiz',
    intro: [
      'Nata nel 1908 da una scissione, con un nome che dichiarava già tutto: Internazionale. Questo quiz gratuito copre ogni epoca nerazzurra: la Grande Inter di Helenio Herrera e le due Coppe dei Campioni consecutive, Meazza e i suoi 284 gol, Ronaldo il Fenomeno, il Triplete di Mourinho nel 2010 e la seconda stella conquistata nel derby.',
      'Le domande diventano davvero difficili. Dove la storia del club è controversa, preferiamo non pubblicare la domanda piuttosto che prendere posizione. Va online solo ciò che si può verificare.',
      'Ogni risposta del set Inter ha una spiegazione scritta: anche sbagliando si impara qualcosa su come i nerazzurri hanno vinto quello che hanno vinto.',
    ],
    faq: [
      {
        q: 'Il quiz sull’Inter è gratuito?',
        a: 'Sì. Si gioca direttamente nel browser, senza registrarsi e senza scaricare nulla. Tutte le domande di questa pagina sono gratuite.',
      },
      {
        q: 'Quali argomenti copre il quiz?',
        a: 'La fondazione del 1908 e il Biscione, Giuseppe Meazza, la Grande Inter di Herrera e le Coppe dei Campioni 1964 e 1965, Matthäus e gli anni Ottanta, Ronaldo, il Triplete 2010 con Mourinho e Milito, lo Scudetto 2021 e la seconda stella del 2024. Si parte dal facile e si arriva a domande davvero toste.',
      },
      {
        q: 'Da dove vengono le domande?',
        a: 'Sono scritte e verificate a mano, mai generate automaticamente. Ogni informazione passa due controlli indipendenti prima di essere pubblicata; se un dato non si riesce a verificare, la domanda non esce.',
      },
      {
        q: 'L’app Ball IQ è in italiano?',
        a: 'Non ancora: questa pagina è in italiano, ma l’app è in inglese. Stiamo misurando l’interesse prima di tradurla — se sei arrivato fin qui, ci stai già aiutando a decidere.',
      },
    ],
    taster: [
      { id: 'q_2ad3fd', en: 'Black and blue', q: 'Il soprannome «Nerazzurri» si riferisce a quali due colori della maglia?', o: ['Nero e azzurro', 'Rosso e nero', 'Nero e bianco', 'Blu e bianco'], a: 0, hint: '«Nerazzurri» significa letteralmente nero e azzurro, i colori del club fin dalla fondazione del 1908.' },
      { id: 'q_107035', en: 'They wanted to welcome foreign players, not just Italians', q: 'L’Inter nacque nel 1908 quando un gruppo si separò dal Milan Cricket and Football Club. Qual era il disaccordo di fondo?', o: ['Volevano accogliere giocatori stranieri, non solo italiani', 'Rifiutavano di giocare con la maglia rossa', 'Volevano trasferirsi fuori da Milano', 'Erano contrari a far pagare il biglietto ai tifosi'], a: 0, hint: 'Il nome stesso «Internazionale» fu scelto per riflettere quello spirito aperto — e il primo capitano, Hernst Marktl, era svizzero.' },
      { id: 'q_342d0d', en: 'A serpent', q: 'Il soprannome «Il Biscione» rimanda a quale creatura, presa dallo stemma storico della dinastia milanese dei Visconti?', o: ['Un serpente', 'Un’aquila nera', 'Un cinghiale', 'Una lupa'], a: 0, hint: 'Il Biscione è un serpente raffigurato mentre divora (o partorisce) un bambino — simbolo milanese secolare, ripreso in diverse maglie dell’Inter nel corso degli anni.' },
      { id: 'q_96200d', q: 'Chi è il miglior marcatore di sempre dell’Inter, con 284 gol, tanto venerato che lo stadio porta il suo nome?', o: ['Giuseppe Meazza', 'Sandro Mazzola', 'Roberto Boninsegna', 'Alessandro Altobelli'], a: 0, hint: 'Meazza, due volte campione del mondo con l’Italia negli anni Trenta, segnò quei 284 gol in due periodi; San Siro fu ufficialmente intitolato «Stadio Giuseppe Meazza» nel 1980.' },
      { id: 'q_6a7095', en: 'The only club never relegated from the top flight', q: 'L’Inter detiene un primato unico nel calcio italiano che nessun altro club può vantare. Quale?', o: ['È l’unico club mai retrocesso dalla massima serie', 'È l’unico ad aver vinto tre Scudetti consecutivi', 'È l’unico ad aver vinto la Coppa dei Campioni per tre anni di fila', 'È l’unico club fondato nell’Ottocento'], a: 0, hint: 'L’Inter è presente ininterrottamente nella massima divisione dal debutto del 1909: non ha mai disputato una stagione in Serie B.' },
      { id: 'q_b01cfa', q: 'Negli anni Sessanta un allenatore costruì «la Grande Inter» attorno al celebre sistema difensivo del catenaccio. Chi era questo innovatore?', o: ['Helenio Herrera', 'Giovanni Trapattoni', 'Nereo Rocco', 'Alfredo Foni'], a: 0, hint: 'L’argentino-francese «Il Mago» portò l’Inter a due Coppe dei Campioni consecutive nel 1964 e 1965, base della reputazione continentale del club.' },
      { id: 'q_467b0f', q: 'L’Inter vinse la Coppa dei Campioni nel 1964 e la confermò nel 1965. Quale big spagnola battè 3-1 in quella prima finale del 1964?', o: ['Real Madrid', 'Barcellona', 'Atlético Madrid', 'Valencia'], a: 0, hint: 'Battere il Real Madrid dominante dell’epoca a Vienna presentò la Grande Inter come nuova potenza europea; l’anno dopo arrivò il successo sul Benfica.' },
      { id: 'q_6f7028', q: 'Nel 1997 l’Inter acquistò un ventenne brasiliano per una cifra allora record mondiale. Quale attaccante, presto soprannominato «il Fenomeno»?', o: ['Ronaldo', 'Adriano', 'Roberto Baggio', 'Christian Vieri'], a: 0, hint: 'Ronaldo divenne il secondo giocatore dopo Maradona a battere due volte il record mondiale di trasferimento; vinse il Pallone d’Oro 1997 da nuovo fenomeno nerazzurro.' },
      { id: 'q_2f34e9', q: 'Il Triplete 2009-10 fu completato con un 2-0 in finale di Champions sul Bayern Monaco. Chi segnò ENTRAMBI i gol dell’Inter quella sera?', o: ['Diego Milito', 'Samuel Eto’o', 'Wesley Sneijder', 'Goran Pandev'], a: 0, hint: 'Milito, «El Príncipe», fu il trascinatore del Triplete: la sua doppietta a Madrid regalò all’Inter la prima Coppa dei Campioni dopo 45 anni.' },
      { id: 'q_9e2ca5', en: 'Jose Mourinho', q: 'Chi ideò il Triplete 2010 dell’Inter — il primo di un club italiano — prima di andare al Real Madrid quell’estate?', o: ['José Mourinho', 'Roberto Mancini', 'Rafa Benítez', 'Claudio Ranieri'], a: 0, hint: 'L’Inter lo conquistò battendo il Bayern 2-0 in finale — giocata proprio al Bernabéu del Real Madrid, il club in cui Mourinho passò pochi giorni dopo.' },
    ],
    sample: [
      { id: 'q_2d2788', q: 'L’Inter gioca le partite casalinghe in quale stadio, condiviso con i rivali cittadini del Milan?', o: ['San Siro (Giuseppe Meazza)', 'Stadio Olimpico', 'Allianz Stadium', 'Stadio Diego Armando Maradona'], a: 0, hint: 'Entrambe le milanesi condividono San Siro, ufficialmente Stadio Giuseppe Meazza.' },
      { id: 'q_d03fb1', q: 'Il derby fra Inter e Milan ha un nome poetico che rimanda a una statua dorata sulla cattedrale della città. Come si chiama?', o: ['Derby della Madonnina', 'Derby della Lanterna', 'Derby della Mole', 'Derby del Sole'], a: 0, hint: 'La Madonnina è la statua dorata della Vergine che corona il Duomo di Milano — il simbolo che entrambi i club condividono sopra la loro città.' },
      { id: 'q_3bd1a0', en: 'AC Milan', q: 'L’Inter condivide San Siro con il Milan da decenni. Ma lo stadio fu costruito originariamente per quale club, che vi giocò per primo?', o: ['Milan', 'Inter', 'Entrambe fin dall’inizio', 'Nessuna delle due — era un campo neutro'], a: 0, hint: 'San Siro fu inaugurato nel 1926 come campo del Milan; l’Inter vi si trasferì come co-inquilina solo nel 1947.' },
      { id: 'q_b0a8a7', en: 'Three', q: 'Al 2025, quante volte l’Inter aveva vinto la Coppa dei Campioni / Champions League?', o: ['Tre', 'Due', 'Cinque', 'Una'], a: 0, hint: 'L’Inter ha alzato il trofeo nel 1964, 1965 e 2010, per tre titoli continentali.' },
      { id: 'q_42f6a6', en: 'The Calciopoli match-fixing scandal', q: 'All’Inter fu assegnato lo Scudetto 2005-06 pur avendo chiuso terza sul campo. Cosa causò questa assegnazione insolita?', o: ['Lo scandalo di Calciopoli', 'Un ricalcolo della differenza reti', 'Una penalizzazione per disordini del pubblico', 'La ripetizione di una partita sospesa'], a: 0, hint: 'Lo scandalo del 2006 portò alla revoca del titolo alla Juventus e alla retrocessione in Serie B; la FIGC assegnò lo Scudetto all’Inter, arrivata dietro sia alla Juve sia al Milan.' },
      { id: 'q_f1c6c4', en: 'Barcelona', q: 'Nella cavalcata verso il Triplete 2009-10, l’Inter eliminò i campioni d’Europa in carica in una semifinale drammatica. Quale club?', o: ['Barcellona', 'Manchester United', 'Chelsea', 'Real Madrid'], a: 0, hint: 'La squadra di Mourinho resistette al Barcellona di Guardiola nel doppio confronto, difendendo eroicamente in dieci uomini al Camp Nou.' },
      { id: 'q_d0a6c2', en: 'Juventus\' nine straight titles', q: 'Lo Scudetto 2021 dell’Inter fu storicamente significativo perché interruppe una lunga striscia di quale rivale?', o: ['I nove titoli consecutivi della Juventus', 'Il dominio del Milan', 'Il tre di fila del Napoli', 'La difesa del titolo della Roma'], a: 0, hint: 'La squadra di Antonio Conte, trascinata da Romelu Lukaku, spezzò il dominio novennale della Juventus conquistando il primo Scudetto nerazzurro dopo undici anni.' },
      { id: 'q_4c1c4c', en: 'They sealed it by beating Milan in the derby', q: 'Nell’aprile 2024 l’Inter conquistò il ventesimo titolo e la tanto attesa seconda stella. Cosa rese il momento ancora più dolce per i tifosi?', o: ['Lo chiusero battendo il Milan nel derby', 'Lo vinsero nello stadio della Juventus', 'Lo conquistarono all’ultima giornata', 'Lo vinsero senza perdere una sola partita'], a: 0, hint: 'La squadra di Simone Inzaghi chiuse i conti con un 2-1 nel Derby della Madonnina — superando i cugini di uno Scudetto.' },
      { id: 'q_6d8cea', en: 'Reaching 20 league titles', q: 'Le due stelle sopra lo stemma dell’Inter rappresentano un traguardo legato a quale risultato?', o: ['Aver raggiunto 20 titoli di campionato', 'Aver vinto 20 trofei in totale', 'Venti stagioni imbattuti in casa', 'Aver prodotto 20 nazionali italiani'], a: 0, hint: 'In Italia si assegna una stella ogni dieci Scudetti; il titolo 2024 portò l’Inter a quota 20, sbloccando la seconda stella.' },
      { id: 'q_c18463', q: 'Quale difensore dell’Inter fu protagonista dell’episodio che portò all’espulsione di Zinedine Zidane nella finale del Mondiale 2006?', o: ['Marco Materazzi', 'Iván Córdoba', 'Walter Samuel', 'Cristian Chivu'], a: 0, hint: 'Lo scambio verbale con Materazzi provocò la famosa testata; il ruvido centrale nerazzurro era un guerriero divisivo ma amatissimo, e quella sera segnò anche il pareggio dell’Italia.' },
      { id: 'q_57c1db', en: 'His usual number 9 had been given to new signing Ronaldo', q: 'L’attaccante cileno Iván Zamorano indossò all’Inter il celebre numero «1+8». Perché?', o: ['Il suo 9 era stato dato al nuovo acquisto Ronaldo', 'Il numero 9 era vietato dalla lega quella stagione', 'Era superstizioso riguardo ai numeri a una cifra', 'Voleva onorare due compagni ritirati'], a: 0, hint: 'Quando Ronaldo prese il 9, Zamorano indossò ironicamente «1+8», che sommato fa nove.' },
      { id: 'q_841b70', q: 'L’Inter ha ritirato la maglia numero 3 in onore di quale bandiera, poi diventata presidente del club?', o: ['Giacinto Facchetti', 'Javier Zanetti', 'Beppe Bergomi', 'Ivano Bordon'], a: 0, hint: 'Il terzino sinistro offensivo Giacinto Facchetti ebbe il numero 3 ritirato; fu poi presidente dell’Inter fino alla morte nel 2006.' },
    ],
    copy: {
      tasterEyebrow: 'Prova gratis · Senza registrazione',
      tasterH: 'Quanto conosci davvero l’Inter?',
      tasterPh: 'Dieci domande veloci per misurare il tuo Ball IQ nerazzurro.',
      tasterNote: 'Domande di esempio — nel quiz completo ce ne sono molte altre.',
      playSection: 'Gioca il quiz sull’Inter',
      playSub: 'Tocca una risposta per controllare — esito immediato e la storia che c’è dietro.',
      faqH: 'Quiz Inter — Domande frequenti',
      aboutQ: 'Informazioni sul quiz Inter',
      bandH: 'Pensi di conoscere il Biscione? Dimostralo nell’app.',
      bandP: 'Serie di vittorie, 1v1 dal vivo, un punteggio su 99 — e tutti i quiz in un’unica app. L’app è in inglese.',
      alsoH: 'La stessa pagina in inglese',
      alsoP: 'Questa è la versione italiana del nostro quiz sull’Inter. Tutte le domande in originale:',
      alsoLink: 'Inter Milan quiz (English)',
      statsLine: 'Le domande sull’Inter in Ball IQ coprono tre livelli di difficoltà — facile, medio e difficile — tutte con spiegazione.',
    },
  },

  // ── MILAN ──────────────────────────────────────────────────────────────────
  {
    club: 'AC Milan',
    slug: 'ac-milan',
    lang: 'it',
    name: 'Milan',
    h1: 'Quiz Milan',
    title: 'Quiz Milan — Il Diavolo e i Rossoneri | Ball IQ',
    description:
      'Quiz sul Milan gratuito, con risposte spiegate: gli olandesi di Sacchi, gli Invincibili di Capello, Maldini, Kaká, le sette Coppe dei Campioni.',
    kind: 'Quiz di club',
    statLine: 'Gratis · Domande sul Milan con risposte spiegate · senza registrazione',
    playLabel: 'Inizia il quiz',
    intro: [
      'Fondato nel 1899 da un inglese di Nottingham, ed è per questo che si scrive «Milan» e non «Milano». Questo quiz gratuito attraversa tutte le epoche rossonere: Nordahl e i suoi 221 gol, la prima Coppa dei Campioni italiana nel 1963, l’arrivo in elicottero di Berlusconi, il trio olandese di Sacchi, gli Invincibili di Capello, Maldini, Kaká e le notti di Istanbul e Atene.',
      'Le domande diventano davvero difficili. Dove la storia del club è controversa, preferiamo non pubblicare la domanda piuttosto che prendere posizione. Va online solo ciò che si può verificare.',
      'Ogni risposta del set Milan ha una spiegazione scritta: anche sbagliando si impara qualcosa su come il Diavolo ha vinto quello che ha vinto.',
    ],
    faq: [
      {
        q: 'Il quiz sul Milan è gratuito?',
        a: 'Sì. Si gioca direttamente nel browser, senza registrarsi e senza scaricare nulla. Tutte le domande di questa pagina sono gratuite.',
      },
      {
        q: 'Quali argomenti copre il quiz?',
        a: 'Le origini inglesi e Herbert Kilpin, Nordahl e gli anni Cinquanta, la Coppa dei Campioni 1963 con Rocco e Altafini, Rivera, l’era Berlusconi, il trio olandese di Sacchi, gli Invincibili di Capello, Weah, Maldini e Baresi, le finali del 2003, 2005 e 2007 e lo Scudetto 2022. Si parte dal facile e si arriva a domande davvero toste.',
      },
      {
        q: 'Da dove vengono le domande?',
        a: 'Sono scritte e verificate a mano, mai generate automaticamente. Ogni informazione passa due controlli indipendenti prima di essere pubblicata; se un dato non si riesce a verificare, la domanda non esce.',
      },
      {
        q: 'L’app Ball IQ è in italiano?',
        a: 'Non ancora: questa pagina è in italiano, ma l’app è in inglese. Stiamo misurando l’interesse prima di tradurla — se sei arrivato fin qui, ci stai già aiutando a decidere.',
      },
    ],
    taster: [
      { id: 'q_8c359d', q: 'Il derby casalingo del Milan contro l’Inter ha un nome celebre. Quale?', o: ['Derby della Madonnina', 'Derby della Lanterna', 'Derby della Mole', 'Derby del Sole'], a: 0, hint: 'Prende il nome dalla statua dorata della Madonnina in cima al Duomo di Milano, che veglia sull’intera città.' },
      { id: 'q_557793', q: 'Il Milan fu fondato nel 1899 da un inglese di Nottingham. Come si chiamava?', o: ['Herbert Kilpin', 'William Garbutt', 'James Richardson Spensley', 'Alfred Edwards'], a: 0, hint: 'Kilpin fu il primo giocatore-allenatore del club e scelse i colori rossonero; la grafia molto inglese «Milan» (non «Milano») sopravvive ancora oggi come omaggio ai fondatori.' },
      { id: 'q_3cbc6e', en: 'Red like fire, and black to strike fear into opponents — \'a team of devils\'', q: 'Il fondatore Herbert Kilpin diede una motivazione celebre ai colori rossoneri. Cosa disse che rappresentassero?', o: ['Rosso come il fuoco, e nero per incutere timore agli avversari — «una squadra di diavoli»', 'L’alba rossa e il nero del cielo notturno', 'Il sangue e la cenere della storia della città', 'Il vino rosso e il caffè nero che amava'], a: 0, hint: 'La frase di Kilpin — «saremo una squadra di diavoli, i nostri colori rossi come il fuoco e neri per incutere timore agli avversari» — è il motivo per cui il Milan è soprannominato «il Diavolo».' },
      { id: 'q_0d3613', q: 'Chi è il miglior marcatore di sempre del Milan, uno svedese che segnò 221 gol negli anni Cinquanta?', o: ['Gunnar Nordahl', 'Andrij Ševčenko', 'Marco van Basten', 'Filippo Inzaghi'], a: 0, hint: 'Nordahl segnò 221 gol in appena 257 partite in sette stagioni. Vinse cinque volte il titolo di capocannoniere della Serie A, un record nella storia del calcio italiano.' },
      { id: 'q_013ae5', en: 'Gullit, Van Basten and Rijkaard', q: 'La grande squadra di Arrigo Sacchi era costruita attorno a tre fuoriclasse olandesi. Quale trio?', o: ['Gullit, Van Basten e Rijkaard', 'Cruyff, Neeskens e Krol', 'Bergkamp, Davids e Seedorf', 'Van Nistelrooy, Kluivert e Davids'], a: 0, hint: 'Tutti e tre furono protagonisti nelle due Coppe dei Campioni consecutive del Milan (1989 e 1990). Van Basten vinse il Pallone d’Oro nel 1988, 1989 e 1992 durante quel periodo d’oro.' },
      { id: 'q_34051e', en: '7', q: 'Solo il Real Madrid ha vinto più Coppe dei Campioni / Champions League del Milan. Quante ne ha vinte il Milan?', o: ['7', '5', '6', '9'], a: 0, hint: 'I successi del Milan sono del 1963, 1969, 1989, 1990, 1994, 2003 e 2007 — più di ogni altro club tranne il Real Madrid.' },
      { id: 'q_e93735', q: 'La finale europea più dolorosa del Milan fu quella del 2005, quando conduceva 3-0 all’intervallo e perse ai rigori. Contro chi?', o: ['Liverpool', 'Juventus', 'Real Madrid', 'Porto'], a: 0, hint: 'Il calcio la chiama «il Miracolo di Istanbul» — gli inglesi segnarono tre gol in sei minuti nella ripresa. Il Milan si sarebbe vendicato due anni dopo ad Atene.' },
      { id: 'q_87d4a4', q: 'Dopo il trauma della finale 2005, il Milan si prese la rivincita sul Liverpool nella finale di Champions 2007. Chi segnò entrambi i gol rossoneri?', o: ['Filippo Inzaghi', 'Kaká', 'Andrij Ševčenko', 'Clarence Seedorf'], a: 0, hint: 'Inzaghi, escluso dalla lista del 2005, segnò due volte ad Atene. Il primo gol entrò famosamente con una deviazione su punizione di Pirlo.' },
      { id: 'q_1a7e50', en: '58 Serie A games unbeaten', q: 'Il Milan di Fabio Capello si guadagnò il soprannome «gli Invincibili» per un primato. Quale?', o: ['58 partite di Serie A da imbattuti', 'Tre triplete consecutivi', 'Zero gol subiti in una stagione', 'Vincere tutte le trasferte per due anni'], a: 0, hint: 'La striscia di 58 partite senza sconfitte (1991-1993) è tuttora la più lunga nella storia della Serie A, e comprese un intero campionato di 34 giornate senza una sconfitta.' },
      { id: 'q_b14574', q: 'Questo giocatore segnò un celebre gol in solitaria da un’area all’altra contro il Verona e nel 1995 divenne il primo africano a vincere il Pallone d’Oro. Chi?', o: ['George Weah', 'Ruud Gullit', 'Marcel Desailly', 'Clarence Seedorf'], a: 0, hint: 'Weah raccolse palla vicino alla propria area e percorse tutto il campo. Resta l’unico africano ad aver mai vinto il Pallone d’Oro.' },
    ],
    sample: [
      { id: 'q_410119', en: 'Milan Foot-Ball and Cricket Club', q: 'Il nome originale del 1899 rivela che non si trattava solo di calcio. Come si chiamava?', o: ['Milan Foot-Ball and Cricket Club', 'Milan Athletic Society', 'Milan Gymnastic Union', 'Milan Sporting Club Internazionale'], a: 0, hint: 'I fondatori inglesi amavano anche il cricket, da cui il nome. La «C» di «A.C.» oggi sta per Calcio, ma le radici inglesi sono il motivo per cui si dice «Milan» e non «Milano».' },
      { id: 'q_2c5790', en: 'The flag of the city of Milan (cross of Saint Ambrose / Saint George)', q: 'Lo stemma del Milan presenta una croce rossa su fondo bianco. Qual è l’origine di quel simbolo?', o: ['La bandiera della città di Milano (croce di Sant’Ambrogio / San Giorgio)', 'La bandiera inglese in onore dei fondatori', 'I colori della città natale del fondatore Kilpin', 'L’emblema della casa reale italiana'], a: 0, hint: 'La croce rossa in campo bianco è la bandiera storica del comune di Milano (la croce di Sant’Ambrogio, suo patrono, identica a quella di San Giorgio). Le strisce rossonere, invece, furono scelte da Kilpin per rappresentare il fuoco e i «diavoli».' },
      { id: 'q_82a712', q: 'Nel 1963 il Milan divenne il primo club italiano a vincere la Coppa dei Campioni, battendo il Benfica a Wembley. Chi era il capitano quel giorno?', o: ['Cesare Maldini', 'Gianni Rivera', 'Nils Liedholm', 'Giovanni Trapattoni'], a: 0, hint: 'Il figlio di Cesare, Paolo, avrebbe alzato lo stesso trofeo da capitano del Milan in Inghilterra 40 anni dopo, nel 2003 — una simmetria padre-figlio straordinaria.' },
      { id: 'q_354ff6', q: 'Quale allenatore ideò il primo trionfo in Coppa dei Campioni del Milan nel 1963?', o: ['Nereo Rocco', 'Nils Liedholm', 'Giovanni Trapattoni', 'Gipo Viani'], a: 0, hint: 'Rocco, maestro del catenaccio all’italiana, guidò il Milan al primo titolo europeo di un club italiano.' },
      { id: 'q_77ef48', q: 'Due gol di un attaccante brasiliano diedero al Milan la Coppa dei Campioni 1963 contro il Benfica. Chi li segnò?', o: ['José Altafini', 'Paolo Barison', 'Dino Sani', 'Gianni Rivera'], a: 0, hint: 'Altafini, soprannominato «Mazzola», resta uno dei migliori marcatori rossoneri in Coppa dei Campioni. Aveva giocato con il Brasile al Mondiale 1958 prima di passare all’Italia.' },
      { id: 'q_e559c8', q: 'Quale raffinato regista, «Golden Boy» e Pallone d’Oro 1969, è una delle icone più amate della storia del Milan?', o: ['Gianni Rivera', 'Sandro Mazzola', 'Giuseppe Meazza', 'Roberto Baggio'], a: 0, hint: 'Rivera passò 19 anni al Milan e resta l’unico centrocampista di formazione italiana ad aver vinto il Pallone d’Oro con quella maglia. In seguito è diventato politico.' },
      { id: 'q_b94a7c', q: 'Nel luglio 1986 il nuovo proprietario inscenò un insediamento teatrale, arrivando in elicottero sulle note della «Cavalcata delle Valchirie» di Wagner. Chi era?', o: ['Silvio Berlusconi', 'Adriano Galliani', 'Paolo Berlusconi', 'Felice Riva'], a: 0, hint: 'Berlusconi fece atterrare tre elicotteri Agusta all’Arena Civica davanti a 10.000 tifosi. La sua era trasformò un club quasi in bancarotta nella forza dominante del calcio europeo.' },
      { id: 'q_dde9da', en: '4-0', q: 'Nella finale di Coppa dei Campioni 1989 il Milan demolì la Steaua Bucarest. Con quale risultato?', o: ['4-0', '2-1', '3-2', '5-1'], a: 0, hint: 'Gullit e Van Basten segnarono due gol a testa in una lezione di calcio al Camp Nou. Il Milan confermò poi il trofeo nel 1990, primo a riuscirci dopo un decennio.' },
      { id: 'q_35ee33', en: '4-0', q: 'Nella finale di Champions League 1994 il Milan produsse una prestazione strepitosa contro il Barcellona. Con quale risultato?', o: ['4-0', '2-1', '3-2', '1-0'], a: 0, hint: 'Il Milan travolse 4-0 il «Dream Team» di Cruyff ad Atene, una delle finali più a senso unico di sempre, alzando la quinta Coppa dei Campioni.' },
      { id: 'q_80817d', en: 'Franco Baresi and Alessandro Costacurta', q: 'Nell’era dominante di Sacchi e Capello, la difesa del Milan era guidata da una linea leggendaria. Quale coppia di centrali le è più associata?', o: ['Franco Baresi e Alessandro Costacurta', 'Fabio Cannavaro e Ciro Ferrara', 'Claudio Gentile e Gaetano Scirea', 'Giorgio Chiellini e Leonardo Bonucci'], a: 0, hint: 'Baresi era il capitano e il club ha ritirato la sua maglia numero 6. La loro trappola del fuorigioco ha definito un’epoca della difesa italiana.' },
      { id: 'q_578af1', en: 'It can be brought back if one of his sons plays for the first team', q: 'Il Milan ha ritirato la maglia numero 3 di Paolo Maldini, ma con una condizione insolita. Quale?', o: ['Può tornare in campo se uno dei suoi figli gioca in prima squadra', 'Torna disponibile solo dopo la sua morte', 'Può essere messa all’asta per beneficenza', 'Passa a chi viene nominato capitano'], a: 0, hint: 'A differenza del numero 6 di Franco Baresi (ritirato per sempre), Galliani disse che il 3 di Maldini era solo messo da parte: sarebbe potuto tornare se un figlio Maldini avesse indossato il rossonero. Sia Christian sia Daniel sono cresciuti nel vivaio.' },
      { id: 'q_bd8cda', en: '2021-22', q: 'Il Milan interruppe un digiuno di undici anni vincendo lo Scudetto in quale stagione?', o: ['2021-22', '2019-20', '2018-19', '2022-23'], a: 0, hint: 'La squadra di Stefano Pioli superò i rivali cittadini dell’Inter, chiudendo con una vittoria a Sassuolo. Era il diciannovesimo titolo del Milan.' },
    ],
    copy: {
      tasterEyebrow: 'Prova gratis · Senza registrazione',
      tasterH: 'Quanto conosci davvero il Milan?',
      tasterPh: 'Dieci domande veloci per misurare il tuo Ball IQ rossonero.',
      tasterNote: 'Domande di esempio — nel quiz completo ce ne sono molte altre.',
      playSection: 'Gioca il quiz sul Milan',
      playSub: 'Tocca una risposta per controllare — esito immediato e la storia che c’è dietro.',
      faqH: 'Quiz Milan — Domande frequenti',
      aboutQ: 'Informazioni sul quiz Milan',
      bandH: 'Pensi di conoscere il Diavolo? Dimostralo nell’app.',
      bandP: 'Serie di vittorie, 1v1 dal vivo, un punteggio su 99 — e tutti i quiz in un’unica app. L’app è in inglese.',
      alsoH: 'La stessa pagina in inglese',
      alsoP: 'Questa è la versione italiana del nostro quiz sul Milan. Tutte le domande in originale:',
      alsoLink: 'AC Milan quiz (English)',
      statsLine: 'Le domande sul Milan in Ball IQ coprono tre livelli di difficoltà — facile, medio e difficile — tutte con spiegazione.',
    },
  },

  // ── NAPOLI ─────────────────────────────────────────────────────────────────
  {
    club: 'Napoli',
    slug: 'napoli',
    lang: 'it',
    name: 'Napoli',
    h1: 'Quiz Napoli',
    title: 'Quiz Napoli — Maradona e i quattro Scudetti | Ball IQ',
    description:
      'Quiz sul Napoli gratuito, con risposte spiegate: Maradona, il Ma-Gi-Ca, la Coppa UEFA 1989, Sarri, lo Scudetto di Spalletti e quello di Conte.',
    kind: 'Quiz di club',
    statLine: 'Gratis · Domande sul Napoli con risposte spiegate · senza registrazione',
    playLabel: 'Inizia il quiz',
    intro: [
      'Un club che ha vissuto tutto: il fallimento e la ripartenza dalla Serie C1, e poi quattro Scudetti. Questo quiz gratuito copre ogni epoca azzurra: l’arrivo di Maradona nel 1984, il tridente Ma-Gi-Ca con Careca e Giordano, la Coppa UEFA 1989, il Sarriball dei 91 punti, il titolo di Spalletti dopo 33 anni e quello di Conte nel 2025.',
      'Le domande diventano davvero difficili. Dove la storia del club è controversa, preferiamo non pubblicare la domanda piuttosto che prendere posizione. Va online solo ciò che si può verificare.',
      'Ogni risposta del set Napoli ha una spiegazione scritta: anche sbagliando si impara qualcosa su come gli azzurri hanno vinto quello che hanno vinto.',
    ],
    faq: [
      { q: 'Il quiz sul Napoli è gratuito?', a: 'Sì. Si gioca direttamente nel browser, senza registrarsi e senza scaricare nulla. Tutte le domande di questa pagina sono gratuite.' },
      { q: 'Quali argomenti copre il quiz?', a: 'La fondazione del 1926, gli anni di Maradona e i primi due Scudetti, la Coppa UEFA 1989, il fallimento del 2004 e la risalita dalla Serie C1, Mazzarri e Benítez, il Sarriball, Higuaín e Mertens, gli Scudetti del 2023 e del 2025. Si parte dal facile e si arriva a domande davvero toste.' },
      { q: 'Da dove vengono le domande?', a: 'Sono scritte e verificate a mano, mai generate automaticamente. Ogni informazione passa due controlli indipendenti prima di essere pubblicata; se un dato non si riesce a verificare, la domanda non esce.' },
      { q: 'L’app Ball IQ è in italiano?', a: 'Non ancora: questa pagina è in italiano, ma l’app è in inglese. Stiamo misurando l’interesse prima di tradurla — se sei arrivato fin qui, ci stai già aiutando a decidere.' },
    ],
    taster: [
      { id: 'q_d9296b', q: 'In quale anno fu fondato, come Associazione Calcio Napoli, il club da cui nasce il Napoli moderno?', o: ['1904', '1919', '1926', '1932'], a: 2, hint: 'L’Associazione Calcio Napoli fu fondata nel 1926, nata dal precedente Naples Foot-Ball Club.' },
      { id: 'q_0d2717', en: 'Barcelona', q: 'Da quale club il Napoli acquistò Diego Maradona nel 1984, per una cifra allora record mondiale?', o: ['Boca Juniors', 'Barcellona', 'Argentinos Juniors', 'River Plate'], a: 1, hint: 'Il Napoli pagò al Barcellona una cifra record mondiale di circa 6,9 milioni di sterline per portare Maradona a Napoli nel 1984.' },
      { id: 'q_84bbb8', q: 'In quale stagione il Napoli vinse il suo primo Scudetto?', o: ['1984-85', '1986-87', '1987-88', '1989-90'], a: 1, hint: 'Maradona trascinò il Napoli al primo storico Scudetto nella stagione 1986-87.' },
      { id: 'q_bd5efa', q: 'Quale attaccante brasiliano formò il celebre tridente «Ma-Gi-Ca» con Maradona e Bruno Giordano?', o: ['Careca', 'Müller', 'Casagrande', 'Romário'], a: 0, hint: 'Le iniziali di Careca, Maradona e Giordano componevano «Ma-Gi-Ca», il temutissimo attacco azzurro degli anni Ottanta.' },
      { id: 'q_a38468', en: 'UEFA Cup', q: 'Quale trofeo europeo vinse il Napoli nel 1989, unico grande alloro continentale del club?', o: ['La Coppa UEFA', 'La Coppa dei Campioni', 'La Coppa delle Coppe', 'La Supercoppa UEFA'], a: 0, hint: 'Il Napoli alzò la Coppa UEFA 1988-89 con Maradona in squadra: il suo unico grande titolo europeo.' },
      { id: 'q_78207b', q: 'Lo stadio del Napoli fu intitolato a Diego Maradona nel 2020. Come si chiamava prima?', o: ['Stadio Arturo Collana', 'Stadio Partenopeo', 'Stadio San Paolo', 'Stadio Ascarelli'], a: 2, hint: 'Lo Stadio San Paolo fu rinominato Stadio Diego Armando Maradona poco dopo la sua morte, nel 2020.' },
      { id: 'q_19b641', q: 'Chi è il miglior marcatore di sempre del Napoli al 2024?', o: ['Marek Hamšík', 'Diego Maradona', 'Dries Mertens', 'Edinson Cavani'], a: 2, hint: 'Dries Mertens ha chiuso la sua avventura napoletana con 148 gol, più di chiunque altro nella storia del club.' },
      { id: 'q_92ff4b', q: 'Quale centrocampista slovacco deteneva al 2024 il record di presenze con il Napoli?', o: ['Marek Hamšík', 'Lorenzo Insigne', 'Piotr Zieliński', 'Ciro Ferrara'], a: 0, hint: 'Marek Hamšík ha superato le 500 presenze con il Napoli, più di ogni altro giocatore.' },
      { id: 'q_5d778e', q: 'Quale allenatore portò il Napoli allo Scudetto 2022-23, il primo dopo 33 anni?', o: ['Antonio Conte', 'Gennaro Gattuso', 'Luciano Spalletti', 'Maurizio Sarri'], a: 2, hint: 'La squadra di Luciano Spalletti dominò il campionato 2022-23, prima del suo addio in estate.' },
      { id: 'q_e84752', q: 'Quale ex allenatore di Chelsea e Juventus guidò il Napoli allo Scudetto 2024-25?', o: ['Antonio Conte', 'Luciano Spalletti', 'Maurizio Sarri', 'Carlo Ancelotti'], a: 0, hint: 'Antonio Conte arrivò al Napoli nel 2024 e vinse lo Scudetto alla prima stagione: il quarto della storia del club.' },
    ],
    sample: [
      { id: 'q_40c12f', q: 'Quanti Scudetti aveva vinto il Napoli nella sua storia al 2025?', o: ['2', '3', '4', '5'], a: 2, hint: 'Gli Scudetti del Napoli sono arrivati nel 1986-87, 1989-90, 2022-23 e 2024-25: quattro in totale.' },
      { id: 'q_a12fb4', q: 'Quanti gol segnò Gonzalo Higuaín in Serie A con il Napoli nel 2015-16, stabilendo un nuovo record stagionale?', o: ['32', '34', '36', '38'], a: 2, hint: 'I 36 gol di Higuaín nel 2015-16 batterono il record di sempre in una singola stagione di Serie A, che apparteneva a Gunnar Nordahl.' },
      { id: 'q_fefedc', q: 'In quale stagione il Napoli raccolse il record di 91 punti, chiudendo comunque secondo dietro la Juventus?', o: ['2015-16', '2016-17', '2017-18', '2018-19'], a: 2, hint: 'Il Napoli di Sarri arrivò a 91 punti nel 2017-18, ma la Juventus vinse il campionato con 95.' },
      { id: 'q_97541d', q: 'Quale allenatore introdusse al Napoli il gioco fluido del «Sarriball» fra il 2015 e il 2018?', o: ['Maurizio Sarri', 'Rafael Benítez', 'Walter Mazzarri', 'Carlo Ancelotti'], a: 0, hint: 'Il Napoli offensivo di Maurizio Sarri divenne celebre per lo stile di palleggio ribattezzato «Sarriball».' },
      { id: 'q_7e7644', q: 'A quale club il Napoli vendette Edinson Cavani nel 2013, per una cifra allora record per il club?', o: ['Paris Saint-Germain', 'Real Madrid', 'Chelsea', 'Manchester City'], a: 0, hint: 'Cavani passò al PSG nel 2013 per circa 64 milioni, all’epoca la cessione più ricca nella storia del Napoli.' },
      { id: 'q_1ccf56', q: 'Da quale club francese il Napoli acquistò l’attaccante Victor Osimhen nel 2020?', o: ['Lille', 'Lione', 'Monaco', 'Marsiglia'], a: 0, hint: 'Il Napoli comprò Osimhen dal Lille nel 2020 per una cifra allora record per il club, circa 70 milioni.' },
      { id: 'q_f7339b', q: 'Di chi Marek Hamšík superò il record di gol con il Napoli nel 2017?', o: ['Careca', 'Diego Maradona', 'Attila Sallustro', 'Edinson Cavani'], a: 1, hint: 'Hamšík superò quota 115 gol di Maradona nel dicembre 2017, prima che Mertens passasse più avanti entrambi.' },
      { id: 'q_db0940', q: 'Dopo il fallimento del 2004, il Napoli fu rifondato e costretto a ripartire da quale categoria?', o: ['Serie B', 'Serie C1', 'Serie C2', 'Serie D'], a: 1, hint: 'Il club rifondato cominciò la stagione 2004-05 in Serie C1, la terza serie italiana, prima di risalire.' },
      { id: 'q_37f0e0', q: 'Quale club il Napoli battè ai rigori nella finale di Coppa Italia 2020?', o: ['Inter', 'Milan', 'Lazio', 'Juventus'], a: 3, hint: 'Dopo lo 0-0, il Napoli superò la Juventus 4-2 ai rigori nella finale di Coppa Italia 2020.' },
      { id: 'q_b656b3', q: 'Con quanti gol Victor Osimhen vinse il titolo di capocannoniere della Serie A 2022-23?', o: ['21', '24', '26', '29'], a: 2, hint: 'I 26 gol in campionato di Osimhen ne fecero il primo africano capocannoniere assoluto della Serie A.' },
      { id: 'q_a3b0b7', q: 'Il Napoli si fece rimontare clamorosamente un vantaggio in campionato nel 1987-88, perdendo lo Scudetto a favore di quale club?', o: ['Milan', 'Inter', 'Juventus', 'Sampdoria'], a: 0, hint: 'Il Milan di Arrigo Sacchi superò il Napoli nel finale del 1987-88, con una vittoria decisiva proprio a Napoli.' },
      { id: 'q_584206', q: 'Il colpo di testa nel finale di quale difensore regalò al Napoli la vittoria in casa della Juventus nell’aprile 2018, riaprendo la corsa al titolo?', o: ['Raúl Albiol', 'Kalidou Koulibaly', 'Nikola Maksimović', 'Mário Rui'], a: 1, hint: 'Il colpo di testa di Kalidou Koulibaly al 90° firmò un celebre 1-0 a Torino nell’aprile 2018.' },
    ],
    copy: {
      tasterEyebrow: 'Prova gratis · Senza registrazione',
      tasterH: 'Quanto conosci davvero il Napoli?',
      tasterPh: 'Dieci domande veloci per misurare il tuo Ball IQ azzurro.',
      tasterNote: 'Domande di esempio — nel quiz completo ce ne sono molte altre.',
      playSection: 'Gioca il quiz sul Napoli',
      playSub: 'Tocca una risposta per controllare — esito immediato e la storia che c’è dietro.',
      faqH: 'Quiz Napoli — Domande frequenti',
      aboutQ: 'Informazioni sul quiz Napoli',
      bandH: 'Pensi di conoscere il Napoli? Dimostralo nell’app.',
      bandP: 'Serie di vittorie, 1v1 dal vivo, un punteggio su 99 — e tutti i quiz in un’unica app. L’app è in inglese.',
      alsoH: 'La stessa pagina in inglese',
      alsoP: 'Questa è la versione italiana del nostro quiz sul Napoli. Tutte le domande in originale:',
      alsoLink: 'Napoli quiz (English)',
      statsLine: 'Le domande sul Napoli in Ball IQ coprono tre livelli di difficoltà — facile, medio e difficile — tutte con spiegazione.',
    },
  },

  // ── ROMA ───────────────────────────────────────────────────────────────────
  {
    club: 'Roma',
    slug: 'roma',
    lang: 'it',
    name: 'Roma',
    h1: 'Quiz Roma',
    title: 'Quiz Roma — I Giallorossi e Er Capitano | Ball IQ',
    description:
      'Quiz sulla Roma gratuito, con risposte spiegate: Totti, Falcão, lo Scudetto 2001, la finale del 1984, la rimonta sul Barcellona e Tirana 2022.',
    kind: 'Quiz di club',
    statLine: 'Gratis · Domande sulla Roma con risposte spiegate · senza registrazione',
    playLabel: 'Inizia il quiz',
    intro: [
      'Tre Scudetti, una notte europea leggendaria e un capitano rimasto una vita sola squadra. Questo quiz gratuito attraversa tutte le epoche giallorosse: il gol di Turone, la squadra di Liedholm con Falcão «Ottavo Re di Roma», la finale di Coppa dei Campioni 1984 persa in casa ai rigori, lo Scudetto 2001 con Batistuta e Totti, la rimonta sul Barcellona e la Conference League di Tirana.',
      'Le domande diventano davvero difficili. Dove la storia del club è controversa — e il gol di Turone lo è ancora — preferiamo non pubblicare la domanda piuttosto che prendere posizione. Va online solo ciò che si può verificare.',
      'Ogni risposta del set Roma ha una spiegazione scritta: anche sbagliando si impara qualcosa su come i giallorossi hanno vinto quello che hanno vinto.',
    ],
    faq: [
      { q: 'Il quiz sulla Roma è gratuito?', a: 'Sì. Si gioca direttamente nel browser, senza registrarsi e senza scaricare nulla. Tutte le domande di questa pagina sono gratuite.' },
      { q: 'Quali argomenti copre il quiz?', a: 'Il primo Scudetto del 1941-42 e Amadei, la Coppa delle Fiere 1961, l’era Liedholm con Falcão, Conti e Pruzzo, la finale del 1984, lo Scudetto 2001 di Capello, Totti e De Rossi, la rimonta sul Barcellona del 2018 e la Conference League 2022 con Mourinho. Si parte dal facile e si arriva a domande davvero toste.' },
      { q: 'Da dove vengono le domande?', a: 'Sono scritte e verificate a mano, mai generate automaticamente. Ogni informazione passa due controlli indipendenti prima di essere pubblicata; se un dato non si riesce a verificare, la domanda non esce.' },
      { q: 'L’app Ball IQ è in italiano?', a: 'Non ancora: questa pagina è in italiano, ma l’app è in inglese. Stiamo misurando l’interesse prima di tradurla — se sei arrivato fin qui, ci stai già aiutando a decidere.' },
    ],
    taster: [
      { id: 'q_57fa71', q: 'La Roma vinse il primo Scudetto con l’allenatore ungherese Alfréd Schäffer in quale stagione?', o: ['1937-38', '1941-42', '1946-47', '1951-52'], a: 1, hint: 'La Roma conquistò il primo titolo nel 1941-42, trascinata dai gol di Amadei.' },
      { id: 'q_b00f8b', q: 'Quale allenatore portò la Roma allo Scudetto 1982-83, il primo dopo 41 anni?', o: ['Nils Liedholm', 'Sven-Göran Eriksson', 'Vujadin Boškov', 'Carlo Ancelotti'], a: 0, hint: 'Lo svedese Nils Liedholm guidò la Roma al campionato 1982-83.' },
      { id: 'q_b495d8', q: 'Il capitano della Roma dello Scudetto 1982-83 era soprannominato «Er Capitano». Chi era?', o: ['Bruno Conti', 'Roberto Pruzzo', 'Agostino Di Bartolomei', 'Carlo Ancelotti'], a: 2, hint: 'Agostino Di Bartolomei, «Er Capitano», guidò da capitano la Roma al titolo 1982-83.' },
      { id: 'q_fcc703', q: 'Quale regista brasiliano dell’epoca d’oro dei primi anni Ottanta fu ribattezzato «l’Ottavo Re di Roma»?', o: ['Toninho Cerezo', 'Paulo Roberto Falcão', 'Zico', 'Dirceu'], a: 1, hint: 'Paulo Roberto Falcão si guadagnò il soprannome di «Ottavo Re di Roma» nel suo celebre periodo giallorosso.' },
      { id: 'q_6bb112', q: 'La Roma raggiunse la finale di Coppa dei Campioni 1984, giocata nel suo Stadio Olimpico, ma perse ai rigori contro quale club?', o: ['Amburgo', 'Nottingham Forest', 'Aston Villa', 'Liverpool'], a: 3, hint: 'Il Liverpool battè la Roma 4-2 ai rigori nella finale del 1984, dopo l’1-1 dei tempi regolamentari a Roma.' },
      { id: 'q_75ed0c', q: 'La Roma si assicurò lo Scudetto 2000-01 all’ultima giornata con un 3-1 casalingo all’Olimpico. Quale squadra battè quel pomeriggio?', o: ['Juventus', 'Parma', 'Lecce', 'Napoli'], a: 1, hint: 'Il 17 giugno 2001 la Roma battè il Parma 3-1, con i gol di Totti, Montella e Batistuta a chiudere i conti.' },
      { id: 'q_586557', q: 'Prima della stagione dello Scudetto 2000-01, la Roma battè il record mondiale di trasferimento per un ultratrentenne acquistando quale attaccante?', o: ['Marco Delvecchio', 'Vincenzo Montella', 'Gabriel Batistuta', 'Abel Balbo'], a: 2, hint: 'La Roma pagò circa 36 milioni di euro per Gabriel Batistuta nel 2000, allora un record per un giocatore oltre i 30 anni.' },
      { id: 'q_146702', q: 'Quando la Roma affidò a Totti la fascia nel 1998, divenne il capitano più giovane nella storia della Serie A. A quale età?', o: ['19', '20', '22', '24'], a: 2, hint: 'Totti fu nominato capitano della Roma a 22 anni, il più giovane di sempre in Serie A.' },
      { id: 'q_9df566', en: '4-1', q: 'La celebre vittoria per 3-0 sul Barcellona nei quarti di Champions 2018 ribaltò quale sconfitta dell’andata al Camp Nou?', o: ['4-1', '3-0', '2-0', '4-2'], a: 0, hint: 'La Roma aveva perso 4-1 a Barcellona prima di vincere 3-0 in casa e passare per la regola dei gol in trasferta.' },
      { id: 'q_915058', q: 'Chi segnò il colpo di testa nel finale che completò la rimonta per 3-0 della Roma sul Barcellona nell’aprile 2018?', o: ['Edin Džeko', 'Federico Fazio', 'Kostas Manolas', 'Daniele De Rossi'], a: 2, hint: 'Kostas Manolas segnò di testa all’82° mandando la Roma in semifinale contro il Barcellona.' },
    ],
    sample: [
      { id: 'q_353922', q: 'Il famigerato «gol di Turone», annullato per fuorigioco nel 1981, fu tolto in una sfida decisiva per lo Scudetto in casa di quale club?', o: ['Inter', 'Juventus', 'Napoli', 'Fiorentina'], a: 1, hint: 'Il colpo di testa di Maurizio Turone a Torino nel maggio 1981 fu annullato, e la Roma perse il titolo dalla Juventus per due punti.' },
      { id: 'q_93474a', q: 'Chi segnò il gol del pareggio della Roma nella finale di Coppa dei Campioni 1984, prima dei rigori?', o: ['Bruno Conti', 'Roberto Pruzzo', 'Paulo Roberto Falcão', 'Agostino Di Bartolomei'], a: 1, hint: 'Roberto Pruzzo rispose al vantaggio di Phil Neal fissando l’1-1 nella finale del 1984.' },
      { id: 'q_28efad', en: 'Three', q: 'Quante volte Roberto Pruzzo chiuse la Serie A da capocannoniere?', o: ['Tre', 'Due', 'Una', 'Quattro'], a: 0, hint: 'Pruzzo vinse il titolo di capocannoniere tre volte: nel 1980-81, 1981-82 e 1985-86.' },
      { id: 'q_3b9b6d', en: 'Inter-Cities Fairs Cup', q: 'L’unico grande trofeo europeo della Roma nel Novecento arrivò nel 1961. Quale competizione era?', o: ['La Coppa delle Coppe', 'La Coppa UEFA', 'La Coppa Latina', 'La Coppa delle Fiere'], a: 3, hint: 'La Roma vinse la Coppa delle Fiere 1961, il suo primo trofeo europeo.' },
      { id: 'q_13feb9', q: 'La Roma vinse la finale di Coppa delle Fiere 1961 contro quale club inglese?', o: ['Birmingham City', 'Aston Villa', 'Leeds United', 'West Ham United'], a: 0, hint: 'La Roma superò il Birmingham City 4-2 nel doppio confronto della finale 1961.' },
      { id: 'q_931e94', q: 'Nel derby di Roma del marzo 2002, quale attaccante giallorosso segnò quattro gol nel 5-1 alla Lazio?', o: ['Marco Delvecchio', 'Francesco Totti', 'Vincenzo Montella', 'Gabriel Batistuta'], a: 2, hint: 'Vincenzo Montella, «l’Aeroplanino», segnò quattro reti nel 5-1 del derby del 2002.' },
      { id: 'q_fd0766', q: 'Quale difensore centrale argentino acquistò la Roma nel 2000 per blindare la difesa dello Scudetto 2000-01?', o: ['Walter Samuel', 'Roberto Ayala', 'Mauricio Pochettino', 'Fabricio Coloccini'], a: 0, hint: 'Walter Samuel arrivò nel 2000 e fu un pilastro difensivo della squadra di Capello campione d’Italia.' },
      { id: 'q_143cfb', q: 'In quel 3-0 sul Barcellona, chi trasformò il rigore che portò la Roma sul 2-0?', o: ['Diego Perotti', 'Edin Džeko', 'Radja Nainggolan', 'Daniele De Rossi'], a: 3, hint: 'Daniele De Rossi realizzò il rigore nella ripresa contro il Barcellona nel 2018.' },
      { id: 'q_112c7e', q: 'La Roma vinse la prima UEFA Europa Conference League nel 2022 battendo il Feyenoord 1-0 in quale città?', o: ['Praga', 'Tirana', 'Danzica', 'Budapest'], a: 1, hint: 'La finale del 2022 si giocò all’Arena Kombëtare di Tirana, in Albania.' },
      { id: 'q_07a990', q: 'Chi segnò l’unico gol della finale di Conference League 2022 contro il Feyenoord?', o: ['Nicolò Zaniolo', 'Tammy Abraham', 'Lorenzo Pellegrini', 'Nicola Zalewski'], a: 0, hint: 'Nicolò Zaniolo controllò di petto e concluse al 32° a Tirana.' },
      { id: 'q_60f7a4', en: 'Four', q: 'Il trionfo in Conference League 2022 rese José Mourinho il primo allenatore a vincere un trofeo europeo con quante squadre diverse?', o: ['Tre', 'Quattro', 'Cinque', 'Sei'], a: 1, hint: 'La Roma divenne il quarto club con cui Mourinho ha alzato un trofeo europeo, dopo Porto, Inter e Manchester United.' },
      { id: 'q_9cce96', q: 'Quale giocatore è il secondo per presenze nella storia della Roma, dietro solo a Totti, con 616 partite in 18 stagioni?', o: ['Aldair', 'Daniele De Rossi', 'Giuseppe Giannini', 'Bruno Conti'], a: 1, hint: 'Daniele De Rossi ha collezionato 616 presenze con la Roma, secondo solo a Totti.' },
    ],
    copy: {
      tasterEyebrow: 'Prova gratis · Senza registrazione',
      tasterH: 'Quanto conosci davvero la Roma?',
      tasterPh: 'Dieci domande veloci per misurare il tuo Ball IQ giallorosso.',
      tasterNote: 'Domande di esempio — nel quiz completo ce ne sono molte altre.',
      playSection: 'Gioca il quiz sulla Roma',
      playSub: 'Tocca una risposta per controllare — esito immediato e la storia che c’è dietro.',
      faqH: 'Quiz Roma — Domande frequenti',
      aboutQ: 'Informazioni sul quiz Roma',
      bandH: 'Pensi di conoscere la Roma? Dimostralo nell’app.',
      bandP: 'Serie di vittorie, 1v1 dal vivo, un punteggio su 99 — e tutti i quiz in un’unica app. L’app è in inglese.',
      alsoH: 'La stessa pagina in inglese',
      alsoP: 'Questa è la versione italiana del nostro quiz sulla Roma. Tutte le domande in originale:',
      alsoLink: 'Roma quiz (English)',
      statsLine: 'Le domande sulla Roma in Ball IQ coprono tre livelli di difficoltà — facile, medio e difficile — tutte con spiegazione.',
    },
  },

  // ── LAZIO ──────────────────────────────────────────────────────────────────
  {
    club: 'Lazio',
    slug: 'lazio',
    lang: 'it',
    name: 'Lazio',
    h1: 'Quiz Lazio',
    title: 'Quiz Lazio — I Biancocelesti e l’Aquila | Ball IQ',
    description:
      'Quiz sulla Lazio gratuito, con risposte spiegate: la fondazione del 1900, lo Scudetto 2000, la Coppa delle Coppe 1999, Nedvěd, Salas e il Derby della Capitale.',
    kind: 'Quiz di club',
    statLine: 'Gratis · Domande sulla Lazio con risposte spiegate · senza registrazione',
    playLabel: 'Inizia il quiz',
    intro: [
      'Il più antico dei due club della capitale, nato come società podistica e diventato campione d’Italia. Questo quiz gratuito copre tutte le epoche biancocelesti: la fondazione del 1900 e i colori scelti in omaggio alla Grecia, il rifiuto della fusione del 1927 che accese la rivalità con la Roma, l’era Cragnotti, l’ultima Coppa delle Coppe della storia e lo Scudetto del 2000 deciso sotto la pioggia di Perugia.',
      'Le domande diventano davvero difficili. Dove la storia del club è controversa, preferiamo non pubblicare la domanda piuttosto che prendere posizione. Va online solo ciò che si può verificare.',
      'Ogni risposta del set Lazio ha una spiegazione scritta: anche sbagliando si impara qualcosa su come i biancocelesti hanno vinto quello che hanno vinto.',
    ],
    faq: [
      { q: 'Il quiz sulla Lazio è gratuito?', a: 'Sì. Si gioca direttamente nel browser, senza registrarsi e senza scaricare nulla. Tutte le domande di questa pagina sono gratuite.' },
      { q: 'Quali argomenti copre il quiz?', a: 'La fondazione del 1900, i colori e i simboli, il rifiuto della fusione del 1927, la Coppa Italia 1958, l’era Cragnotti, la Coppa delle Coppe 1999 e la Supercoppa UEFA, lo Scudetto 2000, Nedvěd, Salas, Simone Inzaghi e il Derby della Capitale. Si parte dal facile e si arriva a domande davvero toste.' },
      { q: 'Da dove vengono le domande?', a: 'Sono scritte e verificate a mano, mai generate automaticamente. Ogni informazione passa due controlli indipendenti prima di essere pubblicata; se un dato non si riesce a verificare, la domanda non esce.' },
      { q: 'L’app Ball IQ è in italiano?', a: 'Non ancora: questa pagina è in italiano, ma l’app è in inglese. Stiamo misurando l’interesse prima di tradurla — se sei arrivato fin qui, ci stai già aiutando a decidere.' },
    ],
    taster: [
      { id: 'q_8982bc', q: 'In quale anno fu fondata la Lazio?', o: ['1897', '1900', '1910', '1927'], a: 1, hint: 'La Lazio fu fondata il 9 gennaio 1900 da Luigi Bigiarelli e otto compagni, ed è la più antica delle due grandi squadre di Roma.' },
      { id: 'q_ea1532', en: 'The region surrounding Rome', q: 'A cosa si riferisce il nome «Lazio»?', o: ['Al cognome del fondatore', 'A un imperatore romano', 'Alla regione che circonda Roma', 'Al quartiere in cui nacque il club'], a: 2, hint: 'I fondatori scelsero il nome dell’intera regione laziale (l’antico Latium), abbracciando qualcosa di più della sola città di Roma.' },
      { id: 'q_2a5925', en: 'Greece', q: 'I colori bianco e celeste della Lazio furono scelti in omaggio a quale Paese?', o: ['Argentina', 'Uruguay', 'Francia', 'Grecia'], a: 3, hint: 'I fondatori scelsero il bianco e il celeste in omaggio alla Grecia, culla dei Giochi Olimpici, in linea con i loro ideali sportivi olimpici.' },
      { id: 'q_813e29', en: 'Their white and sky blue colours', q: 'A cosa si riferisce il soprannome «Biancocelesti»?', o: ['Ai colori bianco e celeste', 'Alla maglia da trasferta tutta bianca', 'Al cielo azzurro di Roma', 'Al santo patrono'], a: 0, hint: 'Bianco e celeste sono i colori che la Lazio indossa fin dall’inizio.' },
      { id: 'q_4448c4', q: 'Che nome ha il derby fra Lazio e Roma?', o: ['Derby d’Italia', 'Derby della Madonnina', 'Derby del Sole', 'Derby della Capitale'], a: 3, hint: 'Il Derby della Capitale è una delle partite più sentite al mondo.' },
      { id: 'q_5b1b94', q: 'Quale stadio romano, inaugurato nel 1953, divenne la casa condivisa di Lazio e Roma?', o: ['Stadio Flaminio', 'Stadio Olimpico', 'Stadio dei Marmi', 'Stadio Nazionale'], a: 1, hint: 'Lo Stadio Olimpico, che ha ospitato anche le Olimpiadi del 1960 e la finale del Mondiale 1990, è condiviso dalle due romane da decenni.' },
      { id: 'q_9af7a9', q: 'La Lazio vinse il primo trofeo importante nel 1958 battendo la Fiorentina 1-0 in quale competizione?', o: ['Serie A', 'Coppa delle Coppe', 'Supercoppa Italiana', 'Coppa Italia'], a: 3, hint: 'Il colpo di testa dell’ala Maurilio Prini regalò alla Lazio la Coppa Italia 1958, primo grande trofeo del club.' },
      { id: 'q_2f0bf0', q: 'Lo Scudetto 2000 della Lazio arrivò all’ultima giornata, quando la Juventus perse 1-0 sul campo allagato di quale squadra?', o: ['Perugia', 'Verona', 'Bari', 'Piacenza'], a: 0, hint: 'Un temporale rinviò la ripresa al Renato Curi di Perugia; il gol di Alessandro Calori affondò la Juventus mentre la Lazio batteva 3-0 la Reggina a Roma.' },
      { id: 'q_33759f', en: 'It was the last ever edition of the competition', q: 'Quale primato detiene la Coppa delle Coppe vinta dalla Lazio nel 1999?', o: ['Fu decisa da un golden goal', 'La vinsero senza subire gol', 'Fu l’ultima edizione della competizione', 'Fu la prima finale giocata fuori dall’Europa'], a: 2, hint: 'Dopo il 1999 la Coppa delle Coppe fu assorbita dalla Coppa UEFA, quindi il nome della Lazio resta per sempre quello dell’ultima vincitrice.' },
      { id: 'q_43c225', q: 'Chi segnò all’81° il gol vittoria della Lazio nella finale di Coppa delle Coppe 1999?', o: ['Alen Bokšić', 'Roberto Mancini', 'Dejan Stanković', 'Pavel Nedvěd'], a: 3, hint: 'Il centrocampista ceco Nedvěd scagliò in rete il gol decisivo che fissò il 2-1.' },
    ],
    sample: [
      { id: 'q_c1d224', en: 'A running club', q: 'La Lazio nacque come «Società Podistica Lazio»: che tipo di club sportivo era in origine?', o: ['Un club di canottaggio', 'Un club ciclistico', 'Un club di corsa', 'Una società di scherma'], a: 2, hint: '«Podistica» significa corsa: i fondatori la crearono come società di corsa e atletica, e la sezione calcio ufficiale arrivò solo un decennio dopo.' },
      { id: 'q_daa95f', en: 'Refused to join and stayed independent', q: 'Nel 1927, quando i club romani furono fusi per creare l’AS Roma, cosa fece la Lazio?', o: ['Rifiutò di aderire e restò indipendente', 'Fu socia fondatrice', 'Si fuse e poi si staccò nel 1929', 'Si trasferì in un’altra città per protesta'], a: 0, hint: 'Sostenuta dal generale Giorgio Vaccaro, la Lazio restò fuori dal piano di epoca fascista per unificare i club della capitale: una delle scintille originarie della rivalità con la Roma.' },
      { id: 'q_d0613c', q: 'Quale settore dello stadio è tradizionalmente la casa degli ultras della Lazio?', o: ['Curva Sud', 'Tribuna Tevere', 'Curva Nord', 'Distinti Est'], a: 2, hint: 'Il tifo organizzato della Lazio occupa storicamente la Curva Nord, mentre gli ultras della Roma stanno nella Curva Sud, all’estremità opposta.' },
      { id: 'q_2e9335', q: 'Come si chiama il rapace che dal 2010 vola sopra lo stadio prima delle gare interne della Lazio?', o: ['Vittoria', 'Celeste', 'Olimpia', 'Augusta'], a: 2, hint: 'Dal 2010 Olimpia sorvola il campo prima delle partite casalinghe della Lazio, in uno dei grandi rituali pre-partita del calcio italiano.' },
      { id: 'q_3a911b', q: 'Quale canzone è diventata celebre come inno della Lazio?', o: ['Grazie Roma', 'Vola Lazio Vola', 'Alè Aquila Alè', 'Cuore Celeste'], a: 1, hint: '«Vola Lazio Vola», incisa da Toni Malco nel 1983, è l’inno che risuona nelle partite casalinghe della Lazio.' },
      { id: 'q_74b8fe', q: 'La spesa di quale presidente alimentò l’epoca dei trofei della Lazio a cavallo del millennio?', o: ['Claudio Lotito', 'Sergio Cragnotti', 'Massimo Moratti', 'Franco Sensi'], a: 1, hint: 'Il magnate dell’industria alimentare Sergio Cragnotti finanziò le rose stellari di fine anni Novanta, prima che i soldi finissero nei primi anni Duemila.' },
      { id: 'q_5d9ee4', en: 'Mallorca', q: 'Quale club spagnolo battè la Lazio 2-1 nella finale di Coppa delle Coppe 1999?', o: ['Valencia', 'Maiorca', 'Celta Vigo', 'Real Betis'], a: 1, hint: 'Christian Vieri portò avanti la Lazio subito e un gol nel finale piegò il Maiorca 2-1 nella finale del 19 maggio 1999.' },
      { id: 'q_11b112', q: 'In quale stadio inglese la Lazio alzò la Coppa delle Coppe 1999?', o: ['Wembley', 'Old Trafford', 'Villa Park', 'Highbury'], a: 2, hint: 'La finale si giocò a Villa Park, casa dell’Aston Villa a Birmingham.' },
      { id: 'q_706131', q: 'Quale club battè la Lazio 1-0 per vincere la Supercoppa UEFA 1999?', o: ['Manchester United', 'Barcellona', 'Real Madrid', 'Bayern Monaco'], a: 0, hint: 'Il Manchester United del Triplete cadde su un gol nel primo tempo allo Stade Louis II di Monaco, il 27 agosto 1999.' },
      { id: 'q_d4dd13', q: 'Chi entrò dalla panchina e segnò l’unico gol della Lazio nella Supercoppa UEFA 1999?', o: ['Roberto Mancini', 'Marcelo Salas', 'Alen Bokšić', 'Christian Vieri'], a: 1, hint: 'Il cileno «El Matador» Salas rilevò l’infortunato Simone Inzaghi e segnò al 35°.' },
      { id: 'q_d49d4c', q: 'Chi battè la Lazio 3-0 nella finale di Coppa UEFA 1998 a Parigi?', o: ['Parma', 'Juventus', 'Inter', 'Atlético Madrid'], a: 2, hint: 'Ronaldo chiuse una prova maiuscola con il terzo gol dell’Inter al Parco dei Principi, e la Lazio fu travolta.' },
      { id: 'q_ebb8f3', q: 'Quale attaccante della Lazio segnò quattro gol in una sola partita di Champions League contro il Marsiglia nel marzo 2000?', o: ['Marcelo Salas', 'Alen Bokšić', 'Fabrizio Ravanelli', 'Simone Inzaghi'], a: 3, hint: 'I quattro gol di Simone Inzaghi nel 5-1 eguagliarono il primato in una singola gara di Champions fissato da Marco van Basten nel 1992 — e anni dopo sarebbe tornato da allenatore.' },
    ],
    copy: {
      tasterEyebrow: 'Prova gratis · Senza registrazione',
      tasterH: 'Quanto conosci davvero la Lazio?',
      tasterPh: 'Dieci domande veloci per misurare il tuo Ball IQ biancoceleste.',
      tasterNote: 'Domande di esempio — nel quiz completo ce ne sono molte altre.',
      playSection: 'Gioca il quiz sulla Lazio',
      playSub: 'Tocca una risposta per controllare — esito immediato e la storia che c’è dietro.',
      faqH: 'Quiz Lazio — Domande frequenti',
      aboutQ: 'Informazioni sul quiz Lazio',
      bandH: 'Pensi di conoscere la Lazio? Dimostralo nell’app.',
      bandP: 'Serie di vittorie, 1v1 dal vivo, un punteggio su 99 — e tutti i quiz in un’unica app. L’app è in inglese.',
      alsoH: 'La stessa pagina in inglese',
      alsoP: 'Questa è la versione italiana del nostro quiz sulla Lazio. Tutte le domande in originale:',
      alsoLink: 'Lazio quiz (English)',
      statsLine: 'Le domande sulla Lazio in Ball IQ coprono tre livelli di difficoltà — facile, medio e difficile — tutte con spiegazione.',
    },
  },

  // ── FIORENTINA ─────────────────────────────────────────────────────────────
  {
    club: 'Fiorentina',
    slug: 'fiorentina',
    lang: 'it',
    name: 'Fiorentina',
    h1: 'Quiz Fiorentina',
    title: 'Quiz Fiorentina — La Viola e il Giglio | Ball IQ',
    description:
      'Quiz sulla Fiorentina gratuito, con risposte spiegate: il viola e il Giglio, i due Scudetti, Antognoni, Batistuta, Rui Costa e Astori.',
    kind: 'Quiz di club',
    statLine: 'Gratis · Domande sulla Fiorentina con risposte spiegate · senza registrazione',
    playLabel: 'Inizia il quiz',
    intro: [
      'Il viola più riconoscibile del calcio, e una città che il suo club lo vive come un’identità. Questo quiz gratuito attraversa tutte le epoche gigliate: la fondazione del 1926, il passaggio al viola, lo Scudetto del 1956 e la Fiorentina Ye-Ye del 1969, Antognoni bandiera assoluta, Hamrin, Batistuta rimasto anche in Serie B, Rui Costa e il numero 13 ritirato per Davide Astori.',
      'Le domande diventano davvero difficili. Dove la storia del club è controversa — l’origine del viola lo è — preferiamo non pubblicare la domanda piuttosto che prendere posizione. Va online solo ciò che si può verificare.',
      'Ogni risposta del set Fiorentina ha una spiegazione scritta: anche sbagliando si impara qualcosa sulla storia viola.',
    ],
    faq: [
      { q: 'Il quiz sulla Fiorentina è gratuito?', a: 'Sì. Si gioca direttamente nel browser, senza registrarsi e senza scaricare nulla. Tutte le domande di questa pagina sono gratuite.' },
      { q: 'Quali argomenti copre il quiz?', a: 'La fondazione del 1926 e la fusione, l’origine del viola e il Giglio, lo stadio di Nervi, gli Scudetti del 1956 e del 1969, la Mitropa Cup, Antognoni e Hamrin, Batistuta e la Serie B, Rui Costa, la cessione di Baggio alla Juventus e Davide Astori. Si parte dal facile e si arriva a domande davvero toste.' },
      { q: 'Da dove vengono le domande?', a: 'Sono scritte e verificate a mano, mai generate automaticamente. Ogni informazione passa due controlli indipendenti prima di essere pubblicata; se un dato non si riesce a verificare, la domanda non esce.' },
      { q: 'L’app Ball IQ è in italiano?', a: 'Non ancora: questa pagina è in italiano, ma l’app è in inglese. Stiamo misurando l’interesse prima di tradurla — se sei arrivato fin qui, ci stai già aiutando a decidere.' },
    ],
    taster: [
      { id: 'q_79281d', en: 'Florence', q: 'In quale città italiana ha sede la Fiorentina?', o: ['Firenze', 'Bologna', 'Torino', 'Genova'], a: 0, hint: 'L’ACF Fiorentina rappresenta Firenze, capoluogo della Toscana.' },
      { id: 'q_f362b4', q: 'In quale anno fu fondata la Fiorentina?', o: ['1919', '1926', '1931', '1945'], a: 1, hint: 'La Fiorentina nacque nel 1926 dalla fusione di due società sportive fiorentine già esistenti.' },
      { id: 'q_2a09cd', en: 'The shirts faded to purple after a botched wash', q: 'La Fiorentina passò dal biancorosso al viola nel 1929. Qual è la leggenda popolare sul cambio di colore?', o: ['Uno sponsor lo impose', 'Le maglie sbiadirono in viola dopo un lavaggio sbagliato', 'Per onorare un cardinale locale', 'Per copiare i rivali cittadini'], a: 1, hint: 'La leggenda vuole che le maglie biancorosse originali diventassero viola dopo un lavaggio sbagliato; storicamente, il presidente Ridolfi ammirava la divisa viola dell’Újpest.' },
      { id: 'q_a12476', en: 'A red lily (iris) on a white field', q: 'Lo stemma della Fiorentina porta il «Giglio», emblema storico di Firenze. Che cos’è?', o: ['Un’aquila nera', 'Una croce dorata', 'Un giglio rosso (iris) in campo bianco', 'Un lupo argentato'], a: 2, hint: 'Il Giglio è un giglio/iris rosso stilizzato su fondo bianco, simbolo secolare di Firenze.' },
      { id: 'q_0536ec', q: 'In quale stagione la Fiorentina vinse il suo primo Scudetto?', o: ['1948-49', '1955-56', '1960-61', '1938-39'], a: 1, hint: 'Il primo Scudetto viola arrivò nel 1955-56, con dodici punti di vantaggio sul Milan.' },
      { id: 'q_dabc58', en: 'Two', q: 'Al 2025, quanti Scudetti aveva vinto la Fiorentina?', o: ['Uno', 'Due', 'Tre', 'Cinque'], a: 1, hint: 'La Fiorentina è stata campione d’Italia due volte, entrambe nel Novecento.' },
      { id: 'q_0ab079', q: 'Quale attaccante argentino soprannominato «Batigol» segnò oltre 200 gol in tutte le competizioni con la Fiorentina?', o: ['Hernán Crespo', 'Gabriel Batistuta', 'Diego Milito', 'Mario Kempes'], a: 1, hint: 'Gabriel Batistuta segnò 207 gol con la Fiorentina fra il 1991 e il 2000.' },
      { id: 'q_d6a2bb', q: 'Quale trequartista, numero 10 viola per tutta la sua maturità calcistica, è venerato come la bandiera del club?', o: ['Roberto Baggio', 'Kurt Hamrin', 'Giancarlo Antognoni', 'Rui Costa'], a: 2, hint: 'Antognoni, «il numero 10 per eccellenza», è celebrato come il viola di una squadra sola per definizione.' },
      { id: 'q_961219', q: 'Nel 2018 la Fiorentina ritirò la maglia numero 13 per onorare quale capitano, morto improvvisamente quell’anno?', o: ['Riccardo Montolivo', 'Davide Astori', 'Manuel Pasqual', 'Marco Donadel'], a: 1, hint: 'Il capitano Davide Astori morì nel marzo 2018; Fiorentina e Cagliari ritirarono entrambe il suo numero 13.' },
      { id: 'q_7bb6ea', q: 'La rivalità della Fiorentina con la Juventus si infiammò nel 1990 per la cessione a Torino di quale giocatore?', o: ['Roberto Baggio', 'Gabriel Batistuta', 'Giancarlo Antognoni', 'Rui Costa'], a: 0, hint: 'Il trasferimento record di Roberto Baggio alla Juventus nel 1990 scatenò disordini nelle strade di Firenze.' },
    ],
    sample: [
      { id: 'q_594509', q: 'La Fiorentina nacque dalla fusione del CS Firenze con quale altra società fiorentina?', o: ['PG Libertas', 'US Florentia', 'Fortitudo Firenze', 'Itala Firenze'], a: 0, hint: 'Il club nacque dall’unione di CS Firenze e PG Libertas, per iniziativa del marchese Luigi Ridolfi.' },
      { id: 'q_06dc84', q: 'Quale stadio fiorentino, inaugurato nel 1931, divenne la casa della Fiorentina?', o: ['San Siro', 'Stadio Olimpico', 'Stadio Artemio Franchi', 'Stadio Luigi Ferraris'], a: 2, hint: 'La Fiorentina vi si trasferì nel 1931; assunse il nome di Stadio Artemio Franchi nel 1991.' },
      { id: 'q_001940', q: 'Lo stadio della Fiorentina, con la sua celebre Torre di Maratona in cemento, fu progettato da quale architetto italiano pionieristico?', o: ['Renzo Piano', 'Pier Luigi Nervi', 'Gio Ponti', 'Aldo Rossi'], a: 1, hint: 'Pier Luigi Nervi progettò lo stadio degli anni Trenta, famoso per la Torre di Maratona.' },
      { id: 'q_009da2', q: 'Lo stadio della Fiorentina del 1931 portava in origine quale nome, prima di essere intitolato nel 1991 a un dirigente del calcio?', o: ['Stadio Giovanni Berta', 'Stadio del Littorio', 'Stadio della Vittoria', 'Stadio Firenze'], a: 0, hint: 'Fu inaugurato nel 1931 come Stadio Giovanni Berta, prima dei successivi cambi di nome.' },
      { id: 'q_439d79', q: 'Gli ultras più appassionati della Fiorentina occupano quale curva dello stadio?', o: ['Curva Sud', 'Curva Fiesole', 'Curva Ferrovia', 'Curva Nord'], a: 1, hint: 'La Curva Fiesole è la casa tradizionale del tifo organizzato viola.' },
      { id: 'q_49d4f8', en: "Derby dell'Appennino", q: 'La rivalità della Fiorentina con il Bologna, dal nome dei monti fra le due città, è conosciuta come?', o: ['Derby della Lanterna', 'Derby dell’Appennino', 'Derby della Madonnina', 'Derby del Sole'], a: 1, hint: 'Il Derby dell’Appennino prende il nome dagli Appennini che separano Firenze e Bologna.' },
      { id: 'q_670d83', q: 'La giovane Fiorentina campione d’Italia nel 1968-69 si guadagnò quale soprannome?', o: ['I Golden Boys', 'La Macchina Viola', 'Fiorentina Ye-Ye', 'I Ragazzi Terribili'], a: 2, hint: 'I campioni del 1968-69, allenati da Bruno Pesaola, furono ribattezzati «Fiorentina Ye-Ye» per la loro giovane età.' },
      { id: 'q_3b6043', q: 'Quale ala svedese soprannominata «Uccellino» segnò 150 gol in Serie A con la Fiorentina fra il 1958 e il 1967?', o: ['Gunnar Gren', 'Kurt Hamrin', 'Nils Liedholm', 'Glenn Hysén'], a: 1, hint: 'Kurt Hamrin segnò 150 gol in campionato in nove stagioni a Firenze, più altri nelle coppe.' },
      { id: 'q_dcf173', q: 'Quale giocatore detiene il record di presenze della Fiorentina, con 429 partite ufficiali fra il 1972 e il 1987?', o: ['Gabriel Batistuta', 'Giancarlo Antognoni', 'Manuel Pasqual', 'Kurt Hamrin'], a: 1, hint: 'Giancarlo Antognoni ha collezionato 429 presenze ufficiali con la Fiorentina dal 1972 al 1987, più di chiunque altro nella storia del club.' },
      { id: 'q_5b6465', en: 'The first 11', q: 'All’inizio della Serie A 1994-95, Gabriel Batistuta stabilì un record segnando in quante partite consecutive dall’avvio?', o: ['Le prime 6', 'Le prime 8', 'Le prime 11', 'Le prime 14'], a: 2, hint: 'Batistuta segnò in ciascuna delle prime 11 giornate del 1994-95, battendo il record di Ezio Pascutti che resisteva da 32 anni.' },
      { id: 'q_d34f49', en: 'Stayed and helped win promotion back', q: 'Dopo la retrocessione della Fiorentina in Serie B nel 1993, cosa fece Gabriel Batistuta?', o: ['Rimase e contribuì alla promozione', 'Forzò il trasferimento al Milan', 'Si ritirò temporaneamente', 'Tornò in Argentina'], a: 0, hint: 'Batistuta restò con lealtà in Serie B e riportò subito la Fiorentina nella massima serie nel 1994.' },
      { id: 'q_e24919', q: 'Quale trequartista portoghese fu la stella creativa della Fiorentina dal 1994 al 2001?', o: ['Luís Figo', 'Rui Costa', 'Deco', 'Nuno Gomes'], a: 1, hint: 'Manuel Rui Costa fu l’idolo e il regista della Fiorentina per sette stagioni negli anni Novanta.' },
    ],
    copy: {
      tasterEyebrow: 'Prova gratis · Senza registrazione',
      tasterH: 'Quanto conosci davvero la Fiorentina?',
      tasterPh: 'Dieci domande veloci per misurare il tuo Ball IQ viola.',
      tasterNote: 'Domande di esempio — nel quiz completo ce ne sono molte altre.',
      playSection: 'Gioca il quiz sulla Fiorentina',
      playSub: 'Tocca una risposta per controllare — esito immediato e la storia che c’è dietro.',
      faqH: 'Quiz Fiorentina — Domande frequenti',
      aboutQ: 'Informazioni sul quiz Fiorentina',
      bandH: 'Pensi di conoscere la Viola? Dimostralo nell’app.',
      bandP: 'Serie di vittorie, 1v1 dal vivo, un punteggio su 99 — e tutti i quiz in un’unica app. L’app è in inglese.',
      alsoH: 'La stessa pagina in inglese',
      alsoP: 'Questa è la versione italiana del nostro quiz sulla Fiorentina. Tutte le domande in originale:',
      alsoLink: 'Fiorentina quiz (English)',
      statsLine: 'Le domande sulla Fiorentina in Ball IQ coprono tre livelli di difficoltà — facile, medio e difficile — tutte con spiegazione.',
    },
  },

  // ── ATALANTA ───────────────────────────────────────────────────────────────
  {
    club: 'Atalanta',
    slug: 'atalanta',
    lang: 'it',
    name: 'Atalanta',
    h1: 'Quiz Atalanta',
    title: 'Quiz Atalanta — La Dea e Bergamo | Ball IQ',
    description:
      'Quiz sull’Atalanta gratuito, con risposte spiegate: la Dea, Zingonia, Gasperini, la Champions 2019-20, Iličić a Valencia e l’Europa League 2024.',
    kind: 'Quiz di club',
    statLine: 'Gratis · Domande sull’Atalanta con risposte spiegate · senza registrazione',
    playLabel: 'Inizia il quiz',
    intro: [
      'Da provinciale a squadra da Champions, senza mai smettere di essere di Bergamo. Questo quiz gratuito copre tutta la storia nerazzurra: la fondazione del 1907, la Coppa Italia 1963, la semifinale di Coppa delle Coppe raggiunta dalla Serie B, il ritorno dei Percassi, l’accademia di Zingonia, il ciclo di Gasperini con la prima Champions e i quattro gol di Iličić a Valencia.',
      'Le domande diventano davvero difficili. Dove la storia del club è controversa, preferiamo non pubblicare la domanda piuttosto che prendere posizione. Va online solo ciò che si può verificare.',
      'Ogni risposta del set Atalanta ha una spiegazione scritta: anche sbagliando si impara qualcosa su come la Dea è arrivata dove è arrivata.',
    ],
    faq: [
      { q: 'Il quiz sull’Atalanta è gratuito?', a: 'Sì. Si gioca direttamente nel browser, senza registrarsi e senza scaricare nulla. Tutte le domande di questa pagina sono gratuite.' },
      { q: 'Quali argomenti copre il quiz?', a: 'La fondazione del 1907, il nome e lo stemma della Dea, la Coppa Italia 1963, la cavalcata europea del 1987-88 dalla Serie B, i Percassi e Zingonia, l’era Gasperini, la prima Champions League, Iličić e Papu Gómez, e le grandi cessioni da Vieri a Højlund. Si parte dal facile e si arriva a domande davvero toste.' },
      { q: 'Da dove vengono le domande?', a: 'Sono scritte e verificate a mano, mai generate automaticamente. Ogni informazione passa due controlli indipendenti prima di essere pubblicata; se un dato non si riesce a verificare, la domanda non esce.' },
      { q: 'L’app Ball IQ è in italiano?', a: 'Non ancora: questa pagina è in italiano, ma l’app è in inglese. Stiamo misurando l’interesse prima di tradurla — se sei arrivato fin qui, ci stai già aiutando a decidere.' },
    ],
    taster: [
      { id: 'q_3a89f8', q: 'In quale città del Nord Italia gioca le partite casalinghe l’Atalanta?', o: ['Bergamo', 'Brescia', 'Verona', 'Parma'], a: 0, hint: 'L’Atalanta è la squadra di Bergamo fino in fondo: lo stadio sorge nel quartiere di Borgo Santa Caterina e la celebre accademia è a Zingonia, appena fuori città.' },
      { id: 'q_fe3078', q: 'In quale anno fu fondata l’Atalanta?', o: ['1897', '1907', '1919', '1928'], a: 1, hint: 'Il club nacque il 17 ottobre 1907 per iniziativa degli studenti del Liceo Classico Paolo Sarpi di Bergamo.' },
      { id: 'q_baa8de', en: 'The Goddess', q: 'Il soprannome «La Dea» dell’Atalanta significa letteralmente cosa?', o: ['La Dea', 'La Vecchia Signora', 'I Lupi', 'Il Fulmine'], a: 0, hint: 'Il club prende il nome da Atalanta, la cacciatrice dai piedi veloci del mito greco, il cui profilo compare sullo stemma.' },
      { id: 'q_c4c895', q: 'Quale soprannome, che deriva dalle maglie a strisce, l’Atalanta condivide con l’Inter?', o: ['Rossoneri', 'Bianconeri', 'Nerazzurri', 'Giallorossi'], a: 2, hint: 'Nerazzurri significa semplicemente «neri e azzurri». L’Atalanta è chiamata anche Orobici, dagli antichi Orobi delle valli bergamasche.' },
      { id: 'q_0fbaf5', q: 'L’Atalanta vinse il primo trofeo importante battendo 3-1 quale club nella finale di Coppa Italia 1963?', o: ['Roma', 'Napoli', 'Torino', 'Fiorentina'], a: 2, hint: 'Angelo Domenghini segnò una tripletta a San Siro. I festeggiamenti furono smorzati: il bergamasco Papa Giovanni XXIII morì il giorno dopo.' },
      { id: 'q_5ed1ed', q: 'L’Atalanta si qualificò per la prima volta in Champions League chiudendo terza in quale stagione di Serie A?', o: ['2016-17', '2018-19', '2017-18', '2019-20'], a: 1, hint: 'Una rimonta all’ultima giornata contro il Sassuolo, nel maggio 2019, valse il terzo posto a quota 69 punti, davanti a Inter e Milan.' },
      { id: 'q_8e8afe', q: 'Gian Piero Gasperini fu nominato allenatore dell’Atalanta nel giugno 2016. Quale club aveva guidato nei tre anni precedenti?', o: ['Palermo', 'Genoa', 'Torino', 'Inter'], a: 1, hint: 'Gasperini lasciò il Genoa, dove era alla seconda esperienza dal 2013 al 2016, per prendere in mano un’Atalanta appena arrivata tredicesima.' },
      { id: 'q_4277c7', q: 'Josip Iličić segnò quattro gol in una sola gara a eliminazione diretta di Champions League nel marzo 2020. Contro chi?', o: ['Valencia', 'Real Madrid', 'Ajax', 'Shakhtar Donetsk'], a: 0, hint: 'L’Atalanta vinse 4-3 in un Mestalla deserto, passando 8-4 nel complesso; Iličić fu il primo a segnare quattro gol in trasferta in una gara a eliminazione diretta.' },
      { id: 'q_54db46', q: 'Chi segnò due gol nel 3-0 dell’Atalanta in casa del Liverpool, nell’andata dei quarti di Europa League 2024?', o: ['Ademola Lookman', 'Gianluca Scamacca', 'Teun Koopmeiners', 'Mario Pašalić'], a: 1, hint: 'Scamacca colpì poco prima dell’intervallo e di nuovo all’ora di gioco ad Anfield, e Pašalić chiuse i conti nel finale.' },
      { id: 'q_f434e8', q: 'Quale ex giocatore dell’Atalanta diventato imprenditore del retail fu presidente dal 1990 al 1994 e tornò nel 2010 per avviarne l’era moderna?', o: ['Ivan Ruggeri', 'Antonio Percassi', 'Massimo Moratti', 'Maurizio Zamparini'], a: 1, hint: 'Percassi ricomprò il club nel giugno 2010, poche settimane dopo la retrocessione in Serie B, e lo ricostruì attorno all’accademia di Zingonia.' },
    ],
    sample: [
      { id: 'q_e53d55', en: 'San Siro in Milan', q: 'Dove giocò l’Atalanta le partite interne di Champions League nella prima campagna, quella 2019-20?', o: ['Nel proprio stadio a Bergamo', 'Allo Stadio Olimpico di Roma', 'A San Siro, a Milano', 'All’Allianz Stadium di Torino'], a: 2, hint: 'Lo stadio di Bergamo era in piena ristrutturazione, così l’Atalanta chiese a Inter e Milan di poter usare San Siro.' },
      { id: 'q_f3a1bd', q: 'L’Atalanta perse le prime tre gare del girone di Champions 2019-20 e arrivò comunque agli ottavi. Quale club battè 3-0 in trasferta nell’ultima giornata per passare?', o: ['Dinamo Zagabria', 'Manchester City', 'Zenit San Pietroburgo', 'Shakhtar Donetsk'], a: 3, hint: 'Dopo le sconfitte con Dinamo Zagabria, Shakhtar e Manchester City, l’Atalanta fece sette punti nelle ultime tre gare e vinse a Kharkiv chiudendo seconda.' },
      { id: 'q_2a3b34', en: 'Duván Zapata and Luis Muriel', q: 'L’Atalanta segnò 98 gol in Serie A nel 2019-20 senza che nessun giocatore arrivasse a 20 in campionato. Quali due divisero il primato interno a quota 18?', o: ['Josip Iličić e Papu Gómez', 'Duván Zapata e Luis Muriel', 'Luis Muriel e Josip Iličić', 'Duván Zapata e Robin Gosens'], a: 1, hint: 'Muriel eguagliò i 18 di Zapata pur partendo titolare solo dieci volte in campionato; con Iličić a quota 15.' },
      { id: 'q_b34406', q: 'Quale nazionale argentino fu capitano dell’Atalanta prima che una rottura con Gasperini lo portasse al Siviglia nel gennaio 2021?', o: ['José Luis Palomino', 'Papu Gómez', 'Cristian Romero', 'Juan Musso'], a: 1, hint: 'La lite sarebbe nata nell’intervallo di una gara di Champions con il Midtjylland, il 1º dicembre 2020, quando rifiutò di spostarsi sulla fascia destra.' },
      { id: 'q_35e4e4', q: 'Quale centrocampista l’Atalanta cedette alla Juventus nell’agosto 2024?', o: ['Marten de Roon', 'Remo Freuler', 'Mario Pašalić', 'Teun Koopmeiners'], a: 3, hint: 'Koopmeiners era arrivato dall’AZ nel 2021 e partì per una cifra garantita di circa 51 milioni più bonus, una delle cessioni più ricche della storia dell’Atalanta.' },
      { id: 'q_2063e3', q: 'Quale attaccante l’Atalanta vendette al Manchester United nell’estate 2023?', o: ['Duván Zapata', 'Rasmus Højlund', 'Luis Muriel', 'Gianluca Scamacca'], a: 1, hint: 'Højlund era arrivato dallo Sturm Graz un anno prima e partì per una cifra riportata attorno ai 72 milioni di sterline dopo una sola stagione di Serie A.' },
      { id: 'q_698c4d', q: 'Quale esterno cresciuto nel vivaio dell’Atalanta fu ceduto alla Juventus nel gennaio 2020 per 35 milioni, mentre era in prestito al Parma?', o: ['Matteo Pessina', 'Roberto Gagliardini', 'Dejan Kulusevski', 'Amad Diallo'], a: 2, hint: 'Cresciuto in Svezia e formato dall’Atalanta, Kulusevski esplose in prestito al Parma e fu venduto alla Juventus a stagione in corso.' },
      { id: 'q_edc063', q: 'Quale esterno cresciuto nel vivaio dell’Atalanta, nella sua provincia bergamasca, passò al Milan nel 1986 vincendo poi la Coppa dei Campioni?', o: ['Alberico Evani', 'Roberto Donadoni', 'Stefano Eranio', 'Attilio Lombardo'], a: 1, hint: 'Nato a Cisano Bergamasco, Donadoni debuttò con l’Atalanta nel 1982 e collezionò 96 presenze in campionato prima che il Milan lo acquistasse.' },
      { id: 'q_f14436', q: 'Quale attaccante, arrivato dal Venezia nel 1995, l’Atalanta cedette alla Juventus nell’estate 1996 dopo una sola stagione a Bergamo?', o: ['Nicola Amoruso', 'Christian Vieri', 'Vincenzo Montella', 'Marco Delvecchio'], a: 1, hint: 'Vieri passò alla Juventus nel luglio 1996, vinse lì lo Scudetto e poi andò all’Atlético Madrid.' },
      { id: 'q_7a2210', q: 'Chi fu capitano dell’Atalanta nella promozione dalla Serie B 2010-11, per poi essere squalificato pochi mesi dopo per il calcioscommesse?', o: ['Gianpaolo Bellini', 'Cristiano Doni', 'Simone Padoin', 'Giacomo Bonaventura'], a: 1, hint: 'Doni segnò 12 gol da centrocampista mentre l’Atalanta risaliva da campione, e nell’agosto 2011 ricevette una squalifica di tre anni e mezzo.' },
      { id: 'q_e49fbb', q: 'Quale allenatore portò l’Atalanta al titolo di Serie B sia nel 2005-06 sia nel 2010-11?', o: ['Stefano Colantuono', 'Delio Rossi', 'Luigi Delneri', 'Serse Cosmi'], a: 0, hint: 'Colantuono ebbe più di un ciclo a Bergamo e vinse la promozione da primo in classifica in entrambe quelle stagioni.' },
      { id: 'q_3b2651', q: 'Nel 1987-88 l’Atalanta raggiunse le semifinali di Coppa delle Coppe pur giocando in Serie B. Quale club belga la eliminò, andando poi a vincere il trofeo?', o: ['Anderlecht', 'KV Mechelen', 'Club Brugge', 'Standard Liegi'], a: 1, hint: 'Il Mechelen vinse entrambe le gare 2-1 e poi battè l’Ajax in finale. L’Atalanta era in gara da finalista di Coppa Italia, perché il Napoli vincitore era in Coppa dei Campioni.' },
    ],
    copy: {
      tasterEyebrow: 'Prova gratis · Senza registrazione',
      tasterH: 'Quanto conosci davvero l’Atalanta?',
      tasterPh: 'Dieci domande veloci per misurare il tuo Ball IQ nerazzurro.',
      tasterNote: 'Domande di esempio — nel quiz completo ce ne sono molte altre.',
      playSection: 'Gioca il quiz sull’Atalanta',
      playSub: 'Tocca una risposta per controllare — esito immediato e la storia che c’è dietro.',
      faqH: 'Quiz Atalanta — Domande frequenti',
      aboutQ: 'Informazioni sul quiz Atalanta',
      bandH: 'Pensi di conoscere la Dea? Dimostralo nell’app.',
      bandP: 'Serie di vittorie, 1v1 dal vivo, un punteggio su 99 — e tutti i quiz in un’unica app. L’app è in inglese.',
      alsoH: 'La stessa pagina in inglese',
      alsoP: 'Questa è la versione italiana del nostro quiz sull’Atalanta. Tutte le domande in originale:',
      alsoLink: 'Atalanta quiz (English)',
      statsLine: 'Le domande sull’Atalanta in Ball IQ coprono tre livelli di difficoltà — facile, medio e difficile — tutte con spiegazione.',
    },
  },
];
