// build-es-entries-ar.mjs — assemble the Argentine /es/ wave into clubs-es.mjs
// entries. Deterministic, no agents: the facts were settled in English and the
// translation ran separately. This only assembles, checks and formats.
//
//   node scripts/build-es-entries-ar.mjs <wave.json> > /tmp/ar-entries.txt
//
// ⚠️ WHY THIS IS A SIBLING OF build-es-entries.mjs RATHER THAN A FLAG ON IT.
// That script is peninsular by construction: "del Barça", "¿Cuánto sabes…",
// "Juega". These three clubs are Buenos Aires clubs and take the Rioplatense
// register the Boca and River pages already use — voseo, no definite article,
// arquero/técnico/hinchada. Same file, two registers, by market, exactly as the
// Portuguese layer splits European from Brazilian.
//
// ⚠️ THE `en` FIELD IS NOT OPTIONAL AND NOT DECORATION.
// gen-seo-pages.mjs compares every translated correct answer back to the bank.
// It folds accents and accepts containment, so "Atlético" vs "Atletico" passes —
// but "Copa Libertadores" vs "Libertadores" may not. Declaring `en` switches the
// check to compare THAT against the bank, which snapshots today's English answer:
// a later bank correction then fails the build by name instead of leaving the
// Spanish page quoting a fact that has since changed.
import { readFileSync } from 'fs';

const waveFile = process.argv[2];
if (!waveFile) {
  console.error('usage: node scripts/build-es-entries-ar.mjs <wave.json>');
  process.exit(2);
}

const { QB } = await import('../src/questions.js');
const byId = new Map(QB.map((q) => [q.id, q]));

// No definite article on any of these — "de Racing", never "del Racing".
// Getting this wrong is the loudest possible tell to the audience the page is for.
const META = {
  'racing-club':   { club: 'Racing Club',   of: 'de Racing',        short: 'Racing' },
  independiente:   { club: 'Independiente', of: 'de Independiente', short: 'Independiente' },
  'san-lorenzo':   { club: 'San Lorenzo',   of: 'de San Lorenzo',   short: 'San Lorenzo' },
};

// Peninsular forms that must never appear in a Rioplatense page. Checked against
// the assembled entry rather than trusted from the translator.
const PENINSULAR = [
  [/\bsabes\b/i, 'sabes (peninsular) — use sabés'],  // unambiguous: 2nd person only
  // ⚠️ "juega" IS NOT A TELL ON ITS OWN, and a rule that says it is fails the
  // build on correct Spanish. It is 3rd-person indicative as often as it is the
  // tú-imperative: "Racing juega el clásico de Avellaneda", "Arias juega para
  // Chile", and the impersonal "Se juega acá mismo en el navegador" — which is
  // the exact sentence the live Boca page already ships. Only the IMPERATIVE
  // ("Juega el quiz" for "Jugá el quiz") is peninsular, and in this copy the
  // imperative is always sentence-initial. A detector that flags correct text is
  // worse than no detector: it teaches you to wave the gate through.
  [/(^|[.!?¡¿]\s+|["«(]\s*)Juega\b/, 'imperative "Juega" (peninsular) — use "Jugá"'],
  [/\bjugad\b|\bjugáis\b|\bsabéis\b|\bvosotros\b/i, 'vosotros form (peninsular)'],
  [/\bdemuéstralo\b/i, 'demuéstralo (peninsular) — use demostralo'],
  [/\bportero\b/i, 'portero (peninsular) — use arquero'],
  [/\bentrenador\b/i, 'entrenador (peninsular) — use técnico or DT'],
  [/\bafición\b/i, 'afición (peninsular) — use hinchada'],
  [/\baquí\b/i, 'aquí (peninsular) — use acá'],
  [/\bdel Racing\b/, 'del Racing — Racing takes no article'],
  [/\bdel Independiente\b/, 'del Independiente — takes no article'],
  [/\bdel San Lorenzo\b/, 'del San Lorenzo — takes no article'],
];

// The banned-count rule. Seven disguises have beaten a looser version of this.
const COUNTS = [
  /\b\d{1,4}\s*(preguntas|pregunta)\b/i,
  /\b(treinta|cuarenta|cincuenta|veinte|diez)\s*(y\s*\w+\s*)?preguntas\b/i,
  /\bmás de \w+ preguntas\b/i,
];

const wave = JSON.parse(readFileSync(waveFile, 'utf8'));
const clubs = Array.isArray(wave) ? wave : wave.clubs;
if (!Array.isArray(clubs)) {
  console.error('✗ wave file has neither a top-level array nor a .clubs array');
  process.exit(2);
}

const out = [];
const problems = [];

for (const r of clubs) {
  const m = META[r.slug];
  if (!m) { problems.push(`${r.slug}: no META entry`); continue; }
  const p = r.prose || {};

  const rank = { easy: 0, medium: 1, hard: 2 };
  const seen = new Set();
  const rows = (r.questions || []).map((t) => {
    const src = byId.get(t.id);
    if (!src) { problems.push(`${r.slug}/${t.id}: id not in bank`); return null; }
    if (seen.has(t.id)) { problems.push(`${r.slug}/${t.id}: duplicated in the wave`); return null; }
    seen.add(t.id);
    if (t.a !== src.a) { problems.push(`${r.slug}/${t.id}: answer index moved (${src.a} -> ${t.a}) — the key is broken`); return null; }
    if (!Array.isArray(t.o) || t.o.length !== 4) { problems.push(`${r.slug}/${t.id}: ${t.o?.length ?? 0} options, need 4`); return null; }
    if (!t.hint) { problems.push(`${r.slug}/${t.id}: no hint`); return null; }
    return { id: t.id, q: t.q, o: t.o, a: t.a, hint: t.hint, en: src.o[src.a], _d: rank[src.diff] ?? 1 };
  }).filter(Boolean);

  // Easy-first, so the hero taster opens gently rather than with the hardest
  // question in the pack.
  rows.sort((a, b) => a._d - b._d);
  const strip = (x) => ({ id: x.id, q: x.q, o: x.o, a: x.a, hint: x.hint, en: x.en });
  const taster = rows.slice(0, 10).map(strip);
  const sample = rows.slice(10, 22).map(strip);
  if (taster.length < 10 || sample.length < 12) {
    problems.push(`${r.slug}: only ${rows.length} usable rows — needs 22 for taster+sample`);
    continue;
  }

  if (!Array.isArray(p.intro) || p.intro.length !== 4) problems.push(`${r.slug}: intro is ${p.intro?.length ?? 0} paragraphs, must be 4`);
  if (!Array.isArray(p.faq) || p.faq.length !== 4) problems.push(`${r.slug}: faq is ${p.faq?.length ?? 0} items, must be 4`);
  if ((p.title || '').length > 60) problems.push(`${r.slug}: title ${p.title.length}c, max 60`);
  if ((p.description || '').length > 155) problems.push(`${r.slug}: description ${p.description.length}c, max 155`);

  const entry = {
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
      tasterH: `¿Cuánto sabés ${m.of}?`,
      tasterPh: p.tasterPh,
      tasterNote: 'Preguntas de muestra — el quiz completo tiene muchas más.',
      playSection: `Jugá el quiz ${m.of}`,
      playSub: 'Tocá una respuesta para comprobarla — correcto o incorrecto al instante, y la historia detrás.',
      faqH: p.faqH,
      aboutQ: p.aboutQ,
      bandH: `¿Te creés que sabés ${m.of}? Demostralo en la app.`,
      bandP: 'Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.',
      alsoH: 'La misma página en inglés',
      alsoP: `Esta página es la versión en español de nuestro quiz ${m.of}. La original, en inglés, está acá:`,
      alsoLink: `${m.club} quiz (English)`,
      statsLine: p.statLine,
    },
  };

  // Register and banned-count checks run on the ASSEMBLED entry, so they cover
  // the copy block this script writes as well as everything the agents wrote.
  const blob = JSON.stringify(entry);
  for (const [re, why] of PENINSULAR) if (re.test(blob)) problems.push(`${r.slug}: ${why}`);
  for (const re of COUNTS) {
    const hit = blob.match(re);
    if (hit) problems.push(`${r.slug}: prints a question count — "${hit[0]}"`);
  }

  out.push(entry);
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s) — nothing emitted`);
  problems.slice(0, 20).forEach((x) => console.error('   ' + x));
  process.exit(1);
}

console.error(`✅ ${out.length} entries built`);
for (const e of out) {
  console.error(`   ${e.slug.padEnd(16)} taster ${e.taster.length} · sample ${e.sample.length} · title ${e.title.length}c · desc ${e.description.length}c`);
}
process.stdout.write(out.map((e) => JSON.stringify(e, null, 2).split('\n').map((l) => '  ' + l).join('\n')).join(',\n'));
