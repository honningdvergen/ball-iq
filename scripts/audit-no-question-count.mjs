// BUILD GATE — the exact question count must never appear in user-facing copy.
//
// ⚠️ WHY THIS IS A GATE AND NOT A NOTE. This is a binding product rule and it
// has been broken three separate times, in three different ways, by three
// different mechanisms:
//
//   1. Hard-coded in index.html's prerender block ("6,409 hand-curated
//      questions"), where it also went stale.
//   2. Interpolated from QB.length in gen-seo-pages.mjs, so every one of ~126
//      club pages printed "a bank of 6,405 questions".
//   3. Written into a B2B pitch doc on the reasoning that a business document
//      was somehow an exception. It is not.
//
// Nobody noticed until an outside review read the live site and found 6,409 on
// the homepage and 6,405 one click away. Two different numbers is worse than
// none: it reads as nobody controlling the figures. "Thousands" says the same
// thing, never goes stale, and cannot contradict another page.
//
// The rule also keeps coming back WEARING A DISGUISE — as a per-club progress
// bar, a "N questions in this pack" badge, a completion percentage. If you are
// about to add any of those, the answer is still no.
//
// Scans the BUILT output, not the sources, because the sources are several
// generators plus hand-written HTML and only the build shows what a reader
// actually gets.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = 'dist';

// Bare four-figure numbers are everywhere in football copy — years, crowds,
// transfer fees. Only flag a number that is TIED TO QUESTIONS by its wording.
const PATTERNS = [
  /\b\d{1,3},\d{3}\+?\s+(?:hand-curated\s+|hand-checked\s+|verified\s+|checked\s+|fact-checked\s+)?(?:football\s+)?(?:trivia\s+)?questions\b/gi,
  /\bbank of\s+\d{1,3},?\d{3}\b/gi,
  /\b\d{1,3},\d{3}\s+questions\s+in\s+the\s+bank\b/gi,
  /\bquestions?\s*:\s*\d{1,3},\d{3}\b/gi,
  /\bscanned all\s+\d{1,3},\d{3}\b/gi,
  // ⚠️ THE FOURTH WAY IT SHIPPED (2026-08-06): the club-page length picker
  // rendered "42 Full set" — the pack size, in a control. Live on 124 pages
  // with values from 15 to 609, so the thinnest packs advertised how thin they
  // were. Note this pattern has NO comma requirement: a per-pack count is two
  // or three digits, which is exactly why the other patterns missed it.
  /\b\d{1,4}\s+Full set\b/g,
  /\b\d{1,4}\s+(?:questions?\s+)?in this (?:pack|quiz|club)\b/gi,

  // ⚠️ THE FIFTH WAY IT SHIPPED (2026-08-08): IN ANOTHER LANGUAGE.
  // Every pattern above requires the English word "questions", and the gate
  // walks the built pages including /es/, /pt/ and /tr/ — so it read
  // "Gratis · 36 preguntas de Boca · sin registro" and saw nothing wrong. Eight
  // counts were live across Spanish, Portuguese and Turkish pages.
  //
  // This is the same rule breaking for the same reason it always does: the
  // count is genuinely useful-looking copy, so it gets re-added in whatever
  // form the gate is not currently watching — a progress bar, a length picker,
  // and now a translation. Add the noun for every language we publish in, the
  // moment we publish in it.
  // ⚠️ THE SEVENTH WAY IT SHIPPED (2026-08-16): THE CLUB NAME IN BETWEEN.
  // The Turkish noun WAS in this list, added the moment we published in Turkish
  // — and "Ücretsiz · 45 Galatasaray sorusu · kayıt yok" still went live on
  // prod, because the count and the noun are not adjacent. Every pattern here
  // required \d then whitespace then the noun; a club name between them is
  // invisible. Languages that put the qualifier before the noun ("45 Boca
  // preguntas", "45 Galatasaray sorusu") break adjacency by grammar, not by
  // accident, so this is the normal shape and not an edge case.
  //
  // Hence: allow up to three intervening words. Bounded, because unbounded
  // would match a number in one clause and a question-noun in the next.
  /\b\d{1,4}\s+(?:[\p{L}'’-]+\s+){0,3}(?:preguntas|perguntas|pertanyaan|soal|fragen|domande|vragen|spørsmål|frågor|questões)\b/giu,
  // Turkish agglutinates the case onto the noun: soru / sorunun / soruluk.
  /\b\d{1,4}\s+(?:[\p{L}'’-]+\s+){0,3}soru\w*\b/giu,

  // ⚠️ THE SIXTH WAY IT SHIPPED (2026-08-12): THE HERO STAT STRIP.
  // It rendered "556 questions" and "151 hard ones" as a scoreboard row on
  // every club, league, category and nation page. TWO separate holes let it
  // through:
  //   · the main pattern requires \d{1,3},\d{3} — a COMMA — so any count under
  //     1,000 was invisible. A per-page pack count is exactly that size.
  //   · the number and the noun are separate DOM nodes (<b>556</b><span>
  //     questions</span>), so they only become adjacent text after tags are
  //     stripped, which the older patterns were not written to expect.
  // "151 hard ones" is the same rule wearing yet another disguise — it is a
  // count of questions without using the word.
  // ⚠️ 3+ DIGITS, AND NOT PRECEDED BY A LETTER. A first cut used \d{1,4} and
  // fired 23 times — every one a FALSE POSITIVE from a club whose name ends in
  // digits: "Schalke 04 questions and answers", "Ligue 1 questions". A pack
  // count worth hiding is three figures or more; one- and two-digit matches are
  // overwhelmingly names, so this trades a theoretical miss for a gate people
  // will actually keep.
  /(?<![A-Za-z])\b\d{3,4}\s+questions\b/gi,
  /\b\d{1,4}\s+hard ones\b/gi,
];

// ⚠️ ONE EXEMPTION, AND IT IS PENDING A DECISION — NOT A PRECEDENT.
//
// /study/football-trivia-memory/ is a published data study whose whole value is
// methodological credibility, and a study that will not state its sample size
// is not research. It says "we scanned all N questions" in the body and the
// meta description.
//
// That is a genuine conflict with the rule, and it is ALEX'S CALL, not this
// script's. It is exempted so the gate does not silently rewrite a linkable
// authority asset, and logged loudly on every build so the decision does not
// rot into a permanent unexamined hole.
//
// Do NOT add entries here to make a build pass. The last time someone reasoned
// their way to an exception ("a B2B pitch is different") they were wrong.
//
// Note the study ALSO reports per-decade tallies ("the 2010s alone account for
// 1,547 questions"). Those are findings, not the bank count, and are fine
// anywhere — the rule is about how big the bank is, not about counting things.
const EXEMPT = [
  { path: '/study/football-trivia-memory/', why: 'data study — sample size is methodologically required; awaiting Alex\'s ruling' },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (/\.(html|txt)$/i.test(entry)) yield p;
  }
}

const hits = [];
const exempted = [];
for (const file of walk(ROOT)) {
  // Strip HTML comments BEFORE matching. Comments are notes to ourselves and
  // are not user-facing — including this rule's own explanation in index.html,
  // which quotes the offending strings and so tripped the gate on the first
  // run. A "look back N characters for an unclosed <!--" heuristic was tried
  // first and failed for exactly that reason: the comment was longer than the
  // window. Removing them outright has no window to get wrong.
  const body = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  for (const re of PATTERNS) {
    for (const m of body.matchAll(re)) {
      const rel = file.replace(/^dist\//, '/').replace(/index\.html$/, '');
      const ex = EXEMPT.find((e) => rel.startsWith(e.path));
      if (ex) { exempted.push({ file: rel, text: m[0].trim(), why: ex.why }); continue; }
      hits.push({ file: file.replace(/^dist\//, '/'), text: m[0].trim() });
    }
  }
}

if (exempted.length) {
  const paths = [...new Set(exempted.map((e) => e.file))];
  console.log(`⚠️  question count ALLOWED on ${paths.length} exempt page(s) — pending decision:`);
  for (const p of paths) {
    const e = exempted.find((x) => x.file === p);
    console.log(`    ${p} — ${e.why}`);
  }
}

if (hits.length) {
  console.error(`\n✗ EXACT QUESTION COUNT IN USER-FACING COPY — ${hits.length} occurrence(s)\n`);
  const byText = {};
  for (const h of hits) (byText[h.text] ||= []).push(h.file);
  for (const [text, files] of Object.entries(byText)) {
    console.error(`  "${text}"`);
    console.error(`    in ${files.length} page(s): ${files.slice(0, 4).join(', ')}${files.length > 4 ? ` …+${files.length - 4}` : ''}`);
  }
  console.error('\n  The exact question count must NEVER appear in copy — binding product rule.');
  console.error('  Say "thousands". It cannot go stale and cannot disagree with another page.');
  console.error('  See the header of this file for the three ways this has shipped before.\n');
  process.exit(1);
}

console.log('✅ No exact question count in user-facing copy');
