// process-wave-j.mjs — deterministic post-forge pipeline for Wave J.
// Usage: node process-wave-j.mjs <workflow-output.json-or-.output> <repo-root>
// 1. Parses the workflow result (array of {club, full, count, survivors, prose}).
// 2. Decodes HTML entities in q / o / hint strings.
// 3. Flags SEMANTIC duplicate candidates within each club (same resolved answer
//    + shared distinctive stem tokens) — printed for human review, not auto-dropped.
// 4. Leak scan: within-club (survivor's answer string appears in another
//    survivor's stem) — auto-flagged; plus new-question stems containing
//    existing-bank answers for the same general pool (report only).
// 5. Writes per-club add-questions input JSONs (entities decoded, club+type set)
//    into this scratchpad dir + a summary report. Drop lists applied via DROP env
//    (comma-separated "Club:idx" pairs) after review.

import fs from 'node:fs';
import path from 'node:path';

const [,, outPath, repoRoot] = process.argv;
if (!outPath || !repoRoot) { console.error('usage: node process-wave-j.mjs <output.json> <repo-root>'); process.exit(1); }

const CLUB_FIELD = { Bournemouth: 'Bournemouth', Brentford: 'Brentford', Burnley: 'Burnley', Wolves: 'Wolves', Coventry: 'Coventry City', HullCity: 'Hull City' };

const decode = (s) => String(s ?? '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
  .replace(/&nbsp;/g, ' ');

const norm = (s) => decode(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set('the a an of in on at to for and or which what who whose when did was were is are club season year first most with by from his their'.split(' '));
const tokens = (s) => new Set(norm(s).split(' ').filter(w => w.length > 3 && !STOP.has(w)));

const raw = fs.readFileSync(outPath, 'utf8');
let data = JSON.parse(raw);
if (!Array.isArray(data) && Array.isArray(data.result)) data = data.result;
if (!Array.isArray(data)) { console.error('output is not an array'); process.exit(1); }

// Existing bank answers (for the cross-bank leak report)
const bankSrc = fs.readFileSync(path.join(repoRoot, 'src/questions.js'), 'utf8');
const bankAnswers = new Set();
for (const m of bankSrc.matchAll(/o:(\[[^\]]*\]),\s*a:(\d)/g)) {
  try { const o = JSON.parse(m[1]); const a = +m[2]; if (o[a] && o[a].length > 4) bankAnswers.add(norm(o[a])); } catch {}
}

const DROP = new Set((process.env.DROP || '').split(',').map(s => s.trim()).filter(Boolean));
const report = [];

for (const entry of data) {
  const clubField = CLUB_FIELD[entry.club];
  if (!clubField) { report.push(`SKIP unknown club ${entry.club}`); continue; }
  let qs = (entry.survivors || []).map((q, i) => ({
    _i: i,
    q: decode(q.q), o: q.o.map(decode), a: q.a,
    cat: q.cat, diff: q.diff, hint: decode(q.hint),
    club: clubField, type: 'mcq',
  }));

  // apply reviewed drops
  const before = qs.length;
  qs = qs.filter(q => !DROP.has(`${entry.club}:${q._i}`));

  // semantic-dupe candidates: same resolved answer + >=2 shared distinctive stem tokens
  const dupePairs = [];
  for (let i = 0; i < qs.length; i++) for (let j = i + 1; j < qs.length; j++) {
    if (norm(qs[i].o[qs[i].a]) !== norm(qs[j].o[qs[j].a])) continue;
    const ti = tokens(qs[i].q), tj = tokens(qs[j].q);
    const shared = [...ti].filter(t => tj.has(t));
    if (shared.length >= 2) dupePairs.push({ a: qs[i]._i, b: qs[j]._i, answer: qs[i].o[qs[i].a], shared: shared.slice(0, 5) });
  }

  // within-club leak scan: answer string appears verbatim in another stem
  const leaks = [];
  for (const x of qs) for (const y of qs) {
    if (x._i === y._i) continue;
    const ans = norm(x.o[x.a]);
    if (ans.length > 4 && norm(y.q).includes(ans)) leaks.push({ answerOf: x._i, inStemOf: y._i, answer: x.o[x.a] });
  }

  // cross-bank: new stems containing existing bank answers (report only)
  const bankHits = qs.filter(q => { const nq = norm(q.q); return [...bankAnswers].some(a => a.length > 12 && nq.includes(a)); }).map(q => q._i);

  const hints = qs.filter(q => q.hint && q.hint.length > 4).length;
  report.push(`\n=== ${entry.club} (${clubField}) — ${before} survivors, ${qs.length} after drops ===`);
  report.push(`hint-bearing MCQs: ${hints} (page needs >=15) ${hints >= 15 ? 'OK' : '!! BELOW THRESHOLD'}`);
  report.push(`prose: ${entry.prose ? 'present' : '!! MISSING'}`);
  if (dupePairs.length) { report.push(`SEMANTIC-DUPE candidates (review, add loser to DROP):`); dupePairs.forEach(d => report.push(`  [${d.a}] vs [${d.b}] — answer "${d.answer}" shared:${d.shared.join('/')}`)); }
  if (leaks.length) { report.push(`WITHIN-CLUB LEAKS (drop or reword one side):`); leaks.forEach(l => report.push(`  answer of [${l.answerOf}] ("${l.answer}") appears in stem of [${l.inStemOf}]`)); }
  if (bankHits.length) report.push(`cross-bank stem/answer overlaps (informational): idx ${bankHits.join(',')}`);

  const outFile = path.join(path.dirname(new URL(import.meta.url).pathname), `wave-j-${entry.club.toLowerCase()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(qs.map(({ _i, ...rest }) => rest), null, 1));
  report.push(`wrote ${outFile}`);

  const proseFile = path.join(path.dirname(new URL(import.meta.url).pathname), `wave-j-${entry.club.toLowerCase()}-prose.json`);
  if (entry.prose) fs.writeFileSync(proseFile, JSON.stringify(entry.prose, null, 1));
}

console.log(report.join('\n'));
