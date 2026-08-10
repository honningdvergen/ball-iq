// Emits src/data/mysterySchedule.json — the FROZEN answer log.
//
// Same discipline as Footle's WORDLE_ANSWER_LOG and the Trail's, for the same
// hard-won reason: choosing the daily answer by `dayIndex % pool.length` means
// adding ONE player silently rewrites every past and future puzzle, including
// any archive we publish. The log is generated once, committed, and only ever
// APPENDED to.
//
// Deterministic: an integer LCG with a fixed seed, no Date.now(), no
// Math.random(). Re-running produces byte-identical output.
import { writeFileSync } from 'fs';
const { default: pool } = await import('../src/data/mysteryPool.json', { with: { type: 'json' } });
const { default: answerIds } = await import('../src/data/mysteryAnswers.json', { with: { type: 'json' } });

// ⚠️ DRAW FROM THE ANSWER POOL, NOT FROM THE GUESS POOL WITH A FAME FILTER.
// That was the original bug in a second disguise. The guess pool is deliberately
// inclusive — 8,491 players, because refusing a real footballer as a guess is
// the worst thing this game can do. But fame alone does not make a good ANSWER:
// Niels Bohr has 186 Wikipedia languages and one amateur club, so
// `pool.filter(p => p.fame >= 45)` would schedule him as a daily puzzle.
// mysteryAnswers.json is the curated set — fame >= 55 AND a real career.
const ANSWERS = new Set(answerIds);
const DAYS = 400;
const MIN_GAP = 60; // no answer repeats inside this many days

const eligible = pool.filter((p) => ANSWERS.has(p.id)).sort((a, b) => a.id.localeCompare(b.id));
if (eligible.length < 60) throw new Error(`only ${eligible.length} eligible answers`);

let seed = 20260803;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const log = [];
const lastUsed = new Map();
for (let day = 0; day < DAYS; day++) {
  // Candidates not used inside MIN_GAP, preferring the longest-unused.
  const ok = eligible.filter((p) => !lastUsed.has(p.id) || day - lastUsed.get(p.id) >= MIN_GAP);
  const from = ok.length ? ok : eligible;
  // WEIGHTED BY FAME, not uniform. A uniform draw over 243 eligible players
  // gave a first week of Malo Gusto, Locatelli and Gueye — all real answers,
  // none a name a casual fan lights up at. Weighting by fame^1.6 means most
  // days are players you know, with the less obvious ones as the occasional
  // harder puzzle. Day 1 is forced to the most famous available, because the
  // first impression of a new mode should not be its hardest day.
  const weight = (x) => Math.pow(x.fame, 1.6);
  let pick;
  if (day === 0) {
    pick = from.reduce((a, b) => (b.fame > a.fame ? b : a));
  } else {
    const total = from.reduce((t, x) => t + weight(x), 0);
    let r = rnd() * total;
    pick = from[from.length - 1];
    for (const x of from) { r -= weight(x); if (r <= 0) { pick = x; break; } }
  }
  log.push(pick.id);
  lastUsed.set(pick.id, day);
}

// Guards — a schedule that violates these is worse than no schedule.
const counts = {};
for (const id of log) counts[id] = (counts[id] || 0) + 1;
for (let i = 1; i < log.length; i++) if (log[i] === log[i - 1]) throw new Error(`back-to-back repeat at day ${i}`);
const spread = Math.max(...Object.values(counts)) - Math.min(...Object.values(counts));

writeFileSync('src/data/mysterySchedule.json', JSON.stringify(log));
const byId = Object.fromEntries(pool.map((p) => [p.id, p]));
console.log(`eligible answers : ${eligible.length} (curated answer pool)`);
console.log(`schedule         : ${log.length} days, ${Object.keys(counts).length} distinct answers`);
console.log(`uses per player  : ${Math.min(...Object.values(counts))}-${Math.max(...Object.values(counts))} (spread ${spread})`);
console.log(`\nfirst 8 days:`);
log.slice(0, 8).forEach((id, i) => console.log(`  #${i + 1}  ${byId[id].name} (${byId[id].club}, fame ${byId[id].fame})`));
