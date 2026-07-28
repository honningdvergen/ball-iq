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

function prune(path) {
  if (!existsSync(path)) return 0
  const bytes = sizeOf(path)
  rmSync(path, { recursive: true, force: true })
  return bytes
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
