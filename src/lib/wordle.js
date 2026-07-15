// Footle (Football Wordle) game utilities. The answer schedule, grading
// algorithm, and solve-streak walker all live here so the FootballWordle
// game screen, FootleHero card on Home, and PuzzleReviewScreen all read
// from one source of truth.

import { dateToYMD } from "./date.js";

// Puzzle-number math lives in footleNumber.js (tiny, data-free) so the
// marketing home can import it without pulling this file's player list.
// Imported for local use (getWordleDayIndex, the answer-schedule offset) AND
// re-exported so the four existing importers keep working unchanged. Note:
// `export {...} from` alone re-exports WITHOUT a local binding — the import
// line is what makes the names usable below.
import { DAY_MS, WORDLE_ANCHOR_DAY, getFootleNumber } from "./footleNumber.js";
export { getFootleNumber, WORDLE_ANCHOR_DAY };

export const WORDLE_PLAYERS = [
  // 4 letters
  "KANE","COLE","OWEN","MANE","PELE","BEST","INCE","RUSH","CASE","NEAL",
  "BABB","KAHN","LAHM","OZIL","REUS","TONI","STAM","ZOLA","RAUL","XAVI",
  "ALBA","JOTA","MATA","NANI","PARK","EVRA","DIAZ","RICE","SAKA","ISCO",
  // Sprint #20 additions:
  "KAKA","KOPA","ZICO","KANU","ETOO","VAVA","DIDA","KEPA","HART","HOWE",
  "CECH","DEAN","POPE","BENT","GRAY","KING","HUNT","LATO","COCU","DUFF",
  "WISE","BERG","PEPE","OLMO","SHAW","ZOFF","SANE","LEAO","BOSZ","WARK",
  "AMOR","DIAS","VIDA","WEAH","DAEI","ZAHA","HOLT","GERA","HONG","NAGY",
  "HUTH","IDAH","VORM",
  // 5 letters
  "MESSI","SALAH","HENRY","TERRY","GIGGS","VIDIC","TEVEZ","KLOPP","BANKS","MOORE",
  "HURST","ADAMS","PIRES","DIXON","KEANE","IRWIN","BRUCE","JONES","SMITH","KLOSE",
  "NEUER","GOTZE","KROOS","TOTTI","NESTA","PIRLO","VIERI","PUYOL","PIQUE","RAMOS",
  "VILLA","SILVA","PEDRO","ALVES","COSTA","EVANS","JAMES","VARDY","BRADY","KEOWN",
  "POGBA","MARIA","FODEN","MOUNT","NUNEZ","ONANA","MENDY","DEPAY","TOURE","MIKEL",
  // Sprint #20 additions:
  "YAMAL","WIRTZ","MUSAH","REYNA","DAVID","OLISE","GAZZA","BARRY","WHITE","BUSBY",
  "CONTE","SARRI","KOVAC","CARRA","WALSH","MOYES","VOGTS","COUTO","HEALY","ALLEN",
  "BOWEN","GREEN","DUNNE","AGGER","PEDRI","ELANO","LEIVA","KANTE","TUDOR","DALOT",
  "BRAVO","VERON","ASPAS","MILLA","SUKER","POYET","BURNS","WOODS","DOYLE","SHEVA",
  "MATIP",
  // 6 letters
  "NEYMAR","MBAPPE","MODRIC","BUFFON","ZIDANE","ROONEY","AGUERO","SUAREZ","WENGER","CRUYFF",
  "PUSKAS","YASHIN","PETERS","HODDLE","WADDLE","WRIGHT","VIEIRA","HUGHES","ROBSON","KEEGAN",
  "HANSEN","FOWLER","BERGER","MULLER","RIBERY","ROBBEN","PERSIE","GULLIT","KOEMAN","DAVIDS",
  "BARESI","BAGGIO","VIALLI","HIERRO","TORRES","HAZARD","MORATA","DROGBA","MAHREZ","MILNER",
  "DYBALA","ICARDI","KOUNDE","THIAGO","CHIESA","FOFANA","HALLER","LUKAKU","LLORIS","VARANE",
  "DAVIES","HAKIMI","CAVANI","FALCAO","GALLAS","CRESPO",
  // Sprint #20 additions:
  "ARTETA","BIELSA","TUCHEL","POTTER","ALONSO","ANTONY","WALKER","BAINES","BARTON","PEARCE",
  "PARKER","LAUREN","WERNER","KONATE","BAILEY","BAILLY","CABAYE","ZAMORA","MORENO","HEINZE",
  "TRAORE","HUTTON","TAYLOR","PETROV","HAMSIK","GERSON","ANELKA","SAGNOL","MARSCH","GORDON",
  "TIGANA","HAYNES","HOWARD","ALBERT","PALMER","NEDVED","SEAMAN","WAGNER","VALDES","VLASIC",
  "PIATEK","ELANGA","VOLKAN","MUSCAT",
  // 7 letters
  "RONALDO","HAALAND","BENZEMA","BECKHAM","GERRARD","LAMPARD","SHEARER","SCHOLES","FIRMINO","SHANKLY",
  "EUSEBIO","PLATINI","LINEKER","CANTONA","WILKINS","BUTCHER","SHILTON","FLOWERS","TOSHACK","SOUNESS",
  "KENNEDY","BALLACK","BOATENG","HUMMELS","SNIJDER","SEEDORF","MALDINI","GATTUSO","INZAGHI","MILITAO",
  "ASENSIO","HERRERA","VERATTI","MERTENS","HIGUAIN","RAFINHA","CARRICK","ALISSON","EDERSON","MAGUIRE",
  "RUDIGER","KIMMICH","DEMBELE","ENDRICK","WALCOTT",
  // Sprint #20 additions:
  "INIESTA","RIVALDO","BARELLA","BELOTTI","ZIRKZEE","KOMPANY","ALMIRON","BENITEZ","ROBINHO","MARTIAL",
  "ANTONIO","BRADLEY","INSIGNE","SHAQIRI","LANZINI","MUNTARI","KOLAROV","VOELLER","HOLDING","WARNOCK",
  "ELLIOTT","LAUDRUP","ENRIQUE","BENNETT","MUSIALA","ROSICKY","KHEDIRA","DOWNING","VANDIJK","VANGAAL",
  "DEROSSI","KOVACIC","MARQUEZ","WILLIAN","MANCINI","FRIEDEL","BERGOMI","MILBURN","ZANETTI","BENATIA",
  "ADRIANO","VALDANO","PIZARRO","BISSAKA","GHIGGIA","DEMIRAL",
  // 8 letters
  "CASILLAS","MOURINHO","FERGUSON","DALGLISH","MARADONA","CHARLTON","BERGKAMP","CLEMENCE","REDKNAPP","MATTHAUS",
  "BIERHOFF","PODOLSKI","RIJKAARD","BUSQUETS","FABREGAS","COUTINHO","COURTOIS","JORGINHO","VINICIUS","GREALISH",
  "GVARDIOL","CASEMIRO","VALVERDE","MARTINEZ","LINDELOF","SMALLING","STERLING","MAKELELE","MAZRAOUI","VLAHOVIC",
  "HEIGHWAY","CAMPBELL",
  // Sprint #20 additions:
  "TROSSARD","ANDERSON","MENDIETA","WILSHERE","BENRAHMA","DESAILLY","ZAMORANO","BERAHINO","GUARDADO","GUERRERO",
  "GUNDOGAN","RIQUELME","RANGNICK","BROOKING","BARDSLEY","DENILSON","BENAYOUN","ROBINSON","IAQUINTA",
];

// Sprint #81 YY2 — full-name reveal map. Looked up at game end (Footle
// won/lost) to render "Harry Kane" instead of just "KANE" — first name
// in muted body text, surname in accent. Editorial rules:
//   - Standard surname: [firstName, properSurname] with diacritics on
//     surname per standard spelling (Mbappé, Eto'o, Šuker, Müller).
//   - Disambiguation locked: RONALDO=Cristiano (CR7), SILVA=David,
//     COSTA=Diego, JONES=Phil — pool-author intent.
//   - Brand-nickname WITH first name (informative form): GAZZA=Paul
//     Gascoigne, SHEVA=Andriy Shevchenko, CARRA=Jamie Carragher,
//     KAKA=Ricardo Kaká, MILLA=Roger Milla, KOPA=Raymond Kopa,
//     ETOO=Samuel Eto'o, SUKER=Davor Šuker, DROGBA=Didier Drogba.
//     The displayed surname can differ from the puzzle answer (you
//     typed GAZZA but the reveal says "Paul Gascoigne") — by design.
//   - Pure single-name brand: empty prefix → reveal shows just the
//     accent surname (no leading whitespace). PELE, NEYMAR, RONALDINHO,
//     ZICO, VAVA, RAUL, XAVI, plus Brazilian one-name brands (RIVALDO,
//     ROBINHO, ALISSON, EDERSON, CASEMIRO, JORGINHO, VINICIUS, etc.)
//     and first-name-as-puzzle-answer (KEPA, PEDRO, ISCO, NANI, PEDRI,
//     ANTONY, LAUREN, VOLKAN).
//   - Compound surname / preposition prefix: split between prefix and
//     surname so the full form reads correctly. MARIA=[Ángel Di, María],
//     PERSIE=[Robin van, Persie], VANDIJK=[Virgil van, Dijk],
//     VANGAAL=[Louis van, Gaal], DEROSSI=[Daniele De, Rossi],
//     BISSAKA=[Aaron Wan-, Bissaka].
//   - Missing-key safety net: reveal code falls back to ["", answer]
//     so an unmapped pool entry still renders cleanly (uppercase
//     surname, no prefix).
export const WORDLE_FULL_NAMES = {
  // ─── 4 letters ───────────────────────────────────────────────────────
  KANE: ["Harry", "Kane"],
  COLE: ["Ashley", "Cole"],
  OWEN: ["Michael", "Owen"],
  MANE: ["Sadio", "Mané"],
  PELE: ["", "Pelé"],
  BEST: ["George", "Best"],
  INCE: ["Paul", "Ince"],
  RUSH: ["Ian", "Rush"],
  CASE: ["Jimmy", "Case"],
  NEAL: ["Phil", "Neal"],
  BABB: ["Phil", "Babb"],
  KAHN: ["Oliver", "Kahn"],
  LAHM: ["Philipp", "Lahm"],
  OZIL: ["Mesut", "Özil"],
  REUS: ["Marco", "Reus"],
  TONI: ["Luca", "Toni"],
  STAM: ["Jaap", "Stam"],
  ZOLA: ["Gianfranco", "Zola"],
  RAUL: ["", "Raúl"],
  XAVI: ["", "Xavi"],
  ALBA: ["Jordi", "Alba"],
  JOTA: ["Diogo", "Jota"],
  MATA: ["Juan", "Mata"],
  NANI: ["", "Nani"],
  PARK: ["Ji-sung", "Park"],
  EVRA: ["Patrice", "Evra"],
  DIAZ: ["Luis", "Díaz"],
  RICE: ["Declan", "Rice"],
  SAKA: ["Bukayo", "Saka"],
  ISCO: ["", "Isco"],
  KAKA: ["Ricardo", "Kaká"],
  KOPA: ["Raymond", "Kopa"],
  ZICO: ["", "Zico"],
  KANU: ["Nwankwo", "Kanu"],
  ETOO: ["Samuel", "Eto'o"],
  VAVA: ["", "Vavá"],
  DIDA: ["", "Dida"],
  KEPA: ["", "Kepa"],
  HART: ["Joe", "Hart"],
  HOWE: ["Eddie", "Howe"],
  CECH: ["Petr", "Čech"],
  DEAN: ["Dixie", "Dean"],
  POPE: ["Nick", "Pope"],
  BENT: ["Darren", "Bent"],
  GRAY: ["Andy", "Gray"],
  KING: ["Ledley", "King"],
  HUNT: ["Roger", "Hunt"],
  LATO: ["Grzegorz", "Lato"],
  COCU: ["Phillip", "Cocu"],
  DUFF: ["Damien", "Duff"],
  WISE: ["Dennis", "Wise"],
  BERG: ["Henning", "Berg"],
  PEPE: ["", "Pepe"],
  OLMO: ["Dani", "Olmo"],
  SHAW: ["Luke", "Shaw"],
  ZOFF: ["Dino", "Zoff"],
  SANE: ["Leroy", "Sané"],
  LEAO: ["Rafael", "Leão"],
  BOSZ: ["Peter", "Bosz"],
  WARK: ["John", "Wark"],
  AMOR: ["Guillermo", "Amor"],
  DIAS: ["Rúben", "Dias"],
  VIDA: ["Domagoj", "Vida"],
  WEAH: ["George", "Weah"],
  DAEI: ["Ali", "Daei"],
  ZAHA: ["Wilfried", "Zaha"],
  HOLT: ["Grant", "Holt"],
  GERA: ["Zoltán", "Gera"],
  HONG: ["Myung-bo", "Hong"],
  NAGY: ["Ádám", "Nagy"],
  HUTH: ["Robert", "Huth"],
  IDAH: ["Adam", "Idah"],
  VORM: ["Michel", "Vorm"],

  // ─── 5 letters ───────────────────────────────────────────────────────
  MESSI: ["Lionel", "Messi"],
  SALAH: ["Mohamed", "Salah"],
  HENRY: ["Thierry", "Henry"],
  TERRY: ["John", "Terry"],
  GIGGS: ["Ryan", "Giggs"],
  VIDIC: ["Nemanja", "Vidić"],
  TEVEZ: ["Carlos", "Tevez"],
  KLOPP: ["Jürgen", "Klopp"],
  BANKS: ["Gordon", "Banks"],
  MOORE: ["Bobby", "Moore"],
  HURST: ["Geoff", "Hurst"],
  ADAMS: ["Tony", "Adams"],
  PIRES: ["Robert", "Pirès"],
  DIXON: ["Lee", "Dixon"],
  KEANE: ["Roy", "Keane"],
  IRWIN: ["Denis", "Irwin"],
  BRUCE: ["Steve", "Bruce"],
  JONES: ["Phil", "Jones"],
  SMITH: ["Alan", "Smith"],
  KLOSE: ["Miroslav", "Klose"],
  NEUER: ["Manuel", "Neuer"],
  GOTZE: ["Mario", "Götze"],
  KROOS: ["Toni", "Kroos"],
  TOTTI: ["Francesco", "Totti"],
  NESTA: ["Alessandro", "Nesta"],
  PIRLO: ["Andrea", "Pirlo"],
  VIERI: ["Christian", "Vieri"],
  PUYOL: ["Carles", "Puyol"],
  PIQUE: ["Gerard", "Piqué"],
  RAMOS: ["Sergio", "Ramos"],
  VILLA: ["David", "Villa"],
  SILVA: ["David", "Silva"],
  PEDRO: ["", "Pedro"],
  ALVES: ["Dani", "Alves"],
  COSTA: ["Diego", "Costa"],
  EVANS: ["Jonny", "Evans"],
  JAMES: ["David", "James"],
  VARDY: ["Jamie", "Vardy"],
  BRADY: ["Liam", "Brady"],
  KEOWN: ["Martin", "Keown"],
  POGBA: ["Paul", "Pogba"],
  MARIA: ["Ángel Di", "María"],
  FODEN: ["Phil", "Foden"],
  MOUNT: ["Mason", "Mount"],
  NUNEZ: ["Darwin", "Núñez"],
  ONANA: ["André", "Onana"],
  MENDY: ["Édouard", "Mendy"],
  DEPAY: ["Memphis", "Depay"],
  TOURE: ["Yaya", "Touré"],
  MIKEL: ["John Obi", "Mikel"],
  YAMAL: ["Lamine", "Yamal"],
  WIRTZ: ["Florian", "Wirtz"],
  MUSAH: ["Yunus", "Musah"],
  REYNA: ["Gio", "Reyna"],
  DAVID: ["Jonathan", "David"],
  OLISE: ["Michael", "Olise"],
  GAZZA: ["Paul", "Gascoigne"],
  BARRY: ["Gareth", "Barry"],
  WHITE: ["Ben", "White"],
  BUSBY: ["Matt", "Busby"],
  CONTE: ["Antonio", "Conte"],
  SARRI: ["Maurizio", "Sarri"],
  KOVAC: ["Niko", "Kovač"],
  CARRA: ["Jamie", "Carragher"],
  WALSH: ["Keira", "Walsh"],
  MOYES: ["David", "Moyes"],
  VOGTS: ["Berti", "Vogts"],
  COUTO: ["Fernando", "Couto"],
  HEALY: ["David", "Healy"],
  ALLEN: ["Joe", "Allen"],
  BOWEN: ["Jarrod", "Bowen"],
  GREEN: ["Robert", "Green"],
  DUNNE: ["Richard", "Dunne"],
  AGGER: ["Daniel", "Agger"],
  PEDRI: ["", "Pedri"],
  ELANO: ["", "Elano"],
  LEIVA: ["Lucas", "Leiva"],
  KANTE: ["N'Golo", "Kanté"],
  TUDOR: ["Igor", "Tudor"],
  DALOT: ["Diogo", "Dalot"],
  BRAVO: ["Claudio", "Bravo"],
  VERON: ["Juan Sebastián", "Verón"],
  ASPAS: ["Iago", "Aspas"],
  MILLA: ["Roger", "Milla"],
  SUKER: ["Davor", "Šuker"],
  POYET: ["Gus", "Poyet"],
  BURNS: ["Wes", "Burns"],
  WOODS: ["Chris", "Woods"],
  DOYLE: ["Tommy", "Doyle"],
  SHEVA: ["Andriy", "Shevchenko"],
  MATIP: ["Joël", "Matip"],

  // ─── 6 letters ───────────────────────────────────────────────────────
  NEYMAR: ["", "Neymar"],
  MBAPPE: ["Kylian", "Mbappé"],
  MODRIC: ["Luka", "Modrić"],
  BUFFON: ["Gianluigi", "Buffon"],
  ZIDANE: ["Zinedine", "Zidane"],
  ROONEY: ["Wayne", "Rooney"],
  AGUERO: ["Sergio", "Agüero"],
  SUAREZ: ["Luis", "Suárez"],
  WENGER: ["Arsène", "Wenger"],
  CRUYFF: ["Johan", "Cruyff"],
  PUSKAS: ["Ferenc", "Puskás"],
  YASHIN: ["Lev", "Yashin"],
  PETERS: ["Martin", "Peters"],
  HODDLE: ["Glenn", "Hoddle"],
  WADDLE: ["Chris", "Waddle"],
  WRIGHT: ["Ian", "Wright"],
  VIEIRA: ["Patrick", "Vieira"],
  HUGHES: ["Mark", "Hughes"],
  ROBSON: ["Bryan", "Robson"],
  KEEGAN: ["Kevin", "Keegan"],
  HANSEN: ["Alan", "Hansen"],
  FOWLER: ["Robbie", "Fowler"],
  BERGER: ["Patrik", "Berger"],
  MULLER: ["Thomas", "Müller"],
  RIBERY: ["Franck", "Ribéry"],
  ROBBEN: ["Arjen", "Robben"],
  PERSIE: ["Robin van", "Persie"],
  GULLIT: ["Ruud", "Gullit"],
  KOEMAN: ["Ronald", "Koeman"],
  DAVIDS: ["Edgar", "Davids"],
  BARESI: ["Franco", "Baresi"],
  BAGGIO: ["Roberto", "Baggio"],
  VIALLI: ["Gianluca", "Vialli"],
  HIERRO: ["Fernando", "Hierro"],
  TORRES: ["Fernando", "Torres"],
  HAZARD: ["Eden", "Hazard"],
  MORATA: ["Álvaro", "Morata"],
  DROGBA: ["Didier", "Drogba"],
  MAHREZ: ["Riyad", "Mahrez"],
  MILNER: ["James", "Milner"],
  DYBALA: ["Paulo", "Dybala"],
  ICARDI: ["Mauro", "Icardi"],
  KOUNDE: ["Jules", "Koundé"],
  THIAGO: ["", "Thiago"],
  CHIESA: ["Federico", "Chiesa"],
  FOFANA: ["Wesley", "Fofana"],
  HALLER: ["Sébastien", "Haller"],
  LUKAKU: ["Romelu", "Lukaku"],
  LLORIS: ["Hugo", "Lloris"],
  VARANE: ["Raphaël", "Varane"],
  DAVIES: ["Alphonso", "Davies"],
  HAKIMI: ["Achraf", "Hakimi"],
  CAVANI: ["Edinson", "Cavani"],
  FALCAO: ["Radamel", "Falcao"],
  GALLAS: ["William", "Gallas"],
  CRESPO: ["Hernán", "Crespo"],
  ARTETA: ["Mikel", "Arteta"],
  BIELSA: ["Marcelo", "Bielsa"],
  TUCHEL: ["Thomas", "Tuchel"],
  POTTER: ["Graham", "Potter"],
  ALONSO: ["Xabi", "Alonso"],
  ANTONY: ["", "Antony"],
  WALKER: ["Kyle", "Walker"],
  BAINES: ["Leighton", "Baines"],
  BARTON: ["Joey", "Barton"],
  PEARCE: ["Stuart", "Pearce"],
  PARKER: ["Scott", "Parker"],
  LAUREN: ["", "Lauren"],
  WERNER: ["Timo", "Werner"],
  KONATE: ["Ibrahima", "Konaté"],
  BAILEY: ["Leon", "Bailey"],
  BAILLY: ["Eric", "Bailly"],
  CABAYE: ["Yohan", "Cabaye"],
  ZAMORA: ["Bobby", "Zamora"],
  MORENO: ["Héctor", "Moreno"],
  HEINZE: ["Gabriel", "Heinze"],
  TRAORE: ["Adama", "Traoré"],
  HUTTON: ["Alan", "Hutton"],
  TAYLOR: ["Peter", "Taylor"],
  PETROV: ["Stiliyan", "Petrov"],
  HAMSIK: ["Marek", "Hamšík"],
  GERSON: ["", "Gérson"],
  ANELKA: ["Nicolas", "Anelka"],
  SAGNOL: ["Willy", "Sagnol"],
  MARSCH: ["Jesse", "Marsch"],
  GORDON: ["Anthony", "Gordon"],
  TIGANA: ["Jean", "Tigana"],
  HAYNES: ["Johnny", "Haynes"],
  HOWARD: ["Tim", "Howard"],
  ALBERT: ["Philippe", "Albert"],
  PALMER: ["Cole", "Palmer"],
  NEDVED: ["Pavel", "Nedvěd"],
  SEAMAN: ["David", "Seaman"],
  WAGNER: ["David", "Wagner"],
  VALDES: ["Víctor", "Valdés"],
  VLASIC: ["Nikola", "Vlašić"],
  PIATEK: ["Krzysztof", "Piątek"],
  ELANGA: ["Anthony", "Elanga"],
  VOLKAN: ["", "Volkan"],
  MUSCAT: ["Kevin", "Muscat"],

  // ─── 7 letters ───────────────────────────────────────────────────────
  RONALDO: ["Cristiano", "Ronaldo"],
  HAALAND: ["Erling", "Haaland"],
  BENZEMA: ["Karim", "Benzema"],
  BECKHAM: ["David", "Beckham"],
  GERRARD: ["Steven", "Gerrard"],
  LAMPARD: ["Frank", "Lampard"],
  SHEARER: ["Alan", "Shearer"],
  SCHOLES: ["Paul", "Scholes"],
  FIRMINO: ["Roberto", "Firmino"],
  SHANKLY: ["Bill", "Shankly"],
  EUSEBIO: ["", "Eusébio"],
  PLATINI: ["Michel", "Platini"],
  LINEKER: ["Gary", "Lineker"],
  CANTONA: ["Eric", "Cantona"],
  WILKINS: ["Ray", "Wilkins"],
  BUTCHER: ["Terry", "Butcher"],
  SHILTON: ["Peter", "Shilton"],
  FLOWERS: ["Tim", "Flowers"],
  TOSHACK: ["John", "Toshack"],
  SOUNESS: ["Graeme", "Souness"],
  KENNEDY: ["Alan", "Kennedy"],
  BALLACK: ["Michael", "Ballack"],
  BOATENG: ["Jérôme", "Boateng"],
  HUMMELS: ["Mats", "Hummels"],
  SNIJDER: ["Wesley", "Sneijder"],
  SEEDORF: ["Clarence", "Seedorf"],
  MALDINI: ["Paolo", "Maldini"],
  GATTUSO: ["Gennaro", "Gattuso"],
  INZAGHI: ["Filippo", "Inzaghi"],
  MILITAO: ["Éder", "Militão"],
  ASENSIO: ["Marco", "Asensio"],
  HERRERA: ["Ander", "Herrera"],
  VERATTI: ["Marco", "Verratti"],
  MERTENS: ["Dries", "Mertens"],
  HIGUAIN: ["Gonzalo", "Higuaín"],
  RAFINHA: ["", "Rafinha"],
  CARRICK: ["Michael", "Carrick"],
  ALISSON: ["", "Alisson"],
  EDERSON: ["", "Ederson"],
  MAGUIRE: ["Harry", "Maguire"],
  RUDIGER: ["Antonio", "Rüdiger"],
  KIMMICH: ["Joshua", "Kimmich"],
  DEMBELE: ["Ousmane", "Dembélé"],
  ENDRICK: ["", "Endrick"],
  WALCOTT: ["Theo", "Walcott"],
  INIESTA: ["Andrés", "Iniesta"],
  RIVALDO: ["", "Rivaldo"],
  BARELLA: ["Nicolò", "Barella"],
  BELOTTI: ["Andrea", "Belotti"],
  ZIRKZEE: ["Joshua", "Zirkzee"],
  KOMPANY: ["Vincent", "Kompany"],
  ALMIRON: ["Miguel", "Almirón"],
  BENITEZ: ["Rafa", "Benítez"],
  ROBINHO: ["", "Robinho"],
  MARTIAL: ["Anthony", "Martial"],
  ANTONIO: ["Michail", "Antonio"],
  BRADLEY: ["Bob", "Bradley"],
  INSIGNE: ["Lorenzo", "Insigne"],
  SHAQIRI: ["Xherdan", "Shaqiri"],
  LANZINI: ["Manuel", "Lanzini"],
  MUNTARI: ["Sulley", "Muntari"],
  KOLAROV: ["Aleksandar", "Kolarov"],
  VOELLER: ["Rudi", "Völler"],
  HOLDING: ["Rob", "Holding"],
  WARNOCK: ["Neil", "Warnock"],
  ELLIOTT: ["Harvey", "Elliott"],
  LAUDRUP: ["Michael", "Laudrup"],
  ENRIQUE: ["Luis", "Enrique"],
  BENNETT: ["Joe", "Bennett"],
  MUSIALA: ["Jamal", "Musiala"],
  ROSICKY: ["Tomáš", "Rosický"],
  KHEDIRA: ["Sami", "Khedira"],
  DOWNING: ["Stewart", "Downing"],
  VANDIJK: ["Virgil van", "Dijk"],
  VANGAAL: ["Louis van", "Gaal"],
  DEROSSI: ["Daniele De", "Rossi"],
  KOVACIC: ["Mateo", "Kovačić"],
  MARQUEZ: ["Rafa", "Márquez"],
  WILLIAN: ["", "Willian"],
  MANCINI: ["Roberto", "Mancini"],
  FRIEDEL: ["Brad", "Friedel"],
  BERGOMI: ["Giuseppe", "Bergomi"],
  MILBURN: ["Jackie", "Milburn"],
  ZANETTI: ["Javier", "Zanetti"],
  BENATIA: ["Mehdi", "Benatia"],
  ADRIANO: ["", "Adriano"],
  VALDANO: ["Jorge", "Valdano"],
  PIZARRO: ["Claudio", "Pizarro"],
  BISSAKA: ["Aaron Wan-", "Bissaka"],
  GHIGGIA: ["Alcides", "Ghiggia"],
  DEMIRAL: ["Merih", "Demiral"],

  // ─── 8 letters ───────────────────────────────────────────────────────
  CASILLAS: ["Iker", "Casillas"],
  MOURINHO: ["José", "Mourinho"],
  FERGUSON: ["Alex", "Ferguson"],
  DALGLISH: ["Kenny", "Dalglish"],
  MARADONA: ["Diego", "Maradona"],
  CHARLTON: ["Bobby", "Charlton"],
  BERGKAMP: ["Dennis", "Bergkamp"],
  CLEMENCE: ["Ray", "Clemence"],
  REDKNAPP: ["Harry", "Redknapp"],
  MATTHAUS: ["Lothar", "Matthäus"],
  BIERHOFF: ["Oliver", "Bierhoff"],
  PODOLSKI: ["Lukas", "Podolski"],
  RIJKAARD: ["Frank", "Rijkaard"],
  BUSQUETS: ["Sergio", "Busquets"],
  FABREGAS: ["Cesc", "Fàbregas"],
  COUTINHO: ["Philippe", "Coutinho"],
  COURTOIS: ["Thibaut", "Courtois"],
  JORGINHO: ["", "Jorginho"],
  VINICIUS: ["", "Vinícius"],
  GREALISH: ["Jack", "Grealish"],
  GVARDIOL: ["Joško", "Gvardiol"],
  CASEMIRO: ["", "Casemiro"],
  VALVERDE: ["Federico", "Valverde"],
  MARTINEZ: ["Lautaro", "Martínez"],
  LINDELOF: ["Victor", "Lindelöf"],
  SMALLING: ["Chris", "Smalling"],
  STERLING: ["Raheem", "Sterling"],
  MAKELELE: ["Claude", "Makélélé"],
  MAZRAOUI: ["Noussair", "Mazraoui"],
  VLAHOVIC: ["Dušan", "Vlahović"],
  HEIGHWAY: ["Steve", "Heighway"],
  CAMPBELL: ["Sol", "Campbell"],
  TROSSARD: ["Leandro", "Trossard"],
  ANDERSON: ["", "Anderson"],
  MENDIETA: ["Gaizka", "Mendieta"],
  WILSHERE: ["Jack", "Wilshere"],
  BENRAHMA: ["Saïd", "Benrahma"],
  DESAILLY: ["Marcel", "Desailly"],
  ZAMORANO: ["Iván", "Zamorano"],
  BERAHINO: ["Saido", "Berahino"],
  GUARDADO: ["Andrés", "Guardado"],
  GUERRERO: ["Paolo", "Guerrero"],
  GUNDOGAN: ["İlkay", "Gündoğan"],
  RIQUELME: ["Juan Román", "Riquelme"],
  RANGNICK: ["Ralf", "Rangnick"],
  BROOKING: ["Trevor", "Brooking"],
  BARDSLEY: ["Phil", "Bardsley"],
  DENILSON: ["", "Denílson"],
  BENAYOUN: ["Yossi", "Benayoun"],
  ROBINSON: ["Paul", "Robinson"],
  IAQUINTA: ["Vincenzo", "Iaquinta"],
};

// Day index keyed by the user's LOCAL calendar date. Sprint #74 PP2 fix:
// previously this was `Math.floor(Date.now() / DAY_MS)` which gave the UTC
// day index and rolled the puzzle over at UTC midnight — but the storage
// key (src/lib/wordleStatus.js getWordleDateKey) uses the user's LOCAL
// date. The mismatch produced two real bugs:
//   - Tokyo at 23:30 JST: local key = "2026-05-22", UTC index = N. Tokyo
//     at 00:30 JST next day: local key = "2026-05-23" (fresh, empty), but
//     UTC index STILL N — same player as last night, fresh slate. Streak
//     walker counted it as two consecutive days for ONE global puzzle.
//   - NYC at 19:00 EST (= 00:00 UTC next day): local key = "today", UTC
//     index = TOMORROW. User got tomorrow's player stored under today's
//     local date.
// Now both KEY and ANSWER derive from the user's local calendar date via
// Date.UTC(localY, localM, localD) — every user in their own timezone
// sees one puzzle per local day, and worldwide users on their respective
// "May 22" all get WORDLE_PLAYERS[same idx]. Anchor constants below are
// preserved (June 4, 2026 maps to the same Date.UTC value as before).
export function getWordleDayIndex() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

// getFootleNumber + WORDLE_ANCHOR_DAY moved to footleNumber.js (re-exported
// at the top of this file — see comment there).

// Stride spreads length groups across the schedule (WORDLE_PLAYERS is
// sorted by length, so plain `dayIndex % length` clustered ~30+ same-
// length days in a row). gcd(WORDLE_STRIDE, WORDLE_PLAYERS.length) MUST
// equal 1 — verify when adding entries.
export const WORDLE_ANCHOR_IDX = 129;
export const WORDLE_STRIDE = 131;

// FROZEN answer log — Footle #1 (day WORDLE_ANCHOR_DAY, 2026-05-04) through
// #400. WORDLE_ANSWER_LOG[n] is the answer for day index WORDLE_ANCHOR_DAY+n.
//
// WHY: the stride formula depends on WORDLE_PLAYERS.length as the modulo
// base, so appending even ONE player silently rewrote every past and future
// answer — including the publicly indexed answer archive (api/footle.js).
// This log freezes the schedule the formula produced when the pool had 406
// players, so the pool can now grow safely: days inside the log never move.
//
// GENERATED from the stride formula below (anchor idx 129, stride 131,
// pool length 406) — tests/unit/wordle-schedule.test.js recomputes the
// formula and asserts every log entry still matches while the pool is
// unchanged, and that growing the pool moves no logged answer.
//
// TO EXTEND past #400: append more entries deliberately (any pool players,
// hand-picked or generated) — do NOT rely on the formula fallback below,
// which shifts whenever the pool grows.
export const WORDLE_ANSWER_LOG = [
  "GAZZA","PIATEK","BENRAHMA","MOUNT","SAGNOL","MARTINEZ","VILLA","BAILEY",
  "BIERHOFF","JONES","BIELSA","BISSAKA","GIGGS","CHIESA","DEROSSI","DAEI",
  "BAGGIO","VOELLER","BERG","ROBSON","ZIRKZEE","HART","ROONEY","CARRICK",
  "EVRA","MILLA","HUMMELS","LAHM","BOWEN","EUSEBIO","IAQUINTA","BARRY",
  "ELANGA","DESAILLY","NUNEZ","MARSCH","LINDELOF","SILVA","BAILLY","PODOLSKI",
  "SMITH","TUCHEL","GHIGGIA","VIDIC","FOFANA","KOVACIC","ZAHA","VIALLI",
  "HOLDING","PEPE","KEEGAN","KOMPANY","HOWE","AGUERO","ALISSON","DIAZ",
  "SUKER","SNIJDER","OZIL","GREEN","PLATINI","KANE","WHITE","VOLKAN",
  "ZAMORANO","ONANA","GORDON","SMALLING","PEDRO","CABAYE","RIJKAARD","KLOSE",
  "POTTER","DEMIRAL","TEVEZ","HALLER","MARQUEZ","HOLT","HIERRO","WARNOCK",
  "OLMO","HANSEN","ALMIRON","CECH","SUAREZ","EDERSON","RICE","POYET",
  "SEEDORF","REUS","DUNNE","LINEKER","COLE","BUSBY","MUSCAT","BERAHINO",
  "MENDY","TIGANA","STERLING","ALVES","ZAMORA","BUSQUETS","NEUER","ALONSO",
  "CASILLAS","KLOPP","LUKAKU","WILLIAN","GERA","TORRES","ELLIOTT","SHAW",
  "FOWLER","BENITEZ","DEAN","WENGER","MAGUIRE","SAKA","BURNS","MALDINI",
  "TONI","AGGER","CANTONA","OWEN","CONTE","RONALDO","GUARDADO","DEPAY",
  "HAYNES","MAKELELE","COSTA","MORENO","FABREGAS","GOTZE","ANTONY","MOURINHO",
  "BANKS","LLORIS","MANCINI","HONG","HAZARD","LAUDRUP","ZOFF","BERGER",
  "ROBINHO","POPE","CRUYFF","RUDIGER","ISCO","WOODS","GATTUSO","STAM",
  "PEDRI","WILKINS","MANE","SARRI","HAALAND","GUERRERO","TOURE","HOWARD",
  "MAZRAOUI","EVANS","HEINZE","COUTINHO","KROOS","WALKER","FERGUSON","MOORE",
  "VARANE","FRIEDEL","NAGY","MORATA","ENRIQUE","SANE","MULLER","MARTIAL",
  "BENT","PUSKAS","KIMMICH","KAKA","DOYLE","INZAGHI","ZOLA","ELANO",
  "BUTCHER","PELE","KOVAC","BENZEMA","GUNDOGAN","MIKEL","ALBERT","VLAHOVIC",
  "JAMES","TRAORE","COURTOIS","TOTTI","BAINES","DALGLISH","HURST","DAVIES",
  "BERGOMI","HUTH","DROGBA","BENNETT","LEAO","RIBERY","ANTONIO","GRAY",
  "YASHIN","DEMBELE","KOPA","SHEVA","MILITAO","RAUL","LEIVA","SHILTON",
  "BEST","CARRA","BECKHAM","RIQUELME","YAMAL","PALMER","HEIGHWAY","VARDY",
  "HUTTON","JORGINHO","NESTA","BARTON","MARADONA","ADAMS","HAKIMI","MILBURN",
  "IDAH","MAHREZ","MUSIALA","BOSZ","ROBBEN","BRADLEY","KING","PETERS",
  "ENDRICK","ZICO","MATIP","ASENSIO","XAVI","KANTE","FLOWERS","INCE",
  "WALSH","GERRARD","RANGNICK","WIRTZ","NEDVED","CAMPBELL","BRADY","TAYLOR",
  "VINICIUS","PIRLO","PEARCE","CHARLTON","PIRES","CAVANI","ZANETTI","VORM",
  "MILNER","ROSICKY","WARK","PERSIE","INSIGNE","HUNT","HODDLE","WALCOTT",
  "KANU","NEYMAR","HERRERA","ALBA","TUDOR","TOSHACK","RUSH","MOYES",
  "LAMPARD","BROOKING","MUSAH","SEAMAN","TROSSARD","KEOWN","PETROV","GREALISH",
  "VIERI","PARKER","BERGKAMP","DIXON","FALCAO","BENATIA","MESSI","DYBALA",
  "KHEDIRA","AMOR","GULLIT","SHAQIRI","LATO","WADDLE","INIESTA","ETOO",
  "MBAPPE","VERATTI","JOTA","DALOT","SOUNESS","CASE","VOGTS","SHEARER",
  "BARDSLEY","REYNA","WAGNER","ANDERSON","POGBA","HAMSIK","GVARDIOL","PUYOL",
  "LAUREN","CLEMENCE","KEANE","GALLAS","ADRIANO","SALAH","ICARDI","DOWNING",
  "DIAS","KOEMAN","LANZINI","COCU","WRIGHT","RIVALDO","VAVA","MODRIC",
  "MERTENS","MATA","BRAVO","KENNEDY","NEAL","COUTO","SCHOLES","DENILSON",
  "DAVID","VALDES","MENDIETA","MARIA","GERSON","CASEMIRO","PIQUE","WERNER",
  "REDKNAPP","IRWIN","CRESPO","VALDANO","HENRY","KOUNDE","VANDIJK","VIDA",
  "DAVIDS","MUNTARI","DUFF","VIEIRA","BARELLA","DIDA","BUFFON","HIGUAIN",
  "NANI","VERON","BALLACK","BABB","HEALY","FIRMINO","BENAYOUN","OLISE",
  "VLASIC","WILSHERE","FODEN","ANELKA","VALVERDE","RAMOS","KONATE","MATTHAUS",
  "BRUCE","ARTETA","PIZARRO","TERRY","THIAGO","VANGAAL","WEAH","BARESI",
  "KOLAROV","WISE","HUGHES","BELOTTI","KEPA","ZIDANE","RAFINHA","PARK",
];

// Answer lookup for a specific day index. Pulled out of getWordleAnswer()
// so anywhere that needs the puzzle for a non-today date (e.g.
// PuzzleReviewScreen reviewing an arbitrary date) shares one source of
// truth. Days covered by WORDLE_ANSWER_LOG (Footle #1..#400) read the
// frozen log; only days beyond the horizon fall back to the stride formula
// — extend the log before #400 arrives (~2027-06-07). The plain
// `dayIndex % len` formula MUST NOT be used — it computes a different
// answer than the active game uses for the same day.
export function getWordleAnswerForDayIndex(dayIndex) {
  const n = dayIndex - WORDLE_ANCHOR_DAY;
  if (n >= 0 && n < WORDLE_ANSWER_LOG.length) return WORDLE_ANSWER_LOG[n];
  const offset = n * WORDLE_STRIDE;
  const len = WORDLE_PLAYERS.length;
  const idx = ((WORDLE_ANCHOR_IDX + offset) % len + len) % len;
  return WORDLE_PLAYERS[idx];
}

export function getWordleAnswer() {
  return getWordleAnswerForDayIndex(getWordleDayIndex());
}

// Standard Wordle two-pass colouring: greens first (locking those answer
// slots), then yellows that consume remaining-letter counts. This is what
// stops a guess of "OOOO" against "BOAT" from showing 4 yellows for the
// single O.
export function gradeWordleGuess(guess, answer) {
  const n = answer.length;
  const result = new Array(n).fill("grey");
  const remaining = [];
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) result[i] = "green";
    else remaining.push(answer[i]);
  }
  for (let i = 0; i < n; i++) {
    if (result[i] === "green") continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "yellow";
      remaining.splice(idx, 1);
    }
  }
  return result;
}

// Footle solve-streak: walk biq_wordle_<ymd> backward from `today` and
// count consecutive 'won' days. Stops at the first non-won day (loss /
// unplayed). Bounds the walk at 366 days as a defensive cap. Cross-device
// note: relies on the localStorage cache populated by useAuth.jsx's
// wordleState merge at login; first-load on a fresh device may briefly
// under-count until sync.
export function computeFootleStreak(today) {
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let i = 0; i < 366; i++) {
    try {
      const raw = localStorage.getItem(`biq_wordle_${dateToYMD(cursor)}`);
      if (!raw) break;
      const p = JSON.parse(raw);
      if (p?.status !== "won") break;
    } catch { break; }
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
