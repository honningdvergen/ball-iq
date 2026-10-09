// A loading spinner must not be a dead end (Alex, 9 Oct 2026: Daily 7 finished
// on a flight, "Loading results…" for good). A request that never answers
// throws nothing, so no error boundary ever sees it; the spinner has to own up
// by itself. Proven against the built site with the results request left
// hanging (~/ball-iq-audit/2026-10-09/offline/repro.mjs); pinned here.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const APP = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const fn = APP.slice(APP.indexOf('function ScreenLoading('), APP.indexOf('class TabErrorBoundary'));

describe('ScreenLoading', () => {
  it('owns up after a few seconds and offers Home', () => {
    expect(APP).toMatch(/const SCREEN_SLOW_MS = (\d+);/);
    const ms = Number(/const SCREEN_SLOW_MS = (\d+);/.exec(APP)[1]);
    expect(ms).toBeGreaterThanOrEqual(4000);   // not on an ordinary slow load
    expect(ms).toBeLessThanOrEqual(10000);     // not after the player has given up
    expect(fn).toMatch(/setTimeout\(\(\) => setSlow\(true\), SCREEN_SLOW_MS\)/);
    expect(fn).toMatch(/new Event\("biq:go-home"\)/);
    expect(fn).toMatch(/Back to Home/);
  });

  it('leaves the load running, so the screen still appears if the connection returns', () => {
    expect(fn).not.toMatch(/location\.reload|throw new Error/);
  });

  it('says the score is saved only where that is true: the results screen', () => {
    expect(fn).toMatch(/\/results\/i\.test\(label\) \? " Your score is saved\." : ""/);
    // ...which holds because a finished quiz is stored before results are asked for.
    const done = APP.indexOf('setDailyDone(true);');
    const show = APP.indexOf('setScreen("results");', done);
    expect(done).toBeGreaterThan(-1);
    expect(show).toBeGreaterThan(done);
  });

  it('the results code is still fetched when play starts, not when it ends', () => {
    expect(APP).toMatch(/if \(!playing\) return;\s*import\('\.\/screens\/ResultsScreen\.jsx'\)\.catch/);
  });
});
