#!/usr/bin/env node
/**
 * Replace the REPEATS in the unplayed part of the Mystery Player schedule.
 *
 * WHY. The schedule was generated with MIN_GAP = 60 from a curated answer set
 * that then held about 300 names, so the 400-day log reused players: 99 of the
 * days still to come repeated someone already served, the first on 5 Nov 2026
 * and the tightest only 60 days after the first showing. Alex's line
 * (2026-10-05): a repeat a year later is harmless, a repeat two months later is
 * not. The curated set has since grown to about 650 and more than 300 of those
 * names had never been scheduled at all, so no repeat is needed inside the log.
 *
 * WHY NOT RE-RUN THE GENERATOR. gen-mystery-schedule.mjs draws from the answer
 * set as it is today; that set has changed since the log was cut, so a re-run
 * rewrites every day, including the days already played (checked: it does).
 * This edits the committed log in place instead and touches only what it must.
 *
 * WHAT IT DOES. Every day before FROM is left exactly as it is: those are
 * public record, or about to be. From FROM on, a day keeps its answer unless
 * that answer already appears earlier in the log; a repeat is replaced by a
 * fame-weighted draw from the eligible answers never scheduled anywhere. The
 * eligibility rules are the generator's own (curated set, not banned, a senior
 * club), and nobody on the rationed coaching list is drawn, so the 5% ration
 * can only fall. Deterministic: a fixed-seed LCG, no clock, no Math.random().
 * A second run finds no repeats and changes nothing.
 *
 * Usage: node scripts/rekey-mystery-repeats.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const FILE = new URL('../src/data/mysterySchedule.json', import.meta.url);
const schedule = read('../src/data/mysterySchedule.json');
const pool = read('../src/data/mysteryPool.json');
const answers = new Set(read('../src/data/mysteryAnswers.json'));
const EX = read('../src/data/mysteryExclusions.json');

// Index 66 is Mystery Player No. 67, 8 Oct 2026. Days 0..65 were served or
// were within two days of being served when this ran; audit-mystery-schedule
// holds the same number as the line the no-repeat rule starts from.
export const FROM = 66;

const BANNED = new Set([...(EX.managers || []), ...(EX.notFootballers || [])]);
const RATIONED = new Set(EX.rationed || []);
const NON_SENIOR = /(castilla| b$|II$| ii$|reserves?|under-?\d|youth|amateur|atl[eè]tic |acad|juvenil|primavera|ind[uú]stria|antiguoko)/i;

const used = new Set(schedule);
const fresh = pool
  .filter((p) => answers.has(p.id) && !used.has(p.id))
  .filter((p) => !BANNED.has(p.name) && !RATIONED.has(p.name))
  .filter((p) => !NON_SENIOR.test(p.club || ''))
  .sort((a, b) => a.id.localeCompare(b.id));

let seed = 20261005;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const weight = (x) => Math.pow(x.fame, 1.6);

const byId = new Map(pool.map((p) => [p.id, p]));
const seen = new Set(schedule.slice(0, FROM));
const out = schedule.slice();
const swaps = [];
for (let day = FROM; day < out.length; day++) {
  if (!seen.has(out[day])) { seen.add(out[day]); continue; }
  if (!fresh.length) throw new Error(`ran out of unused answers at day ${day}`);
  const total = fresh.reduce((t, x) => t + weight(x), 0);
  let r = rnd() * total;
  let k = fresh.length - 1;
  for (let i = 0; i < fresh.length; i++) { r -= weight(fresh[i]); if (r <= 0) { k = i; break; } }
  const pick = fresh.splice(k, 1)[0];
  swaps.push(`#${day + 1}: ${byId.get(out[day])?.name} -> ${pick.name} (fame ${pick.fame})`);
  out[day] = pick.id;
  seen.add(pick.id);
}

if (!process.argv.includes('--dry') && swaps.length) writeFileSync(FILE, JSON.stringify(out));
console.log(`${swaps.length} repeat day(s) replaced from #${FROM + 1} on · ${new Set(out).size} distinct answers in ${out.length} days · ${fresh.length} unused answers left`);
for (const s of swaps.slice(0, 12)) console.log('  ' + s);
if (swaps.length > 12) console.log(`  … and ${swaps.length - 12} more`);
