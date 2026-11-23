// 22 Nov 2026: Top 10 and Mystery Player crashed on older phones.
//
// Three calls to Object.hasOwn (a 2022 addition to JavaScript) sat in
// screens/Top10.jsx, lib/mysteryPlayer.js and lib/mysteryCareer.js. Safari got
// it in iOS 15.4 and Android's WebView in version 93; on anything older the
// call throws "Object.hasOwn is not a function" the moment the game opens.
// Sentry had it from four players between 12 and 20 Nov (BALL-IQ-33, -38), and
// a player wrote in about crashes on 22 Nov.
//
// Vite's build target (es2020) rewrites new SYNTAX for old engines. It does not
// add missing built-in FUNCTIONS, and nothing else in the build does either.
// So the source itself must not call one. This scans for the ones that have
// arrived since 2020 and are easy to reach for.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const files = [];
const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(js|jsx|mjs)$/.test(f)) files.push(p); } };
walk(join(ROOT, 'src')); walk(join(ROOT, 'api')); files.push(join(ROOT, 'public', 'sw.js'));
// index.html carries inline scripts that run before the bundle does, on the same phones.
files.push(join(ROOT, 'index.html'));

// name → what to write instead
const TOO_NEW = [
  [/\bObject\.hasOwn\s*\(/, 'Object.prototype.hasOwnProperty.call(obj, key)'],
  [/\bObject\.groupBy\s*\(|\bMap\.groupBy\s*\(/, 'a plain loop'],
  [/\bstructuredClone\s*\(/, 'JSON.parse(JSON.stringify(x)) for plain data'],
  [/\.findLast(Index)?\s*\(/, 'a reverse loop'],
  [/\.(toSorted|toReversed|toSpliced)\s*\(/, 'a copy, then sort/reverse/splice'],
  [/\.replaceAll\s*\(/, '.replace(/…/g, …) or split/join'],
  // Any index, not only a negative one (widened 23 Nov 2026): .at() is iOS 15.4+ / WebView 92+.
  [/(?<![\w$])(\w+|\]|\))\.at\s*\(/, 'arr[i] or arr[arr.length - 1]'],
  // The worst of them: a lookbehind in a regex LITERAL fails when the file is
  // PARSED, so the whole chunk never runs (iOS below 16.4). Build one with
  // new RegExp('…') inside a try if it is ever needed.
  [new RegExp('\\(\\?<[=!]'), 'a capture group, or new RegExp(...) in a try'],
  [/\.with\s*\(\s*-?\d/, 'a copy, then assign by index'],
  [/\.(union|intersection|difference|symmetricDifference|isSubsetOf|isSupersetOf|isDisjointFrom)\s*\(/, 'a loop over the Set'],
  [/\bPromise\.any\s*\(/, 'Promise.race, or allSettled and pick'],
  [/\bIntl\.Segmenter\b/, '[...str] for code points'],
  [/\.(isWellFormed|toWellFormed)\s*\(/, 'leave the string as it is'],
  [/\bIterator\.from\s*\(|\bSymbol\.(dispose|asyncDispose)\b/, 'an array and a finally'],
  [/\bArray\.fromAsync\s*\(|\bPromise\.withResolvers\s*\(|\bAbortSignal\.(timeout|any)\s*\(/, 'the long form'],
];

describe('nothing the oldest phones we serve cannot run', () => {
  it('scans a real tree', () => { expect(files.length).toBeGreaterThan(150); });
  it('no built-in newer than the build target in the app, the islands, the API or the service worker', () => {
    const found = [];
    for (const f of files) {
      // The serverless API runs on Node, not on phones.
      if (f.includes(`${join(ROOT, 'api')}`)) continue;
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const [re, instead] of TOO_NEW) if (re.test(line)) found.push(`${f.slice(ROOT.length + 1)}:${i + 1} ${line.trim().slice(0, 80)}  → use ${instead}`);
      });
    }
    expect(found).toEqual([]);
  });
});
