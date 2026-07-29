// preflight-release.mjs — run BEFORE archiving iOS or uploading an AAB.
//
//   node scripts/preflight-release.mjs
//
// WHY THIS EXISTS
//
// On 2026-07-29 the iOS project was carrying a Transfer Trail anchor pointed at
// "today" — left behind by a local edit made to produce a PLAYABLE simulator
// build. The source was reverted immediately and git was clean, but the built
// bundle under ios/App/App/public was never rebuilt. Submitting in that state
// would have shipped an unreviewed game mode LIVE to the App Store on a date
// nobody approved, and nothing in the pipeline would have said a word.
//
// The general shape of the bug: `cap sync` copies dist/ into the native
// projects, so the native bundle is a SNAPSHOT. It can silently disagree with
// the source it was supposedly built from, and a clean `git status` does not
// prove otherwise — the drift lives in build output, which is gitignored.
//
// So this checks the artifacts, not the intent:
//   1. the working tree is clean
//   2. a FRESH build produces exactly the asset filenames sitting in both
//      native projects — Vite content-hashes filenames, so identical names mean
//      identical bytes, which catches ANY drift and not just this one
//   3. the Trail anchor inside the shipped bundles matches the source
//   4. reports the iOS build number and Android versionCode to eyeball
//
// Exits non-zero on any failure, so it can gate a release script.
//
// Note: every command below is a fixed literal run through execFileSync with an
// argument array — no shell, no interpolation.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = (bin, args) => execFileSync(bin, args, { cwd: ROOT, encoding: 'utf8' }).trim();

const IOS = 'ios/App/App/public/assets';
const AND = 'android/app/src/main/assets/public/assets';

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => { console.log(`  ✗ ${m}`); failed++; };

console.log('\nRelease preflight\n');

// ── 1. clean tree ────────────────────────────────────────────────────────────
const dirty = run('git', ['status', '--porcelain']);
if (dirty) bad(`working tree is dirty — commit or revert first:\n${dirty.split('\n').map((l) => '      ' + l).join('\n')}`);
else ok('working tree clean');

// ── 2. native bundles match a fresh build ────────────────────────────────────
// Vite content-hashes asset filenames, so matching names == matching bytes.
const jsNames = (dir) => (existsSync(resolve(ROOT, dir))
  ? readdirSync(resolve(ROOT, dir)).filter((f) => f.endsWith('.js')).sort()
  : null);

console.log('  … building fresh to compare (this is the slow part)');
rmSync(resolve(ROOT, 'dist'), { recursive: true, force: true });
execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'ignore' });
const fresh = jsNames('dist/assets') || [];

for (const [label, dir, syncArg] of [['iOS', IOS, 'ios'], ['Android', AND, 'android']]) {
  const have = jsNames(dir);
  if (!have) { bad(`${label}: no synced bundle at ${dir} — run: npx cap sync ${syncArg}`); continue; }
  const missing = fresh.filter((f) => !have.includes(f));
  const stale = have.filter((f) => !fresh.includes(f));
  if (missing.length || stale.length) {
    bad(`${label} bundle does NOT match current source — re-run: rm -rf dist && npm run build && npx cap sync ${syncArg}`);
    if (missing.length) console.log(`      missing: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? ` (+${missing.length - 4})` : ''}`);
    if (stale.length) console.log(`      stale:   ${stale.slice(0, 4).join(', ')}${stale.length > 4 ? ` (+${stale.length - 4})` : ''}`);
  } else ok(`${label} bundle matches current source (${have.length} chunks)`);
}

// ── 3. the Trail anchor actually shipped ─────────────────────────────────────
// The specific thing that nearly went out. Generalises to any constant a local
// preview might move: assert the SHIPPED bytes carry the SOURCE value.
const anchor = (readFileSync(resolve(ROOT, 'src/lib/trail.js'), 'utf8')
  .match(/TRAIL_ANCHOR_DAY\s*=\s*(\d+)/) || [])[1];
if (!anchor) bad('could not read TRAIL_ANCHOR_DAY from source');
else {
  for (const [label, dir] of [['iOS', IOS], ['Android', AND]]) {
    const d = resolve(ROOT, dir);
    if (!existsSync(d)) continue;
    const blob = readdirSync(d).filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(resolve(d, f), 'utf8')).join('');
    if (blob.includes(anchor)) ok(`${label} carries the source Trail anchor (${anchor})`);
    else bad(`${label} bundle does NOT contain anchor ${anchor} — built from different source`);
  }
}

// ── 4. versions, for the human to eyeball ────────────────────────────────────
const pbx = readFileSync(resolve(ROOT, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
const iosBuild = (pbx.match(/CURRENT_PROJECT_VERSION = (\d+);/) || [])[1];
const iosVer = (pbx.match(/MARKETING_VERSION = ([\d.]+);/) || [])[1];
const gradle = readFileSync(resolve(ROOT, 'android/app/build.gradle'), 'utf8');
const andCode = (gradle.match(/versionCode\s+(\d+)/) || [])[1];
const andName = (gradle.match(/versionName\s+"([^"]+)"/) || [])[1];
ok(`iOS ${iosVer} build ${iosBuild} · Android ${andName} versionCode ${andCode}`);
console.log('      App Store rejects a re-used build number; Play rejects a re-used versionCode.');

console.log(failed ? `\n✗ ${failed} problem(s) — do NOT submit\n` : '\n✓ safe to archive / upload\n');
process.exit(failed ? 1 : 0);
