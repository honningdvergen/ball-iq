import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(join(ROOT, 'src/App.jsx'), 'utf8');

/**
 * Every lazily-loaded screen must sit inside an error boundary.
 *
 * ⚠️ WHY. TabErrorBoundary exists precisely so "a bad render in Profile leaves
 * Home/Daily/Online usable" — and it wrapped only the four TAB panes. Mystery
 * Player, Transfer Trail, Stadiums, the Review screen, Blocked Users, Friend
 * Profile, OnlineEntry and MultiplayerLobby all mounted in a SIBLING branch
 * under a bare <React.Suspense>. A chunk that fails to fetch (flaky radio,
 * cache eviction, a deploy mid-session) or any render throw in one of them
 * took down the WHOLE app, not the screen — a white page with no way back.
 *
 * The boundary was never missing. It was simply not on that branch of the
 * tree, which is the shape this repo keeps losing to: the good thing exists,
 * and half the call sites do not use it.
 *
 * These are source-level assertions on purpose. Mounting App.jsx in jsdom
 * would pull the entire ~10k-line tree plus Supabase and Capacitor; the thing
 * worth pinning is the STRUCTURE, and structure is exactly what regressed.
 */
describe('lazy screens are inside an error boundary', () => {
  it('no bare Suspense fallback renders nothing', () => {
    // `fallback={null}` and an empty `<div className="screen" />` both mean a
    // tap shows an EMPTY FRAME while the chunk downloads, which reads as a
    // dead button. Report #2 chased this as "the app feels slow" and measured
    // healthy paint times, because it was measuring the wrong thing.
    const offenders = [];
    src.split('\n').forEach((line, i) => {
      if (/<React\.Suspense\s+fallback=\{null\}/.test(line)) {
        offenders.push(`App.jsx:${i + 1} — fallback={null}`);
      }
      if (/<React\.Suspense\s+fallback=\{<div className="(screen|tab-pane)" \/>\}/.test(line)) {
        offenders.push(`App.jsx:${i + 1} — empty div fallback`);
      }
    });
    expect(offenders, `\n  ${offenders.join('\n  ')}\n`).toEqual([]);
  });

  it('every Suspense site is enclosed by a TabErrorBoundary', () => {
    // Walk the file tracking boundary depth, and flag any <React.Suspense>
    // that opens while depth is zero.
    let depth = 0;
    const unguarded = [];
    src.split('\n').forEach((line, i) => {
      const opens = (line.match(/<TabErrorBoundary\b/g) || []).length;
      const closes = (line.match(/<\/TabErrorBoundary>/g) || []).length;
      // Count the opener before testing this line, since a single-line wrap
      // (`<TabErrorBoundary …><React.Suspense …>`) is legitimate.
      depth += opens;
      if (/<React\.Suspense\b/.test(line) && depth <= 0) {
        unguarded.push(`App.jsx:${i + 1} — ${line.trim().slice(0, 80)}`);
      }
      depth -= closes;
    });
    expect(depth, 'TabErrorBoundary open/close tags are unbalanced').toBe(0);
    expect(unguarded, `\n  Suspense outside any error boundary:\n  ${unguarded.join('\n  ')}\n`).toEqual([]);
  });

  it('full-screen boundaries offer a way out, not just "Try again"', () => {
    // A game screen has no tab bar underneath, so a deterministic crash with
    // only a retry button is a dead end. Every boundary on a non-tab screen
    // must pass onExit.
    const TABS = new Set(['home', 'daily', 'online', 'profile']);
    const missing = [];
    for (const m of src.matchAll(/<TabErrorBoundary\s+name="([^"]+)"([^>]*)>/g)) {
      const [, name, rest] = m;
      if (TABS.has(name)) continue;
      if (!/onExit=/.test(rest)) missing.push(name);
    }
    expect(missing, `\n  screen boundaries with no onExit: ${missing.join(', ')}\n`).toEqual([]);
  });

  it('covers every screen that was unguarded before 2026-08-23', () => {
    // Named explicitly so a future refactor that drops one is loud rather than
    // quietly reducing coverage back toward the four tabs.
    for (const name of [
      'trail', 'mystery', 'stadiums', 'review',
      'blocked-users', 'friend-profile', 'online-entry', 'mp-lobby',
    ]) {
      expect(src, `no TabErrorBoundary named "${name}"`)
        .toMatch(new RegExp(`<TabErrorBoundary\\s+name="${name}"`));
    }
  });
});
