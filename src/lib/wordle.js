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
import { makeDoor } from "./scheduleDoor.js";
import { FOOTLE_SERVED } from "../data/footleServed.js";
import { getWordleDateKey } from "./wordleStatus.js";
import { t } from "../i18n/index.js";
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
  "KENNEDY","BALLACK","BOATENG","HUMMELS","SNEIJDER","SEEDORF","MALDINI","GATTUSO","INZAGHI","MILITAO",
  "ASENSIO","HERRERA","VERRATTI","MERTENS","HIGUAIN","RAFINHA","CARRICK","ALISSON","EDERSON","MAGUIRE",
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
  // 2026-10-05: the answer list grew so no unplayed day repeats an earlier one
  // (see WORDLE_ANSWER_LOG). Whole one-word surnames of widely known players.
  "GIROUD","FORLAN","RASHFORD","RAKITIC","GODIN","REINA","HONDA","THURAM","VIDAL","SANCHEZ",
  "GOMEZ","NAKATA","PERISIC","SZCZESNY","NAVAS","RAMSEY","ARSHAVIN","TURAN","ARBELOA","YOUNG",
  "KAGAWA","ROSSI","BONUCCI","ADEBAYOR","DZEKO","ERIKSEN","SCHURRLE","KEMPES","ABIDAL","ALBIOL",
  "UMTITI","DRAXLER","LOVREN","ALABA","PICKFORD","MINAMINO","LEHMANN","HAVERTZ","QUARESMA","IVANOVIC",
  "CARVALHO","ESSIEN","NASRI","ORIGI","CAZORLA","WELBECK","SAGNA","GULER","BENDTNER","IMMOBILE",
  "ODEGAARD","BARTHEZ","MILITO","WITSEL","BERBATOV","FELLAINI","OTAMENDI","PAVARD","ALVAREZ","VAZQUEZ",
  "LLORENTE","MOTTA","ZIYECH","OCHOA","PAYET","XHAKA","FELIX","GAKPO","SANCHO","MITROVIC",
  "BARZAGLI","BREHME","STONES","MATUIDI","RABIOT","OSIMHEN","KLUIVERT","BLIND","LIZARAZU","LARSSON",
  "BAROS","CASSANO","COMAN","MALOUDA","PULISIC","DEFOE","DONOVAN","GNABRY","BABEL","OBLAK",
  "CANCELO","RIISE","DEMPSEY","LITMANEN","DIGNE","PJANIC","KALOU","CROUCH","GORETZKA","PAPIN",
  "GYOKERES","LINGARD","SAVIOLA","MILIK","MATIC","CUADRADO","SOMMER","BELLERIN","MERINO",
];

// WORDLE_FULL_NAMES (the reveal map) and footleClue live in wordleFullNames.js
// since 2026-10-16 so Home's eager chunk does not carry the table; re-exported.
export { WORDLE_FULL_NAMES, footleClue } from './wordleFullNames.js';

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
// Takes a date so the ARCHIVE can ask for a past day. Defaults to now, so every
// existing caller is unchanged — and note it must stay LOCAL-date-derived: the
// Date.UTC(localY, localM, localD) shape above is what makes one puzzle per
// local day work worldwide, and passing a raw timestamp would reintroduce the
// timezone bug the comment above describes.
export function getWordleDayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
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
// ⚠️ NO REPEATS FROM #202 ON (2026-10-05). The first log reused answers once
// the pool of about 340 valid names ran out: 63 unplayed days repeated a
// player, the first on 21 Nov 2026, the tightest five months after his first
// showing. Alex's line: a repeat a year on is harmless, sooner is not. The
// pool grew by 109 whole surnames and each repeat day took a new one, so the
// log now holds 400 different answers. Days before #202 are unchanged.
// tests/unit/wordle-schedule.test.js pins both halves.
export const WORDLE_ANSWER_LOG = [
  "GAZZA","PIATEK","BENRAHMA","MOUNT","SAGNOL","MARTINEZ","VILLA","BAILEY",
  "BIERHOFF","JONES","BIELSA","BISSAKA","GIGGS","CHIESA","DEROSSI","DAEI",
  "BAGGIO","VOELLER","BERG","ROBSON","ZIRKZEE","HART","ROONEY","CARRICK",
  "EVRA","MILLA","HUMMELS","LAHM","BOWEN","EUSEBIO","IAQUINTA","BARRY",
  "ELANGA","DESAILLY","NUNEZ","MARSCH","LINDELOF","SILVA","BAILLY","PODOLSKI",
  "SMITH","TUCHEL","GHIGGIA","VIDIC","FOFANA","KOVACIC","ZAHA","VIALLI",
  "HOLDING","PEPE","KEEGAN","KOMPANY","HOWE","AGUERO","ALISSON","DIAZ",
  "SUKER","SNEIJDER","OZIL","GREEN","PLATINI","KANE","WHITE","VOLKAN",
  "ZAMORANO","ONANA","GORDON","SMALLING","PEDRO","CABAYE","RIJKAARD","KLOSE",
  "POTTER","DEMIRAL","TEVEZ","HALLER","MARQUEZ","HOLT","HIERRO","WARNOCK",
  "OLMO","HANSEN","ALMIRON","CECH","SUAREZ","EDERSON","RICE","POYET",
  "SEEDORF","ALLEN","DUNNE","LINEKER","ASPAS","BUSBY","MUSCAT","BERAHINO",
  "MENDY","TIGANA","STERLING","ALVES","ZAMORA","BUSQUETS","NEUER","ALONSO",
  "CASILLAS","KLOPP","LUKAKU","WILLIAN","SHANKLY","TORRES","ELLIOTT","BOATENG",
  "FOWLER","VALVERDE","ROBINSON","ANELKA","MAGUIRE","RAFINHA","BURNS","MALDINI",
  "ZIDANE","AGGER","CANTONA","BELOTTI","CONTE","RONALDO","GUARDADO","DEPAY",
  "HAYNES","MAKELELE","COSTA","MORENO","FABREGAS","GOTZE","ANTONY","FODEN",
  "BANKS","LLORIS","MANCINI","HUGHES","HAZARD","LAUDRUP","KOLAROV","BERGER",
  "ROBINHO","BARESI","CRUYFF","RUDIGER","VANGAAL","WOODS","GATTUSO","THIAGO",
  "PEDRI","WILKINS","TERRY","WILSHERE","HAALAND","GUERRERO","TOURE","HOWARD",
  "MAZRAOUI","EVANS","HEINZE","COUTINHO","KROOS","WALKER","FERGUSON","MOORE",
  "VARANE","FRIEDEL","PIZARRO","MORATA","ENRIQUE","ARTETA","MULLER","MARTIAL",
  "BRUCE","PUSKAS","KIMMICH","MATTHAUS","DOYLE","INZAGHI","KONATE","ELANO",
  "BUTCHER","RAMOS","KOVAC","BENZEMA","GUNDOGAN","MIKEL","ALBERT","VLAHOVIC",
  "JAMES","TRAORE","COURTOIS","TOTTI","BAINES","DALGLISH","HURST","DAVIES",
  "BERGOMI","MITROVIC","DROGBA","BENNETT","MATUIDI","RIBERY","ANTONIO","LEHMANN",
  "YASHIN","DEMBELE","FORLAN","ARBELOA","MILITAO","CANCELO","LEIVA","SHILTON",
  "RIISE","OTAMENDI","BECKHAM","RIQUELME","YAMAL","PALMER","HEIGHWAY","VARDY",
  "HUTTON","JORGINHO","NESTA","BARTON","MARADONA","ADAMS","HAKIMI","MILBURN",
  "PICKFORD","MAHREZ","MUSIALA","CARVALHO","ROBBEN","VIDAL","STONES","PETERS",
  "ENDRICK","NAVAS","MATIP","ASENSIO","PULISIC","KANTE","FLOWERS","GAKPO",
  "WALSH","GERRARD","UMTITI","WIRTZ","NEDVED","CAMPBELL","BRADY","TAYLOR",
  "VINICIUS","PIRLO","PEARCE","CHARLTON","PIRES","CAVANI","ZANETTI","BARTHEZ",
  "MILNER","ROSICKY","FELIX","KEMPES","INSIGNE","DZEKO","HODDLE","WALCOTT",
  "ALBIOL","NEYMAR","HERRERA","SZCZESNY","TUDOR","TOSHACK","GYOKERES","ERIKSEN",
  "LAMPARD","BROOKING","MUSAH","SEAMAN","TROSSARD","KEOWN","PETROV","GREALISH",
  "VIERI","PARKER","BERGKAMP","DIXON","FALCAO","BENATIA","MESSI","DYBALA",
  "KHEDIRA","VAZQUEZ","GULLIT","SHAQIRI","OSIMHEN","WADDLE","INIESTA","PJANIC",
  "MBAPPE","VERRATTI","RABIOT","DALOT","SOUNESS","SAVIOLA","VOGTS","SHEARER",
  "BARDSLEY","REYNA","WAGNER","ANDERSON","POGBA","HAMSIK","GVARDIOL","PUYOL",
  "LAUREN","CLEMENCE","KEANE","GALLAS","ADRIANO","SALAH","ICARDI","DOWNING",
  "LIZARAZU","KOEMAN","LANZINI","DONOVAN","WRIGHT","RIVALDO","ADEBAYOR","MODRIC",
  "MERTENS","GOMEZ","BRAVO","KENNEDY","NASRI","COUTO","SCHOLES","DENILSON",
  "DAVID","VALDES","MENDIETA","BAROS","GERSON","CASEMIRO","PIQUE","WERNER",
  "REDKNAPP","IRWIN","CRESPO","VALDANO","HENRY","KOUNDE","DEFOE","KALOU",
  "DAVIDS","MUNTARI","CUADRADO","VIEIRA","BARELLA","ALVAREZ","BUFFON","HIGUAIN",
  "WELBECK","VERON","BALLACK","ALABA","HEALY","FIRMINO","BENAYOUN","OLISE",
  "VLASIC","ABIDAL","THURAM","BELLERIN","MILIK","RAKITIC","SOMMER","SAGNA",
  "MATIC","GULER","MALOUDA","COMAN","HONDA","LLORENTE","BARZAGLI","DEMPSEY",
  "BONUCCI","PAPIN","LARSSON","XHAKA","HAVERTZ","GIROUD","GORETZKA","MOTTA",
];

// Answer lookup for a specific day index. Pulled out of getWordleAnswer()
// so anywhere that needs the puzzle for a non-today date (e.g.
// PuzzleReviewScreen reviewing an arbitrary date) shares one source of
// truth. Days covered by WORDLE_ANSWER_LOG (Footle #1..#400) read the
// frozen log; only days beyond the horizon fall back to the stride formula
// — extend the log before #400 arrives (~2027-06-07). The plain
// `dayIndex % len` formula MUST NOT be used — it computes a different
// answer than the active game uses for the same day.
// Answers are 5-8 letters (Alex, 2026-07-29: a 4-wide grid "looks uglier, the
// grid looks so odd"). The log's unpublished tail was curated to match; the
// fallback has to filter too, or the rule silently lapses the day the log runs
// out. WORDLE_PLAYERS itself keeps its 4-letter names — they are still valid
// guesses, and 15 of them are already-published answers the archive serves.
//
// MANAGERS (Alex, 2026-07-29): the hero used to read "Surname of a footballer
// or manager", which wrapped onto a second line and made the card taller. The
// word went, so the rule has to go with it — a promise the puzzle keeps.
//
// This is a short list on purpose. Most managers in WORDLE_PLAYERS are there as
// PLAYERS and stay: Klopp, Zidane, Conte, Tuchel, Potter, Ferguson, Shankly,
// Busby, Dalglish, Souness, Koeman, Gullit and the rest all had real careers.
// Only these seven are in the bank purely for the dugout — none of them has a
// professional playing career worth the name.
//
// They remain valid GUESSES. Typing MOURINHO should never be rejected as "not a
// name"; it just can't be the thing you're hunting for. Being generous about
// input while strict about answers costs nothing and avoids a baffling refusal.
// KNOWN MAINLY AS MANAGERS (Alex, 2026-10-17, on Footle #167 = FERGUSON: "he's
// known as a manager more than a footballer, so it's a bit confusing"). The
// July line was "had a real playing career"; the line now is "is known first
// as a player". These eight played, but the board says "Surname of a
// footballer" and the reveal names the manager. They stay valid GUESSES.
// Already-served days keep their answer (FERGUSON #167 was live when he said
// it); #280 MOYES became ERIKSEN the same day.
export const WORDLE_MANAGERS = ['MOURINHO', 'WENGER', 'SARRI', 'RANGNICK', 'BIELSA', 'BRADLEY', 'BENITEZ',
  'FERGUSON', 'MOYES', 'HOWE', 'WARNOCK', 'POTTER', 'SHANKLY', 'BUSBY', 'TUCHEL'];

// ⚠️ BIELSA is Footle #11 — already published, and api/footle.js serves that
// archive. WORDLE_ANSWER_LOG is consulted before this pool, so the frozen day
// keeps its answer; this list only governs days the log doesn't cover, plus the
// tail of the log, which was re-keyed off these seven in the same change.
// ⚠️ NOT THE SURNAME (Alex, 2026-09-29, on Footle #149 = VANGAAL: "there is
// actually a space between van and gaal"). The grid is one unbroken word, so
// a two-word surname has to be glued (VANGAAL, VANDIJK, DEROSSI) and nothing
// on the board says so — the player is hunting for a surname that, as written,
// does not exist. The other half of the same defect is a PART of a surname
// (PERSIE for van Persie, MARIA for Di María, BISSAKA for Wan-Bissaka).
// Rule: an answer is the player's whole surname, one word as written
// (accents and apostrophes dropped: MULLER, ETOO). Brand names that ARE the
// name players use (PELE, KAKA, GAZZA) are unaffected.
// These stay valid GUESSES. Days already served (#12 BISSAKA, #15 DEROSSI,
// #149 VANGAAL) keep their answers — they are public record; the six later
// log slots were re-keyed in the same change (see wordle-schedule.test.js).
// 2026-10-05: SHEVA and CARRA joined. They are terrace shortenings of a
// surname (Shevchenko, Carragher), not a name either man was ever listed
// under, so a player hunting a five-letter surname cannot reach them by
// knowing football. Their two unplayed days (#212, #218) were re-keyed (and
// again the same day, when every repeat in the unplayed log was replaced).
// GAZZA stays: it is the name itself, like PELE and KAKA.
export const WORDLE_NOT_ANSWERS = ['VANGAAL', 'VANDIJK', 'DEROSSI', 'PERSIE', 'MARIA', 'BISSAKA', 'SHEVA', 'CARRA'];

export const WORDLE_ANSWER_POOL = WORDLE_PLAYERS.filter(
  (w) => w.length >= 5 && w.length <= 8 && !WORDLE_MANAGERS.includes(w) && !WORDLE_NOT_ANSWERS.includes(w)
);

// ── THE FETCH DOOR (17 Oct 2026) ──────────────────────────────────────────────
// Trail, Mystery and Daily 7 could already follow a re-planned future from the
// site (lib/scheduleRemote.js); Footle could not, so the #280 MOYES -> ERIKSEN
// swap (Alex on #167 FERGUSON: answers must be known first as players) reaches
// only builds cut after it. Same door, same checks: the site serves this log at
// /data/footle.json (scripts/gen-schedule-remote.mjs footle), an installed app
// keeps it, and no day the build or the kept copy calls served can move, so
// today's answer never changes under a player. A fetched answer this build's
// word list does not hold falls back to the bundled one for that day, since the
// board could not accept it as a guess.
export const FOOTLE_REMOTE_URL = "https://balliq.app/data/footle.json";
const footleDoor = makeDoor({
  name: "footle", url: FOOTLE_REMOTE_URL,
  bundled: { anchor: WORDLE_ANCHOR_DAY, served: FOOTLE_SERVED, days: WORDLE_ANSWER_LOG },
  entry: /^[A-Z]{3,12}$/,
});
export const FOOTLE_BUILD = footleDoor.BUILD;
export const acceptRemoteFootle = footleDoor.accept;
export const cachedFootleLog = footleDoor.cached;
export const askedSiteForFootle = footleDoor.asked;
/** 'updated' | 'same' | 'fresh' (asked recently) | 'rejected' | 'failed'. Never throws. */
export const refreshFootleLog = footleDoor.refresh;
const PLAYABLE = new Set(WORDLE_PLAYERS);

export function getWordleAnswerForDayIndex(dayIndex, storage) {
  const n = dayIndex - WORDLE_ANCHOR_DAY;
  if (n >= 0) {
    try {
      const live = cachedFootleLog(storage);
      const w = live && live.days[n];
      if (w && PLAYABLE.has(w)) return w;
    } catch { /* the bundled log below */ }
  }
  if (n >= 0 && n < WORDLE_ANSWER_LOG.length) return WORDLE_ANSWER_LOG[n];
  const offset = n * WORDLE_STRIDE;
  const len = WORDLE_ANSWER_POOL.length;
  const idx = ((WORDLE_ANCHOR_IDX + offset) % len + len) % len;
  return WORDLE_ANSWER_POOL[idx];
}

// ── THE ANSWER A PLAYER ALREADY MET (review, 17 Oct 2026) ─────────────────────
// The served-day guard protects days the build or the kept copy calls served,
// not days THIS phone played from its own copy: a day played offline, or
// before the first fetch, could be re-planned on the site and fetched after.
// The day's record ({guesses, status}) held no answer, so a won board was then
// re-graded against the new word (seven columns, no green row, a different
// reveal). So the game stamps the answer it played into the record, and every
// reader prefers that stamp: the answer a player met never changes under them.
export function footleAnswerFor(date = new Date(), fallback, storage) {
  try {
    const st = storage !== undefined ? storage : (typeof localStorage !== "undefined" ? localStorage : null);
    const raw = st ? st.getItem(`biq_wordle_${getWordleDateKey(date)}`) : null;
    const a = raw ? JSON.parse(raw)?.answer : null;
    if (typeof a === "string" && PLAYABLE.has(a)) return a;
  } catch { /* the schedule below */ }
  return fallback !== undefined ? fallback : getWordleAnswer(date, storage);
}

export function getWordleAnswer(date = new Date(), storage) {
  return getWordleAnswerForDayIndex(getWordleDayIndex(date), storage);
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
      if (p?.status !== "won" || p?.arc) break; // arc = archive back-fill, not streak fuel
    } catch { break; }
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ── THE FOOTLE CLUE ──────────────────────────────────────────────────────────
// Footle is the most-played mode and the one most often lost: 230 of 764 plays
// (30%) in the 30 days to 2026-10-04 ended X/6, and 65% of solves (346 of 534) needed a
// fifth or sixth guess (daily_results). Every other daily in the hub gives a
// stuck player somewhere to go — Trail adds clubs, Mystery adds career rows —
// and Footle gave nothing but more letters to guess.
//
// So after three misses the player may take ONE clue, built only from
// WORDLE_FULL_NAMES. That table is already the verified source the reveal line
// prints ("The answer was Ray Wilkins"), so the clue cannot be wrong unless the
// reveal is, and it needs no new data per answer. It never contains the
// surname. A test runs it over every pool and log answer.
export const FOOTLE_CLUE_AFTER = 3;

// footleClue(answer) lives in wordleFullNames.js beside the table it reads.

// The first line of every Footle share. Three builders print it (the game, the
// Home hero, the review screen) and they must agree, so it lives here. A solve
// that used the clue says so with 💡 — the grid is compared between strangers,
// and a clued 3/6 is not the same result as a clean one.
// A hard-mode game (real names only, opt-in) says "Hard": it is the badge.
export function footleShareHead(appName, num, won, guessCount, clue, hard = false) {
  const tag = num > 0 ? ` #${num}` : "";
  return `⚽ ${appName} Footle${tag} ${won ? guessCount : "X"}/6${hard ? ` ${t("share.footleHard")}` : ""}${clue ? " 💡" : ""}`;
}
