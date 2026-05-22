import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Capture the short git SHA at build time and inject it as VITE_GIT_SHA so
// Sentry events carry a release tag matching the actual code on production.
// Falls back to 'unknown' if git is missing (e.g., Docker build without .git).
let gitSha = 'unknown'
try {
  gitSha = execSync('git rev-parse --short HEAD').toString().trim()
} catch {}

// Tiny plugin: emits dist/version.json at build close so the deployed app
// can poll it from the client and detect when a new build has rolled out.
// Pairs with src/VersionBanner.jsx which compares the bundled VITE_GIT_SHA
// against the live /version.json sha. Vercel serves /version.json no-cache
// (per vercel.json) so polling always sees the freshest deploy state.
function versionJsonPlugin(sha) {
  return {
    name: 'version-json',
    apply: 'build',
    closeBundle() {
      const payload = { sha, builtAt: new Date().toISOString() }
      writeFileSync(resolve('dist', 'version.json'), JSON.stringify(payload))
    },
  }
}

// Build output tuning. The app is one large App.jsx (~1.4MB raw with the
// question bank), so splitting vendor dependencies into their own cacheable
// chunks means a code-only change doesn't invalidate the React/Supabase
// bundle in the browser cache on the next visit.
export default defineConfig({
  plugins: [
    react(),
    versionJsonPlugin(gitSha),
    // Sentry source-map upload. No-op when SENTRY_AUTH_TOKEN is unset
    // (e.g., dev or PR builds without secrets). Production builds on Vercel
    // set the token via env var. Org/project slugs accept env overrides so
    // the user can adjust without code changes.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG || 'ball-iq',
      project: process.env.SENTRY_PROJECT || 'ball-iq',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: gitSha },
      disable: !process.env.SENTRY_AUTH_TOKEN,
      // Sprint #73 OO5: delete .map files after upload so they don't ship
      // to Vercel and become publicly fetchable at /assets/<hash>.js.map.
      // The plugin strips the inline sourceMappingURL comment regardless,
      // but the files themselves used to remain in dist/ — guessable
      // filename = source code leak. Now Sentry holds the only copy.
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/assets/*.map'],
      },
    }),
  ],
  define: {
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // Source maps: required for Sentry to translate minified stacks back to
    // readable file:line. The maps themselves are uploaded to Sentry (not
    // served from balliq.app) — the Sentry plugin strips sourcemap references
    // from the prod bundles after upload.
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React + ReactDOM live together and change rarely — one stable chunk.
          react: ['react', 'react-dom'],
          // Supabase SDK is ~130KB minified — isolate so app-only changes
          // don't invalidate it in the HTTP cache on subsequent visits.
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
