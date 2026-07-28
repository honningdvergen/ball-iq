// lists-staleness.mjs — catch /lists tables that have quietly gone out of date.
//
//   node scripts/lists-staleness.mjs            # report
//   node scripts/lists-staleness.mjs --strict   # exit 1 on findings (CI/build)
//
// TODO #52. The 50 reference lists rot SILENTLY: nothing breaks, the page still
// renders, and a wrong "most Ballon d'Ors" table just sits there looking
// authoritative. They are also our AI-answer surface, so a stale row is what
// ChatGPT quotes back at someone.
//
// The `updated` field cannot detect this — every list carries the same date
// from the last bulk edit, whether or not its DATA moved. Two signals that do
// work, both computed from the table contents:
//
//   1. CADENCE LAG. An ANNUAL competition (Ballon d'Or, league champions, top
//      scorers) whose newest row is more than a year behind is stale. A
//      quadrennial one (World Cup, Euros, Copa América) is not — Euro 2024
//      being the newest row in 2026 is correct, and flagging it would train
//      everyone to ignore this script.
//   2. CROSS-LIST DISAGREEMENT. Two lists covering the same competition should
//      agree on its latest edition. If one was topped up after a season and its
//      sibling was forgotten, that gap is the silent-rot failure mode.
//
// Both checks skip AGGREGATE tables — see the note on AGGREGATE below, which
// is where the one finding this script produced on its first run turned out to
// be wrong.

import { LISTS } from './seo/lists.mjs';

const NOW_YEAR = Number(process.env.BIQ_YEAR) || new Date().getUTCFullYear();

// Competitions that do NOT run every year. Newest-row lag is expected here.
const MULTI_YEAR = /world-cup|euro|copa-america|gold-cup|african-cup|afcon|asian-cup|confederations|olympic/;

// AGGREGATE tables ("most X", all-time records) must be exempt from every
// year-based check. Their newest year marks when the RECORD last changed, not
// when the table was last correct.
//
// This cost a false positive worth remembering: most-ballon-dors was flagged
// as 3 years stale because it stops at 2023, while its sibling
// ballon-dor-winners reaches 2025. Both are right. most-ballon-dors lists only
// MULTI-winners, and the 2024 and 2025 winners (Rodri, Dembélé) have one each,
// so neither belongs in it. A "most" table can sit unchanged for a decade and
// be perfectly accurate.
const AGGREGATE = /^most-|-records?$|^all-time-/;

// Group lists that describe the same competition, so siblings can be compared.
const familyOf = (slug) => {
  if (/ballon-dor/.test(slug)) return 'ballon-dor';
  if (/champions-league|european-cup/.test(slug)) return 'champions-league';
  if (/premier-league/.test(slug)) return 'premier-league';
  if (/la-liga/.test(slug)) return 'la-liga';
  if (/serie-a/.test(slug)) return 'serie-a';
  if (/bundesliga/.test(slug)) return 'bundesliga';
  if (/ligue-1/.test(slug)) return 'ligue-1';
  if (/world-cup/.test(slug)) return 'world-cup';
  if (/\beuro/.test(slug)) return 'euros';
  if (/copa-america/.test(slug)) return 'copa-america';
  if (/copa-libertadores/.test(slug)) return 'libertadores';
  if (/fa-cup/.test(slug)) return 'fa-cup';
  return null;
};

const newestYear = (list) => {
  const ys = (list.rows.flat().join(' ').match(/(19|20)\d{2}/g) || []).map(Number)
    .filter((y) => y <= NOW_YEAR + 1);          // ignore typos from the future
  return ys.length ? Math.max(...ys) : null;
};

const info = LISTS.map((l) => ({
  slug: l.slug,
  family: familyOf(l.slug),
  annual: !MULTI_YEAR.test(l.slug) && !AGGREGATE.test(l.slug),
  aggregate: AGGREGATE.test(l.slug),
  newest: newestYear(l),
}));

const findings = [];

// 1. cadence lag
for (const l of info) {
  if (!l.annual || l.newest == null) continue;
  const lag = NOW_YEAR - l.newest;
  if (lag > 1) findings.push({ slug: l.slug, kind: 'cadence-lag', detail: `annual competition, newest row ${l.newest} — ${lag} years behind ${NOW_YEAR}` });
}

// 2. cross-list disagreement within a family
const byFamily = {};
for (const l of info) if (l.family && l.newest != null && !l.aggregate) (byFamily[l.family] ||= []).push(l);
for (const [fam, members] of Object.entries(byFamily)) {
  if (members.length < 2) continue;
  const max = Math.max(...members.map((m) => m.newest));
  for (const m of members) {
    if (max - m.newest >= 2) {
      const ahead = members.filter((x) => x.newest === max).map((x) => x.slug).join(', ');
      findings.push({ slug: m.slug, kind: 'sibling-disagreement', detail: `newest ${m.newest} but "${ahead}" (same ${fam}) reaches ${max}` });
    }
  }
}

if (!findings.length) {
  console.log(`✅ ${LISTS.length} lists, none stale (year ${NOW_YEAR})`);
  process.exit(0);
}
console.log(`⚠️  ${findings.length} stale list finding(s) — year ${NOW_YEAR}\n`);
for (const f of findings) console.log(`  [${f.kind}]  ${f.slug}\n      ${f.detail}`);
console.log(`\n${LISTS.length - new Set(findings.map((f) => f.slug)).size}/${LISTS.length} lists look current.`);
process.exit(process.argv.includes('--strict') ? 1 : 0);
