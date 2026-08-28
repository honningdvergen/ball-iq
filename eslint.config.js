import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

// Intentionally minimal. The build gate (npm run build) only FAILS on the two
// correctness classes that actually break the app at runtime:
//   - no-undef             → catches "Can't find variable: X" (e.g. a trimmed
//                            import still referenced) that vite build can't see.
//   - rules-of-hooks       → hook-count crashes.
// Everything else is a non-blocking 'warn' (visible via `npm run lint`) so the
// large existing monolith doesn't fail the build on pre-existing style nits.
export default [
  // src/questions-index.js is generated (scripts/gen-questions-index.mjs) and is
  // one giant JSON literal — linting it costs time and can find nothing.
  // ⚠️ scripts/** is ignored EXCEPT the club-quiz engine. That file is the
  // inline script shipped on ~140 /quiz/ pages, and until 2026-08-23 it lived
  // inside a template literal where every line was a STRING to every tool we
  // run. A variable named "off" collided with the module-level pagination
  // offset there and broke both the clubq-start count and "Keep going", with
  // nothing to catch it. no-redeclare finds that in a second — but only if the
  // file is parsed, which is the entire reason it now exists on disk.
  { ignores: ['**/.claude/**', 'dist/**', 'ios/**', 'android/**', 'node_modules/**', 'public/**', 'scripts/!(seo)/**', 'scripts/*.mjs', 'scripts/seo/!(club-quiz-engine).*', '*.config.js', 'src/questions-index.js'] },
  {
    files: ['scripts/seo/club-quiz-engine.js'],
    languageOptions: {
      ecmaVersion: 2019,        // the engine ships to old WebViews; keep it plain
      sourceType: 'script',     // an IIFE in a <script> tag, not a module
      globals: { ...globals.browser },
    },
    rules: {
      // The two that would have caught the 2026-08-23 defect outright.
      'no-redeclare': 'error',
      'no-shadow': 'error',
      'no-undef': 'error',
      // Cheap correctness for a file nothing else checks.
      // caughtErrors 'none': the engine is written defensively and wraps almost
      // everything in try/catch with an unused binding. Twelve of those is noise,
      // not signal, and this config's whole philosophy is that the gate fails
      // only on what breaks the app at runtime.
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-func-assign': 'error',
      'no-cond-assign': 'error',
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      // Gate the build on these:
      'no-undef': 'error',
      'react-hooks/rules-of-hooks': 'error',
      // Make JSX-referenced identifiers count as "used" so no-unused-vars is honest:
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      // ⚠️ no-undef DOES NOT SEE JSX COMPONENT REFERENCES. On 2026-08-24 a
      // <ProfilePic /> was added to App.jsx without importing it: eslint
      // passed, `npm run build` passed, 366 tests passed — and it would have
      // thrown ReferenceError the moment the results screen rendered. Vite
      // resolves JSX identifiers at runtime, not build time, so nothing else
      // in the gate could catch it. This rule is what does.
      'react/jsx-no-undef': 'error',
      // Helpful signal, but never blocks the build:
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },
];
