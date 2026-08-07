// forge-harvest.mjs — recover a club-forge wave from its workflow journal,
// at any point, including mid-run.
//
//   node scripts/forge-harvest.mjs <workflow-run-dir> [out.json]
//
// ⚠️ WHY THIS EXISTS: `resumeFromRunId` IS SAME-SESSION ONLY.
// A forge run is ~130 agents over a couple of hours. If a usage limit ends the
// session, the in-memory run is gone and resume is not available to a fresh
// one — but every completed agent has already been written to disk. Without a
// harvester, hours of verified questions would be unreachable in files we own.
// Alex asked for exactly this, mid-run: "make sure nothing gets lost."
//
// HOW THE RECONSTRUCTION WORKS, and why it is simpler than it looks:
//
//   journal.jsonl        {type:"result", agentId, result}   — the return values
//   agent-<id>.jsonl     first user message = the full prompt
//
// The journal keys agents by a hash of (prompt, opts) and stores no label, so
// the journal alone cannot say WHICH question a verdict belongs to. The agent
// transcript can: the examiner/skeptic prompts embed the question JSON verbatim.
//
// The key insight: a question only reaches the SKEPTIC if the examiner already
// passed it, and the examiner's corrections are applied BEFORE the skeptic sees
// it. So the skeptic's embedded JSON is the final, post-fix version, and
//
//     survivors  ==  every skeptic whose verdict is "keep"
//
// No pairing, no ordering assumptions, no dependence on array indices that
// shift when a stage is retried.
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

const [, , runDir, outPath] = process.argv;
if (!runDir) {
  console.error('usage: node scripts/forge-harvest.mjs <workflow-run-dir> [out.json]');
  process.exit(1);
}

const readJsonl = (p) => readFileSync(p, 'utf8')
  .split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } })
  .filter(Boolean);

// agentId -> return value, for every agent that finished.
const results = new Map();
for (const row of readJsonl(join(runDir, 'journal.jsonl'))) {
  if (row.type === 'result') results.set(row.agentId, row.result);
}

// agentId -> the prompt it was given.
const prompts = new Map();
for (const f of readdirSync(runDir)) {
  if (!f.startsWith('agent-') || !f.endsWith('.jsonl')) continue;
  const id = f.slice('agent-'.length, -'.jsonl'.length);
  const first = readJsonl(join(runDir, f)).find((r) => r.type === 'user');
  const c = first?.message?.content;
  const text = typeof c === 'string' ? c : (Array.isArray(c) ? c.map((p) => p.text || '').join('') : '');
  if (text) prompts.set(id, text);
}

// The prompts name the club in their first line. ⚠️ THE TWO STAGES PUNCTUATE
// DIFFERENTLY: the examiner ends the clause with a full stop ("…about
// Atalanta."), the skeptic continues it with a comma ("…about RB Leipzig,
// which has already passed one fact-check"). Matching only on "." harvested a
// club literally named "RB Leipzig, which has already passed one fact-check".
// Stop at whichever comes first.
const clubOf = (p) => (p.match(/Ball IQ question about ([^.,\n]+)/) || [])[1]?.trim() || null;
// The embedded question is the first {...} block, pretty-printed by the script
// that built the prompt. Take from the first "{" to the last "}" before the
// trailing instructions — the JSON block always ends at "\n\nThe keyed answer".
const questionOf = (p) => {
  const start = p.indexOf('{');
  const end = p.indexOf('\n\nThe keyed answer');
  if (start < 0 || end < 0 || end < start) return null;
  try { return JSON.parse(p.slice(start, end)); } catch { return null; }
};

let skeptics = 0, kept = 0, examiners = 0, generated = 0;
const byClub = new Map();

for (const [id, prompt] of prompts) {
  if (prompt.startsWith('Write ') && prompt.includes('multiple-choice')) {
    generated += results.get(id)?.questions?.length || 0;
    continue;
  }
  const isSkeptic = prompt.startsWith('You are the SKEPTIC');
  if (prompt.startsWith('You are the EXAMINER')) examiners++;
  if (!isSkeptic) continue;
  skeptics++;

  const verdict = results.get(id);
  if (!verdict) continue;                       // still running — not a rejection
  if (verdict.verdict !== 'keep') continue;     // refuted; correctly dropped

  const club = clubOf(prompt);
  const q = questionOf(prompt);
  if (!club || !q) { console.error(`  ! could not parse skeptic ${id}`); continue; }
  if (!byClub.has(club)) byClub.set(club, []);
  // A retried agent can appear twice. Dedupe on the stem.
  if (!byClub.get(club).some((x) => x.q === q.q)) { byClub.get(club).push(q); kept++; }
}

console.log(`\nrun dir      ${runDir}`);
console.log(`agents       ${prompts.size} started · ${results.size} finished`);
console.log(`generated    ${generated} raw questions`);
console.log(`examined     ${examiners} · skeptic pass ${skeptics}`);
console.log(`SURVIVORS    ${kept}\n`);
for (const [club, qs] of byClub) console.log(`  ${club.padEnd(14)} ${qs.length}`);

// Emitted in the shape forge-curate.mjs already consumes, so a harvested
// partial run rejoins the normal pipeline with no special-casing.
const out = [...byClub].map(([club, survivors]) => ({
  club: club.replace(/\s+/g, ''), clubName: club,
  full: survivors.length, count: survivors.length, survivors, prose: null,
}));

const dest = resolve(outPath || 'scripts/forge-harvest-out.json');
writeFileSync(dest, JSON.stringify(out, null, 1), 'utf8');
console.log(`\n-> ${dest}`);
console.log('⚠️  prose is null on a harvest — the prose agents run last. Re-forge');
console.log('    prose from the survivors before shipping SEO pages.\n');
