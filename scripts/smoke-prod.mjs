#!/usr/bin/env node
/**
 * Post-deploy smoke test: is the RIGHT build live and reachable?
 *
 * WHY THIS EXISTS. On 2026-08-14 balliq.app/play served the error boundary to
 * every visitor for roughly forty minutes. A `const` was referenced above its
 * own declaration inside a useCallback dependency array — a temporal dead zone
 * error, so AppInner threw on every render.
 *
 * The build was green. ESLint was green. All 131 tests passed. The deploy was
 * "verified": correct sha, correct service-worker version, the new env var
 * present in the bundle, the data fix confirmed gone.
 *
 * Every one of those checks passed on an app that could not render a single
 * screen, because every one of them inspected an ARTEFACT. None rendered the
 * app.
 *
 * ⚠️ SO READ THE LIMIT OF THIS SCRIPT HONESTLY: it checks that the right bytes
 * are in the right place. It CANNOT tell you the app renders, and a green run
 * here would have looked identical during the outage. It ends by telling you
 * the one check that actually matters, because automating the wrong check is
 * how forty minutes of downtime went unnoticed in the first place.
 *
 *   node scripts/smoke-prod.mjs
 *   node scripts/smoke-prod.mjs --sha <short>
 */
const BASE = process.env.SMOKE_BASE || 'https://balliq.app';
const wantSha = (() => {
  const i = process.argv.indexOf('--sha');
  return i > -1 ? process.argv[i + 1] : null;
})();

let bad = 0;
const fail = (msg) => { console.error(`❌ ${msg}`); bad++; };
const ok = (msg) => console.log(`✅ ${msg}`);

async function get(path) {
  const res = await fetch(BASE + path, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.text();
}

try {
  const version = JSON.parse(await get('/version.json'));
  if (wantSha && version.sha !== wantSha) {
    fail(`live sha is ${version.sha}, expected ${wantSha} — the deploy has not landed yet`);
  } else {
    ok(`live sha ${version.sha} (built ${version.builtAt})`);
  }

  // The shell must reference an entry chunk that actually exists. A 404 here is
  // the "white screen nobody can reproduce" bug.
  const html = await get('/play');
  const chunks = [...html.matchAll(/\/assets\/[A-Za-z0-9_-]+\.js/g)].map((m) => m[0]);
  if (!chunks.length) {
    fail('no /assets/*.js referenced by /play — the shell is wrong');
  } else {
    const entry = chunks.find((c) => c.includes('index-')) || chunks[0];
    const js = await get(entry);
    ok(`entry chunk ${entry} fetched (${Math.round(js.length / 1024)} kB)`);
  }

  // A service worker older than the deploy keeps installed PWAs on stale code.
  const sw = await get('/sw.js');
  const v = sw.match(/balliq-v\d+/);
  if (!v) fail('sw.js has no CACHE_VERSION'); else ok(`service worker ${v[0]}`);
} catch (e) {
  fail(e.message);
}

console.log('\n⚠️  THIS DOES NOT PROVE THE APP RENDERS.');
console.log('   A TDZ error, a hook-order violation or any render-time throw ships a');
console.log('   perfectly valid bundle and still shows every visitor the error boundary.');
console.log(`   OPEN IT:  ${BASE}/play`);
console.log('   You must see a question. If you see "Something went wrong", the deploy is');
console.log('   broken no matter how many ticks are above this line.');

process.exitCode = bad ? 1 : 0;
