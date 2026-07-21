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
// Same day-index math as footleNumber.js. The anchor is set so launch day is
// Trail #1 — placeholder 2026-08-01 until the ship date is fixed; update in
// the SAME commit that first routes the screen (the number is the token that
// makes strangers' grids comparable, so it must never shift after launch).
export const DAY_MS = 24 * 60 * 60 * 1000;
export const TRAIL_ANCHOR_DAY = 20666; // Date.UTC(2026,7,1)/DAY_MS — provisional launch day = #1

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
];

// Frozen answer log: TRAIL_ANSWER_LOG[n] is the player `key` for day index
// TRAIL_ANCHOR_DAY + n. Generated once at ship time (clone of
// WORDLE_ANSWER_LOG) so the schedule never reshuffles under players.
export const TRAIL_ANSWER_LOG = [];

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

// ── Grader ────────────────────────────────────────────────────────────────────
// Label-based per-rung grading (spec §2): a rung is judged by the CLUB LABEL
// standing on it, not tile identity — so duplicate-club careers (two Aston
// Villa spells) "just work": either Villa tile is green in either Villa slot.
//
//   green  — this label belongs on this exact rung
//   yellow — the label's nearest true rung is exactly 1 away
//   grey   — 2+ away
//   dir    — "up" (belongs earlier) | "down" (belongs later) | null when green.
//            Equidistant duplicate ties resolve "up" (deterministic; the arrow
//            is UX sugar over the same truth, so any consistent rule is fine).
export function gradeTrail(guess, answer) {
  const positions = new Map(); // label → [rung indexes in the true order]
  answer.forEach((label, i) => {
    if (!positions.has(label)) positions.set(label, []);
    positions.get(label).push(i);
  });
  return guess.map((label, i) => {
    const truth = positions.get(label) || [];
    if (truth.includes(i)) return { mark: "green", dir: null };
    if (!truth.length) return { mark: "grey", dir: null }; // foreign label; bench-only guards make this unreachable in-game
    let best = truth[0];
    for (const p of truth) {
      const d = Math.abs(p - i), bd = Math.abs(best - i);
      if (d < bd || (d === bd && p < best)) best = p; // tie → earlier rung → "up"
    }
    return {
      mark: Math.abs(best - i) === 1 ? "yellow" : "grey",
      dir: best < i ? "up" : "down",
    };
  });
}

export function isTrailSolved(grades) {
  return grades.length > 0 && grades.every((g) => g.mark === "green");
}

// ── Bench scramble ────────────────────────────────────────────────────────────
// Deterministic per-day scramble (seed = day index) so every player worldwide
// gets the SAME bench order — grids stay comparable and "attempt 1" is a fair
// shared baseline. Guaranteed not to present the solved order (or any
// all-green-equivalent order under duplicate labels).
export function scrambleBench(clubs, seed) {
  const idx = clubs.map((_, i) => i);
  let h = (seed >>> 0) || 1;
  const next = () => {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    return h;
  };
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let i = idx.length - 1; i > 0; i--) {
      const j = next() % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const bench = idx.map((i) => clubs[i]);
    // Label-equality check: with duplicate clubs, a permutation can be the
    // solved order in disguise. Compare labels, not indexes.
    if (bench.some((label, i) => label !== clubs[i])) return bench;
  }
  // 8 failed reshuffles means every label is identical (impossible for real
  // careers); rotate as a last resort so we never hand out a solved board.
  return [...clubs.slice(1), clubs[0]];
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

// ── Share text ────────────────────────────────────────────────────────────────
// Spoiler-free convergence grid (spec §3): one row per attempt, one emoji per
// rung — closeness without revealing WHICH club sat where. Mirrors the Footle
// share builder's Wordle-convention format.
export function buildTrailShareText(attemptGrades, { number, won, streak } = {}) {
  const grid = attemptGrades
    .map((grades) => grades.map((g) => (g.mark === "green" ? "🟩" : g.mark === "yellow" ? "🟨" : "⬛")).join(""))
    .join("\n");
  const score = won ? attemptGrades.length : "X";
  const head = `⚽ Ball IQ · Transfer Trail${number > 0 ? ` #${number}` : ""} — ${score}/${TRAIL_MAX_ATTEMPTS}`;
  const streakLine = won && streak > 0 ? `\n🔥 ${streak}-day streak` : "";
  return `${head}${streakLine}\n\n${grid}\n\nballiq.app/trail`;
}
