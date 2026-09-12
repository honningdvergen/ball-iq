#!/usr/bin/env node
/**
 * add-club.mjs — wire one forged club pack into every place that needs it.
 *
 * Usage:  node scripts/add-club.mjs <club.json> [--dry]
 *
 * WHY THIS EXISTS. A forged pack became a live club page through ~13 hand edits
 * across five files, and the build gates caught the mistakes one at a time:
 * wave P failed FOUR builds in a row — wrong club key, questions filed under a
 * category whose era gate rejected them, a missing competition entry, an
 * unreachable directory row. Every one of those was caught, which is the system
 * working, but four red builds per club does not survive a wave of eight.
 *
 * ⚠️ IT REFUSES RATHER THAN GUESSES. Several of these fields encode real
 * decisions that cannot be inferred: the in-app league bucket deliberately
 * differs from the true division (big English clubs sit under "pl" because the
 * app has no Championship section), and a club's CURRENT division is usually
 * past a model's knowledge cutoff. Anything not supplied is an error, never a
 * default. Same principle as careerNameFor() returning null: a club it cannot
 * resolve stops the run instead of inventing an answer.
 *
 * ⚠️ IT IS IDEMPOTENT. Re-running must not double-insert; every edit checks for
 * its own key first and reports "already wired" rather than appending again.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const cfgPath = args.find((a) => !a.startsWith('--'));
if (!cfgPath) { console.error('usage: node scripts/add-club.mjs <club.json> [--dry]'); process.exit(1); }
const cfg = JSON.parse(readFileSync(resolve(cfgPath), 'utf8'));

// Every field is required. A missing one is a decision nobody made.
const REQUIRED = ['pack', 'qbClub', 'slug', 'name', 'league', 'abbr', 'colour', 'icon', 'competition', 'cat', 'questions', 'prose'];
const missing = REQUIRED.filter((k) => cfg[k] === undefined || cfg[k] === null || cfg[k] === '');
if (missing.length) {
  console.error(`✗ refusing: ${missing.length} field(s) not supplied — ${missing.join(', ')}`);
  console.error('  These encode decisions (league bucket, current competition, abbreviation).');
  console.error('  None of them may be defaulted. Supply them or do not run.');
  process.exit(1);
}
for (const p of cfg.prose.intro) if (!p) { console.error('✗ refusing: empty intro paragraph'); process.exit(1); }
if (cfg.prose.title.length > 60) { console.error(`✗ refusing: title is ${cfg.prose.title.length} chars, the gate allows 60`); process.exit(1); }
if (cfg.prose.description.length > 155) { console.error(`✗ refusing: description is ${cfg.prose.description.length} chars, the gate allows 155`); process.exit(1); }

const F = (p) => resolve(ROOT, p);
const edits = [];
const q = (t) => JSON.stringify(t);
function edit(file, find, make, label) {
  const src = readFileSync(F(file), 'utf8');
  if (src.includes(find)) { edits.push(`  · ${label} — already wired`); return; }
  const next = make(src);
  if (next === src) { console.error(`✗ ${label}: anchor not found in ${file} — the file moved, fix this script rather than the file`); process.exit(1); }
  if (!DRY) writeFileSync(F(file), next, 'utf8');
  edits.push(`  ✓ ${label}`);
}

const A = 'src/App.jsx';
const { pack, qbClub, slug, name, league, abbr, colour, icon } = cfg;

// ── 1-6: the six App.jsx maps ────────────────────────────────────────────────
edit(A, `${pack}: "${qbClub}"`, (s) => s.replace(/(export const CLUB_PACK_TO_QB = \{\n)/, `$1  ${pack}: "${qbClub}",\n`), 'CLUB_PACK_TO_QB');
edit(A, `${pack}: "${league}"`, (s) => s.replace(/(export const CLUB_LEAGUES = \{\n)/, `$1  ${pack}: "${league}",\n`), 'CLUB_LEAGUES');
// ⚠️ CLUB_ORDER is a flat league->array map and an unlisted club falls to ?? 1e6,
// sorting silently to the end of its section — no error, just a club nobody scrolls to.
// ⚠️ THE CHECK MUST LOOK INSIDE CLUB_ORDER, NOT THE WHOLE FILE. Matching the
// pack name anywhere in App.jsx meant the entry this script had just written to
// CLUB_PACK_TO_QB counted as proof, so CLUB_ORDER was reported "already wired"
// and skipped — and that is the ONE map whose absence is silent: an unlisted
// club falls to `?? 1e6` and sorts to the end of its section with no error.
{
  const src = readFileSync(F(A), 'utf8');
  const line = (src.match(/export const CLUB_ORDER = .*/) || [''])[0];
  if (line.includes(`"${pack}"`)) edits.push('  · CLUB_ORDER — already wired');
  else {
    const next = src.replace(new RegExp(`("${league}": \\[)`), `$1"${pack}", `);
    if (next === src) { console.error(`✗ CLUB_ORDER: no "${league}" bucket in the map — add the section first`); process.exit(1); }
    if (!DRY) writeFileSync(F(A), next, 'utf8');
    edits.push('  ✓ CLUB_ORDER');
  }
}
edit(A, `${pack}: "${abbr}"`, (s) => s.replace(/(export const CLUB_ABBR = \{\n)/, `$1  ${pack}: "${abbr}",\n`), 'CLUB_ABBR');
edit(A, `"${slug}": "${pack}"`, (s) => s.replace(/((?:export )?const CLUB_SLUG_TO_PACK = \{\n)/, `$1  "${slug}": "${pack}",\n`), 'CLUB_SLUG_TO_PACK');
edit(A, `\n  ${pack}: {`, (s) => s.replace(/(export const CLUB_PACKS = \{\n)/,
  `$1  ${pack}: {\n    name: "${name}", icon: "${icon}", color: "${colour}",\n    questions: [],\n  },\n`), 'CLUB_PACKS');

// ── 7: the page prose ────────────────────────────────────────────────────────
const pr = cfg.prose;
// ⚠️ THE IDEMPOTENCY KEY MUST MATCH WHAT THIS SCRIPT WRITES. It looked for
// `slug: 'x'` in single quotes while writing JSON.stringify's double quotes, so
// a re-run appended a SECOND prose object for the same club — the blind-append
// failure clubs.mjs is explicitly documented against, and the one that produces
// array holes that crash iteration.
edit('scripts/seo/clubs.mjs', `slug: ${q(slug)}`, (s) => s.replace(/(export const CLUBS = \[\n)/,
  `$1  {\n    club: ${q(qbClub)}, slug: ${q(slug)}, name: ${q(name)},\n    h1: ${q(pr.h1)},\n    title: ${q(pr.title)},\n    description: ${q(pr.description)},\n    intro: [\n${pr.intro.map((p) => `      ${q(p)},`).join('\n')}\n    ],\n    faq: [\n${pr.faq.map((f) => `      { q: ${q(f.q)}, a: ${q(f.a)} },`).join('\n')}\n    ],\n  },\n`), 'clubs.mjs prose');

// ── 8: the competition column ────────────────────────────────────────────────
edit('scripts/seo/club-competition.mjs', `${q(qbClub)}:`, (s) => s.replace(/(export const CLUB_COMPETITION = \{\n)/,
  `$1  ${q(qbClub)}: ${q(cfg.competition)},\n`), 'club-competition');

console.log(`\n  ${name} (${slug})`);
console.log(edits.join('\n'));

// ── 9: the questions ─────────────────────────────────────────────────────────
// ⚠️ Delegated, not reimplemented — add-questions.mjs owns the stable id scheme
// and the dedupe, and a second implementation of either would drift.
const qs = JSON.parse(readFileSync(resolve(cfg.questions), 'utf8'))
  .map((x) => ({ ...x, cat: cfg.cat, club: qbClub, type: x.type || 'mcq' }));
const tmp = resolve(ROOT, '.add-club-questions.json');
writeFileSync(tmp, JSON.stringify(qs, null, 1), 'utf8');
if (DRY) { console.log(`  (dry) ${qs.length} questions prepared, not inserted`); process.exit(0); }
console.log(execFileSync('node', [F('scripts/add-questions.mjs'), tmp], { encoding: 'utf8' }).trim().split('\n').map((l) => '  ' + l).join('\n'));

console.log('\n  Now run the build. The gates name anything this script does not yet cover.');
