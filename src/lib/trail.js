// Transfer Trail — pure game logic (docs/transfer-trail-spec.md).
//
// Daily "put the career in order" puzzle: the day's mystery footballer has
// their clubs revealed but SCRAMBLED; the player arranges them into
// chronological order in ≤5 attempts. This module is the Footle-pattern
// sibling of wordle.js/footleNumber.js: frozen schedule, pure grader,
// localStorage streak walker. No React, no side effects — unit-tested in
// tests/unit/trail-grading.test.js.
//
// DATA: TRAIL_PLAYERS ships EMPTY on purpose. Career rows are forge-generated
// (generate → skeptic re-derivation from an independent source) and then
// 100% human spot-checked before ANY entry lands here — a wrong career order
// is unfalsifiable to the player and poisons the share loop (same trust class
// as a wrong answer key). Editorial rules are LOCKED in the spec: loans
// included + marked, youth excluded, return spells = separate rungs, max 6.
import { dateToYMD } from "./date.js";

export const TRAIL_MAX_ATTEMPTS = 5;

// ── Puzzle number ─────────────────────────────────────────────────────────────
// Same day-index math as footleNumber.js.
//
// ⚠️ PROVISIONAL AGAIN — the mode is DARK. It was briefly pointed at 2026-07-29
// and reverted the same hour: Alex, on seeing the screen, "transfer trail is not
// ready and not intended to look like that". Verified in prod before reverting
// that `scores` held ZERO rows for game_mode='trail', so no puzzle number had
// ever been played or shared and the anchor was still free to move. That is the
// ONLY condition under which it may move — once a single grid is out in the
// world, the number is load-bearing and shifting it renumbers everyone's.
//
// Set this to the real launch day in the SAME commit that declares the screen
// ready. Until then getTrailAnswerForDayIndex returns null for every date
// before it, so Home shows no Trail row and the route sends you home.
export const DAY_MS = 24 * 60 * 60 * 1000;
// ⚠️ LIVE. Was 20697 (2026-09-01) and commented "PROVISIONAL, mode is dark" —
// a placeholder from when the engine shipped inert awaiting a career
// spot-check. That check is now done: all 44 careers verified 2026-08-03,
// which found and fixed one real defect (Courtois listed Chelsea BEFORE the
// Atletico loan, a club he had not played a minute for) and confirmed the two
// recent moves against sources (Kante to Fenerbahce, Feb 2026; Pogba to
// Monaco, Jun 2025).
//
// The placeholder outlived its reason and left a finished daily game dark for
// days while memory recorded it as "LIVE". If you ever set this ahead again,
// verify getTrailAnswer() returns a player on the day you ship.
export const TRAIL_ANCHOR_DAY = 20668; // days since epoch — Trail #1

export function getTrailDayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function getTrailNumber(date = new Date()) {
  return getTrailDayIndex(date) - TRAIL_ANCHOR_DAY + 1;
}

// ── Dataset (filled by the verified forge waves — see header) ─────────────────
// Row shape:
//   { key:"YOUNG_A", display:["Ashley","Young"], nat:"England",
//     clubs:["Watford","Aston Villa","Man Utd","Inter","Aston Villa","Everton"],
//     loans:[false,false,false,false,false,false],   // parallel to clubs
//     years:["2003–07", ...] }                        // assist-only, optional
export const TRAIL_PLAYERS = [
  // Wave 1 — forge-generated (generate → independent web re-derivation vs
  // Wikipedia/Transfermarkt, all verified:true high-confidence) + Alex spot-
  // checked 2026-07-21. `display` corrected from the forge (a schema-wording
  // slip had some agents emit clubs there). 4 others from the batch were
  // rejected: Young(7)/Villa(8)/Pirlo(8) exceed the 6-rung max (not truncated,
  // per the locked rules); Modrić dropped editorially (obscure loan openers).
  { key: "TORRES", display: ["Fernando", "Torres"], nat: "Spain",
    clubs: ["Atletico Madrid", "Liverpool", "Chelsea", "AC Milan", "Atletico Madrid", "Sagan Tosu"],
    loans: [false, false, false, true, false, false] },
  { key: "BALE", display: ["Gareth", "Bale"], nat: "Wales",
    clubs: ["Southampton", "Tottenham", "Real Madrid", "Tottenham", "Real Madrid", "LAFC"],
    loans: [false, false, false, true, false, false] },
  { key: "VAN_PERSIE", display: ["Robin", "van Persie"], nat: "Netherlands",
    clubs: ["Feyenoord", "Arsenal", "Man Utd", "Fenerbahce", "Feyenoord"],
    loans: [false, false, false, false, false] },
  { key: "ALONSO", display: ["Xabi", "Alonso"], nat: "Spain",
    clubs: ["Real Sociedad", "Eibar", "Real Sociedad", "Liverpool", "Real Madrid", "Bayern Munich"],
    loans: [false, true, false, false, false, false] },
  { key: "HENRY", display: ["Thierry", "Henry"], nat: "France",
    clubs: ["Monaco", "Juventus", "Arsenal", "Barcelona", "New York Red Bulls", "Arsenal"],
    loans: [false, false, false, false, false, true] },
  { key: "SNEIJDER", display: ["Wesley", "Sneijder"], nat: "Netherlands",
    clubs: ["Ajax", "Real Madrid", "Inter", "Galatasaray", "Nice", "Al-Gharafa"],
    loans: [false, false, false, false, false, false] },
  { key: "OZIL", display: ["Mesut", "Özil"], nat: "Germany",
    clubs: ["Schalke 04", "Werder Bremen", "Real Madrid", "Arsenal", "Fenerbahce", "Basaksehir"],
    loans: [false, false, false, false, false, false] },
  { key: "OWEN", display: ["Michael", "Owen"], nat: "England",
    clubs: ["Liverpool", "Real Madrid", "Newcastle", "Man Utd", "Stoke City"],
    loans: [false, false, false, false, false] },

  // ── Wave 2, forged 2026-07-29 ────────────────────────────────────
  // ⚠️ NOT yet spot-checked by Alex. Spec §7.3 requires a 100% manual pass
  // before TRAIL_ANSWER_LOG is frozen — a wrong career order is unfalsifiable
  // to the player and poisons the share loop. These are INERT until then:
  // the log is still empty, so no puzzle draws from them.
  { key: "RONALDO_C", display: ["Cristiano","Ronaldo"], nat: "Portugal",
    clubs: ["Sporting CP","Man Utd","Real Madrid","Juventus","Man Utd","Al-Nassr"],
    loans: [false, false, false, false, false, false] },
  { key: "ROONEY", display: ["Wayne","Rooney"], nat: "England",
    clubs: ["Everton","Man Utd","Everton","DC United","Derby County"],
    loans: [false, false, false, false, false] },
  { key: "ROBBEN", display: ["Arjen","Robben"], nat: "Netherlands",
    clubs: ["Groningen","PSV","Chelsea","Real Madrid","Bayern Munich","Groningen"],
    loans: [false, false, false, false, false, false] },
  { key: "SEEDORF", display: ["Clarence","Seedorf"], nat: "Netherlands",
    clubs: ["Ajax","Sampdoria","Real Madrid","Inter","AC Milan","Botafogo"],
    loans: [false, false, false, false, false, false] },
  { key: "VIEIRA", display: ["Patrick","Vieira"], nat: "France",
    clubs: ["Cannes","AC Milan","Arsenal","Juventus","Inter","Man City"],
    loans: [false, false, false, false, false, false] },
  { key: "MAKELELE", display: ["Claude","Makélélé"], nat: "France",
    clubs: ["Nantes","Marseille","Celta Vigo","Real Madrid","Chelsea","PSG"],
    loans: [false, false, false, false, false, false] },
  { key: "BALLACK", display: ["Michael","Ballack"], nat: "Germany",
    clubs: ["Chemnitzer FC","Kaiserslautern","Bayer Leverkusen","Bayern Munich","Chelsea","Bayer Leverkusen"],
    loans: [false, false, false, false, false, false] },
  { key: "MANE", display: ["Sadio","Mané"], nat: "Senegal",
    clubs: ["Metz","Red Bull Salzburg","Southampton","Liverpool","Bayern Munich","Al-Nassr"],
    loans: [false, false, false, false, false, false] },
  { key: "POGBA", display: ["Paul","Pogba"], nat: "France",
    clubs: ["Man Utd","Juventus","Man Utd","Juventus","Monaco"],
    loans: [false, false, false, false, false] },
  { key: "FABREGAS", display: ["Cesc","Fàbregas"], nat: "Spain",
    clubs: ["Arsenal","Barcelona","Chelsea","Monaco","Como"],
    loans: [false, false, false, false, false] },
  { key: "COLE_A", display: ["Ashley","Cole"], nat: "England",
    clubs: ["Arsenal","Crystal Palace","Chelsea","Roma","LA Galaxy","Derby County"],
    loans: [false, true, false, false, false, false] },
  { key: "BUFFON", display: ["Gianluigi","Buffon"], nat: "Italy",
    clubs: ["Parma","Juventus","PSG","Juventus","Parma"],
    loans: [false, false, false, false, false] },
  { key: "RAMOS", display: ["Sergio","Ramos"], nat: "Spain",
    clubs: ["Sevilla","Real Madrid","PSG","Sevilla","Monterrey"],
    loans: [false, false, false, false, false] },
  { key: "CECH", display: ["Petr","Čech"], nat: "Czech Republic",
    clubs: ["Chmel Blsany","Sparta Prague","Rennes","Chelsea","Arsenal"],
    loans: [false, false, false, false, false] },
  { key: "DUFF", display: ["Damien","Duff"], nat: "Ireland",
    clubs: ["Blackburn","Chelsea","Newcastle","Fulham","Melbourne City","Shamrock Rovers"],
    loans: [false, false, false, false, false, false] },
  { key: "GOTZE", display: ["Mario","Götze"], nat: "Germany",
    clubs: ["Dortmund","Bayern Munich","Dortmund","PSV","Eintracht Frankfurt"],
    loans: [false, false, false, false, false] },
  { key: "KOMPANY", display: ["Vincent","Kompany"], nat: "Belgium",
    clubs: ["Anderlecht","Hamburg","Man City","Anderlecht"],
    loans: [false, false, false, false] },
  { key: "FIGO", display: ["Luis","Figo"], nat: "Portugal",
    clubs: ["Sporting CP","Barcelona","Real Madrid","Inter"],
    loans: [false, false, false, false] },
  { key: "KROOS", display: ["Toni","Kroos"], nat: "Germany",
    clubs: ["Bayern Munich","Bayer Leverkusen","Real Madrid"],
    loans: [false, true, false] },
  { key: "NEYMAR", display: ["Neymar","Júnior"], nat: "Brazil",
    clubs: ["Santos","Barcelona","PSG","Al-Hilal","Santos"],
    loans: [false, false, false, false, false] },
  { key: "AGUERO", display: ["Sergio","Agüero"], nat: "Argentina",
    clubs: ["Independiente","Atletico Madrid","Man City","Barcelona"],
    loans: [false, false, false, false] },
  { key: "ISCO", display: ["Isco","Alarcón"], nat: "Spain",
    clubs: ["Valencia","Malaga","Real Madrid","Sevilla","Real Betis"],
    loans: [false, false, false, false, false] },
  { key: "VERTONGHEN", display: ["Jan","Vertonghen"], nat: "Belgium",
    clubs: ["Ajax","RKC Waalwijk","Tottenham","Benfica","Anderlecht"],
    loans: [false, true, false, false, false] },
  { key: "KANTE", display: ["N'Golo","Kanté"], nat: "France",
    clubs: ["Boulogne","Caen","Leicester","Chelsea","Al-Ittihad","Fenerbahce"],
    loans: [false, false, false, false, false, false] },
  { key: "ALDERWEIRELD", display: ["Toby","Alderweireld"], nat: "Belgium",
    clubs: ["Ajax","Atletico Madrid","Southampton","Tottenham","Al-Duhail","Antwerp"],
    loans: [false, false, true, false, false, false] },
  { key: "JOAQUIN", display: ["Joaquín","Sánchez"], nat: "Spain",
    clubs: ["Real Betis","Valencia","Malaga","Fiorentina","Real Betis"],
    loans: [false, false, false, false, false] },
  { key: "KLOSE", display: ["Miroslav","Klose"], nat: "Germany",
    clubs: ["Homburg","Kaiserslautern","Werder Bremen","Bayern Munich","Lazio"],
    loans: [false, false, false, false, false] },
  { key: "MATUIDI", display: ["Blaise","Matuidi"], nat: "France",
    clubs: ["Troyes","Saint-Etienne","PSG","Juventus","Inter Miami"],
    loans: [false, false, false, false, false] },
  { key: "FLAMINI", display: ["Mathieu","Flamini"], nat: "France",
    clubs: ["Marseille","Arsenal","AC Milan","Arsenal","Crystal Palace","Getafe"],
    loans: [false, false, false, false, false, false] },
  { key: "GILBERTO_SILVA", display: ["Gilberto","Silva"], nat: "Brazil",
    clubs: ["America Mineiro","Atletico Mineiro","Arsenal","Panathinaikos","Gremio","Atletico Mineiro"],
    loans: [false, false, false, false, false, false] },

  // ── Wave M, forged 2026-07-30 ────────────────────────────────────
  // ⚠️ INERT. Added to the roster but NOT written into TRAIL_ANSWER_LOG, so no
  // puzzle draws from them. Per the spec header, a career row needs a 100%
  // human spot-check before it can be scheduled — a wrong order is
  // unfalsifiable to the player. Alex: check these seven, then I extend the log.
  //
  // WHY MORE CAREERS AT ALL, given the log already covers 380 days: 38 players
  // over 380 days means every answer recurs roughly ONCE A MONTH. For a daily
  // game that is very noticeable. Recurrence, not runway, is the problem.
  //
  // Each row was web-verified before landing. FIVE candidates were generated
  // and then REJECTED rather than shipped on a maybe:
  //   Hummels, Di María — recent moves I could not confirm (Roma / a Rosario
  //     Central return would change the final rung).
  //   Mahrez — Al-Ahli terminated his contract, so the last rung is unstable.
  //   Ibrahimović, Drogba — genuine careers, but 9-10 senior clubs. The 6-rung
  //     max is a locked editorial rule and truncating a career is not allowed.
  { key: "VAN_DIJK", display: ["Virgil","van Dijk"], nat: "Netherlands",
    clubs: ["Groningen","Celtic","Southampton","Liverpool"],
    loans: [false, false, false, false] },
  { key: "COURTOIS", display: ["Thibaut","Courtois"], nat: "Belgium",
    // ⚠️ CORRECTED 2026-08-03. This used to open Genk -> Chelsea -> Atletico,
    // on the reasoning that he signed for Chelsea in 2011 and was loaned out
    // immediately, so "the return spell is its own rung". That gets the game
    // backwards: he never played a single senior match for Chelsea before
    // 2014, so the first Chelsea rung showed a club he had never turned out
    // for. In a puzzle where the clubs ARE the clue, that is a false clue.
    //
    // The rungs are now the clubs he actually played for, in order. Note this
    // also settles the rule ambiguity that De Bruyne exposed: coming back from
    // a loan is NOT a "return" under the returns-are-rungs rule, because the
    // parent contract never ended. Both players had one continuous Chelsea
    // deal with a loan inside it; both now list Chelsea once. De Bruyne
    // needed no change, and does not need a 7th rung.
    clubs: ["Genk","Atletico Madrid","Chelsea","Real Madrid"],
    loans: [false, true, false, false] },
  { key: "GRIEZMANN", display: ["Antoine","Griezmann"], nat: "France",
    clubs: ["Real Sociedad","Atletico Madrid","Barcelona","Atletico Madrid"],
    loans: [false, false, false, false] },
  { key: "DE_BRUYNE", display: ["Kevin","De Bruyne"], nat: "Belgium",
    clubs: ["Genk","Chelsea","Werder Bremen","Wolfsburg","Man City","Napoli"],
    loans: [false, false, true, false, false, false] },
  { key: "SON", display: ["Heung-min","Son"], nat: "South Korea",
    clubs: ["Hamburg","Bayer Leverkusen","Tottenham","LAFC"],
    loans: [false, false, false, false] },
  // MARCELO was forged and then REJECTED here: a mononym cannot satisfy the
  // 2-part `display` contract, and his legal surname (Vieira) already belongs
  // to Patrick Vieira in this roster — two puzzles would share an answer.
  { key: "LEWANDOWSKI", display: ["Robert","Lewandowski"], nat: "Poland",
    // Znicz Pruszkow opens the real career but is third-tier Polish football —
    // dropped for the same editorial reason Modric's loan openers were.
    clubs: ["Lech Poznan","Dortmund","Bayern Munich","Barcelona"],
    loans: [false, false, false, false] },
];

// Frozen answer log: TRAIL_ANSWER_LOG[n] is the player `key` for day index
// TRAIL_ANCHOR_DAY + n. Generated once at ship time (clone of
// WORDLE_ANSWER_LOG) so the schedule never reshuffles under players.
export const TRAIL_ANSWER_LOG = [
  // REGENERATED 2026-07-30 for wave M (38 -> 44 careers). Deterministic and
  // reproducible: an integer LCG seeded 20260730, nine shuffled passes over the
  // full roster, then a greedy repair pass at the cycle boundaries.
  //
  // Guarantees, all asserted by tests/unit/trail-schedule.test.js:
  //   - every career used exactly 9 times across 396 days (~13 months)
  //   - no career reappears inside 14 days. THE OLD LOG'S MINIMUM GAP WAS 1 —
  //     the same answer could land two days running, which reads as a bug.
  //   - the opening week is pinned (Torres is puzzle #1, an editorial choice)
  //
  // ⚠️ Regenerating was permitted ONLY because the mode is DARK and prod holds
  // ZERO rows for game_mode='trail'. Once one grid is shared this log is
  // load-bearing and may be APPENDED to, never rewritten.
  //
  // No Math.sin and no Math.random in the generator: sin diverges between
  // JavaScriptCore and V8 (137/3000 values), which once gave iOS and Android
  // users different daily questions; random would not be reproducible.
"TORRES", "GILBERTO_SILVA", "RONALDO_C", "RAMOS", "MATUIDI", "ROONEY", 
  "CECH", "HENRY", "SNEIJDER", "FLAMINI", "KROOS", "VAN_PERSIE", 
  "ALONSO", "LEWANDOWSKI", "COURTOIS", "BUFFON", "KLOSE", "AGUERO", 
  "FIGO", "ROBBEN", "ALDERWEIRELD", "NEYMAR", "BALLACK", "KANTE", 
  "VAN_DIJK", "VERTONGHEN", "COLE_A", "ISCO", "BALE", "OZIL", 
  "GOTZE", "MAKELELE", "OWEN", "DUFF", "SON", "FABREGAS", 
  "POGBA", "GRIEZMANN", "KOMPANY", "VIEIRA", "DE_BRUYNE", "SEEDORF", 
  "JOAQUIN", "MANE", "SNEIJDER", "CECH", "OZIL", "COLE_A", 
  "OWEN", "ROBBEN", "RONALDO_C", "DUFF", "MATUIDI", "LEWANDOWSKI", 
  "NEYMAR", "VERTONGHEN", "JOAQUIN", "MANE", "KROOS", "FABREGAS", 
  "GILBERTO_SILVA", "FIGO", "GRIEZMANN", "BALLACK", "VAN_DIJK", "SON", 
  "ISCO", "BUFFON", "COURTOIS", "TORRES", "AGUERO", "KLOSE", 
  "HENRY", "ROONEY", "RAMOS", "ALDERWEIRELD", "FLAMINI", "DE_BRUYNE", 
  "POGBA", "KANTE", "KOMPANY", "GOTZE", "VIEIRA", "VAN_PERSIE", 
  "ALONSO", "BALE", "SEEDORF", "MAKELELE", "FIGO", "SON", 
  "TORRES", "DE_BRUYNE", "RAMOS", "KLOSE", "ALDERWEIRELD", "BALLACK", 
  "ISCO", "OWEN", "MATUIDI", "ROBBEN", "SEEDORF", "VIEIRA", 
  "HENRY", "VERTONGHEN", "KROOS", "COLE_A", "FLAMINI", "KANTE", 
  "POGBA", "OZIL", "NEYMAR", "BUFFON", "AGUERO", "LEWANDOWSKI", 
  "JOAQUIN", "FABREGAS", "GRIEZMANN", "SNEIJDER", "MAKELELE", "GILBERTO_SILVA", 
  "CECH", "GOTZE", "VAN_PERSIE", "ROONEY", "MANE", "BALE", 
  "ALONSO", "COURTOIS", "VAN_DIJK", "KOMPANY", "RONALDO_C", "DUFF", 
  "SEEDORF", "RAMOS", "VERTONGHEN", "DE_BRUYNE", "FIGO", "FLAMINI", 
  "MANE", "KROOS", "ALONSO", "COURTOIS", "VAN_DIJK", "KOMPANY", 
  "JOAQUIN", "NEYMAR", "VAN_PERSIE", "BALLACK", "ALDERWEIRELD", "ROBBEN", 
  "ISCO", "FABREGAS", "HENRY", "MAKELELE", "MATUIDI", "TORRES", 
  "BUFFON", "KLOSE", "POGBA", "DUFF", "KANTE", "ROONEY", 
  "BALE", "SNEIJDER", "RONALDO_C", "GOTZE", "OZIL", "AGUERO", 
  "CECH", "SON", "VIEIRA", "COLE_A", "GRIEZMANN", "GILBERTO_SILVA", 
  "OWEN", "LEWANDOWSKI", "KOMPANY", "BUFFON", "SNEIJDER", "MANE", 
  "KROOS", "AGUERO", "COURTOIS", "POGBA", "VAN_PERSIE", "COLE_A", 
  "SON", "GILBERTO_SILVA", "ALDERWEIRELD", "JOAQUIN", "CECH", "RAMOS", 
  "RONALDO_C", "DE_BRUYNE", "SEEDORF", "NEYMAR", "HENRY", "FABREGAS", 
  "FIGO", "OZIL", "TORRES", "GOTZE", "KANTE", "BALLACK", 
  "ROONEY", "ISCO", "DUFF", "ROBBEN", "FLAMINI", "VERTONGHEN", 
  "VAN_DIJK", "VIEIRA", "OWEN", "GRIEZMANN", "BALE", "MAKELELE", 
  "MATUIDI", "LEWANDOWSKI", "KLOSE", "ALONSO", "COLE_A", "KROOS", 
  "COURTOIS", "DUFF", "VAN_DIJK", "SNEIJDER", "DE_BRUYNE", "KANTE", 
  "BALE", "OWEN", "VIEIRA", "LEWANDOWSKI", "ISCO", "ALDERWEIRELD", 
  "ROONEY", "FIGO", "AGUERO", "KOMPANY", "SEEDORF", "FLAMINI", 
  "OZIL", "GRIEZMANN", "ALONSO", "POGBA", "TORRES", "MAKELELE", 
  "BALLACK", "SON", "VAN_PERSIE", "BUFFON", "CECH", "ROBBEN", 
  "MATUIDI", "GILBERTO_SILVA", "RAMOS", "HENRY", "RONALDO_C", "MANE", 
  "NEYMAR", "JOAQUIN", "VERTONGHEN", "GOTZE", "KLOSE", "FABREGAS", 
  "BALE", "DUFF", "ISCO", "OZIL", "ALDERWEIRELD", "KANTE", 
  "RAMOS", "FLAMINI", "GILBERTO_SILVA", "SNEIJDER", "VERTONGHEN", "GOTZE", 
  "SON", "FABREGAS", "KROOS", "SEEDORF", "BALLACK", "MANE", 
  "KOMPANY", "ALONSO", "JOAQUIN", "NEYMAR", "ROONEY", "ROBBEN", 
  "VAN_DIJK", "MAKELELE", "COLE_A", "HENRY", "VIEIRA", "KLOSE", 
  "BUFFON", "VAN_PERSIE", "DE_BRUYNE", "COURTOIS", "LEWANDOWSKI", "GRIEZMANN", 
  "OWEN", "CECH", "TORRES", "RONALDO_C", "POGBA", "FIGO", 
  "AGUERO", "MATUIDI", "ALDERWEIRELD", "ROONEY", "DE_BRUYNE", "SNEIJDER", 
  "VIEIRA", "SON", "KROOS", "CECH", "BALLACK", "MANE", 
  "POGBA", "GOTZE", "KLOSE", "COURTOIS", "AGUERO", "BALE", 
  "VERTONGHEN", "KOMPANY", "NEYMAR", "KANTE", "GRIEZMANN", "SEEDORF", 
  "FABREGAS", "RONALDO_C", "VAN_DIJK", "HENRY", "ISCO", "OZIL", 
  "ROBBEN", "VAN_PERSIE", "FLAMINI", "LEWANDOWSKI", "RAMOS", "BUFFON", 
  "JOAQUIN", "MAKELELE", "DUFF", "FIGO", "TORRES", "MATUIDI", 
  "GILBERTO_SILVA", "OWEN", "ALONSO", "COLE_A", "ROONEY", "ISCO", 
  "CECH", "SEEDORF", "JOAQUIN", "GOTZE", "MAKELELE", "MANE", 
  "KROOS", "DE_BRUYNE", "ALDERWEIRELD", "VERTONGHEN", "FLAMINI", "TORRES", 
  "SNEIJDER", "GRIEZMANN", "HENRY", "MATUIDI", "BALLACK", "DUFF", 
  "COLE_A", "KANTE", "VIEIRA", "BUFFON", "VAN_DIJK", "OZIL", 
  "KLOSE", "FIGO", "LEWANDOWSKI", "ALONSO", "POGBA", "VAN_PERSIE", 
  "AGUERO", "SON", "GILBERTO_SILVA", "NEYMAR", "OWEN", "ROBBEN", 
  "COURTOIS", "RONALDO_C", "KOMPANY", "FABREGAS", "BALE", "RAMOS"
];

export function getTrailPlayerByKey(key, players = TRAIL_PLAYERS) {
  return players.find((p) => p && p.key === key) || null;
}

export function getTrailAnswerForDayIndex(dayIndex, log = TRAIL_ANSWER_LOG, players = TRAIL_PLAYERS) {
  const n = dayIndex - TRAIL_ANCHOR_DAY;
  if (n < 0 || !log.length) return null;
  const key = log[n % log.length]; // wrap after the log runs out rather than going dark
  return getTrailPlayerByKey(key, players);
}

export function getTrailAnswer(date = new Date(), log = TRAIL_ANSWER_LOG, players = TRAIL_PLAYERS) {
  return getTrailAnswerForDayIndex(getTrailDayIndex(date), log, players);
}

// ── Answer matching (spec v2) ────────────────────────────────────────────────
//
// The guess is a surname typed by hand, so matching has to survive accents,
// case, punctuation and spacing. NFD + combining-mark strip turns Čech into
// cech, Özil into ozil, Agüero into aguero — one rule instead of a lookup.
//
// Accepted forms are DERIVED from `display` (surname, and the full name), so
// only genuine exceptions are listed below. Two of them are not stylistic —
// they are unwinnable without an alias: Neymar's surname in the data is
// "Júnior" and Isco's is "Alarcón". Nobody on earth types those.
export const TRAIL_ALIASES = {
  NEYMAR:         ["Neymar"],
  ISCO:           ["Isco"],
  JOAQUIN:        ["Joaquin"],
  VAN_PERSIE:     ["Persie"],
  RONALDO_C:      ["Cristiano", "CR7"],
  GILBERTO_SILVA: ["Gilberto", "Gilberto Silva"],
  GOTZE:          ["Goetze"],   // common German transliteration of ö
  OZIL:           ["Oezil"],
};

// Revealed as a hint after the third miss. Nationality already lives on the
// career row; position did not, and a nationality on its own is a weak rescue
// ("France" covers half the roster).
export const TRAIL_POSITIONS = {
  TORRES: "Forward", BALE: "Winger", VAN_PERSIE: "Forward", ALONSO: "Midfielder",
  HENRY: "Forward", SNEIJDER: "Midfielder", OZIL: "Midfielder", OWEN: "Forward",
  RONALDO_C: "Forward", ROONEY: "Forward", ROBBEN: "Winger", SEEDORF: "Midfielder",
  VIEIRA: "Midfielder", MAKELELE: "Midfielder", BALLACK: "Midfielder", MANE: "Forward",
  POGBA: "Midfielder", FABREGAS: "Midfielder", COLE_A: "Defender", BUFFON: "Goalkeeper",
  RAMOS: "Defender", CECH: "Goalkeeper", DUFF: "Winger", GOTZE: "Midfielder",
  KOMPANY: "Defender", FIGO: "Winger", KROOS: "Midfielder", NEYMAR: "Forward",
  AGUERO: "Forward", ISCO: "Midfielder", VERTONGHEN: "Defender", KANTE: "Midfielder",
  ALDERWEIRELD: "Defender", JOAQUIN: "Winger", KLOSE: "Forward", MATUIDI: "Midfielder",
  FLAMINI: "Midfielder", GILBERTO_SILVA: "Midfielder",
  // Wave M
  VAN_DIJK: "Defender", COURTOIS: "Goalkeeper", GRIEZMANN: "Forward",
  DE_BRUYNE: "Midfielder", SON: "Forward", LEWANDOWSKI: "Forward",
};

// Letters that are NOT decorated versions of an ascii letter — they are their
// own characters, so NFD does not decompose them and a naive mark-strip DELETES
// them. Measured before this existed: Ødegaard folded to "degaard", Højbjerg to
// "hjbjerg", Błaszczykowski to "baszczykowski", Đorđević to "orevic", Weiß to
// "wei". Every one of those is unwinnable — the player types the obvious plain
// spelling and it cannot match.
//
// Alex, 2026-07-29: "people write names differently you know, some swedish
// names, norwegian names, south american, they all have unique letters and dots
// everywhere so we should be graceful here." Correct, and this is the half that
// gracefulness does not come free.
//
// Note what is NOT here: é č ö ü å ñ ş all DO decompose, so the mark-strip below
// already handles them. Only the non-decomposing ones need spelling out.
const LETTER_FOLD = {
  ø: "o", æ: "ae", œ: "oe", ß: "ss", ł: "l", đ: "d", ð: "d", þ: "th",
  ı: "i", ŧ: "t", ħ: "h", ŋ: "n", ĸ: "k",
};

/** Fold a typed guess to its comparable form: accent-free, lowercase, a-z only. */
export function normaliseGuess(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[øæœßłđðþıŧħŋĸ]/g, (c) => LETTER_FOLD[c] || c)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

// German and Nordic spelling admits TWO correct plain-ascii forms: Müller is
// written "Muller" or "Mueller", Ødegaard as "Odegaard" or "Oedegaard", and
// both are things a real person types. One fold cannot satisfy both, so a name
// folds to a SET and a guess matches if the sets overlap.
const DIGRAPH_FOLD = { "ü": "ue", "ö": "oe", "ä": "ae", "ø": "oe", "å": "aa" };

/** Every plain-ascii spelling this string could reasonably be typed as. */
export function normaliseVariants(s) {
  const raw = String(s || "").toLowerCase();
  const digraph = raw.replace(/[üöäøå]/g, (c) => DIGRAPH_FOLD[c] || c);
  return [...new Set([normaliseGuess(raw), normaliseGuess(digraph)].filter(Boolean))];
}

/** Every string that counts as naming this player. */
export function acceptedNamesFor(player) {
  if (!player) return [];
  const [first, last] = player.display || [];
  const out = [];
  if (last) out.push(last);
  if (first && last) out.push(`${first} ${last}`);
  if (first && !last) out.push(first);
  for (const alias of TRAIL_ALIASES[player.key] || []) out.push(alias);
  return out;
}

export function guessMatchesPlayer(guess, player) {
  const guessForms = normaliseVariants(guess);
  if (!guessForms.length) return false;
  return acceptedNamesFor(player).some((name) =>
    normaliseVariants(name).some((n) => guessForms.includes(n))
  );
}

/**
 * How many clubs are on the ladder after `misses` wrong guesses or skips.
 * Opens at TRAIL_OPENING_CLUBS and grows by one each time, capped at the
 * career length — a 6-rung career runs out of clubs exactly as the player runs
 * out of attempts, so there is no tuning constant to drift.
 */
export const TRAIL_OPENING_CLUBS = 2;
export function cluesShown(misses, careerLength) {
  return Math.min(TRAIL_OPENING_CLUBS + Math.max(0, misses), careerLength);
}

/** The hint unlocks once three guesses are gone. */
export function hintFor(player, misses) {
  if (!player || misses < 3) return null;
  const pos = TRAIL_POSITIONS[player.key];
  return [player.nat, pos].filter(Boolean).join(" · ") || null;
}

// ── Streak ────────────────────────────────────────────────────────────────────
// Clone of computeFootleStreak: walk backwards over biq_trail_<ymd> localStorage
// entries while they exist and are wins. Storage writes live in the screen.
export function computeTrailStreak(today) {
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let i = 0; i < 366; i++) {
    try {
      const raw = localStorage.getItem(`biq_trail_${dateToYMD(cursor)}`);
      if (!raw) break;
      const p = JSON.parse(raw);
      if (p?.status !== "won") break;
    } catch { break; }
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ── Share text (spec v2) ─────────────────────────────────────────────────────
// Spoiler-free by construction: it names neither the player nor a single club,
// only how many rungs it took. That is a stronger guarantee than v1's grid,
// which leaked the SHAPE of the career (how many clubs, how scrambled).
export function buildTrailShareText({ number, won, clubsUsed, streak } = {}) {
  const head = `⚽ Ball IQ · Transfer Trail${number > 0 ? ` #${number}` : ""}`;
  const line = won
    ? `Got it on ${clubsUsed} club${clubsUsed === 1 ? "" : "s"} ${"⚽".repeat(Math.min(clubsUsed, 6))}`
    : `Didn't get it — X/${TRAIL_MAX_ATTEMPTS}`;
  const streakLine = won && streak > 0 ? `\n🔥 ${streak}-day streak` : "";
  return `${head}\n${line}${streakLine}\n\nballiq.app/trail`;
}

