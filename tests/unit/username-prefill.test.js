import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/**
 * A form must never reject the value it pre-filled for you.
 *
 * ⚠️ LIVE FOR EIGHT WEEKS. UsernameSetupModal is full-screen, z-index 500, and
 * has no dismiss, no skip and no ESC — App.jsx unmounts it only on a
 * successful save, and biq_needs_username survives a reload. It pre-filled the
 * provider's real name from the OAuth identity, deliberately KEEPING the space
 * (`.replace(/\s+/g, " ")`), and then refused it: "Usernames can't contain
 * spaces". Every Apple/Google sign-up met a mandatory wall that called its own
 * suggestion invalid.
 *
 * It survived report #2, a two-device playtest, and the experience audit —
 * that last one structurally, because the audit seeds biq_onboarded and so
 * never reaches any first-run surface.
 *
 * ⚠️ WHICH SIDE WAS WRONG WAS SETTLED BY DATA, not taste. useAuth's silent
 * deriveUsernameFromIdentity writes spaces straight into profiles.username and
 * its collision suffix adds another (`${cleaned} ${suffix + 1}`). Measured in
 * prod on 2026-08-23: 17 of 215 profiles already carried a username with a
 * space, live on leaderboards and in friend search. The modal was the only
 * component that disagreed with the rest of the system.
 *
 * These are source-level assertions: the component imports supabase, so
 * mounting it would need the whole client stubbed, and the invariant worth
 * pinning is the RULE, which is what drifted.
 */
// ⚠️ Strip comments before scanning. The first run of this file failed on the
// FIXED code, because the header comment in UsernameSetupModal quotes the old
// error string to explain why it was removed. That is the second time in one
// day a guard flagged the documentation of a fix as the defect — and the more
// dangerous direction, since the obvious "fix" is to delete the explanation.
// Only what a user can actually hit counts.
const stripComments = (s) => s
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const modalSrc = stripComments(read('src/components/UsernameSetupModal.jsx'));
const authSrc = stripComments(read('src/useAuth.jsx'));

describe('the username step accepts what it offers', () => {
  it('does not reject spaces', () => {
    // The exact guard that shipped the bug.
    expect(modalSrc, 'the space rejection is back — see this file\'s header')
      .not.toMatch(/Usernames can't contain spaces/);
    // And the test that drove it.
    const body = modalSrc.slice(modalSrc.indexOf('handleContinue'));
    expect(body, 'handleContinue rejects whitespace again')
      .not.toMatch(/if\s*\(\s*\/\\s\/\.test\(v\)\s*\)/);
  });

  it('normalises the draft the same way the silent auto-derive does', () => {
    // Both must land on `.trim().replace(/\s+/g, ' ')`, or the same person
    // gets a different username depending on which path ran — and the modal
    // starts disagreeing with the 17 profiles already stored with spaces.
    const NORMALISE = /\.trim\(\)\.replace\(\/\\s\+\/g,\s*["'] ["']\)/;
    expect(modalSrc, 'modal no longer normalises like deriveUsernameFromIdentity')
      .toMatch(NORMALISE);
    expect(authSrc, 'deriveUsernameFromIdentity changed its normalisation')
      .toMatch(NORMALISE);
  });

  it('the prefill passes every validation rule the step applies', () => {
    // Reimplementing both halves keeps this readable, and the assertions above
    // pin the source to these shapes.
    const prefill = (raw) => (raw || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    const accepts = (v) => {
      const t = (v || '').trim().replace(/\s+/g, ' ');
      return t.length >= 3 && t.length <= 24;
    };
    const REAL_NAMES = [
      'Alexander Brynolsen',   // the reporter's own Apple identity shape
      'Mary-Jane Watson',
      "Seán O'Brien",
      'Jean  Pierre',          // double space from the provider
      '  Padded Name  ',
      'Ada',                   // exactly the minimum
      'Erling Braut Haaland',
    ];
    const rejected = REAL_NAMES.filter((n) => !accepts(prefill(n)));
    expect(rejected, `\n  prefilled but rejected: ${rejected.join(', ')}\n`).toEqual([]);
  });

  it('still refuses what it should', () => {
    const accepts = (v) => {
      const t = (v || '').trim().replace(/\s+/g, ' ');
      return t.length >= 3 && t.length <= 24;
    };
    expect(accepts('  '), 'whitespace-only should be refused').toBe(false);
    expect(accepts('ab'), 'under 3 chars should be refused').toBe(false);
    expect(accepts(''), 'empty should be refused').toBe(false);
  });

  it('the mandatory step is instrumented', () => {
    // It hid for eight weeks because it was the only mandatory first-run
    // screen emitting nothing. Shown, saved and every rejection reason.
    for (const ev of ['username-step-shown', 'username-step-saved', 'username-step-rejected']) {
      expect(modalSrc, `missing ${ev}`).toMatch(ev);
    }
    // The impression must fire from an effect, never the render body —
    // StrictMode double-invokes render and would double-count it.
    expect(modalSrc).toMatch(/useEffect\(\(\) => \{\s*track\("username-step-shown"/);
  });
});
