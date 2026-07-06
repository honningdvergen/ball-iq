// Inject the deploy's hashed asset list into dist/sw.js so the service worker
// precaches the FULL app shell at install time (see the PRECACHE_MANIFEST
// comment in public/sw.js for why). Runs last in `npm run build`, after vite
// has emitted dist/assets and gen-seo-pages has finished with dist/.
//
// Source public/sw.js keeps `const PRECACHE_MANIFEST = [];` — only the built
// dist/sw.js is rewritten, so dev behaviour is unchanged.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');
const SW = resolve(DIST, 'sw.js');
const ASSETS = resolve(DIST, 'assets');

const files = readdirSync(ASSETS).filter((f) => /\.(js|css|woff2?)$/i.test(f));
const manifest = files.map((f) => `/assets/${f}`);
const bytes = files.reduce((n, f) => n + statSync(resolve(ASSETS, f)).size, 0);

const src = readFileSync(SW, 'utf8');
const PLACEHOLDER = 'const PRECACHE_MANIFEST = [];';
if (!src.includes(PLACEHOLDER)) {
  throw new Error('[gen-sw-precache] placeholder not found in dist/sw.js — did public/sw.js change?');
}
writeFileSync(
  SW,
  src.replace(PLACEHOLDER, `const PRECACHE_MANIFEST = ${JSON.stringify(manifest)};`),
  'utf8',
);
console.log(`[gen-sw-precache] injected ${manifest.length} assets (${(bytes / 1024 / 1024).toFixed(1)} MB) into dist/sw.js`);
