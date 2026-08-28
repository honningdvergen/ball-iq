import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The app must not deny a value it hands out.
 *
 * ⚠️ THIS IS THE FIVE-STAR BLOCKER'S SECOND HALF, found in a pre-upload scan on
 * 2026-08-24 — after the first half had been fixed and declared done.
 *
 * The blocker: Apple/Google sign-in pre-fills the provider's real name into a
 * MANDATORY, non-dismissible username step, which then rejected it for
 * containing a space. The app offered you a value and called it invalid. 84% of
 * accounts are social sign-ins. That was fixed in UsernameSetupModal.
 *
 * The half that survived: friend search, on zero results, advised "Tip:
 * usernames don't contain spaces". Measured in prod the same day — `profiles`
 * has NO check constraint on username, and 27 of 218 named accounts (12.4%)
 * carry exactly what the tip called impossible: 17 a space, 10 a special
 * character. `deriveUsernameFromIdentity` writes them on purpose, and its
 * collision suffix adds another space.
 *
 * Search was never broken (`ilike '%q%'` matches a spaced name). The damage was
 * the advice: it appeared only on zero results — precisely when someone was
 * already failing to find a friend — and pointed them at the one spelling
 * guaranteed not to match. On the loop whose k-factor is 0.23.
 *
 * The rule this pins is not "spaces are allowed". It is: ONE answer to
 * "what is a legal username", everywhere.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url));
function allSource(dir = SRC) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue; // skip src/.claude worktrees
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...allSource(p));
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
const FILES = allSource();
const rel = (p) => p.slice(SRC.length - 3);

describe('every surface agrees on what a username may contain', () => {
  it('the sweep can see the tree', () => {
    expect(FILES.length).toBeGreaterThan(20);
    expect(FILES.some((f) => f.endsWith('components/UsernameSetupModal.jsx'))).toBe(true);
    expect(FILES.some((f) => f.endsWith('screens/ProfileScreen.jsx'))).toBe(true);
  });

  it('no user-facing copy claims usernames cannot contain spaces', () => {
    // ⚠️ The exact string that shipped, plus the obvious rewordings. A claim
    // like this is only wrong because of what the CODE does — so it reads as
    // helpful right up until someone follows it.
    const LIE = /usernames?[^.\n]{0,40}(don't|do not|can't|cannot|may not)[^.\n]{0,20}(contain|have|include)[^.\n]{0,20}spaces?/i;
    const offenders = [];
    for (const f of FILES) {
      const text = readFileSync(f, 'utf8');
      for (const line of text.split('\n')) {
        // Skip the comment that documents the removal.
        if (/^\s*(\/\/|\*|\{\/\*)/.test(line)) continue;
        if (LIE.test(line)) offenders.push(`${rel(f)}: ${line.trim().slice(0, 100)}`);
      }
    }
    expect(
      offenders,
      '\n  Usernames CAN contain spaces — 17 accounts in prod do, and the app\n' +
      '  derives them that way from Apple/Google sign-in. Saying otherwise is\n' +
      '  the five-star sign-up blocker in a different place.\n',
    ).toEqual([]);
  });

  it('the sign-up step still accepts a space, and says why', () => {
    const modal = readFileSync(`${SRC}/components/UsernameSetupModal.jsx`, 'utf8');
    // It must collapse runs (matching the silent auto-derive) and must NOT
    // reject on whitespace.
    expect(modal).toMatch(/draft\.trim\(\)\.replace\(\/\\s\+\/g, " "\)/);
    expect(
      modal.split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n'),
      'the mandatory step must not reject its own pre-filled suggestion',
    ).not.toMatch(/can'?t contain spaces|no spaces allowed/i);
  });

  it('the auto-derive and the manual step agree', () => {
    // Both normalise the same way, or a social sign-up gets a different name
    // depending on which path ran — and the collision suffix adds a space too.
    const auth = readFileSync(`${SRC}/useAuth.jsx`, 'utf8');
    const modal = readFileSync(`${SRC}/components/UsernameSetupModal.jsx`, 'utf8');
    const NORMALISE = /\.trim\(\)\.replace\(\/\\s\+\/g, ['"] ['"]\)/;
    expect(auth, 'useAuth must collapse whitespace runs, not strip them').toMatch(NORMALISE);
    expect(modal, 'the modal must normalise identically').toMatch(NORMALISE);
  });
});
