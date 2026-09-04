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
// Shared with scripts/audit-leaks.mjs so the wave gate and the bank audit can
// never disagree about what counts as a defect.
import { findLeaks } from './leak-rules.mjs';

const [,, outPath, repoRoot] = process.argv;
if (!outPath || !repoRoot) { console.error('usage: node process-wave-j.mjs <output.json> <repo-root>'); process.exit(1); }

// ⚠️ EDIT PER WAVE: workflow club key -> the QB `club` display name.
// An unmapped key is SKIPPED with a report line rather than guessed — that is
// deliberate, because a wrong club field puts questions in the wrong pack and
// nothing downstream would catch it.
// workflow club key -> the `club` value questions carry in the bank.
// ⚠️ The bank uses FULL names — Coventry City, Hull City, Leeds United —
// so it is 'Leicester City', not 'Leicester'. Getting this wrong silently
// files the questions under a club nothing else references.
const CLUB_FIELD = { WestBrom: 'West Brom', Middlesbrough: 'Middlesbrough', Barcelona: 'Barcelona', Chelsea: 'Chelsea', Celtic: 'Celtic', 'Leeds United': 'Leeds United', Besiktas: 'Besiktas', Juventus: 'Juventus', 'Paris Saint-Germain': 'Paris Saint-Germain', Napoli: 'Napoli' };

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

// ⚠️ THIS SCRIPT ONLY EVER SAW ITS OWN BATCH, AND THAT NEARLY SHIPPED A DUPLICATE.
// Wave Q's ten recovered questions included the Ayresome Park question already
// live on the Middlesbrough page, plus one keying a player named in a live stem.
// Both were caught by hand, which is not a gate. A top-up is the normal shape of
// this work — every club that grows gets one — so the live pack has to be part of
// the comparison, not a thing the operator is trusted to remember.
// Keyed on the `club` field, which is why clubs.mjs must carry the bank's exact
// club value; a mismatch here reads as "no live pack" and silently checks nothing.
const livePack = (clubField) => {
  const out = [];
  for (const line of bankSrc.split('\n')) {
    if (!line.includes(`club:"${clubField}"`) && !line.includes(`club: "${clubField}"`)) continue;
    const mo = line.match(/o:(\[[^\]]*\]),\s*a:(\d)/);
    const mq = line.match(/q:"((?:[^"\\]|\\.)*)"/);
    const mh = line.match(/hint:"((?:[^"\\]|\\.)*)"/);
    if (!mo || !mq) continue;
    try {
      const o = JSON.parse(mo[1]);
      out.push({ q: JSON.parse(`"${mq[1]}"`), o, a: +mo[2], hint: mh ? JSON.parse(`"${mh[1]}"`) : '' });
    } catch { /* a line we cannot parse is not a licence to claim the pack is empty */ }
  }
  return out;
};

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

  // ⚠️ WAS STEM-ONLY AND UNCLASSIFIED until 2026-08-06.
  // Two gaps, both found by running the finished thing rather than reading it:
  //   1. HINTS were never scanned, so an answer sitting in another question's
  //      explanation went unexamined through every wave A-N. Wave N had 27.
  //   2. Every match was reported at equal weight, so "Copa Libertadores" on a
  //      Santos pack looked like a defect. Across the bank that inflated the
  //      figure to 27.6% of questions; classified properly it is 15.8%.
  // Both now live in leak-rules.mjs, shared with the bank-wide audit.
  const allLeaks = findLeaks(qs.map((q) => ({ ...q, o: q.o, a: q.a })), { clubName: clubField });
  const leaks = allLeaks.filter((l) => l.severity === 'strong').map((l) => ({
    answerOf: qs[l.answerOf]?._i ?? l.answerOf,
    inStemOf: qs[l.at]?._i ?? l.at,
    answer: l.answer,
    where: l.where,
  }));
  const weakCount = allLeaks.length - leaks.length;

  // ── AGAINST THE LIVE PACK ───────────────────────────────────────────────
  // Same leak rules, same dupe rule, run over live+new so a top-up is judged
  // against what is already on the page. Only pairs involving a NEW question
  // are reported: the live pack's own internal state is not this run's business.
  // ⚠️ A QUESTION ALREADY INSERTED IS NOT ITS OWN DUPLICATE. Re-running curation
  // on a batch that has since been added to the bank matched every question
  // against its own live copy and reported the whole set as leaking. Exclude
  // exact stem matches: those are this batch, seen from the other side.
  const newStems = new Set(qs.map((q) => norm(q.q)));
  const live = livePack(clubField).filter((l) => !newStems.has(norm(l.q)));
  const liveDupes = [];
  const liveLeaks = [];
  if (live.length) {
    for (const q of qs) {
      for (let k = 0; k < live.length; k++) {
        const l = live[k];
        if (norm(l.o[l.a]) === norm(q.o[q.a])) {
          const shared = [...tokens(q.q)].filter(t => tokens(l.q).has(t));
          if (shared.length >= 2) liveDupes.push({ i: q._i, answer: q.o[q.a], liveQ: l.q.slice(0, 70) });
        }
      }
    }
    const combined = [...live.map((l, k) => ({ ...l, _live: k })), ...qs];
    for (const l of findLeaks(combined, { clubName: clubField })) {
      if (l.severity !== 'strong') continue;
      const src = combined[l.answerOf], dst = combined[l.at];
      const srcNew = src && src._live === undefined, dstNew = dst && dst._live === undefined;
      if (!srcNew && !dstNew) continue;          // both live — not this run's problem
      if (srcNew && dstNew) continue;            // already reported by the within-batch scan
      liveLeaks.push({
        answer: l.answer, where: l.where,
        text: srcNew
          ? `new [${src._i}]'s answer "${l.answer}" appears in the ${l.where} of a LIVE question`
          : `a LIVE answer "${l.answer}" appears in the ${l.where} of new [${dst._i}]`,
      });
    }
  }

  // cross-bank: new stems containing existing bank answers (report only)
  const bankHits = qs.filter(q => { const nq = norm(q.q); return [...bankAnswers].some(a => a.length > 12 && nq.includes(a)); }).map(q => q._i);

  const hints = qs.filter(q => q.hint && q.hint.length > 4).length;
  report.push(`\n=== ${entry.club} (${clubField}) — ${before} survivors, ${qs.length} after drops ===`);
  report.push(`hint-bearing MCQs: ${hints} (page needs >=15) ${hints >= 15 ? 'OK' : '!! BELOW THRESHOLD'}`);
  report.push(`prose: ${entry.prose ? 'present' : '!! MISSING'}`);
  if (dupePairs.length) { report.push(`SEMANTIC-DUPE candidates (review, add loser to DROP):`); dupePairs.forEach(d => report.push(`  [${d.a}] vs [${d.b}] — answer "${d.answer}" shared:${d.shared.join('/')}`)); }
  if (leaks.length) { report.push(`WITHIN-CLUB LEAKS — STRONG (drop or reword one side):`); leaks.forEach(l => report.push(`  answer of [${l.answerOf}] ("${l.answer}") appears in ${l.where} of [${l.inStemOf}]`)); }
  if (weakCount) report.push(`  (${weakCount} weak leak(s) suppressed — competitions, the club itself, topic vocabulary)`);
  report.push(`live pack: ${live.length} question(s) already on the page`);
  if (liveDupes.length) { report.push(`!! DUPLICATES A LIVE QUESTION (drop the new one):`); liveDupes.forEach(d => report.push(`  new [${d.i}] "${d.answer}" — live: ${d.liveQ}`)); }
  if (liveLeaks.length) { report.push(`!! LEAKS AGAINST THE LIVE PACK (drop or reword the NEW side):`); liveLeaks.forEach(l => report.push(`  ${l.text}`)); }
  if (bankHits.length) report.push(`cross-bank stem/answer overlaps (informational): idx ${bankHits.join(',')}`);

  const outFile = path.join(path.dirname(new URL(import.meta.url).pathname), `wave-j-${entry.club.toLowerCase()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(qs.map(({ _i, ...rest }) => rest), null, 1));
  report.push(`wrote ${outFile}`);

  const proseFile = path.join(path.dirname(new URL(import.meta.url).pathname), `wave-j-${entry.club.toLowerCase()}-prose.json`);
  if (entry.prose) fs.writeFileSync(proseFile, JSON.stringify(entry.prose, null, 1));
}

console.log(report.join('\n'));
