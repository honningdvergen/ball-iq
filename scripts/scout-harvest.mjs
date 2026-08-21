// scout-harvest.mjs — recover a scouting-report panel from its workflow
// journal, at any point, including mid-run.
//
//   node scripts/scout-harvest.mjs <workflow-run-dir> [out.json]
//
// ⚠️ WHY THIS EXISTS: `resumeFromRunId` IS SAME-SESSION ONLY. A full panel is
// ~17 agents of deep review. If a usage limit ends the session, the in-memory
// run is gone and resume is unavailable to a fresh one — but every completed
// agent has already been written to disk. Alex asked for exactly this, at the
// moment of launch: "if we hit the usage limit halfway through just make sure
// no part of the scouting report is lost."
//
// HOW THE RECONSTRUCTION WORKS
//
//   journal.jsonl      {type:"result", agentId, result}  — the return values
//   agent-<id>.jsonl   first user message = the full prompt
//
// The journal keys agents by a hash of (prompt, opts) and stores no label, so
// the journal alone cannot say WHICH area a review belongs to. The transcript
// can — every panel prompt is required to open with a marker line:
//
//     AREA::<slug>
//
// so pairing is a regex, not an ordering assumption. Stage retries, partial
// phases and out-of-order completion are all fine: an area is present if its
// marker appears in a transcript whose agentId has a result in the journal.
//
// Emits BOTH the machine copy (out.json) and a readable digest to stdout, so a
// half-finished run is still worth something to a human without further tooling.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const dir = process.argv[2];
const out = process.argv[3] || 'docs/scout-panel-harvested.json';
if (!dir || !existsSync(dir)) {
  console.error('usage: node scripts/scout-harvest.mjs <workflow-run-dir> [out.json]');
  console.error('the run dir is printed by the Workflow tool as journalDir');
  process.exit(1);
}

const lines = (p) => {
  try {
    return readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
};

// 1. results, keyed by agentId
const results = new Map();
for (const row of lines(join(dir, 'journal.jsonl'))) {
  if (row.type === 'result' && row.agentId) results.set(row.agentId, row.result);
}

// 2. area markers, from each agent's own transcript
const areaOf = new Map();
for (const f of readdirSync(dir).filter((f) => /^agent-.*\.jsonl$/.test(f))) {
  const id = f.replace(/^agent-/, '').replace(/\.jsonl$/, '');
  const body = readFileSync(join(dir, f), 'utf8');
  const m = body.match(/AREA::([a-z0-9-]+)/i);
  if (m) areaOf.set(id, m[1]);
}

// 3. pair them
const recovered = [];
for (const [id, result] of results) {
  const area = areaOf.get(id) || null;
  let value = result;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { /* keep the prose */ }
  }
  recovered.push({ agentId: id, area, result: value });
}

const named = recovered.filter((r) => r.area);
const unnamed = recovered.filter((r) => !r.area);

writeFileSync(out, JSON.stringify({
  harvestedFrom: dir,
  recoveredAt: new Date().toISOString(),
  counts: { total: recovered.length, named: named.length, unnamed: unnamed.length },
  reviews: named,
  unattributed: unnamed,
}, null, 1));

console.log(`recovered ${recovered.length} agent result(s) → ${out}`);
console.log(`  ${named.length} attributed to an area, ${unnamed.length} unattributed`);
if (named.length) {
  console.log('\nareas recovered:');
  for (const r of named) {
    const g = r.result?.grade_10 ?? r.result?.grade ?? '?';
    const v = (r.result?.verdict || r.result?.summary || '').toString().slice(0, 90);
    console.log(`  ${String(g).padStart(2)}  ${r.area.padEnd(26)} ${v}`);
  }
}
if (unnamed.length) {
  console.log('\n⚠️  unattributed results (no AREA:: marker — synthesis/critic stages,');
  console.log('    or a prompt that forgot the marker). They are in the JSON under');
  console.log('    "unattributed" and are NOT lost.');
}
