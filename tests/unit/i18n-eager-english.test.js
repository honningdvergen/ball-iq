// i18n step 5: only Home's English is on Home's eager path.
//
// src/i18n/index.js imports en.home.js (the lines Home, the navigation and
// onboarding print, copied from en.js). The full en.js is imported by the lazy
// screens that print the rest and registers itself as it is evaluated. That
// split is only safe if three things hold, and this file pins all three:
//
//   1. en.js is NOT reachable from GameRoot or main.jsx through static imports
//      (that is what put ~40 KB of strings on Home's eager JS).
//   2. Every key a module ON that path names is in en.home.js, with en.js's
//      exact English, and Home renders its step 2 golden markup with ONLY
//      en.home.js loaded.
//   3. Every module OFF that path that names any other key imports en.js
//      itself, so the table has always registered before that module renders.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const rel = (f) => relative(SRC, f).split('\\').join('/');
const read = (f) => readFileSync(f, 'utf8');

// Static `import … from './x'`, `import './x'` and `export … from './x'`.
// A dynamic import('./x') is not followed: that is the whole eager/lazy line.
const STATIC = /(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;
function resolveSpec(from, spec) {
  const base = resolve(dirname(from), spec);
  for (const c of [base, `${base}.js`, `${base}.jsx`]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}
function staticImports(f) {
  return [...read(f).matchAll(STATIC)].map((m) => resolveSpec(f, m[1])).filter(Boolean);
}
const EAGER = new Set();
(function walk(files) {
  for (const f of files) {
    if (!f || EAGER.has(f) || !/\.(jsx?)$/.test(f)) continue;
    EAGER.add(f);
    walk(staticImports(f));
  }
})([resolve(SRC, 'main.jsx'), resolve(SRC, 'GameRoot.jsx')]);

function srcFiles(dir = SRC) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) out.push(...srcFiles(p));
    else if (/\.(jsx?)$/.test(name)) out.push(p);
  }
  return out;
}
const TABLES = /(^|\/)i18n\/(en|en\.home|es)\.js$/;
const FILES = srcFiles().filter((f) => !TABLES.test(rel(f)));

const en = (await import('../../src/i18n/en.js')).default;
const enHome = (await import('../../src/i18n/en.home.js')).default;
const KEYS = Object.keys(en);
const baseOf = (k) => k.replace(/_(zero|one|two|few|many|other)$/, '');
function keysNamedIn(src) {
  return KEYS.filter((k) => {
    const b = baseOf(k);
    return src.includes(`'${b}'`) || src.includes(`"${b}"`) || src.includes('`' + b + '`');
  });
}
// Keys built at run time on the eager path: `cat.${c}` and friends. Each
// family is declared here with the file that builds it, and the whole family
// must be in en.home.js. An undeclared template on the eager path fails below.
const EAGER_FAMILIES = {
  'App.jsx': ['cat.', 'help.footle.', 'help.survival.'],
  'i18n/names.js': ['lvl.', 'tier.', 'cc.'],
  'lib/mysteryPlayer.js': ['mp.earlier', 'mp.later'], // t(`mp.${x.bornWhen}`): 'earlier' | 'later'
};

describe('the eager English split', () => {
  it('en.js is off Home\'s eager path, en.home.js and the runtime are on it', () => {
    const eager = [...EAGER].map(rel);
    expect(eager).toContain('i18n/index.js');
    expect(eager).toContain('i18n/en.home.js');
    expect(eager).toContain('screens/HomeScreen.jsx');
    expect(eager).not.toContain('i18n/en.js');
    expect(eager).not.toContain('i18n/es.js');
    // The play screens that pinned en.js before step 5.
    for (const f of ['screens/QuizEngine.jsx', 'screens/ResultsScreen.jsx', 'components/DailyDone.jsx']) expect(eager, f).not.toContain(f);
  });

  it('every en.home.js line is en.js\'s English, exactly', () => {
    for (const [k, v] of Object.entries(enHome)) expect(v, k).toBe(en[k]);
  });

  it('every key a Home-path module names is in en.home.js', () => {
    const missing = [];
    for (const f of FILES.filter((x) => EAGER.has(x))) {
      for (const k of keysNamedIn(read(f))) if (!Object.hasOwn(enHome, k)) missing.push(`${rel(f)}: ${k}`);
    }
    for (const prefixes of Object.values(EAGER_FAMILIES)) {
      for (const k of KEYS) if (prefixes.some((p) => k.startsWith(p)) && !Object.hasOwn(enHome, k)) missing.push(`family: ${k}`);
    }
    expect(missing).toEqual([]);
  });

  it('a key built at run time on the eager path belongs to a declared family', () => {
    const undeclared = [];
    for (const f of FILES.filter((x) => EAGER.has(x))) {
      const src = read(f);
      // t(`x.${…}`), or a `${stepKey}.${i}` built from a declared family.
      for (const m of src.matchAll(/\bt\(`([^`$]*)\$\{/g)) {
        const pre = m[1];
        const fam = EAGER_FAMILIES[rel(f)] || [];
        if (pre && !fam.some((p) => p.startsWith(pre) || pre.startsWith(p))) undeclared.push(`${rel(f)}: t(\`${pre}\${…}\`)`);
        if (!pre && !fam.length) undeclared.push(`${rel(f)}: t(\`\${…}\`)`);
      }
    }
    expect(undeclared).toEqual([]);
  });

  it('every module off the eager path that prints a non-Home key imports en.js', () => {
    const EN = resolve(SRC, 'i18n/en.js');
    const missing = [];
    for (const f of FILES.filter((x) => !EAGER.has(x))) {
      const src = read(f);
      const lazyKeys = keysNamedIn(src).filter((k) => !Object.hasOwn(enHome, k));
      // A key built at run time (t(`${…}`)) cannot be checked, so it counts.
      const built = /\bt\(`[^`]*\$\{/.test(src);
      if ((lazyKeys.length || built) && !staticImports(f).includes(EN)) missing.push(`${rel(f)} (${lazyKeys[0] || 'a built key'}…)`);
    }
    expect(missing).toEqual([]);
  }, 60_000); // reads every src module: ~13 s alone, over 20 s under a parallel build
});

// ── Home renders with en.home.js alone ───────────────────────────────────────
// The step 2 golden, rendered in a module graph where en.js has NOT loaded.
// (Nothing above imported the real index.js: vi.resetModules gives this block
// its own copy, and the scenarios' static imports cannot reach en.js — the
// first describe proves that.)
describe('Home and the navigation, before en.js arrives', () => {
  const S = {};
  let i18n;
  let renderAll;
  let GOLDEN;
  beforeAll(async () => {
    vi.resetModules();
    vi.doMock('../../src/useAuth.jsx', () => ({ useAuth: () => S.auth }));
    vi.doMock('../../src/lib/wordleStatus.js', async (orig) => ({ ...(await orig()), readWordleTodayStatus: () => S.ws }));
    vi.doMock('../../src/lib/trail.js', async (orig) => ({ ...(await orig()), getTrailAnswer: () => (S.trailLive ? { name: 'x' } : null), loadTrailDay: () => S.trailDay, getTrailNumber: () => 61 }));
    vi.doMock('../../src/lib/top10.js', async (orig) => ({ ...(await orig()), isTop10Live: () => S.top10Live, getTop10Number: () => 12, loadTop10Day: () => S.top10Day }));
    vi.doMock('../../src/lib/mysteryPlayer.js', async (orig) => ({ ...(await orig()), MYSTERY_ENABLED: true, answerIdForDay: () => 'p1', mysteryNumber: () => 88, loadMysteryResult: () => S.mysteryRes }));
    vi.doMock('../../src/lib/footleNumber.js', async (orig) => ({ ...(await orig()), getFootleNumber: () => 150 }));
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));
    const store = new Map();
    vi.stubGlobal('localStorage', { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
    vi.stubGlobal('sessionStorage', { getItem: () => null, setItem() {}, removeItem() {} });
    vi.stubGlobal('navigator', { language: 'en-US' });
    vi.stubGlobal('document', { documentElement: { lang: 'en' } });
    i18n = await import('../../src/i18n/index.js');
    await i18n.initI18n();
    ({ renderAll } = await import('./i18n-home-nav.scenarios.js'));
    GOLDEN = JSON.parse(readFileSync(fileURLToPath(new URL('./i18n-home-nav.golden.json', import.meta.url)), 'utf8'));
  });
  afterAll(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.resetModules(); });

  it('the full table really has not loaded in this graph', () => {
    expect(i18n.hasEnglish('home.today.label')).toBe(true);
    expect(i18n.hasEnglish('st.account')).toBe(false); // a Settings key: en.js only
  });
  it('every Home and navigation scenario is byte-identical to the step 2 golden', () => {
    const now = renderAll(S);
    for (const name of Object.keys(GOLDEN)) expect(now[name], name).toBe(GOLDEN[name]);
  });
});
