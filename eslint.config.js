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
  { ignores: ['dist/**', 'ios/**', 'android/**', 'node_modules/**', 'public/**', 'scripts/**', '*.config.js'] },
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
      // Helpful signal, but never blocks the build:
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },
];
