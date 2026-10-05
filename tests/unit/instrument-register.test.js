import { describe, it, expect, beforeAll } from 'vitest';
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
 * ⚠️ THIS IS A SOURCE-TEXT TEST, NOT A RENDER TEST. It runs the scanner over
 * the tree and asserts on what it finds. There is nothing to mount.
 *
 * ⚠️ THE REGISTER IS NOT COMMITTED. .audit/instruments.json carries a
 * file:line per writer, so committing it put every open PR in conflict after
 * each merge to main. It is git-ignored and rebuilt here on every run, which
 * also means it can never be stale. The one committed input is
 * .audit/instrument-birthdays.tsv, the dates `git log -S` cannot recompute in a
 * shallow clone.
 *
 * ⚠️ A ZERO HERE WOULD BE THE MOST SUSPICIOUS RESULT AVAILABLE. A scanner that
 * silently matched nothing would make every assertion below pass vacuously —
 * empty list, no ungated writers, no stale rows, green. So the first test
 * asserts the register still contains the writers the audit named BY HAND, and
 * the scanner itself refuses to publish a run that cannot see them.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LEDGER_PATH = join(ROOT, '.audit', 'instrument-birthdays.tsv');
const SCRIPT = 'scripts/audit-instruments.mjs';

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
  // --out writes to a temp file and leaves the ledger alone; --offline never
  // asks git for a date, because a shallow clone (Vercel, CI) would answer
  // with the clone boundary and hide a writer the ledger has never seen.
  const tmp = join(tmpdir(), `biq-instruments-${process.pid}.json`);
  let status = 0;
  try {
    execFileSync('node', [SCRIPT, '--quiet', '--offline', '--out', tmp], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    status = e.status ?? 1;
  }
  const fresh = JSON.parse(readFileSync(tmp, 'utf8'));
  try { rmSync(tmp, { force: true }); } catch { /* best effort */ }
  return { status, manifest: fresh };
}

let manifest;
let scanStatus;
// The scan re-reads the whole tree. A 5s default would fail on a machine that
// is merely busy, and a flaky gate gets deleted rather than fixed.
beforeAll(() => {
  ({ status: scanStatus, manifest } = rescan());
}, 180000);

describe('the instrument register is real', () => {
  it('scans cleanly from a committed birthday ledger', () => {
    expect(existsSync(LEDGER_PATH), `.audit/instrument-birthdays.tsv is missing — run: node ${SCRIPT}`).toBe(true);
    expect(scanStatus, `${SCRIPT} self-check failed (exit 2) — the scan cannot be trusted`).not.toBe(2);
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
  it('every writer has a birthday', () => {
    // ⚠️ THE COLUMN THE 130-ROW PHANTOM NEEDED. An undated counter is one that
    // will be compared against a dated one sooner or later.
    //
    // A committed writer with no date is a writer the ledger has never seen:
    // run the script (it asks git once) and commit the new ledger line.
    //
    // `(uncommitted)` is the one permitted non-date, and it is a fact rather
    // than a gap: the writer is not in HEAD, so history genuinely has no date
    // for it. It becomes a real date on the commit that lands the writer — at
    // which point the ledger should be regenerated in the same commit.
    // Anything else empty means git could not date a writer that IS committed,
    // which is the real anomaly.
    const undated = manifest.writers.filter((w) => !w.firstWrite);
    expect(undated.map((w) => `${w.file}:${w.line} ${w.event}`),
      `run: node ${SCRIPT}  and commit .audit/instrument-birthdays.tsv`).toEqual([]);
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
   * ⚠️ THIS WAS A RATCHET, AND IT REACHED ZERO.
   *
   * The original rule was "no writer has gate: NONE", shipped as a baseline
   * that could shrink and never grow because real ungated writers existed.
   * The baseline emptied on 2026-09-07, so the ratchet is now the rule itself.
   *
   * Never weaken this to make a build green. That is the failure this whole
   * file is arguing against.
   */
  it('no writer is ungated', () => {
    const live = manifest.writers
      .filter((w) => w.gate === 'NONE')
      .map((w) => `${w.file}:${w.line} ${w.event} -> ${w.sink}`);
    expect(
      live,
      'A NEW UNGATED ANALYTICS WRITER.\n'
      + 'It will record robots, crawlers and local dev straight into production.\n'
      + 'On 2026-08-21 that put 767 synthetic rows into funnel_events in three hours\n'
      + 'against a real DAU of 13-17. Gate it at its own call site — do not widen\n'
      + 'another writer\'s guard.\n',
    ).toEqual([]);
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
