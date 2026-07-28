export const meta = {
  name: 'bank-audit-round2-verify',
  description: 'Verify the 245 new serious flags from the round-2 re-screen — 41 batches of 6, false_premise and self_answering first',
  phases: [{ title: 'Verify', detail: '41 batches x 6 flags, web-researched' }],
}

// WHY SIX PER AGENT
// The journal only records an agent's work when that agent RETURNS, so a
// limit-kill costs whatever is in flight. Round 1's verify used 6 per agent and
// lost 0%. The round-2 SCREEN used 150 per agent and lost most of its tail
// twice. Checkpoint frequency is what survives, not agent count.
//
// Input .audit/nbatch/n-N.json was built from the re-screen's 245 flags joined
// against the live bank. 141 are false_premise and 94 self_answering — the two
// classes the completed audit proved the forge does not catch.

const DIR = '/Users/alexanderbrynolsen/ball-iq/.audit/nbatch'
const BATCHES = 41

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

const prompt = (n) => `Read ${DIR}/n-${n}.json — up to 6 football quiz questions, each with a flag: {id, kind, severity, claim, q, o, answer, cat, diff}.

You are the SECOND opinion, and the screener is often wrong. A previous screener in this project confidently claimed Gerd Müller scored in the 1973 European Cup final — a match Bayern never played in. Your job is ground truth, not agreement. Today is 2026-07-28.

The two flag kinds mean specific things:

**false_premise** — the keyed answer is CORRECT, but the stem asserts something untrue on the way there. Real confirmed examples from this bank: "the only side to go unbeaten in the modern format" (Arsenal did it too); "the first German honoured since Beckenbauer" (Rummenigge and Matthäus came in between); "before joining PSG that year" (he had joined four months earlier); "throughout his entire Roma career" (Totti wore 20 and 17 before 10).
→ confirmed=true means the stem's claim is genuinely false. Check the SUPERLATIVES ("only", "first", "record", "ever") and TEMPORAL clauses. Do NOT confirm merely because the phrasing is loose — the claim must actually be untrue.
→ The fix keeps the same answer and corrects the stem.

**self_answering** — the stem gives the answer away, so no football knowledge is needed.
→ confirmed=true means a person with ZERO football knowledge could answer it from the stem alone. These cannot be corrected, only REPLACED, so if you confirm one, propose a genuinely different question on the same subject via fix_q/fix_o/fix_a.

USE WEB SEARCH to check the actual fact. Do not rely on memory for dates, scorelines, transfer years, squad numbers or who captained whom — those are exactly where confident errors live.

confidence: "high" ONLY when sources are clear and agree. If sources conflict or you could not verify, use "low" — low and medium verdicts are routed to a human and never auto-applied, so honest uncertainty costs nothing and a false "high" is expensive.

If confirmed AND confident of the correction, give fix_q / fix_o (exactly 4) / fix_a (0-3 index into fix_o). Any replacement distractor MUST satisfy the stem's own qualifier while being verifiably wrong — that is the defect class we are removing, so do not introduce a fresh one. If unsure of a clean fix, omit the fix fields; a confirmed flag with no fix still gets human review.

The owner's bar is that a shipped question is PERFECT: no wrong answers, no ambiguity, no question solvable without the knowledge.

Return one verdict per entry.`

log(`Verifying 245 new serious flags in ${BATCHES} batches of 6 (141 false_premise, 94 self_answering, 8 multiple_correct, 2 wrong_answer). Six per agent so a limit-kill costs almost nothing.`)

const results = await parallel(
  Array.from({ length: BATCHES }, (_, i) => i + 1).map((n) => () =>
    agent(prompt(n), { label: `verify:${n}`, phase: 'Verify', effort: 'high', schema: VERDICTS_SCHEMA })
      .then((r) => (r && r.verdicts) || [])
      .catch(() => [])
  )
)

const all = results.filter(Boolean).flat()
const high = all.filter((v) => v.confirmed && v.confidence === 'high')
const soft = all.filter((v) => v.confirmed && v.confidence !== 'high')
const rejected = all.filter((v) => !v.confirmed)

log(`Verdicts: ${all.length}/245. Confirmed high (safe to apply): ${high.length}. Needs Alex: ${soft.length}. Screener flag REJECTED as fine: ${rejected.length}.`)

return { total: all.length, confirmed_high: high, confirmed_needs_review: soft, rejected: rejected.length }
