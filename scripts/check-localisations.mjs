// check-localisations.mjs — gate the store-listing rules that keep coming back.
//
//   node scripts/check-localisations.mjs
//
// Every rule here has already been broken at least once in this project:
//
//   · the KEYWORD OVERLAP rule broke silently after the 5.2.1 FIFA rejection —
//     `world,cup` were stripped and backfilled with `quiz,daily`, both already
//     in the subtitle. Two of sixteen slots sat dead from July to 15 Aug 2026
//     and nothing noticed, because the field still read 100/100. A full keyword
//     field is not a working one, so only a checker can see this.
//   · NO COUNTS is a binding rule from Alex that has returned in disguise three
//     times (per-club progress bar, screenshot copy, "seventy-odd club quizzes").
//   · FIFA / World Cup wording got 1.3.3 rejected under Guideline 5.2.1.
//
// Exit code 1 on any violation, so this can join the build gate.
import { readFileSync } from 'fs';
import { resolve } from 'path';

const FILE = resolve('store-assets/1.6.0/localisations.json');
const doc = JSON.parse(readFileSync(FILE, 'utf8'));

const LIMITS = { name: 30, subtitle: 30, keywords: 100, promo: 170, description: 4000, whatsNew: 4000 };
// Apple counts characters, and non-Latin scripts must be measured the same way
// the console measures them — by code point, not by UTF-8 byte.
const len = (s) => [...s].length;

// Resolve "@en-US" style inheritance so shared copy is written once.
const locales = doc.locales;
const deref = (loc, field) => {
  const v = locales[loc]?.[field];
  if (typeof v === 'string' && v.startsWith('@')) {
    const src = v.slice(1);
    if (!locales[src]) return { err: `${loc}.${field} points at missing locale "${src}"` };
    return deref(src, field);
  }
  return { val: v };
};

const problems = [];
const rows = [];

for (const [loc, cfg] of Object.entries(locales)) {
  const get = (f) => {
    const r = deref(loc, f);
    if (r.err) { problems.push(r.err); return ''; }
    return r.val || '';
  };
  const name = get('name'), subtitle = get('subtitle'), keywords = get('keywords');
  const promo = get('promo'), description = get('description'), whatsNew = get('whatsNew');

  for (const [field, value] of Object.entries({ name, subtitle, keywords, promo, description, whatsNew })) {
    if (!value) continue;
    if (len(value) > LIMITS[field]) {
      problems.push(`${loc}.${field} is ${len(value)} chars, limit ${LIMITS[field]}`);
    }
  }

  // ── THE BIG ONE: name + subtitle + keywords must share no word ──────────────
  // Apple builds phrases ACROSS the three indexed fields, so a repeated word is
  // counted once and the duplicate slot earns nothing.
  const words = (s) => (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
  // Stopwords carry no search value and are not worth flagging as collisions.
  const STOP = new Set(['de', 'el', 'la', 'il', 'le', 'les', 'der', 'die', 'das', 've', 'y', 'e', 'o', 'do', 'da', 'di', 'du', 'und', 'and', 'the', 'a']);
  const nameW = new Set(words(name).filter((w) => !STOP.has(w)));
  const subW = new Set(words(subtitle).filter((w) => !STOP.has(w)));
  const kwW = keywords ? keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean) : [];

  const nsOverlap = [...nameW].filter((w) => subW.has(w));
  const kwOverlap = kwW.filter((k) => nameW.has(k) || subW.has(k));
  if (nsOverlap.length) problems.push(`${loc}: name/subtitle share ${nsOverlap.join(', ')}`);
  if (kwOverlap.length) problems.push(`${loc}: keywords repeat an indexed word — ${kwOverlap.join(', ')} (dead slots)`);
  if (kwW.length !== new Set(kwW).size) problems.push(`${loc}: duplicate keyword within the field`);

  // ── Content rules ──────────────────────────────────────────────────────────
  const all = [name, subtitle, promo, description, whatsNew].join('\n');
  if (/\bFIFA\b|World Cup|Copa del Mundo|Coupe du Monde|Weltmeisterschaft/i.test(all)) {
    problems.push(`${loc}: FIFA / World Cup wording — Guideline 5.2.1 rejected 1.3.3 for this`);
  }
  // Inventory counts. Game RULES (60 seconds, six guesses) are fine; a total
  // number of questions/clubs/modes is not, and it rots the moment we ship more.
  const countish = all.match(/\b\d[\d,.]*\+?\s*(questions|preguntas|perguntas|domande|fragen|questions|sorular|pertanyaan|clubs|clubes|vereine|squadre|quizzes|modes)\b/gi);
  if (countish) problems.push(`${loc}: inventory count in copy — "${countish[0]}" (binding no-counts rule)`);

  rows.push({
    loc,
    name: `${len(name)}/30`,
    sub: `${len(subtitle)}/30`,
    kw: `${len(keywords)}/100`,
    promo: promo ? `${len(promo)}/170` : '—',
    desc: description ? `${len(description)}` : '—',
    new: whatsNew ? `${len(whatsNew)}` : '—',
  });
}

console.log(`\n${rows.length} locales in ${FILE.split('/').slice(-1)[0]}\n`);
console.log(['locale', 'name', 'subtitle', 'keywords', 'promo', 'desc', 'new'].map((h) => h.padEnd(10)).join(''));
for (const r of rows) {
  console.log([r.loc, r.name, r.sub, r.kw, r.promo, r.desc, r.new].map((c) => String(c).padEnd(10)).join(''));
}

if (problems.length) {
  console.log(`\n❌ ${problems.length} problem(s):`);
  for (const p of problems) console.log('   · ' + p);
  process.exit(1);
}
console.log('\n✅ all locales: within limits, no repeated indexed word, no counts, no 5.2.1 wording');
