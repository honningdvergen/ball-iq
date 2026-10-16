// gen-daily-log.mjs — freeze the Daily 7 so a bank change cannot rewrite it.
//
//   node scripts/gen-daily-log.mjs [days]
//
// ⚠️ RUN THIS DELIBERATELY. It is NOT in the build chain, and must never be:
// regenerating on every build is exactly the behaviour this file exists to stop.
//
// WHY (measured 2026-08-19, from a player report):
// pickDailyQuestions shuffled the LIVE bank —
//     seededShuffle(mcqOnly, dayIndex * MULT).slice(0, 7)
// — so adding or removing ONE question changed all seven questions of today's
// daily AND of every past daily. A `/c/` challenge link shared last week
// resolved to a different quiz; "shared by everyone today" was false across any
// deploy; native and web disagreed continuously. quiz.js documents the rule it
// was breaking: "selection must depend on the date and nothing else." It
// depended on the date AND the current size of the bank.
//
// The fix mirrors WORDLE_ANSWER_LOG: log the ANSWERS per day rather than
// freezing the pool. A logged day is immune to any bank edit — additions,
// deletions, re-tags — because it never consults the bank to decide WHICH
// questions, only to resolve them.
//
// ⚠️ GENERATED FROM THE CURRENT BANK ON PURPOSE, so freezing changes NOTHING
// for players at the moment it lands: every logged day holds exactly the
// questions the live shuffle would have served that day. The freeze only starts
// to matter the next time the bank changes — which is the point.
//
// Past days are deliberately NOT reconstructed. They have been rewritten many
// times over by every wave since launch and are unrecoverable; pretending
// otherwise would be a fiction. The log starts today.
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { QB } from '../src/questions.js';
import { drawDailySchedule, warmUpFirst } from '../src/lib/dailyDraw.js';
import { seededShuffle, DAILY_SEED_MULTIPLIER, isModernEra } from '../src/lib/quiz.js';
import { dayIndexForDate } from '../src/lib/date.js';

// Arguments: an optional day count (how far past today to log; default 400),
// and the flags below. The count is the first bare number, wherever it sits:
// `Number(process.argv[2])` read a flag as NaN and silently logged nothing.
const argv = process.argv.slice(2);
const flagValue = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const REGEN_FROM = flagValue('--regen-from');
const DRY_RUN = argv.includes('--dry-run');
const DAYS_ARG = argv.find((a, i) => /^\d+$/.test(a) && argv[i - 1] !== '--regen-from');
const DAYS = DAYS_ARG != null ? Number(DAYS_ARG) : 400;
const OUT = resolve('src/data/dailyLog.js');
// The same log, served by the site to installed apps (src/lib/dailyRemote.js).
// Written in the same run from the same object, so the two cannot differ;
// tests/unit/daily-remote.test.js fails if they ever do.
const REMOTE = resolve('public/data/daily7.json');

const today = new Date();
const anchor = dayIndexForDate(today);

// Preserve anything already frozen: a day that has been logged has, by
// definition, possibly been served, and must never move. Only ever EXTEND.
let existing = null;
try {
  const prev = readFileSync(OUT, 'utf8');
  const m = prev.match(/export default (\{[\s\S]*\});?\s*$/);
  if (m) {
    const parsed = JSON.parse(m[1]);
    // An empty log is a bootstrap stub, not history — ignore it, or its
    // anchor:0 would generate every day back to 1970.
    if (Array.isArray(parsed.days) && parsed.days.length > 0) existing = parsed;
  }
} catch { /* first run */ }

const days = [];
if (existing?.anchor != null && Array.isArray(existing.days)) {
  if (existing.anchor > anchor) {
    console.error(`[daily-log] refusing: existing anchor ${existing.anchor} is in the future of today ${anchor}`);
    process.exit(1);
  }
  // Keep every previously logged day byte-for-byte.
  days.push(...existing.days);
}

const logAnchor = existing?.anchor ?? anchor;

// --regen-future rebuilds every day that CANNOT yet have been served, keeping
// the served prefix byte-for-byte. Use it when the selection RULE changes
// (e.g. dropping easy questions); plain runs only append.
//
// ⚠️ A REGENERATION SPLITS THE WEBSITE FROM INSTALLED APPS unless they can
// fetch the new log. Builds with src/lib/dailyRemote.js fetch
// public/data/daily7.json (written below) and follow; builds cut before it
// play their bundled copy until they update. So do not rebuild the future
// until a build that fetches is what players have (16 Oct 2026: the door
// ships in 1.8.2 with the days unchanged; the rebuild waits for adoption).
//
// ⚠️ "Served" includes TOMORROW. Day index is UTC of the local date, so a
// player at UTC+14 is already on tomorrow's puzzle while it is still today
// here. Swapping a puzzle out from under someone mid-day is the exact bug this
// whole log exists to prevent, so the guard is deliberately generous.
if (process.argv.includes('--regen-future') && days.length) {
  const keep = (anchor - logAnchor) + 2;      // ...today and tomorrow
  if (keep < days.length) {
    console.log(`[daily-log] --regen-future: keeping ${keep} served day(s), rebuilding ${days.length - keep}`);
    days.length = keep;
  }
}

// --regen-from YYYY-MM-DD rebuilds the days ON OR AFTER that date with the
// current draw (drawDailySchedule: without replacement, hint required) and
// keeps every day before it byte for byte. Unlike --regen-future it names the
// first day to move, so the rebuild can be scheduled for a date when the
// installed apps that would otherwise split from the website have updated.
// The horizon stays where it is unless a day count is given.
//
// ⚠️ REFUSES a date on or before the served horizon: today, tomorrow, and
// anything the log already recorded as `served`. Those days may have been
// played, shared as /c/ links and compared; they never move.
//
// Pair it with --dry-run first: that prints what the rebuild would change
// (repeats before and after, runway) and writes nothing.
const horizonIdx = Math.max(existing?.served ?? 0, (anchor - logAnchor) + 2);  // first day that may move
let targetLen = (anchor - logAnchor) + DAYS;
const before = days.map((d) => [...d]);
if (REGEN_FROM != null) {
  if (process.argv.includes('--regen-future')) { console.error('[daily-log] refusing: --regen-from and --regen-future together'); process.exit(1); }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(REGEN_FROM || '');
  const fromDay = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 : NaN;
  if (!m || !Number.isInteger(fromDay) || new Date(fromDay * 86400000).toISOString().slice(0, 10) !== REGEN_FROM) {
    console.error(`[daily-log] refusing: --regen-from wants a real date as YYYY-MM-DD, got ${REGEN_FROM}`); process.exit(1);
  }
  const fromIdx = fromDay - logAnchor;
  const lastServed = new Date((logAnchor + horizonIdx - 1) * 86400000).toISOString().slice(0, 10);
  if (fromIdx < horizonIdx) {
    console.error(`[daily-log] refusing: ${REGEN_FROM} is on or before the served horizon (${lastServed}). Days up to then never move.`); process.exit(1);
  }
  if (fromIdx > days.length) {
    console.error(`[daily-log] refusing: ${REGEN_FROM} is beyond the end of the log; a plain run appends`); process.exit(1);
  }
  if (DAYS_ARG == null) targetLen = days.length;
  console.log(`[daily-log] --regen-from ${REGEN_FROM}: keeping ${fromIdx} day(s) (through the day before), rebuilding ${Math.max(0, targetLen - fromIdx)}`);
  days.length = fromIdx;
}

// Medium warm-up Q1 (2026-10-04) on every day that cannot have been served
// yet. Only slot 0 of a day with a hard opener moves; Q2 to Q7 stay byte-for-
// byte, so a /c/ link or an already-built native log disagrees on one question
// at most. Idempotent: a day that already opens on a medium is untouched.
{
  const byId = new Map(QB.map((q) => [q.id, q]));
  const firstUnserved = (anchor - logAnchor) + 2;     // same guard as above
  let moved = 0;
  for (let i = firstUnserved; i < days.length; i++) {
    const picked = days[i].map((id) => byId.get(id));
    if (picked.some((q) => !q)) continue;              // unresolvable: leave to the top-up path
    if (picked.some((q) => q.diff === "easy")) continue; // a day built on the 13 Oct mix: its own draw already keeps hard off Q1
    const warmed = warmUpFirst(picked, seededShuffle(
      QB.filter((q) => q.type === "mcq" && q.cat !== "Legends" && q.diff !== "easy" && isModernEra(q)),
      (logAnchor + i) * DAILY_SEED_MULTIPLIER));
    if (warmed[0].id !== days[i][0]) { days[i] = warmed.map((q) => q.id); moved++; }
  }
  if (moved) console.log(`[daily-log] warm-up: ${moved} unserved day(s) now open on a medium question`);
}

// The first log index dealt by drawDailySchedule, kept in the log so the
// tests can hold every day from there to "no repeat, every one explained".
let dealtFrom = existing?.dealtFrom ?? null;
// New days are dealt WITHOUT REPLACEMENT (drawDailySchedule, 16 Oct 2026):
// nothing already in the log is dealt again, nor is anything dealt twice
// across the new days, for as long as the pool lasts; every new question
// carries a "Why?". Plain runs and --regen-future both come through here.
{
  const want = targetLen - days.length;
  if (want > 0) {
    dealtFrom = Math.min(dealtFrom ?? Infinity, days.length);
    const used = new Set(days.flat());
    const fresh = drawDailySchedule(QB, logAnchor + days.length, want, used);
    for (const picked of fresh) {
      if (picked.length !== 7) {
        console.error(`[daily-log] day ${logAnchor + days.length} produced ${picked.length} questions — aborting rather than logging a short day`);
        process.exit(1);
      }
      days.push(picked.map((q) => q.id));
    }
  }
}

// How many leading days may already have been served when this file was
// written (today and tomorrow included, as above). An installed app accepts a
// log fetched from the site only if it agrees with its own bundled copy on
// these days (src/lib/dailyRemote.js): they can never move, so a file that
// moves them is a rollback or a mistake.
const served = Math.min(days.length, Math.max(existing?.served ?? 0, (anchor - logAnchor) + 2));

const out = { anchor: logAnchor, served, ...(dealtFrom != null ? { dealtFrom } : {}), days };

if (DRY_RUN) {
  // What the run WOULD change, from the first day that moves. Nothing is written.
  const firstMoved = before.findIndex((d, i) => !days[i] || d.join() !== days[i].join());
  const from = firstMoved < 0 ? Math.min(before.length, days.length) : firstMoved;
  const stats = (log) => {
    const last = new Map(); let daysHit = 0, slots = 0, w30 = 0, w3 = 0;
    log.forEach((d, i) => {
      let hit = false;
      for (const id of d) {
        if (i >= from && last.has(id)) { hit = true; slots++; const gap = i - last.get(id); if (gap <= 30) w30++; if (gap <= 3) w3++; }
        last.set(id, i);
      }
      if (hit) daysHit++;
    });
    const region = log.slice(from);
    return `${region.length} days, ${new Set(region.flat()).size} different questions in ${region.length * 7} slots; ${daysHit} days hold a question already met, ${slots} repeat slots, ${w30} within 30 days, ${w3} within 3`;
  };
  const date = (i) => new Date((logAnchor + i) * 86400000).toISOString().slice(0, 10);
  const byId = new Map(QB.map((q) => [q.id, q]));
  const bare = (log) => log.slice(from).flat().filter((id) => { const q = byId.get(id); return !q || !(typeof q.hint === 'string' && q.hint.trim()); }).length;
  const used = new Set(days.slice(0, from).flat());
  const pool = { easy: 0, medium: 0, hard: 0 };
  for (const q of QB) {
    if (q.type === 'mcq' && q.cat !== 'Legends' && isModernEra(q) && typeof q.hint === 'string' && q.hint.trim() && !used.has(q.id) && pool[q.diff] != null) pool[q.diff]++;
  }
  const runway = Math.min(Math.floor(pool.easy / 2), Math.floor(pool.medium / 4), pool.hard);
  console.log(`[daily-log] DRY RUN, nothing written. Compared from ${date(from)} to ${date(days.length - 1)}:`);
  console.log(`  before: ${stats(before)}; ${bare(before)} without a "Why?"`);
  console.log(`  after:  ${stats(days)}; ${bare(days)} without a "Why?"`);
  console.log(`  runway from ${date(from)}: easy ${pool.easy}, medium ${pool.medium}, hard ${pool.hard} with a "Why?" and not yet used = ${runway} days with no repeat (through ${date(from + runway - 1)})`);
  process.exit(0);
}

writeFileSync(OUT,
  '// GENERATED by scripts/gen-daily-log.mjs — do not hand-edit, do not reorder.\n'
  + '// Frozen Daily 7 answers. A logged day must NEVER move: it may already have\n'
  + '// been served, shared as a /c/ link, and compared between two players.\n'
  + '// Extend by re-running the generator; it only ever appends.\n'
  + 'export default ' + JSON.stringify(out) + ';\n');
writeFileSync(REMOTE, JSON.stringify({ v: 1, ...out }) + '\n');
const kb = (JSON.stringify(out).length / 1024).toFixed(1);
console.log(`[daily-log] anchor ${logAnchor} (${new Date(logAnchor * 86400000).toISOString().slice(0, 10)})`);
console.log(`[daily-log] ${days.length} days logged, ${kb} KB`);
console.log(`[daily-log] covers through ${new Date((logAnchor + days.length - 1) * 86400000).toISOString().slice(0, 10)}`);
