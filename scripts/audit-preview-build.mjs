// audit-preview-build.mjs: is this dist a Ballpark PREVIEW build, and was it meant to be?
//
//   node scripts/audit-preview-build.mjs            # scans dist/, exit 1 on a mismatch
//   node scripts/audit-preview-build.mjs some/dir   # scans that folder instead
//
// WHY. Ballpark is a hidden prototype. A build made with VITE_BALLPARK_PREVIEW=1
// puts one row on Home that opens it inside the phone app, for TestFlight only
// (src/lib/ballparkPreview.js). That row carries the literal string below, so a
// bundle can be told apart from a normal one without running it.
//
//   - Marker in dist, flag NOT '1' in this environment: exit 1. A normal build
//     is carrying the preview (a stale dist, an env file that set the flag, or
//     the constant stopped folding to false). This is the case that must never
//     reach the website or a store.
//   - Flag '1', marker NOT in dist: exit 1. The build was asked to be a preview
//     and is not one; a tester would get a build without the row.
//   - Otherwise exit 0, and one line says which kind of build this is.
//
// A release script should run this same check on the bundle it is about to
// ship (ios/App/App/public, android/app/src/main/assets/public) with the flag
// unset: it then refuses anything that holds the marker.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PREVIEW_MARKER = 'BALLPARK_PREVIEW_BUILD';

/** Every file under `dir` whose bytes hold the marker, as paths relative to it. */
export function filesWithMarker(dir) {
  const found = [];
  const needle = Buffer.from(PREVIEW_MARKER);
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const f = join(d, e.name);
      if (e.isDirectory()) walk(f);
      // A source map holds the SOURCE text (the row's JSX, flag or no flag), not what
      // ships; vite.config.js deletes them from dist/assets on every build anyway.
      else if (e.isFile() && !e.name.endsWith('.map') && readFileSync(f).includes(needle)) found.push(relative(dir, f));
    }
  })(dir);
  return found.sort();
}

/** { ok, line } for a folder and the flag's value in the environment. */
export function auditPreviewBuild(dir, flag) {
  if (!existsSync(dir)) return { ok: false, line: `preview-build: ${dir} does not exist (run vite build first)` };
  const on = flag === '1';
  const found = filesWithMarker(dir);
  if (found.length && !on) {
    return { ok: false, line: `preview-build: FAIL. ${PREVIEW_MARKER} is in ${found.length} file(s) (${found.slice(0, 3).join(', ')}) but VITE_BALLPARK_PREVIEW is not '1'. This dist carries the Ballpark preview row and must not ship.` };
  }
  if (!found.length && on) {
    return { ok: false, line: `preview-build: FAIL. VITE_BALLPARK_PREVIEW=1 but ${PREVIEW_MARKER} is nowhere in the build: the preview row was not built.` };
  }
  return on
    ? { ok: true, line: `preview-build: BALLPARK PREVIEW build (marker in ${found.length} file(s): ${found.slice(0, 3).join(', ')}). Test builds only: never the website, never a store release.` }
    : { ok: true, line: 'preview-build: OK, a normal build (no Ballpark preview marker in dist)' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const dir = resolve(process.argv[2] || join(ROOT, 'dist'));
  const { ok, line } = auditPreviewBuild(dir, process.env.VITE_BALLPARK_PREVIEW);
  console.log(line);
  process.exit(ok ? 0 : 1);
}
