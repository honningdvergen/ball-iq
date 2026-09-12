export const meta = {
  name: 'club-pack-forge',
  description: 'Forge one club quiz pack at ~7 agents instead of ~71, with the zero-error bar intact',
  phases: [
    { title: 'Generate', detail: 'two lenses — heritage and modern' },
    { title: 'Examine', detail: 'batched fact-check, high effort' },
    { title: 'Skeptic', detail: 'batched adversarial refutation, high effort' },
    { title: 'Prose', detail: 'page copy grounded only in survivors' },
  ],
};

// ⚠️ WHY THIS EXISTS. The previous forge spent ~7.8M tokens on ONE club. The
// cause was structural, not incidental: it ran ONE AGENT PER QUESTION for the
// examiner AND one per question for the skeptic, both at effort:high. For a
// club with 34 questions after dedupe that is 68 high-effort fact-checking
// agents — about 6M tokens before generation or prose.
//
// Worse, the deterministic curation (scripts/forge-curate.mjs) ran AFTERWARDS,
// so the ~8 semantic duplicates every wave produces were each fact-checked
// twice at high effort and then deleted for free.
//
// Two changes, and NOTHING is dropped from the quality bar:
//   1. Curate deterministically FIRST, in plain JS, for zero tokens.
//   2. Batch the verifiers. Both passes still run, both still at effort:high,
//      and both still return a verdict PER QUESTION — they just do not each
//      get their own context window.
//
// 2 generation + 2 examiner + 2 skeptic + 1 prose = 7 agents per club.
//
// ⚠️ BOTH PASSES STAY. The skeptic is not redundant with the examiner: it is
// told the examiner's reasoning and instructed to assume a miss. Dropping it
// would be the one saving that costs correctness, and the bar is zero errors
// read by 25k football obsessives under the app's name.

const club = args?.club || args;
if (!club || typeof club !== 'string') throw new Error('pass { club: "Middlesbrough" }');
const era = args?.era || 'the club BEFORE its modern peak — founding, its ground, early trophies and near-misses, cult players, promotions and relegations, the managers who built the identity';
const modern = args?.modern || 'the last 25 years — league finishes, cup runs, record signings and sales, managers, the players fans argue about';

const BAR = `
BALL IQ ZERO ERROR BAR — these are ship gates, not style preferences.

1. \`a\` IS AN INDEX INTO \`o\`, NOT THE ANSWER TEXT. Off-by-one produces a
   fluent, confident, wrong answer. Resolve o[a] and check the RESOLVED STRING.
2. EVERY CLAIM THE STEM MAKES MUST BE TRUE, not just the answer it asks for.
   This is the most common defect by far: right question, right key, and the
   stem asserts something untrue on the way there. Superlatives ("only",
   "first", "record") and temporal clauses ("before joining", "since X") are
   where they hide.
3. NO SELF-ANSWERING QUESTIONS. Answerable from the stem alone with no football
   knowledge = reject. Not wrong, just pointless, and it makes the app cheap.
4. DISTRACTORS ARE DELETION-GRADE. Every wrong option must satisfy the stem's
   own qualifier while being verifiably wrong. No near-name twins of the answer,
   nobody who was not active in the era the stem names.
5. NO OPEN-ENDED PRESENT CLAIMS. "Who holds the record for X" goes silently
   false the day the record falls. Anchor it, state the figure, or name the season.
6. TARGET ERA 1990-2020, weighted to what fans alive today watched.
7. REJECT WHEN UNCERTAIN. A false "this is wrong" that flips a correct answer is
   worse than dropping a good one. Contested or unverifiable = drop it. There is
   no volume target worth a wrong answer.
8. THE ANSWER MUST NEVER BE "${club}". This pack sits on the ${club} page, so
   keying the club itself is a free point for anyone who read the button they
   pressed. Ask for the OTHER club in the story.
9. ANYTHING AFTER JANUARY 2026 NEEDS TWO SOURCES OR IT IS FABRICATION.
`;

const GEN = {
  type: 'object', required: ['questions'],
  properties: { questions: { type: 'array', items: {
    type: 'object', required: ['q', 'o', 'a', 'diff', 'hint'],
    properties: {
      q: { type: 'string', description: 'The stem. Every factual claim inside it must be true.' },
      o: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
      a: { type: 'integer', minimum: 0, maximum: 3, description: 'INDEX into o of the correct option — not the answer text.' },
      diff: { type: 'string', enum: ['easy', 'medium', 'hard'] },
      hint: { type: 'string', description: 'One or two sentences of explanation shown after answering. Required.' },
    } } } },
};

// Per-question verdicts, so a batch is still N independent judgements.
const BATCH = {
  type: 'object', required: ['verdicts'],
  properties: { verdicts: { type: 'array', items: {
    type: 'object', required: ['i', 'verdict', 'reason'],
    properties: {
      i: { type: 'integer', description: 'The index shown beside the question in the prompt.' },
      verdict: { type: 'string', enum: ['keep', 'reject', 'fix'] },
      reason: { type: 'string', description: 'One sentence. For reject, name the false claim.' },
      fixed: { type: 'object', properties: {
        q: { type: 'string' }, o: { type: 'array', items: { type: 'string' } },
        a: { type: 'integer' }, hint: { type: 'string' } } },
    } } } },
};

phase('Generate');
const lenses = await parallel([
  () => agent(`Write 18 multiple-choice football quiz questions about ${club}, on ${era}.\n${BAR}\nReturn JSON only.`,
    { schema: GEN, label: `gen:heritage`, phase: 'Generate' }),
  () => agent(`Write 18 multiple-choice football quiz questions about ${club}, on ${modern}.\n${BAR}\nReturn JSON only.`,
    { schema: GEN, label: `gen:modern`, phase: 'Generate' }),
]);
let qs = lenses.filter(Boolean).flatMap((r) => r.questions || []);
log(`${qs.length} generated`);

// ── deterministic curation: zero tokens, runs BEFORE anything expensive ──────
const dec = (s) => String(s).replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const norm = (s) => dec(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const toks = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 3));
qs = qs.map((q) => ({ ...q, q: dec(q.q), o: q.o.map(dec), hint: dec(q.hint) }))
  .filter((q) => Array.isArray(q.o) && q.o.length === 4 && q.a >= 0 && q.a < 4 && q.q && q.hint);

const before = qs.length;
const keep = [];
for (const q of qs) {
  const ans = norm(q.o[q.a]);
  // (a) the two lenses re-asking one fact in different words — same answer plus
  //     a heavily shared stem. ~6-8 pairs every wave.
  const dupe = keep.some((k) => {
    if (norm(k.o[k.a]) !== ans) return false;
    const A = toks(k.q), B = toks(q.q);
    let n = 0; for (const t of A) if (B.has(t)) n++;
    return n >= Math.min(A.size, B.size) * 0.5;
  });
  if (dupe) continue;
  // (b) mutual-leak event pairs — the lenses ask one event from opposite
  //     directions, so each answer sits in the other's stem.
  const leak = keep.some((k) => norm(k.q).includes(ans) && norm(q.q).includes(norm(k.o[k.a])));
  if (leak) continue;
  keep.push(q);
}
qs = keep;
log(`${before - qs.length} dropped deterministically (dupes + mutual leaks) — ${qs.length} go to verification`);

// (c) answer leaks ACROSS survivors: an answer appearing verbatim in another
//     stem. Reported to the examiner rather than dropped, because rewording the
//     incidental mention preserves the fact.
const leaks = [];
qs.forEach((q, i) => qs.forEach((k, j) => {
  if (i !== j && norm(k.q).includes(norm(q.o[q.a])) && norm(q.o[q.a]).length > 6) leaks.push([j, i]);
}));
const leakNote = leaks.length
  ? `\n\nANSWER LEAKS FOUND DETERMINISTICALLY — in each pair the second question's answer appears verbatim in the first's stem. Reword the STEM to strip the incidental mention (that preserves the fact); do not simply reject: ${JSON.stringify(leaks)}`
  : '';

// ⚠️ ONE AGENT OVER THE WHOLE PACK, NOT TWO OVER HALF EACH — measured, not
// guessed. The first run split each stage in two and both halves returned ZERO
// rejections across 70 verdicts. An independent verifier then read the same 35
// questions in a SINGLE pass, spent 110k tokens and 43 searches, and found a
// defect both halves had missed (a hint dating Pizzuti's appointment to 1966;
// he took charge on 19 September 1965). One context sees the whole set, keeps
// one standard across it, and can spot a claim repeated between questions —
// two half-contexts each grade 17 in isolation and both drift permissive.
const batches = [qs];
const half = 0;
const show = (b, off) => b.map((q, n) => `#${off + n}  ${JSON.stringify(q)}\n     resolved answer: ${JSON.stringify(q.o[q.a])}`).join('\n\n');

phase('Examine');
const examined = await parallel(batches.map((b, bi) => () => {
  const off = bi * half;
  return agent(
    `You are the EXAMINER. Fact-check every question below about ${club}. There are ${b.length}; return one verdict for EACH, using the # index shown.\n\n${show(b, off)}\n\n${BAR}
For each question check, in order: (a) is the resolved answer factually correct; (b) is EVERY claim in the stem true; (c) is it self-answering; (d) does every distractor satisfy the stem's qualifier while being verifiably wrong; (e) is the hint true.
Also: if exactly one option's NAME FORMAT differs from the others (a single word among full names, or the reverse) and that odd one is the keyed answer, reword one distractor to match the answer's shape — measured on the live bank, that tell hands away 29% of such questions.${leakNote}
Verify facts you are not certain of. Do not spend a search on a fact you know cold — spend them where the stem makes a superlative or temporal claim.
Return "keep" to ship as-is, "fix" with a corrected version for a specific wording or option, "reject" if the underlying fact is wrong, contested, unverifiable, or the question answers itself.`,
    { schema: BATCH, label: `exam:${bi + 1}`, phase: 'Examine', effort: 'high' },
  ).then((v) => ({ off, b, v }));
}));

const afterExam = [];
for (const r of examined.filter(Boolean)) {
  for (const vd of r.v?.verdicts || []) {
    const q = r.b[vd.i - r.off];
    if (!q || vd.verdict === 'reject') continue;
    afterExam.push({ q: vd.verdict === 'fix' && vd.fixed ? { ...q, ...vd.fixed } : q, why: vd.reason });
  }
}
log(`${afterExam.length} survived the examiner`);

phase('Skeptic');
const sHalf = 0;
const sBatches = [afterExam];
const skepticated = await parallel(sBatches.map((b, bi) => () => {
  const off = bi * sHalf;
  return agent(
    `You are the SKEPTIC. Every question below about ${club} has already passed one fact-check that returned ZERO rejections — which is not what this bank's history looks like, so treat the examiner as having been permissive and go looking for what it let through. Do not defer to it. The defect this stage exists to catch is small and specific: a date, a number or a name inside a HINT, where the question and its keyed answer are both sound. Check every date and figure in every hint against a source, not against your own recall. There are ${b.length}; return one verdict for EACH by its # index.\n\n`
    + b.map((x, n) => `#${off + n}  ${JSON.stringify(x.q)}\n     resolved answer: ${JSON.stringify(x.q.o[x.q.a])}\n     examiner said: ${x.why}`).join('\n\n')
    + `\n\n${BAR}
The examiner's most likely miss is a FALSE PREMISE IN THE STEM with a correct key — two thirds of real defects are that. Attack the stem's assertions, not just the answer. Also check whether a SECOND option could be defended as correct.
Default to "reject" when you are not certain. Only "keep" if you tried to break it and could not.`,
    { schema: BATCH, label: `skep:${bi + 1}`, phase: 'Skeptic', effort: 'high' },
  ).then((v) => ({ off, b, v }));
}));

const survivors = [];
for (const r of skepticated.filter(Boolean)) {
  for (const vd of r.v?.verdicts || []) {
    const x = r.b[vd.i - r.off];
    // ⚠️ 'fix' IS A PASS, NOT A REJECTION. Treating it as one threw away ten
    // verified Middlesbrough questions on 2026-09-04.
    if (!x || vd.verdict === 'reject') continue;
    survivors.push(vd.verdict === 'fix' && vd.fixed ? { ...x.q, ...vd.fixed } : x.q);
  }
}
log(`${survivors.length} double-survivors`);

phase('Prose');
const prose = survivors.length ? await agent(
  `Write the SEO page copy for a ${club} quiz page. Ground EVERY factual statement in the verified questions below and nothing else — do not add facts from your own knowledge, which have not been through the fact-check.\n\n`
  + JSON.stringify(survivors.map((q) => ({ q: q.q, a: q.o[q.a], hint: q.hint })), null, 2)
  + `\n\nReturn JSON: { "h1", "title" (<=60 chars), "description" (<=155), "intro" (4 paragraphs), "faq" (4 x {q,a}) }.`,
  { label: 'prose', phase: 'Prose' },
) : null;

return { club, generated: before, verified: survivors.length, questions: survivors, prose };
