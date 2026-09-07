import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * THE INSTRUMENT REGISTER MUST MATCH REALITY.
 *
 * ⚠️ WHY THIS TEST EXISTS. An analytics audit found 24 confirmed defects. Every
 * one of them would have been caught the day it shipped by a register carrying
 * `gate` and `firstWrite` beside each writer. Two classes recur:
 *
 * (a) A GUARD ON ONE WRITER AND NOT ITS SIBLING IN THE SAME FILE.
 *     bqSynthetic() (scripts/seo/club-quiz-engine.js) was called from exactly
 *     one place, bqev(), while logRound() — invoked from the SAME finish(), a
 *     few lines below — wrote club_quiz_results ungated for three weeks. On
 *     2026-08-29 one visitor put 46 identical rows on Arsenal in 92 seconds,
 *     about 6% of that club's month, into the table the front door orders its
 *     club list by. Nothing failed. Nothing could fail: no artefact in the repo
 *     put the two writers side by side with their guards in a column.
 *
 * (b) TWO COUNTERS COMPARED AS IF THEY HAD THE SAME BIRTHDAY.
 *     club_quiz_results first wrote 2026-08-14 (02336c6); the club-page funnel
 *     row first wrote 2026-08-22 (3a589eb). A 30-day window straddling that gap
 *     produced a 130-row "discrepancy" that meant nothing and cost real
 *     analysis time. `firstWrite` is the column that makes that mistake
 *     impossible to make twice.
 *
 * ⚠️ THIS IS A SOURCE-TEXT TEST, NOT A RENDER TEST. It reads the committed
 * manifest, re-runs the scanner, and compares. There is nothing to mount.
 *
 * ⚠️ A ZERO HERE WOULD BE THE MOST SUSPICIOUS RESULT AVAILABLE. A scanner that
 * silently matched nothing would make every assertion below pass vacuously —
 * empty list, no ungated writers, no stale rows, green. So the first test
 * asserts the register still contains the writers the audit named BY HAND, and
 * the scanner itself refuses to publish a run that cannot see them.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANIFEST_PATH = join(ROOT, '.audit', 'instruments.json');
const SCRIPT = 'scripts/audit-instruments.mjs';

const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : null;

/**
 * Re-run the scan in a child process and read back what it would write.
 *
 * ⚠️ JUDGE IT BY THE EXIT CODE, NEVER BY GREPPING THE OUTPUT. The scanner exits
 * 1 whenever an ungated writer exists — which is true today and is REPORTED,
 * not papered over — and 2 when its own self-check fails. Only 2 is a broken
 * scan. A `| grep -q` on the summary would read a red run as green, which is
 * how a vitest suite in this repo once printed a passing line over a failing
 * exit code and Vercel refused the push.
 */
function rescan() {
  // --out keeps the fresh scan OUT of the tracked file. A test that rewrites
  // .audit/instruments.json to prove it is current would leave the working tree
  // dirty on every build, and nobody could then tell the test's footprint from
  // a real change.
  const tmp = join(tmpdir(), `biq-instruments-${process.pid}.json`);
  let status = 0;
  try {
    execFileSync('node', [SCRIPT, '--quiet', '--out', tmp], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    status = e.status ?? 1;
  }
  const fresh = JSON.parse(readFileSync(tmp, 'utf8'));
  try { rmSync(tmp, { force: true }); } catch { /* best effort */ }
  return { status, manifest: fresh };
}

describe('the instrument register is real', () => {
  it('is committed', () => {
    expect(manifest, `.audit/instruments.json is missing — run: node ${SCRIPT}`).not.toBeNull();
    expect(manifest.writers.length).toBeGreaterThan(0);
  });

  it('contains the writers the audit named by hand', () => {
    // ⚠️ THE ANTI-VACUOUS-PASS ASSERTION. These five are not a sample; they are
    // the specific call sites the audit walked to, and between them they cover
    // every scanning hazard in the repo: a transport inside a template literal,
    // a transport in a plain module, a supabase.rpc() behind a gate WRAPPER
    // rather than a leaf gate, and a helper reached only through a React prop.
    // If the scanner stops seeing any of them, every count below is fiction.
    const at = (file, fn) => manifest.writers.filter((w) => w.file === file && w.via === fn);

    expect(at('scripts/seo/club-quiz-engine.js', 'bqev').length,
      'bqev() — the club-page funnel transport').toBeGreaterThan(0);
    expect(at('scripts/seo/club-quiz-engine.js', 'logRound').length,
      'logRound() — the club_quiz_results transport, ungated for three weeks').toBeGreaterThan(0);
    expect(at('src/App.jsx', 'loopEvent').length,
      'loopEvent() — the app funnel transport').toBeGreaterThan(0);

    // record_challenge_event: three writes, all in src/App.jsx, all behind
    // challengeEventOnce(). Three guards would have been three chances for one
    // to be forgotten — which is how challenge_events became the one funnel
    // table with no synthetic check at all. The count is asserted exactly,
    // because a fourth write appearing WITHOUT the wrapper is precisely the
    // defect class this file exists to catch.
    const challenge = manifest.writers.filter((w) => w.sink === 'challenge_events');
    expect(challenge.length, 'record_challenge_event write sites').toBe(3);
    for (const w of challenge) {
      expect(w.file, 'challenge writes belong in src/App.jsx').toBe('src/App.jsx');
      expect(w.gate, `${w.file}:${w.line} must sit behind challengeEventOnce()`).toBe('challengeEventOnce');
    }

    // marketingEvent is the front door's and the island pages' transport, and
    // it is deliberately NOT the app's — a second sink wired the same way.
    expect(at('src/lib/marketingEvent.js', 'marketingEvent').length,
      'marketingEvent() — the front-door transport').toBeGreaterThan(0);
  });

  it('names every gate that guards a writer', () => {
    // The brief said the known gates were isSyntheticTraffic() and
    // bqSynthetic() and warned the list was probably incomplete. It was: gSyn,
    // qSyn and TWO separate synthetic() functions were also live, plus the
    // challengeEventOnce() wrapper. The register derives them from the one
    // signal they share (a navigator.webdriver test) rather than trusting a
    // hand-written list that was already wrong when it was written.
    const names = manifest.gates.map((g) => g.name);
    for (const g of ['isSyntheticTraffic', 'bqSynthetic', 'gSyn', 'qSyn', 'synthetic', 'challengeEventOnce']) {
      expect(names, `gate not found: ${g}`).toContain(g);
    }
    // Every gate a writer claims must actually be one of the listed gates (or
    // the inline check in api/p.js). A typo in the gate column would otherwise
    // read as protection that does not exist.
    // 'server host check' is the api/ mechanism, added 2026-09-07 when api/c.js
    // loop-hit was gated. An edge function has no navigator, so the webdriver
    // rule can never mark it protected and it would have sat on the ungated
    // list forever after being genuinely fixed — a permanently unfixable entry
    // is what teaches people to skim the list. It is recognised ONLY under api/
    // and only via a hostname comparison; it is not the client rule loosened.
    const known = new Set([...names, 'inline navigator.webdriver', 'server host check', 'NONE']);
    for (const w of manifest.writers) {
      for (const g of w.gate.split(' / ')) {
        expect(known.has(g), `${w.file}:${w.line} claims an unknown gate: ${g}`).toBe(true);
      }
    }
  });
});

describe('the register is current', () => {
  // The rescan re-reads the whole tree; the cached birthdays keep it near 20s
  // but a cold cache asks git 100+ times. A 5s default would fail on a machine
  // that is merely busy, and a flaky gate gets deleted rather than fixed.
  it('matches a fresh scan of the tree', { timeout: 180000 }, () => {
    // ⚠️ THE WHOLE POINT. A register that drifts is worse than none, because it
    // is consulted with confidence. Re-running the scanner and diffing is the
    // only assertion that cannot be satisfied by a stale file.
    //
    // firstWrite is compared too, but it is CACHED by needle inside the
    // manifest rather than recomputed here: a `git log -S` per writer is ~60s,
    // and the dates are immutable history. A NEW writer has no cached date,
    // so it fails the "every writer has a firstWrite" test below instead —
    // which is the same failure, reached faster.
    const { status, manifest: fresh } = rescan();
    expect(status, `${SCRIPT} self-check failed (exit 2) — the scan cannot be trusted`).not.toBe(2);

    const shape = (m) => m.writers.map((w) => `${w.file}:${w.line} ${w.event} ${w.sink} ${w.gate} ${w.via}`);
    const before = shape(manifest);
    const after = shape(fresh);
    const added = after.filter((r) => !before.includes(r));
    const removed = before.filter((r) => !after.includes(r));

    expect(
      { added, removed },
      `.audit/instruments.json is STALE. Re-run it and commit the result:\n\n    node ${SCRIPT}\n\n`
      + 'If a writer appeared, decide its gate before committing — do not widen an existing guard to cover it.\n',
    ).toEqual({ added: [], removed: [] });
  });

  it('every writer has a birthday', () => {
    // ⚠️ THE COLUMN THE 130-ROW PHANTOM NEEDED. An undated counter is one that
    // will be compared against a dated one sooner or later.
    //
    // `(uncommitted)` is the one permitted non-date, and it is a fact rather
    // than a gap: the writer is not in HEAD, so history genuinely has no date
    // for it. It becomes a real date on the commit that lands the writer — at
    // which point the manifest should be regenerated in the same commit.
    // Anything else empty means git could not date a writer that IS committed,
    // which is the real anomaly.
    const undated = manifest.writers.filter((w) => !w.firstWrite);
    expect(undated.map((w) => `${w.file}:${w.line} ${w.event}`), `run: node ${SCRIPT}`).toEqual([]);
    for (const w of manifest.writers) {
      expect(w.firstWrite, `${w.file}:${w.line} has a malformed date`)
        .toMatch(/^(\d{4}-\d{2}-\d{2}|\(uncommitted\))$/);
    }
    // Every sink must have one too, or "are these two numbers comparable?"
    // stays unanswerable — which is the state that cost the analysis time.
    for (const s of manifest.sinks) {
      expect(s.firstWrite, `sink ${s.sink} has no first-write date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('no writer reaches production ungated', () => {
  /**
   * ⚠️ THIS IS A RATCHET, AND THE ONLY HONEST WAY TO SHIP IT.
   *
   * The brief's rule is "no writer has gate: NONE". The tree does not satisfy
   * that today — the scan found real ungated writers, and they are REPORTED
   * rather than hidden, gated by a widened guard, or excluded from the scan.
   * Every one of them is listed by file and line in the manifest's
   * `ungatedBaseline`, and `node scripts/audit-instruments.mjs` exits non-zero
   * naming them, every run.
   *
   * So the assertion is: the set of ungated writers may SHRINK, never grow. A
   * new ungated writer fails this suite on the commit that adds it, which is
   * the day-it-shipped catch the register exists to provide. Closing one means
   * deleting its line from the baseline — a deliberate, reviewable edit.
   *
   * Never add a line here to make a build green. That is the failure this whole
   * file is arguing against.
   */
  it('the ungated set has not grown', () => {
    const baseline = manifest.ungatedBaseline;
    const live = manifest.writers
      .filter((w) => w.gate === 'NONE')
      .map((w) => `${w.file}:${w.line} ${w.event} -> ${w.sink}`);
    const isNew = live.filter((r) => !baseline.includes(r));
    expect(
      isNew,
      'A NEW UNGATED ANALYTICS WRITER.\n'
      + 'It will record robots, crawlers and local dev straight into production.\n'
      + 'On 2026-08-21 that put 767 synthetic rows into funnel_events in three hours\n'
      + 'against a real DAU of 13-17. Gate it at its own call site — do not widen\n'
      + 'another writer\'s guard, and do not add it to ungatedBaseline.\n',
    ).toEqual([]);
  });

  it('the baseline holds no writer that is now gated', () => {
    // Stale entries are the other direction of drift: a fixed writer left in
    // the baseline silently re-permits itself if the fix is ever reverted.
    const live = new Set(manifest.writers
      .filter((w) => w.gate === 'NONE')
      .map((w) => `${w.file}:${w.line} ${w.event} -> ${w.sink}`));
    const stale = manifest.ungatedBaseline.filter((r) => !live.has(r));
    expect(stale, `these are gated now — remove them from ungatedBaseline (node ${SCRIPT} does it)`).toEqual([]);
  });

  it('the club engine gates BOTH of its writers', () => {
    // ⚠️ Defect class (a), asserted directly rather than left to the ratchet.
    // bqev() and logRound() live in the same file and are called from the same
    // finish(). One carried bqSynthetic() and the other did not, for three
    // weeks. They must rise and fall together.
    const engine = manifest.writers.filter((w) => w.file === 'scripts/seo/club-quiz-engine.js' && w.kind === 'transport');
    const bq = engine.filter((w) => w.via === 'bqev');
    const lr = engine.filter((w) => w.via === 'logRound');
    expect(bq.length, 'bqev transport missing').toBeGreaterThan(0);
    expect(lr.length, 'logRound transport missing').toBeGreaterThan(0);
    for (const w of [...bq, ...lr]) {
      expect(w.gate, `${w.via} at :${w.line} lost its synthetic gate`).toBe('bqSynthetic');
    }
  });
});

describe('the cross-file bridges still bind', () => {
  /**
   * Three emitters reach their call sites through a React prop or a factory,
   * and the scanner declares those bridges rather than inferring them — a
   * regex that pretended to do dataflow would drop a dozen writers out of the
   * register the first time somebody renamed a prop, and the register would
   * still look healthy. So the binding text is asserted here: a rename breaks
   * this test instead of silently shrinking the count.
   */
  const read = (p) => readFileSync(join(ROOT, p), 'utf8');

  it('the island funnel is still a marketingEvent wrapper', () => {
    expect(read('src/islands/dailyIsland.jsx'))
      .toContain('export const makeFunnel = (surface) => (event, meta) => marketingEvent(event');
  });

  it("DailyDone's track prop is still bound at both ends", () => {
    // Two bindings, two DIFFERENT gates: isSyntheticTraffic() in the app,
    // synthetic() in marketingEvent.js on the island pages. Fixing one would
    // not cover the other, which is exactly why both are written down.
    expect(read('src/App.jsx')).toContain('track: (n, m) => loopEvent(n, m)');
    expect(read('src/islands/dailyIsland.jsx')).toContain('track: (n, m) => funnel(n, m)');
  });

  it("the username wall's onEvent prop is still bound to loopEvent", () => {
    expect(read('src/App.jsx')).toContain('onEvent={loopEvent}');
  });
});
