// difficulty-honesty.mjs — find "hard" questions that are not actually hard.
//
//   node scripts/difficulty-honesty.mjs            # summary + samples
//   node scripts/difficulty-honesty.mjs --json     # full machine-readable list
//
// TODO #40. A question is dishonestly graded when a player who knows NOTHING
// can still eliminate the distractors. That is worse than an easy question,
// because "hard" is what we sell: the difficulty label is a promise that a
// real fan will be tested and a casual will not coast.
//
// The named case is the Breitner pattern (memory: q_c938c5) — a stem that
// qualifies its answer ("which GERMAN MIDFIELDER…") paired with distractors
// that flunk the qualifier on sight (Pelé, Zidane, Ronaldo).
//
// WHAT THIS CAN AND CANNOT DO
// Deciding "is Pelé German?" needs world knowledge, not a regex, so this does
// NOT auto-fix anything. It ranks candidates by signals that ARE computable,
// so a human reviews a short ordered list instead of 1,300 questions. Every
// detector below fires on structure alone.

import { readFileSync, writeFileSync } from 'node:fs';

const mod = await import('../src/questions.js');
const QB = mod.QUESTIONS || mod.default || Object.values(mod)[0];

const norm = (s) => String(s).toLowerCase().trim();

// ── naming-format consistency ────────────────────────────────────────────────
// A first version of this tried to classify options by ENTITY TYPE (person /
// club / country / year) and flag mixed sets. It did not work: "Yugoslavia"
// missed a hardcoded country list, "West Germany" was two words so it typed as
// a person, and mononyms like "Nani" typed differently from "Uwe Seeler". It
// produced 331 findings that were overwhelmingly artefacts of the classifier.
//
// What it was ACTUALLY measuring is worth keeping, though: how each option is
// WRITTEN. q_a6134f pairs three mononyms (Pelé, Maradona, Ronaldo) with one
// full name — Uwe Seeler — and that full name is the answer. You can pick it
// without knowing any football. That is a real Breitner-class defect, and
// format is something code can judge reliably, unlike nationality.
//
// Only fires when the ANSWER is the format outlier. A distractor that looks
// different is untidy; an ANSWER that looks different is a free point.
// REFINED after running this against wave K, where all 10 hits were false
// positives. The first version flagged any token-count difference, which
// conflates two unrelated things:
//
//   REAL TELL — inconsistent naming STYLE. "McManaman" beside "Ian Rush",
//   "Robbie Fowler", "John Barnes" is a surname among full names; you can pick
//   it knowing nothing.
//
//   NOT A TELL — natural length variation. "Real Madrid" beside "Sevilla",
//   "Valencia", "Barcelona" is four clubs written identically, one of which
//   happens to be two words. Same for "AC Milan" among Italian clubs, and for
//   surnames carrying a particle ("Alfredo Di Stéfano", "Fleury Di Nallo").
//
// So: only PERSON options are judged, only mononym-vs-full-name counts, and
// club questions are skipped entirely — clubs have no consistent word count to
// be inconsistent with.
const CLUB_STEM = /\bwhich (club|team|side)\b|\bwhat club\b/i;
const CLUBBY = /\b(fc|cf|ac|sc|afc|united|city|real|inter|milan|juventus|roma|lazio|ajax|psv|porto|benfica|celtic|rangers|arsenal|chelsea|liverpool|napoli|sevilla|valencia|barcelona|madrid|bayern|dortmund|plate|juniors|boca|river|stuttgart|schalke|hamburger|kaiserslautern|rostock)\b/i;

// mononym (Pelé, Juninho) vs full name (Uwe Seeler). Particles and extra
// forenames do NOT change the class.
const nameClass = (o) => {
  const s = String(o).trim();
  if (/^(19|20)\d{2}/.test(s) || /^[\d.,]/.test(s)) return null;   // years/numbers: not names
  return s.split(/\s+/).length === 1 ? 'mononym' : 'full-name';
};

// Stem qualifiers that a distractor can visibly flunk.
const NATIONALITY = /\b(english|spanish|italian|german|french|brazilian|argentin(e|ian)|portuguese|dutch|belgian|croatian|uruguayan|mexican|american|japanese|nigerian|ghanaian|cameroonian|senegalese|moroccan|egyptian|danish|swedish|norwegian|polish|russian|turkish|greek|scottish|welsh|irish|austrian|swiss|serbian|czech|ukrainian|colombian|chilean)\b/i;
const POSITION = /\b(goalkeeper|keeper|defender|centre-?back|full-?back|midfielder|winger|striker|forward|centre-?forward)\b/i;

const findings = [];
const hard = QB.filter((r) => r.diff === 'hard' && r.type === 'mcq' && Array.isArray(r.o) && r.o.length === 4);

for (const r of hard) {
  const reasons = [];
  const answer = r.o[r.a];

  // 1. ANSWER IS THE NAMING-STYLE OUTLIER — three options written one way, the
  //    answer written another. Pickable with zero football knowledge.
  //    Skipped for club questions: club names have no natural word count.
  const isClubQ = CLUB_STEM.test(r.q) || r.o.filter((o) => CLUBBY.test(o)).length >= 2;
  if (!isClubQ) {
    const classes = r.o.map(nameClass);
    if (classes.every(Boolean)) {
      const mine = classes[r.a];
      const others = classes.filter((_, i) => i !== r.a);
      if (others.every((c) => c !== mine)) {
        reasons.push(`answer is the naming-style outlier: 3×${others[0]} vs answer "${answer}" (${mine})`);
      }
    }
  }

  // 2. LENGTH OUTLIER — the correct answer is conspicuously the longest.
  //    Question-writers pad the true answer with qualifiers; test-takers know it.
  const lens = r.o.map((o) => String(o).length);
  const maxOther = Math.max(...lens.filter((_, i) => i !== r.a));
  if (lens[r.a] >= maxOther * 1.8 && lens[r.a] - maxOther >= 8) {
    reasons.push(`length tell: answer ${lens[r.a]} chars vs longest distractor ${maxOther}`);
  }

  // 3. QUALIFIER STATED — stem names a nationality or position. Cannot verify
  //    the options from code, so these are surfaced for human eyes. Only
  //    reported when paired with another signal, or listed separately.
  const nat = r.q.match(NATIONALITY);
  const pos = r.q.match(POSITION);

  if (reasons.length) {
    findings.push({ id: r.id, cat: r.cat, q: r.q, options: r.o, answer, reasons, qualifier: [nat?.[0], pos?.[0]].filter(Boolean).join(' + ') || null });
  }
}

// Questions with a stated qualifier — the Breitner review pool.
const qualifierPool = hard.filter((r) => NATIONALITY.test(r.q) || POSITION.test(r.q));

if (process.argv.includes('--json')) {
  writeFileSync('.audit/difficulty-honesty.json', JSON.stringify({ findings, qualifierPool: qualifierPool.map((r) => ({ id: r.id, q: r.q, o: r.o, a: r.a })) }, null, 2));
  console.log(`wrote .audit/difficulty-honesty.json — ${findings.length} structural, ${qualifierPool.length} qualifier-pool`);
} else {
  console.log(`hard MCQs scanned: ${hard.length}\n`);
  console.log(`STRUCTURAL TELLS (auto-detected): ${findings.length}`);
  findings.slice(0, 12).forEach((f) => {
    console.log(`\n  ${f.id}  [${f.cat}]`);
    console.log(`    ${f.q.slice(0, 96)}`);
    console.log(`    options: ${f.options.join(' | ')}`);
    console.log(`    answer:  ${f.answer}`);
    f.reasons.forEach((x) => console.log(`    ⚠  ${x}`));
  });
  console.log(`\n\nBREITNER REVIEW POOL (stem states a nationality/position — needs human eyes): ${qualifierPool.length}`);
  qualifierPool.slice(0, 6).forEach((r) => {
    console.log(`\n  ${r.id}  ${r.q.slice(0, 92)}`);
    console.log(`    ${r.o.map((o, i) => (i === r.a ? `[${o}]` : o)).join(' | ')}`);
  });
}
