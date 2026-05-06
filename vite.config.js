import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { execSync } from 'node:child_process'

// Capture the short git SHA at build time and inject it as VITE_GIT_SHA so
// Sentry events carry a release tag matching the actual code on production.
// Falls back to 'unknown' if git is missing (e.g., Docker build without .git).
let gitSha = 'unknown'
try {
  gitSha = execSync('git rev-parse --short HEAD').toString().trim()
} catch {}

// Build output tuning. The app is one large App.jsx (~1.4MB raw with the
// question bank), so splitting vendor dependencies into their own cacheable
// chunks means a code-only change doesn't invalidate the React/Supabase
// bundle in the browser cache on the next visit.
export default defineConfig({
  plugins: [
    react(),
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
