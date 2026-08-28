import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * There is ONE report button, and only it may thank anyone.
 *
 * ⚠️ Scouting report #4 found the same defect in FOUR places at once — QuizEngine,
 * the wrong-answer review, Footle and Transfer Trail each ran:
 *
 *     onReport({...});       // fire and forget
 *     setReported(true);     // …and claim success in the same tick
 *
 * so every one of them flipped to "✓ Reported — thanks" the instant it was
 * tapped: while the reason sheet was still open and unanswered, and before the
 * RPC had run. If the send then failed, the button went on saying it worked.
 * `supabase.rpc()` RESOLVES on error rather than rejecting, so "it did not
 * throw" was never evidence of success either.
 *
 * Four copies of one bug is the project's most expensive habit — the report
 * counted six separate instances of fixing something in one half. So the fix was
 * to delete the duplication, not to patch it four times, and this guard pins
 * that: the success string may exist in exactly ONE file. A fifth report button
 * written the old way puts the string somewhere new and turns this red.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    // Hidden dirs are never product source — .claude/worktrees from
    // background tasks lands inside src/ and duplicates every component.
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(jsx?|tsx?)$/.test(name)) acc.push(p);
  }
  return acc;
}

const FILES = walk(SRC).map((path) => ({
  path: path.slice(SRC.length + 1),
  code: readFileSync(path, 'utf8'),
}));

describe('the report button is a single source of truth', () => {
  it('only one file renders the success label', () => {
    // Mutation check: putting "✓ Reported — thanks" back into App.jsx fails this.
    const owners = FILES.filter((f) => f.code.includes('Reported — thanks')).map((f) => f.path);
    expect(
      owners,
      '\n  Exactly one component may claim a report succeeded.\n' +
      '  Found it in: ' + owners.join(', ') + '\n' +
      '  Use <ReportButton>; it waits for the RPC before thanking anyone.\n',
    ).toEqual(['components/ReportButton.jsx']);
  });

  it('the button only thanks on a settled promise, never on the tap', () => {
    const btn = FILES.find((f) => f.path === 'components/ReportButton.jsx').code;
    // The success state must be reached from a .then, not from the click handler.
    expect(/\.then\(\(ok\) => setState\(ok === false \? 'idle' : 'done'\)\)/.test(btn),
      'success must come from the resolved promise').toBe(true);
    // A failure must return the button to idle — the player's complaint is real
    // and they have to be able to try again.
    expect(/\.catch\(\(\) => setState\('idle'\)\)/.test(btn),
      'a failed send must be retryable, not stuck').toBe(true);
    // …and the tap itself may only ever set 'sending'.
    const onClick = btn.slice(btn.indexOf('onClick'), btn.indexOf('style={{'));
    expect(/setState\('sending'\)/.test(onClick), "the tap sets 'sending'").toBe(true);
    expect(
      /setState\('done'\)/.test(onClick),
      "the tap must NEVER set 'done' — that is the exact bug this replaced.",
    ).toBe(false);
  });

  it('reportQuestion hands back a promise that the send settles', () => {
    const app = FILES.find((f) => f.path === 'App.jsx').code;
    expect(/reportResolveRef/.test(app), 'the resolver must be held across the sheet').toBe(true);
    // Every exit from sendQuestionReport settles it, or a button hangs on
    // "Sending…" forever. There are three returns; all three go through settle().
    // ⚠️ Bound the slice to the function's own end, not a byte count. The first
    // version took 1600 characters, ran past `sendQuestionReport` into the next
    // function, counted its two returns as unsettled and failed on correct code.
    const start = app.indexOf('const sendQuestionReport');
    const end = app.indexOf('}, [showToast]);', start);
    expect(start, 'sendQuestionReport should exist').toBeGreaterThan(-1);
    expect(end, 'its closing `}, [showToast]);` should exist').toBeGreaterThan(start);
    const fn = app.slice(start, end);
    // ⚠️ Match STATEMENTS, anchored to the start of a line. The first version
    // matched the word "return" anywhere and counted two occurrences inside my
    // own comments ("then return it as before") as unsettled return statements.
    // A guard that reads prose as code fails on correct code.
    const returns = fn.match(/^\s*return\s+/gm) || [];
    const settled = fn.match(/^\s*return settle\(/gm) || [];
    expect(
      settled.length,
      `every return in sendQuestionReport must settle the promise (found ${returns.length} returns, ${settled.length} settled)`,
    ).toBe(returns.length);
    expect(settled.length).toBeGreaterThanOrEqual(3);
  });
});
