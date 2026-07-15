import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs'
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

// SOURCE-MAP SAFETY NET (2026-07-11 full-medical finding, High):
// map deletion used to live ONLY inside sentryVitePlugin's
// filesToDeleteAfterUpload — which never fires when the plugin is disabled
// (no token) OR when the upload fails (invalid token — observed on Vercel:
// Sentry receives events but shows minified names, and maps still shipped).
// Production served full sourcesContent maps: the complete readable App.jsx
// AND the entire question bank with answers. Deletion is now UNCONDITIONAL
// and runs in a dedicated plugin placed AFTER sentryVitePlugin, so a
// successful Sentry upload still happens first when the token works.
function stripSourcemapsPlugin() {
  return {
    name: 'strip-sourcemaps-always',
    apply: 'build',
    closeBundle() {
      const assets = resolve('dist', 'assets')
      if (!existsSync(assets)) return
      let n = 0
      for (const f of readdirSync(assets)) {
        if (f.endsWith('.map')) { rmSync(resolve(assets, f)); n++ }
      }
      console.log(`[sourcemap-safety] deleted ${n} .map files from dist/assets (unconditional)`)
    },
  }
}

// /play cold start used to burn a full extra round-trip: GameRoot.jsx is
// lazy, so the browser only discovers the chunk URL after downloading and
// executing the entry bundle (main.jsx kicks the import at module-eval, but
// by then the RTT is already spent). This plugin resolves the hashed
// GameRoot chunk from the bundle graph at build time and injects a tiny
// inline <script> that appends <link rel="modulepreload"> during HTML parse,
// starting the chunk fetch in parallel with the entry bundle. A static
// <link> tag is deliberately NOT used: it would make every marketing
// visitor at / download the game bundle, breaking the front-door guarantee
// in main.jsx ("marketing visitors never download the game bundle"). The
// script mirrors main.jsx's routing — it skips only plain browser tabs on
// / and /home-preview*; native + PWA + every game path
// preload. Degrades gracefully: if the chunk isn't in the bundle (renamed,
// inlined, future refactor), nothing is injected and the build proceeds.
// Runs at closeBundle, resolving the chunk off disk rather than from the
// bundle graph: transformIndexHtml's ctx.bundle does not carry the lazy chunk
// at the point the HTML is transformed, so a graph lookup silently finds
// nothing and injects nothing (shipped that way once — green build, zero
// effect). It THROWS when the chunk is missing rather than warning: a preload
// that quietly stops working is indistinguishable from one that never worked.
// The chunk name is stable because GameRoot.jsx is the lazy entry (main.jsx).
function preloadGameRootPlugin() {
  return {
    name: 'preload-gameroot',
    apply: 'build',
    closeBundle() {
      const assets = resolve('dist', 'assets')
      const indexHtml = resolve('dist', 'index.html')
      if (!existsSync(assets) || !existsSync(indexHtml)) return
      const file = readdirSync(assets).find((f) => /^GameRoot-.*\.js$/.test(f))
      if (!file) {
        throw new Error(
          '[preload-gameroot] no GameRoot-*.js in dist/assets — the lazy entry was renamed or inlined. ' +
          'Update this plugin (or delete it) rather than shipping a dead preload.',
        )
      }
      // Injected as a script, not a static <link>: a static tag would make every
      // marketing visitor at / download the game bundle, breaking main.jsx's
      // "marketing visitors never download the game bundle" guarantee. Mirrors
      // main.jsx routing — skips only plain browser tabs on the marketing paths.
      // Native detection must NOT rely on protocol alone: Android sets
      // androidScheme:'https' (capacitor.config.json), so capacitor: catches iOS
      // only. index.html adds .native-app before this runs on both platforms.
      const js =
        '(function(){try{' +
        "var native=location.protocol==='capacitor:'" +
        "||document.documentElement.classList.contains('native-app')" +
        '||!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());' +
        "var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;" +
        'var p=location.pathname;' +
        "var mkt=(p==='/'||p.indexOf('/home-preview')===0)&&!native&&!standalone;" +
        'if(mkt)return;' +
        "var l=document.createElement('link');l.rel='modulepreload';" +
        `l.href=${JSON.stringify('/assets/' + file)};l.crossOrigin='';` +
        'document.head.appendChild(l);' +
        '}catch(e){}})();'
      const html = readFileSync(indexHtml, 'utf8')
      if (!html.includes('</head>')) throw new Error('[preload-gameroot] no </head> in dist/index.html')
      writeFileSync(indexHtml, html.replace('</head>', `<script>${js}</script>\n</head>`))
      console.log(`[preload-gameroot] injected modulepreload for /assets/${file}`)
    },
  }
}

// Build output tuning. The app is one large App.jsx (~1.4MB raw with the
// question bank), so splitting vendor dependencies into their own cacheable
// chunks means a code-only change doesn't invalidate the React/Supabase
// bundle in the browser cache on the next visit.
export default defineConfig(async () => {
  // Question-bank size, injected as VITE_QB_COUNT so the marketing home can
  // show the real count without bundling the 1.3MB bank into its chunk; it
  // re-derives on every build so the number can never drift stale. DYNAMIC
  // import on purpose: a static `import { QB }` at the top makes questions.js
  // a watched config dependency, so every question-batch edit restarted the
  // dev server instead of hot-reloading (reproduced). Dynamic import stays
  // out of the config watch graph.
  const { QB } = await import('./src/questions.js')

  return {
  plugins: [
    react(),
    versionJsonPlugin(gitSha),
    preloadGameRootPlugin(),
    // Sentry source-map upload. No-op when SENTRY_AUTH_TOKEN is unset
    // (e.g., dev or PR builds without secrets). Production builds on Vercel
    // set the token via env var. Org/project slugs accept env overrides so
    // the user can adjust without code changes.
    sentryVitePlugin({
      // Org slug MUST match the token's org — sentry-cli hard-errors on any
      // mismatch ("Two different org values supplied"), which failed the
      // 2026-07-13 prod build the moment the long-dead token was fixed
      // (env var had been misspelled ENTRY_AUTH_TOKEN since May 6).
      org: process.env.SENTRY_ORG || 'alexander-bryn-olsen',
      project: process.env.SENTRY_PROJECT || 'ball-iq',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: gitSha },
      disable: !process.env.SENTRY_AUTH_TOKEN,
      // Upload problems must WARN, never fail the deploy — observability
      // tooling may not block shipping (it already cost us one prod build).
      errorHandler(err) { console.warn('[sentry-plugin] upload failed (non-fatal):', err?.message || err) },
      // Sprint #73 OO5: delete .map files after upload so they don't ship
      // to Vercel and become publicly fetchable at /assets/<hash>.js.map.
      // The plugin strips the inline sourceMappingURL comment regardless,
      // but the files themselves used to remain in dist/ — guessable
      // filename = source code leak. Now Sentry holds the only copy.
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/assets/*.map'],
      },
    }),
    // MUST stay after sentryVitePlugin — see comment on the plugin.
    stripSourcemapsPlugin(),
  ],
  define: {
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
    'import.meta.env.VITE_QB_COUNT': JSON.stringify(QB.length),
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // Source maps: required for Sentry to translate minified stacks back to
    // readable file:line. 'hidden' emits the .map files for the Sentry upload
    // but writes NO sourceMappingURL comment into the bundles — so shipped JS
    // never advertises map URLs even if a map were to slip through. (Also
    // rotates all chunk hashes vs the 'true' era, orphaning any previously
    // CDN-cached map URLs.) stripSourcemapsPlugin deletes the files post-build.
    sourcemap: 'hidden',
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
  }
})
