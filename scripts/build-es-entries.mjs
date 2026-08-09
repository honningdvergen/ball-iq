// build-es-entries.mjs — turn the Spanish translation wave into clubs-es.mjs
// entries. Deterministic, no agents: everything here is assembly, and the facts
// were settled in English long before the translation ran.
//
//   node scripts/build-es-entries.mjs > /tmp/es-entries.txt
//
// ⚠️ THE `en` FIELD IS NOT OPTIONAL AND NOT DECORATION.
// gen-seo-pages.mjs compares every translated correct answer back to the bank.
// It folds accents and punctuation and accepts containment, so "Atlético" vs
// "Atletico" passes — but "Inter de Milán" vs "Inter Milan" does not contain
// either way, and neither does "Campo Nuevo" vs "New Field" or "Cinco" vs
// "Five". Those throw at build time. Declaring `en` switches the check to
// compare THAT against the bank instead, which is the tripwire working as
// designed: it snapshots today's English answer, so a later bank correction
// fails the build by name instead of leaving the Spanish page quoting a fact
// that has since changed.
//
// ⚠️ REGISTER IS PENINSULAR, NOT RIOPLATENSE. The existing /es/ pages are Boca
// and River and are deliberately Argentine — "¿Cuánto sabés…", "Jugá", "acá".
// These eight are Spanish clubs; reusing that copy would read as obviously
// wrong to the audience the page is for.
import { readFileSync } from 'fs';

const { QB } = await import('../src/questions.js');
const byId = new Map(QB.map((q) => [q.id, q]));

const batches = [
  ...JSON.parse(readFileSync('scripts/wave-es-partial.json', 'utf8')),
  ...JSON.parse(readFileSync('scripts/wave-es-batch2.json', 'utf8')),
];

// Spanish needs the article, and it is not derivable from the name:
// "del Real Madrid" but "de la Real Sociedad", "del Athletic".
const META = {
  barcelona:        { club: 'Barcelona',       of: 'del Barça',            short: 'el Barça' },
  sevilla:          { club: 'Sevilla',         of: 'del Sevilla',          short: 'el Sevilla' },
  'real-madrid':    { club: 'Real Madrid',     of: 'del Real Madrid',      short: 'el Madrid' },
  'atletico-madrid':{ club: 'Atlético Madrid', of: 'del Atlético',         short: 'el Atleti' },
  'real-betis':     { club: 'Real Betis',      of: 'del Betis',            short: 'el Betis' },
  'athletic-bilbao':{ club: 'Athletic Bilbao', of: 'del Athletic',         short: 'el Athletic' },
  valencia:         { club: 'Valencia',        of: 'del Valencia',         short: 'el Valencia' },
  'real-sociedad':  { club: 'Real Sociedad',   of: 'de la Real Sociedad',  short: 'la Real' },
};

const out = [];
const problems = [];

for (const r of batches) {
  const m = META[r.slug];
  if (!m) { problems.push(`${r.slug}: no META entry`); continue; }
  const p = r.prose || {};

  // Attach `en` from the bank, and order easy-first so the hero taster opens
  // gently rather than with the hardest question in the pack.
  const rank = { easy: 0, medium: 1, hard: 2 };
  const rows = r.questions.map((t) => {
    const src = byId.get(t.id);
    if (!src) { problems.push(`${r.slug}/${t.id}: id not in bank`); return null; }
    if (t.a !== src.a) { problems.push(`${r.slug}/${t.id}: answer index moved`); return null; }
    return { id: t.id, q: t.q, o: t.o, a: t.a, hint: t.hint, en: src.o[src.a], _d: rank[src.diff] ?? 1 };
  }).filter(Boolean);

  rows.sort((a, b) => a._d - b._d);
  const strip = (x) => ({ id: x.id, q: x.q, o: x.o, a: x.a, hint: x.hint, en: x.en });
  const taster = rows.slice(0, 10).map(strip);
  const sample = rows.slice(10, 22).map(strip);
  if (taster.length < 10 || sample.length < 12) {
    problems.push(`${r.slug}: only ${rows.length} rows — needs 22 for taster+sample`);
    continue;
  }

  out.push({
    club: m.club,
    slug: r.slug,
    lang: 'es',
    name: m.club,
    h1: p.h1,
    title: p.title,
    description: p.description,
    kind: p.kind || 'Quiz de club',
    statLine: p.statLine,
    playLabel: p.playLabel || 'Jugar el quiz',
    intro: p.intro,
    faq: p.faq,
    taster,
    sample,
    copy: {
      tasterEyebrow: 'Muestra gratis · Sin registro',
      tasterH: `¿Cuánto sabes ${m.of}?`,
      tasterPh: p.tasterPh,
      tasterNote: 'Preguntas de muestra — el quiz completo tiene muchas más.',
      playSection: `Juega el quiz ${m.of}`,
      playSub: 'Toca una respuesta para comprobarla — acierto o fallo al instante, y la historia detrás.',
      faqH: p.faqH,
      aboutQ: p.aboutQ,
      bandH: `¿Crees que sabes ${m.of}? Demuéstralo en la app.`,
      bandP: 'Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.',
      alsoH: 'La misma página en inglés',
      alsoP: `Esta página es la versión en español de nuestro quiz ${m.of}. La original, en inglés, está aquí:`,
      alsoLink: `${m.club} quiz (English)`,
      statsLine: p.statLine,
    },
  });
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s) — nothing emitted`);
  problems.slice(0, 10).forEach((x) => console.error('   ' + x));
  process.exit(1);
}

console.error(`✅ ${out.length} entries built`);
for (const e of out) {
  console.error(`   ${e.slug.padEnd(18)} taster ${e.taster.length} · sample ${e.sample.length} · title ${e.title.length}c · desc ${e.description.length}c`);
}
process.stdout.write(out.map((e) => JSON.stringify(e, null, 2).split('\n').map((l) => '  ' + l).join('\n')).join(',\n'));
