// anchor-open-claims.mjs — date-anchor question stems that make an OPEN-ENDED
// claim about the present, so a broken record cannot quietly falsify them.
//
//   node scripts/anchor-open-claims.mjs            # dry run, prints every edit
//   node scripts/anchor-open-claims.mjs --apply    # write src/questions.js
//
// ⚠️ WHY THIS IS SAFE TO DO IN BULK, when almost nothing else about the bank is.
//
// "As of 2026, X holds the record" is a WEAKER claim than "X holds the record".
// Weakening a claim can never turn a true statement false. If the fact is true
// today it becomes permanently true; if it was already stale, the anchor does
// not cement the error any harder — it only stops FUTURE rot. So this is the
// rare bank edit that does not need 76 individual fact-checks.
//
// WHAT PROMPTED IT (Alex, 2026-08-06, with a transfer window open): "if we have
// a certain type of question that might be vulnerable to become outdated. for
// example 'which club does this player play for' … they have to be written
// robustly so they do not get outdated."
//
// MEASURED, and the answer was not where the worry was:
//   - "which club does X play for"  →  1 question in 6,469. The bank already
//     writes these in the past tense ("which club did Haaland play for BEFORE
//     Man City?"), which can never rot. A first scan flagged 34 and was wrong:
//     it matched "play for" without checking tense.
//   - undated superlatives          →  76. THIS is the exposure. "Who holds the
//     all-time record for most Premier League goals?" does not rot on a
//     transfer; it rots when somebody breaks the record, silently, with no
//     notification to anyone.
//
// The bank already uses the fix in ~40 places ("As of 2026, who is the all-time
// top scorer in the Champions League?"). This just makes it consistent.
import { readFileSync, writeFileSync } from 'fs';

const apply = process.argv.includes('--apply');
const SRC = 'src/questions.js';
const YEAR = 2026;

// A claim is already frozen if it names a date, a season, or the figure itself.
// "…with 162", "(16)", "86 matches" all pin the statement to a moment.
// ⚠️ ANY YEAR ANYWHERE PINS THE STEM. The first version only matched "in 2020"
// and let through "…set a milestone in January 2020…" and "in September 2020
// Jude Bellingham became…", which are NARRATIVES ABOUT PAST EVENTS — the
// superlative is context, the asked fact is historical, and prefixing them
// produced nonsense ("As of 2026, in September 2020 …"). If a stem names a year
// at all it is already fixed in time and needs no anchor.
export const ANCHORED = /\bas of\b|\b(?:19|20)\d\d\b|\bthat season\b|\bwith \d[\d,]*\b|\(\d[\d,]*\)|\b\d[\d,]*\s+(?:matches|goals|caps|appearances|points|titles|wins|years|days|months|seasons|clubs|trophies)\b/i;

// ⚠️ TWO EXCLUSIONS THE FIRST DRY RUN EARNED.
//
// 1. HEDGED superlatives ("one of the youngest ever", "among the most") are not
//    claims about who holds anything — they stay true when the record falls.
// 2. Stems that ASK FOR A FIXED MEASUREMENT ("At what age did X debut…") have an
//    answer that cannot rot, and prefixing them produces nonsense: "As of 2026,
//    at what age did Fàbregas make his Arsenal debut?" The superlative there is
//    incidental colour, not the thing being asked.
const HEDGED = /\b(?:one of the|among the|some of the)\b/i;
const FIXED_MEASUREMENT = /^At what age\b|^How old\b/i;

// Open-ended superlatives: true now, not necessarily true next season.
export const OPEN_CLAIM = /\b(?:holds?|is)\s+the\s+(?:all-?time\s+)?record\b|\bmost\s+\w+(?:\s+\w+)?\s+(?:ever|in history|of all time)\b|\byoungest ever\b|\boldest ever\b|\ball-?time (?:top|leading) scorer\b|\bhas scored the most\b/i;

// Lowercase the opening word only when it is a question word — never touch a
// stem that opens on a name ("Sir Alex Ferguson holds the record…").
const OPENERS = /^(Who|Whose|Which|What|How|When|Where|At|In|Name)\b/;

export function needsAnchor(q) {
  if (typeof q !== 'string') return false;
  if (!OPEN_CLAIM.test(q)) return false;
  if (ANCHORED.test(q)) return false;          // already frozen by a date or figure
  if (HEDGED.test(q)) return false;            // "one of the youngest ever" survives a broken record
  if (FIXED_MEASUREMENT.test(q)) return false; // the asked value is historical and fixed
  return true;
}

export function anchor(q, year = YEAR) {
  if (!needsAnchor(q)) return q;
  const body = OPENERS.test(q) ? q[0].toLowerCase() + q.slice(1) : q;
  return `As of ${year}, ${body}`;
}

// ── run ──────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const { QB } = await import('../src/questions.js');
  const edits = [];
  for (const q of QB) {
    if (!q || typeof q.q !== 'string') continue;
    if (!needsAnchor(q.q)) continue;
    edits.push({ id: q.id, from: q.q, to: anchor(q.q) });
  }

  console.log(`\n${edits.length} stems to anchor (of ${QB.length})\n`);
  for (const e of edits.slice(0, apply ? 0 : 200)) {
    console.log(`  - ${e.from}`);
    console.log(`  + ${e.to}\n`);
  }
  if (!apply) {
    console.log('DRY RUN — nothing written. Re-run with --apply.\n');
    process.exit(0);
  }

  // Rewrite by exact string match on the JS source. Safer than re-serialising
  // the bank: it cannot reorder rows, drop fields, or reformat 6,469 objects.
  let src = readFileSync(SRC, 'utf8');
  let done = 0, missed = [];
  for (const e of edits) {
    const from = JSON.stringify(e.from);
    const to = JSON.stringify(e.to);
    const n = src.split(from).length - 1;
    if (n !== 1) { missed.push({ id: e.id, n }); continue; }
    src = src.replace(from, to);
    done++;
  }
  if (missed.length) {
    console.error(`✗ ${missed.length} stems did not match exactly once — aborting, nothing written`);
    for (const m of missed.slice(0, 5)) console.error(`   ${m.id} matched ${m.n}×`);
    process.exit(1);
  }
  writeFileSync(SRC, src, 'utf8');
  console.log(`✅ anchored ${done} stems in ${SRC}`);
}
