// One-shot: put "Answers" in the club <title> where the pack actually explains
// its answers.
//
// WHY. 28 days of Search Console say "X quiz with answers" converts 3-5x better
// than the bare club term: Rangers 30.8% vs 5.6%, Tottenham 15.0% vs 3.1%,
// Liverpool 7.1%. That is people searching for the one thing this bank is built
// to be, and far fewer sites can serve it than can serve "arsenal quiz".
//
// 25 of 72 club titles already said "Answers". 47 did not. Every one of those
// 47 with a matching pack explains >=90% of its questions -- spot-checked at
// Manchester United 42/42, Napoli 42/42, Hajduk Split 15/15 -- because club
// packs are forged behind the >=15-hint build gate. So the claim is TRUE, not
// keyword stuffing, and this file refuses to write it anywhere it is not.
//
// Eight titles could not take a generic "& Answers" inside the 60-char SERP
// cap. Those get a hand-written shorter nickname rather than a truncation:
// every substitution below is a real, checkable nickname for that club.

import { readFileSync, writeFileSync } from 'fs';

const TITLE_MAX = 60;
const COVERAGE_MIN = 0.9;

const { CLUBS } = await import('../scripts/seo/clubs.mjs');
const qb = await import('../src/questions.js');
const QB = qb.QUESTIONS || qb.default || Object.values(qb).find((v) => Array.isArray(v) && v.length > 1000);

const cov = {};
for (const q of QB) {
  if (!q.club) continue;
  cov[q.club] = cov[q.club] || [0, 0];
  cov[q.club][0]++;
  if (q.hint && String(q.hint).trim()) cov[q.club][1]++;
}

// Hand-written where the generic rule overflows. Left side must match the
// existing title exactly; right side is the replacement, all <= 60 chars.
const OVERRIDES = {
  newcastle: 'Newcastle United Quiz — Magpies Trivia & Answers | Ball IQ',
  trabzonspor: 'Trabzonspor Quiz — Bordo-Mavi Trivia & Answers | Ball IQ',
  'red-star-belgrade': 'Red Star Belgrade Quiz — Zvezda Trivia & Answers | Ball IQ',
  'nottingham-forest': 'Nottingham Forest Quiz — Reds Trivia & Answers | Ball IQ',
  sunderland: 'Sunderland Quiz — Black Cats Trivia & Answers | Ball IQ',
  'crystal-palace': 'Crystal Palace Quiz — Eagles Trivia & Answers | Ball IQ',
  corinthians: 'Corinthians Quiz — Timão Trivia & Answers | Ball IQ',
  'hajduk-split': 'Hajduk Split Quiz — Torcida Trivia & Answers | Ball IQ',
};

const file = 'scripts/seo/clubs.mjs';
let src = readFileSync(file, 'utf8');

const changed = [];
const skipped = [];

for (const c of CLUBS) {
  const t = c.title || '';
  if (/answer/i.test(t)) { skipped.push([c.slug, 'already says answers']); continue; }

  // Match on `club`, NOT `name`. They are different fields: `club` is the pack
  // key into the bank, `name` is display text. They diverge for exactly one
  // club -- Besiktas (pack) vs Beşiktaş (display) -- and matching on `name`
  // made this script report "no pack matched" for a club whose pack is 39/39
  // explained, so it skipped a title that had every right to the claim.
  const st = cov[c.club] || cov[c.name];
  if (!st || !st[0]) { skipped.push([c.slug, 'no pack matched by club key — claim unverifiable']); continue; }
  if (st[1] / st[0] < COVERAGE_MIN) {
    skipped.push([c.slug, `only ${Math.round((100 * st[1]) / st[0])}% explained — claim would be false`]);
    continue;
  }

  let nt = OVERRIDES[c.slug];
  if (!nt) {
    nt = t.replace(' Trivia | Ball IQ', ' Trivia & Answers | Ball IQ');
    if (nt === t) nt = t.replace(' | Ball IQ', ' & Answers | Ball IQ');
  }

  if (nt === t) { skipped.push([c.slug, 'no rule matched the title shape']); continue; }
  if (nt.length > TITLE_MAX) { skipped.push([c.slug, `would be ${nt.length} chars — over the cap`]); continue; }

  // The imported title is decoded; the source may store it escaped. Two titles
  // hold their em dash as a six-character backslash-u escape, so this match
  // finds 0 and the club is skipped rather than silently written nowhere.
  // That is the intended behaviour -- a 0 here means "hand-edit that line",
  // not "the title is fine". Hajduk Split and Besiktas were fixed that way.
  const count = src.split(t).length - 1;
  if (count !== 1) { skipped.push([c.slug, `title appears ${count}x in source — refusing, hand-edit it`]); continue; }

  src = src.replace(t, nt);
  changed.push([c.slug, t.length, nt.length, nt]);
}

// Duplicate-title check BEFORE writing: the SERP gate fails the build on dupes.
const finalTitles = CLUBS.map((c) => (changed.find((x) => x[0] === c.slug) || [])[3] || c.title);
const dupes = finalTitles.filter((t, i) => finalTitles.indexOf(t) !== i);
if (dupes.length) { console.error('DUPLICATE TITLES:', dupes); process.exit(1); }

const over = changed.filter((x) => x[2] > TITLE_MAX);
if (over.length) { console.error('OVER CAP:', over); process.exit(1); }

writeFileSync(file, src);

console.log(`changed ${changed.length} titles, skipped ${skipped.length}`);
console.log(`longest new title: ${Math.max(...changed.map((x) => x[2]))} chars (cap ${TITLE_MAX})`);
console.log('\nskipped, with reasons:');
for (const [slug, why] of skipped.slice(0, 8)) console.log(`  ${slug.padEnd(22)} ${why}`);
if (skipped.length > 8) console.log(`  ...and ${skipped.length - 8} more (already said answers)`);
console.log('\nsample of changes:');
for (const c of changed.slice(0, 8)) console.log(`  ${String(c[2]).padStart(2)}  ${c[3]}`);
