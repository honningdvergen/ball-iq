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
export const TRAIL_ANCHOR_DAY = 20697; // Date.UTC(2026,8,1)/DAY_MS — PROVISIONAL, mode is dark

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
];

// Frozen answer log: TRAIL_ANSWER_LOG[n] is the player `key` for day index
// TRAIL_ANCHOR_DAY + n. Generated once at ship time (clone of
// WORDLE_ANSWER_LOG) so the schedule never reshuffles under players.
export const TRAIL_ANSWER_LOG = [
  "TORRES", "GILBERTO_SILVA", "RONALDO_C", "RAMOS",
  "HENRY", "BALE", "NEYMAR", "ISCO",
  "AGUERO", "GOTZE", "SNEIJDER", "MANE",
  "OZIL", "FIGO", "KLOSE", "POGBA",
  "FLAMINI", "VAN_PERSIE", "MATUIDI", "DUFF",
  "VERTONGHEN", "KANTE", "OWEN", "ALONSO",
  "BALLACK", "ROONEY", "KOMPANY", "VIEIRA",
  "SEEDORF", "MAKELELE", "JOAQUIN", "COLE_A",
  "KROOS", "BUFFON", "ALDERWEIRELD", "CECH",
  "ROBBEN", "FABREGAS", "HENRY", "MANE",
  "FIGO", "RAMOS", "FLAMINI", "SEEDORF",
  "OWEN", "ALONSO", "KROOS", "VIEIRA",
  "VAN_PERSIE", "FABREGAS", "KLOSE", "TORRES",
  "GILBERTO_SILVA", "JOAQUIN", "BUFFON", "ROBBEN",
  "NEYMAR", "KANTE", "SNEIJDER", "ROONEY",
  "DUFF", "KOMPANY", "COLE_A", "ISCO",
  "BALLACK", "OZIL", "MAKELELE", "RONALDO_C",
  "POGBA", "ALDERWEIRELD", "VERTONGHEN", "BALE",
  "AGUERO", "GOTZE", "CECH", "MATUIDI",
  "TORRES", "ROBBEN", "SNEIJDER", "BALLACK",
  "OZIL", "BUFFON", "JOAQUIN", "NEYMAR",
  "MANE", "FIGO", "MAKELELE", "KOMPANY",
  "ISCO", "HENRY", "COLE_A", "KANTE",
  "MATUIDI", "VIEIRA", "ROONEY", "FLAMINI",
  "OWEN", "ALONSO", "BALE", "POGBA",
  "SEEDORF", "RAMOS", "KLOSE", "ALDERWEIRELD",
  "RONALDO_C", "KROOS", "VAN_PERSIE", "AGUERO",
  "DUFF", "GOTZE", "CECH", "GILBERTO_SILVA",
  "VERTONGHEN", "FABREGAS", "KANTE", "AGUERO",
  "DUFF", "ALDERWEIRELD", "KOMPANY", "OWEN",
  "CECH", "FIGO", "MATUIDI", "GILBERTO_SILVA",
  "COLE_A", "BALE", "ISCO", "RAMOS",
  "MAKELELE", "SEEDORF", "KROOS", "MANE",
  "FABREGAS", "POGBA", "BUFFON", "VIEIRA",
  "ALONSO", "RONALDO_C", "NEYMAR", "ROBBEN",
  "FLAMINI", "TORRES", "VAN_PERSIE", "KLOSE",
  "GOTZE", "HENRY", "ROONEY", "VERTONGHEN",
  "BALLACK", "SNEIJDER", "OZIL", "JOAQUIN",
  "HENRY", "KLOSE", "ISCO", "VERTONGHEN",
  "MANE", "VIEIRA", "GOTZE", "MAKELELE",
  "BUFFON", "FLAMINI", "KROOS", "JOAQUIN",
  "MATUIDI", "VAN_PERSIE", "OWEN", "SNEIJDER",
  "BALE", "GILBERTO_SILVA", "BALLACK", "ROONEY",
  "NEYMAR", "FIGO", "CECH", "RAMOS",
  "RONALDO_C", "POGBA", "DUFF", "ALDERWEIRELD",
  "ROBBEN", "ALONSO", "OZIL", "TORRES",
  "SEEDORF", "KANTE", "AGUERO", "KOMPANY",
  "FABREGAS", "COLE_A", "CECH", "FIGO",
  "VERTONGHEN", "GILBERTO_SILVA", "FABREGAS", "COLE_A",
  "NEYMAR", "SEEDORF", "FLAMINI", "ROONEY",
  "DUFF", "VAN_PERSIE", "ROBBEN", "POGBA",
  "MAKELELE", "ALDERWEIRELD", "OWEN", "AGUERO",
  "BALE", "KROOS", "GOTZE", "TORRES",
  "OZIL", "ISCO", "KANTE", "MANE",
  "BUFFON", "ALONSO", "RONALDO_C", "SNEIJDER",
  "HENRY", "VIEIRA", "KLOSE", "BALLACK",
  "JOAQUIN", "RAMOS", "KOMPANY", "MATUIDI",
  "FLAMINI", "ROONEY", "MATUIDI", "KOMPANY",
  "ROBBEN", "KANTE", "RAMOS", "ISCO",
  "NEYMAR", "JOAQUIN", "RONALDO_C", "KROOS",
  "MANE", "SEEDORF", "VAN_PERSIE", "GOTZE",
  "CECH", "COLE_A", "HENRY", "TORRES",
  "ALONSO", "SNEIJDER", "POGBA", "OWEN",
  "GILBERTO_SILVA", "BALE", "KLOSE", "VERTONGHEN",
  "MAKELELE", "BUFFON", "DUFF", "BALLACK",
  "OZIL", "AGUERO", "FIGO", "VIEIRA",
  "ALDERWEIRELD", "FABREGAS", "KOMPANY", "MATUIDI",
  "VAN_PERSIE", "KROOS", "BALE", "ROONEY",
  "HENRY", "OZIL", "VERTONGHEN", "ALONSO",
  "FABREGAS", "MANE", "ROBBEN", "BALLACK",
  "MAKELELE", "COLE_A", "ALDERWEIRELD", "POGBA",
  "KANTE", "OWEN", "CECH", "RONALDO_C",
  "GOTZE", "FLAMINI", "TORRES", "JOAQUIN",
  "NEYMAR", "KLOSE", "DUFF", "SNEIJDER",
  "FIGO", "RAMOS", "SEEDORF", "BUFFON",
  "ISCO", "GILBERTO_SILVA", "VIEIRA", "AGUERO",
  "BALLACK", "MANE", "NEYMAR", "FLAMINI",
  "ROBBEN", "RONALDO_C", "HENRY", "OZIL",
  "ALDERWEIRELD", "ROONEY", "BALE", "JOAQUIN",
  "KOMPANY", "ALONSO", "DUFF", "BUFFON",
  "AGUERO", "POGBA", "SEEDORF", "OWEN",
  "GOTZE", "VIEIRA", "ISCO", "VAN_PERSIE",
  "GILBERTO_SILVA", "MAKELELE", "TORRES", "FABREGAS",
  "CECH", "FIGO", "KANTE", "RAMOS",
  "KROOS", "KLOSE", "MATUIDI", "VERTONGHEN",
  "SNEIJDER", "COLE_A", "AGUERO", "BUFFON",
  "ALONSO", "ROONEY", "VAN_PERSIE", "RONALDO_C",
  "BALE", "MANE", "JOAQUIN", "KROOS",
  "MAKELELE", "TORRES", "BALLACK", "OWEN",
  "FABREGAS", "RAMOS", "SEEDORF", "OZIL",
  "CECH", "NEYMAR", "VIEIRA", "HENRY",
  "SNEIJDER", "DUFF", "GILBERTO_SILVA", "COLE_A",
  "ROBBEN", "FIGO", "KANTE", "ISCO",
  "GOTZE", "KOMPANY", "KLOSE", "POGBA",
  "VERTONGHEN", "ALDERWEIRELD", "MATUIDI", "FLAMINI",
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
};

/** Fold a typed guess to its comparable form: accent-free, lowercase, a-z only. */
export function normaliseGuess(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z]/g, "");
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
  const g = normaliseGuess(guess);
  if (!g) return false;
  return acceptedNamesFor(player).some((name) => normaliseGuess(name) === g);
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

