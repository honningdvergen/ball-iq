export const meta = {
  name: 'bank-audit-round2',
  description: 'Close the bank audit: web-verify the 87 mis-rated "cosmetic" flags, and re-screen all 5,616 MCQs for the two defect classes the completed audit proved the forge misses',
  phases: [
    { title: 'Cosmetic-verify', detail: '87 mis-rated flags — wrong_answer/stale/multiple_correct' },
    { title: 'Re-screen', detail: '5,616 MCQs for false premises + self-answering' },
    { title: 'Verify-new', detail: 'web-verify anything the re-screen flags serious' },
  ],
}

// WHY ROUND 2
// Round 1 verified all 211 SERIOUS flags at a 5% false-positive rate and 89
// corrections shipped. Two gaps remain:
//
//   1. 87 flags the screener rated "cosmetic" are typed wrong_answer (23),
//      stale (53) or multiple_correct (11). A wrong answer is never cosmetic.
//      The severity and the defect type contradict each other, so these get
//      the same treatment the serious pile got.
//
//   2. Round 1's screen died to the usage limit at 5,360/5,834 and its journal
//      keys are opaque hashes, so coverage cannot be reconstructed. Rather than
//      guess which ~470 were missed, re-screen everything — but ONLY for the
//      two classes the finished audit proved are systematically missed:
//      false premises in the stem (66 of 89 corrections) and self-answering
//      questions (89 of 211 flags). The round-1 screener was not explicitly
//      looking for either.
//
// Questions already settled in round 1 are excluded by the prep script.

const CDIR = '/Users/alexanderbrynolsen/ball-iq/.audit/cbatch'
const SDIR = '/Users/alexanderbrynolsen/ball-iq/.audit/sbatch'
const CBATCHES = 15
const SBATCHES = 38

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

const FLAGS_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    screened: { type: 'integer' },
    flags: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          id: { type: 'string' },
          kind: { type: 'string', enum: ['false_premise', 'self_answering', 'wrong_answer', 'multiple_correct'] },
          severity: { type: 'string', enum: ['serious', 'cosmetic'] },
          claim: { type: 'string' },
        },
        required: ['id', 'kind', 'severity', 'claim'],
      },
    },
  },
  required: ['screened', 'flags'],
}

const VERIFY_RULES = `You are the SECOND opinion, and the screener is often wrong. A previous screener in this project confidently claimed Gerd Müller scored in the 1973 European Cup final — a match Bayern never played in. Your job is ground truth, not agreement.

USE WEB SEARCH to check the actual fact. Do not rely on memory for dates, scorelines, transfer years, squad lists or who captained whom — those are exactly where confident errors live.

confidence: "high" ONLY when sources are clear and agree. If sources conflict or you could not verify, use "low" — low and medium verdicts are routed to a human and never auto-applied, so honest uncertainty costs nothing and a false "high" is expensive.

If confirmed AND you are confident of the correction, give fix_q / fix_o (exactly 4) / fix_a (0-3 index into fix_o). Any replacement distractor MUST satisfy the stem's own qualifier while being verifiably wrong — that is the defect class we are removing, so do not introduce a fresh one. If unsure of a clean fix, omit the fix fields.

The owner's bar is that a shipped question is PERFECT: no wrong answers, no ambiguity, no question solvable without the knowledge.`

const cosmeticPrompt = (n) => `Read ${CDIR}/c-${n}.json — up to 6 football quiz questions, each with a flag: {id, kind, claim, q, o, answer, cat, diff}.

These were rated only "cosmetic" by a first-pass screener, but their defect TYPE says otherwise — wrong_answer, stale or multiple_correct. A wrong answer is never cosmetic, and a stale record is one season from being wrong. Treat the severity rating as untrustworthy and judge the question on its merits.

For "stale" flags specifically: today is 2026-07-27. Decide whether the fact is still true AS OF TODAY, and if a record has since been broken or a stated total superseded, that is a real defect.

${VERIFY_RULES}

Return one verdict per entry.`

const screenPrompt = (n) => `Read ${SDIR}/s-${n}.json — 150 football quiz questions: {id, q, o, answer, cat, diff}.

Screen for exactly TWO defect classes. Both pass an answer-key check by construction, which is why they shipped, so do NOT simply check whether the answer is right.

1. FALSE PREMISE IN THE STEM (kind: "false_premise")
   The keyed answer is correct, but the stem asserts something untrue on the way
   there. Real examples found in this bank:
     - "the only side to go unbeaten in the modern format" (Arsenal did it too)
     - "the first German honoured since Beckenbauer" (Rummenigge 1980/81 and
       Matthäus 1990 came in between)
     - "before joining PSG that year" (he had joined four months earlier)
     - "only the second time Bayern hadn't won it in a decade" (it was six)
   The tells are SUPERLATIVES ("only", "first", "biggest", "record", "ever")
   and TEMPORAL clauses ("before joining", "since X", "at the time").
   Check every factual claim the stem MAKES, not just the answer it asks for.

2. SELF-ANSWERING (kind: "self_answering")
   The stem gives the answer away, so no football knowledge is needed. Example:
   "Italy's last appearance was 2014 — how many years before 2026?" Not wrong,
   just pointless. Ask: could a person with zero football knowledge answer this
   from the stem alone? If yes, flag it.

Also flag an outright wrong_answer or multiple_correct if you happen to see one,
but those are not the focus.

severity: "serious" if a player would be misled or the question is pointless;
"cosmetic" if it is merely clumsy. Be honest — over-flagging wastes verification
budget, under-flagging ships defects.

In "claim", state precisely what is wrong and why, citing the specific fact.

You may use web search where a superlative needs checking, but you do not need
to verify every question — flag what is suspicious and let the verifier settle it.

Return {screened: <count you actually reviewed>, flags: [...]}.`

const verifyNewPrompt = (flags) => `Independently verify these flags raised by a screener on the Ball IQ question bank. Each entry is {id, kind, severity, claim, q, o, answer}:

${JSON.stringify(flags, null, 1)}

${VERIFY_RULES}

For self_answering flags: "confirmed" means the stem genuinely gives the answer away. These cannot be corrected, only REPLACED, so if you confirm one, propose a genuinely different question on the same subject via fix_q/fix_o/fix_a.

Return one verdict per entry.`

log(`Round 2: ${CBATCHES} batches of mis-rated "cosmetic" flags (87 questions) + ${SBATCHES} batches re-screening 5,616 MCQs for false premises and self-answering. Round-1-settled questions are excluded.`)

// A) The 87 mis-rated cosmetic flags — straight to verification.
const cosmeticWork = parallel(
  Array.from({ length: CBATCHES }, (_, i) => i + 1).map((n) => () =>
    agent(cosmeticPrompt(n), { label: `cosmetic:${n}`, phase: 'Cosmetic-verify', effort: 'high', schema: VERDICTS_SCHEMA })
      .then((r) => (r && r.verdicts) || [])
      .catch(() => [])
  )
)

// B) Re-screen -> verify, as a pipeline so each batch's flags go to
// verification the moment that batch returns, with no barrier.
const screenWork = pipeline(
  Array.from({ length: SBATCHES }, (_, i) => i + 1),
  (n) => agent(screenPrompt(n), { label: `screen:${n}`, phase: 'Re-screen', schema: FLAGS_SCHEMA })
    .then((r) => ({ n, screened: (r && r.screened) || 0, flags: ((r && r.flags) || []).filter(f => f.severity === 'serious') }))
    .catch(() => ({ n, screened: 0, flags: [] })),
  (res) => {
    if (!res || !res.flags.length) return { ...res, verdicts: [] }
    return agent(verifyNewPrompt(res.flags), { label: `verify:${res.n}`, phase: 'Verify-new', effort: 'high', schema: VERDICTS_SCHEMA })
      .then((v) => ({ ...res, verdicts: (v && v.verdicts) || [] }))
      .catch(() => ({ ...res, verdicts: [] }))
  }
)

const [cosmeticVerdicts, screenResults] = await Promise.all([cosmeticWork, screenWork])

const cosAll = cosmeticVerdicts.filter(Boolean).flat()
const scr = screenResults.filter(Boolean)
const newFlags = scr.flatMap((r) => r.flags)
const newVerdicts = scr.flatMap((r) => r.verdicts)
const totalScreened = scr.reduce((s, r) => s + r.screened, 0)

const all = [...cosAll, ...newVerdicts]
const high = all.filter((v) => v.confirmed && v.confidence === 'high')
const soft = all.filter((v) => v.confirmed && v.confidence !== 'high')
const rejected = all.filter((v) => !v.confirmed)

log(`Round 2 done. Re-screened ${totalScreened} questions -> ${newFlags.length} new serious flags. Verdicts: ${all.length} (cosmetic-pile ${cosAll.length}, new ${newVerdicts.length}). Confirmed high: ${high.length}. Needs Alex: ${soft.length}. Rejected as fine: ${rejected.length}.`)

return {
  screened: totalScreened,
  new_serious_flags: newFlags.length,
  total_verdicts: all.length,
  confirmed_high: high,
  confirmed_needs_review: soft,
  rejected: rejected.length,
}
