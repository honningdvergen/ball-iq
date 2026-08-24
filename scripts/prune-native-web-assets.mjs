#!/usr/bin/env node
// Prune web-only artifacts from the native (Capacitor) web-asset copies.
//
// capacitor webDir:"dist" copies EVERYTHING the web build produces into the
// iOS/Android binaries — SEO landing pages, marketing screenshots, Safari-PWA
// splash images, search-engine verification files — none of it reachable from
// the native shell. That was ~7MB (~54% of the AAB) of dead weight.
//
// Run AFTER every `npx cap sync` (sync regenerates the dirs and restores all
// of it). Idempotent: already-pruned paths are skipped silently.
//
//   node scripts/prune-native-web-assets.mjs
//
// KEEP list (verified by grep against src/ + index.html, 2026-07-14):
//   assets/, index.html, cordova.js, cordova_plugins.js  — the app itself
//   marketing/ball.png    — BiqNav.jsx renders it unconditionally (nav logo)
//   icon-192.png          — Login.jsx renders it
//   privacy.html          — Login.jsx links /privacy.html (Terms & Privacy)
//   manifest.json, sw.js, version.json — tiny; referenced from index.html /
//                           runtime code paths that are native-gated but cheap
//                           to keep rather than risk a 404
//   .well-known/          — harmless, tiny (per audit)

import { existsSync, lstatSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET_DIRS = [
  join(repoRoot, 'ios', 'App', 'App', 'public'),
  join(repoRoot, 'android', 'app', 'src', 'main', 'assets', 'public'),
]

// ALLOWLIST, not a denylist. This used to enumerate what to prune ('quiz',
// 'lists', 'football-wordle', …), which meant every NEW web-only content type
// had to be remembered here or it silently shipped inside the app. It wasn't:
// the /study data-study page rode into the binary untouched, and the next
// content type would have too. Same failure the AdSense note above describes —
// a rule that lives in someone's memory instead of in code.
//
// Now: anything at the top level that isn't on this list is web-only and goes.
// Adding a native-reachable asset means adding it HERE, which is a change you
// have to make deliberately rather than one you can forget to make.
const KEEP_EXACT = new Set([
  'assets',            // the app bundle itself
  'index.html',
  'cordova.js',
  'cordova_plugins.js',
  'marketing',         // filtered further below — only ball.png survives
  'icon-192.png',      // Login.jsx renders it
  'privacy.html',      // Login.jsx links /privacy.html (Terms & Privacy)
  'manifest.json',     // tiny; referenced from index.html
  'sw.js',
  'version.json',
  '.well-known',       // deep-link association files; harmless, tiny
])

// Inside marketing/: delete everything EXCEPT these (BiqNav.jsx nav logo).
const MARKETING_KEEP = new Set(['ball.png'])

function sizeOf(path) {
  const st = lstatSync(path)
  if (!st.isDirectory()) return st.size
  let total = 0
  for (const entry of readdirSync(path)) total += sizeOf(join(path, entry))
  return total
}

/**
 * ⚠️ RETRY, BECAUSE ONE FAILED DELETE USED TO ABORT THE WHOLE PRUNE.
 *
 * `rmSync(..., { force: true })` still THROWS on ENOTEMPTY, which macOS
 * produces when Finder recreates a `.DS_Store` inside a directory between the
 * readdir and the unlink. That is not hypothetical: on 2026-08-24 it killed
 * this script twice mid-run and left `ios/App/App/public` at **41 MB instead of
 * 6.9 MB** — the full web bundle, 47 SEO page directories and all, inside the
 * native binary. The failure surfaces as a Node stack trace in the middle of a
 * long build log, so nothing about the resulting app looks wrong; you just ship
 * six times the assets and a privacy surface nobody meant to include.
 *
 * So: sweep the .DS_Store files this specific race creates and retry once,
 * then let a genuine failure through loudly rather than silently under-pruning.
 */
function prune(path) {
  if (!existsSync(path)) return 0
  const bytes = sizeOf(path)
  try {
    rmSync(path, { recursive: true, force: true })
  } catch (err) {
    if (err?.code !== 'ENOTEMPTY' && err?.code !== 'EBUSY') throw err
    sweepDsStore(path)
    rmSync(path, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  }
  return bytes
}

/**
 * Sweep the whole bundle, always — not just on the retry path.
 *
 * Finder recreates `.DS_Store` continuously while a folder is open, so these
 * reappear inside `ios/App/App/public` and `android/.../assets/public` between
 * runs and get packaged into the shipped binary. Harmless to a user, but it is
 * junk in a store artifact and it is the exact file that makes the deletes
 * above throw. Cheap to remove; do it every time.
 */
function sweepBundles(dirs) {
  let n = 0
  for (const d of dirs) {
    if (!existsSync(d)) continue
    const before = countDsStore(d)
    sweepDsStore(d)
    n += before
  }
  return n
}

function countDsStore(path) {
  if (!existsSync(path)) return 0
  let st
  try { st = lstatSync(path) } catch { return 0 }
  if (!st.isDirectory()) return path.endsWith('.DS_Store') ? 1 : 0
  let n = 0
  for (const entry of readdirSync(path)) n += countDsStore(join(path, entry))
  return n
}

/** Remove the Finder droppings that cause the ENOTEMPTY above. */
function sweepDsStore(path) {
  if (!existsSync(path)) return
  let st
  try { st = lstatSync(path) } catch { return }
  if (!st.isDirectory()) return
  for (const entry of readdirSync(path)) {
    const child = join(path, entry)
    if (entry === '.DS_Store') { try { rmSync(child, { force: true }) } catch { /* gone already */ } continue }
    sweepDsStore(child)
  }
}

const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(2)

let grandTotal = 0
for (const dir of TARGET_DIRS) {
  if (!existsSync(dir)) {
    console.log(`[prune-native] SKIP (not synced yet): ${dir}`)
    continue
  }
  console.log(`[prune-native] ${dir}`)
  let dirTotal = 0
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const hit = !KEEP_EXACT.has(entry)
    if (!hit) continue
    const bytes = prune(join(dir, entry))
    dirTotal += bytes
    console.log(`  deleted ${entry} (${mb(bytes)} MB)`)
  }
  const marketing = join(dir, 'marketing')
  if (existsSync(marketing)) {
    for (const entry of readdirSync(marketing)) {
      if (MARKETING_KEEP.has(entry)) continue
      const bytes = prune(join(marketing, entry))
      dirTotal += bytes
      console.log(`  deleted marketing/${entry} (${mb(bytes)} MB)`)
    }
  }
  if (dirTotal === 0) console.log('  nothing to prune (already clean)')
  console.log(`  subtotal: ${mb(dirTotal)} MB`)
  grandTotal += dirTotal
}
console.log(`[prune-native] total reclaimed: ${mb(grandTotal)} MB`)

// Always sweep, last, so nothing Finder dropped mid-run ships in the binary.
const swept = sweepBundles(TARGET_DIRS)
if (swept) console.log(`[prune-native] swept ${swept} .DS_Store file(s) from the bundles`)

// ── SIZE CEILING ─────────────────────────────────────────────────────────────
// 2026-08-13: an Android build ran without this script and produced a 1.7 GB
// APK. public/lineup/cutouts holds 4,341 licence-verified PNGs; Vite copies
// public/ verbatim into dist/, and Capacitor copies dist/ into both native
// bundles. Play would have rejected it outright — the machine ran out of disk
// first. The cutouts are gitignored and serve from Supabase, so the web is
// unaffected; this is purely a native-bundle trap.
//
// It was already documented as "run the prune after every cap sync". A manual
// step with a 1.7 GB blast radius is not a safeguard, so: the ceiling is
// enforced here, and `npm run sync:ios` / `sync:android` now wrap the two
// commands so they cannot be half-performed.
const CEILING_MB = 60
// (sizeOf is already defined above — reuse it rather than shadowing.)
let over = false
for (const dir of TARGET_DIRS) {
  if (!existsSync(dir)) continue
  const asMb = sizeOf(dir) / 1048576
  console.log(`[prune-native] ${dir.replace(repoRoot + '/', '')} is ${asMb.toFixed(1)} MB`)
  if (asMb > CEILING_MB) {
    console.error(`\n\u2717 over the ${CEILING_MB} MB ceiling — something large is riding in from public/.`)
    console.error(`  du -sh ${dir}/* | sort -rh | head`)
    over = true
  }
}
if (over) process.exit(1)
console.log(`[prune-native] both bundles under ${CEILING_MB} MB \u2713`)
