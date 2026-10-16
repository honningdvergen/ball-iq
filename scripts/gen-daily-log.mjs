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

const DAYS = Number(process.argv[2] || 400);
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

// New days are dealt WITHOUT REPLACEMENT (drawDailySchedule, 16 Oct 2026):
// nothing already in the log is dealt again, nor is anything dealt twice
// across the new days, for as long as the pool lasts; every new question
// carries a "Why?". Plain runs and --regen-future both come through here.
{
  const want = (anchor - logAnchor) + DAYS - days.length;
  if (want > 0) {
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

const out = { anchor: logAnchor, served, days };
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
