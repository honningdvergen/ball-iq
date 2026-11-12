// test-structured-data.mjs: validates the JSON-LD on every built page in dist/
// against schema.org and Google's rich-result rules.
//
// WHY (7 Nov 2026). Tide found HowTo steps missing `text` on its own site: a
// structured-data defect no test saw, because nothing read the shipped JSON-LD
// against the spec. test-site.mjs pins which types we may ship (no Quiz, no
// FAQPage); this checks that what we do ship (BreadcrumbList, ItemList, Game,
// WebApplication, Article...) is well formed. Run AFTER `npm run build`:
//
//   npm run test:structured-data
//   node scripts/test-structured-data.mjs --dist <dir>
//
// ERRORS fail the run. WARNINGS are printed and do not fail: today's three are
// `gamePlatform` and `playMode` on Game pages (VideoGame properties), which is
// an SEO template decision, not a test fix.
//
// The schema.org vocabulary is PINNED (SCHEMA_VERSION) and cached under
// node_modules/.cache, so a schema.org release cannot turn CI red on its own.
// It is fetched once per fresh install (~1.5 MB).
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, relative, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Validator from '@adobe/structured-data-validator';
import WebAutoExtractor from '@marbec/web-auto-extractor';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const i = process.argv.indexOf('--dist');
const DIST = i > 0 && process.argv[i + 1] ? resolve(process.argv[i + 1]) : resolve(ROOT, 'dist');

const SCHEMA_VERSION = '29.4';
const SCHEMA_URL = `https://raw.githubusercontent.com/schemaorg/schemaorg/main/data/releases/${SCHEMA_VERSION}/schemaorg-all-https.jsonld`;
const CACHE = resolve(ROOT, `node_modules/.cache/schemaorg-${SCHEMA_VERSION}.jsonld`);

if (!existsSync(resolve(DIST, 'index.html'))) {
  console.error(`✗ ${DIST}/index.html not found. Run \`npm run build\` first.`);
  process.exit(2);
}

async function loadSchema() {
  if (existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, 'utf8'));
  const res = await fetch(SCHEMA_URL);
  if (!res.ok) {
    console.error(`✗ could not fetch schema.org ${SCHEMA_VERSION} (${res.status}) from ${SCHEMA_URL}`);
    process.exit(2);
  }
  const text = await res.text();
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, text);
  return JSON.parse(text);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const validator = new Validator(await loadSchema());
const extractor = new WebAutoExtractor({ addLocation: true, embedSource: ['rdfa', 'microdata'] });

const files = walk(DIST).filter((f) => readFileSync(f, 'utf8').includes('application/ld+json'));
const errors = new Map();
const warnings = new Map();
const types = {};
for (const f of files) {
  const data = extractor.parse(readFileSync(f, 'utf8'));
  for (const t of Object.keys(data.jsonld || {})) types[t] = (types[t] || 0) + 1;
  for (const r of await validator.validate(data)) {
    const where = (r.path || []).map((p) => p.type).join(' > ');
    const key = `${where}: ${r.issueMessage}`;
    const bucket = r.severity === 'ERROR' ? errors : warnings;
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key).push(relative(DIST, f));
  }
}

const list = (m) =>
  [...m].sort((a, b) => b[1].length - a[1].length)
    .forEach(([k, fs]) => console.log(`  ${fs.length} hit(s) · ${k}\n      e.g. ${[...new Set(fs)].slice(0, 3).join(', ')}`));

console.log(`structured data: ${files.length} pages with JSON-LD, schema.org ${SCHEMA_VERSION}`);
console.log(`  types: ${Object.entries(types).map(([t, n]) => `${t} ${n}`).join(', ')}`);
if (files.length === 0) {
  console.error('✗ no page in dist carries JSON-LD; the build or this script is broken.');
  process.exit(1);
}
if (warnings.size) {
  console.log(`\n⚠️  ${warnings.size} warning kind(s), not failing:`);
  list(warnings);
}
if (errors.size) {
  console.error(`\n✗ ${errors.size} structured-data error kind(s):`);
  list(errors);
  process.exit(1);
}
console.log('\n✅ no structured-data errors');
