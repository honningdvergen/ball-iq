import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');

// The sheet's source, isolated so these assertions cannot accidentally match
// something elsewhere in a 9,000-line file.
const START = APP.indexOf('function ReportReasonSheet');
// To the next top-level declaration, not a fixed byte count — a fixed slice
// silently truncated this to 2000 chars and "passed" two assertions by simply
// never reaching the buttons they were about.
const SHEET = APP.slice(START, APP.indexOf('\nfunction ', START + 1));

describe('the report sheet can be backed out of', () => {
  // ⚠️ WHY THIS TEST EXISTS. Every exit from this sheet used to call onSkip,
  // which FILES A REPORT — Escape, the backdrop, and the button alike. So a
  // sheet opened by accident could not be closed without writing a row against
  // a question that was very likely fine. One was filed that way on 2026-09-07
  // (q_3d34d9) and had to be deleted from prod by hand.
  it('the backdrop cancels — it does not file a report', () => {
    const overlay = SHEET.match(/className="modal-overlay"[^>]*onClick=\{(\w+)\}/);
    expect(overlay, 'no modal-overlay onClick found in ReportReasonSheet').toBeTruthy();
    expect(overlay[1], 'clicking the backdrop must cancel, not submit').toBe('onCancel');
  });

  it('Escape cancels — it does not file a report', () => {
    const a11y = SHEET.match(/useModalA11y\(\{[^}]*onClose:\s*(\w+)/);
    expect(a11y, 'no useModalA11y call found in ReportReasonSheet').toBeTruthy();
    expect(a11y[1], 'Escape must cancel, not submit').toBe('onCancel');
  });

  it('there is exactly ONE deliberate reason-less submit, and it is a button', () => {
    // "Just flag it" is the design's answer to "a second tap must never be the
    // price of reporting" — one tap, no reason, row written. That is the ONLY
    // place onSkip may be reached from.
    const skips = [...SHEET.matchAll(/onClick=\{onSkip\}/g)];
    expect(skips.length, 'onSkip must be reachable from exactly one control').toBe(1);
    expect(SHEET).toMatch(/onClick=\{onSkip\}>Just flag it</);
  });

  it('a visible Cancel exists — the way out must be findable, not just guessable', () => {
    expect(SHEET).toMatch(/onClick=\{onCancel\}>Cancel</);
  });

  // ⚠️ The promise contract. reportQuestion() hands its caller a promise and
  // ReportButton renders "Sending…" until it settles; a cancel that only closed
  // the sheet would strand that button forever. The file's own comment at the
  // ref says every path out MUST settle it.
  it('cancelling settles the pending promise instead of stranding the button', () => {
    const fn = APP.slice(
      APP.indexOf('const cancelQuestionReport'),
      APP.indexOf('const sendQuestionReport'),
    );
    expect(fn, 'cancelQuestionReport not found').toBeTruthy();
    expect(fn, 'must close the sheet').toMatch(/setReportPending\(null\)/);
    expect(fn, 'must clear the resolver ref').toMatch(/reportResolveRef\.current = null/);
    expect(fn, 'must settle FALSE so the button returns to idle').toMatch(/resolve\(false\)/);
    // And it must never reach the RPC.
    expect(fn, 'a cancel must not write a row').not.toMatch(/report_question/);
  });
});
