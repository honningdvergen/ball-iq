export const meta = {
  name: 'wave-n-forge',
  description: 'Wave N: forge verified club packs for Frankfurt, Gladbach, Werder, Bologna, Genoa, Lille + Fenerbahce top-up',
  phases: [
    { title: 'Generate', detail: 'two lenses per club' },
    { title: 'Verify', detail: 'examiner then adversarial skeptic, per question' },
    { title: 'Prose', detail: 'page copy grounded only in survivor facts' },
  ],
}

// ZERO ERROR bar (Alex, standing): verify inline, only double-survivors ship,
// reject when uncertain. Era: 1990-2020 preferred, NOTHING pre-1950.

const CLUBS = [
  { name: 'Eintracht Frankfurt', slug: 'eintracht-frankfurt', comp: 'Bundesliga' },
  { name: 'Borussia Mönchengladbach', slug: 'borussia-monchengladbach', comp: 'Bundesliga' },
  { name: 'Werder Bremen', slug: 'werder-bremen', comp: 'Bundesliga' },
  { name: 'Bologna', slug: 'bologna', comp: 'Serie A' },
  { name: 'Genoa', slug: 'genoa', comp: 'Serie A' },
  { name: 'Lille', slug: 'lille', comp: 'Ligue 1' },
]

const GEN = {
  type: 'object', additionalProperties: false,
  properties: { questions: { type: 'array', maxItems: 18, items: {
    type: 'object', additionalProperties: false,
    properties: {
      q: { type: 'string', description: 'the question stem, <=120 chars, must NOT contain or imply its own answer' },
      o: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' }, description: 'four options; every distractor must satisfy the stem qualifier while being verifiably wrong, era-consistent, no near-name-twins' },
      a: { type: 'integer', minimum: 0, maximum: 3, description: 'INDEX into o of the correct answer' },
      hint: { type: 'string', description: 'one sentence explaining WHY the answer is right — mandatory' },
      year: { type: 'integer', description: 'the year the fact concerns; must be >=1950, prefer 1990-2020' },
    }, required: ['q','o','a','hint','year'] } } },
  required: ['questions'],
}
const VERDICT = { type: 'object', additionalProperties: false,
  properties: { verdict: { type: 'string', enum: ['pass','fail'] }, reason: { type: 'string' } },
  required: ['verdict','reason'] }
const PROSE = { type: 'object', additionalProperties: false,
  properties: {
    h1: { type: 'string' }, title: { type: 'string', description: 'SERP title <=60 chars, MUST contain "& Answers" and end "| Ball IQ"' },
    description: { type: 'string', description: '<=155 chars' },
    intro: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
    faq: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'object', additionalProperties: false,
      properties: { q: { type: 'string' }, a: { type: 'string' } }, required: ['q','a'] } },
  }, required: ['h1','title','description','intro','faq'] }

const RULES = 'HARD RULES: every fact verifiable and true; if uncertain about ANY claim, omit the question entirely. Stems must not assert anything false on the way to the answer (check superlatives like "only/first/record" and temporal clauses like "before joining"). The question must NOT be answerable from the stem alone (no self-answering). All facts 1950 or later, prefer 1990-2020. a is an INDEX into o — state the resolved answer string in the hint. No question counts, no invented ratings.'

function normStem(q) { return q.toLowerCase().replace(/[^a-z0-9 ]/g,'').split(' ').filter(w=>w.length>3).sort().join(' ') }

async function verifyOne(clubName, question) {
  const desc = 'Q: ' + question.q + ' | options: ' + question.o.join(' / ') + ' | keyed answer (resolved o[a]): ' + question.o[question.a] + ' | hint: ' + question.hint
  const ex = await agent('You are a strict football fact EXAMINER for a quiz about ' + clubName + '. Verify this question. Check: (1) the resolved answer is factually correct, (2) every claim the STEM makes is true (superlatives and temporal clauses especially), (3) it is not answerable from the stem alone, (4) all distractors are plausible-but-verifiably-wrong and era-consistent, (5) the hint is accurate. FAIL if any check is uncertain. ' + desc, { schema: VERDICT, effort: 'high', phase: 'Verify', label: 'exam:' + clubName.slice(0,10) })
  if (!ex || ex.verdict !== 'pass') return null
  const sk = await agent('You are an ADVERSARIAL SKEPTIC. Try to REFUTE this quiz question about ' + clubName + ' — find any way the keyed answer is wrong, the stem misleads, a distractor is arguably also correct, or the fact is contested. Default to fail when in doubt; a wrong answer shipping is far worse than a good question dying. ' + desc, { schema: VERDICT, effort: 'high', phase: 'Verify', label: 'skep:' + clubName.slice(0,10) })
  if (!sk || sk.verdict !== 'pass') return null
  return question
}

async function forgeClub(c) {
  const lenses = await parallel([
    () => agent('Generate up to 16 MCQ trivia questions about ' + c.name + ' football club HERITAGE (1950-2005): titles, iconic players, famous European nights, legendary managers. ' + RULES, { schema: GEN, phase: 'Generate', label: 'gen-her:' + c.slug }),
    () => agent('Generate up to 16 MCQ trivia questions about MODERN ' + c.name + ' (2005-2025): recent seasons, transfers, current-era players, recent trophies. ' + RULES, { schema: GEN, phase: 'Generate', label: 'gen-mod:' + c.slug }),
  ])
  const seen = new Set(); const merged = []
  for (const l of lenses.filter(Boolean)) for (const q of (l.questions||[])) {
    const k = normStem(q.q); if (seen.has(k)) continue; seen.add(k); merged.push(q)
  }
  const verified = (await parallel(merged.map(q => () => verifyOne(c.name, q)))).filter(Boolean)
  log(c.name + ': ' + merged.length + ' generated, ' + verified.length + ' double-survived')
  let prose = null
  if (verified.length >= 15) {
    prose = await agent('Write SEO page copy for the ' + c.name + ' quiz page on Ball IQ (football trivia site). Ground EVERY factual claim ONLY in these verified facts: ' + verified.map(v=>v.hint).join(' | ') + '. Tone: knowledgeable fan, no hype, no question counts. Title must include "& Answers" and fit 60 chars with "| Ball IQ".', { schema: PROSE, phase: 'Prose', label: 'prose:' + c.slug })
  }
  return { ...c, questions: verified, prose, belowGate: verified.length < 15 }
}

// Fenerbahce top-up: one club, existing stems passed in args to forbid dupes.
async function fenerTopUp() {
  const existing = (args && args.fenerStems) || []
  const gen = await agent('Generate up to 20 MCQ trivia questions about Fenerbahçe football club (era 1990-2025 strongly preferred). DO NOT duplicate or re-ask any of these existing questions: ' + existing.join(' || ') + '. ' + RULES, { schema: GEN, phase: 'Generate', label: 'gen:fener-topup' })
  const merged = (gen && gen.questions) || []
  const verified = (await parallel(merged.map(q => () => verifyOne('Fenerbahçe', q)))).filter(Boolean)
  log('Fenerbahçe top-up: ' + merged.length + ' generated, ' + verified.length + ' survived')
  return verified
}

phase('Generate')
const results = await parallel(CLUBS.map(c => () => forgeClub(c)))
const fener = await fenerTopUp()
const clubs = results.filter(Boolean)
log('WAVE N COMPLETE: ' + clubs.map(c=>c.name+':'+c.questions.length).join(', ') + ' | fener +' + fener.length)
return { clubs, fenerTopUp: fener }