// build-es-entries-latam.mjs — assemble a Latin American /es/ wave into
// clubs-es.mjs entries. Deterministic, no agents: the facts were settled in
// English and the translation ran separately. This only assembles, checks and
// formats.
//
//   node scripts/build-es-entries-latam.mjs <wave.json> > /tmp/entries.txt
//
// ⚠️ ONE /es/ LAYER, THREE REGISTERS, AND THEY ARE NOT INTERCHANGEABLE.
//   · Peninsular — the eight Spanish clubs, built by build-es-entries.mjs.
//   · Rioplatense ('ar') — Boca, River, Racing, Independiente, San Lorenzo: voseo
//     ("¿Cuánto sabés…?", "Jugá"), arquero/técnico/hinchada, and no article before
//     the club ("de Racing", never "del Racing").
//   · Mexican ('mx') — América, Chivas, Cruz Azul: tuteo ("¿Cuánto sabes…?",
//     "Juega"), portero/técnico/afición, "futbol" without the accent, "en vivo",
//     and the article where the club takes one: "del América" — "de América"
//     reads as the continent.
// This file was build-es-entries-ar.mjs until 2026-09-16. A third near-copy for
// Mexico would have drifted from the second; the register is a property of the
// club, so it lives in META and selects the copy block and the checks.
//
// ⚠️ THE `en` FIELD IS NOT OPTIONAL AND NOT DECORATION.
// gen-seo-pages.mjs compares every translated correct answer back to the bank.
// It folds accents and accepts containment, but not every translation contains
// its original. Declaring `en` switches the check to compare THAT against the
// bank, which snapshots today's English answer: a later bank correction then
// fails the build by name instead of leaving the Spanish page quoting a fact
// that has since changed.
import { readFileSync } from 'fs';

const waveFile = process.argv[2];
if (!waveFile) {
  console.error('usage: node scripts/build-es-entries-latam.mjs <wave.json>');
  process.exit(2);
}

const { QB } = await import('../src/questions.js');
const byId = new Map(QB.map((q) => [q.id, q]));

// `club` must equal the bank's `club` value — pages join to questions on it.
// `name` is what the page displays. They differ for Chivas.
const META = {
  'racing-club':   { register: 'ar', club: 'Racing Club',   name: 'Racing Club',   of: 'de Racing' },
  independiente:   { register: 'ar', club: 'Independiente', name: 'Independiente', of: 'de Independiente' },
  'san-lorenzo':   { register: 'ar', club: 'San Lorenzo',   name: 'San Lorenzo',   of: 'de San Lorenzo' },
  'club-america':  { register: 'mx', club: 'Club América',  name: 'Club América',  of: 'del América' },
  chivas:          { register: 'mx', club: 'Guadalajara',   name: 'Chivas',        of: 'de Chivas' },
  'cruz-azul':     { register: 'mx', club: 'Cruz Azul',     name: 'Cruz Azul',     of: 'del Cruz Azul' },
};

// ⚠️ A FORBIDDEN FORM MUST BE A TELL, NOT A WORD. The first version of this list
// failed the build on "juega", which is 3rd-person indicative ("Racing juega el
// clásico") as often as it is the tú-imperative. A detector that flags correct
// text teaches you to wave the gate through, so each entry here is a form that is
// wrong in that register in EVERY context it can appear.
const REGISTERS = {
  ar: {
    forbidden: [
      [/\bsabes\b/i, 'sabes (tuteo) — use sabés'],  // 2nd person only, unambiguous
      [/(^|[.!?¡¿]\s+|["«(]\s*)Juega\b/, 'imperative "Juega" — use "Jugá"'],
      [/\bjugad\b|\bjugáis\b|\bsabéis\b|\bvosotros\b/i, 'vosotros form (peninsular)'],
      [/\bdemuéstralo\b/i, 'demuéstralo (tuteo) — use demostralo'],
      [/\bportero\b/i, 'portero — use arquero'],
      [/\bentrenador\b/i, 'entrenador (peninsular) — use técnico or DT'],
      [/\bafición\b/i, 'afición (peninsular) — use hinchada'],
      [/\baquí\b/i, 'aquí (peninsular) — use acá'],
      [/\bdel Racing\b/, 'del Racing — Racing takes no article'],
      [/\bdel Independiente\b/, 'del Independiente — takes no article'],
      [/\bdel San Lorenzo\b/, 'del San Lorenzo — takes no article'],
    ],
    copy: (m) => ({
      tasterEyebrow: 'Muestra gratis · Sin registro',
      tasterH: `¿Cuánto sabés ${m.of}?`,
      tasterNote: 'Preguntas de muestra — el quiz completo tiene muchas más.',
      playSection: `Jugá el quiz ${m.of}`,
      playSub: 'Tocá una respuesta para comprobarla — correcto o incorrecto al instante, y la historia detrás.',
      bandH: `¿Te creés que sabés ${m.of}? Demostralo en la app.`,
      bandP: 'Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.',
      alsoH: 'La misma página en inglés',
      alsoP: `Esta página es la versión en español de nuestro quiz ${m.of}. La original, en inglés, está acá:`,
      alsoLink: `${m.name} quiz (English)`,
    }),
  },
  mx: {
    forbidden: [
      [/\b(sabés|creés|tenés|querés|podés)\b/i, 'voseo (Rioplatense) — Mexican Spanish uses tuteo'],
      [/\b(jugá|tocá|mirá|probá)\b/i, 'voseo imperative — use juega / toca / mira / prueba'],
      [/\bdemostralo\b/i, 'demostralo (voseo) — use demuéstralo'],
      [/\bjugad\b|\bjugáis\b|\bsabéis\b|\bvosotros\b/i, 'vosotros form (peninsular)'],
      [/\bfútbol\b/i, '"fútbol" with an accent — Mexican usage is "futbol"'],
      [/\ben directo\b/i, '"en directo" (peninsular) — use "en vivo"'],
      // "Copa América" is the tournament and is fine; only "de América" as the club is wrong.
      [/\bde América\b/, '"de América" reads as the continent — the club is "del América"'],
    ],
    copy: (m) => ({
      tasterEyebrow: 'Muestra gratis · Sin registro',
      tasterH: `¿Cuánto sabes ${m.of}?`,
      tasterNote: 'Preguntas de muestra — el quiz completo tiene muchas más.',
      playSection: `Juega el quiz ${m.of}`,
      playSub: 'Toca una respuesta para comprobarla — correcto o incorrecto al instante, y la historia detrás.',
      bandH: `¿Crees que sabes ${m.of}? Demuéstralo en la app.`,
      bandP: 'Rachas, 1v1 en vivo, un rating sobre 99 — y todos los quizzes en una sola app. La app está en inglés.',
      alsoH: 'La misma página en inglés',
      alsoP: `Esta página es la versión en español de nuestro quiz ${m.of}. La original, en inglés, está aquí:`,
      alsoLink: `${m.name} quiz (English)`,
    }),
  },
};

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
  const reg = REGISTERS[m.register];
  const p = r.prose || {};

  const rank = { easy: 0, medium: 1, hard: 2 };
  const seen = new Set();
  const rows = (r.questions || []).map((t) => {
    const src = byId.get(t.id);
    if (!src) { problems.push(`${r.slug}/${t.id}: id not in bank`); return null; }
    if (src.club !== m.club) { problems.push(`${r.slug}/${t.id}: bank row belongs to ${src.club}, not ${m.club}`); return null; }
    if (seen.has(t.id)) { problems.push(`${r.slug}/${t.id}: duplicated in the wave`); return null; }
    seen.add(t.id);
    if (t.a !== src.a) { problems.push(`${r.slug}/${t.id}: answer index moved (${src.a} -> ${t.a}) — the key is broken`); return null; }
    if (!Array.isArray(t.o) || t.o.length !== 4) { problems.push(`${r.slug}/${t.id}: ${t.o?.length ?? 0} options, need 4`); return null; }
    if (!t.hint) { problems.push(`${r.slug}/${t.id}: no hint`); return null; }
    if (/\?\s*$/.test(t.q) && !t.q.includes('¿')) { problems.push(`${r.slug}/${t.id}: question with no opening ¿`); return null; }
    return { id: t.id, q: t.q, o: t.o, a: t.a, hint: t.hint, en: src.o[src.a], _d: rank[src.diff] ?? 1 };
  }).filter(Boolean);

  // Easy-first, so the hero taster opens gently.
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
    name: m.name,
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
      ...reg.copy(m),
      tasterPh: p.tasterPh,
      faqH: p.faqH,
      aboutQ: p.aboutQ,
      statsLine: p.statLine,
    },
  };

  // Checked on the ASSEMBLED entry, so the copy block this script writes is
  // held to the same register as everything the agents wrote.
  const blob = JSON.stringify(entry);
  for (const [re, why] of reg.forbidden) if (re.test(blob)) problems.push(`${r.slug}: ${why}`);
  for (const re of COUNTS) {
    const hit = blob.match(re);
    if (hit) problems.push(`${r.slug}: prints a question count — "${hit[0]}"`);
  }

  out.push(entry);
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s) — nothing emitted`);
  problems.slice(0, 25).forEach((x) => console.error('   ' + x));
  process.exit(1);
}

console.error(`✅ ${out.length} entries built`);
for (const e of out) {
  console.error(`   ${e.slug.padEnd(16)} [${META[e.slug].register}] taster ${e.taster.length} · sample ${e.sample.length} · title ${e.title.length}c · desc ${e.description.length}c`);
}
process.stdout.write(out.map((e) => JSON.stringify(e, null, 2).split('\n').map((l) => '  ' + l).join('\n')).join(',\n'));
