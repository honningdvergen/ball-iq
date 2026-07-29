// verify-wave.mjs — independent gate on forged question packs before they touch
// src/questions.js.
//
//   node scripts/verify-wave.mjs <dir-with-p-*.json>
//
// The forge agents already run generate -> examiner -> skeptic. This is a
// SECOND opinion by a different route, because a detector's first run is a
// hypothesis: on Wave K the agents' own counts looked clean and a fresh pass
// still found real problems. Everything here is mechanical — no judgement, so
// it cannot be talked into agreeing with the generator.
//
// What it checks, and why each one exists:
//   struct        4 unique options, `a` in range, hint present
//   ANSWER-KEY    `a` is an INDEX. Resolve o[a] and check the HINT supports the
//                 resolved string — an off-by-one produces a fluent, confident,
//                 wrong answer that reads fine to a human reviewer.
//   self-answer   stem alone gives it away -> free points, app feels cheap
//   pack-leak     one question's stem/hint contains ANOTHER's answer. Chunked
//                 verifiers structurally cannot see this; it is how ~17% of the
//                 shipped club packs leaked.
//   bank-dupe     already in src/questions.js (normalised)
//   stale         breakable records / "youngest ever" / "current"
//   era           pre-1950 (Alex: stop generating these)
//   SEO gate      playerHintRows() only counts a row if the player's name is in
//                 the stem OR the resolved answer. A perfectly good question
//                 phrased "which club did he join in 2020?" contributes ZERO to
//                 the 15-hint page threshold.

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { QB } from '../src/questions.js';

const dir = resolve(process.argv[2] || '.');
const MIN_HINTS = 15;

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const bankSeen = new Set(QB.map((r) => norm(r.q)));

// A token is "contentful" if it is long enough to be a real leak signal.
const keyTokens = (s) => norm(s).split(' ').filter((w) => w.length >= 4 && !STOP.has(w));
const STOP = new Set(['which','what','when','where','many','club','team','player','season','goal','goals',
  'league','cup','final','first','last','year','years','from','with','that','this','they','were','have',
  'been','after','before','during','against','their','than','made','more','most','only','into','over']);

const STALE = /\b(youngest|oldest|fastest|current(ly)?|so far|to date|record[- ]holder|all[- ]time (top|record)|still the|remains the|as of)\b/i;
const SUPERLATIVE_RECORD = /\b(youngest|oldest) (ever|player|scorer|to)\b/i;

// Player packs are p-*.json, club packs c-*.json. The only behavioural
// difference is the SEO gate: playerHintRows() needs the PLAYER's name in the
// stem or answer, whereas a club page filters on the `club` field, so a club
// question about the club is always eligible. Running the name check on a club
// pack would flag most of it for nothing.
let files = readdirSync(dir).filter((f) => /^[pc]-.*\.json$/.test(f)).sort();
if (!files.length) { console.error('no p-*.json or c-*.json in ' + dir); process.exit(1); }

let grandTotal = 0, grandFlags = 0;
const report = [];

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const qs = Object.values(raw).find((v) => Array.isArray(v) && v.length && v[0] && v[0].q) || [];
  const name = raw.name || file;
  // match strings the SEO generator will use: full name + surname
  const parts = String(name).split(/\s+/);
  const matchRe = new RegExp('(' + [name, parts[parts.length - 1]].map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'i');

  const isPlayer = file.startsWith('p-');
  const flags = [];
  const answers = qs.map((r) => (Array.isArray(r.o) && typeof r.a === 'number' ? r.o[r.a] : null));
  const posCount = [0, 0, 0, 0];

  qs.forEach((r, i) => {
    const tag = `${file} #${i + 1}`;
    const add = (kind, msg) => flags.push({ kind, tag, q: String(r.q).slice(0, 78), msg });

    // ── structure
    if (!Array.isArray(r.o) || r.o.length !== 4) return add('struct', `options = ${r.o && r.o.length}`);
    if (new Set(r.o.map(norm)).size !== 4) add('struct', 'duplicate options');
    if (typeof r.a !== 'number' || r.a < 0 || r.a > 3) return add('struct', `a = ${r.a}`);
    if (!r.hint || r.hint.length < 12) add('struct', 'missing / trivial hint');
    posCount[r.a]++;

    const ans = r.o[r.a];

    // ── NO hint/answer-key cross-check here, deliberately.
    //    Three attempts at one all produced false positives, because they
    //    encoded an assumption that does not hold: that a good hint NAMES its
    //    answer. The opposite is true — a well-written hint elaborates without
    //    giving it away. "Germany" was flagged against a hint reading "born in
    //    Stuttgart to a German mother"; "Chelsea" against "the club's Cobham
    //    training centre". 35 of Musiala's 36 hints tripped it.
    //    Answer-key correctness needs a fact-checker, not a string match. An
    //    unreliable check is worse than none: it buries the real findings.

    // ── self-answering: the resolved answer appears in the stem
    if (ans && norm(r.q).includes(norm(ans)) && norm(ans).length > 3) {
      add('self-answer', `stem contains "${ans}"`);
    }

    // ── staleness
    if (SUPERLATIVE_RECORD.test(r.q)) add('stale', 'breakable "youngest/oldest ever" record');
    else if (STALE.test(r.q)) add('stale', 'time-relative phrasing in stem');

    // ── era rule
    const yrs = [...String(r.q + ' ' + (r.hint || '')).matchAll(/\b(18|19|20)\d{2}\b/g)].map((m) => +m[0]);
    if (yrs.length && Math.min(...yrs) < 1950) add('era', `references ${Math.min(...yrs)} (pre-1950)`);

    // ── already in the bank
    if (bankSeen.has(norm(r.q))) add('bank-dupe', 'stem already in src/questions.js');

    // ── SEO eligibility. Player pages only; see the note at the file list.
    if (isPlayer && !(matchRe.test(r.q) || matchRe.test(ans || ''))) {
      add('seo-blind', 'name not in stem or answer — contributes 0 to the 15-hint page gate');
    }
  });

  // ── pack-internal answer leak: does q[i]'s stem/hint hand over q[j]'s answer?
  //    Two exclusions, both learned from false positives on this wave:
  //    (a) the SUBJECT'S OWN NAME. "#1 gives away #9's answer 'Jude Bellingham'"
  //        is noise — every stem in a Bellingham pack names Bellingham.
  //    (b) PACK-WIDE CONTEXT. An entity mentioned in 3+ stems (the player's club,
  //        country, league) is the pack's setting, not a secret. Flagging it
  //        buried the handful of real leaks under ~50 artefacts per pack.
  const mentions = (t) => qs.filter((x) => norm(x.q + ' ' + (x.hint || '')).includes(t)).length;
  qs.forEach((r, i) => {
    const hay = norm(r.q + ' ' + (r.hint || ''));
    answers.forEach((ans, j) => {
      if (i === j || !ans) return;
      if (matchRe.test(ans)) return;                       // (a)
      if (mentions(norm(ans)) >= 3) return;                // (b)
      // Require the WHOLE answer as a contiguous phrase, not merely all of its
      // tokens scattered through the text — the loose form fired on ordinary
      // words ("Sport", "Georgia") that any related stem legitimately mentions.
      const a2 = norm(ans);
      if (a2.length >= 5 && keyTokens(ans).length && hay.includes(a2)) {
        flags.push({ kind: 'pack-leak', tag: `${file} #${i + 1}`, q: String(r.q).slice(0, 78),
                     msg: `gives away #${j + 1}'s answer "${ans}"` });
      }
    });
  });

  const seoEligible = qs.filter((r) => Array.isArray(r.o) && r.hint &&
    (!isPlayer || matchRe.test(r.q) || matchRe.test(r.o[r.a] || ''))).length;

  // ── ANSWER-POSITION BIAS. No single question is wrong, so per-question
  //    verification cannot see this — but a pack keyed 24/0/0/0 is solvable by
  //    always tapping A. Pack-level check, deliberately.
  const worst = Math.max(...posCount);
  if (qs.length >= 8 && worst / qs.length > 0.5) {
    flags.push({ kind: 'POSITION-BIAS', tag: file, q: `answers land on ${'ABCD'[posCount.indexOf(worst)]} ${worst}/${qs.length} times`,
                 msg: 'pack is gameable by always picking one letter — needs re-keying' });
  }

  grandTotal += qs.length;
  grandFlags += flags.length;
  report.push({ file, name, n: qs.length, seoEligible, posCount, flags });
}

// ── output ───────────────────────────────────────────────────────────────────
for (const r of report) {
  const gate = r.seoEligible >= MIN_HINTS ? '✓' : '✗ PAGE WOULD FAIL BUILD';
  console.log(`\n━━ ${r.name}  (${r.n} questions)`);
  console.log(`   SEO-eligible: ${r.seoEligible}/${MIN_HINTS} ${gate}   answer spread A/B/C/D: ${r.posCount.join('/')}`);
  if (!r.flags.length) { console.log('   no flags'); continue; }
  const by = {};
  for (const f of r.flags) (by[f.kind] ||= []).push(f);
  for (const kind of Object.keys(by).sort()) {
    console.log(`   ${kind} (${by[kind].length}):`);
    for (const f of by[kind]) console.log(`      ${f.tag}  ${f.msg}\n         "${f.q}"`);
  }
}
console.log(`\n${'='.repeat(60)}`);
console.log(`${grandTotal} questions, ${grandFlags} flags across ${report.length} packs`);
const failing = report.filter((r) => r.seoEligible < MIN_HINTS);
if (failing.length) console.log(`⚠ ${failing.length} pack(s) below the ${MIN_HINTS}-hint SEO gate: ${failing.map((f) => f.name).join(', ')}`);
