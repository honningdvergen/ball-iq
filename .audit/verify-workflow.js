export const meta = {
  name: 'bank-audit-verify',
  description: 'Verify-only pass: independently web-research every SERIOUS screener flag and decide which are real defects, prioritised so wrong answers are settled first',
  phases: [{ title: 'Verify', detail: '36 batches of 6 flags, wrong_answer first' }],
}

// WHY THIS IS A SEPARATE WORKFLOW
// Screening and verifying were stages of one pipeline, so every resume poured
// the budget into finishing the screen and the verify agents at the tail were
// killed by the usage limit every single time — three runs, zero verdicts.
// Splitting them gives verification its own budget from the first token.
//
// Input is .audit/vbatch/v-N.json, built by the queue step from
// .audit/findings-serious.json joined against src/questions.js. Batches are
// ordered so wrong_answer and multiple_correct — the flags that actually
// mislead a player — are settled before stylistic ones.

const DIR = '/Users/alexanderbrynolsen/ball-iq/.audit/vbatch'
const BATCHES = 36

const VERDICTS_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          id: { type: 'string' },
          confirmed: { type: 'boolean' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          truth: { type: 'string' },
          fix_q: { type: 'string' },
          fix_o: { type: 'array', items: { type: 'string' } },
          fix_a: { type: 'integer' },
          reasoning: { type: 'string' },
        },
        required: ['id', 'confirmed', 'confidence', 'truth', 'reasoning'],
      },
    },
  },
  required: ['verdicts'],
}

const prompt = (n) => `Read ${DIR}/v-${n}.json — up to 6 football quiz questions, each with a flag a screener raised: {id, kind, claim, q, o, answer, cat, diff}.

You are the SECOND opinion, and the screener is often wrong. A previous screener in this project confidently claimed Gerd Müller scored in the 1973 European Cup final — a match Bayern never played in. Your job is ground truth, not agreement.

For each entry:
1. USE WEB SEARCH to check the actual fact. Do not rely on memory for dates, scorelines, transfer years, squad lists or who captained whom — those are exactly where confident errors live. Search the specific claim.
2. Decide whether the question is genuinely defective as the flag claims.
   - confirmed=true  → the defect is real and a player would be misled or the question is pointless.
   - confirmed=false → the question is actually fine, or the screener misread it.
3. confidence: "high" ONLY when sources are clear and agree. If sources conflict, or you could not verify, use "low" — low and medium verdicts are routed to a human and never auto-applied, so honest uncertainty costs nothing and a false "high" is expensive.
4. In "truth", state the established fact in one sentence and what your sources say.
5. If confirmed AND you are confident of the correction, give fix_q / fix_o (exactly 4) / fix_a (0-3 index into fix_o). Any replacement distractor MUST satisfy the stem's own qualifier while being verifiably wrong — that is the defect class we are removing, so do not introduce a fresh one. If you are unsure of a clean fix, omit the fix fields; a confirmed flag with no fix still gets human review.

The bar from the owner is that a shipped question is PERFECT: no wrong answers, no ambiguity, no question solvable without the knowledge. Return one verdict per entry.`

log(`Verify-only pass: ${BATCHES} batches x 6 = 211 serious flags. Ordered wrong_answer -> multiple_correct -> ambiguous -> self_answering -> eliminable -> stale, so the player-misleading defects are settled first if the budget runs out.`)

const batches = Array.from({ length: BATCHES }, (_, i) => i + 1)

const results = await parallel(batches.map((n) => () =>
  agent(prompt(n), { label: `verify:batch-${n}`, phase: 'Verify', effort: 'high', schema: VERDICTS_SCHEMA })
    .then((r) => ({ n, verdicts: (r && r.verdicts) || [] }))
    .catch(() => ({ n, verdicts: [] }))
))

const all = results.filter(Boolean).flatMap((r) => r.verdicts)
const confirmedHigh = all.filter((v) => v.confirmed && v.confidence === 'high')
const confirmedSoft = all.filter((v) => v.confirmed && v.confidence !== 'high')
const rejected = all.filter((v) => !v.confirmed)

log(`Verdicts: ${all.length}. Confirmed high (safe to apply): ${confirmedHigh.length}. Confirmed but uncertain (Alex decides): ${confirmedSoft.length}. Screener flags REJECTED as wrong: ${rejected.length}.`)

return { total: all.length, confirmed_high: confirmedHigh, confirmed_needs_review: confirmedSoft, rejected }
