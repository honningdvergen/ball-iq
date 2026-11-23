// 23 Nov 2026, the rest of the silent-loss and crash-path audits. Each of these
// failed without a word; each test names what the player lost.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), 'utf8');
const app = read('App.jsx'); const main = read('main.jsx'); const auth = read('useAuth.jsx');
const leagues = read('lib/leagues.js'); const bell = read('hooks/useNotificationCenter.js'); const room = read('useMultiplayerRoom.js');

describe('league membership survives a failed call at sign-in', () => {
  const from = leagues.indexOf('export async function redeemLeagueClaim');
  const fn = leagues.slice(from, leagues.indexOf('\n}\n', from));
  it('the token is cleared only after the server has answered', () => {
    const failed = fn.indexOf("if (r.error) return null;");
    expect(failed).toBeGreaterThan(-1);
    expect(fn.lastIndexOf('set(CLAIM_KEY, null);')).toBeGreaterThan(failed);
    expect(fn).toContain('for (const wait of [0, 1500, 5000])');
  });
  it('one missing function no longer switches every league call off', () => {
    expect(leagues).toContain('const missing = new Set();');
    expect(leagues).toContain('if (missing.has(name)) return');
    expect(leagues).not.toMatch(/let missing = false/);
    expect(leagues).toContain('report(error, `league-${name}`);');
  });
  it('a stored league list with a hole in it cannot break Home', () => {
    expect(leagues).toContain("v.filter((x) => x && typeof x === 'object')");
  });
});

describe('the bell keeps what it had when a refresh fails', () => {
  it('both queries read the error, and only a good answer replaces the list', () => {
    expect(bell).toContain("if (error) Sentry.captureException(error, { tags: { area: 'bell-requests' } });\n      else setNotifRequests(");
    expect(bell).toContain("if (error) Sentry.captureException(error, { tags: { area: 'bell-invites' } });\n      else setNotifInvites(");
    expect((bell.match(/const \{ data \} = await supabase/g) || []).length).toBe(0);
  });
});

describe('a stalled multiplayer game keeps being rescued', () => {
  it('the watchdog repeats, and a failed pull is reported', () => {
    expect(room).toMatch(/const id = setInterval\(\(\) => \{[\s\S]{0,200}refetchRef\.current\?\.\(room\.id\)\s*\}, STALL_MS\)\s*return \(\) => clearInterval\(id\)/);
    expect(room).toContain("if (err) Sentry.captureException(err, { tags: { area: 'mp-refetch' } })");
  });
});

describe('one broken screen or overlay does not take the app down', () => {
  it('the three game screens that had no boundary have one, with a way out', () => {
    for (const name of ['stump', 'hotstreak', 'truefalse']) expect(app).toContain(`<TabErrorBoundary name="${name}" onExit={goHome}>`);
  });
  it('the overlays close instead of crashing the app', () => {
    for (const name of ['report-sheet', 'help', 'known-issues', 'reset-password', 'notification-centre']) expect(app).toContain(`<OverlayBoundary name="${name}"`);
    expect(app).toContain('render() { return this.state.hasError ? null : this.props.children; }');
    expect(app).toContain('resetKey={notifOpen} onError={() => setNotifOpen(false)}');
  });
  it('"Try again" after a failed chunk reloads, because a re-render cannot fix it', () => {
    expect(app).toContain('return { hasError: true, chunk: CHUNK_LOAD_ERR.test(String(error?.message || error || "")) };');
    expect(app).toContain('if (this.state.chunk) { try { window.__biqReloading = true; window.location.reload(); return; }');
  });
});

describe('stored data and blocked storage cannot loop the app on its crash screen', () => {
  it('stats restored at boot must be an object', () => {
    expect(app).toContain('if (v && typeof v === "object" && !Array.isArray(v)) setStats(v);');
    expect(app).not.toContain('if (raw !== null) setStats(JSON.parse(raw));');
  });
  it('the guest flag is only ever touched through guarded storage', () => {
    const bare = auth.split('\n').filter((l) => /localStorage\.(getItem|setItem|removeItem)\('ballIQ_guestMode'/.test(l) && !/try \{/.test(l));
    expect(bare).toEqual([]);
    expect((auth.match(/guestFlag\.(on|set|clear)\(\)/g) || []).length).toBe(5);
  });
});

describe('the self-heal reload is safe to fire', () => {
  const heal = main.slice(main.indexOf('const heal = ('), main.indexOf("window.addEventListener('vite:preloadError'"));
  it('never while offline', () => { expect(heal).toContain("navigator.onLine === false) return"); });
  it('never without a working guard, and the guard expires', () => {
    expect(heal).toContain('if (!guarded) return');
    expect(heal).toContain('Date.now() - last < 10 * 60 * 1000');
    expect(heal.indexOf('if (!guarded) return')).toBeLessThan(heal.indexOf('window.location.reload()'));
  });
});
