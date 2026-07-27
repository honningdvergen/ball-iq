// audit-harvest.mjs — reconstruct question-audit findings from a workflow
// journal, WITHOUT needing the workflow run to have finished.
//
//   node scripts/audit-harvest.mjs <journal.jsonl> [outDir]
//
// WHY THIS EXISTS
// The bank audit is a long multi-agent run and we reliably hit the usage limit
// partway through. The workflow only returns its consolidated result if it
// reaches the end, so a run killed at 90% used to strand every completed
// agent's work inside a transcript nobody parses. That is wasted money and,
// worse, wasted wall-clock on the one task Alex called "EVERYTHING to us".
//
// The journal records one {"type":"result", key, agentId, result} line per
// COMPLETED agent, written as it goes. So the findings are always recoverable:
// run this at any point — mid-run, after a limit kill, or after success — and
// it emits the same consolidated output the workflow would have produced.
//
// Output (written to outDir, default scripts/../.audit/):
//   findings-serious.json   — flags the screener rated serious, pending verify
//   findings-cosmetic.json  — cosmetic flags (stale phrasing, soft distractors)
//   verdicts.json           — verifier verdicts, split confirmed / rejected
//   summary.txt             — human-readable counts + coverage
//
// Nothing here mutates src/questions.js. Applying fixes stays a separate,
// deliberate step gated on a high-confidence verdict.

import fs from 'node:fs';
import path from 'node:path';

const [, , journalPath, outDirArg] = process.argv;
if (!journalPath) {
  console.error('usage: node scripts/audit-harvest.mjs <journal.jsonl> [outDir]');
  process.exit(1);
}
const outDir = outDirArg || path.join(process.cwd(), '.audit');
fs.mkdirSync(outDir, { recursive: true });

const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n');

const screenResults = [];   // { flags:[], screened:n }
const verdicts = [];        // verifier outputs
let started = 0, results = 0, unparsed = 0;

for (const line of lines) {
  let j;
  try { j = JSON.parse(line); } catch { unparsed++; continue; }
  if (j.type === 'started') { started++; continue; }
  if (j.type !== 'result') continue;
  results++;

  // The agent's return value may be an object (schema-validated) or a string.
  let r = j.result;
  if (typeof r === 'string') { try { r = JSON.parse(r); } catch { /* free text */ } }
  if (!r || typeof r !== 'object') continue;

  // Screener output: { flags: [...], screened: n }
  if (Array.isArray(r.flags)) {
    screenResults.push({ key: j.key, flags: r.flags, screened: r.screened || 0 });
    continue;
  }
  // Verifier output: { id, confirmed, confidence, truth, reasoning, suggested_* }
  if (typeof r.confirmed === 'boolean' && r.id) {
    verdicts.push({ key: j.key, ...r });
  }
}

const allFlags = screenResults.flatMap(s => s.flags);
const serious = allFlags.filter(f => f.severity === 'serious');
const cosmetic = allFlags.filter(f => f.severity !== 'serious');
const screenedTotal = screenResults.reduce((s, r) => s + r.screened, 0);

// A verdict only counts as actionable when the verifier CONFIRMED the defect
// AND was highly confident. Everything else is for human eyes — the failure
// mode we most want to avoid is "fixing" a correct question into a wrong one.
const confirmedHigh = verdicts.filter(v => v.confirmed && v.confidence === 'high');
const confirmedSoft = verdicts.filter(v => v.confirmed && v.confidence !== 'high');
const rejected = verdicts.filter(v => !v.confirmed);

const byKind = (arr) => arr.reduce((m, f) => { m[f.kind] = (m[f.kind] || 0) + 1; return m; }, {});

fs.writeFileSync(path.join(outDir, 'findings-serious.json'), JSON.stringify(serious, null, 1));
fs.writeFileSync(path.join(outDir, 'findings-cosmetic.json'), JSON.stringify(cosmetic, null, 1));
fs.writeFileSync(path.join(outDir, 'verdicts.json'), JSON.stringify(
  { confirmed_high: confirmedHigh, confirmed_needs_review: confirmedSoft, rejected }, null, 1));

const summary = [
  `Ball IQ bank audit — harvested from journal`,
  `journal: ${journalPath}`,
  ``,
  `COVERAGE`,
  `  agents started:            ${started}`,
  `  agents with a result:      ${results}`,
  `  questions screened:        ${screenedTotal}`,
  ``,
  `SCREENER FLAGS (not yet ground truth)`,
  `  serious:                   ${serious.length}  ${JSON.stringify(byKind(serious))}`,
  `  cosmetic:                  ${cosmetic.length}  ${JSON.stringify(byKind(cosmetic))}`,
  ``,
  `VERIFIER VERDICTS (web-researched second opinion)`,
  `  confirmed, high confidence: ${confirmedHigh.length}   <- safe to act on`,
  `  confirmed, needs review:    ${confirmedSoft.length}   <- human call`,
  `  screener flag REJECTED:     ${rejected.length}   <- question was fine`,
  ``,
  rejected.length && serious.length
    ? `  screener false-positive rate so far: ${Math.round(100 * rejected.length / verdicts.length)}%`
    : `  (verification incomplete — treat serious flags as unproven)`,
  ``,
  `Wrote findings-serious.json, findings-cosmetic.json, verdicts.json to ${outDir}`,
].join('\n');

fs.writeFileSync(path.join(outDir, 'summary.txt'), summary + '\n');
console.log(summary);
