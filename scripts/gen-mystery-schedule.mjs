// Writes the FUTURE of src/data/mysterySchedule.json — the frozen answer log.
//
// Same discipline as Footle's WORDLE_ANSWER_LOG and the Trail's, for the same
// hard-won reason: choosing the daily answer by `dayIndex % pool.length` means
// adding ONE player silently rewrites every past and future puzzle, including
// any archive we publish. So the log is committed, and THE PAST IS NEVER
// TOUCHED: every day before FROM is copied through byte for byte.
//
// ⚠️ HISTORY. The first version of this script generated all 400 days in one
// go, and re-running it rewrote days already played (checked 2026-10-05), so
// scripts/rekey-mystery-repeats.mjs was written to patch repeats in place
// instead. On 14 Oct 2026 the future was rebuilt to a new standard (famous
// answers only, scripts/mystery-answer-bar.mjs), and this script was
// rewritten to do only that: keep the past, regenerate the rest.
//
// WHAT IT DOES
//   · days 0 .. FROM-1 are kept exactly as they are
//   · days FROM .. 399 are drawn from players who clear the fame bar and have
//     never been an answer before (no repeats anywhere in the log)
//   · the most famous go first: each day draws from the THIRTY most famous
//     names still unused, weighted by fame, so the next two months are the
//     biggest names and the thinner end of the bar lands in 2027
//   · spread: never the same position or the same main club as the day
//     before, no main club twice inside ten days, no more than four days in
//     any seven from one era
//   · deterministic: a fixed-seed integer LCG, no clock in the draw, no
//     Math.random(). Same inputs, byte-identical output.
//
// ⚠️ IT REFUSES TO REWRITE A DAY THAT HAS BEEN SERVED. FROM must be after
// today's puzzle; once that day comes, run it with --from <first unplayed
// index> or not at all.
//
// Usage: node scripts/gen-mystery-schedule.mjs [--from 73] [--dry]
import { readFileSync, writeFileSync } from 'node:fs';
import { answerBar, FIRST_FAMOUS_DAY } from './mystery-answer-bar.mjs';
import { mainClub } from '../src/lib/mysteryCareer.js';
import { mysteryDayIndex, MYSTERY_ANCHOR_DAY } from '../src/lib/mysteryPlayer.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const FILE = new URL('../src/data/mysterySchedule.json', import.meta.url);
const schedule = read('../src/data/mysterySchedule.json');
const pool = read('../src/data/mysteryPool.json');
const careers = read('../src/data/mysteryCareers.json');
const roles = read('../src/data/mysteryRoles.json');
const exclusions = read('../src/data/mysteryExclusions.json');

const argFrom = process.argv.indexOf('--from');
const FROM = argFrom > 0 ? Number(process.argv[argFrom + 1]) : FIRST_FAMOUS_DAY;
const todayIdx = mysteryDayIndex(new Date()) - MYSTERY_ANCHOR_DAY;
if (!(FROM > todayIdx)) {
  throw new Error(`day ${FROM} is today's puzzle or already played (today is ${todayIdx}); pass --from ${todayIdx + 1}`);
}
const DAYS = schedule.length; // the length is kept

const used = new Set(schedule.slice(0, FROM));
const era = (p) => (p.born < 1960 ? 'legend' : p.born < 1975 ? '60s-70s' : p.born < 1987 ? '75-86' : p.born < 1996 ? '87-95' : 'now');
const cands = pool
  .filter((p) => !used.has(p.id) && answerBar(p, { careers, roles, exclusions, pool }).ok)
  .map((p) => ({ p, club: mainClub(p, careers), era: era(p) }))
  .sort((a, b) => (b.p.fame - a.p.fame) || a.p.id.localeCompare(b.p.id));
const need = DAYS - FROM;
if (cands.length < need) throw new Error(`only ${cands.length} players clear the bar for ${need} days`);

let seed = 20261014;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const WINDOW = 30;

const out = schedule.slice(0, FROM);
const picks = [];
for (let day = FROM; day < DAYS; day++) {
  const prev = picks[picks.length - 1];
  const last10 = picks.slice(-10).map((x) => x.club);
  const last6 = picks.slice(-6);
  const fits = (c) => !prev || (
    c.p.slot !== prev.p.slot && c.club !== prev.club && !last10.includes(c.club)
    && last6.filter((x) => x.era === c.era).length < 4
  );
  const window = cands.slice(0, WINDOW);
  let from = window.filter(fits);
  if (!from.length) from = cands.filter(fits);
  if (!from.length) from = window; // the spread rules give way before the log runs dry
  const total = from.reduce((t, c) => t + c.p.fame, 0);
  let r = rnd() * total;
  let pick = from[from.length - 1];
  for (const c of from) { r -= c.p.fame; if (r <= 0) { pick = c; break; } }
  cands.splice(cands.indexOf(pick), 1);
  picks.push(pick);
  out.push(pick.p.id);
}

// Guards — a schedule that breaks these is worse than no schedule.
if (out.length !== DAYS) throw new Error('length changed');
for (let i = 0; i < FROM; i++) if (out[i] !== schedule[i]) throw new Error(`day ${i} changed`);
const future = out.slice(FROM);
if (new Set(future).size !== future.length) throw new Error('a future day repeats');

if (!process.argv.includes('--dry')) writeFileSync(FILE, JSON.stringify(out));
const fame = picks.map((x) => x.p.fame).sort((a, b) => a - b);
const tally = (k) => Object.entries(picks.reduce((m, x) => ((m[x[k]] = (m[x[k]] || 0) + 1), m), {})).map(([a, n]) => `${a} ${n}`).join(' · ');
console.log(`kept days 1-${FROM} · wrote days ${FROM + 1}-${DAYS} · ${cands.length} qualifying players left unused`);
console.log(`fame of the new answers: min ${fame[0]} · median ${fame[Math.floor(fame.length / 2)]} · max ${fame[fame.length - 1]}`);
console.log(`by position: ${Object.entries(picks.reduce((m, x) => ((m[x.p.slot] = (m[x.p.slot] || 0) + 1), m), {})).map(([a, n]) => `${a} ${n}`).join(' · ')}`);
console.log(`by era: ${tally('era')}`);
if (process.argv.includes('--list')) picks.forEach((x, i) => console.log(`  #${FROM + i + 1}  ${x.p.name} · ${x.p.slot} · ${x.club} · born ${x.p.born} · fame ${x.p.fame}`));
