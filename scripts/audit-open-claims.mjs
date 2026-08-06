// BUILD GATE — no question may make an OPEN-ENDED claim about the present.
//
// A question that says "Who holds the all-time record for most Premier League
// goals?" is true until somebody breaks the record, and then it is silently
// wrong forever. Nobody gets a notification. The whole bank has exactly one
// mechanism for noticing: this gate.
//
// The fix is a date anchor — "As of 2026, who holds …" — which the bank already
// used in ~40 places before this existed. That is a WEAKER claim, so it can
// never turn a true question false; it just stops the rot.
//
// ⚠️ THIS GATE STARTS GREEN. The 65 pre-existing offenders were anchored in the
// same commit that added it (scripts/anchor-open-claims.mjs). A gate that fails
// the build on content already shipped teaches people to bypass the build —
// same reasoning that keeps audit-leaks.mjs out of the chain.
//
// PROVENANCE. Alex raised this with a transfer window open, worried about
// "which club does this player play for". Measured, that pattern was 1 question
// in 6,469 — the bank already writes club history in the past tense, which
// cannot rot. The real exposure was 76 undated superlatives. Worth remembering
// that the instinct was right and the specific fear was not: scan before fixing.
import { needsAnchor } from './anchor-open-claims.mjs';

const { QB } = await import('../src/questions.js');

const bad = [];
for (const q of QB) {
  if (!q || typeof q.q !== 'string') continue;
  if (needsAnchor(q.q)) bad.push(q);
}

if (bad.length) {
  console.error(`\n✗ ${bad.length} question(s) make an open-ended claim about the present\n`);
  for (const q of bad.slice(0, 12)) {
    console.error(`  [${q.club || q.cat || '?'}] ${q.q}`);
  }
  if (bad.length > 12) console.error(`  …and ${bad.length - 12} more`);
  console.error(`
  These go false the moment the record is broken, and nothing will tell us.
  Anchor them to a moment so they stay true forever:

      "Who holds the record for most PL goals?"
   -> "As of 2026, who holds the record for most PL goals?"

  Or state the figure ("…with 260"), or name the season. Any of the three pins
  the claim. Run:  node scripts/anchor-open-claims.mjs           (dry run)
                   node scripts/anchor-open-claims.mjs --apply
`);
  process.exit(1);
}

console.log(`✅ No open-ended present-tense claims (${QB.length} questions)`);
