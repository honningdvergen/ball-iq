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

// Exact top-level entries (files or dirs) that are web-only.
const PRUNE_EXACT = [
  // SEO landing pages (static HTML dirs; the native shell is SPA-only)
  'quiz',
  'lists',
  'football-wordle',
  'about',
  'contact',
  // Search-engine / crawler surface
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'ads.txt',
  // Social-share image (og:/twitter: meta point at the absolute https URL)
  'og-image.png',
  // PWA-install icons — native uses the binary's own icons; manifest.json is
  // never consumed by WKWebView/Android WebView. icon-192.png is NOT listed:
  // Login.jsx renders it.
  'icon-1024.png',
  'icon-512.png',
  'icon-maskable-512.png',
]

// Pattern-matched top-level entries.
const PRUNE_PATTERNS = [
  /^apple-splash-.*\.png$/, // Safari-PWA startup images (~2MB)
  /^google[0-9a-f]+\.html$/, // Google site verification
  /^[0-9a-f]{32}\.txt$/, // Bing/IndexNow verification
]

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
    const hit = PRUNE_EXACT.includes(entry) || PRUNE_PATTERNS.some((re) => re.test(entry))
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
