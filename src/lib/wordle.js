// Footle (Football Wordle) game utilities. The answer schedule, grading
// algorithm, and solve-streak walker all live here so the FootballWordle
// game screen, FootleHero card on Home, and PuzzleReviewScreen all read
// from one source of truth.

import { dateToYMD } from "./date.js";

const DAY_MS = 24 * 60 * 60 * 1000;

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

// Stride spreads length groups across the schedule (WORDLE_PLAYERS is
// sorted by length, so plain `dayIndex % length` clustered ~30+ same-
// length days in a row). gcd(WORDLE_STRIDE, WORDLE_PLAYERS.length) MUST
// equal 1 — verify when adding entries.
export const WORDLE_ANCHOR_DAY = 20577;
export const WORDLE_ANCHOR_IDX = 129;
export const WORDLE_STRIDE = 131;

// Stride-formula lookup for a specific day index. Pulled out of
// getWordleAnswer() so anywhere that needs the puzzle for a non-today
// date (e.g. PuzzleReviewScreen reviewing an arbitrary date) shares one
// source of truth. The plain `dayIndex % len` formula MUST NOT be used —
// it computes a different answer than the active game uses for the same day.
export function getWordleAnswerForDayIndex(dayIndex) {
  const offset = (dayIndex - WORDLE_ANCHOR_DAY) * WORDLE_STRIDE;
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
