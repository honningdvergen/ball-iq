export const meta = {
  name: 'wave-n-forge',
  description: 'Forge club packs for RB Leipzig + Atalanta to the ZERO ERROR bar',
  whenToUse: 'Ball IQ club expansion wave — generate, examine, skeptic, only double-survivors ship',
  phases: [
    { title: 'Generate', detail: 'two lenses per club — heritage and modern' },
    { title: 'Examine', detail: 'fact-check every question, stem claims included' },
    { title: 'Skeptic', detail: 'adversarial second pass — reject when uncertain' },
    { title: 'Prose', detail: 'SEO page copy grounded ONLY in survivor facts' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// The two clubs. `target` is deliberately UNEVEN.
//
// RB Leipzig were founded in 2009. The skill's rule is explicit: thin-history
// clubs get FEWER questions, never padding, because a generator asked for
// volume it cannot source starts inventing. Leipzig has ~17 years of top-level
// material (the climb, Nagelsmann, the 2022/2023 Pokals, Werner/Nkunku/Olmo)
// and that is genuinely enough for a pack — but not for the same count as a
// club founded in 1907. Both still clear MIN_HINTS (15) for the SEO page.
// ─────────────────────────────────────────────────────────────────────────────
const CLUBS = [
  {
    key: 'Leipzig',
    name: 'RB Leipzig',
    target: 16,
    facts: 'Founded 2009 and promoted through five divisions; first Bundesliga season 2016-17 (2nd place); '
      + 'Champions League semi-final 2020; DFB-Pokal winners 2022 and 2023; Red Bull Arena (formerly Zentralstadion); '
      + 'coaches Rangnick, Hasenhuttl, Nagelsmann, Marsch, Tedesco, Rose; players Timo Werner, Naby Keita, '
      + 'Emil Forsberg, Yussuf Poulsen, Dayot Upamecano, Dani Olmo, Christopher Nkunku, Dominik Szoboszlai, Josko Gvardiol.',
  },
  {
    key: 'Atalanta',
    name: 'Atalanta',
    target: 20,
    facts: 'Founded 1907 in Bergamo; Gewiss Stadium / Stadio Atleti Azzurri d\'Italia; Coppa Italia winners 1963; '
      + 'Cup Winners\' Cup semi-final 1988 while in Serie B; Gian Piero Gasperini from 2016; '
      + 'Champions League quarter-final 2020; Europa League winners 2024 beating Bayer Leverkusen 3-0 with an '
      + 'Ademola Lookman hat-trick; players Papu Gomez, Josip Ilicic, Duvan Zapata, Luis Muriel, Rafael Toloi, '
      + 'Marten de Roon, Gianluca Scamacca; the Bergamo youth academy; Filippo Inzaghi and Roberto Donadoni as youth products.',
  },
];

// Two lenses, merged and deduped. One agent asked for 36 questions repeats
// itself; two agents pointed at different eras do not overlap nearly as much.
const LENSES = [
  {
    key: 'heritage',
    brief: 'the club BEFORE its modern peak — founding, ground, early trophies, cult players, '
      + 'promotions and relegations, the managers who built the identity',
  },
  {
    key: 'modern',
    brief: 'roughly 1990 onward, weighted to 2000-2024 — European runs, title races, transfers, '
      + 'the current era squad and the manager who defined it',
  },
];

const GEN = {
  type: 'object',
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['q', 'o', 'a', 'diff', 'hint'],
        properties: {
          q: { type: 'string', description: 'The question stem. Every factual claim inside it must be true.' },
          o: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
          a: { type: 'integer', minimum: 0, maximum: 3, description: 'INDEX into o of the correct option — not the answer text.' },
          diff: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          hint: { type: 'string', description: 'One or two sentences of explanation shown after answering. Required — a question with no hint is ineligible for the SEO page.' },
        },
      },
    },
  },
};

const VERDICT = {
  type: 'object',
  required: ['verdict', 'reason'],
  properties: {
    verdict: { type: 'string', enum: ['keep', 'reject', 'fix'] },
    reason: { type: 'string' },
    // Only read when verdict === 'fix'. A corrected stem/options/index.
    fixed: {
      type: 'object',
      properties: {
        q: { type: 'string' },
        o: { type: 'array', items: { type: 'string' } },
        a: { type: 'integer' },
        hint: { type: 'string' },
      },
    },
  },
};

const PROSE = {
  type: 'object',
  required: ['slug', 'name', 'h1', 'title', 'description', 'intro', 'faq'],
  properties: {
    slug: { type: 'string' },
    name: { type: 'string' },
    h1: { type: 'string' },
    title: { type: 'string', description: 'Max 60 characters.' },
    description: { type: 'string', description: 'Max 155 characters.' },
    intro: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
    faq: {
      type: 'array', minItems: 4, maxItems: 4,
      items: {
        type: 'object', required: ['q', 'a'],
        properties: { q: { type: 'string' }, a: { type: 'string' } },
      },
    },
  },
};

// The rules every agent in this run works under. Written once so the generator,
// the examiner and the skeptic cannot drift apart on what "correct" means.
const BAR = `
BALL IQ ZERO ERROR BAR — these are not style preferences, they are ship gates.

1. \`a\` IS AN INDEX INTO \`o\`, NOT THE ANSWER TEXT. Off-by-one produces a
   fluent, confident, wrong answer. Resolve o[a] and check the RESOLVED STRING.
2. EVERY CLAIM THE STEM MAKES MUST BE TRUE, not just the answer it asks for.
   This is the single most common defect: the question asks the right thing,
   the keyed answer is right, and the stem asserts something untrue on the way
   there. Superlatives ("only", "first", "record", "biggest") and temporal
   clauses ("before joining", "since X") are where they hide.
3. NO SELF-ANSWERING QUESTIONS. If it can be answered from the stem alone with
   no football knowledge, reject it. These are not wrong, they are pointless,
   and they make the app feel cheap. They cannot be corrected, only replaced.
4. DISTRACTORS ARE DELETION-GRADE. Every wrong option must satisfy the stem's
   own qualifier while being verifiably wrong. No near-name twins of the
   answer, no players who were not alive/active in the era the stem names.
5. NO OPEN-ENDED PRESENT CLAIMS. "Who holds the record for X" goes silently
   false the day the record falls. Anchor it — "As of 2026, who holds…" — or
   state the figure, or name the season.
6. TARGET ERA 1990-2020, weighted to what fans alive today watched. Pre-1950
   trivia is not wanted.
7. REJECT WHEN UNCERTAIN. A false "this is wrong" that flips a correct answer
   is worse than dropping a good question. If a fact is genuinely contested or
   you cannot verify it, drop it. There is no volume target worth a wrong
   answer — 25k football obsessives read these under the app's name.
`;

// ── Generate ────────────────────────────────────────────────────────────────
phase('Generate');
const raw = await parallel(
  CLUBS.flatMap((c) => LENSES.map((l) => () =>
    agent(
      `Write ${c.target} multiple-choice football trivia questions about ${c.name}.\n\n`
      + `LENS: ${l.brief}\n\n`
      + `Reference facts (not exhaustive, and do NOT assume they are complete or `
      + `perfectly worded — verify anything you use):\n${c.facts}\n\n`
      + BAR
      + `\nSpread difficulty roughly 30% easy, 45% medium, 25% hard. "Hard" must mean `
      + `a devoted supporter would have to think, NOT that the distractors are obscure.\n`
      + `Every question needs a hint: one or two sentences giving the story behind the answer.`,
      { schema: GEN, phase: 'Generate', label: `gen:${c.key}:${l.key}` },
    ).then((r) => ({ club: c.key, questions: r?.questions || [] })),
  )),
);

// Merge the two lenses per club and drop near-identical stems. Plain code, not
// an agent — this is a string comparison, and an agent would be slower, more
// expensive and less deterministic at it.
const STOP = new Set('the a an of in on at to for and or which what who whose when did was were is are club season year first most with by from his their'.split(' '));
const toks = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));
const overlap = (a, b) => {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const t of A) if (B.has(t)) n++;
  return n / Math.min(A.size, B.size);
};

const byClub = new Map(CLUBS.map((c) => [c.key, []]));
for (const r of raw.filter(Boolean)) {
  const kept = byClub.get(r.club);
  for (const q of r.questions) {
    if (!q?.q || !Array.isArray(q.o) || q.o.length !== 4) continue;
    // Same resolved answer AND heavy stem overlap = the two lenses asked the
    // same fact in different words. Keep the first.
    const dupe = kept.some((k) => overlap(k.q, q.q) > 0.6 && String(k.o[k.a]) === String(q.o[q.a]));
    if (!dupe) kept.push(q);
  }
}
for (const [k, v] of byClub) log(`${k}: ${v.length} generated after dedupe`);

// ── Examine, then skeptic — per question, pipelined ─────────────────────────
// No barrier between the two stages: a question that clears the examiner goes
// straight to its skeptic while other questions are still being examined.
phase('Examine');
const flat = [...byClub].flatMap(([club, qs]) => qs.map((q, i) => ({ club, i, q })));
log(`${flat.length} questions into verification (${flat.length * 2} agents)`);

const judged = await pipeline(
  flat,
  (item) => agent(
    `You are the EXAMINER. Fact-check this Ball IQ question about `
    + `${CLUBS.find((c) => c.key === item.club).name}.\n\n`
    + JSON.stringify(item.q, null, 2)
    + `\n\nThe keyed answer resolves to: ${JSON.stringify(item.q.o[item.q.a])}\n\n`
    + BAR
    + `\nCheck, in order: (a) is the resolved answer factually correct; (b) is EVERY `
    + `claim in the stem true; (c) is it self-answering; (d) does every distractor `
    + `satisfy the stem's qualifier while being verifiably wrong; (e) is the hint true.\n\n`
    + `Return "keep" if it ships as-is, "fix" with a corrected version if a specific `
    + `wording or option is wrong, "reject" if the underlying fact is wrong, contested, `
    + `unverifiable, or the question is self-answering.`,
    { schema: VERDICT, phase: 'Examine', label: `exam:${item.club}:${item.i}`, effort: 'high' },
  ).then((v) => {
    if (!v || v.verdict === 'reject') throw new Error('rejected by examiner');
    const q = v.verdict === 'fix' && v.fixed ? { ...item.q, ...v.fixed } : item.q;
    return { ...item, q, examReason: v.reason };
  }),
  (item) => agent(
    `You are the SKEPTIC. Your job is to REFUTE this Ball IQ question about `
    + `${CLUBS.find((c) => c.key === item.club).name}, which has already passed one `
    + `fact-check. Assume the examiner missed something and go looking for it.\n\n`
    + JSON.stringify(item.q, null, 2)
    + `\n\nThe keyed answer resolves to: ${JSON.stringify(item.q.o[item.q.a])}\n`
    + `The examiner said: ${item.examReason}\n\n`
    + BAR
    + `\nThe examiner's most likely miss is a FALSE PREMISE IN THE STEM with a correct `
    + `key — two thirds of real defects are that. Attack the stem's assertions, not just `
    + `the answer. Also check whether a SECOND option could also be defended as correct.\n\n`
    + `Default to "reject" when you are not certain. Only return "keep" if you tried to `
    + `break it and could not.`,
    { schema: VERDICT, phase: 'Skeptic', label: `skep:${item.club}:${item.i}`, effort: 'high' },
  ).then((v) => {
    // ⚠️ 'fix' IS A PASS, NOT A REJECTION — and this line threw away ten
    // verified Middlesbrough questions on 2026-09-04. The skeptic's schema has
    // three verdicts; only 'reject' means the question is unsound. A 'fix'
    // means "I tried to break this and could not, but tighten the hint", and
    // it arrives WITH the corrected text in v.fixed. Discarding it loses a
    // good question AND the improvement. Wave Q's journal held 56 keep, 18
    // fix and ZERO reject, while the run reported 10 casualties.
    // The examiner branch above always handled this correctly; only this one
    // was wrong, which is why it looked like the skeptic being strict.
    if (!v || v.verdict === 'reject') throw new Error('rejected by skeptic');
    return v.verdict === 'fix' && v.fixed ? { ...item, q: { ...item.q, ...v.fixed } } : item;
  }),
);

const survivors = new Map(CLUBS.map((c) => [c.key, []]));
for (const s of judged.filter(Boolean)) survivors.get(s.club).push(s.q);
for (const [k, v] of survivors) {
  const gen = byClub.get(k).length;
  log(`${k}: ${v.length}/${gen} survived both passes (${Math.round((v.length / gen) * 100)}%)`);
}

// ── Prose, grounded only in what survived ───────────────────────────────────
phase('Prose');
const proseOut = await parallel(CLUBS.map((c) => () =>
  agent(
    `Write the SEO page copy for the Ball IQ ${c.name} quiz page.\n\n`
    + `⚠️ GROUND EVERY FACTUAL CLAIM IN THIS LIST AND NOTHING ELSE. These are the `
    + `questions that survived a two-pass fact-check; anything not supported here is `
    + `unverified and must not appear in the prose. The prose goes live on an indexed `
    + `page and is NOT covered by the question-bank gates.\n\n`
    + JSON.stringify(survivors.get(c.key).map((q) => ({ q: q.q, a: q.o[q.a], hint: q.hint })), null, 2)
    + `\n\nslug: a URL slug (lowercase, hyphens). name: "${c.name}".\n`
    + `title: MAX 60 characters including "Ball IQ" nowhere — it is a page title like `
    + `"${c.name} Quiz — 50 Questions for Real Fans" but WITHOUT any question count.\n`
    + `description: MAX 155 characters.\n`
    + `intro: exactly 4 paragraphs, written for a supporter, not a search engine.\n`
    + `faq: exactly 4 question/answer pairs a fan would actually search.\n\n`
    + `⚠️ NEVER state a number of questions anywhere. It is a binding product rule — `
    + `the count changes and the copy rots in public.\n`
    + `⚠️ Anchor any superlative to a moment ("As of 2026, …") or state the season.`,
    { schema: PROSE, phase: 'Prose', label: `prose:${c.key}` },
  ).then((p) => ({ club: c.key, prose: p })),
));

// forge-curate.mjs expects: [{ club, full, count, survivors, prose }]
return CLUBS.map((c) => ({
  club: c.key,
  full: byClub.get(c.key).length,
  count: survivors.get(c.key).length,
  survivors: survivors.get(c.key),
  prose: proseOut.filter(Boolean).find((p) => p.club === c.key)?.prose || null,
}));
