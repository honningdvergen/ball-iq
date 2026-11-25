// Ballpark in a TEST build only (24 Nov 2026). src/lib/ballparkPreview.js says why.
//
// What this pins:
//   - the constant is true for VITE_BALLPARK_PREVIEW=1 and false for anything else;
//   - it is read from the environment in ONE place, and only the route in App.jsx and
//     the row in HomeScreen.jsx read the constant;
//   - the marker a release gate looks for is typed once in src, inside that row;
//   - the build's gate (scripts/audit-preview-build.mjs) fails a normal build that
//     holds the marker and a preview build that does not, and is wired into
//     `npm run build` beside the Home budget;
//   - no env file in the repo sets the flag.
// The other half of the proof is not here: the Home goldens (i18n-home-nav) render
// with the flag unset and are unchanged, so a normal build's Home markup is the
// markup from before the row existed.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREVIEW_MARKER, filesWithMarker, auditPreviewBuild } from '../../scripts/audit-preview-build.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
// Code only: the comments explain the flag and name the marker on purpose.
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
function srcFiles(dir = join(ROOT, 'src'), out = []) {
  for (const name of readdirSync(dir)) {
    const f = join(dir, name);
    if (statSync(f).isDirectory()) srcFiles(f, out);
    else if (/\.(jsx?|css)$/.test(name)) out.push(f);
  }
  return out;
}

describe('BALLPARK_PREVIEW, the build-time flag', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
  const load = async (value) => {
    vi.resetModules();
    if (value !== undefined) vi.stubEnv('VITE_BALLPARK_PREVIEW', value);
    return (await import('../../src/lib/ballparkPreview.js')).BALLPARK_PREVIEW;
  };
  it('is false when the flag is not set (every normal build, and this test run)', async () => {
    // vitest.config.js blanks the flag, so this holds inside a preview build's own test run too.
    expect(import.meta.env.VITE_BALLPARK_PREVIEW || '').toBe('');
    expect(await load(undefined)).toBe(false);
  });
  it("is true only for exactly '1'", async () => {
    expect(await load('1')).toBe(true);
    for (const v of ['', '0', 'true', 'yes', ' 1', '11']) expect(await load(v), JSON.stringify(v)).toBe(false);
  });
  it('is read from the environment in one place, as one static expression Vite can replace', () => {
    expect(code('src/lib/ballparkPreview.js')).toMatch(/export const BALLPARK_PREVIEW = import\.meta\.env\.VITE_BALLPARK_PREVIEW === '1';/);
    const readers = srcFiles().filter((f) => readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').includes('VITE_BALLPARK_PREVIEW'));
    expect(readers.map((f) => f.slice(ROOT.length))).toEqual(['src/lib/ballparkPreview.js']);
  });
});

describe('what the flag opens', () => {
  it('only App.jsx and HomeScreen.jsx read the constant', () => {
    const users = srcFiles().filter((f) => /\bBALLPARK_PREVIEW\b/.test(code(f.slice(ROOT.length))) && !f.endsWith('ballparkPreview.js'));
    expect(users.map((f) => f.slice(ROOT.length)).sort()).toEqual(['src/App.jsx', 'src/screens/HomeScreen.jsx']);
  });
  it('the route: the web as before, or a preview build; nothing else', () => {
    const app = code('src/App.jsx');
    expect(app).toMatch(/\{screen === "ballpark" && \(LEAGUES_WEB \|\| BALLPARK_PREVIEW\) && \(/);
    expect(app.match(/screen === "ballpark"/g)).toHaveLength(1);
    // The hidden link is still the web's only: the flag does not widen it.
    expect(app).toMatch(/const bq = LEAGUES_WEB && new URLSearchParams\(window\.location\.search\);/);
  });
  // 25 Nov 2026, from Alex's phone: "Ball IQ" stood above Ballpark's own back arrow and title in
  // the test build. The app's header strip (.hdr) prints the wordmark on every screen that is not
  // in its list of screens with a title of their own; Ballpark was web only until the flag, so it
  // was never in it. The screen draws its own title, so it is in the list, like Footle and the rest.
  it('inside the app the screen draws its own title, so the wordmark strip stays off it', () => {
    const app = code('src/App.jsx');
    const list = app.match(/\{!\[("[a-z0-9-]+"(?:, )?)+\]\.includes\(screen\) && \(\s*<button\s+className="logo"/);
    expect(list, 'the list of screens that draw their own title').not.toBeNull();
    const names = list[0].match(/"[a-z0-9-]+"/g).map((x) => x.slice(1, -1));
    expect(names).toContain('ballpark');
    for (const s of ['wordle', 'trail', 'top10', 'mystery', 'stadiums']) expect(names, s).toContain(s);
    expect(code('src/screens/Ballpark.jsx')).toMatch(/className="bp-name">\{t\("bp\.title"\)\}/);
  });
  it('the Home row is drawn only under the flag, in More modes, and carries the marker', () => {
    const home = code('src/screens/HomeScreen.jsx');
    const at = home.indexOf('{BALLPARK_PREVIEW && (');
    expect(at).toBeGreaterThan(home.indexOf('{t("home.moreModes")}</div>'));
    // In the one card of More modes (25 Nov 2026), above the two modes that close it.
    const card = home.indexOf('<div className="home-list">', home.indexOf('{t("home.moreModes")}</div>'));
    const end = home.indexOf('{ key:"survival"');
    expect(card).toBeGreaterThan(-1);
    expect(at).toBeGreaterThan(card);
    expect(at).toBeLessThan(end);
    expect(home.slice(card, at)).not.toContain('</div>');
    const row = home.slice(at, end);
    expect(row).toContain(`data-preview="${PREVIEW_MARKER}"`);
    expect(row).toContain('className="todays-seven-secondary mp-row"');
    expect(row).toContain('onClick={() => setScreen("ballpark")}');
    expect(row).toContain('{t("home.ballpark.tag")}');
    expect(row).toContain('{rowLine(t("home.ballpark.sub"))}');
    // The only way from Home to the screen is that row: with the flag off there is none.
    expect(home.match(/setScreen\("ballpark"\)/g)).toHaveLength(1);
    expect(home.match(/\bBALLPARK_PREVIEW\b/g)).toHaveLength(2); // the import and the row's condition
  });
  it('the marker is typed once in the shipped source', () => {
    const hits = srcFiles().filter((f) => code(f.slice(ROOT.length)).includes(PREVIEW_MARKER));
    expect(hits.map((f) => f.slice(ROOT.length))).toEqual(['src/screens/HomeScreen.jsx']);
    expect(code('src/screens/HomeScreen.jsx').split(PREVIEW_MARKER)).toHaveLength(2);
  });
});

describe('scripts/audit-preview-build.mjs, the gate', () => {
  const dirs = [];
  const make = (files) => {
    const d = mkdtempSync(join(tmpdir(), 'biq-preview-'));
    dirs.push(d);
    for (const [name, text] of Object.entries(files)) { mkdirSync(join(d, name, '..'), { recursive: true }); writeFileSync(join(d, name), text); }
    return d;
  };
  afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });

  it('a normal build with no marker passes', () => {
    const d = make({ 'index.html': '<html></html>', 'assets/GameRoot-abc.js': 'console.log("home")' });
    expect(filesWithMarker(d)).toEqual([]);
    expect(auditPreviewBuild(d, undefined)).toMatchObject({ ok: true });
    expect(auditPreviewBuild(d, '').ok).toBe(true);
  });
  it('the marker in a build made without the flag fails, and names the file', () => {
    const d = make({ 'index.html': '<html></html>', 'assets/GameRoot-abc.js': `x("data-preview","${PREVIEW_MARKER}")` });
    expect(filesWithMarker(d)).toEqual([join('assets', 'GameRoot-abc.js')]);
    for (const flag of [undefined, '', '0', 'true']) {
      const r = auditPreviewBuild(d, flag);
      expect(r.ok, String(flag)).toBe(false);
      expect(r.line).toContain('GameRoot-abc.js');
    }
  });
  it('a preview build passes with the marker and fails without it', () => {
    const withIt = make({ 'assets/GameRoot-abc.js': `"${PREVIEW_MARKER}"` });
    const without = make({ 'assets/GameRoot-abc.js': '"home"' });
    expect(auditPreviewBuild(withIt, '1').ok).toBe(true);
    expect(auditPreviewBuild(without, '1').ok).toBe(false);
  });
  it('a source map does not count (it holds the source, not the bundle)', () => {
    const d = make({ 'assets/GameRoot-abc.js.map': `{"sourcesContent":["${PREVIEW_MARKER}"]}` });
    expect(filesWithMarker(d)).toEqual([]);
  });
  it('a folder that is not there fails rather than passing empty', () => {
    expect(auditPreviewBuild(join(tmpdir(), 'biq-preview-no-such-folder'), undefined).ok).toBe(false);
  });
  it('runs in `npm run build` right after the Home budget, before the build is stamped', () => {
    const build = JSON.parse(read('package.json')).scripts.build;
    expect(build).toContain('node scripts/audit-home-budget.mjs && node scripts/audit-preview-build.mjs && node scripts/build-stamp.mjs');
    expect(build.indexOf('vite build')).toBeLessThan(build.indexOf('audit-preview-build'));
  });
});

describe('the unit tests describe a normal build', () => {
  it('vitest.config.js blanks the flag, so the Home goldens never see the row', () => {
    expect(read('vitest.config.js')).toMatch(/env: \{ VITE_BALLPARK_PREVIEW: '' \},/);
  });
});

describe('the flag is never in a file', () => {
  it('no env file in the repo sets VITE_BALLPARK_PREVIEW', () => {
    // .env.local is each checkout's own (untracked); read it too when it is there,
    // because a build made here would pick it up.
    for (const f of readdirSync(ROOT).filter((n) => n === '.env' || n.startsWith('.env.'))) {
      if (!existsSync(join(ROOT, f))) continue; // a dangling link
      // A boolean, so a failure never prints the file (it holds keys).
      expect(/VITE_BALLPARK_PREVIEW/.test(read(f)), f).toBe(false);
    }
  });
  it('neither do the Vercel config, the Capacitor config or the package scripts', () => {
    expect(read('vercel.json')).not.toMatch(/BALLPARK_PREVIEW/);
    expect(read('capacitor.config.json')).not.toMatch(/BALLPARK_PREVIEW/);
    expect(JSON.stringify(JSON.parse(read('package.json')).scripts)).not.toMatch(/VITE_BALLPARK_PREVIEW/);
  });
});
