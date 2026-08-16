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
      { id: 'q_f6e685', q: 'L’urlo in lacrime di Marco Tardelli dopo il gol nella finale del Mondiale 1982 è una delle immagini più celebri del calcio. In quale club giocava allora?', o: ['Inter', 'Juventus', 'Roma', 'Fiorentina'], a: 1, hint: 'Sei giocatori della Juventus scesero in campo dal primo minuto in quella finale con l’Italia — una spina dorsale record da un solo club — e l’urlo di Tardelli è diventato il simbolo eterno dell’emozione calcistica.' },
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
];
