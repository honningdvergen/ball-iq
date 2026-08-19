// forge-rescue.mjs — save EVERYTHING recoverable from a forge run, not just survivors.
//
//   node scripts/forge-rescue.mjs <workflow-run-dir> <out.json>
//
// ⚠️ WHY THIS EXISTS ALONGSIDE forge-harvest.mjs.
// forge-harvest recovers SURVIVORS (skeptics that returned "keep") — the only
// questions that may ship under the ZERO ERROR bar. But when a run dies before
// the skeptic stage, survivors is legitimately 0 and the harvest file is empty
// even though the run produced real work: on 2026-08-18 that was 94 generated
// questions and 39 examiner approvals, all of which would have been unreachable
// the moment the session ended, because `resumeFromRunId` is SAME-SESSION ONLY.
//
// Generation is the expensive stage (each generator carries the club's facts AND
// its avoid-list of existing stems). Losing it means paying for it twice.
//
// ⚠️ NOTHING IN THIS FILE MAY SHIP AS-IS. `candidates` have passed zero checks;
// `examinerApproved` have passed ONE of two. The bar is survive-BOTH-passes.
// This file exists so a future run can skip straight to verification.
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const [, , runDir, outPath] = process.argv;
if (!runDir || !outPath) {
  console.error('usage: node scripts/forge-rescue.mjs <run-dir> <out.json>');
  process.exit(1);
}
const dir = resolve(runDir);

// ⚠️ Match the club by NAME, not by parsing the prompt. The transcript is
// JSON-escaped, so newline-anchored regexes silently miss and every question
// lands as "unknown" — which is worse than losing them, because an unattributed
// question cannot be filed into a club pack at all. Names come from the run's
// own club list; a question mentioning two clubs is attributed to the one the
// prompt names FIRST (the generator's subject, not a distractor).
const CLUB_NAMES = ['Sheffield Wednesday', 'Norwich City', 'Birmingham City',
                    'Wrexham', 'Cardiff City', 'Swansea City'];
const clubOf = (txt) => {
  let best = null, at = Infinity;
  for (const name of CLUB_NAMES) {
    const i = txt.indexOf(`questions about ${name}`);
    const j = i >= 0 ? i : txt.indexOf(`question about ${name}`);
    if (j >= 0 && j < at) { at = j; best = name; }
  }
  if (best) return best;
  // Fallback: first club name mentioned anywhere in the transcript.
  for (const name of CLUB_NAMES) if (txt.includes(name)) return name;
  return null;
};

const candidates = [];   // generated, unverified
const examined = [];     // examiner verdict recorded

for (const f of readdirSync(dir).filter((x) => /^agent-.*\.jsonl$/.test(x))) {
  let lines;
  try { lines = readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
  catch { continue; }
  const whole = lines.map((l) => JSON.stringify(l)).join('\n');
  const isGen = /multiple-choice football trivia questions about/.test(whole);
  const isExam = /You are the EXAMINER/.test(whole);
  const isSkep = /You are the SKEPTIC/.test(whole);
  const club = clubOf(whole.replace(/\\n/g, '\n'));

  // The structured return is the last assistant tool payload with our shape.
  for (const l of lines) {
    const s = JSON.stringify(l);
    if (isGen && /"questions"\s*:\s*\[/.test(s)) {
      try {
        const m = s.match(/\{"questions":\[.*?\]\}/);
        if (m) {
          const parsed = JSON.parse(JSON.parse(`"${m[0].replace(/"/g, '\\"')}"`).replace(/\\"/g, '"'));
          for (const q of parsed.questions || []) candidates.push({ club, ...q });
        }
      } catch { /* best effort — a malformed frame must not lose the rest */ }
    }
    if ((isExam || isSkep) && /"verdict"/.test(s)) {
      const v = (s.match(/"verdict"\s*:\s*"(keep|fix|reject)"/) || [])[1];
      if (v) examined.push({ club, stage: isSkep ? 'skeptic' : 'examiner', verdict: v });
    }
  }
}

// De-dupe candidates by normalised stem — retries re-emit the same question.
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const seen = new Set();
const unique = candidates.filter((q) => {
  const k = norm(q.q);
  if (!k || seen.has(k)) return false;
  seen.add(k);
  return true;
});

const byClub = {};
for (const q of unique) (byClub[q.club || 'unknown'] ||= []).push(q);

const out = {
  _warning: 'UNVERIFIED. candidates passed zero checks; examiner approvals passed one of two. ZERO ERROR = survive BOTH passes. Do not ship from this file.',
  runDir: dir,
  rescuedAt: null,
  counts: {
    candidates: unique.length,
    byClub: Object.fromEntries(Object.entries(byClub).map(([k, v]) => [k, v.length])),
    verdicts: examined.reduce((a, e) => ((a[`${e.stage}:${e.verdict}`] = (a[`${e.stage}:${e.verdict}`] || 0) + 1), a), {}),
  },
  candidates: byClub,
};
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`candidates rescued: ${unique.length}`);
console.log(`  by club: ${JSON.stringify(out.counts.byClub)}`);
console.log(`  verdicts: ${JSON.stringify(out.counts.verdicts)}`);
console.log(`-> ${outPath}`);
