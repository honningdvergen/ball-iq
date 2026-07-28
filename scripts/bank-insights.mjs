// bank-insights.mjs — mine our own question bank for publishable findings.
//
//   node scripts/bank-insights.mjs
//
// The point is a LINKABLE ASSET (task #64). Our measured ceiling is authority —
// roughly zero external links — and football media links to DATA, not to
// quizzes. We are uniquely placed to produce it: nobody else has 5,800+
// hand-checked football questions with difficulty grades and a documented
// editorial process.
//
// Everything printed here is computed from src/questions.js. No estimates, no
// rounding up for effect — if a number goes in an article it has to survive a
// journalist checking it.

import { readFileSync } from 'node:fs';

const mod = await import('../src/questions.js');
const QB = mod.QUESTIONS || mod.default || Object.values(mod)[0];

const text = (r) => `${r.q} ${Array.isArray(r.o) ? r.o.join(' ') : ''} ${r.hint || ''}`;

// ── who is football trivia actually obsessed with? ───────────────────────────
// Count multi-word proper nouns. Crude, but consistent, and we report it as
// "mentions across our bank", not as a claim about football itself.
// Competitions, trophies and grounds are not "who trivia is about" — they are
// the furniture every question sits in, so they go in their own bucket.
const NOT_A_NAME = /^(World Cup|Premier League|Champions League|European Cup|FA Cup|La Liga|Serie A|Ligue \d|Europa League|Cup Winners|Golden Boot|Ballon d'Or|League Cup|Copa America|Copa del|European Championship|Super Cup|UEFA Cup|Football League|Football Association|Community Shield|First Division|Second Division|Süper Lig|European Cups?|World Cups?|Champions Leagues?)$/i;

// A stem opener like "Which Italian defender…" trips any capitalised-pair
// regex. So does a possessive ("Real Madrid's"). Both are artefacts of the
// question FORM, not mentions of anyone, and they polluted the first run.
const STEM_OPENER = /^(Which|What|Who|Where|When|How|The|In|At|After|Before|During|Both|These|This|That|His|Her|Their|Its|Name|Following)\b/i;

const counts = new Map();
for (const r of QB) {
  const seen = new Set();
  for (const m of text(r).matchAll(/\b([A-ZÀ-Þ][a-zà-ÿ'’-]+(?:\s+(?:de|van|di|da|der|den)\s+)?(?:\s[A-ZÀ-Þ][a-zà-ÿ'’-]+)+)\b/g)) {
    let name = m[1].trim().replace(/['’]s$/, '');      // fold possessives
    if (STEM_OPENER.test(name)) continue;
    if (NOT_A_NAME.test(name)) continue;
    if (name.split(/\s+/).length > 3) continue;
    if (seen.has(name)) continue;                       // once per question
    seen.add(name);
    counts.set(name, (counts.get(name) || 0) + 1);
  }
}
const top = [...counts.entries()].sort((a, b) => b[1] - a[1]);

// ── which eras does football trivia live in? ─────────────────────────────────
const decades = new Map();
for (const r of QB) {
  const yrs = [...text(r).matchAll(/\b(18|19|20)\d{2}\b/g)].map((m) => Number(m[0]))
    .filter((y) => y >= 1860 && y <= 2026);
  for (const d of new Set(yrs.map((y) => Math.floor(y / 10) * 10))) {
    decades.set(d, (decades.get(d) || 0) + 1);
  }
}

const cats = {}, diffs = {};
for (const r of QB) { cats[r.cat] = (cats[r.cat] || 0) + 1; diffs[r.diff] = (diffs[r.diff] || 0) + 1; }
const withHint = QB.filter((r) => r.hint && r.hint.length > 10).length;

const pct = (n) => `${((n / QB.length) * 100).toFixed(1)}%`;

console.log(`BALL IQ QUESTION BANK — ${QB.length.toLocaleString('en-GB')} questions\n`);

console.log('MOST-ASKED-ABOUT NAMES (mentions across the bank, max one per question)');
top.slice(0, 25).forEach(([n, c], i) => console.log(`  ${String(i + 1).padStart(2)}. ${String(c).padStart(4)}  ${n}`));

console.log('\nWHICH DECADES FOOTBALL TRIVIA LIVES IN (questions referencing a year in that decade)');
[...decades.entries()].filter(([d]) => d >= 1900).sort((a, b) => a[0] - b[0])
  .forEach(([d, c]) => {
    const bar = '█'.repeat(Math.round((c / Math.max(...decades.values())) * 44));
    console.log(`  ${d}s  ${String(c).padStart(4)}  ${bar}`);
  });

console.log('\nBY COMPETITION / THEME');
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${pct(v).padStart(6)}  ${k}`));

console.log('\nDIFFICULTY MIX');
Object.entries(diffs).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${pct(v).padStart(6)}  ${k}`));

console.log(`\nEXPLANATIONS: ${withHint.toLocaleString('en-GB')} of ${QB.length.toLocaleString('en-GB')} (${pct(withHint)}) carry a written explanation.`);
console.log('  (Deliberately not all — some answers need none.)');
