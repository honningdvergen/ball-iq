// simulate-mystery-cold-start.mjs — the scripted fan of 16 Oct 2026
// (ball-iq-audit/2026-10-16/mystery-warm/simulate.mjs) re-run under the NEW
// rules (R7), beside the old ones, over the whole schedule.
//
//   node scripts/simulate-mystery-cold-start.mjs [runs=12] [from=0] [to=schedule length]
//
// THE FAN (unchanged from October, and calibrated then so that the rules
// before the warm start matched the real 56% win rate): knows the 1,500 most
// famous names, guesses famous ones first (weight fame squared), obeys every
// clue SHOWN on screen, follows what the feedback taught except on a hunch
// (40% of guesses), and has a patience drawn per game (3 + exponential, mean
// 8.5). A game is a win if solved within that patience. Nothing below is
// tuned to move the numbers; the new-rules fan reads the four tiles where the
// old one read the reason line, and that is the only change in how it thinks.
//
// VARIANTS
//   old          as shipped 16 Oct: position and birth decade free; the main
//                club after 4 guesses and the initials after 8, each taken
//                with probability 0.6 (the calibrated habit)
//   new-nohint   no free clues; the four tiles; no hint taken
//   new-hints    the same, and one card taken the moment each round opens
//                (after 4 and after 8), chosen at random among the cards
//                offered and not already held (R4)
import { readFileSync } from 'node:fs';
import * as mp from '../src/lib/mysteryPlayer.js';
import * as mc from '../src/lib/mysteryCareer.js';
import * as mr from '../src/lib/mysteryRules.js';

const RUNS = Number(process.argv[2] || 12);
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const pool = read('src/data/mysteryPool.json');
const sched = read('src/data/mysterySchedule.json');
const roles = read('src/data/mysteryRoles.json');
const answers = read('src/data/mysteryAnswers.json');
const careers = mc.withCareerFixes(read('src/data/mysteryCareers.json'), read('src/data/mysteryCareerFixes.json'));
const byId = new Map(pool.map((p) => [p.id, p]));
const FROM = Number(process.argv[3] || 0);
const TO = Number(process.argv[4] || sched.length);
const baseCtx = { careers, byId, answers, nations: read('src/data/mysteryNations.json'), regions: read('src/data/nationRegions.json'), flags: read('src/data/nationFlags.json') };
const KNOWN = [...pool].sort((a, b) => b.fame - a.fame).slice(0, 1500);
const FAN = { hunch: 0.4, slack: 3, takeClue: 0.6, patience: 8.5 };
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }

const clubCache = new Map();
const clubsFor = (p, year) => { // what a fan knows of a famous career: up to three spells of 3+ years
  let s = clubCache.get(p.id);
  if (!s) { s = new Set([...mc.clubsOf(p, careers, year)].filter(([, v]) => v.years >= 3).sort((a, b) => b[1].years - a[1].years).slice(0, 3).map(([k]) => k)); clubCache.set(p.id, s); }
  return s;
};
const allClubs = (p, year) => mc.clubsOf(p, careers, year);
const natsOf = (p) => mr.nationsOf(p, baseCtx.nations);

function pickWeighted(r, cands, weight) {
  let tot = 0; const w = cands.map((c) => { const x = weight(c); tot += x; return x; });
  let t = r() * tot;
  for (let i = 0; i < cands.length; i++) { t -= w[i]; if (t <= 0 && w[i] > 0) return cands[i]; }
  return cands.find((c, i) => w[i] > 0) || null;
}

// ── OLD RULES (copied from the October fan, decade and position free) ───────
function playOld(answer, ranks, year, seed, cap = 30) {
  const r = rng(seed);
  const K = { slot: null, notSlot: new Set(), lo: -Infinity, hi: Infinity, clubs: new Set(), main: null, ini: null };
  const S = { slot: null, lo: null, hi: null };
  if (mp.hintPosition(answer, roles)) { K.slot = answer.slot; S.slot = answer.slot; }
  { const d = Math.floor(answer.born / 10) * 10; K.lo = d; K.hi = d + 9; S.lo = d; S.hi = d + 9; }
  const ladder = [['club', 4], ['initials', 8]];
  const guessed = new Set(); const bands = []; let rung = 0;
  for (let g = 0; g < cap; g++) {
    while (rung < ladder.length && g >= ladder[rung][1] && r() < FAN.takeClue) {
      const k = ladder[rung++][0];
      if (k === 'club') K.main = mc.mainClub(answer, careers, year); else K.ini = mc.initials(answer.name);
    }
    const cands = K.main && K.ini ? pool : KNOWN;
    const hunch = r() < FAN.hunch;
    const pick = pickWeighted(r, cands, (c) => {
      if (guessed.has(c.id)) return 0;
      let x = c.fame ** 2;
      if (S.slot && c.slot !== S.slot) x *= 0.02;
      if (S.lo != null && (c.born < S.lo || c.born > S.hi)) x *= 0.02;
      if (K.main && !allClubs(c, year).has(K.main)) x *= 0.01;
      if (K.ini && mc.initials(c.name) !== K.ini) x *= 0.01;
      if (hunch) return x;
      if (K.slot && c.slot !== K.slot) x *= 0.02;
      if (!K.slot && K.notSlot.has(c.slot)) x *= 0.1;
      if (c.born < K.lo - FAN.slack || c.born > K.hi + FAN.slack) x *= 0.02;
      if (K.clubs.size) { const cs = clubsFor(c, year); for (const cl of K.clubs) if (!cs.has(cl)) x *= 0.05; }
      return x;
    });
    guessed.add(pick.id);
    const rank = ranks.get(pick.id);
    bands.push(mp.bandFor(rank, pool.length));
    if (rank === 1) return { solved: g + 1, bands };
    const x = mp.explainGuess(pick, answer, careers, year);
    if (x.samePosition) K.slot = answer.slot; else K.notSlot.add(pick.slot);
    if (x.gap != null) {
      if (x.era === 'near' || x.gap === 0) { const b = x.bornWhen === 'earlier' ? pick.born + x.gap : x.bornWhen === 'later' ? pick.born - x.gap : pick.born; K.lo = Math.max(K.lo, b); K.hi = Math.min(K.hi, b); }
      else if (x.era === 'same') { if (x.bornWhen === 'earlier') { K.lo = Math.max(K.lo, pick.born + 1); K.hi = Math.min(K.hi, pick.born + 4); } else { K.lo = Math.max(K.lo, pick.born - 4); K.hi = Math.min(K.hi, pick.born - 1); } }
      else if (x.bornWhen === 'earlier') K.lo = Math.max(K.lo, pick.born + 10); else K.hi = Math.min(K.hi, pick.born - 10);
      if (K.lo > K.hi) { const m = (K.lo + K.hi) / 2; K.lo = Math.floor(m) - 2; K.hi = Math.ceil(m) + 2; }
    }
    for (const s of x.shared.slice(0, 2)) K.clubs.add(s.club);
  }
  return { solved: null, bands };
}

// ── NEW RULES: four tiles, no free clues, optional hints ────────────────────
function playNew(answer, ranks, year, seed, hints, cards, cap = 30) {
  const r = rng(seed);
  const ctx = { ...baseCtx, year };
  // Learned from tiles (obeyed except on a hunch) and SHOWN by hints (always obeyed).
  const K = { slot: null, notSlot: new Set(), lo: -Infinity, hi: Infinity, clubs: new Set(), nat: null, region: null, notRegion: new Set(), notNat: new Set() };
  const S = { clubs: new Set(), nat: null, lo: null, hi: null };
  const guessed = []; const ids = new Set(); const bands = []; const taken = [];
  const take = (round) => {
    const held = mr.heldHints(cards, guessed, answer, ctx);
    const offer = cards[round].filter((c) => c.available && !held[c.key]);
    if (!offer.length) return;
    const c = offer[Math.floor(r() * offer.length)];
    taken.push({ round, key: c.key });
    if (c.key === 'teammate' || c.key === 'teammateMain' || c.key === 'club') { if (!c.value.oneClub) S.clubs.add(c.value.club); }
    if (c.key === 'teammate' || c.key === 'teammateMain') { S.lo = Math.max(S.lo ?? -Infinity, c.value.from - 36); S.hi = Math.min(S.hi ?? Infinity, c.value.from - 15); }
    if (c.key === 'careerYears') { S.lo = Math.max(S.lo ?? -Infinity, c.value.from - 22); S.hi = Math.min(S.hi ?? Infinity, c.value.from - 15); }
    if (c.key === 'nation') S.nat = c.value.nation;
    if (c.key === 'birthYear') { S.lo = c.value.year; S.hi = c.value.year; }
  };
  for (let g = 0; g < cap; g++) {
    if (hints) for (const rd of mr.openRounds(g, taken)) take(rd);
    const strong = S.clubs.size && (S.nat || (S.lo != null && S.hi - S.lo <= 6));
    const cands = strong ? pool : KNOWN;
    const hunch = r() < FAN.hunch;
    const pick = pickWeighted(r, cands, (c) => {
      if (ids.has(c.id)) return 0;
      let x = c.fame ** 2;
      if (S.clubs.size) { const cs = allClubs(c, year); for (const cl of S.clubs) if (!cs.has(cl)) x *= 0.01; }
      if (S.nat && !natsOf(c).includes(S.nat)) x *= 0.02;
      if (S.lo != null && (c.born < S.lo || c.born > S.hi)) x *= 0.02;
      if (hunch) return x;
      if (K.slot && c.slot !== K.slot) x *= 0.02;
      if (!K.slot && K.notSlot.has(c.slot)) x *= 0.1;
      if (c.born < K.lo - FAN.slack || c.born > K.hi + FAN.slack) x *= 0.02;
      if (K.clubs.size) { const cs = clubsFor(c, year); for (const cl of K.clubs) if (!cs.has(cl)) x *= 0.05; }
      const n = natsOf(c)[0];
      if (K.nat && !natsOf(c).includes(K.nat)) x *= 0.05;
      else if (!K.nat && n && K.notNat.has(n)) x *= 0.2;
      if (!K.nat && K.region && n && mr.regionOf(n, baseCtx.regions) !== K.region) x *= 0.1;
      if (!K.nat && n && K.notRegion.has(mr.regionOf(n, baseCtx.regions))) x *= 0.1;
      return x;
    });
    guessed.push(pick); ids.add(pick.id);
    const rank = ranks.get(pick.id);
    bands.push(mp.bandFor(rank, pool.length));
    if (rank === 1) return { solved: g + 1, bands, hints: taken.length };
    const t = mr.tileVerdicts(pick, answer, ctx);
    if (t.position.state === 'same') K.slot = answer.slot; else if (t.position.slot) K.notSlot.add(t.position.slot);
    if (t.club.state === 'same') K.clubs.add(t.club.club);
    if (t.nation.state === 'same') K.nat = t.nation.nation;
    else if (t.nation.state === 'close') { K.region = t.nation.region; K.notNat.add(t.nation.nation); }
    else if (t.nation.state === 'different') { K.notNat.add(t.nation.nation); if (t.nation.region) K.notRegion.add(t.nation.region); }
    const b = t.born;
    if (b.state === 'same') { K.lo = b.year; K.hi = b.year; }
    else if (b.state === 'close') { if (b.arrow === 'down') { K.lo = Math.max(K.lo, b.year - 4); K.hi = Math.min(K.hi, b.year - 1); } else { K.lo = Math.max(K.lo, b.year + 1); K.hi = Math.min(K.hi, b.year + 4); } }
    else if (b.state === 'different') { if (b.arrow === 'down') K.hi = Math.min(K.hi, b.year - 5); else K.lo = Math.max(K.lo, b.year + 5); }
    if (K.lo > K.hi) { const m = (K.lo + K.hi) / 2; K.lo = Math.floor(m) - 2; K.hi = Math.ceil(m) + 2; }
  }
  return { solved: null, bands, hints: taken.length };
}

const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(f * s.length))] : null; };
const days = [];
for (let i = FROM; i < Math.min(TO, sched.length); i++) {
  const a = byId.get(sched[i]);
  if (!a) continue;
  const year = mp.puzzleYear(mp.MYSTERY_ANCHOR_DAY + i);
  days.push({ i, a, year, ranks: mp.rankPool(pool, a, careers, year), cards: mr.hintCards(a, { ...baseCtx, year }) });
  if (days.length % 50 === 0) process.stderr.write(`  ranked ${days.length}\r`);
}
const VARIANTS = {
  old: (d, seed) => playOld(d.a, d.ranks, d.year, seed),
  'new-nohint': (d, seed) => playNew(d.a, d.ranks, d.year, seed, false, d.cards),
  'new-hints': (d, seed) => playNew(d.a, d.ranks, d.year, seed, true, d.cards),
};
console.log(`Mystery Player cold start: ${days.length} scheduled days (No. ${FROM + 1}-${FROM + days.length}) x ${RUNS} fans each`);
for (const [name, play] of Object.entries(VARIANTS)) {
  const solves = [], wins = [], perDay = [], dayMedian = [];
  let cold3 = 0, n3 = 0, played = 0, hintsTaken = 0;
  for (const d of days) {
    let w = 0; const mine = [];
    for (let k = 0; k < RUNS; k++) {
      const res = play(d, d.i * 7919 + k * 104729 + 1);
      const pr = rng(d.i * 31 + k * 977 + 5); pr();
      const patience = 3 + Math.floor(-Math.log(1 - pr()) * FAN.patience);
      played++;
      solves.push(res.solved || 31); mine.push(res.solved || 31);
      if (res.solved && res.solved <= patience) { w++; wins.push(res.solved); }
      hintsTaken += res.hints || 0;
      cold3 += res.bands.slice(0, 3).filter((b) => b === 'cold').length; n3 += Math.min(3, res.bands.length);
    }
    perDay.push(w / RUNS); dayMedian.push(q(mine, 0.5));
  }
  const pc = (x) => `${Math.round(x * 100)}%`;
  console.log(`\n${name}`);
  console.log(`  win rate ${pc(wins.length / played)} · days under 50%: ${perDay.filter((x) => x < 0.5).length}/${perDay.length} · per-day win p10 ${pc(q(perDay, 0.1))}, median ${pc(q(perDay, 0.5))}, p90 ${pc(q(perDay, 0.9))}`);
  console.log(`  guesses to solve (all games, unsolved by 30 counted 31): median ${q(solves, 0.5)} (p25 ${q(solves, 0.25)}, p75 ${q(solves, 0.75)}) · winners' median ${q(wins, 0.5)} · median of the per-day medians ${q(dayMedian, 0.5)}`);
  console.log(`  solved within 10: ${pc(solves.filter((s) => s <= 10).length / solves.length)}, within 20: ${pc(solves.filter((s) => s <= 20).length / solves.length)} · cold among the first three guesses: ${pc(cold3 / n3)}${name === 'new-hints' ? ` · hints taken per game ${(hintsTaken / played).toFixed(2)}` : ''}`);
}
