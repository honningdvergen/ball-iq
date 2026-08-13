// The lineup builder's script is the only real logic in this repo that nothing
// reads. It lives inline in public/lineup/index.html, so eslint skips it, vite
// never parses it, and no test renders it.
//
// ⚠️ THIS EXISTS BECAUSE IT SHIPPED A REFERENCE ERROR THROUGH A GREEN BUILD.
// On 2026-08-13 a body-centring fix landed BOTH call sites of a new helper and
// not the helper itself. `npm run build` passed completely clean. Every player
// on the pitch would have thrown ReferenceError at paint time, and the only
// signal available would have been Alex opening the page and finding it broken
// — which is how the two previous defects in this file were found as well.
//
// ⚠️ STATIC ONLY, ON PURPOSE. The obvious implementation evaluates the script
// with new Function() and calls the helpers; a security hook blocks that, and
// the hook is right — a test that evals a source file is a test that will
// happily execute whatever that file becomes. Syntax is checked by handing the
// script to `node --check` in a subprocess instead, and behaviour is left to
// the one place it can be checked honestly: the numbers were tuned against all
// 4,340 cutouts before shipping, not asserted here against a made-up one.
//
// What this DOES guarantee is the failure mode that actually occurred: a
// function called but never defined, and a syntax error. Both are invisible to
// every other gate in the build.
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve, join } from 'path';
import { tmpdir } from 'os';

const HTML = readFileSync(resolve(process.cwd(), 'public/lineup/index.html'), 'utf8');
const SCRIPT = (HTML.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/) || [])[1] || '';

// ⚠️ ANALYSE CODE, NOT PROSE. The first version scanned the raw script and
// reported "Arsenal", "null" and "harder" as undefined functions — every one of
// them a word inside a string or a comment that happened to be followed by a
// bracket. A checker with false positives gets muted, and a muted checker is
// worse than none, so strings, template literals and comments come out before
// anything is counted. Replaced with spaces to keep offsets sane.
const CODE = SCRIPT
  .replace(/\/\*[\s\S]*?\*\//g, ' ')      // block comments
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')    // line comments (not http://)
  .replace(/'(?:\\.|[^'\\])*'/g, "''")      // single-quoted
  .replace(/"(?:\\.|[^"\\])*"/g, '""')      // double-quoted
  .replace(/`(?:\\.|[^`\\])*`/g, '``');     // template literals

// Everything the browser provides, plus the constructors the page legitimately
// reaches for. Deliberately explicit: a typo'd global should FAIL this test
// rather than be waved through by a broad pattern.
const GLOBALS = new Set([
  'document', 'window', 'navigator', 'location', 'fetch', 'Image', 'Blob', 'URL',
  'FormData', 'Promise', 'Math', 'JSON', 'Number', 'String', 'Array', 'Object',
  'Boolean', 'Date', 'Error', 'Set', 'Map', 'WeakMap', 'RegExp', 'parseInt',
  'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'console',
  'requestAnimationFrame', 'cancelAnimationFrame', 'alert', 'atob', 'btoa',
  'getComputedStyle', 'CustomEvent', 'Event', 'DOMParser', 'AbortController',
  'localStorage', 'sessionStorage', 'history', 'matchMedia', 'structuredClone',
  // Keywords that the call-site regex cannot distinguish from a function name.
  'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'function',
  'new', 'do', 'else', 'try', 'await', 'yield', 'void', 'delete', 'in', 'of',
]);

function declaredNames(src) {
  const names = new Set();
  const add = (re) => { for (const m of src.matchAll(re)) names.add(m[1]); };
  add(/\bfunction\s+([A-Za-z_$][\w$]*)/g);
  add(/\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)/g);
  add(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g);
  // Parameters of every function form, arrows included.
  for (const m of src.matchAll(/(?:function\s*[A-Za-z_$\w$]*\s*|\(\s*)([^()]*?)\)\s*(?:\{|=>)/g)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().replace(/=.*$/, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(n)) names.add(n);
    }
  }
  return names;
}

function calledNames(src) {
  const calls = new Set();
  // `name(` but never `.name(` — a method call belongs to its object, which
  // this check cannot resolve and should not pretend to.
  for (const m of src.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) calls.add(m[2]);
  return calls;
}

// ⚠️ THE SAME BLIND SPOT EXISTS ON EVERY GENERATED GAME PAGE. Guess the XI, the
// Trail board and the Mystery board each ship an inline script that eslint and
// vite never see — the identical hole that let the lineup page break twice.
// They are checked here at SOURCE (the *_JS exports) rather than by parsing
// built HTML, so a failure names the module a human edits.
function strip(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

function undefinedCalls(src) {
  const code = strip(src);
  const declared = declaredNames(code);
  return [...calledNames(code)].filter((n) => !declared.has(n) && !GLOBALS.has(n));
}

function syntaxOk(src) {
  const dir = mkdtempSync(join(tmpdir(), 'inline-syntax-'));
  const file = join(dir, 'inline.js');
  writeFileSync(file, src);
  execFileSync(process.execPath, ['--check', file], { encoding: 'utf8' });
}

describe('lineup builder page', () => {
  it('has an inline script', () => {
    expect(SCRIPT.length).toBeGreaterThan(1000);
  });

  it('is syntactically valid JavaScript', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lineup-syntax-'));
    const file = join(dir, 'inline.js');
    writeFileSync(file, SCRIPT);
    // node --check parses without executing — no eval, no side effects.
    expect(() => execFileSync(process.execPath, ['--check', file], { encoding: 'utf8' })).not.toThrow();
  });

  it('calls no function it does not define', () => {
    const declared = declaredNames(CODE);
    const missing = [...calledNames(CODE)].filter((n) => !declared.has(n) && !GLOBALS.has(n));
    expect(missing, `undefined function(s) called: ${missing.join(', ')}`).toEqual([]);
  });

  it('keeps the framing constants both renderers share', () => {
    // The page and the canvas export must read the SAME numbers. Three separate
    // fixes on 2026-08-13 each had to be applied twice for this reason, and a
    // divergence produces a downloaded card that differs from the screen it was
    // composed on — invisible until somebody shares one.
    for (const k of ['FACE_SHARE', 'CROWN_PAD', 'BODY_PULL', 'BODY_SHIFT_MAX']) {
      expect(SCRIPT, `${k} missing`).toContain(`var ${k}`);
    }
  });

  it('defines withBodyPull once and uses it in both renderers', () => {
    // Exactly the shape of the bug this file was written for: 3 occurrences =
    // one definition plus one call in each renderer. 2 means a call site lost
    // its helper; 1 means a renderer lost its call.
    expect(SCRIPT.match(/withBodyPull\(/g)?.length).toBe(3);
    expect(SCRIPT).toMatch(/function withBodyPull\(/);
  });

  it('passes cutouts with no alpha box straight through', () => {
    // Older cutouts predate the alpha box, so both helpers must return the
    // face-centred value untouched rather than compute with undefined and place
    // the player off-screen. Asserted on the source because the guard clause IS
    // the contract.
    const fn = SCRIPT.match(/function withBodyPull\([\s\S]*?\n\}/)[0];
    expect(fn).toMatch(/if\s*\(cm\.l == null \|\| cm\.r == null\)\s*return faceLeft;/);
  });
});

describe('generated game pages', () => {
  // Each entry is a module a human edits and an inline script nobody lints.
  const CASES = [
    ['scripts/seo/xiGame.mjs', 'XI_JS'],
    ['scripts/seo/trailBoard.mjs', 'TRAIL_BOARD_JS'],
    ['scripts/seo/mysteryBoard.mjs', 'MYSTERY_BOARD_JS'],
  ];

  for (const [mod, exportName] of CASES) {
    it(`${exportName} is valid JavaScript`, async () => {
      const m = await import(resolve(process.cwd(), mod));
      expect(() => syntaxOk(m[exportName])).not.toThrow();
    });

    it(`${exportName} calls no function it does not define`, async () => {
      const m = await import(resolve(process.cwd(), mod));
      const missing = undefinedCalls(m[exportName]);
      expect(missing, `${exportName}: undefined function(s) called: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
