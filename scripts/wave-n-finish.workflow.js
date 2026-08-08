export const meta = {
  name: 'wave-n-finish',
  description: 'Finish Wave N: skeptic pass on the 36 unjudged Atalanta questions, then prose',
  phases: [
    { title: 'Skeptic', detail: 'the Atalanta questions the session limit killed' },
    { title: 'Prose', detail: 'SEO copy for both clubs, grounded in survivors' },
  ],
};

// ⚠️ WHY A SECOND SCRIPT INSTEAD OF resumeFromRunId: resume is same-session
// only and the first run died on a usage limit. Everything it produced was
// recovered from disk instead (scripts/forge-harvest.mjs), so this run only has
// to do the work that never happened.
//
// The 36 Atalanta questions here were recovered from the PROMPTS of skeptics
// that were built but never ran — which means they are the post-examiner-fix
// versions, exactly what the dead agents would have judged.
const unjudged = args?.unjudged || {};
const survivorsIn = args?.survivors || {};

const BAR = `
BALL IQ ZERO ERROR BAR.
1. \`a\` IS AN INDEX INTO \`o\`, NOT THE ANSWER TEXT. Resolve o[a] and check the
   RESOLVED STRING.
2. EVERY CLAIM THE STEM MAKES MUST BE TRUE, not just the answer it asks for.
   Two thirds of real defects are a false premise in the stem with a correct
   key. Superlatives ("only", "first", "record") and temporal clauses ("before
   joining", "since X") are where they hide.
3. NO SELF-ANSWERING QUESTIONS — answerable from the stem alone with no
   football knowledge. Reject; they cannot be corrected.
4. Every distractor must satisfy the stem's own qualifier while being
   verifiably wrong.
5. NO OPEN-ENDED PRESENT CLAIMS. Anchor to a date or state the figure.
6. REJECT WHEN UNCERTAIN. There is no volume target worth a wrong answer.
`;

const VERDICT = {
  type: 'object',
  required: ['verdict', 'reason'],
  properties: {
    verdict: { type: 'string', enum: ['keep', 'reject'] },
    reason: { type: 'string' },
  },
};

const PROSE = {
  type: 'object',
  required: ['slug', 'name', 'h1', 'title', 'description', 'intro', 'faq'],
  properties: {
    slug: { type: 'string' }, name: { type: 'string' }, h1: { type: 'string' },
    title: { type: 'string', description: 'Max 60 characters.' },
    description: { type: 'string', description: 'Max 155 characters.' },
    intro: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
    faq: {
      type: 'array', minItems: 4, maxItems: 4,
      items: { type: 'object', required: ['q', 'a'], properties: { q: { type: 'string' }, a: { type: 'string' } } },
    },
  },
};

phase('Skeptic');
const items = Object.entries(unjudged).flatMap(([club, qs]) => qs.map((q, i) => ({ club, i, q })));
log(`${items.length} questions to judge`);

const judged = await parallel(items.map((it) => () =>
  agent(
    `You are the SKEPTIC. Your job is to REFUTE this Ball IQ question about `
    + `${it.club}, which has already passed one fact-check. Assume the examiner `
    + `missed something and go looking for it.\n\n`
    + JSON.stringify(it.q, null, 2)
    + `\n\nThe keyed answer resolves to: ${JSON.stringify(it.q.o[it.q.a])}\n\n`
    + BAR
    + `\nAttack the stem's assertions, not just the answer. Also check whether a `
    + `SECOND option could be defended as correct. Default to "reject" when you `
    + `are not certain — only "keep" if you tried to break it and could not.`,
    { schema: VERDICT, phase: 'Skeptic', label: `skep:${it.club}:${it.i}`, effort: 'high' },
  ).then((v) => ({ ...it, v }))
    // ⚠️ A DEAD AGENT IS NOT A REJECTION. The first run threw on `!v`, which
    // made 36 usage-limit failures show up in the log as "rejected by skeptic"
    // — an infrastructure failure wearing a quality verdict's clothes. It would
    // have read as "Atalanta only produced 2 good questions out of 38". Mark
    // unjudged explicitly so it can never be mistaken for a verdict again.
    .catch(() => ({ ...it, v: null }))));

const kept = new Map(), unjudgedAgain = [];
for (const j of judged.filter(Boolean)) {
  if (!j.v) { unjudgedAgain.push(j); continue; }        // errored — NOT refuted
  if (j.v.verdict !== 'keep') continue;                  // genuinely refuted
  if (!kept.has(j.club)) kept.set(j.club, []);
  kept.get(j.club).push(j.q);
}
for (const [c, qs] of kept) log(`${c}: ${qs.length} kept of ${items.filter((i) => i.club === c).length}`);
if (unjudgedAgain.length) log(`⚠️ ${unjudgedAgain.length} still unjudged (agent errors, NOT rejections)`);

// Merge with what the first run already confirmed.
const final = {};
for (const [club, qs] of Object.entries(survivorsIn)) final[club] = [...qs];
for (const [club, qs] of kept) final[club] = [...(final[club] || []), ...qs];

// Prose is deferred by default. It must be grounded in the FULL survivor set,
// and on a resumed wave that set is only complete after this run — passing the
// already-confirmed survivors in just to hand them back out again would double
// the payload for nothing. Merge on disk, then run prose once.
phase('Prose');
const prose = args?.skipProse ? [] : await parallel(Object.keys(final).map((club) => () =>
  agent(
    `Write the SEO page copy for the Ball IQ ${club} quiz page.\n\n`
    + `⚠️ GROUND EVERY FACTUAL CLAIM IN THIS LIST AND NOTHING ELSE — these are the `
    + `questions that survived a two-pass fact-check. The prose goes live on an `
    + `indexed page and is NOT covered by the question-bank gates.\n\n`
    + JSON.stringify(final[club].map((q) => ({ q: q.q, a: q.o[q.a], hint: q.hint })), null, 2)
    + `\n\nslug: URL slug, lowercase-hyphenated. name: "${club}".\n`
    + `title: MAX 60 characters. description: MAX 155 characters.\n`
    + `intro: exactly 4 paragraphs written for a supporter, not a search engine.\n`
    + `faq: exactly 4 question/answer pairs a fan would actually search.\n\n`
    + `⚠️ NEVER state a number of questions anywhere — binding product rule.\n`
    + `⚠️ Anchor any superlative to a moment ("As of 2026, …") or name the season.`,
    { schema: PROSE, phase: 'Prose', label: `prose:${club}` },
  ).then((p) => ({ club, prose: p }))));

return Object.keys(final).map((club) => ({
  club: club.replace(/\s+/g, ''), clubName: club,
  full: final[club].length, count: final[club].length,
  survivors: final[club],
  prose: prose.filter(Boolean).find((p) => p.club === club)?.prose || null,
  stillUnjudged: unjudgedAgain.filter((u) => u.club === club).map((u) => u.q),
}));
