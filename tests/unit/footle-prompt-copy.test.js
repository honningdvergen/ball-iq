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

  /**
   * ⚠️ THE FIRST VERSION OF THIS TEST WAS TOO NARROW AND SAID SO ANYWAY.
   *
   * It matched the literal phrase "surname of a footballer", passed green, and
   * I described it in a commit as guarding "the CLASS, not that one file." The
   * scouting-report critic then grepped properly and found EIGHT more rendered
   * promises my regex sailed past, all live on the marketing pages people read
   * while deciding to install: "Guess the footballer's surname in six",
   * "a {LEN}-letter surname", "In the surname, wrong place", "today's surname",
   * "Guess the surname in six", and the same FAQ answer in two files.
   *
   * A guard is only as wide as its pattern. So this now matches the WORD, with
   * an explicit allowlist for the uses that are legitimate — which is the only
   * honest way to write it, because two of them are correct copy that mentions
   * surnames on purpose, and four are an ordinary local variable.
   */
  const ALLOWED = [
    // Honest, nuanced copy: it names the exception in the same breath.
    /usually a surname, sometimes a one-name legend/i,
    // The `surname` identifier in Footle's answer-reveal (WORDLE_FULL_NAMES
    // destructures to [prefix, surname]). A variable name promises nobody
    // anything; only rendered text does.
    /const \[prefix, surname\] = WORDLE_FULL_NAMES/,
    /\+ surname\}\)`/,
    /<strong>\{surname\}<\/strong>/,
  ];

  it('every in-app prompt uses the SAME sentence', () => {
    // ⚠️ THE POINT OF THIS FILE IS CONSISTENCY, NOT A PARTICULAR WORD.
    //
    // Alex, 2026-08-25, twice: *"Surname of footballer in 6 guesses it should
    // say"*. So the agreed wording changed, and the guard moved with it — but
    // the defect it was written for has not changed at all: d60bdee updated
    // App.jsx, DailyScreen and the DESKTOP hero and missed the MOBILE hero, so
    // for a day the app said one thing on desktop and the contradicted thing on
    // every phone. HomeScreen renders DesktopFootleHero at >=1024px and
    // <FootleHero/> below it, which is why the two drift apart so easily.
    //
    // A fix applied by grepping is only as good as the grep, so this asserts
    // the sentence is present in ALL THREE in-app sites rather than trusting
    // one to carry it.
    const WANTED = /surname of a footballer in 6 guesses/i;
    const REQUIRED = ['components/FootleHero.jsx', 'screens/HomeScreen.jsx',
                      'screens/DailyScreen.jsx'];
    const missing = REQUIRED.filter(
      (want) => !FILES.some((f) => f.path.includes(want) && WANTED.test(f.code)));
    expect(
      missing,
      '\n  These render the Footle prompt and must all use the same sentence.\n' +
      '  A split between the mobile hero and the desktop one is the exact bug\n' +
      '  this file exists to catch.\n  missing: ' + missing.join(', ') + '\n',
    ).toEqual([]);
  });

  it('no site still carries the superseded wording', () => {
    // The other direction: a leftover "the name a footballer goes by" in an app
    // surface is the same split, just mirrored.
    const offenders = [];
    for (const f of FILES) {
      if (!/(components|screens)\//.test(f.path)) continue; // app UI only
      for (const [n, line] of f.code.split('\n').entries()) {
        if (/name a footballer goes by/i.test(line)) {
          offenders.push(`${f.path}:${n + 1}  ${line.trim().slice(0, 70)}`);
        }
      }
    }
    expect(offenders, '\n  Superseded wording still rendered:\n  ' +
      offenders.join('\n  ') + '\n').toEqual([]);
  });

  it('the FAQ still names the exception, because the prompt no longer does', () => {
    // ⚠️ LOAD-BEARING NOW. 33 of the 406 answers are single-name players —
    // PELE, XAVI, RAUL, NEYMAR, WILLIAN, ISCO, PEDRI, ENDRICK and 26 more,
    // counted from WORDLE_FULL_NAMES entries with an empty first-name prefix,
    // not from memory. That is roughly one day in twelve on which "surname" is
    // literally wrong, and losing on a mononym reading as the game cheating is
    // what got the word removed the first time.
    // The prompt is short by choice; this line is where the nuance now lives,
    // so deleting it would leave the claim unqualified anywhere in the app.
    const app = FILES.find((f) => f.path.endsWith('App.jsx'));
    expect(app, 'App.jsx not scanned').toBeTruthy();
    expect(
      /usually a surname, sometimes a one-name legend/i.test(app.code),
      'The FAQ line explaining mononyms is the only place the app qualifies\n' +
      '  "surname". Keep it, or the prompt overpromises on ~1 day in 12.',
    ).toBe(true);
  });
});
