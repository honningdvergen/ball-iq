import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Footle's promise to the player must be the same sentence everywhere.
 *
 * ⚠️ THE SECOND-IMPLEMENTATION TRAP, caught by scouting report #4.
 *
 * Players kept flagging Footle answers as unfair. The triage found the prompt
 * was the problem, not the pool: the answer list holds 33 mononyms — WILLIAN,
 * PELÉ, XAVI — and the card promised a "surname", so losing on one read as the
 * game cheating. d60bdee rewrote it to "the name a footballer goes by" in
 * App.jsx, DailyScreen.jsx and HomeScreen.jsx…
 *
 * …and missed `src/components/FootleHero.jsx`, which is the MOBILE hero — the
 * single line most Ball IQ users read first. HomeScreen.jsx renders the fixed
 * DesktopFootleHero only at >=1024px and <FootleHero/> below it. So for a day
 * the app said one thing on desktop and the contradicted thing on every phone,
 * and the reports would have kept coming from exactly the players who never saw
 * the fix. Confirmed on a booted simulator: the card read "Surname of a
 * footballer / 6 guesses" on an iPhone 17 viewport.
 *
 * So this guard is written against the CLASS, not that one file: no user-facing
 * string anywhere in src/ may call the answer a surname. A fix applied by
 * grepping is only as good as the grep.
 *
 * ⚠️ Comments are stripped before scanning. Three real comments in src/ quote
 * the old wording while explaining this very history (wordle.js, App.jsx,
 * DailyScreen.jsx) — a naive grep flags all three and gets deleted for crying
 * wolf. Blame the renderer, not the historian.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

/** Strip // line comments, block comments, and {/* JSX comments *␦/}. */
function stripComments(code) {
  let out = '';
  let inBlock = false;
  let inLine = false;
  let quote = null;
  for (let i = 0; i < code.length; i += 1) {
    const c = code[i];
    const nx = code[i + 1];
    if (inLine) { if (c === '\n') { inLine = false; out += c; } continue; }
    if (inBlock) { if (c === '*' && nx === '/') { inBlock = false; i += 1; } continue; }
    if (quote) {
      out += c;
      if (c === '\\') { out += code[i + 1] ?? ''; i += 1; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; continue; }
    if (c === '/' && nx === '/') { inLine = true; i += 1; continue; }
    if (c === '/' && nx === '*') { inBlock = true; i += 1; continue; }
    out += c;
  }
  return out;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(jsx?|tsx?)$/.test(name)) acc.push(p);
  }
  return acc;
}

const FILES = walk(SRC).map((path) => ({
  path: path.slice(SRC.length + 1),
  code: stripComments(readFileSync(path, 'utf8')),
}));

describe('Footle never promises a surname', () => {
  it('finds source to scan', () => {
    expect(FILES.length).toBeGreaterThan(20);
  });

  it('no rendered string calls the answer a surname', () => {
    // Mutation check: restoring "Surname of a footballer" to FootleHero.jsx:123
    // fails this. Verified by seeding it back.
    const offenders = [];
    for (const f of FILES) {
      for (const [n, line] of f.code.split('\n').entries()) {
        if (/urname of a footballer|urname of the footballer/.test(line)) {
          offenders.push(`${f.path}:${n + 1}  ${line.trim().slice(0, 70)}`);
        }
      }
    }
    expect(
      offenders,
      '\n  Footle\'s answer pool holds 33 mononyms (WILLIAN, PELÉ, XAVI…).\n' +
      '  Calling the answer a "surname" is why losing on one felt unfair.\n' +
      '  Use "the name a footballer goes by".\n  ' + offenders.join('\n  ') + '\n',
    ).toEqual([]);
  });

  it('the agreed wording is actually rendered, in more than one place', () => {
    // ⚠️ The counterweight. Without this, deleting every description of Footle
    // would make the test above pass — a green built out of absence. The bug was
    // a MISSING fix, so the guard has to assert presence too.
    const hits = FILES.filter((f) => /name a footballer goes by/i.test(f.code))
      .map((f) => f.path);
    expect(
      hits.length,
      `expected the agreed wording in several render sites, found: ${hits.join(', ') || 'none'}`,
    ).toBeGreaterThanOrEqual(3);
    // The mobile hero is the one that was missed, and the one most users see.
    expect(
      hits.some((p) => p.includes('FootleHero')),
      'components/FootleHero.jsx is the MOBILE hero — the site d60bdee missed.',
    ).toBe(true);
  });
});
